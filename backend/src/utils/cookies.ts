/** Lectura y escritura de cookies de sesión sin dependencias extra (research R1). */

export function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const parte of header.split(';')) {
    const idx = parte.indexOf('=');
    if (idx === -1) continue;
    const nombre = parte.slice(0, idx).trim();
    const valor = parte.slice(idx + 1).trim();
    if (nombre) out[nombre] = decodeURIComponent(valor);
  }
  return out;
}

interface OpcionesCookie {
  maxAgeSegundos?: number;
}

/** Cookie de sesión: httpOnly + SameSite=Lax (+ Secure en producción). */
export function cookieSesion(token: string, opciones: OpcionesCookie = {}): string {
  const partes = [
    `token=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${opciones.maxAgeSegundos ?? 0}`,
  ];
  if (process.env.NODE_ENV === 'production') partes.push('Secure');
  return partes.join('; ');
}
