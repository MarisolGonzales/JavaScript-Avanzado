import { useRef } from 'react';
import type { ReactNode } from 'react';
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CampoTexto } from '../components/CampoTexto';
import type { CampoHandle } from '../components/CampoTexto';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { GameCard } from '../components/GameCard';
import { AuthProvider } from '../context/AuthContext';
import { CarritoProvider } from '../context/CarritoContext';
import { CARRITO_VACIO, carritoReducer } from '../context/carritoReducer';
import { FavoritosProvider, calcularLogros } from '../context/FavoritosContext';
import { ToastProvider } from '../context/ToastContext';
import { useConexion } from '../hooks/useConexion';
import { transicionValida } from '../logic/estados';
import type { Juego } from '../models';
import { Catalogo } from '../pages/Catalogo';
import { Inicio } from '../pages/Inicio';
import { erroresCheckout } from '../pages/Checkout';
import type { DatosCheckout } from '../pages/Checkout';

const juego = (id: number, title: string, extra: Partial<Juego> = {}): Juego => ({
  id, title, price: 50, category: 'RPG', image: 'assets/img/x.jpg', banner: null, description: '', developer: 'Estudio',
  year: 2020, platforms: null, mode: null, stock: 10, ...extra,
});

const CATALOGO = [
  juego(1, 'The Witcher 3', { price: 59.9 }),
  juego(2, 'Grand Theft Auto V', { category: 'Acción', price: 79.9 }),
  juego(3, 'Hollow Knight', { category: 'Aventura', price: 25, stock: 0 }),
];

vi.mock('../api/servicios', async (original) => {
  const real = await original<typeof import('../api/servicios')>();
  return { ...real, juegosApi: { listar: vi.fn(async () => CATALOGO), obtener: vi.fn() } };
});

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

function Proveedores({ children }: { children: ReactNode }) {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={cache}>
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <FavoritosProvider>
              <CarritoProvider>{children}</CarritoProvider>
            </FavoritosProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Reductor del carrito (useReducer)', () => {
  test('agrega una licencia y rechaza duplicados y juegos agotados', () => {
    let s = carritoReducer(CARRITO_VACIO, { type: 'agregar', juego: CATALOGO[0], tipo: 'DIGITAL' });
    expect(s.items).toHaveLength(1);
    expect(s.cambios).toBe(1);
    s = carritoReducer(s, { type: 'agregar', juego: CATALOGO[0], tipo: 'DIGITAL' });
    expect(s.items).toHaveLength(1);
    expect(s.mensaje).toMatch(/ya está/);
    s = carritoReducer(s, { type: 'agregar', juego: CATALOGO[2], tipo: 'DIGITAL' });
    expect(s.items).toHaveLength(1);
    expect(s.mensaje).toMatch(/no tiene licencias/);
  });

  test('el mismo juego puede estar como "para mí" y como regalo, pero no cambiar a un tipo repetido', () => {
    let s = carritoReducer(CARRITO_VACIO, { type: 'agregar', juego: CATALOGO[0], tipo: 'DIGITAL' });
    s = carritoReducer(s, { type: 'agregar', juego: CATALOGO[0], tipo: 'REGALO' });
    expect(s.items).toHaveLength(2);
    const antes = s.items;
    s = carritoReducer(s, { type: 'cambiarTipo', idJuego: 1, actual: 'DIGITAL' });
    expect(s.items).toBe(antes); // sin cambios: el estado no se muta
    s = carritoReducer(s, { type: 'vaciar' });
    expect(s.items).toHaveLength(0);
  });
});

describe('Lógica pura', () => {
  const BASE: DatosCheckout = {
    metodo: 'TARJETA', tipo: 'BOLETA', destinatario: '', mensaje: '', documento: '', nombre: 'Vanessa',
    direccion: '', numero: '', titular: '', exp: '', cvv: '',
  };

  test('erroresCheckout detecta tarjeta, DNI obligatorio y regalo inválidos', () => {
    const e = erroresCheckout({ ...BASE, numero: '4242 4242 4242 4241', titular: 'Al', exp: '01/20', cvv: '1', destinatario: 'no-es-correo' }, 800, true);
    expect(Object.keys(e).sort()).toEqual(['cvv', 'destinatario', 'documento', 'exp', 'numero', 'titular']);
  });

  test('erroresCheckout acepta Yape con boleta sin DNI bajo S/ 700 y valida la factura', () => {
    expect(erroresCheckout({ ...BASE, metodo: 'YAPE' }, 120, false)).toEqual({});
    const factura = erroresCheckout({ ...BASE, metodo: 'YAPE', tipo: 'FACTURA', documento: '20100070971', nombre: 'AB', direccion: 'Av' }, 120, false);
    expect(Object.keys(factura).sort()).toEqual(['direccion', 'documento', 'nombre']);
    expect(erroresCheckout({ ...BASE, metodo: 'YAPE', tipo: 'FACTURA', documento: '20100070970', nombre: 'Mi Empresa', direccion: 'Av. Lima 123' }, 120, false)).toEqual({});
  });

  test('transicionValida solo deja avanzar o reembolsar (igual que el backend)', () => {
    expect(transicionValida('PAGADO', 'ENTREGADO')).toBe(true);
    expect(transicionValida('ENTREGADO', 'PAGADO')).toBe(false);
    expect(transicionValida('ENTREGADO', 'REEMBOLSADO')).toBe(true);
    expect(transicionValida('REEMBOLSADO', 'ENTREGADO')).toBe(false);
  });

  test('calcularLogros desbloquea según el progreso', () => {
    const logros = calcularLogros(1, 2, 0);
    expect(logros.filter((l) => l.desbloqueado).map((l) => l.id)).toEqual(['primer-detalle', 'primer-favorito']);
  });
});

describe('Componentes', () => {
  test('GameCard avisa al padre al añadir y muestra "Sin stock" si está agotado', async () => {
    const user = userEvent.setup();
    const onAgregar = vi.fn();
    render(
      <MemoryRouter>
        <GameCard juego={CATALOGO[0]} onAgregar={onAgregar} />
        <GameCard juego={CATALOGO[2]} onAgregar={onAgregar} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Añadir' }));
    expect(onAgregar).toHaveBeenCalledWith(CATALOGO[0]);
    expect(screen.getByRole('button', { name: 'Sin stock' })).toBeDisabled();
    expect(screen.getByText('Agotado')).toHaveClass('stock-pill', 'stock-agotado');
  });

  test('CampoTexto expone enfocar() con useImperativeHandle y marca el error', async () => {
    const user = userEvent.setup();
    function Prueba() {
      const ref = useRef<CampoHandle>(null);
      return <><CampoTexto ref={ref} etiqueta="Correo" error="Obligatorio" /><button onClick={() => ref.current?.enfocar()}>Ir</button></>;
    }
    render(<Prueba />);
    await user.click(screen.getByRole('button', { name: 'Ir' }));
    const campo = screen.getByRole('textbox', { name: 'Correo' });
    expect(campo).toHaveFocus();
    expect(campo).toHaveClass('invalido');
    expect(screen.getByText('Obligatorio')).toHaveClass('msg-error');
  });

  test('ErrorBoundary muestra el respaldo si un hijo falla', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    function Roto(): ReactNode { throw new Error('Fallo de prueba'); }
    render(<ErrorBoundary><Roto /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Fallo de prueba');
  });

  test('useConexion reacciona a los eventos online/offline (useSyncExternalStore)', () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { result } = renderHook(() => useConexion());
    expect(result.current).toBe(true);
    online.mockReturnValue(false);
    act(() => { window.dispatchEvent(new Event('offline')); });
    expect(result.current).toBe(false);
  });
});

describe('Inicio (carrusel)', () => {
  test('avanza solo cada 6 segundos y con las flechas', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Inicio />, { wrapper: Proveedores });
      const activo = async () => (await screen.findAllByRole('button', { name: /^Ir a / })).find((b) => b.getAttribute('aria-current') === 'true')?.getAttribute('aria-label');
      expect(await activo()).toBe('Ir a The Witcher 3');
      act(() => { vi.advanceTimersByTime(6000); });
      expect(await activo()).toBe('Ir a Grand Theft Auto V');
      await user.click(screen.getByRole('button', { name: 'Juego anterior' }));
      expect(await activo()).toBe('Ir a The Witcher 3');
      expect(screen.getByRole('heading', { name: 'Recién llegados' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Catálogo (integración con TanStack Query y los contextos)', () => {
  test('carga los juegos, busca con el índice y añade al carrito', async () => {
    const user = userEvent.setup();
    render(<Catalogo />, { wrapper: Proveedores });
    expect(await screen.findByText('3 juegos encontrados')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Buscar juegos' }), 'wit');
    await waitFor(() => expect(screen.getByText('1 juego encontrado')).toBeInTheDocument());
    const tarjeta = screen.getByRole('heading', { name: 'The Witcher 3' }).closest('article');
    if (!tarjeta) throw new Error('Falta la tarjeta');
    await user.click(within(tarjeta).getByRole('button', { name: 'Añadir' }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem('nexus_carrito_v3_visitante') ?? '[]')).toHaveLength(1));
  });

  test('ordena por precio y filtra los disponibles', async () => {
    const user = userEvent.setup();
    render(<Catalogo />, { wrapper: Proveedores });
    await screen.findByText('3 juegos encontrados');
    const titulos = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titulos()).toEqual(['Hollow Knight', 'The Witcher 3', 'Grand Theft Auto V']); // por defecto: precio menor a mayor
    await user.selectOptions(screen.getByRole('combobox', { name: 'Ordenar por' }), 'precio-desc');
    await waitFor(() => expect(titulos()).toEqual(['Grand Theft Auto V', 'The Witcher 3', 'Hollow Knight']));
    await user.click(screen.getByRole('checkbox', { name: 'Solo disponibles' }));
    await waitFor(() => expect(screen.getByText('2 juegos encontrados')).toBeInTheDocument());
  });
});
