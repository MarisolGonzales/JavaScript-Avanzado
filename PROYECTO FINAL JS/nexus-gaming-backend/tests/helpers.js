import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crearApp } from '../src/app.js';
import { config } from '../src/config.js';
import { JsonRepo } from '../src/repos/json-repo.js';

export const DRIVER = (process.env.DB_DRIVER ?? 'json').toLowerCase();
export const ADMIN = { email: 'admin@nexusgaming.pe', password: 'Admin2026!' };
export const SOPORTE = { email: 'soporte@nexusgaming.pe', password: 'Soporte2026!' };

let contador = 0;
/** Correo único por prueba: así los tests no chocan entre sí (ni entre ejecuciones sobre PostgreSQL). */
export const correoNuevo = (prefijo = 'cliente') => `${prefijo}${Date.now().toString(36)}${++contador}@utp.edu.pe`;

/** Arranca la API en un puerto libre con el driver elegido (json por defecto). */
export async function iniciar(opciones = {}) {
  let repo;
  if (DRIVER === 'postgres') {
    const { PgRepo } = await import('../src/repos/pg-repo.js');
    repo = new PgRepo(config.pg);
  } else {
    const dir = await mkdtemp(join(tmpdir(), 'nexus-'));
    repo = new JsonRepo(join(dir, 'db.json'));
  }
  await repo.init();
  const app = crearApp(repo, opciones);
  const server = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api`;

  async function http(metodo, ruta, { cuerpo, token, crudo } = {}) {
    const res = await fetch(base + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
    });
    if (crudo) return { status: res.status, cabeceras: res.headers, buffer: Buffer.from(await res.arrayBuffer()) };
    const texto = await res.text();
    return { status: res.status, cuerpo: texto ? JSON.parse(texto) : null };
  }

  const api = {
    repo, http, base,
    get: (r, token) => http('GET', r, { token }),
    post: (r, cuerpo, token) => http('POST', r, { cuerpo, token }),
    put: (r, cuerpo, token) => http('PUT', r, { cuerpo, token }),
    patch: (r, cuerpo, token) => http('PATCH', r, { cuerpo, token }),
    del: (r, token) => http('DELETE', r, { token }),
    async cerrar() { server.close(); await repo.close?.(); },
    async login({ email, password }) {
      const r = await http('POST', '/auth/login', { cuerpo: { email, password } });
      if (r.status !== 200) throw new Error(`login falló (${r.status}): ${JSON.stringify(r.cuerpo)}`);
      return r.cuerpo.token;
    },
    /** Crea un cliente nuevo y devuelve { email, token }. */
    async cliente(departamento = 'Lima', prefijo = 'cliente') {
      const email = correoNuevo(prefijo);
      const r = await http('POST', '/auth/registro', { cuerpo: { nombre: 'Cliente de Prueba', email, password: 'Prueba2026', departamento } });
      if (r.status !== 201) throw new Error(`registro falló (${r.status}): ${JSON.stringify(r.cuerpo)}`);
      return { email, token: r.cuerpo.token };
    }
  };
  api.tokenAdmin = await api.login(ADMIN);
  api.tokenSoporte = await api.login(SOPORTE);
  return api;
}
