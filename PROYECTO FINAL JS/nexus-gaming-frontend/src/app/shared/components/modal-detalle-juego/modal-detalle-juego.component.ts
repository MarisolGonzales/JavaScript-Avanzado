import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Juego } from '../../models/juego.model';

/**
 * Modal de detalles del juego, reutilizado por Home y Catálogo.
 * Se muestra únicamente cuando `juego` no es null (composición de
 * componentes en vez de manipular el DOM directamente).
 */
@Component({
  selector: 'app-modal-detalle-juego',
  templateUrl: './modal-detalle-juego.component.html',
  styleUrl: './modal-detalle-juego.component.scss'
})
export class ModalDetalleJuegoComponent {
  @Input() juego: Juego | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() comprar = new EventEmitter<Juego>();

  onFondoClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrar.emit();
    }
  }

  manejarErrorImagen(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect width="400" height="225" fill="#14141b"/><text x="50%" y="50%" font-family="Arial" font-size="13" fill="#5c5c68" text-anchor="middle" dominant-baseline="middle">Imagen no disponible</text></svg>'
    );
  }
}
