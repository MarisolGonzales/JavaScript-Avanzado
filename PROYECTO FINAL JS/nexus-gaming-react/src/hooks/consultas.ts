import { useQuery } from '@tanstack/react-query';
import { adminApi, authApi, juegosApi, pedidosApi, soporteApi } from '../api/servicios';
import { useAuth } from '../context/AuthContext';

/**
 * HOOKS DE DATOS CON TANSTACK QUERY (Laboratorio 14).
 * useQuery guarda en caché, deduplica peticiones, reintenta y cancela con AbortSignal.
 * Las claves incluyen el correo porque el stock cambia según la región del cliente.
 */
export const claves = {
  juegos: (email: string | null) => ['juegos', email] as const,
  juego: (id: number, email: string | null) => ['juegos', email, id] as const,
  pedidos: ['pedidos'] as const,
  pedido: (codigo: string) => ['pedidos', codigo] as const,
  biblioteca: ['biblioteca'] as const,
  misTickets: ['tickets', 'mios'] as const,
  reportes: ['admin', 'reportes'] as const,
  clientes: ['admin', 'clientes'] as const,
  ticketsAdmin: ['admin', 'tickets'] as const,
};

const useEmail = () => useAuth().usuario?.email ?? null;

export function useJuegos() {
  const email = useEmail();
  return useQuery({ queryKey: claves.juegos(email), queryFn: ({ signal }) => juegosApi.listar(signal), staleTime: 30_000 });
}

export function useJuego(id: number) {
  const email = useEmail();
  return useQuery({
    queryKey: claves.juego(id, email),
    queryFn: ({ signal }) => juegosApi.obtener(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function usePedidos(activo = true) {
  return useQuery({ queryKey: claves.pedidos, queryFn: ({ signal }) => pedidosApi.listar({}, signal), enabled: activo });
}

export function useBiblioteca(activo = true) {
  return useQuery({ queryKey: claves.biblioteca, queryFn: ({ signal }) => pedidosApi.biblioteca(signal), enabled: activo });
}

export function useMisTickets(activo = true) {
  return useQuery({ queryKey: claves.misTickets, queryFn: ({ signal }) => soporteApi.misTickets(signal), enabled: activo });
}

export function useReportes() {
  return useQuery({ queryKey: claves.reportes, queryFn: ({ signal }) => adminApi.reportes(signal) });
}

export function useClientes() {
  return useQuery({ queryKey: claves.clientes, queryFn: ({ signal }) => adminApi.clientes(signal) });
}

/** Tickets del panel: los comparten la barra lateral (insignia), la campana, el resumen y Soporte. */
export function useTicketsAdmin(activo = true) {
  return useQuery({ queryKey: claves.ticketsAdmin, queryFn: ({ signal }) => adminApi.tickets(signal), enabled: activo });
}

/** Lista de departamentos: el servidor es la fuente; esta copia permite usar el formulario sin conexión. */
const DEPARTAMENTOS_RESPALDO = ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín',
  'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'];

export function useDepartamentos(): readonly string[] {
  const q = useQuery({ queryKey: ['departamentos'], queryFn: authApi.departamentos, staleTime: Infinity });
  return q.data?.departamentos ?? DEPARTAMENTOS_RESPALDO;
}
