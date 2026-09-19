/**
 * Contrato de un videojuego del catálogo. Tipado estricto en vez de `any`,
 * tal como recomienda el sílabo (Semana 6-9: TypeScript / interfaces).
 */
export interface Juego {
  id: number;
  title: string;
  price: number;
  category: string;
  image: string;
  /** Imagen ancha (key art) usada en el carrusel del hero. Si un juego
   *  no tiene una propia, se usa `image` como respaldo. */
  banner?: string;
  description: string;
}
