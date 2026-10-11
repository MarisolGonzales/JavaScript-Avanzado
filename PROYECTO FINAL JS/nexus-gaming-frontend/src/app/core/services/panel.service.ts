import { Injectable, computed, inject, signal } from '@angular/core';
import { TicketsService } from './tickets.service';
import type { Ticket } from '../../shared/models';

/**
 * Estado compartido del panel de administración: la barra lateral (insignia),
 * la campana y las pantallas de soporte leen los mismos tickets.
 */
@Injectable({ providedIn: 'root' })
export class PanelService {
  private readonly api = inject(TicketsService);
  readonly tickets = signal<readonly Ticket[]>([]);
  readonly abiertos = computed(() => this.tickets().filter((t) => t.estado === 'ABIERTO'));

  cargarTickets(): void {
    this.api.todos().subscribe({ next: (t) => this.tickets.set(t), error: () => undefined });
  }

  reemplazar(ticket: Ticket): void {
    this.tickets.update((l) => l.map((t) => (t.id === ticket.id ? ticket : t)));
  }

  quitar(id: number): void { this.tickets.update((l) => l.filter((t) => t.id !== id)); }
}
