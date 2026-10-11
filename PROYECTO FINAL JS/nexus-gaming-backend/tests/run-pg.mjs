// Ejecuta la misma suite contra PostgreSQL:  npm run test:pg
// (requiere haber ejecutado database/instalar.* y tener PG_* configurado)
import { spawnSync } from 'node:child_process';

const r = spawnSync(process.execPath, ['--test', 'tests/api.test.js'], {
  stdio: 'inherit',
  env: { ...process.env, DB_DRIVER: 'postgres' }
});
process.exit(r.status ?? 1);
