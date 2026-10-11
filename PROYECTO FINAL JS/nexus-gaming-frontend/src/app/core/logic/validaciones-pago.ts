/**
 * Validaciones de medios de pago con expresiones regulares y aritmética
 * (Semanas 2, 3 y 5). Son funciones puras: se prueban sin Angular.
 */
export const soloDigitos = (valor: string): string => valor.replace(/\D/g, '');

/** Agrupa de 4 en 4: "4242424242424242" -> "4242 4242 4242 4242". */
export function formatearTarjeta(valor: string): string {
  return soloDigitos(valor).slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ');
}

/** Pone la barra: "1228" -> "12/28". */
export function formatearVencimiento(valor: string): string {
  const d = soloDigitos(valor).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/**
 * Algoritmo de Luhn: detecta números de tarjeta mal digitados.
 * Desde la derecha se duplica un dígito sí y otro no; si el doble pasa de 9
 * se le resta 9; la suma total debe ser múltiplo de 10.
 */
export function cumpleLuhn(numero: string): boolean {
  const d = soloDigitos(numero);
  if (d.length < 13 || d.length > 19) return false;
  let suma = 0;
  let duplicar = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (duplicar) { n *= 2; if (n > 9) n -= 9; }
    suma += n;
    duplicar = !duplicar;
  }
  return suma % 10 === 0;
}

/** "MM/AA" válido y NO vencido (la tarjeta vale hasta el último día del mes). */
export function vencimientoVigente(texto: string, hoy = new Date()): boolean {
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(texto);
  if (!m) return false;
  const mes = Number(m[1]);
  const anio = 2000 + Number(m[2]);
  const ultimoDia = new Date(anio, mes, 0, 23, 59, 59);
  return ultimoDia.getTime() >= hoy.getTime();
}

/** Celular peruano: 9 dígitos que empiezan con 9. */
export const celularPeruValido = (v: string): boolean => /^9\d{8}$/.test(v);

/** Enmascara para guardar solo referencias seguras (nunca el número completo). */
export const ultimos4 = (numero: string): string => soloDigitos(numero).slice(-4);
export const enmascararCelular = (celular: string): string => `${celular.slice(0, 1)}XXXXX${celular.slice(-3)}`;
