import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { infoEstado } from '../../core/logic/estados';
import type { CambioEstado } from '../models';

/** Línea de tiempo de la tabla historial_estados (trazabilidad del pedido). */
@Component({
  selector: 'app-timeline-estados',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="timeline" aria-label="Historial de estados del pedido">
      @for (c of historial(); track $index; let ultimo = $last) {
        <li class="timeline-item" [class.actual]="ultimo">
          <span class="timeline-dot"><i class="fa-solid" [class]="icono(c.estadoNuevo)" aria-hidden="true"></i></span>
          <div>
            <strong>{{ etiqueta(c.estadoNuevo) }}</strong>
            @if (c.comentario) { <span class="timeline-nota"> · {{ c.comentario }}</span> }
            <time class="timeline-fecha" [attr.datetime]="c.fecha">{{ c.fecha | date: 'dd/MM/yyyy HH:mm' }}</time>
          </div>
        </li>
      }
    </ol>
  `
})
export class TimelineEstadosComponent {
  readonly historial = input.required<readonly CambioEstado[]>();
  protected readonly etiqueta = (e: CambioEstado['estadoNuevo']): string => infoEstado(e).etiqueta;
  protected readonly icono = (e: CambioEstado['estadoNuevo']): string => infoEstado(e).icono;
}
