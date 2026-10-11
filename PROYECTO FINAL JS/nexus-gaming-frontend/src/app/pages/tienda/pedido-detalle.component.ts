import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoCarga } from '../../core/carga';
import { mensajeError } from '../../core/http-error';
import { DIAS_REEMBOLSO, dentroDePlazoReembolso } from '../../core/logic/documentos';
import { admiteReembolso } from '../../core/logic/estados';
import { imagenRota } from '../../core/logic/imagen';
import { PedidosService } from '../../core/services/pedidos.service';
import { ToastService } from '../../core/services/toast.service';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge.component';
import { TimelineEstadosComponent } from '../../shared/components/timeline-estados.component';
import type { Pedido } from '../../shared/models';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [RouterLink, DatePipe, SolesPipe, EstadoBadgeComponent, TimelineEstadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pedido-detalle.component.html'
})
export class PedidoDetalleComponent {
  /** Parámetro de ruta /pedidos/:codigo y parámetro ?nuevo=1 (withComponentInputBinding). */
  readonly codigo = input.required<string>();
  readonly nuevo = input<string>();

  private readonly api = inject(PedidosService);
  private readonly toast = inject(ToastService);

  protected readonly estado = new EstadoCarga<Pedido>();
  protected readonly descargando = signal(false);
  protected readonly visibles = signal<ReadonlySet<string>>(new Set());
  protected readonly imagenRota = imagenRota;
  protected readonly diasReembolso = DIAS_REEMBOLSO;
  protected readonly pedido = computed(() => this.estado.datos());
  protected readonly puedeReembolso = computed(() => {
    const p = this.pedido();
    return !!p && admiteReembolso(p.estado) && dentroDePlazoReembolso(p.fecha);
  });

  constructor() {
    effect(() => { const c = this.codigo(); untracked(() => this.estado.ejecutar(this.api.obtener(c))); });
  }

  protected descargar(abrir: boolean): void {
    const p = this.pedido();
    if (!p || this.descargando()) return;
    this.descargando.set(true);
    this.api.descargarPdf(p.codigo, p.comprobante.numeroCompleto, abrir).subscribe({
      next: () => { this.descargando.set(false); if (!abrir) this.toast.exito(`Comprobante ${p.comprobante.numeroCompleto} descargado.`); },
      error: (e: unknown) => { this.descargando.set(false); this.toast.error(mensajeError(e)); }
    });
  }

  protected alternar(llave: string): void {
    this.visibles.update((s) => { const n = new Set(s); if (n.has(llave)) n.delete(llave); else n.add(llave); return n; });
  }

  protected async copiar(clave: string): Promise<void> {
    try { await navigator.clipboard.writeText(clave); this.toast.exito('Clave copiada al portapapeles.'); }
    catch { this.toast.error('No se pudo copiar. Selecciónala y copia manualmente.'); }
  }

  protected imprimir(): void { window.print(); }
  protected oculta(clave: string): string { return clave.replace(/[A-Z0-9]/g, (c, i) => (i < 5 ? c : '•')); }
}
