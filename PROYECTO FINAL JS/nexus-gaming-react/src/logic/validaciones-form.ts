/**
 * Validaciones de formulario reutilizables (equivalen a los Validators y validadores
 * propios de la versión Angular). Funciones puras: se prueban sin React.
 */

/** Misma regla que Validators.email de Angular. */
const EMAIL = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
export const esEmail = (v: string): boolean => EMAIL.test(v);

/** Texto con al menos `min` caracteres reales (los espacios no cuentan). */
export const textoMinimo = (v: string, min: number): boolean => v.trim().length >= min;

/** Contraseña: 8 o más caracteres con letra y número (igual que el servidor). */
export const passwordSegura = (v: string): boolean => v.length >= 8 && v.length <= 72 && /[A-Za-z]/.test(v) && /\d/.test(v);
