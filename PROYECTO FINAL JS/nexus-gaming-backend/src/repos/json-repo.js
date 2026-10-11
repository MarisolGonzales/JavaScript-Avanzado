import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { NODOS, diaLima, nodoDeCodigo, transicionValida } from '../domain/constantes.js';
import { nodoDeDepartamento } from '../domain/regiones.js';
import { prepararPedido } from '../domain/pedido.js';
import { conflict, notFound } from '../errors.js';
import { JUEGOS_INICIALES } from './juegos-iniciales.js';
import { usuariosIniciales } from './semilla.js';

const UMBRAL_STOCK_BAJO = 5;
const VERSION = 3;
const clonar = (o) => structuredClone(o);
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function estadoInicial() {
  const nodos = {};
  for (const n of Object.keys(NODOS)) {
    nodos[n] = {
      stock: Object.fromEntries(JUEGOS_INICIALES.map((j) => [j.id, j.stockInicial])),
      carritos: {}, pedidos: [], seqPedido: 0, seqComprobante: { boleta: 0, factura: 0 }
    };
  }
  return { version: VERSION, usuarios: [], juegos: clonar(JUEGOS_INICIALES), nodos, tickets: [], seqTicket: 0 };
}

/**
 * Driver sin dependencias externas: guarda todo en un archivo JSON, pero respeta
 * el MISMO modelo distribuido que PostgreSQL (3 servidores regionales con su propio
 * stock, pedidos y carritos; catálogo y usuarios en "central").
 * Cada escritura es atómica: se trabaja sobre una copia y solo se confirma (y se
 * escribe a disco) si no hubo errores — equivale a un ROLLBACK.
 */
export class JsonRepo {
  nombre = 'json';
  #estado;
  #cola = Promise.resolve();

  constructor(archivo) { this.archivo = archivo; }

  async init() {
    try {
      const crudo = JSON.parse(await readFile(this.archivo, 'utf8'));
      this.#estado = crudo.version === VERSION ? crudo : estadoInicial(); // formato antiguo -> se regenera
    } catch {
      this.#estado = estadoInicial();
    }
    if (this.#estado.usuarios.length === 0) this.#estado.usuarios = await usuariosIniciales();
    await this.#persistir();
  }

  async close() { await this.#cola; }

  async #persistir() {
    await mkdir(dirname(this.archivo), { recursive: true });
    const tmp = `${this.archivo}.tmp`;
    await writeFile(tmp, JSON.stringify(this.#estado, null, 2));
    await rename(tmp, this.archivo);
  }

  /** Serializa las transacciones: una a la vez, con commit/rollback. */
  #tx(fn) {
    const ejecutar = async () => {
      const borrador = clonar(this.#estado);
      const resultado = await fn(borrador);
      this.#estado = borrador;
      await this.#persistir();
      return resultado;
    };
    const p = this.#cola.then(ejecutar, ejecutar);
    this.#cola = p.catch(() => undefined);
    return p;
  }

  // ---------- usuarios ----------
  async buscarUsuario(email) {
    const u = this.#estado.usuarios.find((x) => x.email === email);
    return u ? clonar(u) : null;
  }

  crearUsuario({ email, nombre, passwordHash, rol, departamento }) {
    return this.#tx((e) => {
      if (e.usuarios.some((u) => u.email === email)) throw conflict('Ya existe una cuenta con ese correo.');
      const u = { email, nombre, passwordHash, rol, departamento, creadoEn: new Date().toISOString() };
      e.usuarios.push(u);
      return clonar(u);
    });
  }

  actualizarPerfil(email, { nombre, departamento }) {
    return this.#tx((e) => {
      const u = e.usuarios.find((x) => x.email === email);
      if (!u) throw notFound('Usuario no encontrado.');
      if (nombre !== undefined) u.nombre = nombre;
      if (departamento !== undefined) u.departamento = departamento;
      return clonar(u);
    });
  }

  cambiarPasswordHash(email, passwordHash) {
    return this.#tx((e) => {
      const u = e.usuarios.find((x) => x.email === email);
      if (!u) throw notFound('Usuario no encontrado.');
      u.passwordHash = passwordHash;
    });
  }

  async listarClientes() {
    const e = this.#estado;
    const pedidos = Object.values(e.nodos).flatMap((n) => n.pedidos).filter((p) => p.estado !== 'REEMBOLSADO');
    return e.usuarios.filter((u) => u.rol === 'cliente').map((u) => {
      const suyos = pedidos.filter((p) => p.usuario === u.email);
      return {
        email: u.email, nombre: u.nombre, departamento: u.departamento, nodo: nodoDeDepartamento(u.departamento),
        creadoEn: u.creadoEn, pedidos: suyos.length, gasto: r2(suyos.reduce((s, p) => s + p.total, 0))
      };
    }).sort((a, b) => b.gasto - a.gasto);
  }

  // ---------- catálogo ----------
  #vistaJuego(j, nodo, estado = this.#estado) {
    const stockPorNodo = Object.fromEntries(Object.keys(NODOS).map((n) => [n, estado.nodos[n].stock[j.id] ?? 0]));
    const total = Object.values(stockPorNodo).reduce((a, b) => a + b, 0);
    const { stockInicial, activo, ...publico } = j;
    return { ...publico, stock: nodo ? stockPorNodo[nodo] : total, stockPorNodo };
  }

  async listarJuegos({ nodo } = {}) { return this.#estado.juegos.filter((j) => j.activo).map((j) => this.#vistaJuego(j, nodo)); }

  async obtenerJuego(id, { nodo } = {}) {
    const j = this.#estado.juegos.find((x) => x.id === id && x.activo);
    if (!j) throw notFound(`No existe el juego ${id}.`);
    return this.#vistaJuego(j, nodo);
  }

  crearJuego(datos) {
    return this.#tx((e) => {
      const id = Math.max(0, ...e.juegos.map((j) => j.id)) + 1;
      const j = {
        id, title: datos.title, price: datos.price, category: datos.category, image: datos.image,
        banner: datos.banner ?? null, description: datos.description ?? '', developer: datos.developer ?? null,
        year: datos.year ?? null, platforms: datos.platforms ?? null, mode: datos.mode ?? null,
        stockInicial: datos.stockInicial, activo: true
      };
      e.juegos.push(j);
      // Replicación: el juego nace en los 3 servidores con el stock inicial.
      for (const n of Object.keys(NODOS)) e.nodos[n].stock[id] = j.stockInicial;
      return this.#vistaJuego(j, undefined, e);
    });
  }

  actualizarJuego(id, cambios) {
    return this.#tx((e) => {
      const j = e.juegos.find((x) => x.id === id && x.activo);
      if (!j) throw notFound(`No existe el juego ${id}.`);
      const { stockInicial, ...catalogo } = cambios; // el stock de cada servidor NO se pisa al replicar
      Object.assign(j, catalogo);
      if (stockInicial !== undefined) j.stockInicial = stockInicial;
      return this.#vistaJuego(j, undefined, e);
    });
  }

  eliminarJuego(id) {
    return this.#tx((e) => {
      const j = e.juegos.find((x) => x.id === id && x.activo);
      if (!j) throw notFound(`No existe el juego ${id}.`);
      j.activo = false; // baja lógica: los pedidos históricos conservan la referencia
    });
  }

  ajustarStock(nodo, idJuego, stock) {
    return this.#tx((e) => {
      if (!e.juegos.some((j) => j.id === idJuego && j.activo)) throw notFound(`No existe el juego ${idJuego}.`);
      e.nodos[nodo].stock[idJuego] = stock;
      return this.#vistaJuego(e.juegos.find((j) => j.id === idJuego), undefined, e);
    });
  }

  // ---------- carrito ----------
  async obtenerCarrito(usuario, nodo) { return clonar(this.#estado.nodos[nodo].carritos[usuario] ?? []); }

  guardarCarrito(usuario, nodo, items) {
    return this.#tx((e) => {
      for (const it of items) {
        if (!e.juegos.some((j) => j.id === it.idJuego && j.activo)) throw notFound(`El juego ${it.idJuego} no existe.`);
      }
      if (items.length === 0) delete e.nodos[nodo].carritos[usuario];
      else e.nodos[nodo].carritos[usuario] = items;
      return items;
    });
  }

  // ---------- pedidos ----------
  crearPedido(input) {
    return this.#tx((e) => {
      const n = e.nodos[input.nodo];
      const juegos = new Map(e.juegos.filter((j) => j.activo).map((j) => [j.id, j]));

      // Equivale a CALL sp_descontar_stock(id, 1): si algo falla, se descarta todo el borrador.
      for (const it of input.items) {
        const j = juegos.get(it.idJuego);
        if (!j) throw notFound(`El juego ${it.idJuego} no existe o no está disponible.`);
        const disponible = n.stock[it.idJuego] ?? 0;
        if (disponible < 1) throw conflict(`"${j.title}" no tiene claves disponibles por ahora.`);
        n.stock[it.idJuego] = disponible - 1;
      }

      const ahora = new Date();
      const tipoSerie = input.comprobante.tipo === 'FACTURA' ? 'factura' : 'boleta';
      const p = prepararPedido({
        input, juegos, idPedido: ++n.seqPedido, numeroComprobante: ++n.seqComprobante[tipoSerie], ahora
      });

      const historial = [{ estadoAnterior: null, estadoNuevo: 'PENDIENTE', comentario: 'Pedido creado', fecha: ahora.toISOString() }];
      let previo = 'PENDIENTE';
      for (const paso of p.pasos) {
        historial.push({ estadoAnterior: previo, estadoNuevo: paso.estado, comentario: paso.comentario, fecha: ahora.toISOString() });
        previo = paso.estado;
      }

      const pedido = {
        codigo: p.codigo, nodo: p.nodo, usuario: p.usuario, estado: p.estadoFinal,
        total: p.totales.total, fecha: ahora.toISOString(), fechaEntrega: p.fechaEntrega,
        items: p.lineas,
        pago: { ...p.pago, fecha: ahora.toISOString() },
        comprobante: { ...p.comprobante, emitidoEn: ahora.toISOString() },
        entrega: p.entrega,
        historial
      };
      n.pedidos.push(pedido);
      delete n.carritos[input.usuario]; // el carrito queda CONVERTIDO
      return clonar(pedido);
    });
  }

  async listarPedidos({ usuario, nodo, estado } = {}) {
    const nodos = nodo ? [nodo] : Object.keys(NODOS);
    return nodos.flatMap((n) => this.#estado.nodos[n].pedidos)
      .filter((p) => (!usuario || p.usuario === usuario) && (!estado || p.estado === estado))
      .sort((a, b) => b.fecha.localeCompare(a.fecha)).map(clonar);
  }

  async obtenerPedido(codigo) {
    const nodo = nodoDeCodigo(codigo);
    const p = nodo && this.#estado.nodos[nodo].pedidos.find((x) => x.codigo === codigo);
    if (!p) throw notFound(`No existe el pedido ${codigo}.`);
    return clonar(p);
  }

  cambiarEstado(codigo, nuevo, comentario) {
    return this.#tx((e) => {
      const nodo = nodoDeCodigo(codigo);
      const p = nodo && e.nodos[nodo].pedidos.find((x) => x.codigo === codigo);
      if (!p) throw notFound(`No existe el pedido ${codigo}.`);
      if (p.estado === nuevo) return clonar(p);
      if (!transicionValida(p.estado, nuevo)) throw conflict(`Transición inválida: ${p.estado} → ${nuevo}.`);
      if (nuevo === 'REEMBOLSADO') {
        // Equivale a CALL sp_reponer_stock(id, 1) por cada licencia; la clave deja de ser válida.
        for (const it of p.items) e.nodos[nodo].stock[it.idJuego] = (e.nodos[nodo].stock[it.idJuego] ?? 0) + it.cantidad;
        p.pago.estado = 'REEMBOLSADO';
      }
      p.historial.push({
        estadoAnterior: p.estado, estadoNuevo: nuevo,
        comentario: comentario || (nuevo === 'REEMBOLSADO' ? 'Reembolso aprobado; clave anulada' : 'Cambio de estado'),
        fecha: new Date().toISOString()
      });
      p.estado = nuevo;
      return clonar(p);
    });
  }

  /** Solo para el script de datos de demostración: mueve un pedido a otra fecha. */
  reprogramarFecha(codigo, fechaIso) {
    return this.#tx((e) => {
      const nodo = nodoDeCodigo(codigo);
      const p = nodo && e.nodos[nodo].pedidos.find((x) => x.codigo === codigo);
      if (!p) throw notFound(`No existe el pedido ${codigo}.`);
      p.fecha = p.fechaEntrega = p.pago.fecha = p.comprobante.emitidoEn = fechaIso;
      p.historial.forEach((h) => { h.fecha = fechaIso; });
    });
  }

  // ---------- biblioteca (compras propias + regalos recibidos) ----------
  async listarBiblioteca(email) {
    const salida = [];
    for (const p of Object.values(this.#estado.nodos).flatMap((n) => n.pedidos)) {
      if (p.estado !== 'ENTREGADO') continue; // reembolsados o sin pagar no cuentan
      for (const it of p.items) {
        const propio = it.tipoEntrega === 'DIGITAL' && p.usuario === email;
        const regaloRecibido = it.tipoEntrega === 'REGALO' && p.entrega?.destinatario === email;
        if (!propio && !regaloRecibido) continue;
        salida.push({
          llave: `${p.codigo}-${it.idJuego}-${it.tipoEntrega}`, idJuego: it.idJuego, titulo: it.titulo, imagen: it.imagen,
          clave: it.claveDigital, fecha: p.fecha, pedido: regaloRecibido ? null : p.codigo,
          origen: regaloRecibido ? 'REGALO' : 'COMPRA', de: regaloRecibido ? p.usuario : null, mensaje: regaloRecibido ? p.entrega.mensaje : null
        });
      }
    }
    return salida.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  // ---------- reportes para el dashboard (equivalen a las vistas v_* de la base central) ----------
  async reportes(ahora = new Date()) {
    const e = this.#estado;
    const todos = Object.entries(e.nodos).flatMap(([nodo, n]) => n.pedidos.map((p) => ({ ...p, nodo })));
    const validos = todos.filter((p) => p.estado !== 'REEMBOLSADO');
    const reembolsados = todos.filter((p) => p.estado === 'REEMBOLSADO');
    const juegoPorId = new Map(e.juegos.map((j) => [j.id, j]));

    const ventasPorNodo = Object.keys(NODOS).map((nodo) => {
      const v = validos.filter((p) => p.nodo === nodo);
      return { nodo, etiqueta: NODOS[nodo].etiqueta, pedidos: todos.filter((p) => p.nodo === nodo).length, pedidosValidos: v.length, ingresos: r2(v.reduce((s, p) => s + p.total, 0)) };
    });

    // Últimos 14 días en hora de Lima (los días sin ventas aparecen con 0).
    const ventasPorDia = Array.from({ length: 14 }, (_, i) => {
      const fecha = diaLima(new Date(ahora.getTime() - (13 - i) * 86_400_000));
      const delDia = validos.filter((p) => diaLima(p.fecha) === fecha);
      return { fecha, pedidos: delDia.length, ingresos: r2(delDia.reduce((s, p) => s + p.total, 0)) };
    });
    const ult7 = ventasPorDia.slice(7).reduce((s, d) => s + d.ingresos, 0);
    const prev7 = ventasPorDia.slice(0, 7).reduce((s, d) => s + d.ingresos, 0);

    const porJuego = new Map();
    const porCategoria = new Map();
    for (const p of validos) for (const it of p.items) {
      const a = porJuego.get(it.idJuego) ?? { idJuego: it.idJuego, titulo: it.titulo, unidades: 0, ingresos: 0 };
      a.unidades += it.cantidad; a.ingresos = r2(a.ingresos + it.subtotal); porJuego.set(it.idJuego, a);
      const cat = juegoPorId.get(it.idJuego)?.category ?? 'Otros';
      porCategoria.set(cat, r2((porCategoria.get(cat) ?? 0) + it.subtotal));
    }

    const stockBajo = [];
    for (const nodo of Object.keys(NODOS)) for (const j of e.juegos.filter((x) => x.activo)) {
      const stock = e.nodos[nodo].stock[j.id] ?? 0;
      if (stock <= UMBRAL_STOCK_BAJO) stockBajo.push({ nodo, idJuego: j.id, titulo: j.title, stock });
    }
    stockBajo.sort((a, b) => a.stock - b.stock || a.titulo.localeCompare(b.titulo));

    const pedidosPorEstado = {};
    for (const p of todos) pedidosPorEstado[p.estado] = (pedidosPorEstado[p.estado] ?? 0) + 1;
    const ingresosTotales = r2(validos.reduce((s, p) => s + p.total, 0));

    return {
      ingresosTotales, pedidosValidos: validos.length,
      ticketPromedio: validos.length ? r2(ingresosTotales / validos.length) : 0,
      reembolsos: { pedidos: reembolsados.length, monto: r2(reembolsados.reduce((s, p) => s + p.total, 0)) },
      clientes: e.usuarios.filter((u) => u.rol === 'cliente').length,
      variacionSemanal: prev7 === 0 ? null : Math.round(((ult7 - prev7) / prev7) * 1000) / 10,
      ventasPorNodo, ventasPorDia,
      topJuegos: [...porJuego.values()].sort((a, b) => b.ingresos - a.ingresos).slice(0, 5),
      ventasPorCategoria: [...porCategoria].map(([categoria, ingresos]) => ({ categoria, ingresos })).sort((a, b) => b.ingresos - a.ingresos),
      pedidosPorEstado, stockBajo,
      totalJuegos: e.juegos.filter((j) => j.activo).length
    };
  }

  // ---------- tickets de soporte ----------
  async listarTickets({ usuario } = {}) {
    return clonar(this.#estado.tickets).filter((t) => !usuario || t.usuario === usuario).sort((a, b) => b.id - a.id);
  }

  async obtenerTicket(id) {
    const t = this.#estado.tickets.find((x) => x.id === id);
    if (!t) throw notFound(`No existe el ticket ${id}.`);
    return clonar(t);
  }

  crearTicket({ asunto, mensaje, tipo, pedido, usuario }) {
    return this.#tx((e) => {
      const t = {
        id: ++e.seqTicket, asunto, mensaje, tipo, pedido: pedido ?? null, usuario, fecha: new Date().toISOString(),
        estado: 'ABIERTO', respuesta: null, respondidoPor: null, respondidoEn: null
      };
      e.tickets.push(t);
      return clonar(t);
    });
  }

  responderTicket(id, { respuesta, por, resolver }) {
    return this.#tx((e) => {
      const t = e.tickets.find((x) => x.id === id);
      if (!t) throw notFound(`No existe el ticket ${id}.`);
      t.respuesta = respuesta; t.respondidoPor = por; t.respondidoEn = new Date().toISOString();
      if (resolver) t.estado = 'RESUELTO';
      return clonar(t);
    });
  }

  eliminarTicket(id) {
    return this.#tx((e) => {
      const i = e.tickets.findIndex((x) => x.id === id);
      if (i < 0) throw notFound(`No existe el ticket ${id}.`);
      e.tickets.splice(i, 1);
    });
  }
}
