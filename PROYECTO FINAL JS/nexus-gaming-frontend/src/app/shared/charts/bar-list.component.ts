import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatoSoles } from '../../core/logic/formato';

export interface BarraDato { readonly etiqueta: string; readonly valor: number; readonly detalle?: string; }

/** Barras horizontales comparativas (ingresos por región, juegos más vendidos…). */
@Component({
  selector: 'app-bar-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="barras">
      @for (d of filas(); track d.etiqueta) {
        <li>
          <div class="barra-cab"><span>{{ d.etiqueta }}</span><strong>{{ d.texto }}</strong></div>
          <div class="barra-pista" role="img" [attr.aria-label]="d.etiqueta + ': ' + d.texto + ' (' + d.porcentaje + ' % del mayor)'">
            <div class="barra-relleno" [style.width.%]="d.porcentaje"></div>
          </div>
          @if (d.detalle) { <span class="muted small">{{ d.detalle }}</span> }
        </li>
      } @empty { <li class="muted">Sin datos todavía.</li> }
    </ul>
  `
})
export class BarListComponent {
  readonly datos = input.required<readonly BarraDato[]>();
  readonly moneda = input(true);

  protected readonly filas = computed(() => {
    const max = Math.max(1, ...this.datos().map((d) => d.valor));
    return this.datos().map((d) => ({ ...d, porcentaje: Math.round((d.valor / max) * 100), texto: this.moneda() ? formatoSoles(d.valor) : String(d.valor) }));
  });
}
