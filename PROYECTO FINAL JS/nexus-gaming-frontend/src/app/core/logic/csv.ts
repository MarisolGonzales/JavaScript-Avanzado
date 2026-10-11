/**
 * Exportación a CSV (Semana 3: manipulación de cadenas).
 * Reglas del formato: si un valor contiene coma, comillas o salto de línea se encierra
 * entre comillas y las comillas internas se duplican. El BOM inicial hace que Excel
 * abra bien las tildes.
 */
export function celdaCsv(valor: unknown): string {
  const t = valor === null || valor === undefined ? '' : String(valor);
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export function aCsv(encabezados: readonly string[], filas: readonly (readonly unknown[])[]): string {
  return '\uFEFF' + [encabezados, ...filas].map((f) => f.map(celdaCsv).join(',')).join('\r\n');
}

/** Descarga un texto como archivo desde el navegador. */
export function descargarTexto(nombre: string, contenido: string, tipo = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
