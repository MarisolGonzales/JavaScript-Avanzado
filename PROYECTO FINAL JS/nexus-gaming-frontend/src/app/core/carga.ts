import { signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { mensajeError } from './http-error';

/**
 * Estado de una petición HTTP con señales: datos, cargando y error.
 * Evita repetir en cada página los tres campos y el manejo de errores.
 */
export class EstadoCarga<T> {
  readonly datos = signal<T | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ejecutar(fuente: Observable<T>, alTerminar?: (datos: T) => void): void {
    this.cargando.set(true);
    this.error.set(null);
    fuente.subscribe({
      next: (d) => { this.datos.set(d); this.cargando.set(false); alTerminar?.(d); },
      error: (e: unknown) => { this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }
}
