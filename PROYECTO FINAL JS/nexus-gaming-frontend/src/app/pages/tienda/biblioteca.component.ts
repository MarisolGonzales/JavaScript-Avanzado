import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoCarga } from '../../core/carga';
import { IndiceBusqueda } from '../../core/logic/indice-busqueda';
import { imagenRota } from '../../core/logic/imagen';
import { PedidosService } from '../../core/services/pedidos.service';
import { ToastService } from '../../core/services/toast.service';
import type { ElementoBiblioteca } from '../../shared/models';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './biblioteca.component.html'
})
export class BibliotecaComponent {
  private readonly api = inject(PedidosService);
  private readonly toast = inject(ToastService);

  protected readonly estado = new EstadoCarga<ElementoBiblioteca[]>();
  protected readonly imagenRota = imagenRota;
  protected readonly visibles = signal<ReadonlySet<string>>(new Set());
  protected readonly texto = signal('');

  private readonly todos = computed(() => this.estado.datos() ?? []);
  /** Misma búsqueda por índice hash del catálogo, aplicada a tus juegos. */
  protected readonly juegos = computed(() => {
    const lista = this.todos();
    const indice = new IndiceBusqueda(lista.map((j, i) => ({ id: i, texto: j.titulo })));
    const ids = indice.buscar(this.texto());
    return lista.filter((_, i) => ids.has(i));
  });

  constructor() { this.cargar(); }

  protected cargar(): void { this.estado.ejecutar(this.api.biblioteca()); }
  protected escribir(e: Event): void { this.texto.set((e.target as HTMLInputElement).value); }

  protected alternar(llave: string): void {
    this.visibles.update((s) => { const n = new Set(s); if (n.has(llave)) n.delete(llave); else n.add(llave); return n; });
  }
  protected async copiar(clave: string): Promise<void> {
    try { await navigator.clipboard.writeText(clave); this.toast.exito('Clave copiada.'); }
    catch { this.toast.error('No se pudo copiar la clave.'); }
  }
  protected oculta(clave: string): string { return clave.replace(/[A-Z0-9]/g, (c, i) => (i < 5 ? c : '•')); }
}
