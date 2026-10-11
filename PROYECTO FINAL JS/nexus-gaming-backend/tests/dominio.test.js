import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { responderLocal, detectarIntencion, consultarModelo } from '../src/domain/asistente.js';
import { LimitadorIntentos, firmarToken, hashPassword, verificarPassword, verificarToken } from '../src/domain/auth.js';
import { calcularTotales } from '../src/domain/calculos.js';
import { dentroDePlazoReembolso, diaLima, nodoDeCodigo, transicionValida } from '../src/domain/constantes.js';
import { esDni, esRuc } from '../src/domain/documentos.js';
import { generarClave } from '../src/domain/claves.js';
import { enteroEnLetras, montoEnLetras } from '../src/domain/letras.js';
import { DEPARTAMENTOS, nodoDeDepartamento } from '../src/domain/regiones.js';
import { validarComprobante, validarItems, validarPago, validarPassword, validarRegalo, validarTicket } from '../src/domain/validacion.js';

describe('dinero e impuestos', () => {
  it('calcula el IGV incluido en el precio', () => {
    assert.deepEqual(calcularTotales([{ precioUnitario: 118, cantidad: 1 }]), { subtotal: 100, igv: 18, total: 118 });
    assert.equal(calcularTotales([{ precioUnitario: 49.9, cantidad: 1 }, { precioUnitario: 39.9, cantidad: 1 }]).total, 89.8);
  });
});

describe('estados del pedido', () => {
  it('avanza PENDIENTE → PAGADO → ENTREGADO y solo se reembolsa al final', () => {
    assert.ok(transicionValida('PENDIENTE', 'PAGADO'));
    assert.ok(transicionValida('PAGADO', 'ENTREGADO'));
    assert.ok(transicionValida('ENTREGADO', 'REEMBOLSADO'));
    assert.ok(transicionValida('PAGADO', 'REEMBOLSADO'));
    assert.ok(!transicionValida('ENTREGADO', 'PAGADO'));
    assert.ok(!transicionValida('REEMBOLSADO', 'ENTREGADO'));
  });
  it('el plazo de reembolso es de 14 días', () => {
    const ahora = new Date('2026-10-20T12:00:00Z');
    assert.ok(dentroDePlazoReembolso('2026-10-07T12:00:00Z', ahora));
    assert.ok(!dentroDePlazoReembolso('2026-10-05T12:00:00Z', ahora));
  });
  it('el día se calcula en hora de Lima (UTC-5)', () => {
    assert.equal(diaLima('2026-10-04T03:00:00Z'), '2026-10-03'); // 22:00 del día anterior en Lima
    assert.equal(diaLima('2026-10-04T12:00:00Z'), '2026-10-04');
  });
  it('el código de pedido indica su servidor', () => {
    assert.equal(nodoDeCodigo('NX-AQP-000007'), 'SUR');
    assert.equal(nodoDeCodigo('NX-XXX-000007'), null);
  });
});

describe('regiones', () => {
  it('cada departamento tiene un servidor y Lima va al centro', () => {
    assert.equal(nodoDeDepartamento('Lima'), 'CENTRO');
    assert.equal(nodoDeDepartamento('Arequipa'), 'SUR');
    assert.equal(nodoDeDepartamento('La Libertad'), 'NORTE');
    assert.equal(Object.keys(DEPARTAMENTOS).length, 25);
    assert.throws(() => nodoDeDepartamento('Atlantis'));
  });
});

describe('documentos de identidad y monto en letras', () => {
  it('valida DNI y RUC (dígito de control)', () => {
    assert.ok(esDni('12345678')); assert.ok(!esDni('1234567')); assert.ok(!esDni('1234567a'));
    assert.ok(esRuc('20601234565')); assert.ok(esRuc('20100070970'));
    assert.ok(!esRuc('20601234566')); assert.ok(!esRuc('30601234565')); assert.ok(!esRuc('2060123456'));
  });
  it('convierte montos a letras', () => {
    assert.equal(montoEnLetras(89.8), 'OCHENTA Y NUEVE CON 80/100 SOLES');
    assert.equal(montoEnLetras(1250.5), 'MIL DOSCIENTOS CINCUENTA CON 50/100 SOLES');
    assert.equal(montoEnLetras(100), 'CIEN CON 00/100 SOLES');
    assert.equal(montoEnLetras(21000), 'VEINTIÚN MIL CON 00/100 SOLES');
    assert.equal(enteroEnLetras(1000000), 'UN MILLÓN');
  });
});

describe('validación de entradas', () => {
  it('cada juego es una licencia: sin cantidades ni repetidos', () => {
    const r = validarItems([{ idJuego: 2, tipoEntrega: 'DIGITAL' }, { idJuego: 2, tipoEntrega: 'REGALO' }]);
    assert.equal(r.length, 2); assert.ok(r.every((i) => i.cantidad === 1));
    assert.throws(() => validarItems([{ idJuego: 1, cantidad: 2, tipoEntrega: 'DIGITAL' }]));
    assert.throws(() => validarItems([{ idJuego: 1, tipoEntrega: 'DIGITAL' }, { idJuego: 1, tipoEntrega: 'DIGITAL' }]));
    assert.throws(() => validarItems([{ idJuego: 1, tipoEntrega: 'FISICA' }]));
    assert.throws(() => validarItems([]));
  });
  it('nunca acepta el número completo de la tarjeta', () => {
    assert.throws(() => validarPago({ metodo: 'TARJETA', referencia: '4242 4242 4242 4242' }));
    assert.equal(validarPago({ metodo: 'tarjeta', referencia: '4242' }).metodo, 'TARJETA');
  });
  it('boleta (DNI opcional) y factura (RUC, razón social y dirección)', () => {
    assert.equal(validarComprobante({}).tipo, 'BOLETA');
    assert.equal(validarComprobante({ tipo: 'BOLETA', documento: '12345678' }).tipoDoc, 'DNI');
    assert.throws(() => validarComprobante({ tipo: 'BOLETA', documento: '123' }));
    const f = validarComprobante({ tipo: 'FACTURA', documento: '20601234565', nombre: 'Mi Empresa SAC', direccion: 'Av. Siempre Viva 123' });
    assert.equal(f.tipoDoc, 'RUC');
    assert.throws(() => validarComprobante({ tipo: 'FACTURA', documento: '20601234566', nombre: 'Mi Empresa SAC', direccion: 'Av. Siempre Viva 123' }));
    assert.throws(() => validarComprobante({ tipo: 'FACTURA', documento: '20601234565', nombre: 'X', direccion: 'Av. Siempre Viva 123' }));
    assert.throws(() => validarComprobante({ tipo: 'NOTA' }));
  });
  it('el regalo necesita un destinatario distinto del comprador', () => {
    assert.equal(validarRegalo({ destinatario: 'AMIGO@correo.com', mensaje: 'Feliz cumple' }, 'yo@correo.com').destinatario, 'amigo@correo.com');
    assert.throws(() => validarRegalo({ destinatario: 'yo@correo.com' }, 'yo@correo.com'));
    assert.throws(() => validarRegalo({ destinatario: 'no-es-correo' }, 'yo@correo.com'));
  });
  it('la contraseña exige 8 caracteres con letra y número', () => {
    assert.doesNotThrow(() => validarPassword('Clave2026'));
    for (const mala of ['corta1', 'sololetrasaaaa', '1234567890', '']) assert.throws(() => validarPassword(mala));
  });
  it('un ticket de reembolso necesita el pedido', () => {
    assert.throws(() => validarTicket({ asunto: 'Quiero mi dinero', mensaje: 'Por favor reembolso', tipo: 'REEMBOLSO' }));
    assert.equal(validarTicket({ asunto: 'Duda', mensaje: 'No entiendo algo' }).tipo, 'CONSULTA');
  });
  it('genera claves de activación con formato y sin repetirse', () => {
    const claves = new Set(Array.from({ length: 500 }, generarClave));
    assert.equal(claves.size, 500);
    for (const c of claves) assert.match(c, /^[A-Z2-9]{5}-[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  });
});

describe('autenticación', () => {
  it('guarda la contraseña con hash y sal (nunca en texto plano)', async () => {
    const h1 = await hashPassword('Clave2026'); const h2 = await hashPassword('Clave2026');
    assert.match(h1, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    assert.notEqual(h1, h2); // la sal aleatoria hace distintos los hashes de una misma clave
    assert.ok(await verificarPassword('Clave2026', h1));
    assert.ok(!(await verificarPassword('clave2026', h1)));
    assert.ok(!(await verificarPassword('x', 'basura')));
  });
  it('firma y verifica tokens; rechaza firma falsa, manipulación y vencimiento', () => {
    const t = firmarToken({ sub: 'a@b.com', rol: 'admin' }, 'secreto', 60, 1_000_000);
    assert.equal(verificarToken(t, 'secreto', 1_000_000 + 30_000).sub, 'a@b.com');
    assert.equal(verificarToken(t, 'otro-secreto', 1_000_000), null);
    assert.equal(verificarToken(t, 'secreto', 1_000_000 + 61_000), null);
    const [h, , f] = t.split('.');
    const falso = `${h}.${Buffer.from(JSON.stringify({ sub: 'a@b.com', rol: 'admin', exp: 9e9 })).toString('base64url')}.${f}`;
    assert.equal(verificarToken(falso, 'secreto', 1_000_000), null); // cambiar el contenido invalida la firma
    assert.equal(verificarToken('x.y', 'secreto'), null);
  });
  it('el limitador bloquea tras el máximo de intentos y se libera con el tiempo', () => {
    const l = new LimitadorIntentos(3, 1000);
    for (let i = 0; i < 3; i++) { assert.ok(!l.bloqueado('k', 0)); l.registrar('k', 0); }
    assert.ok(l.bloqueado('k', 500));
    assert.ok(!l.bloqueado('k', 1500));
  });
});

describe('asistente virtual (motor local)', () => {
  const pedidos = [{ codigo: 'NX-CUS-000003', estado: 'ENTREGADO', total: 59.9, fecha: new Date().toISOString() }];
  it('detecta intenciones ignorando tildes y mayúsculas', () => {
    assert.equal(detectarIntencion('¿Cómo pido un REEMBOLSO?'), 'reembolso');
    assert.equal(detectarIntencion('quiero FACTURA con ruc'), 'comprobante');
    assert.equal(detectarIntencion('no me llegó mi clave'), 'clave');
    assert.equal(detectarIntencion('hola'), 'saludo');
    assert.equal(detectarIntencion('asdf qwerty'), null);
  });
  it('consulta el pedido real del cliente', () => {
    const r = responderLocal('¿dónde está mi pedido?', { nombre: 'Vanessa Tito', pedidos });
    assert.match(r.respuesta, /NX-CUS-000003/); assert.match(r.respuesta, /entregado/);
  });
  it('ofrece abrir un ticket de reembolso para un pedido dentro del plazo', () => {
    const r = responderLocal('quiero un reembolso de NX-CUS-000003', { nombre: 'Vane', pedidos });
    assert.equal(r.accion?.tipo, 'ticket'); assert.equal(r.accion.ticketTipo, 'REEMBOLSO'); assert.equal(r.accion.pedido, 'NX-CUS-000003');
  });
  it('sin sesión pide iniciar sesión y sin entender ofrece un ticket', () => {
    assert.match(responderLocal('mi pedido', {}).respuesta, /inicies sesión/);
    assert.equal(responderLocal('xyzzy', {}).accion?.tipo, 'ticket');
  });
  it('usa el modelo si hay clave y cae al motor local si falla', async () => {
    const ok = await consultarModelo({ mensaje: 'hola', nombre: null, pedidos: [], apiKey: 'k', modelo: 'm',
      fetchImpl: async (_u, o) => { assert.equal(JSON.parse(o.body).messages[0].role, 'user'); return { ok: true, json: async () => ({ content: [{ type: 'text', text: ' Hola desde el modelo ' }] }) }; } });
    assert.equal(ok, 'Hola desde el modelo');
    assert.equal(await consultarModelo({ mensaje: 'hola', pedidos: [], apiKey: 'k', modelo: 'm', fetchImpl: async () => { throw new Error('red caída'); } }), null);
    assert.equal(await consultarModelo({ mensaje: 'hola', pedidos: [], apiKey: 'k', modelo: 'm', fetchImpl: async () => ({ ok: false }) }), null);
    assert.equal(await consultarModelo({ mensaje: 'hola', pedidos: [], apiKey: '', modelo: 'm' }), null);
  });
});
