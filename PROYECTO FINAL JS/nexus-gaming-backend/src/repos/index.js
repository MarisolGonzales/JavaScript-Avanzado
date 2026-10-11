import { config } from '../config.js';
import { JsonRepo } from './json-repo.js';

export async function crearRepo(driver = config.driver) {
  if (driver === 'postgres') {
    const { PgRepo } = await import('./pg-repo.js'); // se carga solo si se usa (requiere el paquete pg)
    return new PgRepo(config.pg);
  }
  return new JsonRepo(config.jsonFile);
}
