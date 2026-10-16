import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoCarga } from '../../core/carga';
import { IndiceBusqueda } from '../../core/logic/indice-busqueda';
import { imagenRota } from '../../core/logic/imagen';
import { formatoTamano, tamanoJuego } from '../../core/logic/instalacion';
import { InstalacionesService } from '../../core/services/instalaciones.service';
import { PedidosService } from '../../core/services/pedidos.service';
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
  protected readonly instalaciones = inject(InstalacionesService);

  protected readonly estado = new EstadoCarga<ElementoBiblioteca[]>();
  protected readonly imagenRota = imagenRota;
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

  /** Si un juego salió de la biblioteca (p. ej. por un reembolso), deja de figurar como instalado. */
  protected cargar(): void {
    this.estado.ejecutar(this.api.biblioteca(), (lista) => this.instalaciones.sincronizar(lista.map((j) => j.llave)));
  }
  protected escribir(e: Event): void { this.texto.set((e.target as HTMLInputElement).value); }

  protected tamano(j: ElementoBiblioteca): number { return tamanoJuego(j.titulo, j.idJuego); }
  protected tamanoTexto(j: ElementoBiblioteca): string { return formatoTamano(this.tamano(j)); }

  protected instalar(j: ElementoBiblioteca): void { this.instalaciones.instalar(j.llave, j.titulo, this.tamano(j)); }
  protected desinstalar(j: ElementoBiblioteca): void {
    if (confirm(`¿Desinstalar ${j.titulo}? Podrás volver a instalarlo cuando quieras.`)) this.instalaciones.desinstalar(j.llave, j.titulo);
  }
}
