import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Boleta } from '../../shared/models/boleta.model';
import { ItemCarrito } from '../../shared/models/item-carrito.model';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private readonly baseUrl = `${environment.apiUrl}/historial`;

  constructor(private http: HttpClient) { }

  obtenerTodas(): Observable<Boleta[]> {
    return this.http.get<Boleta[]>(this.baseUrl);
  }

  registrarCompra(items: ItemCarrito[], total: number, metodoPago: string): Observable<Boleta> {
    return this.http.post<Boleta>(this.baseUrl, {
      items,
      subtotal: total,
      total,
      metodoPago
    });
  }
}
