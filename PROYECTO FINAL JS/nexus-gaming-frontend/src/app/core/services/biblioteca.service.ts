import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ItemCarrito } from '../../shared/models/item-carrito.model';
import { JuegoBiblioteca } from '../../shared/models/juego-biblioteca.model';

const CLAVE_STORAGE = 'nexus_biblioteca';

/**
 * Biblioteca personal del jugador. Se guarda en localStorage porque
 * pertenece únicamente al navegador/sesión actual (igual que en la
 * versión anterior del proyecto), mientras que el catálogo y las
 * boletas sí viven en el backend de Express.
 */
@Injectable({
  providedIn: 'root'
})
export class BibliotecaService {
  private readonly biblioteca$ = new BehaviorSubject<JuegoBiblioteca[]>(this.leerDeStorage());

  obtenerBiblioteca(): Observable<JuegoBiblioteca[]> {
    return this.biblioteca$.asObservable();
  }

  agregarItems(items: ItemCarrito[]): void {
    const actual = [...this.biblioteca$.value];

    items.forEach(item => {
      const yaExiste = actual.some(j => j.id === item.id);
      if (!yaExiste) {
        actual.push({
          id: item.id,
          titulo: item.titulo,
          imagen: item.imagen,
          fechaAdquisicion: new Date().toLocaleDateString('es-PE')
        });
      }
    });

    this.biblioteca$.next(actual);
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(actual));
  }

  private leerDeStorage(): JuegoBiblioteca[] {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_STORAGE) || '[]');
    } catch {
      return [];
    }
  }
}
