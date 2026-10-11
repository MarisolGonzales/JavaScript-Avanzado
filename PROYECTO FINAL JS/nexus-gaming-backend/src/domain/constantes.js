/**
 * CONSTANTES DEL NEGOCIO · NEXUS GAMING (tienda de juegos digitales).
 *
 * Los datos se reparten en 3 servidores regionales (Semana 9: bases de datos
 * distribuidas). El cliente NUNCA elige un servidor: se le asigna según el
 * departamento de su cuenta (ver regiones.js). Es una fragmentación (sharding)
 * por región, invisible para quien compra.
 */
export const NODOS = {
  NORTE:  { region: 'trujillo', etiqueta: 'Norte (Trujillo)',  prefijo: 'TRU', serieBoleta: 'B001', serieFactura: 'F001' },
  SUR:    { region: 'arequipa', etiqueta: 'Sur (Arequipa)',    prefijo: 'AQP', serieBoleta: 'B002', serieFactura: 'F002' },
  CENTRO: { region: 'cusco',    etiqueta: 'Centro (Cusco)',    prefijo: 'CUS', serieBoleta: 'B003', serieFactura: 'F003' }
};

/** Datos del emisor que salen en el comprobante. RUC ficticio (con dígito verificador válido). */
export const EMISOR = {
  razonSocial: 'NEXUS GAMING S.A.C.',
  ruc: '20601234565',
  direccion: 'Av. Javier Prado Este 1234, San Isidro, Lima',
  web: 'www.nexusgaming.pe'
};

export const IGV_TASA = 0.18;
export const METODOS_PAGO = ['TARJETA', 'YAPE', 'PLIN'];
export const TIPOS_ENTREGA = ['DIGITAL', 'REGALO'];          // para mi cuenta | para otra persona
export const TIPOS_COMPROBANTE = ['BOLETA', 'FACTURA'];
/** Por norma, las boletas desde este monto deben identificar al cliente (DNI). */
export const MONTO_BOLETA_CON_DNI = 700;
export const POLITICA_REEMBOLSO_DIAS = 14;

export const ROLES = ['cliente', 'soporte', 'admin'];

export const ESTADOS = ['PENDIENTE', 'PAGADO', 'ENTREGADO', 'REEMBOLSADO'];
const ORDEN = ['PENDIENTE', 'PAGADO', 'ENTREGADO'];

/**
 * Ciclo de vida de un pedido digital:  PENDIENTE → PAGADO → ENTREGADO.
 * REEMBOLSADO es un estado final al que se llega desde PAGADO o ENTREGADO.
 * Misma regla que el trigger fn_validar_transicion_estado de PostgreSQL.
 */
export function transicionValida(actual, nuevo) {
  if (actual === nuevo) return true;
  if (actual === 'REEMBOLSADO') return false;
  if (nuevo === 'REEMBOLSADO') return true;
  return ORDEN.indexOf(nuevo) > ORDEN.indexOf(actual);
}

export const nodoValido = (n) => Object.prototype.hasOwnProperty.call(NODOS, n);
export const nodoDeCodigo = (codigo) =>
  Object.entries(NODOS).find(([, v]) => codigo.startsWith(`NX-${v.prefijo}-`))?.[0] ?? null;

/** ¿Sigue vigente la política de reembolso (14 días desde la compra)? */
export function dentroDePlazoReembolso(fechaIso, ahora = new Date()) {
  return ahora.getTime() - new Date(fechaIso).getTime() <= POLITICA_REEMBOLSO_DIAS * 86_400_000;
}

/** Día calendario en hora de Lima (UTC-5, sin horario de verano), formato YYYY-MM-DD. */
export const diaLima = (fecha) => new Date(new Date(fecha).getTime() - 5 * 3_600_000).toISOString().slice(0, 10);
