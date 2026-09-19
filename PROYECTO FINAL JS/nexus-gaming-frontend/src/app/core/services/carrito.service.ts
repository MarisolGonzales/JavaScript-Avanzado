import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Juego } from '../../shared/models/juego.model';
import { ItemCarrito } from '../../shared/models/item-carrito.model';

const CLAVE_STORAGE = 'nexus_carrito';

/**
 * Servicio de carrito de compras (Semana 5-9: estado centralizado +
 * inmutabilidad). El estado fuente vive en un BehaviorSubject; los
 * componentes solo lo leen mediante el Observable público y lo modifican
 * a través de los métodos controlados de este servicio (nunca directo).
 */
@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private readonly carrito$ = new BehaviorSubject<ItemCarrito[]>(this.leerDeStorage());

  obtenerCarrito(): Observable<ItemCarrito[]> {
    return this.carrito$.asObservable();
  }

  agregar(juego: Juego): { exito: boolean; mensaje: string } {
    const actual = this.carrito$.value;

    if (actual.some(item => item.id === juego.id)) {
      return { exito: false, mensaje: 'Este juego ya se encuentra en tu carrito.' };
    }

    const nuevoItem: ItemCarrito = {
      id: juego.id,
      titulo: juego.title,
      precio: juego.price,
      imagen: juego.image
    };

    this.actualizar([...actual, nuevoItem]);
    return { exito: true, mensaje: `¡${juego.title} se añadió correctamente al carrito!` };
  }

  quitar(index: number): void {
    const actual = [...this.carrito$.value];
    actual.splice(index, 1);
    this.actualizar(actual);
  }

  vaciar(): void {
    this.actualizar([]);
  }

  calcularTotal(): number {
    return this.carrito$.value.reduce((suma, item) => suma + item.precio, 0);
  }

  obtenerSnapshot(): ItemCarrito[] {
    return this.carrito$.value;
  }

  private actualizar(items: ItemCarrito[]): void {
    this.carrito$.next(items);
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(items));
  }

  private leerDeStorage(): ItemCarrito[] {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_STORAGE) || '[]');
    } catch {
      return [];
    }
  }
}
