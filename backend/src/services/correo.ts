import { env } from '../config/env.js';

export interface ResultadoEnvio {
  exitoso: boolean;
  detalle: string;
}

/**
 * Adaptador del proveedor de correo (research R2, FR-019).
 *
 * El MVP no tiene SMTP contratado: este módulo SIMULA el envío. Su contrato
 * es el mismo que cumpliría un proveedor real (p. ej. SMTP o un servicio de
 * correo transaccional), de modo que sustituirlo no cambia el módulo de
 * notificaciones.
 *
 * El correo solo identifica al destinatario y el asunto del aviso: no
 * incluye datos de pago ni sensibles (reglas §15).
 *
 * @param simularFallo Solo modo demo/pruebas: fuerza el fallo para verificar
 *   que el pedido `Listo` sigue visible en "mis pedidos" y se reintenta
 *   (US2.3). La variable `SIMULAR_FALLO_CORREO=true` lo activa globalmente.
 */
export async function enviarCorreo(datos: {
  para: string;
  asunto: string;
  mensaje: string;
  simularFallo?: boolean;
}): Promise<ResultadoEnvio> {
  if (datos.simularFallo || env.SIMULAR_FALLO_CORREO) {
    return {
      exitoso: false,
      detalle: 'Fallo simulado del servicio de correo.',
    };
  }

  // Simula la entrega al proveedor (sin red real). En producción aquí iría
  // la llamada al proveedor configurado.
  console.log(`[correo] para=${datos.para} asunto="${datos.asunto}"`);
  return {
    exitoso: true,
    detalle: 'Correo aceptado por el servicio simulado.',
  };
}
