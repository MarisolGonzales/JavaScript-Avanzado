import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoCarga } from '../../core/carga';
import { imagenRota } from '../../core/logic/imagen';
import { FavoritosLogrosService } from '../../core/services/favoritos-logros.service';
import { JuegosService } from '../../core/services/juegos.service';
import type { Juego } from '../../shared/models';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [RouterLink, SolesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './favoritos.component.html'
})
export class FavoritosComponent {
  protected readonly progreso = inject(FavoritosLogrosService);
  protected readonly estado = new EstadoCarga<Juego[]>();
  protected readonly imagenRota = imagenRota;
  protected readonly juegos = computed(() => {
    const ids = new Set(this.progreso.favoritos());
    return (this.estado.datos() ?? []).filter((juego) => ids.has(juego.id));
  });

  constructor(private readonly api: JuegosService) { this.cargar(); }

  protected cargar(): void { this.estado.ejecutar(this.api.listar()); }
  protected quitar(juego: Juego): void { this.progreso.alternar(juego.id); }
}