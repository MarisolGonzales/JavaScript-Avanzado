import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Ticket, TipoTicket } from '../../shared/models';

/** Soporte: tickets del cliente y gestión del personal. */
@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tickets`;

  crear(datos: { asunto: string; mensaje: string; tipo: TipoTicket; pedido?: string }): Observable<Ticket> { return this.http.post<Ticket>(this.url, datos); }
  mios(): Observable<Ticket[]> { return this.http.get<Ticket[]>(`${this.url}/mios`); }

  // --- personal ---
  todos(): Observable<Ticket[]> { return this.http.get<Ticket[]>(this.url); }
  responder(id: number, respuesta: string, resolver = true): Observable<Ticket> { return this.http.patch<Ticket>(`${this.url}/${id}/responder`, { respuesta, resolver }); }
  aprobarReembolso(id: number, respuesta?: string): Observable<Ticket> { return this.http.post<Ticket>(`${this.url}/${id}/reembolso`, { respuesta }); }
  eliminar(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
