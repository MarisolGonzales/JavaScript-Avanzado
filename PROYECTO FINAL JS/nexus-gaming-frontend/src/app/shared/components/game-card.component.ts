import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { imagenRota } from '../../core/logic/imagen';
import type { Juego } from '../models';
import { StockDirective, textoStock } from '../directives/stock.directive';
import { SolesPipe } from '../pipes/soles.pipe';

/**
 * Tarjeta de juego reutilizable (Semana 8): recibe el juego por una entrada
 * requerida y comunica la intención de compra con una salida tipada.
 */
@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [RouterLink, SolesPipe, StockDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="game-card" [class.agotado]="juego().stock === 0">
      <a class="game-media" [style.--portada]="'url(' + juego().image + ')'" [routerLink]="['/juego', juego().id]" [attr.aria-label]="'Ver detalles de ' + juego().title">
        <img [src]="juego().image" [alt]="'Portada de ' + juego().title" loading="lazy" (error)="imagenRota($event)">
        <span class="tag">{{ juego().category }}</span>
      </a>
      <div class="game-info">
        <h3 class="game-title"><a [routerLink]="['/juego', juego().id]">{{ juego().title }}</a></h3>
        <p class="game-desc">{{ juego().description }}</p>
        <div class="game-bottom">
          <span class="price">{{ juego().price | soles }}</span>
          <span class="stock-pill" [appStock]="juego().stock">{{ textoStock(juego().stock) }}</span>
        </div>
        <button type="button" class="btn btn-primary w-100" [disabled]="juego().stock === 0" (click)="agregar.emit(juego())">
          <i class="fa-solid fa-cart-plus" aria-hidden="true"></i>
          {{ juego().stock === 0 ? 'Sin stock' : 'Añadir' }}
        </button>
      </div>
    </article>
  `
})
export class GameCardComponent {
  readonly juego = input.required<Juego>();
  readonly agregar = output<Juego>();
  protected readonly imagenRota = imagenRota;
  protected readonly textoStock = textoStock;
}
