import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, api } from './api'
import type { Rol } from './roles'

export interface SesionUsuario {
  id: number
  nombre: string
  correo: string
  rol: Rol
}

interface AuthContextValue {
  usuario: SesionUsuario | null
  /** true mientras se resuelve GET /api/auth/me al cargar la app */
  cargando: boolean
  iniciarSesion: (correo: string, password: string) => Promise<SesionUsuario>
  cerrarSesion: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    api<SesionUsuario>('/api/auth/me')
      .then((u) => {
        if (vivo) setUsuario(u)
      })
      .catch((err: unknown) => {
        // 401 = sin sesión (esperado); cualquier error → sin sesión
        if (!(err instanceof ApiError) && vivo) {
          console.warn('No se pudo verificar la sesión', err)
        }
      })
      .finally(() => {
        if (vivo) setCargando(false)
      })
    return () => {
      vivo = false
    }
  }, [])

  const iniciarSesion = useCallback(
    async (correo: string, password: string): Promise<SesionUsuario> => {
      const u = await api<SesionUsuario>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo, password }),
      })
      setUsuario(u)
      return u
    },
    [],
  )

  const cerrarSesion = useCallback(async (): Promise<void> => {
    try {
      await api<void>('/api/auth/logout', { method: 'POST' })
    } finally {
      setUsuario(null)
    }
  }, [])

  const value = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion }),
    [usuario, cargando, iniciarSesion, cerrarSesion],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
