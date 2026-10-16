import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { EstadoCarga } from '../../core/carga';
import { mensajeError } from '../../core/http-error';
import { imagenRota } from '../../core/logic/imagen';
import { AdminService } from '../../core/services/admin.service';
import { JuegosService } from '../../core/services/juegos.service';
import { ToastService } from '../../core/services/toast.service';
import { textoMinimo } from '../../core/validadores';
import { StockDirective } from '../../shared/directives/stock.directive';
import type { CodigoNodo, Juego, JuegoEditable } from '../../shared/models';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

const SERVIDORES: readonly { codigo: CodigoNodo; etiqueta: string }[] = [
  { codigo: 'NORTE', etiqueta: 'Norte' }, { codigo: 'SUR', etiqueta: 'Sur' }, { codigo: 'CENTRO', etiqueta: 'Centro' }
];

@Component({
  selector: 'app-catalogo-admin',
  standalone: true,
  imports: [ReactiveFormsModule, SolesPipe, StockDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalogo-admin.component.html'
})
export class CatalogoAdminComponent {
  private readonly api = inject(AdminService);
  private readonly juegosApi = inject(JuegosService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly datos = new EstadoCarga<Juego[]>();
  protected readonly servidores = SERVIDORES;
  protected readonly imagenRota = imagenRota;
  protected readonly editando = signal<number | 'nuevo' | null>(null);
  protected readonly borradorStock = signal<Readonly<Record<string, number>>>({});
  protected readonly texto = signal('');
  protected readonly filtrados = computed(() => {
    const t = this.texto().trim().toLowerCase();
    return (this.datos.datos() ?? []).filter((j) => !t || j.title.toLowerCase().includes(t) || j.category.toLowerCase().includes(t));
  });

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, textoMinimo(2), Validators.maxLength(120)]],
    price: [0, [Validators.required, Validators.min(0), Validators.max(9999)]],
    category: ['', [Validators.required, textoMinimo(2), Validators.maxLength(40)]],
    description: ['', Validators.maxLength(600)],
    image: ['assets/img/nexus-icon.png', Validators.maxLength(200)],
    developer: ['', Validators.maxLength(80)],
    year: this.fb.control<number | null>(null, [Validators.min(1970), Validators.max(2100)]),
    stockInicial: [25, [Validators.required, Validators.min(0), Validators.max(100000)]]
  });

  constructor() { this.cargar(); }

  protected cargar(): void { this.datos.ejecutar(this.juegosApi.listar()); }
  protected buscar(e: Event): void { this.texto.set((e.target as HTMLInputElement).value); }

  // ----- stock por servidor regional -----
  protected stock(j: Juego, nodo: CodigoNodo): number { return this.borradorStock()[`${j.id}-${nodo}`] ?? j.stockPorNodo?.[nodo] ?? 0; }
  protected total(j: Juego): number { return SERVIDORES.reduce((s, x) => s + this.stock(j, x.codigo), 0); }
  protected editarStock(j: Juego, nodo: CodigoNodo, e: Event): void {
    const n = Math.max(0, Math.trunc(Number((e.target as HTMLInputElement).value) || 0));
    this.borradorStock.update((b) => ({ ...b, [`${j.id}-${nodo}`]: n }));
  }
  protected hayCambios(j: Juego): boolean { return SERVIDORES.some((s) => this.stock(j, s.codigo) !== (j.stockPorNodo?.[s.codigo] ?? 0)); }

  protected guardarStock(j: Juego): void {
    const cambios = SERVIDORES.filter((s) => this.stock(j, s.codigo) !== (j.stockPorNodo?.[s.codigo] ?? 0));
    if (!cambios.length) return;
    forkJoin(cambios.map((s) => this.api.ajustarStock(s.codigo, j.id, this.stock(j, s.codigo)))).subscribe({
      next: () => {
        this.borradorStock.update((b) => Object.fromEntries(Object.entries(b).filter(([k]) => !k.startsWith(`${j.id}-`))));
        this.toast.exito(`Stock de ${j.title} actualizado.`);
        this.cargar();
      },
      error: (e: unknown) => this.toast.error(mensajeError(e))
    });
  }

  // ----- alta, edición y baja -----
  protected nuevo(): void {
    this.form.reset({ title: '', price: 0, category: '', description: '', image: 'assets/img/nexus-icon.png', developer: '', year: null, stockInicial: 25 });
    this.editando.set('nuevo');
  }
  protected editar(j: Juego): void {
    this.form.reset({ title: j.title, price: j.price, category: j.category, description: j.description, image: j.image, developer: j.developer ?? '', year: j.year, stockInicial: 25 });
    this.editando.set(j.id);
  }
  protected cancelar(): void { this.editando.set(null); }
  protected invalido(c: keyof typeof this.form.controls): boolean { const x = this.form.controls[c]; return x.invalid && x.touched; }

  protected guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const datos: JuegoEditable = { ...this.form.getRawValue() };
    const id = this.editando();
    const peticion = id === 'nuevo' ? this.api.crearJuego(datos)
      : (() => { const { stockInicial: _omitido, ...catalogo } = datos; return this.api.actualizarJuego(id as number, catalogo); })();
    peticion.subscribe({
      next: (j) => {
        this.toast.exito(id === 'nuevo' ? `${j.title} se creó y se replicó a los 3 servidores.` : `${j.title} se actualizó (las licencias de cada servidor se conservan).`);
        this.editando.set(null);
        this.cargar();
      },
      error: (e: unknown) => this.toast.error(mensajeError(e))
    });
  }

  protected baja(j: Juego): void {
    if (!confirm(`¿Dar de baja "${j.title}"? Los pedidos anteriores se conservan.`)) return;
    this.api.eliminarJuego(j.id).subscribe({
      next: () => { this.toast.exito(`${j.title} se dio de baja.`); this.cargar(); },
      error: (e: unknown) => this.toast.error(mensajeError(e))
    });
  }
}
