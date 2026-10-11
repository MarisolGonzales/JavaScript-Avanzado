import { ValidatorFn } from '@angular/forms';
import { esDni, esRuc } from './logic/documentos';
import { celularPeruValido, cumpleLuhn, vencimientoVigente } from './logic/validaciones-pago';

/**
 * Validadores de formulario reutilizables (Semana 8): una función que recibe el
 * control y devuelve null si es válido, o un objeto con la clave del error.
 */
export const tarjetaValida: ValidatorFn = (c) => (cumpleLuhn(String(c.value ?? '')) ? null : { tarjeta: true });
export const vencimientoValido: ValidatorFn = (c) => (vencimientoVigente(String(c.value ?? '')) ? null : { vencimiento: true });
export const celularValido: ValidatorFn = (c) => (celularPeruValido(String(c.value ?? '')) ? null : { celular: true });
export const rucValido: ValidatorFn = (c) => (esRuc(String(c.value ?? '').trim()) ? null : { ruc: true });
/** DNI opcional: vacío es válido; si se escribe, debe tener 8 dígitos. */
export const dniOpcional: ValidatorFn = (c) => { const v = String(c.value ?? '').trim(); return !v || esDni(v) ? null : { dni: true }; };
export const dniObligatorio: ValidatorFn = (c) => (esDni(String(c.value ?? '').trim()) ? null : { dni: true });
/** Texto con al menos `min` caracteres reales (los espacios no cuentan). */
export const textoMinimo = (min: number): ValidatorFn => (c) =>
  String(c.value ?? '').trim().length >= min ? null : { textoMinimo: { min } };
/** Contraseña: 8 o más caracteres con letra y número (igual que el servidor). */
export const passwordSegura: ValidatorFn = (c) => {
  const v = String(c.value ?? '');
  return v.length >= 8 && v.length <= 72 && /[A-Za-z]/.test(v) && /\d/.test(v) ? null : { passwordDebil: true };
};
