import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { DRIVER, correoNuevo, iniciar } from './helpers.js';

let api;
let llamadasModelo = 0;
before(async () => {
  api = await iniciar({
    anthropicKey: 'clave-de-prueba', anthropicModelo: 'modelo-de-prueba',
    // Modelo de lenguaje simulado: responde un texto fijo y cuenta las llamadas.
    fetchImpl: async () => { llamadasModelo++; return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'Respuesta del modelo simulado.' }] }) }; }
  });
});
after(async () => { await api.cerrar(); });

const pagoYape = { metodo: 'YAPE', referencia: '9XXXXX123' };
const compra = (ids, extra = {}) => ({
  pago: pagoYape, comprobante: { tipo: 'BOLETA' },
  items: ids.map((idJuego) => ({ idJuego, tipoEntrega: 'DIGITAL' })), ...extra
});
const stockNodo = async (id, nodo) => (await api.get(`/juegos/${id}`, api.tokenAdmin)).cuerpo.stockPorNodo[nodo];

describe(`API NEXUS GAMING (driver: ${DRIVER})`, () => {
  it('responde la salud y la lista de departamentos', async () => {
    const s = (await api.get('/salud')).cuerpo;
    assert.equal(s.driver, DRIVER); assert.equal(s.asistenteIA, true);
    const d = (await api.get('/departamentos')).cuerpo;
    assert.equal(d.departamentos.length, 25); assert.equal(d.predeterminado, 'Lima');
  });

  describe('autenticación', () => {
    it('registra, evita duplicados y valida los datos', async () => {
      const email = correoNuevo('reg');
      const ok = await api.post('/auth/registro', { nombre: 'Ana Pérez', email, password: 'Clave2026', departamento: 'Cusco' });
      assert.equal(ok.status, 201);
      assert.deepEqual(ok.cuerpo.usuario, { email, nombre: 'Ana Pérez', rol: 'cliente', departamento: 'Cusco' });
      assert.ok(ok.cuerpo.token.split('.').length === 3);
      assert.equal(JSON.stringify(ok.cuerpo).includes('passwordHash'), false);
      assert.equal((await api.post('/auth/registro', { nombre: 'Otra', email, password: 'Clave2026' })).status, 409);
      assert.equal((await api.post('/auth/registro', { nombre: 'Ana', email: correoNuevo(), password: 'corta' })).status, 400);
      assert.equal((await api.post('/auth/registro', { nombre: 'Ana', email: 'no-es-correo', password: 'Clave2026' })).status, 400);
      assert.equal((await api.post('/auth/registro', { nombre: 'Ana', email: correoNuevo(), password: 'Clave2026', departamento: 'Atlantis' })).status, 400);
    });

    it('inicia sesión con las cuentas de demostración y rechaza claves incorrectas', async () => {
      const ok = await api.post('/auth/login', { email: 'ADMIN@nexusgaming.pe', password: 'Admin2026!' });
      assert.equal(ok.status, 200); assert.equal(ok.cuerpo.usuario.rol, 'admin');
      const mal = await api.post('/auth/login', { email: 'admin@nexusgaming.pe', password: 'incorrecta1' });
      assert.equal(mal.status, 401); assert.equal(mal.cuerpo.error, 'Correo o contraseña incorrectos.');
      assert.equal((await api.post('/auth/login', { email: 'no-existe@x.com', password: 'Clave2026' })).status, 401);
      assert.equal((await api.post('/auth/login', {})).status, 401);
    });

    it('bloquea tras 5 intentos fallidos', async () => {
      const email = correoNuevo('fuerza');
      for (let i = 0; i < 5; i++) assert.equal((await api.post('/auth/login', { email, password: 'x' })).status, 401);
      assert.equal((await api.post('/auth/login', { email, password: 'x' })).status, 429);
    });

    it('protege las rutas: sin token, con token falso o manipulado', async () => {
      assert.equal((await api.get('/auth/yo')).status, 401);
      assert.equal((await api.get('/auth/yo', 'abc.def.ghi')).status, 401);
      const c = await api.cliente();
      const [h, , f] = c.token.split('.');
      const admin = `${h}.${Buffer.from(JSON.stringify({ sub: 'admin@nexusgaming.pe', exp: 9e9 })).toString('base64url')}.${f}`;
      assert.equal((await api.get('/admin/reportes', admin)).status, 401); // no se puede fabricar un token de administrador
      assert.equal((await api.get('/auth/yo', c.token)).cuerpo.usuario.email, c.email);
    });

    it('edita el perfil y cambia la contraseña', async () => {
      const c = await api.cliente();
      const p = await api.patch('/auth/perfil', { nombre: 'Nombre Nuevo', departamento: 'Arequipa' }, c.token);
      assert.equal(p.cuerpo.usuario.departamento, 'Arequipa');
      assert.equal((await api.patch('/auth/perfil', { departamento: 'Atlantis' }, c.token)).status, 400);
      assert.equal((await api.post('/auth/password', { actual: 'incorrecta1', nueva: 'NuevaClave1' }, c.token)).status, 403);
      assert.equal((await api.post('/auth/password', { actual: 'Prueba2026', nueva: 'debil' }, c.token)).status, 400);
      assert.equal((await api.post('/auth/password', { actual: 'Prueba2026', nueva: 'NuevaClave1' }, c.token)).status, 204);
      assert.equal((await api.post('/auth/login', { email: c.email, password: 'Prueba2026' })).status, 401);
      assert.equal((await api.post('/auth/login', { email: c.email, password: 'NuevaClave1' })).status, 200);
    });
  });

  describe('catálogo', () => {
    it('muestra el stock del servidor del cliente y oculta el desglose a quien no es admin', async () => {
      const visitante = (await api.get('/juegos')).cuerpo;
      assert.ok(visitante.length >= 10);
      assert.equal(visitante[0].stockPorNodo, undefined);
      const c = await api.cliente('Lima');
      const j = (await api.get('/juegos/1', c.token)).cuerpo;
      assert.equal(j.title, 'The Witcher 3: Wild Hunt'); assert.equal(j.stockPorNodo, undefined);
      const admin = (await api.get('/juegos/1', api.tokenAdmin)).cuerpo;
      assert.equal(j.stock, admin.stockPorNodo.CENTRO); // Lima → servidor Centro
    });

    it('solo administración gestiona el catálogo y el stock; soporte no', async () => {
      const nuevo = (await api.post('/juegos', { title: 'Hades', price: 54.9, category: 'Aventura', description: 'Roguelike.', developer: 'Supergiant', year: 2020, stockInicial: 12 }, api.tokenAdmin)).cuerpo;
      assert.equal(nuevo.stockPorNodo.SUR, 12);
      await api.put(`/admin/stock/SUR/${nuevo.id}`, { stock: 7 }, api.tokenAdmin);
      const edit = (await api.put(`/juegos/${nuevo.id}`, { price: 49.9 }, api.tokenAdmin)).cuerpo;
      assert.equal(edit.price, 49.9); assert.equal(edit.stockPorNodo.SUR, 7); // el precio se replicó, el stock local se conservó
      assert.equal((await api.put(`/juegos/${nuevo.id}`, { price: -5 }, api.tokenAdmin)).status, 400);
      assert.equal((await api.post('/juegos', { title: 'X', price: 1, category: 'Y' }, api.tokenSoporte)).status, 403);
      assert.equal((await api.post('/juegos', { title: 'X', price: 1, category: 'Y' })).status, 401);
      assert.equal((await api.del(`/juegos/${nuevo.id}`, api.tokenAdmin)).status, 204);
      assert.equal((await api.get(`/juegos/${nuevo.id}`)).status, 404);
    });
  });

  describe('compras', () => {
    it('compra con boleta: entrega al instante, descuenta stock SOLO en el servidor del cliente', async () => {
      const c = await api.cliente('Lima');
      const antesCentro = await stockNodo(4, 'CENTRO');
      const antesSur = await stockNodo(4, 'SUR');
      const r = await api.post('/pedidos', compra([4, 5]), c.token);
      assert.equal(r.status, 201, JSON.stringify(r.cuerpo));
      const p = r.cuerpo;
      assert.match(p.codigo, /^NX-CUS-\d{6}$/);
      assert.equal(p.estado, 'ENTREGADO'); assert.equal(p.nodo, 'CENTRO');
      assert.match(p.items[0].claveDigital, /^[A-Z2-9]{5}-[A-Z2-9]{5}-[A-Z2-9]{5}$/);
      assert.equal(p.comprobante.tipo, 'BOLETA'); assert.match(p.comprobante.numeroCompleto, /^B003-\d{8}$/);
      assert.deepEqual([p.comprobante.subtotal, p.comprobante.igv, p.comprobante.total], [76.1, 13.7, 89.8]);
      assert.equal(p.comprobante.receptor.nombre, 'Cliente de Prueba');
      assert.deepEqual(p.historial.map((h) => h.estadoNuevo), ['PENDIENTE', 'PAGADO', 'ENTREGADO']);
      assert.equal(p.entrega.canal, 'BIBLIOTECA'); assert.equal(p.entrega.zona, 'Lima');
      assert.equal(await stockNodo(4, 'CENTRO'), antesCentro - 1);
      assert.equal(await stockNodo(4, 'SUR'), antesSur);
    });

    it('el departamento decide el servidor y la serie del comprobante', async () => {
      const c = await api.cliente('Arequipa');
      const p = (await api.post('/pedidos', compra([8]), c.token)).cuerpo;
      assert.match(p.codigo, /^NX-AQP-/); assert.match(p.comprobante.numeroCompleto, /^B002-/);
      const t = await api.cliente('Piura');
      assert.match((await api.post('/pedidos', compra([8]), t.token)).cuerpo.codigo, /^NX-TRU-/);
    });

    it('emite factura con RUC válido y rechaza RUC, razón social o dirección inválidos', async () => {
      const c = await api.cliente('Lima');
      const factura = { tipo: 'FACTURA', documento: '20601234565', nombre: 'Estudio Pixel S.A.C.', direccion: 'Jr. de la Unión 123, Cercado de Lima' };
      const p = (await api.post('/pedidos', compra([8], { comprobante: factura }), c.token)).cuerpo;
      assert.equal(p.comprobante.tipo, 'FACTURA'); assert.match(p.comprobante.numeroCompleto, /^F003-\d{8}$/);
      assert.equal(p.comprobante.receptor.documento, '20601234565'); assert.equal(p.comprobante.receptor.nombre, 'Estudio Pixel S.A.C.');
      for (const mala of [{ ...factura, documento: '20601234566' }, { ...factura, nombre: 'X' }, { ...factura, direccion: '' }]) {
        assert.equal((await api.post('/pedidos', compra([9], { comprobante: mala }), c.token)).status, 400);
      }
    });

    it('boleta desde S/ 700 exige DNI', async () => {
      const caro = (await api.post('/juegos', { title: 'Edición Coleccionista', price: 800, category: 'RPG', stockInicial: 5 }, api.tokenAdmin)).cuerpo;
      const c = await api.cliente('Lima');
      const sin = await api.post('/pedidos', compra([caro.id]), c.token);
      assert.equal(sin.status, 400); assert.match(sin.cuerpo.error, /DNI/);
      assert.equal(await stockNodo(caro.id, 'CENTRO'), 5); // el rechazo no consumió stock
      const con = await api.post('/pedidos', compra([caro.id], { comprobante: { tipo: 'BOLETA', documento: '12345678' } }), c.token);
      assert.equal(con.status, 201); assert.equal(con.cuerpo.comprobante.receptor.tipoDoc, 'DNI');
    });

    it('rechaza datos inválidos con 400 y exige sesión', async () => {
      const c = await api.cliente();
      assert.equal((await api.post('/pedidos', compra([8]))).status, 401);
      assert.equal((await api.post('/pedidos', compra([8], { pago: { metodo: 'TARJETA', referencia: '4242424242424242' } }), c.token)).status, 400);
      assert.equal((await api.post('/pedidos', { ...compra([8]), items: [] }, c.token)).status, 400);
      assert.equal((await api.post('/pedidos', { ...compra([8]), items: [{ idJuego: 8, cantidad: 3, tipoEntrega: 'DIGITAL' }] }, c.token)).status, 400);
      assert.equal((await api.post('/pedidos', compra([9999]), c.token)).status, 404);
    });

    it('el personal no puede comprar', async () => {
      assert.equal((await api.post('/pedidos', compra([8]), api.tokenAdmin)).status, 403);
    });

    it('es atómico: si un juego no tiene claves, NO se descuenta ninguno', async () => {
      const c = await api.cliente('Lima');
      await api.put('/admin/stock/CENTRO/9', { stock: 0 }, api.tokenAdmin);
      const antes = await stockNodo(8, 'CENTRO');
      const r = await api.post('/pedidos', compra([8, 9]), c.token);
      assert.equal(r.status, 409);
      assert.equal(await stockNodo(8, 'CENTRO'), antes);
      assert.equal((await api.get('/pedidos', c.token)).cuerpo.length, 0);
      await api.put('/admin/stock/CENTRO/9', { stock: 25 }, api.tokenAdmin);
    });

    it('soporta compras simultáneas sin vender más claves que el stock', async () => {
      await api.put('/admin/stock/CENTRO/6', { stock: 3 }, api.tokenAdmin);
      const clientes = await Promise.all(Array.from({ length: 8 }, () => api.cliente('Lima')));
      const compras = await Promise.all(clientes.map((c) => api.post('/pedidos', compra([6]), c.token)));
      assert.equal(compras.filter((x) => x.status === 201).length, 3);
      assert.equal(compras.filter((x) => x.status === 409).length, 5);
      assert.equal(await stockNodo(6, 'CENTRO'), 0);
      await api.put('/admin/stock/CENTRO/6', { stock: 30 }, api.tokenAdmin);
    });
  });

  describe('regalos y biblioteca', () => {
    it('el regalo llega a la biblioteca del destinatario y no a la del comprador', async () => {
      const a = await api.cliente(); const b = await api.cliente();
      const base = compra([3], { items: [{ idJuego: 3, tipoEntrega: 'REGALO' }, { idJuego: 2, tipoEntrega: 'DIGITAL' }] });
      assert.equal((await api.post('/pedidos', base, a.token)).status, 400); // falta destinatario
      assert.equal((await api.post('/pedidos', { ...base, regalo: { destinatario: a.email } }, a.token)).status, 400);
      const r = await api.post('/pedidos', { ...base, regalo: { destinatario: b.email, mensaje: '¡Feliz cumple!' } }, a.token);
      assert.equal(r.status, 201, JSON.stringify(r.cuerpo));
      const p = r.cuerpo;
      assert.equal(p.entrega.canal, 'REGALO'); assert.equal(p.entrega.destinatario, b.email);
      const regalo = p.items.find((i) => i.tipoEntrega === 'REGALO'); const propio = p.items.find((i) => i.tipoEntrega === 'DIGITAL');
      assert.match(regalo.claveDigital, /^•{5}-•{5}-/);   // el comprador no ve la clave del regalo
      assert.match(propio.claveDigital, /^[A-Z2-9]{5}-/); // la suya sí
      const bibA = (await api.get('/biblioteca', a.token)).cuerpo; const bibB = (await api.get('/biblioteca', b.token)).cuerpo;
      assert.deepEqual(bibA.map((x) => x.idJuego), [2]);
      assert.equal(bibB.length, 1); assert.equal(bibB[0].origen, 'REGALO'); assert.equal(bibB[0].de, a.email);
      assert.equal(bibB[0].mensaje, '¡Feliz cumple!'); assert.match(bibB[0].clave, /^[A-Z2-9]{5}-/);
    });

    it('la biblioteca exige sesión', async () => { assert.equal((await api.get('/biblioteca')).status, 401); });
  });

  describe('permisos sobre pedidos', () => {
    it('cada cliente ve solo lo suyo; el personal ve todo pero con las claves ocultas', async () => {
      const u1 = await api.cliente(); const u2 = await api.cliente();
      const p = (await api.post('/pedidos', compra([3]), u1.token)).cuerpo;
      assert.equal((await api.get('/pedidos', u1.token)).cuerpo.length, 1);
      assert.equal((await api.get('/pedidos', u2.token)).cuerpo.length, 0);
      assert.equal((await api.get(`/pedidos/${p.codigo}`, u2.token)).status, 403);
      assert.equal((await api.get(`/pedidos/${p.codigo}`)).status, 401);
      const visto = (await api.get(`/pedidos/${p.codigo}`, api.tokenSoporte)).cuerpo;
      assert.match(visto.items[0].claveDigital, /^•{5}-•{5}-/);
      assert.ok((await api.get('/pedidos?estado=ENTREGADO', api.tokenAdmin)).cuerpo.length >= 1);
    });

    it('un cliente no puede cambiar estados; el personal sí, respetando el ciclo', async () => {
      const c = await api.cliente();
      const p = (await api.post('/pedidos', compra([3]), c.token)).cuerpo;
      const url = `/pedidos/${p.codigo}/estado`;
      assert.equal((await api.patch(url, { estado: 'REEMBOLSADO' }, c.token)).status, 403);
      assert.equal((await api.patch(url, { estado: 'PAGADO' }, api.tokenSoporte)).status, 409); // no se retrocede
      assert.equal((await api.patch(url, { estado: 'VOLANDO' }, api.tokenSoporte)).status, 400);
    });
  });

  describe('comprobante en PDF', () => {
    it('genera el PDF para el dueño y el personal, y lo niega a otros', async () => {
      const c = await api.cliente(); const otro = await api.cliente();
      const p = (await api.post('/pedidos', compra([3, 8]), c.token)).cuerpo;
      const ruta = `/pedidos/${p.codigo}/comprobante.pdf`;
      const dueno = await api.http('GET', ruta, { token: c.token, crudo: true });
      assert.equal(dueno.status, 200);
      assert.equal(dueno.cabeceras.get('content-type'), 'application/pdf');
      assert.match(dueno.cabeceras.get('content-disposition'), new RegExp(`${p.comprobante.numeroCompleto}\\.pdf`));
      assert.equal(dueno.buffer.subarray(0, 5).toString(), '%PDF-');
      assert.ok(dueno.buffer.length > 3000);
      assert.equal((await api.http('GET', ruta, { token: api.tokenSoporte, crudo: true })).status, 200);
      assert.equal((await api.http('GET', ruta, { token: otro.token, crudo: true })).status, 403);
      assert.equal((await api.http('GET', ruta, { crudo: true })).status, 401);
    });
  });

  describe('carrito persistente', () => {
    it('guarda, recupera y se vacía al comprar', async () => {
      const c = await api.cliente();
      const items = [{ idJuego: 7, tipoEntrega: 'DIGITAL' }, { idJuego: 2, tipoEntrega: 'REGALO' }];
      assert.equal((await api.put('/carrito', { items }, c.token)).status, 200);
      assert.equal((await api.get('/carrito', c.token)).cuerpo.length, 2);
      assert.equal((await api.get('/carrito')).status, 401);
      assert.equal((await api.put('/carrito', { items: [{ idJuego: 9999, tipoEntrega: 'DIGITAL' }] }, c.token)).status, 404);
      await api.post('/pedidos', compra([7]), c.token);
      assert.equal((await api.get('/carrito', c.token)).cuerpo.length, 0);
    });
  });

  describe('soporte y reembolsos', () => {
    it('flujo completo: solicitud → aprobación → pedido reembolsado, stock repuesto y clave anulada', async () => {
      const c = await api.cliente('Lima');
      const p = (await api.post('/pedidos', compra([5]), c.token)).cuerpo;
      const stockCompra = await stockNodo(5, 'CENTRO');
      const pedir = { asunto: 'Quiero reembolso', mensaje: 'No me gustó el juego.', tipo: 'REEMBOLSO', pedido: p.codigo };

      assert.equal((await api.post('/tickets', pedir)).status, 401);
      const otro = await api.cliente();
      assert.equal((await api.post('/tickets', pedir, otro.token)).status, 404); // pedido ajeno
      const t = (await api.post('/tickets', pedir, c.token)).cuerpo;
      assert.equal(t.estado, 'ABIERTO'); assert.equal(t.tipo, 'REEMBOLSO');
      assert.equal((await api.post('/tickets', pedir, c.token)).status, 409); // ya hay una solicitud abierta
      assert.equal((await api.get('/tickets', c.token)).status, 403);
      assert.ok((await api.get('/tickets', api.tokenSoporte)).cuerpo.some((x) => x.id === t.id));
      assert.equal((await api.get('/tickets/mios', c.token)).cuerpo.length, 1);
      assert.equal((await api.get('/tickets/mios', otro.token)).cuerpo.length, 0);

      const aprobado = await api.post(`/tickets/${t.id}/reembolso`, {}, api.tokenSoporte);
      assert.equal(aprobado.status, 200, JSON.stringify(aprobado.cuerpo));
      assert.equal(aprobado.cuerpo.estado, 'RESUELTO'); assert.match(aprobado.cuerpo.respuesta, /Aprobamos/);
      assert.equal(aprobado.cuerpo.respondidoPor, 'Soporte NEXUS');

      const final = (await api.get(`/pedidos/${p.codigo}`, c.token)).cuerpo;
      assert.equal(final.estado, 'REEMBOLSADO'); assert.equal(final.pago.estado, 'REEMBOLSADO');
      assert.equal(final.historial.at(-1).estadoNuevo, 'REEMBOLSADO');
      assert.equal(await stockNodo(5, 'CENTRO'), stockCompra + 1);
      assert.equal((await api.get('/biblioteca', c.token)).cuerpo.length, 0);
      assert.equal((await api.get('/tickets/mios', c.token)).cuerpo[0].estado, 'RESUELTO');
      assert.equal((await api.post(`/tickets/${t.id}/reembolso`, {}, api.tokenSoporte)).status, 409); // ya resuelto
      assert.equal((await api.post('/tickets', pedir, c.token)).status, 409);                       // pedido ya reembolsado
    });

    it('una consulta se responde y se resuelve; solo administración borra tickets', async () => {
      const c = await api.cliente();
      assert.equal((await api.post('/tickets', { asunto: 'a', mensaje: 'hola' }, c.token)).status, 400);
      const t = (await api.post('/tickets', { asunto: 'No puedo entrar', mensaje: 'Olvidé mi contraseña.' }, c.token)).cuerpo;
      assert.equal((await api.post(`/tickets/${t.id}/reembolso`, {}, api.tokenSoporte)).status, 400); // no es reembolso
      assert.equal((await api.patch(`/tickets/${t.id}/responder`, { respuesta: 'ok' }, c.token)).status, 403);
      assert.equal((await api.patch(`/tickets/${t.id}/responder`, { respuesta: 'x' }, api.tokenSoporte)).status, 400);
      const r = (await api.patch(`/tickets/${t.id}/responder`, { respuesta: 'Te enviamos un enlace de recuperación.' }, api.tokenSoporte)).cuerpo;
      assert.equal(r.estado, 'RESUELTO'); assert.equal(r.respuesta, 'Te enviamos un enlace de recuperación.');
      assert.equal((await api.del(`/tickets/${t.id}`, api.tokenSoporte)).status, 403);
      assert.equal((await api.del(`/tickets/${t.id}`, api.tokenAdmin)).status, 204);
    });

    it('fuera del plazo de 14 días no se admite el reembolso', async () => {
      const c = await api.cliente();
      const p = (await api.post('/pedidos', compra([8]), c.token)).cuerpo;
      await api.repo.reprogramarFecha(p.codigo, new Date(Date.now() - 20 * 86_400_000).toISOString());
      const r = await api.post('/tickets', { asunto: 'Reembolso tardío', mensaje: 'Quiero mi dinero.', tipo: 'REEMBOLSO', pedido: p.codigo }, c.token);
      assert.equal(r.status, 409); assert.match(r.cuerpo.error, /14 días/);
    });
  });

  describe('panel de administración', () => {
    it('entrega reportes y clientes al personal; los clientes no entran', async () => {
      const r = (await api.get('/admin/reportes', api.tokenAdmin)).cuerpo;
      assert.equal(r.ventasPorNodo.length, 3); assert.equal(r.ventasPorDia.length, 14);
      assert.ok(r.ingresosTotales > 0); assert.ok(r.topJuegos.length > 0); assert.ok(r.ventasPorCategoria.length > 0);
      assert.ok(r.clientes >= 1);
      assert.ok(Math.abs(r.ingresosTotales - r.ventasPorNodo.reduce((s, v) => s + v.ingresos, 0)) < 0.01);
      // La gráfica cubre 14 días: un pedido más antiguo (el de la prueba de plazo) cuenta en el total pero no en la gráfica.
      const enGrafica = r.ventasPorDia.reduce((s, v) => s + v.ingresos, 0);
      assert.ok(enGrafica > 0 && enGrafica <= r.ingresosTotales + 0.01);
      assert.ok(r.pedidosPorEstado.ENTREGADO >= 1); assert.ok(r.reembolsos.pedidos >= 1);
      assert.equal((await api.get('/admin/reportes', api.tokenSoporte)).status, 200);
      const c = await api.cliente();
      assert.equal((await api.get('/admin/reportes', c.token)).status, 403);
      assert.equal((await api.get('/admin/reportes')).status, 401);
      const cl = (await api.get('/admin/clientes', api.tokenSoporte)).cuerpo;
      assert.ok(cl.some((x) => x.email === c.email) && cl.every((x) => x.rol === undefined && x.passwordHash === undefined));
    });
  });

  describe('asistente virtual', () => {
    it('responde con el modelo cuando hay clave y conserva la acción de abrir ticket', async () => {
      const antes = llamadasModelo;
      const r = (await api.post('/asistente', { mensaje: 'quiero hablar con una persona' })).cuerpo;
      assert.equal(r.origen, 'ia'); assert.equal(r.respuesta, 'Respuesta del modelo simulado.');
      assert.equal(r.accion.tipo, 'ticket');
      assert.equal(llamadasModelo, antes + 1);
    });

    it('valida el mensaje y limita la frecuencia', async () => {
      assert.equal((await api.post('/asistente', { mensaje: '' })).status, 400);
      assert.equal((await api.post('/asistente', { mensaje: 'x'.repeat(501) })).status, 400);
      const c = await api.cliente();
      let ultimo;
      for (let i = 0; i < 21; i++) ultimo = await api.post('/asistente', { mensaje: 'hola' }, c.token);
      assert.equal(ultimo.status, 429);
    });
  });

  it('maneja rutas inexistentes y JSON malformado', async () => {
    assert.equal((await api.get('/no-existe')).status, 404);
    const res = await fetch(`${api.base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{roto' });
    assert.equal(res.status, 400); assert.match((await res.json()).error, /JSON/);
  });
});

describe('asistente sin clave de IA (motor local)', () => {
  it('usa el motor local y conoce los pedidos del cliente', async () => {
    const local = await iniciar();
    try {
      const c = await local.cliente('Lima');
      const p = (await local.post('/pedidos', compra([8]), c.token)).cuerpo;
      const r = (await local.post('/asistente', { mensaje: '¿Dónde está mi pedido?' }, c.token)).cuerpo;
      assert.equal(r.origen, 'local'); assert.match(r.respuesta, new RegExp(p.codigo));
      assert.equal((await local.get('/salud')).cuerpo.asistenteIA, false);
    } finally { await local.cerrar(); }
  });
});
