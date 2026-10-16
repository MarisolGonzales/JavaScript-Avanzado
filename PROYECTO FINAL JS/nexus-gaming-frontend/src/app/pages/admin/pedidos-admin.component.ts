import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { EstadoCarga } from '../../core/carga';
import { mensajeError } from '../../core/http-error';
import { aCsv, descargarTexto } from '../../core/logic/csv';
import { admiteReembolso, ESTADOS_PEDIDO } from '../../core/logic/estados';
import { imagenRota } from '../../core/logic/imagen';
import { PanelService } from '../../core/services/panel.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { ToastService } from '../../core/services/toast.service';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge.component';
import { TimelineEstadosComponent } from '../../shared/components/timeline-estados.component';
import type { CodigoNodo, EstadoPedido, Pedido } from '../../shared/models';
import { EstadoPedidoPipe } from '../../shared/pipes/estado-pedido.pipe';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

const POR_PAGINA = 8;
const REGIONES: readonly { codigo: CodigoNodo; etiqueta: string }[] = [
  { codigo: 'NORTE', etiqueta: 'Norte (Trujillo)' }, { codigo: 'SUR', etiqueta: 'Sur (Arequipa)' }, { codigo: 'CENTRO', etiqueta: 'Centro (Cusco)' }
];

@Component({
  selector: 'app-pedidos-admin',
  standalone: true,
  imports: [DatePipe, SolesPipe, EstadoBadgeComponent, EstadoPedidoPipe, TimelineEstadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pedidos-admin.component.html'
})
export class PedidosAdminComponent {
  private readonly api = inject(PedidosService);
  private readonly toast = inject(ToastService);
  private readonly panel = inject(PanelService);

  protected readonly datos = new EstadoCarga<Pedido[]>();
  protected readonly estados = ESTADOS_PEDIDO;
  protected readonly regiones = REGIONES;
  protected readonly imagenRota = imagenRota;

  protected readonly texto = signal('');
  protected readonly estado = signal<EstadoPedido | 'TODOS'>('TODOS');
  protected readonly region = signal<CodigoNodo | 'TODAS'>('TODAS');
  protected readonly pagina = signal(1);
  protected readonly seleccionado = signal<Pedido | null>(null);
  protected readonly trabajando = signal(false);
  protected readonly descargando = signal(false);

  private readonly todos = computed(() => this.datos.datos() ?? []);
  protected readonly filtrados = computed(() => {
    const t = this.texto().trim().toLowerCase();
    return this.todos().filter((p) =>
      (this.estado() === 'TODOS' || p.estado === this.estado()) && (this.region() === 'TODAS' || p.nodo === this.region()) &&
      (!t || p.codigo.toLowerCase().includes(t) || p.usuario.toLowerCase().includes(t) || p.comprobante.numeroCompleto.toLowerCase().includes(t)));
  });
  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / POR_PAGINA)));
  protected readonly visibles = computed(() => this.filtrados().slice((this.pagina() - 1) * POR_PAGINA, this.pagina() * POR_PAGINA));
  protected readonly desde = computed(() => (this.filtrados().length ? (this.pagina() - 1) * POR_PAGINA + 1 : 0));
  protected readonly hasta = computed(() => Math.min(this.pagina() * POR_PAGINA, this.filtrados().length));
  protected readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  constructor() { this.cargar(); }

  protected cargar(): void { this.datos.ejecutar(this.api.listar()); }
  protected cuantos(e: EstadoPedido | 'TODOS'): number { return e === 'TODOS' ? this.todos().length : this.todos().filter((p) => p.estado === e).length; }

  protected filtrar(cambio: () => void): void { cambio(); this.pagina.set(1); }
  protected fijarEstado(e: EstadoPedido | 'TODOS'): void { this.estado.set(e); this.pagina.set(1); }
  protected buscar(e: Event): void { this.filtrar(() => this.texto.set((e.target as HTMLInputElement).value)); }
  protected cambiarRegion(e: Event): void { this.filtrar(() => this.region.set((e.target as HTMLSelectElement).value as CodigoNodo | 'TODAS')); }
  protected puedeReembolsar(p: Pedido): boolean { return admiteReembolso(p.estado); }
  protected etiquetaRegion(c: CodigoNodo): string { return REGIONES.find((r) => r.codigo === c)?.etiqueta ?? c; }

  protected reembolsar(p: Pedido): void {
    if (!confirm(`¿Aprobar el reembolso del pedido ${p.codigo}? El juego saldrá de la biblioteca del cliente y se repondrá el stock.`)) return;
    this.trabajando.set(true);
    this.api.cambiarEstado(p.codigo, 'REEMBOLSADO').subscribe({
      next: (nuevo) => {
        this.datos.datos.update((l) => (l ?? []).map((x) => (x.codigo === nuevo.codigo ? nuevo : x)));
        this.seleccionado.set(nuevo); this.trabajando.set(false);
        this.toast.exito(`Pedido ${p.codigo} reembolsado.`);
        this.panel.cargarTickets();
      },
      error: (e: unknown) => { this.trabajando.set(false); this.toast.error(mensajeError(e)); }
    });
  }

  protected pdf(p: Pedido, abrir: boolean): void {
    this.descargando.set(true);
    this.api.descargarPdf(p.codigo, p.comprobante.numeroCompleto, abrir).subscribe({
      next: () => this.descargando.set(false),
      error: (e: unknown) => { this.descargando.set(false); this.toast.error(mensajeError(e)); }
    });
  }

  /** Exporta lo que se está viendo (con los filtros aplicados) a un CSV que abre Excel. */
  protected exportar(): void {
    const filas = this.filtrados().map((p) => [p.codigo, p.fecha, p.usuario, this.etiquetaRegion(p.nodo), p.comprobante.tipo, p.comprobante.numeroCompleto,
      p.comprobante.receptor.documento ?? '', p.comprobante.receptor.nombre ?? '', p.pago.metodo, p.estado, p.comprobante.subtotal.toFixed(2), p.comprobante.igv.toFixed(2), p.total.toFixed(2)]);
    descargarTexto(`pedidos-nexus-${new Date().toISOString().slice(0, 10)}.csv`,
      aCsv(['Pedido', 'Fecha', 'Cliente', 'Región', 'Comprobante', 'Número', 'Documento', 'Receptor', 'Pago', 'Estado', 'Op. gravada', 'IGV', 'Total'], filas));
    this.toast.exito(`Se exportaron ${filas.length} pedidos.`);
  }
}
