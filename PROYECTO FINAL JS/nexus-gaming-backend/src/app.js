import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { ApiError } from './errors.js';
import { autenticar } from './middleware/auth.js';
import { crearRutas } from './routes/index.js';

export function crearApp(repo, { corsOrigin = '*', ...opciones } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin, allowedHeaders: ['Content-Type', 'Authorization'], exposedHeaders: ['Content-Disposition'] }));
  app.use(express.json({ limit: '50kb' }));
  app.use(autenticar(repo, opciones.jwtSecret ?? config.jwtSecret));

  app.use('/api', crearRutas(repo, opciones));
  app.use('/api', (_req, _res, next) => next(new ApiError(404, 'Ruta no encontrada.')));

  // Manejador final: errores de negocio -> JSON limpio; errores inesperados -> 500 sin filtrar detalles.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'El cuerpo no es un JSON válido.' });
    if (err instanceof ApiError) return res.status(err.status).json({ error: err.message, detalles: err.detalles });
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });
  return app;
}
