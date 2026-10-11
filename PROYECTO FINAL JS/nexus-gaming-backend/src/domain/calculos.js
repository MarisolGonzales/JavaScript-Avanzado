import { IGV_TASA } from './constantes.js';

export const redondear2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Los precios del catálogo YA incluyen IGV (así se venden al público).
 *   total = Σ(precio × cantidad) + extras;  subtotal = total / 1.18;  igv = total − subtotal.
 */
export function calcularTotales(lineas, extras = 0) {
  const bruto = lineas.reduce((s, l) => s + l.precioUnitario * l.cantidad, 0);
  const total = redondear2(bruto + extras);
  const subtotal = redondear2(total / (1 + IGV_TASA));
  return { subtotal, igv: redondear2(total - subtotal), total };
}
