import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Carga ".env" (KEY=VALOR) sin dependencias; lo que ya exista en el entorno tiene prioridad. */
function cargarEnv(ruta) {
  if (!existsSync(ruta)) return;
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(linea);
    if (!m || linea.trimStart().startsWith('#')) continue;
    const valor = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = valor;
  }
}
cargarEnv(fileURLToPath(new URL('../.env', import.meta.url)));

const env = process.env;

export const config = {
  port: Number(env.PORT ?? 3000),
  corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:4200',
  driver: (env.DB_DRIVER ?? 'json').toLowerCase(),
  // Clave con la que se firman las sesiones. En producción define JWT_SECRET con un valor largo y aleatorio.
  jwtSecret: env.JWT_SECRET ?? 'nexus-gaming-clave-de-desarrollo-cambiar',
  // Opcional: con ANTHROPIC_API_KEY el asistente de soporte usa un modelo de lenguaje (si falla, usa el motor local).
  anthropicKey: env.ANTHROPIC_API_KEY ?? '',
  anthropicModelo: env.ANTHROPIC_MODEL ?? 'claude-sonnet-5-5',
  jsonFile: env.JSON_FILE ?? fileURLToPath(new URL('../data/db.json', import.meta.url)),
  pg: {
    host: env.PG_HOST ?? 'localhost',
    port: Number(env.PG_PORT ?? 5432),
    user: env.PG_USER ?? 'admin_nova',
    password: env.PG_PASSWORD ?? 'cambiar_esta_clave',
    databases: {
      CENTRAL: env.PG_DB_CENTRAL ?? 'nexus_central',
      NORTE: env.PG_DB_NORTE ?? 'nexus_trujillo',
      SUR: env.PG_DB_SUR ?? 'nexus_arequipa',
      CENTRO: env.PG_DB_CENTRO ?? 'nexus_cusco'
    }
  }
};
