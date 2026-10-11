import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error' | 'info';
export interface Toast { readonly id: number; readonly tipo: TipoToast; readonly mensaje: string; }

/** Avisos flotantes accesibles: reemplazan a los alert() del navegador. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private siguienteId = 1;
  readonly toasts = signal<readonly Toast[]>([]);

  exito(mensaje: string): void { this.mostrar('exito', mensaje); }
  error(mensaje: string): void { this.mostrar('error', mensaje, 7000); }
  info(mensaje: string): void { this.mostrar('info', mensaje); }

  cerrar(id: number): void { this.toasts.update((lista) => lista.filter((t) => t.id !== id)); }

  private mostrar(tipo: TipoToast, mensaje: string, ms = 4000): void {
    const id = this.siguienteId++;
    this.toasts.update((lista) => [...lista.slice(-3), { id, tipo, mensaje }]); // máximo 4 a la vez
    setTimeout(() => this.cerrar(id), ms);
  }
}
