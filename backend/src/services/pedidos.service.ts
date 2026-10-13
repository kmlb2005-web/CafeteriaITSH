import { randomBytes } from 'node:crypto';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { pool, query } from '../db/pool.js';
import { ApiError } from '../middleware/error.js';
import type { Pedido, PartidaPedido, Pago } from '../types/domain.js';
import { cobrar } from './pasarela.js';

/** FR-011: mínimo de anticipación para pedir (research R3). */
const ANTICIPACION_MS = 10 * 60 * 1000;

const pad = (n: number): string => String(n).padStart(2, '0');

function soloFecha(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `YYYY-MM-DDTHH:mm` (hora local) — formato de la API. */
function formatearLocal(d: Date): string {
  return `${soloFecha(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Folio `PED-YYMMDD-XXXXXXXX` (research R5); colisiones → reintento. */
function generarFolio(): string {
  const corta = `${String(new Date().getFullYear()).slice(2)}${pad(
    new Date().getMonth() + 1,
  )}${pad(new Date().getDate())}`;
  return `PED-${corta}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

interface FilaMenu extends RowDataPacket {
  menu_dia_id: number;
  fecha: Date;
  precio: number;
  disponible: number | boolean;
  nombre: string;
  activo: number | boolean;
}

interface FilaPedido extends RowDataPacket {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  total: number;
  fecha_recoleccion: Date | string | null;
  creado_en: Date | string;
}

interface FilaPartida extends RowDataPacket {
  id: number;
  menu_dia_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

/** Arma el pedido con sus partidas y estado como nombre (FR-014). */
async function consultarPedido(id: number): Promise<Pedido | null> {
  const filas = await query<FilaPedido>(
    `SELECT p.id, p.numero, p.tipo, e.nombre AS estado, p.total,
            p.fecha_recoleccion, p.creado_en
     FROM pedido p
     JOIN estado_pedido e ON e.id = p.estado_id
     WHERE p.id = ?`,
    [id],
  );
  const fila = filas[0];
  if (!fila) return null;

  const partidas = await query<FilaPartida>(
    `SELECT d.id, d.menu_dia_id, pl.nombre, d.cantidad, d.precio_unitario,
            d.subtotal
     FROM pedido_detalle d
     JOIN menu_dia m ON m.id = d.menu_dia_id
     JOIN platillo pl ON pl.id = m.platillo_id
     WHERE d.pedido_id = ?
     ORDER BY d.id`,
    [id],
  );

  return {
    id: fila.id,
    numero: fila.numero,
    tipo: fila.tipo === 'mostrador' ? 'mostrador' : 'anticipado',
    estado: fila.estado,
    total: Number(fila.total),
    fecha_recoleccion: fila.fecha_recoleccion
      ? formatearLocal(new Date(fila.fecha_recoleccion))
      : null,
    creado_en: new Date(fila.creado_en).toISOString(),
    partidas: partidas.map(
      (p): PartidaPedido => ({
        id: p.id,
        menu_dia_id: p.menu_dia_id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio_unitario: Number(p.precio_unitario),
        subtotal: Number(p.subtotal),
      }),
    ),
  };
}

/**
 * Crea un pedido anticipado (FR-010, FR-011, research R3/R4).
 * Valida menú, anticipación y fecha ANTES de tocar la BD; precios y total
 * los calcula el servidor; folio y partidas en una sola transacción.
 */
export async function crearPedidoAnticipado(datos: {
  usuarioId: number;
  items: { menu_dia_id: number; cantidad: number }[];
  fechaRecoleccion: string;
}): Promise<Pedido> {
  const recogida = new Date(datos.fechaRecoleccion);
  if (Number.isNaN(recogida.getTime())) {
    throw new ApiError(400, 'fecha_invalida', 'La hora de recolección no es válida.');
  }

  // 1. Cargar los renglones del menú pedidos
  const ids = [...new Set(datos.items.map((i) => i.menu_dia_id))];
  const filas = await query<FilaMenu>(
    `SELECT m.id AS menu_dia_id, m.fecha, m.precio, m.disponible,
            p.nombre, p.activo
     FROM menu_dia m
     JOIN platillo p ON p.id = m.platillo_id
     WHERE m.id IN (${ids.map(() => '?').join(', ')})`,
    ids,
  );
  const porId = new Map(filas.map((f) => [f.menu_dia_id, f]));
  for (const item of datos.items) {
    const fila = porId.get(item.menu_dia_id);
    if (!fila || !fila.activo || !fila.disponible) {
      throw new ApiError(
        409,
        'no_disponible',
        'Uno de los platillos seleccionados ya no está disponible en el menú.',
      );
    }
  }

  // 2. Anticipación mínima de 10 minutos (re-validada aquí: SC-S3-01)
  if (recogida.getTime() < Date.now() + ANTICIPACION_MS) {
    throw new ApiError(
      400,
      'anticipacion_insuficiente',
      'El pedido debe realizarse con al menos 10 minutos de anticipación. Elige una hora de recolección más alejada.',
    );
  }

  // 3. La recolección es el mismo día del menú seleccionado
  const fechaRecogida = soloFecha(recogida);
  for (const item of datos.items) {
    const fila = porId.get(item.menu_dia_id);
    if (fila && soloFecha(new Date(fila.fecha)) !== fechaRecogida) {
      throw new ApiError(
        400,
        'fecha_invalida',
        'La recolección debe hacerse el mismo día del menú seleccionado.',
      );
    }
  }

  // 4. Total calculado en servidor (SC-S3-05)
  const total = Number(
    datos.items
      .reduce(
        (suma, i) => suma + Number(porId.get(i.menu_dia_id)?.precio ?? 0) * i.cantidad,
        0,
      )
      .toFixed(2),
  );

  // 5. Alta transaccional con reintento de folio ante colisión (R5)
  let intentos = 0;
  for (;;) {
    intentos += 1;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [ estados ] = await conn.execute(
        "SELECT id FROM estado_pedido WHERE nombre = 'Pendiente'",
      );
      const estadoId = (estados as RowDataPacket[])[0]?.id;
      if (!estadoId) {
        throw new ApiError(500, 'interno', 'No se pudo crear el pedido.');
      }

      const [alta] = await conn.execute(
        `INSERT INTO pedido
           (numero, tipo, estado_id, usuario_id, fecha_recoleccion, total, creado_por)
         VALUES (?, 'anticipado', ?, ?, ?, ?, ?)`,
        [
          generarFolio(),
          estadoId,
          datos.usuarioId,
          datos.fechaRecoleccion.replace('T', ' '),
          total,
          datos.usuarioId,
        ],
      );
      const pedidoId = (alta as { insertId: number }).insertId;

      for (const item of datos.items) {
        const fila = porId.get(item.menu_dia_id);
        const subtotal = Number(
          (Number(fila?.precio ?? 0) * item.cantidad).toFixed(2),
        );
        await conn.execute(
          `INSERT INTO pedido_detalle
             (pedido_id, menu_dia_id, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [pedidoId, item.menu_dia_id, item.cantidad, fila?.precio ?? 0, subtotal],
        );
      }

      await conn.commit();
      const pedido = await consultarPedido(pedidoId);
      if (!pedido) {
        throw new ApiError(500, 'interno', 'No se pudo crear el pedido.');
      }
      return pedido;
    } catch (err) {
      await conn.rollback();
      const codigo = (err as { code?: string }).code;
      if (codigo === 'ER_DUP_ENTRY' && intentos < 3) continue; // otro folio
      throw err;
    } finally {
      conn.release();
    }
  }
}

/**
 * Confirma el pago del pedido (FR-012, FR-013, research R2/R7).
 * Transaccional con `FOR UPDATE`: dos peticiones simultáneas no cobran dos
 * veces. Solo la pasarela confirmada transiciona `Pendiente → Pagado`.
 */
export async function registrarPago(datos: {
  pedidoId: number;
  usuarioId: number;
  simularRechazo?: boolean;
}): Promise<{ pedido: Pedido; pago: Pago }> {
  const conn: PoolConnection = await pool.getConnection();
  let transaccionCerrada = false;
  try {
    await conn.beginTransaction();

    const [filas] = await conn.execute(
      `SELECT p.id, p.numero, p.usuario_id, p.total, p.estado_id,
              e.nombre AS estado
       FROM pedido p
       JOIN estado_pedido e ON e.id = p.estado_id
       WHERE p.id = ?
       FOR UPDATE`,
      [datos.pedidoId],
    );
    const fila = (filas as RowDataPacket[])[0] as
      | {
          id: number;
          numero: string;
          usuario_id: number | null;
          total: number;
          estado_id: number;
          estado: string;
        }
      | undefined;

    if (!fila || fila.usuario_id !== datos.usuarioId) {
      await conn.rollback();
      transaccionCerrada = true;
      throw new ApiError(404, 'no_encontrado', 'Pedido no encontrado.');
    }
    if (fila.estado === 'Pagado') {
      await conn.rollback();
      transaccionCerrada = true;
      throw new ApiError(409, 'ya_pagado', 'Este pedido ya fue pagado.');
    }

    const monto = Number(fila.total);
    const resultado = await cobrar({
      pedido: fila.numero,
      monto,
      simularRechazo: datos.simularRechazo,
    });

    if (!resultado.exitoso) {
      // La pasarela no confirmó: queda la intención rechazada y el pedido
      // sigue Pendiente (SC-S3-03). Se conserva el intento para auditoría.
      await conn.execute(
        `INSERT INTO pago (pedido_id, metodo, monto, referencia, registrado_por, estado)
         VALUES (?, 'online', ?, ?, ?, 'rechazado')
         ON DUPLICATE KEY UPDATE
           metodo = 'online', monto = VALUES(monto),
           referencia = VALUES(referencia),
           registrado_por = VALUES(registrado_por),
           estado = 'rechazado', fecha = CURRENT_TIMESTAMP`,
        [fila.id, monto, resultado.referencia, datos.usuarioId],
      );
      await conn.commit();
      transaccionCerrada = true;
      throw new ApiError(
        402,
        'pago_rechazado',
        'El pago no pudo confirmarse. Tu pedido sigue pendiente: puedes reintentar.',
      );
    }

    // Pago confirmado: registro + transición Pendiente → Pagado (R7)
    await conn.execute(
      `INSERT INTO pago (pedido_id, metodo, monto, referencia, registrado_por, estado)
       VALUES (?, 'online', ?, ?, ?, 'confirmado')
       ON DUPLICATE KEY UPDATE
         metodo = 'online', monto = VALUES(monto),
         referencia = VALUES(referencia),
         registrado_por = VALUES(registrado_por),
         estado = 'confirmado', fecha = CURRENT_TIMESTAMP`,
      [fila.id, monto, resultado.referencia, datos.usuarioId],
    );

    const [hacia] = await conn.execute(
      "SELECT id FROM estado_pedido WHERE nombre = 'Pagado'",
    );
    const pagadoId = (hacia as RowDataPacket[])[0]?.id;
    if (!pagadoId) {
      throw new ApiError(500, 'interno', 'No se pudo confirmar el pedido.');
    }

    const [transiciones] = await conn.execute(
      'SELECT 1 AS ok FROM transicion_estado WHERE desde_id = ? AND hacia_id = ?',
      [fila.estado_id, pagadoId],
    );
    if ((transiciones as RowDataPacket[]).length === 0) {
      throw new ApiError(
        409,
        'transicion_invalida',
        'El pedido no admite ese cambio de estado.',
      );
    }

    await conn.execute('UPDATE pedido SET estado_id = ? WHERE id = ?', [
      pagadoId,
      fila.id,
    ]);
    await conn.execute(
      `INSERT INTO pedido_estado_historial
         (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
       VALUES (?, ?, ?, ?)`,
      [fila.id, fila.estado_id, pagadoId, datos.usuarioId],
    );
    await conn.commit();
    transaccionCerrada = true;

    const pedido = await consultarPedido(fila.id);
    if (!pedido) {
      throw new ApiError(404, 'no_encontrado', 'Pedido no encontrado.');
    }
    return {
      pedido,
      pago: {
        metodo: 'online',
        monto,
        referencia: resultado.referencia,
        estado: 'confirmado',
      },
    };
  } catch (err) {
    if (!transaccionCerrada) {
      try {
        await conn.rollback();
      } catch {
        // sin transacción activa: nada que deshacer
      }
    }
    throw err;
  } finally {
    conn.release();
  }
}

/** Detalle del pedido propio (FR-014, US2): ajeno → 404. */
export async function obtenerPedido(
  pedidoId: number,
  usuarioId: number,
): Promise<Pedido> {
  const dueno = await query<{ usuario_id: number | null }>(
    'SELECT usuario_id FROM pedido WHERE id = ? AND usuario_id = ?',
    [pedidoId, usuarioId],
  );
  if (dueno.length === 0) {
    throw new ApiError(404, 'no_encontrado', 'Pedido no encontrado.');
  }
  const pedido = await consultarPedido(pedidoId);
  if (!pedido) {
    throw new ApiError(404, 'no_encontrado', 'Pedido no encontrado.');
  }
  return pedido;
}
