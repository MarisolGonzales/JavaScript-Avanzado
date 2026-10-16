import { normalizar } from './indice-busqueda';

/**
 * INSTALACIÓN SIMULADA de un juego de la biblioteca (como Steam o Epic).
 * No se descarga ningún archivo: solo se simula el avance en pantalla.
 *
 * Semana 6: clases, encapsulamiento (#avance es privado de verdad) y HERENCIA:
 * Descarga e Instalacion extienden la clase base TareaProgreso.
 */
export abstract class TareaProgreso {
  #avance = 0; // de 0 a 1

  protected constructor(readonly duracionMs: number) {}

  get porcentaje(): number { return Math.floor(this.#avance * 100); }
  get terminada(): boolean { return this.#avance >= 1; }
  protected get avance(): number { return this.#avance; }

  /** Suma el tiempo transcurrido (lo llama el temporizador con setInterval). */
  avanzar(ms: number): void {
    if (ms > 0) this.#avance = Math.min(1, this.#avance + ms / this.duracionMs);
  }

  /** Texto bajo la barra: cada tipo de tarea lo describe a su manera. */
  abstract detalle(): string;
}

/** Fase 1: bajar los archivos del juego. Se puede pausar. */
export class Descarga extends TareaProgreso {
  pausada = false;

  constructor(readonly tamanoGb: number, duracionMs = duracionDescarga(tamanoGb)) { super(duracionMs); }

  override avanzar(ms: number): void {
    if (!this.pausada) super.avanzar(ms);
  }

  /** Velocidad aparente en MB/s, con una pequeña variación para que se vea real. */
  velocidadMBs(variacion = 0.85 + Math.random() * 0.3): number {
    return Math.round(((this.tamanoGb * 1024) / (this.duracionMs / 1000)) * variacion);
  }

  detalle(): string {
    const hecho = `${formatoTamano(this.tamanoGb * this.avance)} de ${formatoTamano(this.tamanoGb)}`;
    return this.pausada ? `${hecho} · En pausa` : `${hecho} · ${this.velocidadMBs()} MB/s`;
  }
}

/** Fase 2: "instalar" los archivos descargados. Es corta y no se puede pausar. */
export class Instalacion extends TareaProgreso {
  constructor(duracionMs = 2500) { super(duracionMs); }
  detalle(): string { return 'Preparando los archivos del juego…'; }
}

/** Tamaños aproximados de los juegos del catálogo (Semana 3: expresiones regulares). */
const TAMANOS: readonly (readonly [RegExp, number])[] = [
  [/witcher/, 50], [/grand theft auto|gta/, 105], [/minecraft/, 1.2], [/dota/, 60],
  [/left 4 dead/, 13], [/cyberpunk/, 70], [/elden ring/, 60], [/stardew/, 0.5],
  [/hollow knight/, 9], [/resident evil/, 67]
];

/** Tamaño en GB de un juego; los juegos nuevos reciben uno fijo según su id. */
export function tamanoJuego(titulo: string, idJuego: number): number {
  const t = normalizar(titulo);
  for (const [patron, gb] of TAMANOS) if (patron.test(t)) return gb;
  return 5 + ((idJuego * 37) % 60);
}

/** Entre 6 y 12 segundos según el tamaño: realista, pero sin alargar la demostración. */
export function duracionDescarga(tamanoGb: number): number {
  return 6000 + Math.round((Math.min(tamanoGb, 100) / 100) * 6000);
}

/** 0.5 → "512 MB" · 60 → "60.0 GB". */
export function formatoTamano(gb: number): string {
  return gb < 1 ? `${Math.round(gb * 1024)} MB` : `${gb.toFixed(1)} GB`;
}
