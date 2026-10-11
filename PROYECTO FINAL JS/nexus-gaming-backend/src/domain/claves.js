import { randomInt } from 'node:crypto';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusiones

/** Clave de activación tipo XXXXX-XXXXX-XXXXX (17 caracteres). */
export function generarClave() {
  const grupo = () => Array.from({ length: 5 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
  return `${grupo()}-${grupo()}-${grupo()}`;
}
