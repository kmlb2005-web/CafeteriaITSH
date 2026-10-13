import express from 'express';
import { errorHandler, notFound } from './middleware/error.js';
import { authRoutes } from './routes/auth.routes.js';
import { usuariosRoutes } from './routes/usuarios.routes.js';

export function crearApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: '100kb' }));

  // Salud del servicio (usado por el quickstart y el despliegue)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', servicio: 'cafeteria-api' });
  });

  // Las rutas se montan por módulo (T019: auth, T025: usuarios)
  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', usuariosRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
