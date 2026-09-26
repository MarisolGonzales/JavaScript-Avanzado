import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Juego } from '../../shared/models/juego.model';

/**
 * Servicio de catálogo (Semana 9): encapsula la comunicación HTTP con el
 * backend de Express, devolviendo Observables que los componentes
 * consumen con el pipe `async` en la plantilla.
 */
@Injectable({
  providedIn: 'root'
})
export class JuegosService {
  private readonly baseUrl = `${environment.apiUrl}/juegos`;

  constructor(private http: HttpClient) { }

  obtenerTodos(): Observable<Juego[]> {
    return this.http.get<Juego[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Juego> {
    return this.http.get<Juego>(`${this.baseUrl}/${id}`);
  }
}
