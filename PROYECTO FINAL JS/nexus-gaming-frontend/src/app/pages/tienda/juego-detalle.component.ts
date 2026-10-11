import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EstadoCarga } from '../../core/carga';
import { imagenRota } from '../../core/logic/imagen';
import { CarritoService } from '../../core/services/carrito.service';
import { JuegosService } from '../../core/services/juegos.service';
import { StockDirective, textoStock } from '../../shared/directives/stock.directive';
import type { Juego, TipoEntrega } from '../../shared/models';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

@Component({
  selector: 'app-juego-detalle',
  standalone: true,
  imports: [RouterLink, SolesPipe, StockDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './juego-detalle.component.html'
})
export class JuegoDetalleComponent {
  /** Llega desde la URL /juego/:id gracias a withComponentInputBinding(). */
  readonly id = input.required<string>();

  private readonly carrito = inject(CarritoService);
  private readonly router = inject(Router);
  private readonly api = inject(JuegosService);

  protected readonly estado = new EstadoCarga<Juego>();
  protected readonly tipo = signal<TipoEntrega>('DIGITAL');
  protected readonly imagenRota = imagenRota;
  protected readonly textoStock = textoStock;
  protected readonly juego = computed(() => this.estado.datos());

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => {
        if (!Number.isInteger(id) || id <= 0) { this.estado.error.set('Identificador de juego inválido.'); return; }
        this.estado.ejecutar(this.api.obtener(id));
      });
    });
  }

  protected agregar(): boolean {
    const j = this.juego();
    return j ? this.carrito.agregarConAviso(j, this.tipo()) : false;
  }

  protected comprarAhora(): void {
    const j = this.juego();
    if (!j) return;
    const yaEsta = this.carrito.items().some((i) => i.idJuego === j.id && i.tipoEntrega === this.tipo());
    // Si ya estaba en el carrito, no es un error: simplemente seguimos al pago.
    if (yaEsta || this.agregar()) void this.router.navigate(['/checkout']);
  }
}
