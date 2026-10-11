/**
 * Documentos de identidad peruanos (Semana 5: algoritmos con arreglos).
 */
export const esDni = (v) => /^\d{8}$/.test(String(v ?? ''));

/**
 * RUC: 11 dígitos que empiezan con 10, 15, 17 o 20. El último dígito es de control:
 * se multiplican los 10 primeros por 5,4,3,2,7,6,5,4,3,2, se suma, y
 * control = 11 − (suma mod 11)  (si da 10 → 0; si da 11 → 1).
 */
export function esRuc(valor) {
  const ruc = String(valor ?? '');
  if (!/^(10|15|17|20)\d{9}$/.test(ruc)) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((acc, p, i) => acc + p * Number(ruc[i]), 0);
  let control = 11 - (suma % 11);
  if (control === 10) control = 0;
  if (control === 11) control = 1;
  return control === Number(ruc[10]);
}
