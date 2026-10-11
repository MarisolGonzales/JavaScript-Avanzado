/**
 * Documentos de identidad peruanos (Semana 5: algoritmos con arreglos).
 * Se validan aquí para avisar al instante; el servidor vuelve a comprobarlos.
 */
export const esDni = (valor: string): boolean => /^\d{8}$/.test(valor);

/**
 * RUC: 11 dígitos que empiezan con 10, 15, 17 o 20. El último es un dígito de control:
 * se multiplican los 10 primeros por 5,4,3,2,7,6,5,4,3,2, se suman, y
 * control = 11 − (suma mod 11)  (10 → 0, 11 → 1).
 */
export function esRuc(valor: string): boolean {
  if (!/^(10|15|17|20)\d{9}$/.test(valor)) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((acc, peso, i) => acc + peso * Number(valor[i]), 0);
  let control = 11 - (suma % 11);
  if (control === 10) control = 0;
  if (control === 11) control = 1;
  return control === Number(valor[10]);
}

/** Las boletas desde este monto deben identificar al cliente con DNI. */
export const MONTO_BOLETA_CON_DNI = 700;
export const DIAS_REEMBOLSO = 14;

/** ¿Sigue vigente el plazo de reembolso (14 días desde la compra)? */
export const dentroDePlazoReembolso = (fechaIso: string, ahora = new Date()): boolean =>
  ahora.getTime() - new Date(fechaIso).getTime() <= DIAS_REEMBOLSO * 86_400_000;
