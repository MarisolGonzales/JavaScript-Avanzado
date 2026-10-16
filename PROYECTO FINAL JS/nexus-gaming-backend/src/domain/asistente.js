/**
 * ASISTENTE VIRTUAL DE SOPORTE.
 *
 * Funciona SIEMPRE sin internet ni claves: un motor de intenciones que combina
 * expresiones regulares (Semana 3) con los datos reales del cliente (sus pedidos).
 * Opcionalmente, si el servidor tiene ANTHROPIC_API_KEY, las preguntas se envían a
 * un modelo de lenguaje con las mismas reglas del negocio; si falla, se usa el motor local.
 */
import { POLITICA_REEMBOLSO_DIAS, dentroDePlazoReembolso } from './constantes.js';

export const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Conocimiento del negocio: lo usa tanto el motor local como el prompt del modelo. */
export const BASE_CONOCIMIENTO = `
NEXUS GAMING es una tienda en línea de videojuegos DIGITALES (como Steam o Epic Games).
- Compra: el cliente agrega juegos al carrito, elige boleta o factura, y paga con tarjeta, Yape o Plin (el pago es simulado en este proyecto académico).
- Entrega: inmediata. El juego aparece en "Mi biblioteca" apenas se aprueba el pago; desde ahí se instala con el botón "Instalar" (la instalación es simulada en este proyecto académico).
- Regalos: se puede comprar un juego para otra persona indicando su correo; el juego llega a la biblioteca del destinatario.
- Comprobantes: boleta (DNI opcional; obligatorio desde S/ 700) o factura (requiere RUC válido, razón social y dirección fiscal). Se descargan en PDF desde el detalle del pedido.
- Reembolsos: dentro de ${POLITICA_REEMBOLSO_DIAS} días desde la compra, solicitándolos con un ticket de tipo Reembolso; el personal lo revisa y aprueba.
- Pagos rechazados: revisar el número, el vencimiento y el CVV, o probar con Yape/Plin.
- Cuenta: se puede cambiar el nombre, el departamento y la contraseña en "Mi perfil".
- Estados de un pedido: Pendiente, Pagado, Entregado, Reembolsado.
`.trim();

const SUGERENCIAS_BASE = ['¿Dónde está mi pedido?', '¿Cómo pido un reembolso?', '¿Cómo instalo mi juego?', 'Quiero factura', 'Hablar con una persona'];
const soles = (n) => `S/ ${Number(n).toFixed(2)}`;
const ESTADO_TXT = { PENDIENTE: 'pendiente de pago', PAGADO: 'pagado', ENTREGADO: 'entregado', REEMBOLSADO: 'reembolsado' };
const respuesta = (texto, sugerencias = SUGERENCIAS_BASE, accion = null) => ({ respuesta: texto, sugerencias, accion, origen: 'local' });

function resumenPedidos(pedidos) {
  return pedidos.slice(0, 3).map((p) => `• ${p.codigo}: ${ESTADO_TXT[p.estado] ?? p.estado} (${soles(p.total)})`).join('\n');
}

/** Intenciones en orden de prioridad: las más específicas primero. */
const INTENCIONES = [
  { id: 'humano', patron: /(agente|asesor|humano|una persona|hablar con|ticket|operador)/ },
  { id: 'reembolso', patron: /(reembols|devol|devuelv|me arrepent|cancelar compra|cancelar mi)/ },
  { id: 'regalo', patron: /(regal)/ },
  { id: 'comprobante', patron: /(boleta|factura|ruc|comprobante|pdf|dni|razon social)/ },
  { id: 'clave', patron: /(clave|key|activacion|activar|licencia|instal|descarg|no me llega|no llego|no aparece|biblioteca)/ },
  { id: 'pago', patron: /(pago|pagar|tarjeta|yape|plin|rechaz|cobr)/ },
  { id: 'pedido', patron: /(pedido|compra|orden|donde esta|estado|nx-)/ },
  { id: 'cuenta', patron: /(contrasena|password|cuenta|correo|perfil|iniciar sesion|registr)/ },
  { id: 'catalogo', patron: /(juego|catalogo|precio|stock|disponible|agotado|oferta)/ },
  { id: 'saludo', patron: /(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal)/ },
  { id: 'gracias', patron: /(gracias|genial|perfecto|listo|ok\b)/ }
];

export function detectarIntencion(mensaje) {
  const t = normalizar(mensaje);
  return INTENCIONES.find((i) => i.patron.test(t))?.id ?? null;
}

/** Motor local. `pedidos` son los pedidos del cliente (puede estar vacío si no inició sesión). */
export function responderLocal(mensaje, { nombre = null, pedidos = [], ahora = new Date() } = {}) {
  const t = normalizar(mensaje);
  const intencion = detectarIntencion(mensaje);
  const codigo = /nx-[a-z]{3}-\d{6}/.exec(t)?.[0]?.toUpperCase();
  const pedidoCitado = codigo ? pedidos.find((p) => p.codigo === codigo) : null;
  const logueado = nombre !== null;

  switch (intencion) {
    case 'saludo':
      return respuesta(`¡Hola${nombre ? `, ${nombre.split(' ')[0]}` : ''}! Soy el asistente de NEXUS GAMING. Puedo ayudarte con pedidos, instalaciones, pagos, comprobantes y reembolsos. ¿Qué necesitas?`);
    case 'gracias':
      return respuesta('¡Con gusto! Si necesitas algo más, aquí estoy.', ['Hablar con una persona', '¿Dónde está mi pedido?']);
    case 'humano':
      return respuesta('Claro, te paso con el equipo de soporte. Abre un ticket y te responderán en "Mis tickets" (normalmente en menos de 24 horas).',
        [], { tipo: 'ticket', ticketTipo: 'CONSULTA', pedido: pedidoCitado?.codigo ?? null });
    case 'pedido':
    case 'clave': {
      if (!logueado) return respuesta('Para consultar tus pedidos y juegos necesito que inicies sesión. Luego los verás en "Mi biblioteca" y en "Mis pedidos".', ['Hablar con una persona']);
      if (pedidos.length === 0) return respuesta('Aún no tienes compras registradas. Cuando compres, tu juego aparecerá al instante en "Mi biblioteca", listo para instalar.', ['Hablar con una persona']);
      const foco = pedidoCitado ?? pedidos[0];
      const extra = intencion === 'clave'
        ? (foco.estado === 'ENTREGADO'
          ? 'Tu juego ya está en "Mi biblioteca": pulsa "Instalar" en su tarjeta y espera a que termine la descarga. Si fue un regalo, lo recibe el destinatario en su biblioteca.'
          : foco.estado === 'REEMBOLSADO' ? 'Ese pedido fue reembolsado, así que el juego ya no está en tu biblioteca.' : 'El pago aún no se confirma; apenas se apruebe, el juego aparece solo en tu biblioteca.')
        : '';
      return respuesta(`${pedidoCitado ? `Tu pedido ${foco.codigo}` : `Tu pedido más reciente, ${foco.codigo},`} está ${ESTADO_TXT[foco.estado] ?? foco.estado} (${soles(foco.total)}).\n${extra}\n\nTus últimos pedidos:\n${resumenPedidos(pedidos)}`.replace(/\n{3,}/g, '\n\n'),
        ['¿Cómo instalo mi juego?', '¿Cómo pido un reembolso?', 'Hablar con una persona']);
    }
    case 'reembolso': {
      const elegibles = pedidos.filter((p) => p.estado !== 'REEMBOLSADO' && p.estado !== 'PENDIENTE' && dentroDePlazoReembolso(p.fecha, ahora));
      const base = `Aceptamos reembolsos dentro de ${POLITICA_REEMBOLSO_DIAS} días desde la compra. Se solicitan con un ticket de tipo Reembolso y el equipo lo revisa y aprueba.`;
      if (!logueado) return respuesta(`${base} Inicia sesión para solicitarlo.`);
      if (pedidoCitado && elegibles.includes(pedidoCitado))
        return respuesta(`${base}\n\nTu pedido ${pedidoCitado.codigo} está dentro del plazo. ¿Quieres solicitar el reembolso ahora?`, [], { tipo: 'ticket', ticketTipo: 'REEMBOLSO', pedido: pedidoCitado.codigo });
      if (elegibles.length === 0) return respuesta(`${base}\n\nPor ahora no tienes pedidos dentro del plazo de reembolso.`, ['Hablar con una persona']);
      return respuesta(`${base}\n\nPedidos dentro del plazo:\n${resumenPedidos(elegibles)}\n\nEscribe el código del pedido que quieres reembolsar.`, [], { tipo: 'ticket', ticketTipo: 'REEMBOLSO', pedido: elegibles[0].codigo });
    }
    case 'comprobante':
      return respuesta('En el pago eliges Boleta (el DNI es opcional, y obligatorio desde S/ 700) o Factura (necesitas RUC válido, razón social y dirección fiscal). ' +
        'Después descargas el PDF desde "Mis pedidos" → detalle del pedido → "Descargar comprobante".', ['Quiero factura', 'Hablar con una persona']);
    case 'regalo':
      return respuesta('Para regalar un juego, abre su ficha y elige "Es un regalo" (o al añadirlo al carrito). En el pago escribes el correo del destinatario y un mensaje opcional. El juego llega a su biblioteca al instante.', ['Quiero factura', 'Hablar con una persona']);
    case 'pago':
      return respuesta('Aceptamos tarjeta, Yape y Plin. Si tu pago fue rechazado, revisa el número de la tarjeta, el vencimiento y el CVV, o prueba con Yape/Plin (celular de 9 dígitos que empiece con 9). El pago es simulado en este proyecto académico.', ['¿Cómo pido un reembolso?', 'Hablar con una persona']);
    case 'cuenta':
      return respuesta('Puedes cambiar tu nombre, departamento y contraseña en "Mi perfil". Si olvidaste tu contraseña, abre un ticket y el equipo te ayuda a recuperarla.', ['Hablar con una persona']);
    case 'catalogo':
      return respuesta('En el Catálogo puedes buscar por título o género, ordenar por precio y filtrar por categoría. Si un juego aparece como "Agotado", vuelve más tarde: el equipo repone el stock.', ['Hablar con una persona']);
    default:
      return respuesta('No estoy seguro de haber entendido. Puedo ayudarte con pedidos, instalaciones, pagos, comprobantes, regalos y reembolsos; o abre un ticket para hablar con una persona.',
        SUGERENCIAS_BASE, { tipo: 'ticket', ticketTipo: 'CONSULTA', pedido: null });
  }
}

/** Prompt del sistema para el modelo de lenguaje (solo si hay clave configurada). */
export function construirPrompt({ nombre, pedidos }) {
  const ctx = pedidos.length
    ? pedidos.slice(0, 5).map((p) => `${p.codigo} | ${p.estado} | ${soles(p.total)} | ${p.fecha.slice(0, 10)}`).join('\n')
    : '(sin pedidos)';
  return `Eres el asistente de soporte de NEXUS GAMING. Responde SIEMPRE en español, de forma breve, amable y concreta (máximo 5 frases).
Usa únicamente la información de abajo; si no la sabes, dilo y sugiere abrir un ticket con soporte humano. Nunca pidas contraseñas ni datos completos de tarjeta.
No prometas reembolsos: solo explica que se solicitan con un ticket y el personal los aprueba.

CONOCIMIENTO DEL NEGOCIO:
${BASE_CONOCIMIENTO}

CLIENTE: ${nombre ?? 'visitante sin sesión'}
PEDIDOS RECIENTES (código | estado | total | fecha):
${ctx}`;
}

/** Llama a la API de Anthropic. Devuelve el texto o null si algo falla (se usará el motor local). */
export async function consultarModelo({ mensaje, historial = [], nombre, pedidos, apiKey, modelo, fetchImpl = fetch, timeoutMs = 15000 }) {
  if (!apiKey) return null;
  // La API exige alternar usuario/asistente empezando por usuario.
  const previos = historial.slice(-6).filter((m) => m && typeof m.texto === 'string' && ['usuario', 'asistente'].includes(m.rol))
    .map((m) => ({ role: m.rol === 'usuario' ? 'user' : 'assistant', content: m.texto.slice(0, 600) }));
  const mensajes = [];
  for (const m of [...previos, { role: 'user', content: mensaje }]) {
    if (mensajes.length && mensajes[mensajes.length - 1].role === m.role) mensajes[mensajes.length - 1] = m;
    else mensajes.push(m);
  }
  while (mensajes.length && mensajes[0].role !== 'user') mensajes.shift();

  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), timeoutMs);
  try {
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: control.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: modelo, max_tokens: 400, system: construirPrompt({ nombre, pedidos }), messages: mensajes })
    });
    if (!res.ok) return null;
    const datos = await res.json();
    const texto = datos?.content?.find?.((b) => b.type === 'text')?.text;
    return typeof texto === 'string' && texto.trim() ? texto.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function responderAsistente(entrada, opciones = {}) {
  const local = responderLocal(entrada.mensaje, entrada);
  const texto = await consultarModelo({ ...entrada, ...opciones });
  if (!texto) return local;
  // El modelo redacta; las acciones (abrir ticket) siguen saliendo de las reglas locales.
  return { ...local, respuesta: texto, origen: 'ia' };
}
