import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoCarga } from '../../core/carga';
import { abreviar, diaCorto, hace } from '../../core/logic/formato';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { PanelService } from '../../core/services/panel.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { AreaChartComponent } from '../../shared/charts/area-chart.component';
import { BarListComponent } from '../../shared/charts/bar-list.component';
import { DonutChartComponent } from '../../shared/charts/donut-chart.component';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge.component';
import { StockDirective } from '../../shared/directives/stock.directive';
import type { Pedido, Reportes } from '../../shared/models';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

interface Actividad { icono: string; clase: string; texto: string; fecha: string; enlace: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, SolesPipe, AreaChartComponent, DonutChartComponent, BarListComponent, EstadoBadgeComponent, StockDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);
  protected readonly panel = inject(PanelService);
  private readonly admin = inject(AdminService);
  private readonly pedidosApi = inject(PedidosService);

  protected readonly reportes = new EstadoCarga<Reportes>();
  protected readonly pedidos = new EstadoCarga<Pedido[]>();
  protected readonly dias = signal<7 | 14>(14);

  protected readonly r = computed(() => this.reportes.datos());
  protected readonly puntos = computed(() => (this.r()?.ventasPorDia ?? []).slice(-this.dias()).map((d) => ({ etiqueta: diaCorto(d.fecha), valor: d.ingresos })));
  protected readonly totalPeriodo = computed(() => this.puntos().reduce((s, p) => s + p.valor, 0));
  protected readonly categorias = computed(() => (this.r()?.ventasPorCategoria ?? []).map((c) => ({ etiqueta: c.categoria, valor: c.ingresos })));
  protected readonly regiones = computed(() => (this.r()?.ventasPorNodo ?? []).map((v) => ({ etiqueta: v.etiqueta, valor: v.ingresos, detalle: `${v.pedidosValidos} pedidos` })));
  protected readonly top = computed(() => (this.r()?.topJuegos ?? []).map((t) => ({ etiqueta: t.titulo, valor: t.ingresos, detalle: `${t.unidades} ${t.unidades === 1 ? 'licencia' : 'licencias'}` })));
  protected readonly recientes = computed(() => (this.pedidos.datos() ?? []).slice(0, 6));
  protected readonly centroDonut = computed(() => `S/ ${abreviar(this.categorias().reduce((s, c) => s + c.valor, 0))}`);

  /** Panel derecho: mezcla de los últimos pedidos y tickets, del más nuevo al más antiguo. */
  protected readonly actividad = computed<Actividad[]>(() => {
    const deP = (this.pedidos.datos() ?? []).slice(0, 8).map((p): Actividad => ({
      icono: p.estado === 'REEMBOLSADO' ? 'fa-rotate-left' : 'fa-bag-shopping', clase: p.estado === 'REEMBOLSADO' ? 'peligro' : 'exito',
      texto: p.estado === 'REEMBOLSADO' ? `Pedido ${p.codigo} reembolsado` : `Nueva compra ${p.codigo} por S/ ${p.total.toFixed(2)}`,
      fecha: p.fecha, enlace: '/admin/pedidos'
    }));
    const deT = this.panel.tickets().slice(0, 8).map((t): Actividad => ({
      icono: t.tipo === 'REEMBOLSO' ? 'fa-rotate-left' : 'fa-headset', clase: t.estado === 'ABIERTO' ? 'aviso' : 'info',
      texto: `${t.tipo === 'REEMBOLSO' ? 'Solicitud de reembolso' : 'Consulta'}: ${t.asunto}`, fecha: t.fecha, enlace: '/admin/soporte'
    }));
    return [...deP, ...deT].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 7);
  });

  protected readonly hace = hace;

  constructor() {
    this.cargar();
    this.panel.cargarTickets();
  }

  protected cargar(): void {
    this.reportes.ejecutar(this.admin.reportes());
    this.pedidos.ejecutar(this.pedidosApi.listar());
  }
}
