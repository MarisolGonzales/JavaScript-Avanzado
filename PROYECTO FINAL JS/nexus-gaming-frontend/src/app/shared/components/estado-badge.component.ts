import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { infoEstado } from '../../core/logic/estados';
import type { EstadoPedido } from '../models';

/** Insignia de estado del pedido con icono Y texto (no depende solo del color). */
@Component({
  selector: 'app-estado-badge',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="estado-badge" [ngClass]="info().clase">
      <i class="fa-solid" [ngClass]="info().icono" aria-hidden="true"></i> {{ info().etiqueta }}
    </span>
  `
})
export class EstadoBadgeComponent {
  readonly estado = input.required<EstadoPedido>();
  protected readonly info = computed(() => infoEstado(this.estado()));
}
