import express from 'express';
import { errorHandler, notFound } from './middleware/error.js';
import { authRoutes } from './routes/auth.routes.js';
import { usuariosRoutes } from './routes/usuarios.routes.js';
import { adminMenuRoutes } from './routes/admin-menu.routes.js';
import { menuRoutes } from './routes/menu.routes.js';
import { pedidosRoutes } from './routes/pedidos.routes.js';

export function crearApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: '100kb' }));

  // Salud del servicio (usado por el quickstart y el despliegue)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', servicio: 'cafeteria-api' });
  });

  // Las rutas se montan por módulo (T019: auth, T025: usuarios, Sprint 2: menú)
  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/admin', adminMenuRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/pedidos', pedidosRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
