import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Lista de departamentos (el servidor es la fuente; esta copia permite usar el formulario sin conexión). */
const RESPALDO = ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín',
  'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'];

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private readonly http = inject(HttpClient);
  readonly departamentos = signal<readonly string[]>(RESPALDO);

  constructor() {
    this.http.get<{ departamentos: string[] }>(`${environment.apiUrl}/departamentos`).subscribe({
      next: (r) => this.departamentos.set(r.departamentos), error: () => undefined
    });
  }
}
