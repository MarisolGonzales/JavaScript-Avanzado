import { Pipe, PipeTransform } from '@angular/core';
import { infoEstado } from '../../core/logic/estados';
import type { EstadoPedido } from '../models';

/** {{ pedido.estado | estadoPedido }}  ->  "En reparto", "Entregado"... */
@Pipe({ name: 'estadoPedido', standalone: true })
export class EstadoPedidoPipe implements PipeTransform {
  transform(estado: EstadoPedido): string {
    return infoEstado(estado).etiqueta;
  }
}
