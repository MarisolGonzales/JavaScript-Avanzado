import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { EstadoCarga } from '../../core/carga';
import { imagenRota } from '../../core/logic/imagen';
import { AuthService } from '../../core/services/auth.service';
import { CarritoService } from '../../core/services/carrito.service';
import { JuegosService } from '../../core/services/juegos.service';
import { GameCardComponent } from '../../shared/components/game-card.component';
import { UMBRAL_STOCK_BAJO } from '../../shared/directives/stock.directive';
import type { Juego } from '../../shared/models';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, NgStyle, GameCardComponent, SolesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.component.html'
})
export class InicioComponent {
  protected readonly auth = inject(AuthService);
  private readonly carrito = inject(CarritoService);
  private readonly api = inject(JuegosService);

  protected readonly estado = new EstadoCarga<Juego[]>();
  protected readonly indice = signal(0);
  protected readonly pausado = signal(false);
  protected readonly imagenRota = imagenRota;

  private readonly juegos = computed(() => this.estado.datos() ?? []);
  /** Portadas del carrusel: prioriza los juegos que traen banner ancho. */
  protected readonly slides = computed(() => {
    const todos = this.juegos();
    const conBanner = todos.filter((j) => j.banner && j.stock > 0);
    return (conBanner.length >= 2 ? conBanner : todos).slice(0, 3);
  });
  protected readonly recientes = computed(() => [...this.juegos()].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).slice(0, 4));
  protected readonly ultimas = computed(() => this.juegos().filter((j) => j.stock > 0 && j.stock <= UMBRAL_STOCK_BAJO));

  constructor() {
    this.cargar();
    interval(6000).pipe(takeUntilDestroyed()).subscribe(() => { if (!this.pausado()) this.siguiente(); });
  }

  protected cargar(): void { this.estado.ejecutar(this.api.listar(), (j) => this.carrito.recuperarDelServidor(j)); }
  protected ir(i: number): void { this.indice.set(i); }
  protected siguiente(): void { const n = this.slides().length; if (n > 0) this.indice.update((i) => (i + 1) % n); }
  protected anterior(): void { const n = this.slides().length; if (n > 0) this.indice.update((i) => (i - 1 + n) % n); }
  protected agregar(j: Juego): void { this.carrito.agregarConAviso(j); }
}
