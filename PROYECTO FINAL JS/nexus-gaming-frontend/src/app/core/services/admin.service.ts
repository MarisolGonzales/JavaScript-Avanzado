import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ClienteResumen, CodigoNodo, Juego, JuegoEditable, Reportes } from '../../shared/models';

/** Operaciones del panel (el servidor vuelve a comprobar el rol en cada una). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  reportes(): Observable<Reportes & { servidores: Record<CodigoNodo, string> }> { return this.http.get<Reportes & { servidores: Record<CodigoNodo, string> }>(`${this.api}/admin/reportes`); }
  clientes(): Observable<ClienteResumen[]> { return this.http.get<ClienteResumen[]>(`${this.api}/admin/clientes`); }

  // --- solo administración ---
  crearJuego(datos: JuegoEditable): Observable<Juego> { return this.http.post<Juego>(`${this.api}/juegos`, datos); }
  actualizarJuego(id: number, datos: Partial<JuegoEditable>): Observable<Juego> { return this.http.put<Juego>(`${this.api}/juegos/${id}`, datos); }
  eliminarJuego(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/juegos/${id}`); }
  ajustarStock(nodo: CodigoNodo, id: number, stock: number): Observable<Juego> { return this.http.put<Juego>(`${this.api}/admin/stock/${nodo}/${id}`, { stock }); }
}
