import { ItemCarrito } from './item-carrito.model';

export interface Boleta {
  id: number;
  boleta: string;
  fecha: string;
  hora: string;
  metodoPago: string;
  items: ItemCarrito[];
  subtotal: number;
  total: number;
}
