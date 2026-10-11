import { hashPassword } from '../domain/auth.js';

/** Catálogo inicial (idéntico a database/03_datos_iniciales.sql). */
export { JUEGOS_INICIALES } from './juegos-iniciales.js';

/**
 * Cuentas de demostración (se crean solo si no existe ningún usuario).
 * CAMBIA estas claves antes de publicar el proyecto en cualquier servidor.
 */
export const CUENTAS_DEMO = [
  { email: 'admin@nexusgaming.pe',   nombre: 'Administrador NEXUS', rol: 'admin',   departamento: 'Lima',     password: 'Admin2026!' },
  { email: 'soporte@nexusgaming.pe', nombre: 'Soporte NEXUS',       rol: 'soporte', departamento: 'Lima',     password: 'Soporte2026!' },
  { email: 'vanessa@utp.edu.pe',     nombre: 'Vanessa Tito',        rol: 'cliente', departamento: 'Lima',     password: 'Cliente2026!' }
];

export async function usuariosIniciales() {
  return Promise.all(CUENTAS_DEMO.map(async ({ password, ...u }) => ({ ...u, passwordHash: await hashPassword(password) })));
}
