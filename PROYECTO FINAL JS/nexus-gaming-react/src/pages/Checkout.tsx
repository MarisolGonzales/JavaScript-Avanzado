import { useActionState, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { mensajeError } from '../api/http';
import { pedidosApi } from '../api/servicios';
import { Qr } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { useToast } from '../context/ToastContext';
import { useTitulo } from '../hooks/useTitulo';
import { desglosarIgv } from '../logic/dinero';
import { MONTO_BOLETA_CON_DNI, esDniVerosimil, esRuc } from '../logic/documentos';
import { formatoSoles } from '../logic/formato';
import { cumpleLuhn, formatearTarjeta, formatearVencimiento, numeroOperacion, soloDigitos, ultimos4, vencimientoVigente } from '../logic/validaciones-pago';
import { esEmail, textoMinimo } from '../logic/validaciones-form';
import type { MetodoPago, NuevoPedido, TipoComprobante } from '../models';

export interface DatosCheckout {
  metodo: MetodoPago; tipo: TipoComprobante;
  destinatario: string; mensaje: string;
  documento: string; nombre: string; direccion: string;
  numero: string; titular: string; exp: string; cvv: string;
}
type Campo = 'destinatario' | 'documento' | 'nombre' | 'direccion' | 'numero' | 'titular' | 'exp' | 'cvv';
export type ErroresCheckout = Partial<Record<Campo, true>>;

/**
 * Validación pura de los tres bloques (regalo, comprobante y tarjeta), con las mismas reglas
 * que los formularios reactivos de la versión Angular. Devuelve solo los campos inválidos.
 */
export function erroresCheckout(d: DatosCheckout, total: number, hayRegalo: boolean): ErroresCheckout {
  const e: ErroresCheckout = {};
  if (hayRegalo && (!esEmail(d.destinatario.trim()) || d.destinatario.trim().length > 80)) e.destinatario = true;
  if (d.tipo === 'FACTURA') {
    if (!esRuc(d.documento.trim())) e.documento = true;
    if (!textoMinimo(d.nombre, 3) || d.nombre.length > 120) e.nombre = true;
    if (!textoMinimo(d.direccion, 5) || d.direccion.length > 160) e.direccion = true;
  } else {
    const dni = d.documento.trim();
    const exige = total >= MONTO_BOLETA_CON_DNI;
    if (exige ? !esDniVerosimil(dni) : dni !== '' && !esDniVerosimil(dni)) e.documento = true;
    if (d.nombre.length > 120) e.nombre = true;
  }
  if (d.metodo === 'TARJETA') {
    if (!cumpleLuhn(d.numero)) e.numero = true;
    if (!textoMinimo(d.titular, 3)) e.titular = true;
    if (!vencimientoVigente(d.exp)) e.exp = true;
    if (!/^\d{3,4}$/.test(d.cvv)) e.cvv = true;
  }
  return e;
}

const METODOS: readonly { clave: MetodoPago; nombre: string; icono: string }[] = [
  { clave: 'TARJETA', nombre: 'Tarjeta', icono: 'fa-credit-card' },
  { clave: 'YAPE', nombre: 'Yape', icono: 'fa-mobile-screen' },
  { clave: 'PLIN', nombre: 'Plin', icono: 'fa-mobile-screen-button' },
];

/** useFormStatus (Laboratorio 13): el botón sabe si SU formulario se está enviando, sin props. */
function BotonPagar({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-100" disabled={pending}>
      {pending ? <><span className="spinner" aria-hidden="true" /> Procesando…</> : `Pagar ${formatoSoles(total)}`}
    </button>
  );
}

/**
 * FINALIZAR COMPRA con useActionState (Laboratorio 13): el formulario usa `action={pagar}`,
 * React gestiona el estado "pendiente" y guarda el resultado (el error del servidor, si lo hay).
 * Todos los campos son controlados (useState): React 19 reinicia los no controlados al terminar la acción.
 */
export function Checkout() {
  useTitulo('Finalizar compra · NEXUS GAMING');
  const carrito = useCarrito();
  const { usuario } = useAuth();
  const toast = useToast();
  const cache = useQueryClient();
  const navigate = useNavigate();

  const [d, setD] = useState<DatosCheckout>({
    metodo: 'TARJETA', tipo: 'BOLETA', destinatario: '', mensaje: '',
    documento: '', nombre: usuario?.nombre ?? '', direccion: '', numero: '', titular: '', exp: '', cvv: '',
  });
  const [nombreEditado, setNombreEditado] = useState(false);
  const [tocados, setTocados] = useState<ReadonlySet<Campo>>(new Set());
  const [intentado, setIntentado] = useState(false);

  const total = carrito.total;
  const desglose = desglosarIgv(total);
  const exigeDni = d.tipo === 'BOLETA' && total >= MONTO_BOLETA_CON_DNI;
  const errores = erroresCheckout(d, total, carrito.hayRegalo);
  /** Un campo se marca en rojo si es inválido y ya se tocó (o ya se intentó pagar). */
  const error = (c: Campo) => !!errores[c] && (tocados.has(c) || intentado);
  const tocar = (c: Campo) => () => setTocados((t) => new Set(t).add(c));
  const poner = (c: keyof DatosCheckout, valor: string) => setD((x) => ({ ...x, [c]: valor }));
  const digitos = (c: Campo, max: number) => (e: ChangeEvent<HTMLInputElement>) => poner(c, soloDigitos(e.target.value).slice(0, max));

  /** Boleta y factura piden datos distintos: el nombre se rellena con el del cliente solo en boleta. */
  function cambiarTipo(tipo: TipoComprobante) {
    setD((x) => ({ ...x, tipo, documento: '', nombre: nombreEditado ? x.nombre : tipo === 'FACTURA' ? '' : usuario?.nombre ?? '' }));
  }

  const [errorEnvio, pagar] = useActionState<string | null, FormData>(async () => {
    setIntentado(true);
    if (Object.keys(errores).length > 0) {
      toast.error('Revisa los campos marcados en rojo.');
      return null;
    }
    const pedido: NuevoPedido = {
      items: carrito.paraApi(),
      // Yape y Plin no piden datos: se paga escaneando el QR y se guarda un número de operación.
      pago: { metodo: d.metodo, referencia: d.metodo === 'TARJETA' ? ultimos4(d.numero) : numeroOperacion() },
      comprobante: d.tipo === 'FACTURA'
        ? { tipo: 'FACTURA', documento: d.documento.trim(), nombre: d.nombre.trim(), direccion: d.direccion.trim() }
        : { tipo: 'BOLETA', ...(d.documento.trim() ? { documento: d.documento.trim() } : {}), ...(d.nombre.trim() ? { nombre: d.nombre.trim() } : {}) },
      ...(carrito.hayRegalo ? { regalo: { destinatario: d.destinatario.trim(), mensaje: d.mensaje.trim() } } : {}),
    };
    try {
      const p = await pedidosApi.crear(pedido);
      carrito.vaciar();
      await Promise.all(['pedidos', 'biblioteca', 'juegos'].map((k) => cache.invalidateQueries({ queryKey: [k] })));
      toast.exito(`¡Compra exitosa! Pedido ${p.codigo}.`);
      void navigate(`/pedidos/${p.codigo}?nuevo=1`);
      return null;
    } catch (e) {
      return mensajeError(e);
    }
  }, null);

  /** Contenido del QR de Yape/Plin: comercio y monto a pagar. */
  const textoQr = `${d.metodo === 'PLIN' ? 'Plin' : 'Yape'} | NEXUS GAMING S.A.C. | S/ ${total.toFixed(2)} | Pago simulado - proyecto academico`;
  const inv = (c: Campo) => (error(c) ? 'invalido' : undefined);

  return (
    <>
      <section className="page-header">
        <h1>Finalizar compra</h1>
        <p>Elige tu comprobante y cómo pagar. Tus juegos aparecerán al instante en tu biblioteca.</p>
      </section>

      <section className="page-body">
        {carrito.items.length === 0 ? (
          <div className="estado-vacio">
            <i className="fa-solid fa-cart-shopping" aria-hidden="true" /><h2>No hay juegos para pagar</h2>
            <Link className="btn btn-primary" to="/catalogo">Ir al catálogo</Link>
          </div>
        ) : (
          <form className="cart-layout" action={pagar} noValidate>
            <div className="checkout-pasos">

              {carrito.hayRegalo && (
                <div className="panel-nx" aria-labelledby="t-regalo">
                  <h2 id="t-regalo"><span className="paso-num"><i className="fa-solid fa-gift" aria-hidden="true" /></span> ¿A quién le regalas?</h2>
                  <p className="muted small">Los juegos marcados como regalo llegan a la biblioteca de esta persona.</p>
                  <div className="form-group">
                    <label htmlFor="destinatario">Correo del destinatario</label>
                    <input id="destinatario" type="email" placeholder="amigo@correo.com" className={inv('destinatario')}
                      value={d.destinatario} onChange={(e) => poner('destinatario', e.target.value)} onBlur={tocar('destinatario')} />
                    {error('destinatario') && <p className="msg-error">Escribe un correo válido.</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="mensaje-regalo">Mensaje <span className="muted">(opcional)</span></label>
                    <textarea id="mensaje-regalo" rows={2} maxLength={200} placeholder="¡Feliz cumpleaños!" value={d.mensaje} onChange={(e) => poner('mensaje', e.target.value)} />
                  </div>
                </div>
              )}

              <div className="panel-nx" aria-labelledby="t-comprobante">
                <h2 id="t-comprobante"><span className="paso-num">{carrito.hayRegalo ? 2 : 1}</span> Comprobante de pago</h2>
                <div className="opciones-entrega" role="radiogroup" aria-label="Tipo de comprobante">
                  <label className={`opcion ${d.tipo === 'BOLETA' ? 'activa' : ''}`}>
                    <input type="radio" name="tipo" value="BOLETA" checked={d.tipo === 'BOLETA'} onChange={() => cambiarTipo('BOLETA')} />
                    <span><strong><i className="fa-solid fa-receipt" aria-hidden="true" /> Boleta</strong><small>Para personas · DNI opcional</small></span>
                  </label>
                  <label className={`opcion ${d.tipo === 'FACTURA' ? 'activa' : ''}`}>
                    <input type="radio" name="tipo" value="FACTURA" checked={d.tipo === 'FACTURA'} onChange={() => cambiarTipo('FACTURA')} />
                    <span><strong><i className="fa-solid fa-file-invoice" aria-hidden="true" /> Factura</strong><small>Para empresas · requiere RUC</small></span>
                  </label>
                </div>

                {d.tipo === 'FACTURA' ? (
                  <>
                    <div className="form-group">
                      <label htmlFor="ruc">RUC</label>
                      <input id="ruc" inputMode="numeric" maxLength={11} placeholder="20601234565" className={inv('documento')}
                        value={d.documento} onChange={digitos('documento', 11)} onBlur={tocar('documento')} />
                      {error('documento') && <p className="msg-error">RUC no válido (11 dígitos y dígito de control correcto).</p>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="razon">Razón social</label>
                      <input id="razon" placeholder="Mi Empresa S.A.C." className={inv('nombre')}
                        value={d.nombre} onChange={(e) => { setNombreEditado(true); poner('nombre', e.target.value); }} onBlur={tocar('nombre')} />
                      {error('nombre') && <p className="msg-error">Escribe la razón social.</p>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="dir-fiscal">Dirección fiscal</label>
                      <input id="dir-fiscal" placeholder="Av. Principal 123, Lima" className={inv('direccion')}
                        value={d.direccion} onChange={(e) => poner('direccion', e.target.value)} onBlur={tocar('direccion')} />
                      {error('direccion') && <p className="msg-error">Escribe la dirección fiscal (mínimo 5 caracteres).</p>}
                    </div>
                  </>
                ) : (
                  <div className="form-fila">
                    <div className="form-group">
                      <label htmlFor="nombre-boleta">Nombre del cliente</label>
                      <input id="nombre-boleta" autoComplete="name" value={d.nombre} onChange={(e) => { setNombreEditado(true); poner('nombre', e.target.value); }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dni">DNI {exigeDni ? '' : '(opcional)'}</label>
                      <input id="dni" inputMode="numeric" maxLength={8} placeholder="74528196" className={inv('documento')}
                        value={d.documento} onChange={digitos('documento', 8)} onBlur={tocar('documento')} />
                      {error('documento') && <p className="msg-error">{exigeDni ? `Las boletas desde S/ ${MONTO_BOLETA_CON_DNI} requieren un DNI real de 8 dígitos.` : 'Escribe un DNI real de 8 dígitos (no valen secuencias como 12345678).'}</p>}
                    </div>
                  </div>
                )}
              </div>

              <section className="panel-nx" aria-labelledby="t-pago">
                <h2 id="t-pago"><span className="paso-num">{carrito.hayRegalo ? 3 : 2}</span> Método de pago</h2>

                <div className="payment-tabs" role="tablist" aria-label="Método de pago">
                  {METODOS.map((m) => (
                    <button key={m.clave} type="button" role="tab" className={`payment-tab ${d.metodo === m.clave ? 'active' : ''}`} aria-selected={d.metodo === m.clave} onClick={() => setD((x) => ({ ...x, metodo: m.clave }))}>
                      <i className={`fa-solid ${m.icono}`} aria-hidden="true" /> {m.nombre}
                    </button>
                  ))}
                </div>

                {d.metodo === 'TARJETA' && (
                  <div className="payment-panel">
                    <div className="form-group">
                      <label htmlFor="numero">Número de tarjeta</label>
                      <input id="numero" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" className={inv('numero')}
                        value={d.numero} onChange={(e) => poner('numero', formatearTarjeta(e.target.value))} onBlur={tocar('numero')} />
                      {error('numero') && <p className="msg-error">Número de tarjeta no válido.</p>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="nombre-tarjeta">Nombre del titular</label>
                      <input id="nombre-tarjeta" autoComplete="cc-name" className={inv('titular')}
                        value={d.titular} onChange={(e) => poner('titular', e.target.value)} onBlur={tocar('titular')} />
                      {error('titular') && <p className="msg-error">Escribe el nombre como figura en la tarjeta.</p>}
                    </div>
                    <div className="form-fila">
                      <div className="form-group">
                        <label htmlFor="exp">Vencimiento (MM/AA)</label>
                        <input id="exp" inputMode="numeric" autoComplete="cc-exp" placeholder="12/29" maxLength={5} className={inv('exp')}
                          value={d.exp} onChange={(e) => poner('exp', formatearVencimiento(e.target.value))} onBlur={tocar('exp')} />
                        {error('exp') && <p className="msg-error">Fecha vencida o inválida.</p>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="cvv">CVV</label>
                        <input id="cvv" inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="123" type="password" className={inv('cvv')}
                          value={d.cvv} onChange={digitos('cvv', 4)} onBlur={tocar('cvv')} />
                        {error('cvv') && <p className="msg-error">3 o 4 dígitos.</p>}
                      </div>
                    </div>
                    <p className="form-hint"><i className="fa-solid fa-lock" aria-hidden="true" /> Proyecto académico: no se procesa dinero real y solo se guardan los últimos 4 dígitos. Prueba con 4242 4242 4242 4242.</p>
                  </div>
                )}
                {d.metodo === 'YAPE' && (
                  <div className="payment-panel pago-qr">
                    <div className="qr-caja">
                      <Qr texto={textoQr} tamano={176} color="#742284" etiqueta="Código QR para pagar con Yape" />
                      <strong className="qr-monto">{formatoSoles(total)}</strong>
                      <span className="muted small">NEXUS GAMING S.A.C.</span>
                    </div>
                    <div className="qr-detalle">
                      <ol className="qr-pasos">
                        <li>Abre <strong>Yape</strong> en tu celular y elige <strong>Escanear QR</strong>.</li>
                        <li>Apunta la cámara al código y confirma el monto de {formatoSoles(total)}.</li>
                        <li>Cuando Yape te muestre el pago exitoso, pulsa <strong>Pagar</strong> para recibir tus juegos.</li>
                      </ol>
                      <p className="form-hint"><i className="fa-solid fa-lock" aria-hidden="true" /> Proyecto académico: el pago es simulado y no se cobra dinero real.</p>
                    </div>
                  </div>
                )}
                {d.metodo === 'PLIN' && (
                  <div className="payment-panel pago-qr">
                    <div className="qr-caja">
                      <Qr texto={textoQr} tamano={176} color="#0b4f9c" etiqueta="Código QR para pagar con Plin" />
                      <strong className="qr-monto">{formatoSoles(total)}</strong>
                      <span className="muted small">NEXUS GAMING S.A.C.</span>
                    </div>
                    <div className="qr-detalle">
                      <ol className="qr-pasos">
                        <li>Abre la app de tu banco con <strong>Plin</strong> y elige <strong>Pagar con QR</strong>.</li>
                        <li>Apunta la cámara al código y confirma el monto de {formatoSoles(total)}.</li>
                        <li>Cuando tu banco te muestre el pago exitoso, pulsa <strong>Pagar</strong> para recibir tus juegos.</li>
                      </ol>
                      <p className="form-hint"><i className="fa-solid fa-lock" aria-hidden="true" /> Proyecto académico: el pago es simulado y no se cobra dinero real.</p>
                    </div>
                  </div>
                )}
              </section>

              {errorEnvio && <div className="banner-error en-panel" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> {errorEnvio}</div>}
            </div>

            <aside className="cart-summary" aria-label="Resumen del pedido">
              <h2>Tu pedido</h2>
              <ul className="resumen-lista">
                {carrito.items.map((i) => (
                  <li key={`${i.idJuego}-${i.tipoEntrega}`}><span>{i.titulo} {i.tipoEntrega === 'REGALO' && <small><i className="fa-solid fa-gift" aria-hidden="true" /> regalo</small>}</span><span>{formatoSoles(i.precio)}</span></li>
                ))}
              </ul>
              <div className="summary-row"><span>Op. gravada</span><span>{formatoSoles(desglose.subtotal)}</span></div>
              <div className="summary-row"><span>IGV (18 %)</span><span>{formatoSoles(desglose.igv)}</span></div>
              <div className="summary-row total"><span>Total</span><span>{formatoSoles(total)}</span></div>
              <p className="muted small">Comprobante: <strong>{d.tipo === 'FACTURA' ? 'Factura' : 'Boleta'}</strong> electrónica en PDF.</p>
              <BotonPagar total={total} />
              <Link className="btn btn-link w-100" to="/carrito">Volver al carrito</Link>
            </aside>
          </form>
        )}
      </section>
    </>
  );
}
