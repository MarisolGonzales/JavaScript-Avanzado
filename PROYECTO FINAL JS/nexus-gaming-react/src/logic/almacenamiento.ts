/**
 * Lectura segura de localStorage (Semana 6: unknown frente a any).
 * JSON.parse devuelve datos NO confiables; se conservan como `unknown` y una
 * función guarda decide si tienen la forma esperada antes de usarlos.
 */
export function leerJson<T>(clave: string, guardia: (v: unknown) => v is T, respaldo: T): T {
  try {
    const crudo = localStorage.getItem(clave);
    if (crudo === null) return respaldo;
    const dato: unknown = JSON.parse(crudo);
    return guardia(dato) ? dato : respaldo;
  } catch {
    return respaldo; // JSON corrupto o almacenamiento no disponible
  }
}

export function guardarJson(clave: string, valor: unknown): void {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* modo privado o cuota llena */ }
}

export const esArreglo = (v: unknown): v is unknown[] => Array.isArray(v);
export const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
