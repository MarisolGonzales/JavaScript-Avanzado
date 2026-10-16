import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { ItemCarrito, ItemCarritoApi, Juego, TipoEntrega } from '../../shared/models';
import { esArreglo, esObjeto, guardarJson, leerJson } from '../logic/almacenamiento';
import { sumarSoles } from '../logic/dinero';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

const clave = (email: string | null): string => `nexus_carrito_v3_${email ?? 'visitante'}`;

const esItem = (v: unknown): v is ItemCarrito =>
  esObjeto(v) && typeof v['idJuego'] === 'number' && typeof v['titulo'] === 'string' && typeof v['imagen'] === 'string' &&
  typeof v['precio'] === 'number' && (v['tipoEntrega'] === 'DIGITAL' || v['tipoEntrega'] === 'REGALO');
const guardiaItems = (v: unknown): v is ItemCarrito[] => esArreglo(v) && v.every(esItem);

export interface ResultadoCarrito { exito: boolean; mensaje: string; }

/**
 * Carrito con señales (estado inmutable: cada cambio crea un arreglo nuevo).
 * Cada usuario tiene el suyo en localStorage; el del visitante se une al de su cuenta
 * al iniciar sesión. Para clientes se sincroniza con el servidor (tablas carrito /
 * item_carrito, Semana 10), así el carrito sigue en otro dispositivo.
 * Como en Steam o Epic, cada juego es UNA licencia: no hay cantidades.
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private temporizador: ReturnType<typeof setTimeout> | undefined;
  private emailActual: string | null = this.auth.usuario()?.email ?? null;

  readonly items = signal<readonly ItemCarrito[]>([]);
  readonly cantidad = computed(() => this.items().length);
  readonly hayRegalo = computed(() => this.items().some((i) => i.tipoEntrega === 'REGALO'));
  readonly total = computed(() => sumarSoles(...this.items().map((i) => i.precio)));

  constructor() {
    this.cargarDe(this.emailActual); // carga inicial inmediata: la página nunca muestra un carrito vacío por error
    // Al iniciar o cerrar sesión después, se carga el carrito de esa cuenta.
    effect(() => {
      const email = this.auth.usuario()?.email ?? null;
      untracked(() => { if (email !== this.emailActual) { this.emailActual = email; this.cargarDe(email); } });
    });
  }

  agregar(juego: Juego, tipo: TipoEntrega = 'DIGITAL'): ResultadoCarrito {
    if (juego.stock <= 0) return { exito: false, mensaje: `${juego.title} no tiene licencias disponibles por ahora.` };
    if (this.items().some((i) => i.idJuego === juego.id && i.tipoEntrega === tipo))
      return { exito: false, mensaje: tipo === 'REGALO' ? 'Ese regalo ya está en tu carrito.' : 'Ese juego ya está en tu carrito.' };
    const item: ItemCarrito = { idJuego: juego.id, titulo: juego.title, imagen: juego.image, precio: juego.price, tipoEntrega: tipo };
    this.guardar([...this.items(), item]);
    return { exito: true, mensaje: `${juego.title} se añadió al carrito.` };
  }

  /** Igual que agregar() pero muestra el resultado como aviso flotante. */
  agregarConAviso(juego: Juego, tipo: TipoEntrega = 'DIGITAL'): boolean {
    const r = this.agregar(juego, tipo);
    if (r.exito) this.toast.exito(r.mensaje); else this.toast.error(r.mensaje);
    return r.exito;
  }

  /** Cambia un renglón entre "para mí" y "regalo". */
  cambiarTipo(idJuego: number, actual: TipoEntrega): void {
    const nuevo: TipoEntrega = actual === 'DIGITAL' ? 'REGALO' : 'DIGITAL';
    if (this.items().some((i) => i.idJuego === idJuego && i.tipoEntrega === nuevo)) {
      this.toast.error('Ese juego ya está en tu carrito con la otra opción.');
      return;
    }
    this.guardar(this.items().map((i) => (i.idJuego === idJuego && i.tipoEntrega === actual ? { ...i, tipoEntrega: nuevo } : i)));
  }

  quitar(idJuego: number, tipo: TipoEntrega): void {
    this.guardar(this.items().filter((i) => !(i.idJuego === idJuego && i.tipoEntrega === tipo)));
  }

  vaciar(): void { this.guardar([]); }

  /** Forma que viaja al servidor: sin precios (los fija el servidor al comprar). */
  paraApi(): ItemCarritoApi[] {
    return this.items().map(({ idJuego, tipoEntrega }) => ({ idJuego, tipoEntrega }));
  }

  /** Si este navegador no tiene carrito pero el servidor sí (otro dispositivo), lo recupera. */
  recuperarDelServidor(catalogo: readonly Juego[]): void {
    if (this.items().length > 0 || !this.auth.esCliente()) return;
    this.http.get<ItemCarritoApi[]>(`${environment.apiUrl}/carrito`).subscribe({
      next: (remotos) => {
        const recuperados = remotos.flatMap((r): ItemCarrito[] => {
          const j = catalogo.find((x) => x.id === r.idJuego);
          return j ? [{ idJuego: j.id, titulo: j.title, imagen: j.image, precio: j.price, tipoEntrega: r.tipoEntrega }] : [];
        });
        if (recuperados.length && this.items().length === 0) this.items.set(recuperados);
      },
      error: () => undefined // sin conexión: se sigue con el carrito local
    });
  }

  private cargarDe(email: string | null): void {
    let items = leerJson<ItemCarrito[]>(clave(email), guardiaItems, []);
    if (email) {
      // Une lo que el visitante dejó en el carrito antes de iniciar sesión.
      const visitante = leerJson<ItemCarrito[]>(clave(null), guardiaItems, []);
      if (visitante.length) {
        const nuevos = visitante.filter((v) => !items.some((i) => i.idJuego === v.idJuego && i.tipoEntrega === v.tipoEntrega));
        items = [...items, ...nuevos];
        guardarJson(clave(email), items);
        try { localStorage.removeItem(clave(null)); } catch { /* modo privado */ }
      }
    }
    this.items.set(items);
  }

  private guardar(items: readonly ItemCarrito[]): void {
    this.items.set(items);
    guardarJson(clave(this.auth.usuario()?.email ?? null), items);
    if (!this.auth.esCliente()) return;
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.sincronizar(), 700); // antirrebote: una sola llamada por ráfaga
  }

  private sincronizar(): void {
    this.http.put(`${environment.apiUrl}/carrito`, { items: this.paraApi() }).subscribe({ error: () => undefined });
  }
}
