import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider } from '../../lib/auth';
import LoginPage from './LoginPage';

type FetchMock = ReturnType<typeof vi.fn>;

function renderLogin(): void {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<div>Panel administrador</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function mockFetch(handlers: Record<string, () => Response>): void {
  const fetchMock: FetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    for (const [clave, handler] of Object.entries(handlers)) {
      if (url.includes(clave)) return handler();
    }
    return new Response(JSON.stringify({ error: { code: 'not_found' } }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('LoginPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('muestra validación al enviar el formulario vacío (FR-021)', async () => {
    mockFetch({ me: () => json({}, 401) });
    renderLogin();

    await userEvent.click(
      screen.getByRole('button', { name: /iniciar sesión/i }),
    );

    expect(await screen.findByText(/correo es requerido/i)).toBeInTheDocument();
  });

  it('muestra el mensaje del servidor cuando el login falla (US1.2)', async () => {
    mockFetch({
      me: () => json({}, 401),
      login: () =>
        json(
          {
            error: {
              code: 'no_autorizado',
              message: 'Correo o contraseña incorrectos.',
            },
          },
          401,
        ),
    });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/correo/i), 'admin@itsh.mx');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'mala');
    await userEvent.click(
      screen.getByRole('button', { name: /iniciar sesión/i }),
    );

    expect(
      await screen.findByText('Correo o contraseña incorrectos.'),
    ).toBeInTheDocument();
  });

  it('redirige a la pantalla del rol tras iniciar sesión (US1.1)', async () => {
    mockFetch({
      me: () => json({}, 401),
      login: () =>
        json({
          id: 1,
          nombre: 'Admin',
          correo: 'admin@itsh.mx',
          rol: 'administrador',
          activo: true,
        }),
    });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/correo/i), 'admin@itsh.mx');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'buena123');
    await userEvent.click(
      screen.getByRole('button', { name: /iniciar sesión/i }),
    );

    await waitFor(() => {
      expect(screen.getByText('Panel administrador')).toBeInTheDocument();
    });
  });
});
