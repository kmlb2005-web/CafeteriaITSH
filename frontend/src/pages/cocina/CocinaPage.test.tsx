import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CocinaPage from './CocinaPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const PAGADO = {
  id: 40,
  numero: 'PED-261013-AAAA1111',
  tipo: 'anticipado',
  estado: 'Pagado',
  cliente_nombre: null,
  fecha_recoleccion: '2026-10-13T12:00',
  creado_en: '2026-10-13T09:00:00.000Z',
  orden: 1,
  partidas: [{ nombre: 'Gordita', cantidad: 2 }],
}

const EN_PREPARACION = {
  id: 41,
  numero: 'PED-261013-BBBB2222',
  tipo: 'mostrador',
  estado: 'En preparación',
  cliente_nombre: 'Ana López',
  fecha_recoleccion: null,
  creado_en: '2026-10-13T09:05:00.000Z',
  orden: 2,
  partidas: [{ nombre: 'Torta', cantidad: 1 }],
}

const LISTO = {
  id: 42,
  numero: 'PED-261013-CCCC3333',
  tipo: 'mostrador',
  estado: 'Listo',
  cliente_nombre: null,
  fecha_recoleccion: null,
  creado_en: '2026-10-13T09:10:00.000Z',
  orden: 3,
  partidas: [{ nombre: 'Concha', cantidad: 1 }],
}

function instalarFetchPedidos(config: {
  listas?: unknown[][]
  estado?: () => Response
  /** Nº de GET iniciales que responden con error (para error/conexión). */
  fallosGet?: number
}): FetchMock {
  let indice = 0
  let fallosDados = 0
  const fetchMock: FetchMock = vi.fn(
    async (url: string, init: RequestInit = {}) => {
      const method = init.method ?? 'GET'
      if (url === '/api/cocina/pedidos' && method === 'GET') {
        if (fallosDados < (config.fallosGet ?? 0)) {
          fallosDados += 1
          return json(
            { error: { code: 'interno', message: 'El servidor de cocina no responde.' } },
            500,
          )
        }
        const lista = config.listas?.[indice] ?? config.listas?.[0] ?? []
        if (config.listas) indice = Math.min(indice + 1, config.listas.length - 1)
        return json({ pedidos: lista })
      }
      if (/^\/api\/cocina\/pedidos\/\d+\/estado$/.test(url) && method === 'POST') {
        return config.estado
          ? config.estado()
          : json({ ...PAGADO, estado: 'En preparación' })
      }
      throw new Error(`Llamada inesperada: ${method} ${String(url)}`)
    },
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function huboPostEstado(fetchMock: FetchMock): boolean {
  return fetchMock.mock.calls.some(
    ([p, init]) =>
      /^\/api\/cocina\/pedidos\/\d+\/estado$/.test(String(p)) &&
      (init as RequestInit | undefined)?.method === 'POST',
  )
}

describe('CocinaPage (cocinero)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra ambos orígenes ordenados con posición, estados y CTA (FR-010)', async () => {
    instalarFetchPedidos({ listas: [[PAGADO, EN_PREPARACION, LISTO]] })
    render(<CocinaPage />)

    expect(await screen.findByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
    expect(screen.getByText('PED-261013-AAAA1111')).toBeInTheDocument()
    expect(screen.getByText(/Anticipado/)).toBeInTheDocument()
    expect(screen.getByText(/Ana López/)).toBeInTheDocument()
    expect(screen.getAllByText(/Mostrador/).length).toBeGreaterThan(0)

    // CTA por estado: Pagado → iniciar; En preparación → listo; Listo → espera
    expect(
      screen.getByRole('button', { name: 'Iniciar preparación' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Marcar listo' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Listo — en espera de caja'),
    ).toBeInTheDocument()

    // Recolección enfatizada y badge de estado
    expect(screen.getByText(/recoge 12:00/)).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
  })

  it('avanza un pedido con un toque y refresca el tablero (FR-018)', async () => {
    const fetchMock = instalarFetchPedidos({
      listas: [
        [PAGADO, EN_PREPARACION],
        [{ ...PAGADO, estado: 'En preparación' }, EN_PREPARACION],
      ],
    })
    render(<CocinaPage />)

    await userEvent.click(
      await screen.findByRole('button', { name: 'Iniciar preparación' }),
    )

    expect(huboPostEstado(fetchMock)).toBe(true)

    // Tras refrescar, el pedido avanzó y ahora ofrece "Marcar listo"
    const botones = await screen.findAllByRole('button', {
      name: 'Marcar listo',
    })
    expect(botones).toHaveLength(2)
  })

  it('muestra un mensaje claro cuando el servidor rechaza la transición (SC-S4-04)', async () => {
    instalarFetchPedidos({
      listas: [[PAGADO, EN_PREPARACION]],
      estado: () =>
        json(
          {
            error: {
              code: 'transicion_invalida',
              message: 'El pedido está en «Pagado»: no puede pasar directamente a «Listo».',
            },
          },
          409,
        ),
    })
    render(<CocinaPage />)

    await userEvent.click(
      await screen.findByRole('button', { name: 'Marcar listo' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /no puede pasar directamente/,
    )
  })

  it('marca "¡Retrasado!" cuando la recolección ya pasó (T019)', async () => {
    instalarFetchPedidos({ listas: [[PAGADO, EN_PREPARACION]] })
    render(<CocinaPage />)

    expect(await screen.findByText('¡Retrasado!')).toBeInTheDocument()
    // El pedido sin hora de recolección muestra el tiempo transcurrido
    expect(screen.getAllByText(/hace \d+/).length).toBeGreaterThan(0)
  })

  it('muestra el indicador de frescura "act. hace X s" del sondeo (FR-011)', async () => {
    instalarFetchPedidos({ listas: [[PAGADO]] })
    render(<CocinaPage />)

    expect(await screen.findByText('#1')).toBeInTheDocument()
    expect(screen.getByText(/act\. hace \d+ s/)).toBeInTheDocument()
    expect(screen.getByText('1 pedido')).toBeInTheDocument()
  })

  it('muestra el estado vacío "¡Todo está al día!" (FR-009)', async () => {
    instalarFetchPedidos({ listas: [[]] })
    render(<CocinaPage />)

    expect(await screen.findByText('¡Todo está al día!')).toBeInTheDocument()
    expect(
      screen.getByText(/No hay pedidos en cocina/),
    ).toBeInTheDocument()
  })

  it('ante 2 fallos seguidos avisa "Sin conexión" y se recupera (FR-012)', async () => {
    instalarFetchPedidos({ listas: [[PAGADO]], fallosGet: 2 })
    render(<CocinaPage />)

    expect(await screen.findByText('El servidor de cocina no responde.')).toBeInTheDocument()

    // 1.er reintento fallido → 2 fallos seguidos: indicador sin conexión
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(
      await screen.findByText('Sin conexión — reintentando…'),
    ).toBeInTheDocument()

    // 2.º reintento con éxito: el tablero vuelve y el indicador se recupera
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('#1')).toBeInTheDocument()
    expect(screen.getByText(/act\. hace \d+ s/)).toBeInTheDocument()
    expect(
      screen.queryByText('Sin conexión — reintentando…'),
    ).not.toBeInTheDocument()
  })
})
