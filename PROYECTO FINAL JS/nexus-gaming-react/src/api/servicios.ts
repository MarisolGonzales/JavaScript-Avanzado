import type {
  ClienteResumen, CodigoNodo, ElementoBiblioteca, EstadoPedido, ItemCarritoApi, Juego, JuegoEditable, NuevoPedido, Pedido,
  Reportes, RespuestaAsistente, SesionApi, Ticket, TipoTicket, Usuario,
} from '../models';
import { decodificar, juegoSchema, juegosSchema, pedidoSchema, sesionSchema, usuarioSchema } from './contrato';
import { api } from './http';
import { z } from 'zod';

/**
 * SERVICIOS: una función por operación de la API de Express.
 * Los componentes NO llaman a axios directamente: usan estas funciones a través
 * de TanStack Query (useQuery / useMutation) o de los contextos.
 */
const comoPedido = (v: unknown): Pedido => decodificar(pedidoSchema, v) as unknown as Pedido;

// ---------- Autenticación ----------
export const authApi = {
  async login(email: string, password: string): Promise<SesionApi> {
    return decodificar(sesionSchema, (await api.post('/auth/login', { email, password })).data);
  },
  async registro(datos: { nombre: string; email: string; password: string; departamento: string }): Promise<SesionApi> {
    return decodificar(sesionSchema, (await api.post('/auth/registro', datos)).data);
  },
  async yo(signal?: AbortSignal): Promise<Usuario> {
    const r = (await api.get('/auth/yo', { signal })).data as { usuario: unknown };
    return decodificar(usuarioSchema, r.usuario);
  },
  async actualizarPerfil(cambios: { nombre?: string; departamento?: string }): Promise<Usuario> {
    const r = (await api.patch('/auth/perfil', cambios)).data as { usuario: unknown };
    return decodificar(usuarioSchema, r.usuario);
  },
  async cambiarPassword(actual: string, nueva: string): Promise<void> {
    await api.post('/auth/password', { actual, nueva });
  },
  async departamentos(): Promise<{ departamentos: string[]; predeterminado: string }> {
    const esquema = z.object({ departamentos: z.array(z.string()), predeterminado: z.string() });
    return decodificar(esquema, (await api.get('/departamentos')).data);
  },
};

// ---------- Catálogo ----------
export const juegosApi = {
  async listar(signal?: AbortSignal): Promise<Juego[]> {
    return decodificar(juegosSchema, (await api.get('/juegos', { signal })).data);
  },
  async obtener(id: number, signal?: AbortSignal): Promise<Juego> {
    return decodificar(juegoSchema, (await api.get(`/juegos/${id}`, { signal })).data);
  },
};

// ---------- Carrito en el servidor ----------
export const carritoApi = {
  async obtener(): Promise<ItemCarritoApi[]> { return (await api.get('/carrito')).data as ItemCarritoApi[]; },
  async guardar(items: ItemCarritoApi[]): Promise<void> { await api.put('/carrito', { items }); },
};

// ---------- Pedidos y biblioteca ----------
export const pedidosApi = {
  async crear(pedido: NuevoPedido): Promise<Pedido> { return comoPedido((await api.post('/pedidos', pedido)).data); },
  async listar(filtros: { estado?: EstadoPedido } = {}, signal?: AbortSignal): Promise<Pedido[]> {
    const data = (await api.get('/pedidos', { params: filtros, signal })).data as unknown[];
    return data.map(comoPedido);
  },
  async obtener(codigo: string, signal?: AbortSignal): Promise<Pedido> {
    return comoPedido((await api.get(`/pedidos/${encodeURIComponent(codigo)}`, { signal })).data);
  },
  async cambiarEstado(codigo: string, estado: EstadoPedido, comentario?: string): Promise<Pedido> {
    return comoPedido((await api.patch(`/pedidos/${encodeURIComponent(codigo)}/estado`, { estado, comentario })).data);
  },
  async biblioteca(signal?: AbortSignal): Promise<ElementoBiblioteca[]> {
    return (await api.get('/biblioteca', { signal })).data as ElementoBiblioteca[];
  },
  /** Pide el PDF con el token de sesión (por eso no basta un <a href>) y lo guarda o lo abre en otra pestaña. */
  async descargarPdf(codigo: string, nombreArchivo: string, abrir = false): Promise<void> {
    const r = await api.get(`/pedidos/${encodeURIComponent(codigo)}/comprobante.pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(r.data as Blob);
    if (abrir) window.open(url, '_blank', 'noopener');
    else {
      const a = document.createElement('a');
      a.href = url; a.download = `${nombreArchivo}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};

// ---------- Soporte ----------
export const soporteApi = {
  async misTickets(signal?: AbortSignal): Promise<Ticket[]> { return (await api.get('/tickets/mios', { signal })).data as Ticket[]; },
  async crearTicket(t: { asunto: string; mensaje: string; tipo: TipoTicket; pedido?: string }): Promise<Ticket> {
    return (await api.post('/tickets', t)).data as Ticket;
  },
  async asistente(mensaje: string, historial: { rol: 'usuario' | 'asistente'; texto: string }[]): Promise<RespuestaAsistente> {
    return (await api.post('/asistente', { mensaje, historial })).data as RespuestaAsistente;
  },
};

// ---------- Panel de administración ----------
export const adminApi = {
  async reportes(signal?: AbortSignal): Promise<Reportes> { return (await api.get('/admin/reportes', { signal })).data as Reportes; },
  async clientes(signal?: AbortSignal): Promise<ClienteResumen[]> { return (await api.get('/admin/clientes', { signal })).data as ClienteResumen[]; },
  async tickets(signal?: AbortSignal): Promise<Ticket[]> { return (await api.get('/tickets', { signal })).data as Ticket[]; },
  async responderTicket(id: number, respuesta: string, resolver = true): Promise<Ticket> {
    return (await api.patch(`/tickets/${id}/responder`, { respuesta, resolver })).data as Ticket;
  },
  async aprobarReembolso(id: number, respuesta?: string): Promise<Ticket> { return (await api.post(`/tickets/${id}/reembolso`, { respuesta })).data as Ticket; },
  async eliminarTicket(id: number): Promise<void> { await api.delete(`/tickets/${id}`); },

  // --- solo administración ---
  async crearJuego(datos: JuegoEditable): Promise<Juego> { return (await api.post('/juegos', datos)).data as Juego; },
  async actualizarJuego(id: number, datos: Partial<JuegoEditable>): Promise<Juego> { return (await api.put(`/juegos/${id}`, datos)).data as Juego; },
  async eliminarJuego(id: number): Promise<void> { await api.delete(`/juegos/${id}`); },
  async ajustarStock(nodo: CodigoNodo, id: number, stock: number): Promise<Juego> { return (await api.put(`/admin/stock/${nodo}/${id}`, { stock })).data as Juego; },
};
