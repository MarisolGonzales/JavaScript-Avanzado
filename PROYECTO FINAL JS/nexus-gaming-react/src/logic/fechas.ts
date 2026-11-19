/**
 * Formato de fechas en español de Perú, con los mismos patrones que el DatePipe de la versión Angular:
 *   fecha(iso, 'dd/MM/yyyy HH:mm')                  -> "19/11/2026 16:05"
 *   fecha(iso, "dd 'de' MMMM 'de' yyyy, HH:mm")     -> "19 de noviembre de 2026, 16:05"
 * El texto entre comillas simples se copia tal cual.
 */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const dos = (n: number): string => String(n).padStart(2, '0');

export function fecha(iso: string | null | undefined, patron: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return patron.replace(/'([^']*)'|MMMM|yyyy|yy|dd|MM|HH|mm/g, (token, literal: string | undefined) => {
    if (literal !== undefined) return literal;
    switch (token) {
      case 'MMMM': return MESES[d.getMonth()];
      case 'yyyy': return String(d.getFullYear());
      case 'yy': return dos(d.getFullYear() % 100);
      case 'dd': return dos(d.getDate());
      case 'MM': return dos(d.getMonth() + 1);
      case 'HH': return dos(d.getHours());
      case 'mm': return dos(d.getMinutes());
      default: return token;
    }
  });
}
