import type { EstadoPedido } from '../../shared/models';

/** Etiqueta, icono y estilo de cada estado (switch: Semana 1). */
export function infoEstado(estado: EstadoPedido): { etiqueta: string; icono: string; clase: string } {
  switch (estado) {
    case 'PENDIENTE':   return { etiqueta: 'Pendiente',   icono: 'fa-hourglass-half', clase: 'est-pendiente' };
    case 'PAGADO':      return { etiqueta: 'Pagado',      icono: 'fa-circle-check',   clase: 'est-pagado' };
    case 'ENTREGADO':   return { etiqueta: 'Entregado',   icono: 'fa-key',            clase: 'est-entregado' };
    case 'REEMBOLSADO': return { etiqueta: 'Reembolsado', icono: 'fa-rotate-left',    clase: 'est-reembolsado' };
  }
}

export const ESTADOS_PEDIDO: readonly EstadoPedido[] = ['PENDIENTE', 'PAGADO', 'ENTREGADO', 'REEMBOLSADO'];

/** Un pedido se puede reembolsar mientras esté pagado o entregado (y no antes). */
export const admiteReembolso = (estado: EstadoPedido): boolean => estado === 'PAGADO' || estado === 'ENTREGADO';
