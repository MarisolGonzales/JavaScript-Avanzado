/**
 * DINERO SIN ERRORES DE COMA FLOTANTE (Semana 2: IEEE 754).
 * En JavaScript 0.1 + 0.2 === 0.30000000000000004 porque los números usan el
 * estándar IEEE 754 de doble precisión. Para dinero, el carrito suma en
 * CÉNTIMOS enteros y solo convierte a soles al mostrar.
 */
/**
 * Redondeo a céntimos. Se suma una corrección PROPORCIONAL al valor: con un
 * EPSILON fijo, 10.165 * 100 daría 1016.4999… y redondearía mal (10.16 en vez de 10.17).
 */
export const aCentimos = (soles: number): number =>
  Math.round((soles + Number.EPSILON * Math.max(1, Math.abs(soles))) * 100);
export const aSoles = (centimos: number): number => centimos / 100;

export function sumarSoles(...importes: readonly number[]): number {
  return aSoles(importes.reduce((suma, i) => suma + aCentimos(i), 0));
}
export function multiplicarSoles(precio: number, cantidad: number): number {
  return aSoles(aCentimos(precio) * cantidad);
}

/** Los precios incluyen IGV (18 %): separa subtotal e impuesto igual que la API. */
export function desglosarIgv(total: number, tasa = 0.18): { subtotal: number; igv: number } {
  const totalC = aCentimos(total);
  const subtotalC = Math.round(totalC / (1 + tasa));
  return { subtotal: aSoles(subtotalC), igv: aSoles(totalC - subtotalC) };
}
