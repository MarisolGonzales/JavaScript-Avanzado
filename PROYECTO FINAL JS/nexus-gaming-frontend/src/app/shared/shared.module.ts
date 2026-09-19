import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolesPipe } from './pipes/soles.pipe';
import { ModalDetalleJuegoComponent } from './components/modal-detalle-juego/modal-detalle-juego.component';

/**
 * Módulo compartido (Semana 7): agrupa piezas reutilizables de forma
 * transversal (pipes, componentes, directivas) para que cada módulo de
 * funcionalidad cargado de forma perezosa pueda importarlas sin
 * duplicar código.
 */
@NgModule({
  declarations: [SolesPipe, ModalDetalleJuegoComponent],
  imports: [CommonModule],
  exports: [SolesPipe, CommonModule, ModalDetalleJuegoComponent]
})
export class SharedModule { }
