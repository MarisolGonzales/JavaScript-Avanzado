import { MONTO_BOLETA_CON_DNI, NODOS } from './constantes.js';
import { calcularTotales, redondear2 } from './calculos.js';
import { generarClave } from './claves.js';
import { badRequest, notFound } from '../errors.js';

const ETIQUETA_METODO = { TARJETA: 'tarjeta', YAPE: 'Yape', PLIN: 'Plin' };

/**
 * Convierte un pedido ya validado en TODOS los datos que hay que guardar.
 * Es una función PURA (no toca la base de datos) y la usan los dos drivers
 * (JSON y PostgreSQL), así ambos calculan exactamente igual: precios, IGV,
 * claves, comprobante y estados.
 *
 * `juegos`: Map<idJuego, juego> leído DENTRO de la transacción; el precio
 * jamás se toma del navegador.
 */
export function prepararPedido({ input, juegos, idPedido, numeroComprobante, ahora = new Date() }) {
  const nodo = NODOS[input.nodo];

  const lineas = input.items.map((it) => {
    const j = juegos.get(it.idJuego);
    if (!j) throw notFound(`El juego ${it.idJuego} no existe o no está disponible.`);
    return {
      idJuego: j.id,
      titulo: j.title,
      imagen: j.image,
      cantidad: 1,
      precioUnitario: j.price,
      subtotal: redondear2(j.price),
      tipoEntrega: it.tipoEntrega,
      claveDigital: generarClave()
    };
  });

  const totales = calcularTotales(lineas, 0);

  // Regla tributaria: boletas de S/ 700 o más deben identificar al cliente con DNI.
  const c = input.comprobante;
  if (c.tipo === 'BOLETA' && totales.total >= MONTO_BOLETA_CON_DNI && !c.documento)
    throw badRequest(`Las boletas desde S/ ${MONTO_BOLETA_CON_DNI} requieren el DNI del cliente.`);

  const esFactura = c.tipo === 'FACTURA';
  const hayRegalo = input.regalo !== null;
  const pasos = [
    { estado: 'PAGADO', comentario: `Pago aprobado con ${ETIQUETA_METODO[input.pago.metodo]}` },
    { estado: 'ENTREGADO', comentario: hayRegalo ? `Regalo enviado a ${input.regalo.destinatario}` : 'Claves entregadas en tu biblioteca' }
  ];

  return {
    codigo: `NX-${nodo.prefijo}-${String(idPedido).padStart(6, '0')}`,
    idPedido,
    nodo: input.nodo,
    usuario: input.usuario,
    lineas,
    totales,
    // "Logística digital": a quién y por qué canal se entregó (tabla detalle_logistica_<región>).
    entrega: {
      zona: input.departamento,
      canal: hayRegalo ? 'REGALO' : 'BIBLIOTECA',
      destinatario: input.regalo?.destinatario ?? null,
      mensaje: input.regalo?.mensaje ?? null
    },
    fechaEntrega: ahora.toISOString(),   // la entrega digital es inmediata
    pago: { metodo: input.pago.metodo, referencia: input.pago.referencia, monto: totales.total, estado: 'APROBADO' },
    comprobante: {
      tipo: c.tipo,
      serie: esFactura ? nodo.serieFactura : nodo.serieBoleta,
      numero: numeroComprobante,
      numeroCompleto: `${esFactura ? nodo.serieFactura : nodo.serieBoleta}-${String(numeroComprobante).padStart(8, '0')}`,
      receptor: {
        tipoDoc: c.tipoDoc,
        documento: c.documento,
        nombre: c.nombre ?? input.nombreUsuario,
        direccion: c.direccion
      },
      subtotal: totales.subtotal,
      igv: totales.igv,
      total: totales.total
    },
    pasos,
    estadoFinal: pasos[pasos.length - 1].estado
  };
}

/** Oculta las claves a quien no es el comprador ni el destinatario (p. ej. el personal de soporte). */
export function ocultarClaves(pedido) {
  return {
    ...pedido,
    items: pedido.items.map((i) => ({ ...i, claveDigital: i.claveDigital ? `•••••-•••••-${i.claveDigital.slice(-5)}` : null }))
  };
}
