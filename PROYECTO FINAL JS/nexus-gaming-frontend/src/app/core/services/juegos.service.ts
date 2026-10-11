import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Juego } from '../../shared/models';

/** Catálogo (Semana 9: consumo de servicios HTTP con Observables). */
@Injectable({ providedIn: 'root' })
export class JuegosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/juegos`;

  listar(): Observable<Juego[]> { return this.http.get<Juego[]>(this.url); }
  obtener(id: number): Observable<Juego> { return this.http.get<Juego>(`${this.url}/${id}`); }
}
