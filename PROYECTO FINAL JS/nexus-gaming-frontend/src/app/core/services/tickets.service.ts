import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ticket } from '../../shared/models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private readonly baseUrl = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) { }

  obtenerTodos(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.baseUrl);
  }

  crear(asunto: string, mensaje: string): Observable<Ticket> {
    return this.http.post<Ticket>(this.baseUrl, { asunto, mensaje });
  }

  marcarResuelto(id: number): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}/resolver`, {});
  }
}
