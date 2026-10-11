import pg from 'pg';
import { NODOS, diaLima, nodoDeCodigo, transicionValida } from '../domain/constantes.js';
import { nodoDeDepartamento } from '../domain/regiones.js';
import { prepararPedido } from '../domain/pedido.js';
import { ApiError, badRequest, conflict, notFound } from '../errors.js';
import { usuariosIniciales } from './semilla.js';

// numeric -> Number (los importes de la tienda caben holgadamente en un double)
pg.types.setTypeParser(1700, (v) => Number(v));
// bigint (count) -> Number
pg.types.setTypeParser(20, (v) => Number(v));

const NODOS_CLAVES = Object.keys(NODOS);
const tablaLogistica = (nodo) => `detalle_logistica_${NODOS[nodo].region}`;
const ISO = (d) => (d instanceof Date ? d.toISOString() : d);
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Driver PostgreSQL distribuido (Semanas 9 y 10):
 *  - Operaciones transaccionales (pedido, stock, carrito) -> directo contra la base del servidor
 *    regional que atiende al cliente.
 *  - Catálogo maestro, usuarios, tickets y reportes globales -> base central (que consulta
 *    los servidores con postgres_fdw y replica el catálogo con triggers).
 */
export class PgRepo {
  nombre = 'postgres';
  #pools = {};

  constructor(cfg) { this.cfg = cfg; }

  async init() {
    const { host, port, user, password, databases } = this.cfg;
    for (const [clave, database] of Object.entries(databases)) {
      this.#pools[clave] = new pg.Pool({ host, port, user, password, database, max: 10 });
      this.#pools[clave].on('error', (e) => console.error(`[pg:${clave}]`, e.message));
    }
    for (const [clave, pool] of Object.entries(this.#pools)) {
      try { await pool.query('SELECT 1'); }
      catch (e) {
        throw new Error(`No se pudo conectar a la base "${databases[clave]}" (${clave}): ${e.message}. ` +
          'Ejecuta database/instalar.sh|ps1 y revisa PG_* en .env.');
      }
    }
    // Primera vez: se crean las cuentas de demostración (el hash lo calcula la API).
    const { rows } = await this.#pools.CENTRAL.query('SELECT count(*)::int AS n FROM usuario');
    if (rows[0].n === 0) {
      for (const u of await usuariosIniciales()) {
        await this.#pools.CENTRAL.query(
          'INSERT INTO usuario(email, nombre, password_hash, rol, departamento) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
          [u.email, u.nombre, u.passwordHash, u.rol, u.departamento]);
      }
    }
  }

  async close() { await Promise.all(Object.values(this.#pools).map((p) => p.end())); }

  // ---------- infraestructura ----------
  #mapearError(e) {
    if (e instanceof ApiError) return e;
    if (e?.code === 'P0001') return conflict(e.message);          // sin claves / transición inválida
    if (e?.code === 'P0002') return notFound(e.message);
    if (e?.code === '22023' || e?.code === '23514') return badRequest(e.message);
    if (e?.code === '40001' || e?.code === '40P01') return conflict('Hubo un conflicto de concurrencia; inténtalo de nuevo.');
    return e;
  }

  async #tx(clave, fn) {
    const client = await this.#pools[clave].connect();
    try {
      await client.query('BEGIN');
      const r = await fn(client);
      await client.query('COMMIT');
      return r;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw this.#mapearError(e);
    } finally { client.release(); }
  }

  async #q(clave, sql, params) {
    try { return (await this.#pools[clave].query(sql, params)).rows; }
    catch (e) { throw this.#mapearError(e); }
  }

  // ---------- usuarios (base central) ----------
  #usuarioApi = (r) => ({ email: r.email, nombre: r.nombre, passwordHash: r.password_hash, rol: r.rol, departamento: r.departamento, creadoEn: ISO(r.creado_en) });

  async buscarUsuario(email) {
    const f = await this.#q('CENTRAL', 'SELECT * FROM usuario WHERE email = $1', [email]);
    return f[0] ? this.#usuarioApi(f[0]) : null;
  }

  async crearUsuario({ email, nombre, passwordHash, rol, departamento }) {
    try {
      const f = await this.#pools.CENTRAL.query(
        'INSERT INTO usuario(email, nombre, password_hash, rol, departamento) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [email, nombre, passwordHash, rol, departamento]);
      return this.#usuarioApi(f.rows[0]);
    } catch (e) {
      if (e.code === '23505') throw conflict('Ya existe una cuenta con ese correo.');
      throw this.#mapearError(e);
    }
  }

  async actualizarPerfil(email, { nombre, departamento }) {
    const f = await this.#q('CENTRAL',
      'UPDATE usuario SET nombre = COALESCE($2, nombre), departamento = COALESCE($3, departamento) WHERE email = $1 RETURNING *',
      [email, nombre ?? null, departamento ?? null]);
    if (!f[0]) throw notFound('Usuario no encontrado.');
    return this.#usuarioApi(f[0]);
  }

  async cambiarPasswordHash(email, passwordHash) {
    const f = await this.#q('CENTRAL', 'UPDATE usuario SET password_hash = $2 WHERE email = $1 RETURNING email', [email, passwordHash]);
    if (!f[0]) throw notFound('Usuario no encontrado.');
  }

  async listarClientes() {
    const f = await this.#q('CENTRAL', `
      SELECT u.email, u.nombre, u.departamento, u.creado_en,
             COALESCE(p.n, 0) AS pedidos, COALESCE(p.total, 0) AS gasto
        FROM usuario u
        LEFT JOIN (SELECT id_usuario, count(*) AS n, sum(monto_total) AS total
                     FROM v_pedidos_global WHERE estado <> 'REEMBOLSADO' GROUP BY id_usuario) p ON p.id_usuario = u.email
       WHERE u.rol = 'cliente' ORDER BY gasto DESC, u.nombre`);
    return f.map((r) => ({
      email: r.email, nombre: r.nombre, departamento: r.departamento, nodo: nodoDeDepartamento(r.departamento),
      creadoEn: ISO(r.creado_en), pedidos: r.pedidos, gasto: r2(r.gasto)
    }));
  }

  // ---------- catálogo (base central + tablas foráneas) ----------
  static #SQL_JUEGOS = `
    SELECT j.id_juego, j.titulo, j.categoria, j.precio, j.imagen, j.banner, j.descripcion,
           j.desarrollador, j.anio, j.plataformas, j.modo,
           COALESCE(n.stock, 0) AS stock_norte,
           COALESCE(s.stock, 0) AS stock_sur,
           COALESCE(c.stock, 0) AS stock_centro
      FROM juego j
      LEFT JOIN nodo_norte.juego  n ON n.id_juego = j.id_juego
      LEFT JOIN nodo_sur.juego    s ON s.id_juego = j.id_juego
      LEFT JOIN nodo_centro.juego c ON c.id_juego = j.id_juego
     WHERE j.activo`;

  #juegoApi(r, nodo) {
    const stockPorNodo = { NORTE: r.stock_norte, SUR: r.stock_sur, CENTRO: r.stock_centro };
    return {
      id: r.id_juego, title: r.titulo, price: r.precio, category: r.categoria,
      image: r.imagen, banner: r.banner, description: r.descripcion ?? '',
      developer: r.desarrollador, year: r.anio, platforms: r.plataformas, mode: r.modo,
      stock: nodo ? stockPorNodo[nodo] : stockPorNodo.NORTE + stockPorNodo.SUR + stockPorNodo.CENTRO,
      stockPorNodo
    };
  }

  async listarJuegos({ nodo } = {}) {
    return (await this.#q('CENTRAL', `${PgRepo.#SQL_JUEGOS} ORDER BY j.id_juego`)).map((r) => this.#juegoApi(r, nodo));
  }

  async obtenerJuego(id, { nodo } = {}) {
    const f = await this.#q('CENTRAL', `${PgRepo.#SQL_JUEGOS} AND j.id_juego = $1`, [id]);
    if (!f[0]) throw notFound(`No existe el juego ${id}.`);
    return this.#juegoApi(f[0], nodo);
  }

  async crearJuego(d) {
    const id = await this.#tx('CENTRAL', async (c) => {
      await c.query('SELECT pg_advisory_xact_lock(7001)');
      const { rows } = await c.query('SELECT COALESCE(MAX(id_juego), 0) + 1 AS id FROM juego');
      await c.query(
        `INSERT INTO juego (id_juego, titulo, categoria, precio, stock_inicial, imagen, banner,
                            descripcion, desarrollador, anio, plataformas, modo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [rows[0].id, d.title, d.category, d.price, d.stockInicial, d.image, d.banner ?? null,
         d.description ?? '', d.developer ?? null, d.year ?? null, d.platforms ?? null, d.mode ?? null]);
      return rows[0].id; // los triggers replicaron el juego a los 3 servidores dentro de esta transacción
    });
    return this.obtenerJuego(id);
  }

  async actualizarJuego(id, cambios) {
    const columnas = {
      title: 'titulo', price: 'precio', category: 'categoria', image: 'imagen', banner: 'banner',
      description: 'descripcion', developer: 'desarrollador', year: 'anio', platforms: 'plataformas',
      mode: 'modo', stockInicial: 'stock_inicial'
    };
    const sets = []; const vals = [];
    for (const [k, col] of Object.entries(columnas)) {
      if (cambios[k] !== undefined) { vals.push(cambios[k]); sets.push(`${col} = $${vals.length}`); }
    }
    if (sets.length) {
      vals.push(id);
      const f = await this.#q('CENTRAL',
        `UPDATE juego SET ${sets.join(', ')}, actualizado = CURRENT_TIMESTAMP WHERE id_juego = $${vals.length} AND activo RETURNING id_juego`, vals);
      if (!f[0]) throw notFound(`No existe el juego ${id}.`);
    }
    return this.obtenerJuego(id);
  }

  async eliminarJuego(id) {
    // Baja lógica: el UPDATE dispara la réplica (activo = false) en los 3 servidores.
    const f = await this.#q('CENTRAL',
      'UPDATE juego SET activo = false, actualizado = CURRENT_TIMESTAMP WHERE id_juego = $1 AND activo RETURNING id_juego', [id]);
    if (!f[0]) throw notFound(`No existe el juego ${id}.`);
  }

  async ajustarStock(nodo, idJuego, stock) {
    const f = await this.#q(nodo,
      'UPDATE juego SET stock = $1, actualizado = CURRENT_TIMESTAMP WHERE id_juego = $2 AND activo RETURNING id_juego', [stock, idJuego]);
    if (!f[0]) throw notFound(`No existe el juego ${idJuego}.`);
    return this.obtenerJuego(idJuego);
  }

  // ---------- carrito (tablas carrito / item_carrito del servidor) ----------
  async obtenerCarrito(usuario, nodo) {
    const f = await this.#q(nodo,
      `SELECT i.id_juego, i.tipo_entrega FROM carrito c JOIN item_carrito i USING (id_carrito)
        WHERE c.id_usuario = $1 AND c.estado = 'ABIERTO' ORDER BY i.id_item`, [usuario]);
    return f.map((r) => ({ idJuego: r.id_juego, cantidad: 1, tipoEntrega: r.tipo_entrega }));
  }

  async guardarCarrito(usuario, nodo, items) {
    await this.#tx(nodo, async (c) => {
      let { rows } = await c.query(`SELECT id_carrito FROM carrito WHERE id_usuario = $1 AND estado = 'ABIERTO' FOR UPDATE`, [usuario]);
      if (!rows[0]) {
        ({ rows } = await c.query(`INSERT INTO carrito(id_usuario) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id_carrito`, [usuario]));
        if (!rows[0]) ({ rows } = await c.query(`SELECT id_carrito FROM carrito WHERE id_usuario = $1 AND estado = 'ABIERTO'`, [usuario]));
      }
      const idCarrito = rows[0].id_carrito;
      await c.query('DELETE FROM item_carrito WHERE id_carrito = $1', [idCarrito]);
      if (items.length) {
        const existentes = await c.query('SELECT id_juego FROM juego WHERE id_juego = ANY($1) AND activo', [items.map((i) => i.idJuego)]);
        const ok = new Set(existentes.rows.map((r) => r.id_juego));
        for (const it of items) if (!ok.has(it.idJuego)) throw notFound(`El juego ${it.idJuego} no existe.`);
        for (const it of items) {
          await c.query('INSERT INTO item_carrito(id_carrito, id_juego, cantidad, tipo_entrega) VALUES ($1,$2,1,$3)', [idCarrito, it.idJuego, it.tipoEntrega]);
        }
      }
    });
    return items;
  }

  // ---------- pedidos ----------
  async crearPedido(input) {
    const nodo = input.nodo;
    return this.#tx(nodo, async (c) => {
      // 1) Stock: sp_descontar_stock bloquea la fila (FOR UPDATE) y lanza excepción si no hay claves.
      for (const it of input.items) await c.query('CALL sp_descontar_stock($1, 1)', [it.idJuego]);

      // 2) Precios leídos dentro de la transacción (nunca los del cliente).
      const { rows: js } = await c.query(
        'SELECT id_juego, titulo, precio, imagen FROM juego WHERE id_juego = ANY($1) AND activo', [input.items.map((i) => i.idJuego)]);
      const juegos = new Map(js.map((j) => [j.id_juego, { id: j.id_juego, title: j.titulo, price: j.precio, image: j.imagen }]));

      // 3) Numeración: id del pedido y correlativo del comprobante (boleta y factura tienen series distintas).
      await c.query('SELECT pg_advisory_xact_lock(7002)');
      const idPedido = (await c.query(`SELECT nextval('pedido_id_pedido_seq') AS id`)).rows[0].id;
      const serie = input.comprobante.tipo === 'FACTURA' ? NODOS[nodo].serieFactura : NODOS[nodo].serieBoleta;
      const numeroComprobante = (await c.query('SELECT COALESCE(MAX(numero), 0) + 1 AS n FROM comprobante WHERE serie = $1', [serie])).rows[0].n;

      const p = prepararPedido({ input, juegos, idPedido: Number(idPedido), numeroComprobante: Number(numeroComprobante) });

      // 4) Inserciones. El trigger registra cada cambio de estado en historial_estados.
      const comentario = (t) => c.query(`SELECT set_config('app.comentario', $1, true)`, [t]);
      await comentario('Pedido creado');
      await c.query(
        `INSERT INTO pedido (id_pedido, codigo, id_usuario, nodo, estado, monto_total, fecha_estimada) VALUES ($1,$2,$3,$4,'PENDIENTE',$5,$6)`,
        [p.idPedido, p.codigo, p.usuario, nodo, p.totales.total, p.fechaEntrega]);
      for (const l of p.lineas) {
        await c.query(
          `INSERT INTO detalle_pedido (id_pedido, id_juego, cantidad, precio_unitario, tipo_entrega, clave_digital) VALUES ($1,$2,$3,$4,$5,$6)`,
          [p.idPedido, l.idJuego, l.cantidad, l.precioUnitario, l.tipoEntrega, l.claveDigital]);
      }
      await c.query('INSERT INTO pago (id_pedido, metodo, monto, estado, referencia) VALUES ($1,$2,$3,$4,$5)',
        [p.idPedido, p.pago.metodo, p.pago.monto, p.pago.estado, p.pago.referencia]);
      const k = p.comprobante;
      await c.query(
        `INSERT INTO comprobante (id_pedido, tipo, serie, numero, receptor_tipo_doc, receptor_doc, receptor_nombre, receptor_direccion, subtotal, igv, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [p.idPedido, k.tipo, k.serie, k.numero, k.receptor.tipoDoc, k.receptor.documento, k.receptor.nombre, k.receptor.direccion, k.subtotal, k.igv, k.total]);
      await c.query(
        `INSERT INTO ${tablaLogistica(nodo)} (id_pedido, zona, canal, destinatario, mensaje) VALUES ($1,$2,$3,$4,$5)`,
        [p.idPedido, p.entrega.zona, p.entrega.canal, p.entrega.destinatario, p.entrega.mensaje]);
      for (const paso of p.pasos) {
        await comentario(paso.comentario);
        await c.query('UPDATE pedido SET estado = $1 WHERE id_pedido = $2', [paso.estado, p.idPedido]);
      }

      // 5) El carrito abierto del usuario queda CONVERTIDO.
      await c.query(`UPDATE carrito SET estado = 'CONVERTIDO' WHERE id_usuario = $1 AND estado = 'ABIERTO'`, [input.usuario]);

      return (await this.#leerPedidos(c, nodo, 'p.id_pedido = $1', [p.idPedido]))[0];
    });
  }

  /** Lee pedidos con pago, comprobante, detalle, historial y entrega (4 consultas por lote). */
  async #leerPedidos(db, nodo, where, params, orden = 'p.fecha_pedido DESC, p.id_pedido DESC') {
    const consulta = (sql, p) => db.query(sql, p).then((r) => r.rows);
    const cab = await consulta(
      `SELECT p.*, pg.metodo, pg.monto AS pago_monto, pg.estado AS pago_estado, pg.referencia, pg.fecha_pago,
              c.tipo AS c_tipo, c.serie, c.numero, c.receptor_tipo_doc, c.receptor_doc, c.receptor_nombre, c.receptor_direccion,
              c.subtotal AS c_subtotal, c.igv, c.total AS c_total, c.emitido_en
         FROM pedido p
         LEFT JOIN pago pg ON pg.id_pedido = p.id_pedido
         LEFT JOIN comprobante c ON c.id_pedido = p.id_pedido
        WHERE ${where} ORDER BY ${orden}`, params);
    if (!cab.length) return [];
    const ids = cab.map((r) => r.id_pedido);
    const [det, his, ent] = await Promise.all([
      consulta(`SELECT d.*, j.titulo, j.imagen FROM detalle_pedido d JOIN juego j USING (id_juego) WHERE d.id_pedido = ANY($1) ORDER BY d.id_detalle`, [ids]),
      consulta('SELECT * FROM historial_estados WHERE id_pedido = ANY($1) ORDER BY id_historial', [ids]),
      consulta(`SELECT * FROM ${tablaLogistica(nodo)} WHERE id_pedido = ANY($1)`, [ids])
    ]);
    return cab.map((r) => {
      const e = ent.find((x) => x.id_pedido === r.id_pedido);
      return {
        codigo: r.codigo, nodo: r.nodo, usuario: r.id_usuario, estado: r.estado,
        total: r.monto_total, fecha: ISO(r.fecha_pedido), fechaEntrega: ISO(r.fecha_estimada),
        items: det.filter((d) => d.id_pedido === r.id_pedido).map((d) => ({
          idJuego: d.id_juego, titulo: d.titulo, imagen: d.imagen, cantidad: d.cantidad,
          precioUnitario: d.precio_unitario, subtotal: d.subtotal, tipoEntrega: d.tipo_entrega, claveDigital: d.clave_digital
        })),
        pago: { metodo: r.metodo, monto: r.pago_monto, estado: r.pago_estado, referencia: r.referencia, fecha: ISO(r.fecha_pago) },
        comprobante: {
          tipo: r.c_tipo, serie: String(r.serie).trim(), numero: r.numero,
          numeroCompleto: `${String(r.serie).trim()}-${String(r.numero).padStart(8, '0')}`,
          receptor: { tipoDoc: r.receptor_tipo_doc, documento: r.receptor_doc, nombre: r.receptor_nombre, direccion: r.receptor_direccion },
          subtotal: r.c_subtotal, igv: r.igv, total: r.c_total, emitidoEn: ISO(r.emitido_en)
        },
        entrega: e ? { zona: e.zona, canal: e.canal, destinatario: e.destinatario, mensaje: e.mensaje } : null,
        historial: his.filter((h) => h.id_pedido === r.id_pedido).map((h) => ({
          estadoAnterior: h.estado_anterior, estadoNuevo: h.estado_nuevo, comentario: h.comentario, fecha: ISO(h.fecha_cambio)
        }))
      };
    });
  }

  async listarPedidos({ usuario, nodo, estado } = {}) {
    const nodos = nodo ? [nodo] : NODOS_CLAVES;
    const where = []; const params = [];
    if (usuario) { params.push(usuario); where.push(`p.id_usuario = $${params.length}`); }
    if (estado) { params.push(estado); where.push(`p.estado = $${params.length}`); }
    const grupos = await Promise.all(nodos.map((n) =>
      this.#leerPedidos(this.#pools[n], n, where.length ? where.join(' AND ') : 'TRUE', params).catch((e) => { throw this.#mapearError(e); })));
    return grupos.flat().sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  async obtenerPedido(codigo) {
    const nodo = nodoDeCodigo(codigo);
    if (!nodo) throw notFound(`No existe el pedido ${codigo}.`);
    const r = await this.#leerPedidos(this.#pools[nodo], nodo, 'p.codigo = $1', [codigo]);
    if (!r[0]) throw notFound(`No existe el pedido ${codigo}.`);
    return r[0];
  }

  async cambiarEstado(codigo, nuevo, comentario) {
    const nodo = nodoDeCodigo(codigo);
    if (!nodo) throw notFound(`No existe el pedido ${codigo}.`);
    return this.#tx(nodo, async (c) => {
      const { rows } = await c.query('SELECT id_pedido, estado FROM pedido WHERE codigo = $1 FOR UPDATE', [codigo]);
      if (!rows[0]) throw notFound(`No existe el pedido ${codigo}.`);
      const { id_pedido: id, estado: actual } = rows[0];
      if (actual === nuevo) return (await this.#leerPedidos(c, nodo, 'p.id_pedido = $1', [id]))[0];
      if (!transicionValida(actual, nuevo)) throw conflict(`Transición inválida: ${actual} → ${nuevo}.`);
      if (nuevo === 'REEMBOLSADO') {
        const { rows: det } = await c.query('SELECT id_juego, cantidad FROM detalle_pedido WHERE id_pedido = $1 ORDER BY id_juego', [id]);
        for (const d of det) await c.query('CALL sp_reponer_stock($1, $2)', [d.id_juego, d.cantidad]);
        await c.query(`UPDATE pago SET estado = 'REEMBOLSADO' WHERE id_pedido = $1`, [id]);
      }
      const texto = comentario || (nuevo === 'REEMBOLSADO' ? 'Reembolso aprobado; clave anulada' : 'Cambio de estado');
      await c.query(`SELECT set_config('app.comentario', $1, true)`, [texto]);
      await c.query('UPDATE pedido SET estado = $1 WHERE id_pedido = $2', [nuevo, id]);
      return (await this.#leerPedidos(c, nodo, 'p.id_pedido = $1', [id]))[0];
    });
  }

  /** Solo para el script de datos de demostración: mueve un pedido a otra fecha. */
  async reprogramarFecha(codigo, fechaIso) {
    const nodo = nodoDeCodigo(codigo);
    if (!nodo) throw notFound(`No existe el pedido ${codigo}.`);
    await this.#tx(nodo, async (c) => {
      const { rows } = await c.query('UPDATE pedido SET fecha_pedido = $2, fecha_estimada = $2 WHERE codigo = $1 RETURNING id_pedido', [codigo, fechaIso]);
      if (!rows[0]) throw notFound(`No existe el pedido ${codigo}.`);
      const id = rows[0].id_pedido;
      await c.query('UPDATE pago SET fecha_pago = $2 WHERE id_pedido = $1', [id, fechaIso]);
      await c.query('UPDATE comprobante SET emitido_en = $2 WHERE id_pedido = $1', [id, fechaIso]);
      await c.query('UPDATE historial_estados SET fecha_cambio = $2 WHERE id_pedido = $1', [id, fechaIso]);
    });
  }

  // ---------- biblioteca (compras propias + regalos recibidos), consultando los 3 servidores ----------
  async listarBiblioteca(email) {
    const grupos = await Promise.all(NODOS_CLAVES.map((nodo) => this.#q(nodo, `
      SELECT p.codigo, p.fecha_pedido, p.id_usuario, d.id_juego, j.titulo, j.imagen, d.tipo_entrega, d.clave_digital, l.destinatario, l.mensaje
        FROM pedido p
        JOIN detalle_pedido d USING (id_pedido)
        JOIN juego j USING (id_juego)
        JOIN ${tablaLogistica(nodo)} l USING (id_pedido)
       WHERE p.estado = 'ENTREGADO'
         AND ((d.tipo_entrega = 'DIGITAL' AND p.id_usuario = $1) OR (d.tipo_entrega = 'REGALO' AND l.destinatario = $1))`, [email])));
    return grupos.flat().map((r) => {
      const regalo = r.tipo_entrega === 'REGALO';
      return {
        llave: `${r.codigo}-${r.id_juego}-${r.tipo_entrega}`, idJuego: r.id_juego, titulo: r.titulo, imagen: r.imagen,
        clave: r.clave_digital, fecha: ISO(r.fecha_pedido), pedido: regalo ? null : r.codigo,
        origen: regalo ? 'REGALO' : 'COMPRA', de: regalo ? r.id_usuario : null, mensaje: regalo ? r.mensaje : null
      };
    }).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  // ---------- reportes: vistas globales de la base central (FDW) ----------
  async reportes(ahora = new Date()) {
    const Q = (sql) => this.#q('CENTRAL', sql);
    const [ventas, bajo, estados, juegos, totales, reemb, clientes, porDia, top, cats] = await Promise.all([
      Q('SELECT * FROM v_ventas_por_nodo'),
      Q('SELECT * FROM v_stock_bajo'),
      Q('SELECT estado, count(*) AS n FROM v_pedidos_global GROUP BY estado'),
      Q('SELECT count(*) AS n FROM juego WHERE activo'),
      Q(`SELECT count(*) AS n, COALESCE(sum(monto_total), 0) AS total FROM v_pedidos_global WHERE estado <> 'REEMBOLSADO'`),
      Q(`SELECT count(*) AS n, COALESCE(sum(monto_total), 0) AS total FROM v_pedidos_global WHERE estado = 'REEMBOLSADO'`),
      Q(`SELECT count(*) AS n FROM usuario WHERE rol = 'cliente'`),
      Q(`SELECT to_char((fecha_pedido AT TIME ZONE 'America/Lima')::date, 'YYYY-MM-DD') AS dia, count(*) AS pedidos, sum(monto_total) AS ingresos
           FROM v_pedidos_global WHERE estado <> 'REEMBOLSADO' AND fecha_pedido >= now() - interval '16 days' GROUP BY 1`),
      Q(`SELECT d.id_juego, j.titulo, sum(d.cantidad) AS unidades, sum(d.subtotal) AS ingresos
           FROM v_detalle_global d JOIN juego j USING (id_juego) WHERE d.estado <> 'REEMBOLSADO'
          GROUP BY d.id_juego, j.titulo ORDER BY ingresos DESC LIMIT 5`),
      Q(`SELECT j.categoria, sum(d.subtotal) AS ingresos
           FROM v_detalle_global d JOIN juego j USING (id_juego) WHERE d.estado <> 'REEMBOLSADO'
          GROUP BY j.categoria ORDER BY ingresos DESC`)
    ]);

    const ventasPorNodo = NODOS_CLAVES.map((nodo) => {
      const v = ventas.find((x) => x.nodo === nodo);
      return { nodo, etiqueta: NODOS[nodo].etiqueta, pedidos: Number(v?.pedidos ?? 0), pedidosValidos: Number(v?.pedidos_validos ?? 0), ingresos: r2(v?.ingresos ?? 0) };
    });
    const mapaDia = new Map(porDia.map((d) => [d.dia, d]));
    const ventasPorDia = Array.from({ length: 14 }, (_, i) => {
      const fecha = diaLima(new Date(ahora.getTime() - (13 - i) * 86_400_000));
      const d = mapaDia.get(fecha);
      return { fecha, pedidos: d?.pedidos ?? 0, ingresos: r2(d?.ingresos ?? 0) };
    });
    const ult7 = ventasPorDia.slice(7).reduce((s, d) => s + d.ingresos, 0);
    const prev7 = ventasPorDia.slice(0, 7).reduce((s, d) => s + d.ingresos, 0);
    const ingresosTotales = r2(totales[0].total);

    return {
      ingresosTotales, pedidosValidos: totales[0].n,
      ticketPromedio: totales[0].n ? r2(ingresosTotales / totales[0].n) : 0,
      reembolsos: { pedidos: reemb[0].n, monto: r2(reemb[0].total) },
      clientes: clientes[0].n,
      variacionSemanal: prev7 === 0 ? null : Math.round(((ult7 - prev7) / prev7) * 1000) / 10,
      ventasPorNodo, ventasPorDia,
      topJuegos: top.map((t) => ({ idJuego: t.id_juego, titulo: t.titulo, unidades: Number(t.unidades), ingresos: r2(t.ingresos) })),
      ventasPorCategoria: cats.map((c) => ({ categoria: c.categoria, ingresos: r2(c.ingresos) })),
      pedidosPorEstado: Object.fromEntries(estados.map((e) => [e.estado, e.n])),
      stockBajo: bajo.map((r) => ({ nodo: r.nodo, idJuego: r.id_juego, titulo: r.titulo, stock: r.stock })),
      totalJuegos: juegos[0].n
    };
  }

  // ---------- tickets (base central) ----------
  #ticketApi = (r) => ({
    id: r.id_ticket, asunto: r.asunto, mensaje: r.mensaje, tipo: r.tipo, pedido: r.pedido, usuario: r.usuario, fecha: ISO(r.fecha),
    estado: r.estado, respuesta: r.respuesta, respondidoPor: r.respondido_por, respondidoEn: ISO(r.respondido_en)
  });

  async listarTickets({ usuario } = {}) {
    const f = usuario
      ? await this.#q('CENTRAL', 'SELECT * FROM ticket WHERE usuario = $1 ORDER BY id_ticket DESC', [usuario])
      : await this.#q('CENTRAL', 'SELECT * FROM ticket ORDER BY id_ticket DESC');
    return f.map(this.#ticketApi);
  }

  async obtenerTicket(id) {
    const f = await this.#q('CENTRAL', 'SELECT * FROM ticket WHERE id_ticket = $1', [id]);
    if (!f[0]) throw notFound(`No existe el ticket ${id}.`);
    return this.#ticketApi(f[0]);
  }

  async crearTicket({ asunto, mensaje, tipo, pedido, usuario }) {
    const f = await this.#q('CENTRAL', 'INSERT INTO ticket(asunto, mensaje, tipo, pedido, usuario) VALUES ($1,$2,$3,$4,$5) RETURNING *', [asunto, mensaje, tipo, pedido ?? null, usuario]);
    return this.#ticketApi(f[0]);
  }

  async responderTicket(id, { respuesta, por, resolver }) {
    const f = await this.#q('CENTRAL',
      `UPDATE ticket SET respuesta = $2, respondido_por = $3, respondido_en = CURRENT_TIMESTAMP,
              estado = CASE WHEN $4 THEN 'RESUELTO' ELSE estado END WHERE id_ticket = $1 RETURNING *`, [id, respuesta, por, resolver]);
    if (!f[0]) throw notFound(`No existe el ticket ${id}.`);
    return this.#ticketApi(f[0]);
  }

  async eliminarTicket(id) {
    const f = await this.#q('CENTRAL', 'DELETE FROM ticket WHERE id_ticket = $1 RETURNING id_ticket', [id]);
    if (!f[0]) throw notFound(`No existe el ticket ${id}.`);
  }
}
