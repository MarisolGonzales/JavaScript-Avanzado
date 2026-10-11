import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, NgZone, computed, inject, input, signal } from '@angular/core';
import { abreviar } from '../../core/logic/formato';

export interface PuntoGrafico { readonly etiqueta: string; readonly valor: number; }

/**
 * Gráfico de área en SVG puro (sin librerías): línea suavizada con relleno degradado.
 * Los colores salen de variables CSS, así respeta el tema claro y el oscuro.
 */
@Component({
  selector: 'app-area-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="grafico" [attr.viewBox]="'0 0 ' + ancho() + ' ' + ALTO" [attr.height]="ALTO" role="img" [attr.aria-label]="descripcion()">
      <defs>
        <linearGradient [attr.id]="idDegradado" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35" />
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
        </linearGradient>
      </defs>
      @for (g of rejilla(); track g.y) {
        <line [attr.x1]="margen.izq" [attr.x2]="ancho() - margen.der" [attr.y1]="g.y" [attr.y2]="g.y" class="grafico-rejilla" />
        <text [attr.x]="margen.izq - 8" [attr.y]="g.y + 4" text-anchor="end" class="grafico-eje">{{ g.texto }}</text>
      }
      @if (area()) {
        <path [attr.d]="area()" [attr.fill]="'url(#' + idDegradado + ')'" />
        <path [attr.d]="linea()" class="grafico-linea" fill="none" />
      }
      @for (p of puntosXY(); track p.etiqueta; let i = $index) {
        <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3.4" class="grafico-punto"><title>{{ p.etiqueta }}: {{ p.texto }}</title></circle>
        @if (i % paso() === 0 || i === puntosXY().length - 1) {
          <text [attr.x]="p.x" [attr.y]="ALTO - 10" text-anchor="middle" class="grafico-eje">{{ p.etiqueta }}</text>
        }
      }
    </svg>
  `
})
export class AreaChartComponent {
  readonly puntos = input.required<readonly PuntoGrafico[]>();
  readonly prefijoValor = input('S/ ');
  protected readonly margen = { izq: 46, der: 14, arr: 14, abajo: 34 };
  protected readonly ALTO = 270;
  /** Ancho real del contenedor: el SVG se dibuja a 1:1, así el texto no se encoge ni se estira. */
  protected readonly ancho = signal(640);

  constructor() {
    if (typeof ResizeObserver === 'undefined') return; // pruebas sin navegador: se usa el ancho por defecto
    const zona = inject(NgZone);
    const caja = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const observador = new ResizeObserver(([e]) => zona.run(() => this.ancho.set(Math.max(300, Math.round(e.contentRect.width)))));
    observador.observe(caja);
    inject(DestroyRef).onDestroy(() => observador.disconnect());
  }
  protected readonly idDegradado = `deg-${Math.random().toString(36).slice(2, 8)}`;

  private readonly maximo = computed(() => {
    const max = Math.max(0, ...this.puntos().map((p) => p.valor));
    if (max === 0) return 100;
    const magnitud = 10 ** Math.floor(Math.log10(max));
    return Math.ceil(max / magnitud) * magnitud; // techo "redondo" para que los ejes se vean limpios
  });

  protected readonly puntosXY = computed(() => {
    const ps = this.puntos();
    const { izq, der, arr, abajo } = this.margen;
    const ancho = this.ancho() - izq - der;
    const alto = this.ALTO - arr - abajo;
    return ps.map((p, i) => ({
      etiqueta: p.etiqueta, texto: `${this.prefijoValor()}${p.valor.toFixed(2)}`,
      x: izq + (ps.length > 1 ? (i / (ps.length - 1)) * ancho : ancho / 2),
      y: arr + alto - (p.valor / this.maximo()) * alto
    }));
  });

  protected readonly paso = computed(() => Math.max(1, Math.ceil(this.puntos().length / 7)));

  protected readonly rejilla = computed(() => {
    const { arr, abajo } = this.margen;
    const alto = this.ALTO - arr - abajo;
    return [0, 1, 2, 3, 4].map((i) => ({ y: arr + alto - (i / 4) * alto, texto: i === 0 ? '0' : abreviar((this.maximo() / 4) * i) }));
  });

  /** Curva suave: cada tramo es una curva de Bézier con puntos de control a mitad de camino. */
  protected readonly linea = computed(() => {
    const p = this.puntosXY();
    if (p.length === 0) return '';
    return p.reduce((d, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = p[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${d} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
    }, '');
  });

  protected readonly area = computed(() => {
    const p = this.puntosXY();
    if (p.length < 2) return '';
    const base = this.ALTO - this.margen.abajo;
    return `${this.linea()} L ${p[p.length - 1].x} ${base} L ${p[0].x} ${base} Z`;
  });

  protected readonly descripcion = computed(() => {
    const ps = this.puntos();
    const total = ps.reduce((s, p) => s + p.valor, 0);
    return `Gráfico de ventas de ${ps.length} días. Total: ${this.prefijoValor()}${total.toFixed(2)}.`;
  });
}
