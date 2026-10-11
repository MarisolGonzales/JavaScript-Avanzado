import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface SegmentoDonut { readonly etiqueta: string; readonly valor: number; }

/** Gráfico de dona en SVG: cada segmento es un círculo con trazo parcial (stroke-dasharray). */
@Component({
  selector: 'app-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="donut">
      <svg viewBox="0 0 180 180" role="img" [attr.aria-label]="descripcion()" class="donut-svg">
        <circle cx="90" cy="90" r="64" class="donut-fondo" />
        @for (s of arcos(); track s.etiqueta) {
          <circle cx="90" cy="90" r="64" fill="none" stroke-width="22" [attr.stroke]="s.color"
                  [attr.stroke-dasharray]="s.largo + ' ' + (circunferencia - s.largo)" [attr.stroke-dashoffset]="-s.inicio"
                  transform="rotate(-90 90 90)"><title>{{ s.etiqueta }}: {{ s.porcentaje }} %</title></circle>
        }
        <text x="90" y="86" text-anchor="middle" class="donut-valor">{{ centro() }}</text>
        <text x="90" y="104" text-anchor="middle" class="donut-sub">{{ subcentro() }}</text>
      </svg>
      <ul class="donut-leyenda">
        @for (s of arcos(); track s.etiqueta) {
          <li><span class="punto" [style.background]="s.color"></span><span class="et">{{ s.etiqueta }}</span><strong>{{ s.porcentaje }} %</strong></li>
        }
      </ul>
    </div>
  `
})
export class DonutChartComponent {
  readonly segmentos = input.required<readonly SegmentoDonut[]>();
  readonly centro = input('');
  readonly subcentro = input('');
  protected readonly circunferencia = 2 * Math.PI * 64;
  private readonly colores = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

  protected readonly arcos = computed(() => {
    const segs = this.segmentos().filter((s) => s.valor > 0);
    const total = segs.reduce((s, x) => s + x.valor, 0);
    let acumulado = 0;
    return segs.map((s, i) => {
      const largo = (s.valor / total) * this.circunferencia;
      const arco = { etiqueta: s.etiqueta, largo, inicio: acumulado, color: this.colores[i % this.colores.length], porcentaje: Math.round((s.valor / total) * 100) };
      acumulado += largo;
      return arco;
    });
  });

  protected readonly descripcion = computed(() => `Gráfico de dona: ${this.arcos().map((a) => `${a.etiqueta} ${a.porcentaje} %`).join(', ')}.`);
}
