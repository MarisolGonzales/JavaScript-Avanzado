/**
 * VALIDACIÓN DE ENTRADAS. El servidor NO confía en el navegador: aunque el
 * formulario de Angular ya valide, aquí se vuelve a comprobar todo.
 */
import { badRequest } from '../errors.js';
import { DEPARTAMENTOS, nodoDeDepartamento } from './regiones.js';
import { esDni, esRuc } from './documentos.js';
import { ESTADOS, METODOS_PAGO, TIPOS_COMPROBANTE, TIPOS_ENTREGA, nodoValido, NODOS } from './constantes.js';

export const texto = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarNodo(nodo) {
  const n = texto(nodo).toUpperCase();
  if (!nodoValido(n)) throw badRequest(`Servidor inválido. Usa: ${Object.keys(NODOS).join(', ')}.`);
  return n;
}

export function validarEmail(email) {
  const e = texto(email).toLowerCase();
  if (!EMAIL.test(e) || e.length > 80) throw badRequest('Correo electrónico inválido.');
  return e;
}

export function validarNombre(nombre) {
  const n = texto(nombre);
  if (n.length < 2 || n.length > 80) throw badRequest('El nombre debe tener entre 2 y 80 caracteres.');
  return n;
}

/** Mínimo 8 caracteres con al menos una letra y un número. */
export function validarPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 72)
    throw badRequest('La contraseña debe tener entre 8 y 72 caracteres.');
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    throw badRequest('La contraseña debe incluir al menos una letra y un número.');
  return password;
}

export function validarDepartamento(departamento) {
  const d = texto(departamento);
  if (!Object.prototype.hasOwnProperty.call(DEPARTAMENTOS, d)) throw badRequest('Selecciona un departamento válido.');
  return d;
}

/**
 * Renglones del pedido. Cada juego es UNA licencia (como en Steam o Epic):
 * se puede comprar para uno mismo (DIGITAL) y/o para regalar (REGALO), sin repetir.
 */
export function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw badRequest('Debes enviar al menos un juego.');
  if (items.length > 30) throw badRequest('Demasiados juegos en una sola compra.');
  const vistos = new Set();
  const limpios = items.map((it) => {
    const idJuego = Number(it?.idJuego);
    const tipoEntrega = texto(it?.tipoEntrega ?? 'DIGITAL').toUpperCase();
    if (!Number.isInteger(idJuego) || idJuego <= 0) throw badRequest('Identificador de juego inválido.');
    if (!TIPOS_ENTREGA.includes(tipoEntrega)) throw badRequest('Tipo de entrega inválido (DIGITAL o REGALO).');
    if (it?.cantidad !== undefined && Number(it.cantidad) !== 1) throw badRequest('Cada juego se compra de a una licencia.');
    const clave = `${idJuego}|${tipoEntrega}`;
    if (vistos.has(clave)) throw badRequest('Hay juegos repetidos en la compra.');
    vistos.add(clave);
    return { idJuego, cantidad: 1, tipoEntrega };
  });
  // Orden estable por juego: evita bloqueos cruzados al descontar stock en paralelo.
  return limpios.sort((a, b) => a.idJuego - b.idJuego || a.tipoEntrega.localeCompare(b.tipoEntrega));
}

export function validarPago(pago) {
  const metodo = texto(pago?.metodo).toUpperCase();
  if (!METODOS_PAGO.includes(metodo)) throw badRequest('Método de pago inválido (TARJETA, YAPE o PLIN).');
  // Nunca se recibe el número completo de la tarjeta: solo los últimos dígitos o el celular enmascarado.
  const referencia = texto(pago?.referencia).slice(0, 30);
  if (referencia && /^\d{13,19}$/.test(referencia.replace(/\s/g, '')))
    throw badRequest('No envíes el número completo de la tarjeta; solo los últimos 4 dígitos.');
  return { metodo, referencia: referencia || null };
}

/** Boleta (consumidor final) o factura (empresa con RUC). */
export function validarComprobante(c) {
  const tipo = texto(c?.tipo ?? 'BOLETA').toUpperCase();
  if (!TIPOS_COMPROBANTE.includes(tipo)) throw badRequest('Tipo de comprobante inválido (BOLETA o FACTURA).');
  if (tipo === 'FACTURA') {
    const ruc = texto(c?.documento);
    const razonSocial = texto(c?.nombre);
    const direccion = texto(c?.direccion);
    if (!esRuc(ruc)) throw badRequest('El RUC no es válido (11 dígitos y dígito de control correcto).');
    if (razonSocial.length < 3 || razonSocial.length > 120) throw badRequest('Escribe la razón social (3 a 120 caracteres).');
    if (direccion.length < 5 || direccion.length > 160) throw badRequest('Escribe la dirección fiscal (5 a 160 caracteres).');
    return { tipo, tipoDoc: 'RUC', documento: ruc, nombre: razonSocial, direccion };
  }
  const dni = texto(c?.documento);
  if (dni && !esDni(dni)) throw badRequest('El DNI debe tener 8 dígitos.');
  return { tipo, tipoDoc: dni ? 'DNI' : 'SIN DOC', documento: dni || null, nombre: texto(c?.nombre).slice(0, 120) || null, direccion: null };
}

export function validarRegalo(regalo, emailComprador) {
  const destinatario = validarEmail(regalo?.destinatario);
  if (destinatario === emailComprador) throw badRequest('El destinatario del regalo no puede ser tu propia cuenta.');
  const mensaje = texto(regalo?.mensaje).slice(0, 200) || null;
  return { destinatario, mensaje };
}

/**
 * Valida el cuerpo de POST /pedidos. `cuenta` es el usuario autenticado: de ahí salen
 * su correo y su departamento (→ servidor regional). El cliente no puede elegirlos.
 */
export function validarPedido(body, cuenta) {
  const items = validarItems(body?.items);
  const pago = validarPago(body?.pago);
  const comprobante = validarComprobante(body?.comprobante);
  const hayRegalo = items.some((i) => i.tipoEntrega === 'REGALO');
  const regalo = hayRegalo ? validarRegalo(body?.regalo, cuenta.email) : null;
  return {
    usuario: cuenta.email,
    nombreUsuario: cuenta.nombre,
    departamento: cuenta.departamento,
    nodo: nodoDeDepartamento(cuenta.departamento),
    items, pago, comprobante, regalo
  };
}

export function validarEstado(estado) {
  const e = texto(estado).toUpperCase();
  if (!ESTADOS.includes(e)) throw badRequest(`Estado inválido. Usa: ${ESTADOS.join(', ')}.`);
  return e;
}

export function validarJuego(body, parcial = false) {
  const out = {};
  const req = (cond, msg) => { if (!cond) throw badRequest(msg); };
  if (!parcial || body.title !== undefined) { out.title = texto(body.title); req(out.title.length >= 2 && out.title.length <= 120, 'Título inválido (2 a 120 caracteres).'); }
  if (!parcial || body.price !== undefined) { out.price = Number(body.price); req(Number.isFinite(out.price) && out.price >= 0 && out.price <= 9999, 'Precio inválido.'); }
  if (!parcial || body.category !== undefined) { out.category = texto(body.category); req(out.category.length >= 2 && out.category.length <= 40, 'Categoría inválida.'); }
  if (!parcial || body.description !== undefined) { out.description = texto(body.description).slice(0, 600); }
  if (!parcial || body.image !== undefined) { out.image = texto(body.image).slice(0, 200) || 'assets/img/nexus-icon.png'; }
  if (body.banner !== undefined) out.banner = texto(body.banner).slice(0, 200) || null;
  if (body.developer !== undefined) out.developer = texto(body.developer).slice(0, 80) || null;
  if (body.year !== undefined) { out.year = body.year === null ? null : Number(body.year); req(out.year === null || (Number.isInteger(out.year) && out.year >= 1970 && out.year <= 2100), 'Año inválido.'); }
  if (body.platforms !== undefined) out.platforms = texto(body.platforms).slice(0, 120) || null;
  if (body.mode !== undefined) out.mode = texto(body.mode).slice(0, 40) || null;
  if (!parcial || body.stockInicial !== undefined) { out.stockInicial = Number(body.stockInicial ?? 25); req(Number.isInteger(out.stockInicial) && out.stockInicial >= 0 && out.stockInicial <= 100000, 'Stock inválido.'); }
  return out;
}

export function validarTicket(body) {
  const asunto = texto(body?.asunto);
  const mensaje = typeof body?.mensaje === 'string' ? body.mensaje.trim() : '';
  const tipo = texto(body?.tipo ?? 'CONSULTA').toUpperCase();
  if (asunto.length < 3 || asunto.length > 120) throw badRequest('El asunto debe tener entre 3 y 120 caracteres.');
  if (mensaje.length < 5 || mensaje.length > 1000) throw badRequest('El mensaje debe tener entre 5 y 1000 caracteres.');
  if (!['CONSULTA', 'REEMBOLSO'].includes(tipo)) throw badRequest('Tipo de ticket inválido.');
  const pedido = texto(body?.pedido).toUpperCase() || null;
  if (tipo === 'REEMBOLSO' && !pedido) throw badRequest('Indica el código del pedido a reembolsar.');
  return { asunto, mensaje, tipo, pedido };
}
