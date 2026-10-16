import { Injector, ɵINJECTOR_SCOPE, signal } from '@angular/core';
import type { Usuario } from '../../shared/models';
import { AuthService } from './auth.service';
import { FavoritosLogrosService } from './favoritos-logros.service';

function instalarAlmacenamientoFalso(): Map<string, string> {
  const datos = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => { datos.set(clave, String(valor)); },
    removeItem: (clave: string) => { datos.delete(clave); },
    clear: () => datos.clear(),
    key: () => null,
    get length() { return datos.size; }
  } as Storage;
  return datos;
}

function crearServicio(usuario: Usuario | null = null): FavoritosLogrosService {
  const auth = { usuario: signal(usuario) } as unknown as AuthService;
  const inyector = Injector.create({
    providers: [
      { provide: ɵINJECTOR_SCOPE, useValue: 'root' },
      { provide: AuthService, useValue: auth },
      { provide: FavoritosLogrosService, useClass: FavoritosLogrosService, deps: [] }
    ]
  });
  return inyector.get(FavoritosLogrosService);
}

describe('FavoritosLogrosService', () => {
  beforeEach(instalarAlmacenamientoFalso);

  it('guarda y quita favoritos en el almacenamiento de la cuenta', () => {
    const usuario: Usuario = { email: 'ana@utp.edu.pe', nombre: 'Ana', rol: 'cliente', departamento: 'Lima' };
    const servicio = crearServicio(usuario);

    expect(servicio.alternar(12)).toBeTrue();
    expect(servicio.esFavorito(12)).toBeTrue();
    expect(localStorage.getItem('nexus_favoritos_v1_ana%40utp.edu.pe')).toBe('[12]');

    expect(servicio.alternar(12)).toBeFalse();
    expect(servicio.esFavorito(12)).toBeFalse();
  });

  it('calcula logros de detalles, favoritos y biblioteca', () => {
    const servicio = crearServicio();
    servicio.registrarDetalle(4);
    servicio.alternar(4);
    servicio.alternar(9);

    const logros = servicio.calcularLogros(3);
    expect(logros.filter((logro) => logro.desbloqueado).map((logro) => logro.id)).toEqual([
      'primer-detalle', 'primer-favorito', 'primer-juego', 'tres-juegos'
    ]);
    expect(logros.find((logro) => logro.id === 'cinco-favoritos')?.progreso).toBe(2);
  });
});