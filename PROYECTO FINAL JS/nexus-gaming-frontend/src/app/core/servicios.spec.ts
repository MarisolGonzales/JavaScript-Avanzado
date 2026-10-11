import { HttpClient } from '@angular/common/http';
import { Injector, ɵINJECTOR_SCOPE } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import type { Juego, Usuario } from '../shared/models';
import { AuthService } from './services/auth.service';
import { CarritoService } from './services/carrito.service';
import { ThemeService } from './services/theme.service';
import { ToastService } from './services/toast.service';

/** localStorage mínimo para ejecutar sin navegador. */
function instalarAlmacenamientoFalso(): Map<string, string> {
  const datos = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => { datos.set(k, String(v)); },
    removeItem: (k: string) => { datos.delete(k); },
    clear: () => datos.clear(), key: () => null, get length() { return datos.size; }
  } as Storage;
  return datos;
}

const usuario = (rol: Usuario['rol'] = 'cliente', email = 'ana@utp.edu.pe'): Usuario => ({ email, nombre: 'Ana Torres', rol, departamento: 'Lima' });
const juego = (id: number, stock: number, price = 50): Juego => ({
  id, title: `Juego ${id}`, price, category: 'RPG', image: 'x.jpg', banner: null, description: '',
  developer: null, year: null, platforms: null, mode: null, stock
});

/** HttpClient falso: guarda cada llamada y responde lo que se le configure. */
function crearEntorno(respuestas: { post?: unknown; get?: unknown } = {}) {
  const llamadas: { metodo: string; url: string; cuerpo?: unknown }[] = [];
  const http = {
    get: (url: string) => { llamadas.push({ metodo: 'GET', url }); return respuestas.get instanceof Error ? throwError(() => respuestas.get) : of(respuestas.get ?? []); },
    post: (url: string, cuerpo: unknown) => { llamadas.push({ metodo: 'POST', url, cuerpo }); return of(respuestas.post ?? {}); },
    put: (url: string, cuerpo: unknown) => { llamadas.push({ metodo: 'PUT', url, cuerpo }); return of({}); },
    patch: (url: string, cuerpo: unknown) => { llamadas.push({ metodo: 'PATCH', url, cuerpo }); return of({}); }
  } as unknown as HttpClient;
  const inyector = Injector.create({
    providers: [
      // Con "root" el inyector se comporta como el de la aplicación: así funcionan los servicios providedIn:'root' y los effect().
      { provide: ɵINJECTOR_SCOPE, useValue: 'root' },
      { provide: HttpClient, useValue: http },
      { provide: AuthService, useClass: AuthService, deps: [] },
      { provide: ToastService, useClass: ToastService, deps: [] },
      { provide: CarritoService, useClass: CarritoService, deps: [] },
      { provide: ThemeService, useClass: ThemeService, deps: [] }
    ]
  });
  return { inyector, llamadas };
}

describe('AuthService', () => {
  let datos: Map<string, string>;
  beforeEach(() => { datos = instalarAlmacenamientoFalso(); });

  it('al iniciar sesión guarda el token y expone los roles', async () => {
    const { inyector } = crearEntorno({ post: { token: 'tok123', usuario: usuario('admin', 'jefe@nexusgaming.pe') } });
    const auth = inyector.get(AuthService);
    expect(auth.logueado()).toBeFalse();
    await new Promise<void>((ok) => auth.iniciarSesion('jefe@nexusgaming.pe', 'x').subscribe(() => ok()));
    expect(auth.logueado()).toBeTrue();
    expect(auth.esAdmin()).toBeTrue(); expect(auth.esStaff()).toBeTrue(); expect(auth.esCliente()).toBeFalse();
    expect(auth.rolEtiqueta()).toBe('Administrador');
    expect(datos.get('nexus_token')).toBe('tok123');
  });

  it('un cliente no es personal y el soporte no es administrador', async () => {
    const a = crearEntorno({ post: { token: 't', usuario: usuario('cliente') } }).inyector.get(AuthService);
    await new Promise<void>((ok) => a.iniciarSesion('a@b.com', 'x').subscribe(() => ok()));
    expect([a.esCliente(), a.esStaff(), a.esAdmin()]).toEqual([true, false, false]);
    const s = crearEntorno({ post: { token: 't', usuario: usuario('soporte') } }).inyector.get(AuthService);
    await new Promise<void>((ok) => s.iniciarSesion('a@b.com', 'x').subscribe(() => ok()));
    expect([s.esCliente(), s.esStaff(), s.esAdmin()]).toEqual([false, true, false]);
  });

  it('cerrar sesión borra el token y el usuario', async () => {
    const { inyector } = crearEntorno({ post: { token: 'tok', usuario: usuario() } });
    const auth = inyector.get(AuthService);
    await new Promise<void>((ok) => auth.iniciarSesion('a@b.com', 'x').subscribe(() => ok()));
    auth.cerrarSesion();
    expect(auth.logueado()).toBeFalse(); expect(auth.token()).toBeNull(); expect(datos.has('nexus_token')).toBeFalse();
  });

  it('restaura la sesión al arrancar si el token sigue válido, y la descarta si no', async () => {
    datos.set('nexus_token', 'guardado');
    const bien = crearEntorno({ get: { usuario: usuario() } }).inyector.get(AuthService);
    await bien.restaurar();
    expect(bien.usuario()?.email).toBe('ana@utp.edu.pe');

    datos.set('nexus_token', 'vencido');
    const mal = crearEntorno({ get: new Error('401') }).inyector.get(AuthService);
    await mal.restaurar();
    expect(mal.logueado()).toBeFalse(); expect(datos.has('nexus_token')).toBeFalse();
  });

  it('sin token no pregunta nada al servidor', async () => {
    const { inyector, llamadas } = crearEntorno();
    await inyector.get(AuthService).restaurar();
    expect(llamadas.length).toBe(0);
  });
});

describe('CarritoService', () => {
  beforeEach(instalarAlmacenamientoFalso);

  function carritoDe(u: Usuario | null) {
    const entorno = crearEntorno();
    if (u) entorno.inyector.get(AuthService).usuario.set(u);
    return { ...entorno, c: entorno.inyector.get(CarritoService) };
  }

  it('cada juego es una sola licencia: no se repite', () => {
    const { c } = carritoDe(usuario());
    expect(c.agregar(juego(1, 10)).exito).toBeTrue();
    const otra = c.agregar(juego(1, 10));
    expect(otra.exito).toBeFalse();
    expect(c.cantidad()).toBe(1);
  });

  it('el mismo juego puede estar para mí y como regalo', () => {
    const { c } = carritoDe(usuario());
    expect(c.agregar(juego(2, 5), 'DIGITAL').exito).toBeTrue();
    expect(c.agregar(juego(2, 5), 'REGALO').exito).toBeTrue();
    expect(c.cantidad()).toBe(2); expect(c.hayRegalo()).toBeTrue();
  });

  it('rechaza juegos sin claves', () => {
    const { c } = carritoDe(usuario());
    expect(c.agregar(juego(3, 0)).exito).toBeFalse();
    expect(c.cantidad()).toBe(0);
  });

  it('cambia un renglón entre "para mí" y "regalo" sin duplicar', () => {
    const { c } = carritoDe(usuario());
    c.agregar(juego(4, 5));
    c.cambiarTipo(4, 'DIGITAL');
    expect(c.items()[0].tipoEntrega).toBe('REGALO');
    c.agregar(juego(4, 5), 'DIGITAL');
    c.cambiarTipo(4, 'REGALO'); // ya existe el otro: no se pisa
    expect(c.items().map((i) => i.tipoEntrega).sort()).toEqual(['DIGITAL', 'REGALO']);
  });

  it('suma el total en céntimos, sin errores de coma flotante', () => {
    const { c } = carritoDe(usuario());
    c.agregar(juego(5, 5, 0.1)); c.agregar(juego(6, 5, 0.2));
    expect(c.total()).toBe(0.3); // 0.1 + 0.2 en JavaScript sería 0.30000000000000004
  });

  it('quitar y vaciar', () => {
    const { c } = carritoDe(usuario());
    c.agregar(juego(7, 5)); c.agregar(juego(8, 5));
    c.quitar(7, 'DIGITAL');
    expect(c.items().map((i) => i.idJuego)).toEqual([8]);
    c.vaciar();
    expect(c.cantidad()).toBe(0);
  });

  it('cada cuenta tiene su propio carrito guardado', () => {
    const a = carritoDe(usuario('cliente', 'ana@utp.edu.pe')).c; a.agregar(juego(9, 5));
    expect(carritoDe(usuario('cliente', 'ana@utp.edu.pe')).c.cantidad()).toBe(1);
    expect(carritoDe(usuario('cliente', 'luis@utp.edu.pe')).c.cantidad()).toBe(0);
  });

  it('el carrito del visitante se une al de su cuenta al iniciar sesión', () => {
    const v = carritoDe(null).c; v.agregar(juego(10, 5)); v.agregar(juego(11, 5));
    const previo = carritoDe(usuario('cliente', 'ana@utp.edu.pe')); // ya existía algo en la cuenta? no: se une lo del visitante
    expect(previo.c.items().map((i) => i.idJuego).sort()).toEqual([10, 11]);
    expect(carritoDe(null).c.cantidad()).toBe(0); // el del visitante se vació al unirse
  });

  it('ignora un carrito guardado con formato inválido', () => {
    localStorage.setItem('nexus_carrito_v3_ana@utp.edu.pe', JSON.stringify([{ idJuego: 'x' }]));
    expect(carritoDe(usuario()).c.cantidad()).toBe(0);
  });

  it('al servidor solo viaja id y tipo (nunca el precio)', () => {
    const { c } = carritoDe(usuario());
    c.agregar(juego(12, 5, 99), 'REGALO');
    expect(c.paraApi()).toEqual([{ idJuego: 12, tipoEntrega: 'REGALO' }]);
  });

  it('sincroniza con el servidor una sola vez por ráfaga de cambios (antirrebote)', async () => {
    const { c, llamadas } = carritoDe(usuario());
    c.agregar(juego(13, 5)); c.agregar(juego(14, 5)); c.agregar(juego(15, 5));
    expect(llamadas.length).toBe(0);
    await new Promise((r) => setTimeout(r, 900));
    const puts = llamadas.filter((l) => l.metodo === 'PUT');
    expect(puts.length).toBe(1);
    expect((puts[0].cuerpo as { items: unknown[] }).items.length).toBe(3);
  });

  it('el personal y los visitantes no sincronizan con el servidor', async () => {
    const { c, llamadas } = carritoDe(usuario('admin', 'jefe@nexusgaming.pe'));
    c.agregar(juego(16, 5));
    await new Promise((r) => setTimeout(r, 900));
    expect(llamadas.filter((l) => l.metodo === 'PUT').length).toBe(0);
  });
});

describe('ThemeService', () => {
  it('empieza con el tema guardado y alterna recordando la elección', () => {
    const datos = instalarAlmacenamientoFalso();
    datos.set('nexus_tema', JSON.stringify('claro'));
    const t = crearEntorno().inyector.get(ThemeService);
    expect(t.tema()).toBe('claro');
    t.alternar();
    expect(t.tema()).toBe('oscuro');
    expect(datos.get('nexus_tema')).toBe('"oscuro"');
    t.alternar();
    expect(t.tema()).toBe('claro');
  });

  it('sin preferencia guardada usa oscuro (o el del sistema)', () => {
    instalarAlmacenamientoFalso();
    (globalThis as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: false });
    expect(crearEntorno().inyector.get(ThemeService).tema()).toBe('oscuro');
    (globalThis as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true });
    expect(crearEntorno().inyector.get(ThemeService).tema()).toBe('claro');
  });

  it('ignora un valor guardado que no es un tema', () => {
    const datos = instalarAlmacenamientoFalso();
    datos.set('nexus_tema', JSON.stringify('rosado'));
    (globalThis as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: false });
    expect(crearEntorno().inyector.get(ThemeService).tema()).toBe('oscuro');
  });
});

// Evita avisos de importación sin uso cuando solo se usan tipos.
export type _Observable = Observable<unknown>;
