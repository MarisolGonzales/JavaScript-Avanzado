/**
 * Contratos de datos de NEXUS GAMING (Semana 6: TypeScript estricto).
 * Reflejan exactamente lo que devuelve la API de Express.
 */
export type RolUsuario = 'cliente' | 'soporte' | 'admin';
export type CodigoNodo = 'NORTE' | 'SUR' | 'CENTRO';
export type TipoEntrega = 'DIGITAL' | 'REGALO';          // para mi cuenta | para otra persona
export type MetodoPago = 'TARJETA' | 'YAPE' | 'PLIN';
export type TipoComprobante = 'BOLETA' | 'FACTURA';
export type EstadoPedido = 'PENDIENTE' | 'PAGADO' | 'ENTREGADO' | 'REEMBOLSADO';

export interface Usuario {
  readonly email: string;
  readonly nombre: string;
  readonly rol: RolUsuario;
  readonly departamento: string;
}
export interface SesionApi { readonly token: string; readonly usuario: Usuario; }

export interface Juego {
  readonly id: number;
  readonly title: string;
  readonly price: number;
  readonly category: string;
  readonly image: string;
  readonly banner: string | null;
  readonly description: string;
  readonly developer: string | null;
  readonly year: number | null;
  readonly platforms: string | null;
  readonly mode: string | null;
  /** Licencias disponibles para quien consulta. */
  readonly stock: number;
  /** Desglose por servidor regional: solo lo recibe administración. */
  readonly stockPorNodo?: Readonly<Record<CodigoNodo, number>>;
}

/** Renglón del carrito: una licencia por juego (como en Steam o Epic). */
export interface ItemCarrito {
  readonly idJuego: number;
  readonly titulo: string;
  readonly imagen: string;
  readonly precio: number;
  readonly tipoEntrega: TipoEntrega;
}
/** Lo que se guarda en el servidor (el precio SIEMPRE lo decide el servidor). */
export interface ItemCarritoApi { idJuego: number; tipoEntrega: TipoEntrega; cantidad?: number; }

export interface LineaPedido {
  readonly idJuego: number;
  readonly titulo: string;
  readonly imagen: string;
  readonly cantidad: number;
  readonly precioUnitario: number;
  readonly subtotal: number;
  readonly tipoEntrega: TipoEntrega;
  /** Identificador interno de la licencia (no se muestra: el juego se instala desde la biblioteca). */
  readonly claveDigital: string | null;
}
export interface PagoPedido {
  readonly metodo: MetodoPago;
  readonly monto: number;
  readonly estado: 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO';
  readonly referencia: string | null;
  readonly fecha: string;
}
export interface Receptor {
  readonly tipoDoc: 'DNI' | 'RUC' | 'SIN DOC';
  readonly documento: string | null;
  readonly nombre: string | null;
  readonly direccion: string | null;
}
export interface Comprobante {
  readonly tipo: TipoComprobante;
  readonly serie: string;
  readonly numero: number;
  readonly numeroCompleto: string;
  readonly receptor: Receptor;
  readonly subtotal: number;
  readonly igv: number;
  readonly total: number;
  readonly emitidoEn: string;
}
export interface Entrega {
  readonly zona: string;
  readonly canal: 'BIBLIOTECA' | 'REGALO';
  readonly destinatario: string | null;
  readonly mensaje: string | null;
}
export interface CambioEstado {
  readonly estadoAnterior: EstadoPedido | null;
  readonly estadoNuevo: EstadoPedido;
  readonly comentario: string | null;
  readonly fecha: string;
}
export interface Pedido {
  readonly codigo: string;
  readonly nodo: CodigoNodo;
  readonly usuario: string;
  readonly estado: EstadoPedido;
  readonly total: number;
  readonly fecha: string;
  readonly fechaEntrega: string | null;
  readonly items: readonly LineaPedido[];
  readonly pago: PagoPedido;
  readonly comprobante: Comprobante;
  readonly entrega: Entrega | null;
  readonly historial: readonly CambioEstado[];
}

export interface NuevoPedido {
  items: ItemCarritoApi[];
  pago: { metodo: MetodoPago; referencia: string | null };
  comprobante: { tipo: TipoComprobante; documento?: string; nombre?: string; direccion?: string };
  regalo?: { destinatario: string; mensaje: string };
}

export interface ElementoBiblioteca {
  readonly llave: string;
  readonly idJuego: number;
  readonly titulo: string;
  readonly imagen: string;
  /** Identificador interno de la licencia (no se muestra). */
  readonly clave: string | null;
  readonly fecha: string;
  readonly pedido: string | null;
  readonly origen: 'COMPRA' | 'REGALO';
  readonly de: string | null;
  readonly mensaje: string | null;
}

export type TipoTicket = 'CONSULTA' | 'REEMBOLSO';
export interface Ticket {
  readonly id: number;
  readonly asunto: string;
  readonly mensaje: string;
  readonly tipo: TipoTicket;
  readonly pedido: string | null;
  readonly usuario: string;
  readonly fecha: string;
  readonly estado: 'ABIERTO' | 'RESUELTO';
  readonly respuesta: string | null;
  readonly respondidoPor: string | null;
  readonly respondidoEn: string | null;
}

export interface AccionAsistente { tipo: 'ticket'; ticketTipo: TipoTicket; pedido: string | null; }
export interface RespuestaAsistente {
  readonly respuesta: string;
  readonly sugerencias: readonly string[];
  readonly accion: AccionAsistente | null;
  readonly origen: 'local' | 'ia';
}

// ---------- Panel de administración ----------
export interface VentaPorRegion { nodo: CodigoNodo; etiqueta: string; pedidos: number; pedidosValidos: number; ingresos: number; }
export interface VentaDia { fecha: string; pedidos: number; ingresos: number; }
export interface TopJuego { idJuego: number; titulo: string; unidades: number; ingresos: number; }
export interface StockBajo { nodo: CodigoNodo; idJuego: number; titulo: string; stock: number; }
export interface Reportes {
  ingresosTotales: number;
  pedidosValidos: number;
  ticketPromedio: number;
  reembolsos: { pedidos: number; monto: number };
  clientes: number;
  variacionSemanal: number | null;
  ventasPorNodo: VentaPorRegion[];
  ventasPorDia: VentaDia[];
  topJuegos: TopJuego[];
  ventasPorCategoria: { categoria: string; ingresos: number }[];
  pedidosPorEstado: Partial<Record<EstadoPedido, number>>;
  stockBajo: StockBajo[];
  totalJuegos: number;
}
export interface ClienteResumen {
  readonly email: string; readonly nombre: string; readonly departamento: string; readonly nodo: CodigoNodo;
  readonly creadoEn: string; readonly pedidos: number; readonly gasto: number;
}
export interface JuegoEditable {
  title: string; price: number; category: string; description: string; image: string;
  developer: string; year: number | null; stockInicial: number;
}
