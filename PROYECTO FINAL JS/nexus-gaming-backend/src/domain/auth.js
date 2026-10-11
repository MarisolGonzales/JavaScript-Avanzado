/**
 * AUTENTICACIÓN con la librería estándar de Node (sin dependencias extra).
 *  - Contraseñas: scrypt con sal aleatoria (nunca se guarda la contraseña).
 *  - Sesión: token firmado HS256 (formato JWT) con vencimiento.
 */
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const b64 = (buf) => Buffer.from(buf).toString('base64url');

/** "scrypt$<sal>$<hash>" — la sal evita que dos usuarios con la misma clave tengan el mismo hash. */
export async function hashPassword(password) {
  const sal = randomBytes(16);
  const hash = await scryptAsync(password, sal, 64);
  return `scrypt$${sal.toString('hex')}$${hash.toString('hex')}`;
}

export async function verificarPassword(password, guardado) {
  const [alg, salHex, hashHex] = String(guardado ?? '').split('$');
  if (alg !== 'scrypt' || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = await scryptAsync(password, Buffer.from(salHex, 'hex'), esperado.length);
  return timingSafeEqual(calculado, esperado); // comparación en tiempo constante
}

export function firmarToken(payload, secreto, ttlSegundos = 8 * 3600, ahora = Date.now()) {
  const cuerpo = { ...payload, iat: Math.floor(ahora / 1000), exp: Math.floor(ahora / 1000) + ttlSegundos };
  const datos = `${b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64(JSON.stringify(cuerpo))}`;
  const firma = createHmac('sha256', secreto).update(datos).digest('base64url');
  return `${datos}.${firma}`;
}

/** Devuelve el contenido del token, o null si la firma es falsa, está mal formado o venció. */
export function verificarToken(token, secreto, ahora = Date.now()) {
  const partes = String(token ?? '').split('.');
  if (partes.length !== 3) return null;
  const esperada = createHmac('sha256', secreto).update(`${partes[0]}.${partes[1]}`).digest();
  let recibida;
  try { recibida = Buffer.from(partes[2], 'base64url'); } catch { return null; }
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  try {
    const cuerpo = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));
    return typeof cuerpo.exp === 'number' && cuerpo.exp * 1000 > ahora ? cuerpo : null;
  } catch { return null; }
}

/** Limitador simple en memoria: máximo `max` intentos por clave dentro de `ventanaMs`. */
export class LimitadorIntentos {
  #intentos = new Map();
  constructor(max, ventanaMs) { this.max = max; this.ventanaMs = ventanaMs; }
  bloqueado(clave, ahora = Date.now()) {
    const lista = (this.#intentos.get(clave) ?? []).filter((t) => ahora - t < this.ventanaMs);
    this.#intentos.set(clave, lista);
    return lista.length >= this.max;
  }
  registrar(clave, ahora = Date.now()) { this.#intentos.set(clave, [...(this.#intentos.get(clave) ?? []), ahora]); }
  limpiar(clave) { this.#intentos.delete(clave); }
}
