import { Component, OnInit } from '@angular/core';
import { Juego } from '../../shared/models/juego.model';
import { JuegosService } from '../../core/services/juegos.service';
import { CarritoService } from '../../core/services/carrito.service';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.scss'
})
export class CatalogoComponent implements OnInit {
  todosLosJuegos: Juego[] = [];
  juegosFiltrados: Juego[] = [];
  categorias: string[] = ['Todos'];
  categoriaActiva = 'Todos';
  textoBusqueda = '';
  juegoSeleccionado: Juego | null = null;

  /**
   * HASH TABLE (Map) para indexar la búsqueda.
   * Cada palabra clave del título/categoría/descripción apunta a un
   * Set con los IDs de los juegos donde aparece, para no recorrer todo
   * el catálogo en cada tecla que el usuario escribe.
   */
  private indiceBusqueda = new Map<string, Set<number>>();

  constructor(
    private juegosService: JuegosService,
    private carritoService: CarritoService
  ) { }

  ngOnInit(): void {
    this.juegosService.obtenerTodos().subscribe(juegos => {
      this.todosLosJuegos = juegos;
      this.categorias = ['Todos', ...new Set(juegos.map(j => j.category))];
      this.construirIndiceBusqueda(juegos);
      this.aplicarFiltros();
    });
  }

  private construirIndiceBusqueda(juegos: Juego[]): void {
    juegos.forEach(juego => {
      const texto = `${juego.title} ${juego.category} ${juego.description}`.toLowerCase();
      const palabras = texto.split(/[^a-záéíóúñ0-9]+/).filter(Boolean);

      palabras.forEach(palabra => {
        if (!this.indiceBusqueda.has(palabra)) {
          this.indiceBusqueda.set(palabra, new Set());
        }
        this.indiceBusqueda.get(palabra)!.add(juego.id);
      });
    });
  }

  private buscarEnIndice(texto: string): Set<number> {
    const termino = texto.toLowerCase().trim();
    if (termino === '') {
      return new Set(this.todosLosJuegos.map(j => j.id));
    }

    const idsCoincidentes = new Set<number>();
    for (const [palabra, ids] of this.indiceBusqueda) {
      if (palabra.includes(termino)) {
        ids.forEach(id => idsCoincidentes.add(id));
      }
    }
    return idsCoincidentes;
  }

  /**
   * ORDENAMIENTO BURBUJA (bubble sort): ordena los resultados filtrados
   * por precio de menor a mayor con el algoritmo clásico de intercambio
   * por pares adyacentes.
   */
  private ordenarPorPrecioBurbuja(lista: Juego[]): Juego[] {
    const arreglo = [...lista];
    const n = arreglo.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        if (arreglo[j].price > arreglo[j + 1].price) {
          [arreglo[j], arreglo[j + 1]] = [arreglo[j + 1], arreglo[j]];
        }
      }
    }
    return arreglo;
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaActiva = categoria;
    this.aplicarFiltros();
  }

  onBuscar(): void {
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let resultado = this.categoriaActiva === 'Todos'
      ? this.todosLosJuegos
      : this.todosLosJuegos.filter(j => j.category === this.categoriaActiva);

    if (this.textoBusqueda.trim() !== '') {
      const idsCoincidentes = this.buscarEnIndice(this.textoBusqueda);
      resultado = resultado.filter(j => idsCoincidentes.has(j.id));
    }

    this.juegosFiltrados = this.ordenarPorPrecioBurbuja(resultado);
  }

  abrirDetalle(juego: Juego): void {
    this.juegoSeleccionado = juego;
  }

  cerrarDetalle(): void {
    this.juegoSeleccionado = null;
  }

  agregarAlCarrito(juego: Juego): void {
    const resultado = this.carritoService.agregar(juego);
    alert(resultado.mensaje);
    this.juegoSeleccionado = null;
  }
}
