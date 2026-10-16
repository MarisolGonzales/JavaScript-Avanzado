import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { guardarJson, leerJson } from '../logic/almacenamiento';
import { AuthService } from './auth.service';

export interface LogroJugador {
  readonly id: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly icono: string;
  readonly progreso: number;
  readonly objetivo: number;
  readonly desbloqueado: boolean;
}

const clave = (tipo: 'favoritos' | 'vistos', email: string | null): string =>
  `nexus_${tipo}_v1_${email ? encodeURIComponent(email) : 'visitante'}`;

const guardiaIds = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every((id): id is number => Number.isInteger(id) && id > 0);

/** Favoritos y visitas se guardan localmente, aislados por cuenta en este navegador. */
@Injectable({ providedIn: 'root' })
export class FavoritosLogrosService {
  private readonly auth = inject(AuthService);
  private emailActual: string | null = this.auth.usuario()?.email ?? null;
  readonly favoritos = signal<readonly number[]>([]);
  readonly detallesVistos = signal<readonly number[]>([]);
  readonly cantidadFavoritos = computed(() => this.favoritos().length);

  constructor() {
    this.cargar(this.emailActual);
    effect(() => {
      const email = this.auth.usuario()?.email ?? null;
      untracked(() => {
        if (email !== this.emailActual) {
          this.emailActual = email;
          this.cargar(email);
        }
      });
    });
  }

  esFavorito(id: number): boolean { return this.favoritos().includes(id); }

  alternar(id: number): boolean {
    const actual = this.favoritos();
    const agregado = !actual.includes(id);
    const siguiente = agregado ? [...actual, id] : actual.filter((item) => item !== id);
    this.favoritos.set(siguiente);
    guardarJson(clave('favoritos', this.emailActual), siguiente);
    return agregado;
  }

  registrarDetalle(id: number): void {
    const actual = this.detallesVistos();
    if (actual.includes(id)) return;
    const siguiente = [...actual, id];
    this.detallesVistos.set(siguiente);
    guardarJson(clave('vistos', this.emailActual), siguiente);
  }

  calcularLogros(juegosEnBiblioteca: number): LogroJugador[] {
    const favoritos = this.cantidadFavoritos();
    const vistos = this.detallesVistos().length;
    const definiciones = [
      { id: 'primer-detalle', titulo: 'Vitrinero', descripcion: 'Consulta el detalle de tu primer juego.', icono: 'fa-magnifying-glass', progreso: vistos, objetivo: 1 },
      { id: 'primer-favorito', titulo: 'Buen gusto', descripcion: 'Guarda tu primer juego en Favoritos.', icono: 'fa-heart', progreso: favoritos, objetivo: 1 },
      { id: 'cinco-favoritos', titulo: 'Curador', descripcion: 'Guarda cinco juegos en Favoritos.', icono: 'fa-star', progreso: favoritos, objetivo: 5 },
      { id: 'primer-juego', titulo: 'Coleccionista', descripcion: 'Consigue tu primer juego en la biblioteca.', icono: 'fa-gamepad', progreso: juegosEnBiblioteca, objetivo: 1 },
      { id: 'tres-juegos', titulo: 'Biblioteca en marcha', descripcion: 'Consigue tres juegos en la biblioteca.', icono: 'fa-layer-group', progreso: juegosEnBiblioteca, objetivo: 3 }
    ];

    return definiciones.map((logro) => ({
      ...logro,
      desbloqueado: logro.progreso >= logro.objetivo,
      progreso: Math.min(logro.progreso, logro.objetivo)
    }));
  }

  private cargar(email: string | null): void {
    this.favoritos.set(leerJson<number[]>(clave('favoritos', email), guardiaIds, []));
    this.detallesVistos.set(leerJson<number[]>(clave('vistos', email), guardiaIds, []));
  }
}