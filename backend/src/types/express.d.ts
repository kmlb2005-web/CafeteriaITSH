import type { AuthUser } from './domain.js';

declare global {
  namespace Express {
    interface Request {
      /** Presente cuando requireAuth() se ejecutó correctamente. */
      user?: AuthUser;
    }
  }
}

export {};
