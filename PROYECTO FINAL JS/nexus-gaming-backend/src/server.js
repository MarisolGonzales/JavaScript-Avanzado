import { crearApp } from './app.js';
import { config } from './config.js';
import { crearRepo } from './repos/index.js';

if (config.jwtSecret.includes('desarrollo') && process.env.NODE_ENV === 'production') {
  console.error('Define JWT_SECRET con un valor largo y aleatorio antes de usar el servidor en producción.');
  process.exit(1);
}

const repo = await crearRepo();
await repo.init();

const app = crearApp(repo, { corsOrigin: config.corsOrigin });
const server = app.listen(config.port, () => {
  console.log(`NEXUS GAMING API  http://localhost:${config.port}/api  (driver: ${repo.nombre})`);
});

const cerrar = async () => { server.close(); await repo.close?.(); process.exit(0); };
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
