import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { generarQr } from '../../core/logic/qr';

/** Dibuja un código QR como SVG. Siempre sobre fondo blanco con margen, para que cualquier cámara lo lea. */
@Component({
  selector: 'app-qr',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="qr" role="img" [attr.aria-label]="etiqueta()" [attr.width]="tamano()" [attr.height]="tamano()"
         [attr.viewBox]="'0 0 ' + lado() + ' ' + lado()" shape-rendering="crispEdges">
      <rect width="100%" height="100%" fill="#fff" rx="1.5"/>
      <path [attr.d]="trazo()" [attr.fill]="color()" [attr.transform]="'translate(' + MARGEN + ' ' + MARGEN + ')'"/>
    </svg>
  `,
  styles: [':host { display: inline-block; line-height: 0; } .qr { border-radius: 10px; box-shadow: 0 0 0 1px rgba(0,0,0,.08); }']
})
export class QrComponent {
  protected readonly MARGEN = 4; // "zona de silencio" que exige el estándar QR
  readonly texto = input.required<string>();
  readonly tamano = input(176);
  readonly color = input('#111111');
  readonly etiqueta = input('Código QR');

  private readonly matriz = computed(() => generarQr(this.texto()));
  protected readonly lado = computed(() => this.matriz().length + this.MARGEN * 2);
  /** Un solo trazo con un cuadradito por cada módulo oscuro: ligero y nítido a cualquier tamaño. */
  protected readonly trazo = computed(() => {
    const partes: string[] = [];
    this.matriz().forEach((fila, y) => fila.forEach((oscuro, x) => { if (oscuro) partes.push(`M${x} ${y}h1v1h-1z`); }));
    return partes.join('');
  });
}
