import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { EstadoCarga } from '../../core/carga';
import { iniciales } from '../../core/logic/formato';
import { AdminService } from '../../core/services/admin.service';
import type { ClienteResumen } from '../../shared/models';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

type Orden = 'gasto' | 'nombre' | 'reciente';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [DatePipe, SolesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clientes.component.html'
})
export class ClientesComponent {
  private readonly api = inject(AdminService);
  protected readonly datos = new EstadoCarga<ClienteResumen[]>();
  protected readonly texto = signal('');
  protected readonly orden = signal<Orden>('gasto');
  protected readonly iniciales = iniciales;
  protected readonly regiones: Record<string, string> = { NORTE: 'Norte (Trujillo)', SUR: 'Sur (Arequipa)', CENTRO: 'Centro (Cusco)' };

  private readonly todos = computed(() => this.datos.datos() ?? []);
  protected readonly visibles = computed(() => {
    const t = this.texto().trim().toLowerCase();
    const lista = this.todos().filter((c) => !t || c.nombre.toLowerCase().includes(t) || c.email.toLowerCase().includes(t) || c.departamento.toLowerCase().includes(t));
    const cmp: Record<Orden, (a: ClienteResumen, b: ClienteResumen) => number> = {
      gasto: (a, b) => b.gasto - a.gasto, nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'), reciente: (a, b) => b.creadoEn.localeCompare(a.creadoEn)
    };
    return [...lista].sort(cmp[this.orden()]);
  });
  protected readonly conCompras = computed(() => this.todos().filter((c) => c.pedidos > 0).length);
  protected readonly gastoPromedio = computed(() => { const n = this.conCompras(); return n ? this.todos().reduce((s, c) => s + c.gasto, 0) / n : 0; });

  constructor() { this.cargar(); }
  protected cargar(): void { this.datos.ejecutar(this.api.clientes()); }
  protected buscar(e: Event): void { this.texto.set((e.target as HTMLInputElement).value); }
  protected cambiarOrden(e: Event): void { this.orden.set((e.target as HTMLSelectElement).value as Orden); }
}
