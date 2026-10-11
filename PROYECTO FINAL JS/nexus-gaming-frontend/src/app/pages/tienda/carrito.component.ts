import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { desglosarIgv } from '../../core/logic/dinero';
import { imagenRota } from '../../core/logic/imagen';
import { AuthService } from '../../core/services/auth.service';
import { CarritoService } from '../../core/services/carrito.service';
import type { ItemCarrito } from '../../shared/models';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [RouterLink, SolesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './carrito.component.html'
})
export class CarritoComponent {
  protected readonly carrito = inject(CarritoService);
  protected readonly auth = inject(AuthService);
  protected readonly imagenRota = imagenRota;
  protected readonly desglose = computed(() => desglosarIgv(this.carrito.total()));

  protected quitar(item: ItemCarrito): void { this.carrito.quitar(item.idJuego, item.tipoEntrega); }
  protected alternarRegalo(item: ItemCarrito): void { this.carrito.cambiarTipo(item.idJuego, item.tipoEntrega); }
  protected vaciar(): void { if (confirm('¿Vaciar todo el carrito?')) this.carrito.vaciar(); }
}
