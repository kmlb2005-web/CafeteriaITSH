/**
 * Cliente HTTP para la API. Usa `credentials: 'include'` para que la sesión
 * viva en la cookie httpOnly (research.md R1). Los errores se tipan para que
 * la UI muestre mensajes claros sin información interna (FR-022).
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ErrorPayload {
  error?: { code?: string; message?: string }
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init.headers },
      ...init,
    })
  } catch {
    throw new ApiError(
      0,
      'sin_conexion',
      'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.',
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    // respuesta sin JSON: se maneja abajo como genérica
  }

  if (!response.ok) {
    const payload = body as ErrorPayload | null
    throw new ApiError(
      response.status,
      payload?.error?.code ?? 'error',
      payload?.error?.message ??
        'Ocurrió un error. Inténtalo de nuevo.',
    )
  }

  return body as T
}
