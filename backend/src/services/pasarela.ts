import { randomBytes } from 'node:crypto';

export interface ResultadoCobro {
  exitoso: boolean;
  referencia: string;
}

/**
 * Adaptador del proveedor de pago (research.md R2).
 *
 * El MVP no tiene pasarela contratada: este módulo SIMULA el cobro. Su
 * contrato es el mismo que cumpliría un proveedor real, de modo que
 * sustituirlo no cambia el flujo del pedido.
 *
 * No recibe, procesa ni almacena datos de tarjeta: solo produce la
 * referencia de la transacción (SC-S3-04, FR-012).
 *
 * @param simularRechazo Solo modo demo/pruebas: fuerza el rechazo para
 *   verificar que el pedido NO pasa a `Pagado` (US1.5).
 */
export async function cobrar(datos: {
  pedido: string;
  monto: number;
  simularRechazo?: boolean;
}): Promise<ResultadoCobro> {
  const referencia = `REF-${randomBytes(6).toString('hex').toUpperCase()}`;

  // Simula la respuesta de la pasarela externa (sin red real).
  if (datos.simularRechazo) {
    return { exitoso: false, referencia };
  }
  return { exitoso: true, referencia };
}
