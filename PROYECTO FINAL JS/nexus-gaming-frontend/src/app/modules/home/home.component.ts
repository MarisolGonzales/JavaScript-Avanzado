import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { Juego } from '../../shared/models/juego.model';
import { JuegosService } from '../../core/services/juegos.service';
import { CarritoService } from '../../core/services/carrito.service';

interface HeroSlide {
  juego: Juego;
  imagenHero: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  juegos: Juego[] = [];
  slides: HeroSlide[] = [];
  indiceActual = 0;
  juegoSeleccionado: Juego | null = null;
  cargando = true;
  errorConexion = false;

  private suscripcionAutoplay?: Subscription;

  constructor(
    private juegosService: JuegosService,
    private carritoService: CarritoService
  ) { }

  ngOnInit(): void {
    this.juegosService.obtenerTodos().subscribe({
      next: (juegos) => {
        this.juegos = juegos;
        // Los primeros 3 juegos del catálogo arman el carrusel del hero.
        // Se usa el "banner" (key art ancha) si el juego tiene uno propio;
        // si no, se cae de vuelta a la imagen normal de tarjeta.
        this.slides = juegos.slice(0, 3).map(juego => ({
          juego,
          imagenHero: juego.banner || juego.image
        }));
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al conectar con la API de juegos:', err);
        this.cargando = false;
        this.errorConexion = true;
      }
    });

    this.suscripcionAutoplay = interval(6000).subscribe(() => this.siguienteSlide());
  }

  ngOnDestroy(): void {
    this.suscripcionAutoplay?.unsubscribe();
  }

  irASlide(index: number): void {
    this.indiceActual = index;
  }

  siguienteSlide(): void {
    if (this.slides.length === 0) return;
    this.indiceActual = (this.indiceActual + 1) % this.slides.length;
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
