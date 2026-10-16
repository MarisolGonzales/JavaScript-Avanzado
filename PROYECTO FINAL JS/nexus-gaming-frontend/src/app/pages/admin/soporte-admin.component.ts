import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../core/http-error';
import { hace } from '../../core/logic/formato';
import { AuthService } from '../../core/services/auth.service';
import { PanelService } from '../../core/services/panel.service';
import { TicketsService } from '../../core/services/tickets.service';
import { ToastService } from '../../core/services/toast.service';
import { textoMinimo } from '../../core/validadores';
import type { Ticket } from '../../shared/models';

type Filtro = 'ABIERTOS' | 'RESUELTOS' | 'TODOS';

@Component({
  selector: 'app-soporte-admin',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './soporte-admin.component.html'
})
export class SoporteAdminComponent {
  protected readonly panel = inject(PanelService);
  protected readonly auth = inject(AuthService);
  private readonly api = inject(TicketsService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly filtro = signal<Filtro>('ABIERTOS');
  protected readonly soloReembolsos = signal(false);
  protected readonly seleccionadoId = signal<number | null>(null);
  protected readonly trabajando = signal(false);
  protected readonly hace = hace;
  protected readonly respuesta = this.fb.control('', [Validators.required, textoMinimo(3), Validators.maxLength(1000)]);

  protected readonly visibles = computed(() => this.panel.tickets().filter((t) =>
    (this.filtro() === 'TODOS' || (this.filtro() === 'ABIERTOS' ? t.estado === 'ABIERTO' : t.estado === 'RESUELTO')) && (!this.soloReembolsos() || t.tipo === 'REEMBOLSO')));
  protected readonly seleccionado = computed(() => this.panel.tickets().find((t) => t.id === this.seleccionadoId()) ?? null);

  constructor() { this.panel.cargarTickets(); }

  protected cuantos(f: Filtro): number {
    const l = this.panel.tickets();
    return f === 'TODOS' ? l.length : l.filter((t) => (f === 'ABIERTOS' ? t.estado === 'ABIERTO' : t.estado === 'RESUELTO')).length;
  }

  protected elegir(t: Ticket): void { this.seleccionadoId.set(t.id); this.respuesta.reset(t.respuesta ?? ''); }

  private tras(accion: (t: Ticket) => void, mensaje: string) {
    return {
      next: (t: Ticket) => { this.panel.reemplazar(t); this.trabajando.set(false); this.respuesta.reset(t.respuesta ?? ''); this.toast.exito(mensaje); accion(t); },
      error: (e: unknown) => { this.trabajando.set(false); this.toast.error(mensajeError(e)); }
    };
  }

  protected responder(t: Ticket, resolver: boolean): void {
    if (this.respuesta.invalid) { this.respuesta.markAsTouched(); return; }
    this.trabajando.set(true);
    this.api.responder(t.id, this.respuesta.value.trim(), resolver).subscribe(this.tras(() => undefined, resolver ? 'Respuesta enviada y ticket resuelto.' : 'Respuesta enviada.'));
  }

  protected aprobarReembolso(t: Ticket): void {
    if (!confirm(`¿Aprobar el reembolso del pedido ${t.pedido}? El juego saldrá de la biblioteca del cliente y se repondrá el stock.`)) return;
    this.trabajando.set(true);
    this.api.aprobarReembolso(t.id, this.respuesta.value.trim() || undefined).subscribe(this.tras(() => undefined, `Reembolso de ${t.pedido} aprobado.`));
  }

  protected eliminar(t: Ticket): void {
    if (!confirm(`¿Eliminar el ticket #${t.id}? Esta acción no se puede deshacer.`)) return;
    this.api.eliminar(t.id).subscribe({
      next: () => { this.panel.quitar(t.id); if (this.seleccionadoId() === t.id) this.seleccionadoId.set(null); this.toast.info('Ticket eliminado.'); },
      error: (e: unknown) => this.toast.error(mensajeError(e))
    });
  }
}
