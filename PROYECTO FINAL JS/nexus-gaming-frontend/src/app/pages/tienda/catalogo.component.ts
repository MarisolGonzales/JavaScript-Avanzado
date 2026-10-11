import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { EstadoCarga } from '../../core/carga';
import { IndiceBusqueda } from '../../core/logic/indice-busqueda';
import { ordenarBurbuja } from '../../core/logic/ordenamiento';
import { CarritoService } from '../../core/services/carrito.service';
import { JuegosService } from '../../core/services/juegos.service';
import { GameCardComponent } from '../../shared/components/game-card.component';
import type { Juego } from '../../shared/models';

type Orden = 'precio-asc' | 'precio-desc' | 'nombre' | 'reciente';

const COMPARADORES: Record<Orden, (a: Juego, b: Juego) => number> = {
  'precio-asc': (a, b) => a.price - b.price,
  'precio-desc': (a, b) => b.price - a.price,
  nombre: (a, b) => a.title.localeCompare(b.title, 'es'),
  reciente: (a, b) => (b.year ?? 0) - (a.year ?? 0)
};

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [GameCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalogo.component.html'
})
export class CatalogoComponent {
  private readonly carrito = inject(CarritoService);
  private readonly api = inject(JuegosService);

  protected readonly estado = new EstadoCarga<Juego[]>();
  protected readonly texto = signal('');
  protected readonly categoria = signal('Todos');
  protected readonly orden = signal<Orden>('precio-asc');
  protected readonly soloDisponibles = signal(false);
  protected readonly esqueleto = [1, 2, 3, 4, 5, 6, 7, 8];

  private readonly juegos = computed(() => this.estado.datos() ?? []);
  protected readonly categorias = computed(() => ['Todos', ...new Set(this.juegos().map((j) => j.category))]);

  /** El índice (tabla hash) se reconstruye solo cuando cambia el catálogo. */
  private readonly indice = computed(() => new IndiceBusqueda(
    this.juegos().map((j) => ({ id: j.id, texto: `${j.title} ${j.category} ${j.description} ${j.developer ?? ''}` }))));

  protected readonly resultado = computed(() => {
    const ids = this.indice().buscar(this.texto());
    const cat = this.categoria();
    const filtrados = this.juegos().filter((j) => ids.has(j.id) && (cat === 'Todos' || j.category === cat) && (!this.soloDisponibles() || j.stock > 0));
    return ordenarBurbuja(filtrados, COMPARADORES[this.orden()]);
  });

  constructor() { this.cargar(); }

  protected cargar(): void { this.estado.ejecutar(this.api.listar()); }
  protected escribir(e: Event): void { this.texto.set((e.target as HTMLInputElement).value); }
  protected cambiarOrden(e: Event): void { this.orden.set((e.target as HTMLSelectElement).value as Orden); }
  protected alternarDisponibles(e: Event): void { this.soloDisponibles.set((e.target as HTMLInputElement).checked); }
  protected agregar(j: Juego): void { this.carrito.agregarConAviso(j); }
  protected limpiar(): void { this.texto.set(''); this.categoria.set('Todos'); this.soloDisponibles.set(false); }
}
