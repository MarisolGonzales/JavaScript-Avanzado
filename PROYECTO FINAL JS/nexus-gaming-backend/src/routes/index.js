import { Router } from 'express';
import { config } from '../config.js';
import { LimitadorIntentos, firmarToken, hashPassword, verificarPassword } from '../domain/auth.js';
import { IGV_TASA, NODOS, POLITICA_REEMBOLSO_DIAS, dentroDePlazoReembolso } from '../domain/constantes.js';
import { responderAsistente } from '../domain/asistente.js';
import { generarComprobantePdf } from '../domain/pdf-comprobante.js';
import { ocultarClaves } from '../domain/pedido.js';
import { DEPARTAMENTO_POR_DEFECTO, listaDepartamentos, nodoDeDepartamento } from '../domain/regiones.js';
import {
  texto, validarDepartamento, validarEmail, validarEstado, validarItems, validarJuego, validarNodo,
  validarNombre, validarPassword, validarPedido, validarTicket
} from '../domain/validacion.js';
import { badRequest, conflict, forbidden, notFound, tooMany } from '../errors.js';
import { esStaff, requiereLogin, soloAdmin, soloStaff } from '../middleware/auth.js';

/** Convierte funciones async en handlers de Express que propagan errores. */
const a = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const entero = (v, nombre) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw badRequest(`${nombre} inválido.`);
  return n;
};
const usuarioPublico = (u) => ({ email: u.email, nombre: u.nombre, rol: u.rol, departamento: u.departamento });

export function crearRutas(repo, opciones = {}) {
  const secreto = opciones.jwtSecret ?? config.jwtSecret;
  const apiKey = opciones.anthropicKey ?? config.anthropicKey;
  const modelo = opciones.anthropicModelo ?? config.anthropicModelo;
  const fetchImpl = opciones.fetchImpl ?? fetch;
  const r = Router();

  const limiteLogin = new LimitadorIntentos(5, 15 * 60_000);
  const limiteAsistente = new LimitadorIntentos(20, 60_000);
  const emitirSesion = (u) => ({ token: firmarToken({ sub: u.email, rol: u.rol }, secreto), usuario: usuarioPublico(u) });

  /** Servidor que atiende a quien consulta (solo clientes con sesión; el resto ve el total). */
  const nodoDe = (cuenta) => (cuenta?.rol === 'cliente' ? nodoDeDepartamento(cuenta.departamento) : undefined);
  /** El desglose por servidor es información interna: solo administración. */
  const paraRol = (j, cuenta) => (cuenta?.rol === 'admin' ? j : (({ stockPorNodo, ...resto }) => resto)(j));

  /**
   * Las claves de activación son secretas: solo se muestran completas al COMPRADOR de
   * licencias propias. Soporte ve las claves enmascaradas y quien compra un regalo
   * tampoco ve la clave (se la entrega al destinatario).
   */
  const protegerPedido = (p, cuenta) => {
    const esDueno = p.usuario === cuenta.email;
    const base = esDueno ? p : ocultarClaves(p);
    if (!esDueno) return base;
    return { ...base, items: base.items.map((i) => (i.tipoEntrega === 'REGALO' ? ocultarClaves({ items: [i] }).items[0] : i)) };
  };

  r.get('/salud', (_req, res) => res.json({ estado: 'ok', driver: repo.nombre, version: '3.0.0', asistenteIA: Boolean(apiKey) }));
  r.get('/departamentos', (_req, res) => res.json({ departamentos: listaDepartamentos(), predeterminado: DEPARTAMENTO_POR_DEFECTO }));
  r.get('/politicas', (_req, res) => res.json({ igv: IGV_TASA, reembolsoDias: POLITICA_REEMBOLSO_DIAS }));

  // ======================= AUTENTICACIÓN =======================
  r.post('/auth/registro', a(async (req, res) => {
    const cuerpo = req.body ?? {};
    const email = validarEmail(cuerpo.email);
    const nombre = validarNombre(cuerpo.nombre);
    validarPassword(cuerpo.password);
    const departamento = cuerpo.departamento ? validarDepartamento(cuerpo.departamento) : DEPARTAMENTO_POR_DEFECTO;
    const u = await repo.crearUsuario({ email, nombre, departamento, rol: 'cliente', passwordHash: await hashPassword(cuerpo.password) });
    res.status(201).json(emitirSesion(u));
  }));

  r.post('/auth/login', a(async (req, res) => {
    const email = texto(req.body?.email).toLowerCase();
    const clave = `${req.ip}|${email}`;
    if (limiteLogin.bloqueado(clave)) throw tooMany('Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.');
    const u = email ? await repo.buscarUsuario(email) : null;
    // Siempre se calcula el hash (aunque el usuario no exista) para no revelar qué correos están registrados por el tiempo de respuesta.
    const ok = await verificarPassword(String(req.body?.password ?? ''), u?.passwordHash ?? 'scrypt$00$00');
    if (!u || !ok) { limiteLogin.registrar(clave); throw Object.assign(forbidden('Correo o contraseña incorrectos.'), { status: 401 }); }
    limiteLogin.limpiar(clave);
    res.json(emitirSesion(u));
  }));

  r.get('/auth/yo', requiereLogin, (req, res) => res.json({ usuario: req.cuenta }));

  r.patch('/auth/perfil', requiereLogin, a(async (req, res) => {
    const cambios = {};
    if (req.body?.nombre !== undefined) cambios.nombre = validarNombre(req.body.nombre);
    if (req.body?.departamento !== undefined) cambios.departamento = validarDepartamento(req.body.departamento);
    res.json({ usuario: usuarioPublico(await repo.actualizarPerfil(req.cuenta.email, cambios)) });
  }));

  r.post('/auth/password', requiereLogin, a(async (req, res) => {
    const u = await repo.buscarUsuario(req.cuenta.email);
    if (!(await verificarPassword(String(req.body?.actual ?? ''), u.passwordHash))) throw forbidden('La contraseña actual no es correcta.');
    validarPassword(req.body?.nueva);
    await repo.cambiarPasswordHash(u.email, await hashPassword(req.body.nueva));
    res.status(204).end();
  }));

  // ======================= CATÁLOGO =======================
  r.get('/juegos', a(async (req, res) => {
    const lista = await repo.listarJuegos({ nodo: nodoDe(req.cuenta) });
    res.json(lista.map((j) => paraRol(j, req.cuenta)));
  }));
  r.get('/juegos/:id', a(async (req, res) => res.json(paraRol(await repo.obtenerJuego(entero(req.params.id, 'Id'), { nodo: nodoDe(req.cuenta) }), req.cuenta))));
  r.post('/juegos', soloAdmin, a(async (req, res) => res.status(201).json(await repo.crearJuego(validarJuego(req.body ?? {})))));
  r.put('/juegos/:id', soloAdmin, a(async (req, res) => res.json(await repo.actualizarJuego(entero(req.params.id, 'Id'), validarJuego(req.body ?? {}, true)))));
  r.delete('/juegos/:id', soloAdmin, a(async (req, res) => { await repo.eliminarJuego(entero(req.params.id, 'Id')); res.status(204).end(); }));
  r.put('/admin/stock/:nodo/:id', soloAdmin, a(async (req, res) => {
    const stock = Number(req.body?.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) throw badRequest('Stock inválido.');
    res.json(await repo.ajustarStock(validarNodo(req.params.nodo), entero(req.params.id, 'Id'), stock));
  }));

  // ======================= CARRITO (persistente) =======================
  r.get('/carrito', requiereLogin, a(async (req, res) => res.json(await repo.obtenerCarrito(req.cuenta.email, nodoDeDepartamento(req.cuenta.departamento)))));
  r.put('/carrito', requiereLogin, a(async (req, res) => {
    const vacio = Array.isArray(req.body?.items) && req.body.items.length === 0;
    const items = vacio ? [] : validarItems(req.body?.items);
    res.json(await repo.guardarCarrito(req.cuenta.email, nodoDeDepartamento(req.cuenta.departamento), items));
  }));

  // ======================= PEDIDOS =======================
  r.post('/pedidos', requiereLogin, a(async (req, res) => {
    if (req.cuenta.rol !== 'cliente') throw forbidden('Las cuentas del personal no pueden comprar; usa una cuenta de cliente.');
    const input = validarPedido(req.body ?? {}, req.cuenta);
    res.status(201).json(protegerPedido(await repo.crearPedido(input), req.cuenta));
  }));

  r.get('/pedidos', requiereLogin, a(async (req, res) => {
    const filtros = {};
    if (req.query.estado) filtros.estado = validarEstado(req.query.estado);
    if (esStaff(req.cuenta)) {
      if (req.query.nodo) filtros.nodo = validarNodo(req.query.nodo);
      if (req.query.usuario) filtros.usuario = validarEmail(req.query.usuario);
    } else filtros.usuario = req.cuenta.email; // un cliente solo ve SUS pedidos
    res.json((await repo.listarPedidos(filtros)).map((p) => protegerPedido(p, req.cuenta)));
  }));

  /** Carga un pedido y comprueba que quien pregunta sea el comprador o el personal. */
  const pedidoAccesible = async (req) => {
    const p = await repo.obtenerPedido(String(req.params.codigo).toUpperCase());
    if (!esStaff(req.cuenta) && p.usuario !== req.cuenta.email) throw forbidden('Este pedido pertenece a otra cuenta.');
    return p;
  };

  r.get('/pedidos/:codigo', requiereLogin, a(async (req, res) => res.json(protegerPedido(await pedidoAccesible(req), req.cuenta))));

  /** Descarga del comprobante (boleta o factura) en PDF. */
  r.get('/pedidos/:codigo/comprobante.pdf', requiereLogin, a(async (req, res) => {
    const pedido = await pedidoAccesible(req);
    const pdf = await generarComprobantePdf(pedido);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${req.query.inline ? 'inline' : 'attachment'}; filename="${pedido.comprobante.numeroCompleto}.pdf"`,
      'Content-Length': pdf.length,
      'Cache-Control': 'private, no-store'
    });
    res.end(pdf);
  }));

  r.patch('/pedidos/:codigo/estado', soloStaff, a(async (req, res) => {
    const estado = validarEstado(req.body?.estado);
    const comentario = typeof req.body?.comentario === 'string' ? req.body.comentario.trim().slice(0, 200) : '';
    const p = await repo.cambiarEstado(String(req.params.codigo).toUpperCase(), estado, comentario || `${estado === 'REEMBOLSADO' ? 'Reembolso aprobado' : 'Cambio de estado'} por ${req.cuenta.nombre}`);
    res.json(protegerPedido(p, req.cuenta));
  }));

  r.get('/biblioteca', requiereLogin, a(async (req, res) => res.json(await repo.listarBiblioteca(req.cuenta.email))));

  // ======================= ADMINISTRACIÓN / SOPORTE =======================
  r.get('/admin/reportes', soloStaff, a(async (_req, res) => res.json({ ...(await repo.reportes()), servidores: Object.fromEntries(Object.entries(NODOS).map(([k, v]) => [k, v.etiqueta])) })));
  r.get('/admin/clientes', soloStaff, a(async (_req, res) => res.json(await repo.listarClientes())));

  // ======================= TICKETS =======================
  r.post('/tickets', requiereLogin, a(async (req, res) => {
    const t = validarTicket(req.body);
    if (t.tipo === 'REEMBOLSO') {
      const p = await repo.obtenerPedido(t.pedido).catch(() => null);
      if (!p || p.usuario !== req.cuenta.email) throw notFound('No encontramos ese pedido en tu cuenta.');
      if (p.estado === 'REEMBOLSADO' || p.estado === 'PENDIENTE') throw conflict(`El pedido ${p.codigo} está ${p.estado.toLowerCase()} y no admite reembolso.`);
      if (!dentroDePlazoReembolso(p.fecha)) throw conflict(`El pedido ${p.codigo} superó el plazo de ${POLITICA_REEMBOLSO_DIAS} días para reembolsos.`);
      const abierto = (await repo.listarTickets({ usuario: req.cuenta.email })).find((x) => x.tipo === 'REEMBOLSO' && x.pedido === p.codigo && x.estado === 'ABIERTO');
      if (abierto) throw conflict(`Ya tienes una solicitud de reembolso abierta para ${p.codigo} (ticket #${abierto.id}).`);
    }
    res.status(201).json(await repo.crearTicket({ ...t, usuario: req.cuenta.email }));
  }));

  r.get('/tickets/mios', requiereLogin, a(async (req, res) => res.json(await repo.listarTickets({ usuario: req.cuenta.email }))));
  r.get('/tickets', soloStaff, a(async (_req, res) => res.json(await repo.listarTickets())));

  r.patch('/tickets/:id/responder', soloStaff, a(async (req, res) => {
    const respuesta = typeof req.body?.respuesta === 'string' ? req.body.respuesta.trim() : '';
    if (respuesta.length < 3 || respuesta.length > 1000) throw badRequest('La respuesta debe tener entre 3 y 1000 caracteres.');
    res.json(await repo.responderTicket(entero(req.params.id, 'Id'), { respuesta, por: req.cuenta.nombre, resolver: req.body?.resolver !== false }));
  }));

  /** Aprobar un reembolso: reembolsa el pedido (repone stock, anula la clave) y resuelve el ticket. */
  r.post('/tickets/:id/reembolso', soloStaff, a(async (req, res) => {
    const t = await repo.obtenerTicket(entero(req.params.id, 'Id'));
    if (t.tipo !== 'REEMBOLSO' || !t.pedido) throw badRequest('Este ticket no es una solicitud de reembolso.');
    if (t.estado === 'RESUELTO') throw conflict('Este ticket ya fue resuelto.');
    await repo.cambiarEstado(t.pedido, 'REEMBOLSADO', `Reembolso aprobado por ${req.cuenta.nombre} (ticket #${t.id})`);
    res.json(await repo.responderTicket(t.id, {
      respuesta: texto(req.body?.respuesta) || `Aprobamos tu reembolso del pedido ${t.pedido}. La clave fue anulada y el monto se devolverá a tu medio de pago.`,
      por: req.cuenta.nombre, resolver: true
    }));
  }));

  r.delete('/tickets/:id', soloAdmin, a(async (req, res) => { await repo.eliminarTicket(entero(req.params.id, 'Id')); res.status(204).end(); }));

  // ======================= ASISTENTE VIRTUAL =======================
  r.post('/asistente', a(async (req, res) => {
    const mensaje = typeof req.body?.mensaje === 'string' ? req.body.mensaje.trim() : '';
    if (mensaje.length < 1 || mensaje.length > 500) throw badRequest('Escribe un mensaje de hasta 500 caracteres.');
    const clave = req.cuenta?.email ?? req.ip;
    if (limiteAsistente.bloqueado(clave)) throw tooMany('Estás escribiendo muy rápido; espera un momento.');
    limiteAsistente.registrar(clave);
    const pedidos = req.cuenta?.rol === 'cliente'
      ? (await repo.listarPedidos({ usuario: req.cuenta.email })).slice(0, 5).map(({ codigo, estado, total, fecha }) => ({ codigo, estado, total, fecha }))
      : [];
    const historial = Array.isArray(req.body?.historial) ? req.body.historial.slice(-6) : [];
    res.json(await responderAsistente(
      { mensaje, historial, nombre: req.cuenta?.nombre ?? null, pedidos },
      { apiKey, modelo, fetchImpl }
    ));
  }));

  return r;
}
