import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoCarga } from '../../core/carga';
import { sumarSoles } from '../../core/logic/dinero';
import { ESTADOS_PEDIDO } from '../../core/logic/estados';
import { PedidosService } from '../../core/services/pedidos.service';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge.component';
import type { EstadoPedido, Pedido } from '../../shared/models';
import { EstadoPedidoPipe } from '../../shared/pipes/estado-pedido.pipe';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [RouterLink, DatePipe, SolesPipe, EstadoBadgeComponent, EstadoPedidoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pedidos.component.html'
})
export class PedidosComponent {
  private readonly api = inject(PedidosService);

  protected readonly estado = new EstadoCarga<Pedido[]>();
  protected readonly filtro = signal<EstadoPedido | 'TODOS'>('TODOS');
  protected readonly estados = ESTADOS_PEDIDO;

  protected readonly pedidos = computed(() => this.estado.datos() ?? []);
  protected readonly visibles = computed(() => (this.filtro() === 'TODOS' ? this.pedidos() : this.pedidos().filter((p) => p.estado === this.filtro())));
  protected readonly gastoTotal = computed(() => sumarSoles(...this.pedidos().filter((p) => p.estado !== 'REEMBOLSADO').map((p) => p.total)));
  protected readonly juegosComprados = computed(() => this.pedidos().filter((p) => p.estado === 'ENTREGADO').reduce((n, p) => n + p.items.length, 0));

  constructor() { this.cargar(); }

  protected cargar(): void { this.estado.ejecutar(this.api.listar()); }
  protected cuantos(e: EstadoPedido): number { return this.pedidos().filter((p) => p.estado === e).length; }
}
