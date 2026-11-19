import type { ItemCarrito, Juego, TipoEntrega } from '../models';

/**
 * REDUCTOR DEL CARRITO (Laboratorio 13: useReducer, como la "Agenda del equipo").
 * Función pura: recibe el estado y una acción y devuelve un estado NUEVO.
 * `duenio` es la cuenta a la que pertenece el carrito (null = visitante) y
 * `cambios` cuenta solo las acciones del usuario (para sincronizar con el servidor).
 */
export interface EstadoCarrito {
  readonly duenio: string | null;
  readonly items: readonly ItemCarrito[];
  readonly cambios: number;
  readonly mensaje: string;
}

export type AccionCarrito =
  | { type: 'cargar'; duenio: string | null; items: readonly ItemCarrito[] }
  | { type: 'agregar'; juego: Juego; tipo: TipoEntrega }
  | { type: 'quitar'; idJuego: number; tipo: TipoEntrega }
  | { type: 'cambiarTipo'; idJuego: number; actual: TipoEntrega }
  | { type: 'vaciar' };

export const CARRITO_VACIO: EstadoCarrito = { duenio: null, items: [], cambios: 0, mensaje: '' };

const mismo = (i: ItemCarrito, id: number, tipo: TipoEntrega) => i.idJuego === id && i.tipoEntrega === tipo;

export function carritoReducer(estado: EstadoCarrito, accion: AccionCarrito): EstadoCarrito {
  switch (accion.type) {
    case 'cargar':
      return { duenio: accion.duenio, items: accion.items, cambios: estado.cambios, mensaje: '' };

    case 'agregar': {
      const { juego, tipo } = accion;
      if (juego.stock <= 0) return { ...estado, mensaje: `${juego.title} no tiene licencias disponibles por ahora.` };
      if (estado.items.some((i) => mismo(i, juego.id, tipo))) {
        return { ...estado, mensaje: tipo === 'REGALO' ? 'Ese regalo ya está en tu carrito.' : 'Ese juego ya está en tu carrito.' };
      }
      const item: ItemCarrito = { idJuego: juego.id, titulo: juego.title, imagen: juego.image, precio: juego.price, tipoEntrega: tipo };
      return { ...estado, items: [...estado.items, item], cambios: estado.cambios + 1, mensaje: `${juego.title} se añadió al carrito.` };
    }

    case 'quitar':
      return { ...estado, items: estado.items.filter((i) => !mismo(i, accion.idJuego, accion.tipo)), cambios: estado.cambios + 1, mensaje: 'Juego quitado del carrito.' };

    case 'cambiarTipo': {
      const nuevo: TipoEntrega = accion.actual === 'DIGITAL' ? 'REGALO' : 'DIGITAL';
      if (estado.items.some((i) => mismo(i, accion.idJuego, nuevo))) {
        return { ...estado, mensaje: 'Ese juego ya está en tu carrito con la otra opción.' };
      }
      return {
        ...estado,
        items: estado.items.map((i) => (mismo(i, accion.idJuego, accion.actual) ? { ...i, tipoEntrega: nuevo } : i)),
        cambios: estado.cambios + 1,
        mensaje: nuevo === 'REGALO' ? 'Ahora es un regalo.' : 'Ahora es para tu cuenta.',
      };
    }

    case 'vaciar':
      return { ...estado, items: [], cambios: estado.cambios + 1, mensaje: 'Carrito vacío.' };
  }
}

/** ¿Se puede agregar? Se calcula ANTES de despachar para mostrar el aviso correcto. */
export function puedeAgregar(items: readonly ItemCarrito[], juego: Juego, tipo: TipoEntrega): { ok: boolean; mensaje: string } {
  const r = carritoReducer({ ...CARRITO_VACIO, items }, { type: 'agregar', juego, tipo });
  return { ok: r.items.length > items.length, mensaje: r.mensaje };
}
