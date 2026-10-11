/**
 * Fuerza de una contraseña (0 = muy débil … 4 = fuerte) con expresiones regulares.
 * Solo orienta al usuario: la regla obligatoria es 8+ caracteres con letra y número.
 */
export function fuerzaPassword(pw: string): { nivel: 0 | 1 | 2 | 3 | 4; etiqueta: string } {
  if (!pw) return { nivel: 0, etiqueta: '' };
  let puntos = 0;
  if (pw.length >= 8) puntos++;
  if (pw.length >= 12) puntos++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) puntos++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) puntos++;
  if (pw.length < 8) puntos = Math.min(puntos, 1);
  const nivel = Math.min(4, puntos) as 0 | 1 | 2 | 3 | 4;
  return { nivel, etiqueta: ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'][nivel] };
}
