import { Injectable, effect, signal } from '@angular/core';
import { guardarJson } from '../logic/almacenamiento';

export type Tema = 'oscuro' | 'claro';
const CLAVE = 'nexus_tema';

/**
 * TEMA CLARO / OSCURO. Se guarda la elección; si no hay, se respeta la preferencia del
 * sistema operativo. Pone data-theme en <html> (nuestros colores) y data-bs-theme
 * (los componentes de Bootstrap). Un pequeño script en index.html lo aplica antes de
 * que cargue Angular para que la página no parpadee.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(this.inicial());

  constructor() {
    effect(() => this.aplicar(this.tema()));
  }

  alternar(): void {
    const nuevo: Tema = this.tema() === 'oscuro' ? 'claro' : 'oscuro';
    this.tema.set(nuevo);
    guardarJson(CLAVE, nuevo);
  }

  private inicial(): Tema {
    try {
      const guardado: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
      if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    } catch { /* almacenamiento no disponible: se usa el sistema */ }
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro';
  }

  private aplicar(tema: Tema): void {
    const raiz = document.documentElement;
    raiz.setAttribute('data-theme', tema);
    raiz.setAttribute('data-bs-theme', tema === 'claro' ? 'light' : 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'claro' ? '#f4f5fa' : '#0a0a0e');
  }
}
