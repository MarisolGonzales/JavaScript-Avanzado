import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ElementoBiblioteca, EstadoPedido, NuevoPedido, Pedido } from '../../shared/models';

/** Pedidos: compra, consulta, trazabilidad, comprobantes y biblioteca (Semana 10). */
@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pedidos`;

  crear(pedido: NuevoPedido): Observable<Pedido> { return this.http.post<Pedido>(this.url, pedido); }

  /** Mis pedidos (cliente) o todos (personal), con filtros opcionales. */
  listar(filtros: { estado?: EstadoPedido } = {}): Observable<Pedido[]> {
    let params = new HttpParams();
    if (filtros.estado) params = params.set('estado', filtros.estado);
    return this.http.get<Pedido[]>(this.url, { params });
  }

  obtener(codigo: string): Observable<Pedido> { return this.http.get<Pedido>(`${this.url}/${encodeURIComponent(codigo)}`); }

  /** Solo personal. */
  cambiarEstado(codigo: string, estado: EstadoPedido, comentario?: string): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.url}/${encodeURIComponent(codigo)}/estado`, { estado, comentario });
  }

  biblioteca(): Observable<ElementoBiblioteca[]> { return this.http.get<ElementoBiblioteca[]>(`${environment.apiUrl}/biblioteca`); }

  /** Descarga el comprobante (boleta o factura) como PDF. Va por HttpClient para enviar el token de sesión. */
  pdf(codigo: string): Observable<Blob> {
    return this.http.get(`${this.url}/${encodeURIComponent(codigo)}/comprobante.pdf`, { responseType: 'blob' });
  }

  /** Pide el PDF y lo guarda en el equipo (o lo abre en otra pestaña). */
  descargarPdf(codigo: string, nombreArchivo: string, abrir = false): Observable<void> {
    return this.pdf(codigo).pipe(map((blob) => {
      const url = URL.createObjectURL(blob);
      if (abrir) window.open(url, '_blank', 'noopener');
      else {
        const a = document.createElement('a');
        a.href = url; a.download = `${nombreArchivo}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }));
  }
}
