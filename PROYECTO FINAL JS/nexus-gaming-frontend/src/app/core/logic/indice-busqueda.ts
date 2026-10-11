/** Quita tildes y pasa a minúsculas: "Acción" y "accion" son lo mismo al buscar. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Divide un texto en palabras usando una expresión regular (Semana 3: RegEx). */
export function tokenizar(texto: string): string[] {
  return normalizar(texto).split(/[^a-z0-9ñ]+/).filter(Boolean);
}

/**
 * TABLA HASH para búsqueda (Semana 4: Map + clases).
 * Cada palabra apunta a un Set con los ids de los elementos donde aparece, así
 * no hace falta recorrer todo el catálogo en cada tecla pulsada.
 */
export class IndiceBusqueda {
  private readonly indice = new Map<string, Set<number>>();
  private readonly todos = new Set<number>();

  constructor(elementos: readonly { id: number; texto: string }[] = []) {
    elementos.forEach((e) => this.agregar(e.id, e.texto));
  }

  get tamanio(): number { return this.indice.size; }

  agregar(id: number, texto: string): void {
    this.todos.add(id);
    for (const palabra of tokenizar(texto)) {
      const ids = this.indice.get(palabra) ?? new Set<number>();
      ids.add(id);
      this.indice.set(palabra, ids);
    }
  }

  /**
   * Devuelve los ids que contienen TODAS las palabras buscadas (coincidencia
   * por prefijo: "wit" encuentra "witcher"). Sin texto devuelve todos.
   */
  buscar(consulta: string): Set<number> {
    const terminos = tokenizar(consulta);
    if (terminos.length === 0) return new Set(this.todos);

    let resultado: Set<number> | null = null;
    for (const termino of terminos) {
      const coincidencias = new Set<number>();
      for (const [palabra, ids] of this.indice) {
        if (palabra.startsWith(termino)) ids.forEach((id) => coincidencias.add(id));
      }
      resultado = resultado === null
        ? coincidencias
        : new Set([...resultado].filter((id) => coincidencias.has(id)));
      if (resultado.size === 0) break;
    }
    return resultado ?? new Set();
  }
}
