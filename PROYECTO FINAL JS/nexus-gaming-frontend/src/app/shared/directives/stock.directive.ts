import { Directive, computed, input } from '@angular/core';

export const UMBRAL_STOCK_BAJO = 5;

/**
 * DIRECTIVA DE ATRIBUTO (Semana 7): añade al elemento clases y un atributo
 * data-stock según las unidades disponibles. La entrada es requerida y usa
 * el mismo nombre que el selector (alias).
 *   <span [appStock]="juego.stock">...</span>
 */
@Directive({
  selector: '[appStock]',
  standalone: true,
  host: {
    '[class.stock-agotado]': 'agotado()',
    '[class.stock-bajo]': 'bajo()',
    '[class.stock-ok]': 'disponible()',
    '[attr.data-stock]': 'nivel()'
  }
})
export class StockDirective {
  readonly unidades = input.required<number>({ alias: 'appStock' });

  protected readonly agotado = computed(() => this.unidades() <= 0);
  protected readonly bajo = computed(() => this.unidades() > 0 && this.unidades() <= UMBRAL_STOCK_BAJO);
  protected readonly disponible = computed(() => this.unidades() > UMBRAL_STOCK_BAJO);
  protected readonly nivel = computed(() => (this.agotado() ? 'agotado' : this.bajo() ? 'bajo' : 'ok'));
}

export function textoStock(unidades: number): string {
  if (unidades <= 0) return 'Agotado';
  if (unidades <= UMBRAL_STOCK_BAJO) return `¡Últimas ${unidades}!`;
  return 'Disponible';
}
