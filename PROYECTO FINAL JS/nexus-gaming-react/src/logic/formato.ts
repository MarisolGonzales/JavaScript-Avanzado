/** Formato de soles con separador de miles: 4617.8 → "S/ 4,617.80" (determinista, sin depender del idioma del navegador). */
export function formatoSoles(valor: number): string {
  const [entero, decimales] = Math.abs(valor).toFixed(2).split('.');
  return `${valor < 0 ? '-' : ''}S/ ${entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimales}`;
}

/** Números cortos para los ejes de los gráficos: 1250 → "1.3k". */
export function abreviar(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(Math.round(n));
}

/** "2026-10-04" → "04 oct" para el eje de fechas. */
export function diaCorto(fechaIso: string): string {
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const [, m, d] = fechaIso.split('-');
  return `${d} ${meses[Number(m) - 1]}`;
}

/** Iniciales para avatares: "Vanessa Tito Valerio" → "VT". */
export const iniciales = (nombre: string): string =>
  nombre.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') || '?';

/** "hace 5 min", "hace 3 h", "ayer", "hace 4 días" para el panel de actividad. */
export function hace(fechaIso: string, ahora = new Date()): string {
  const seg = Math.max(0, Math.floor((ahora.getTime() - new Date(fechaIso).getTime()) / 1000));
  if (seg < 60) return 'justo ahora';
  const min = Math.floor(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}
