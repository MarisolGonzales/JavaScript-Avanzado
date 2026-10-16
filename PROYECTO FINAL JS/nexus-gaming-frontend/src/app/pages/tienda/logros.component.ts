import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoCarga } from '../../core/carga';
import { FavoritosLogrosService } from '../../core/services/favoritos-logros.service';
import { PedidosService } from '../../core/services/pedidos.service';
import type { ElementoBiblioteca } from '../../shared/models';

@Component({
  selector: 'app-logros',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logros.component.html'
})
export class LogrosComponent {
  protected readonly progreso = inject(FavoritosLogrosService);
  protected readonly biblioteca = new EstadoCarga<ElementoBiblioteca[]>();
  protected readonly logros = computed(() => this.progreso.calcularLogros(this.biblioteca.datos()?.length ?? 0));
  protected readonly desbloqueados = computed(() => this.logros().filter((logro) => logro.desbloqueado).length);

  constructor(private readonly pedidos: PedidosService) { this.cargar(); }

  protected cargar(): void { this.biblioteca.ejecutar(this.pedidos.biblioteca()); }
  protected porcentaje(progreso: number, objetivo: number): number { return Math.round((progreso / objetivo) * 100); }
}