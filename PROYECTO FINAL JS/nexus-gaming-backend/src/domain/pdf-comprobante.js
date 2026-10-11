/**
 * COMPROBANTE EN PDF (boleta o factura electrónica) generado con PDFKit.
 * Estructura profesional: logo y datos del emisor, recuadro con RUC y número,
 * datos del cliente, detalle, totales con IGV y monto en letras.
 */
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'node:url';
import { EMISOR, POLITICA_REEMBOLSO_DIAS } from './constantes.js';
import { montoEnLetras } from './letras.js';

const LOGO = fileURLToPath(new URL('../../assets/logo.png', import.meta.url));
const VIOLETA = '#5b3df5';
const GRIS = '#6b7280';
const OSCURO = '#111827';
const ZEBRA = '#f4f2ff';

const dinero = (n) => `S/ ${Number(n).toFixed(2)}`;
const fechaLima = (iso) => new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
}).format(new Date(iso)).replace(',', '');

const ETIQUETA_PAGO = { TARJETA: 'Tarjeta', YAPE: 'Yape', PLIN: 'Plin' };

export function generarComprobantePdf(pedido) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4', margin: 40,
      info: { Title: `Comprobante ${pedido.comprobante.numeroCompleto}`, Author: EMISOR.razonSocial, Subject: `Pedido ${pedido.codigo}` }
    });
    const trozos = [];
    doc.on('data', (t) => trozos.push(t));
    doc.on('end', () => resolve(Buffer.concat(trozos)));
    doc.on('error', reject);

    /** Recorta un texto con "…" para que quepa en `ancho` puntos (PDFKit no lo hace solo en una línea). */
    const recortar = (txt, ancho, fuente, tam) => {
      doc.font(fuente).fontSize(tam);
      if (doc.widthOfString(txt) <= ancho) return txt;
      let t = txt;
      while (t.length > 1 && doc.widthOfString(`${t}…`) > ancho) t = t.slice(0, -1);
      return `${t.trimEnd()}…`;
    };

    const c = pedido.comprobante;
    const esFactura = c.tipo === 'FACTURA';
    const izq = 40;
    const ancho = doc.page.width - 80; // 515
    const der = izq + ancho;

    // ---------- Cabecera: logo + emisor ----------
    doc.image(LOGO, izq, 40, { height: 56 });
    doc.fillColor(OSCURO).font('Helvetica-Bold').fontSize(19).text('NEXUS', izq + 70, 44, { continued: true })
      .fillColor(VIOLETA).text(' GAMING');
    doc.fillColor(OSCURO).font('Helvetica-Bold').fontSize(8.5).text(EMISOR.razonSocial, izq + 70, 70);
    doc.fillColor(GRIS).font('Helvetica').fontSize(8)
      .text(EMISOR.direccion, izq + 70, 82, { width: 270 })
      .text(`${EMISOR.web}  ·  Tienda de videojuegos digitales`, izq + 70, 93, { width: 270 });

    // ---------- Recuadro: RUC, tipo y número ----------
    const cajaX = der - 190;
    doc.roundedRect(cajaX, 40, 190, 70, 6).lineWidth(1.4).strokeColor(VIOLETA).stroke();
    doc.fillColor(OSCURO).font('Helvetica-Bold').fontSize(10).text(`R.U.C. ${EMISOR.ruc}`, cajaX, 49, { width: 190, align: 'center' });
    doc.rect(cajaX, 64, 190, 22).fill(VIOLETA);
    doc.fillColor('#ffffff').fontSize(8.6).text(esFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA', cajaX, 71, { width: 190, align: 'center' });
    doc.fillColor(OSCURO).fontSize(12).text(c.numeroCompleto, cajaX, 92, { width: 190, align: 'center' });

    // ---------- Datos del cliente y de la operación ----------
    let y = 130;
    doc.roundedRect(izq, y, ancho, 92, 6).fillAndStroke('#fafafa', '#e5e7eb');
    const campo = (etiqueta, valor, x, yy, w) => {
      doc.fillColor(GRIS).font('Helvetica').fontSize(7.6).text(etiqueta.toUpperCase(), x, yy, { width: w });
      doc.fillColor(OSCURO).font('Helvetica-Bold').fontSize(9.4).text(valor, x, yy + 10, { width: w });
    };
    const r = c.receptor;
    campo(esFactura ? 'Razón social' : 'Cliente', r.nombre ?? '—', izq + 14, y + 10, 270);
    campo(r.tipoDoc === 'SIN DOC' ? 'Documento' : r.tipoDoc, r.documento ?? 'Sin documento', izq + 300, y + 10, 200);
    campo(esFactura ? 'Dirección fiscal' : 'Correo', esFactura ? r.direccion ?? '—' : pedido.usuario, izq + 14, y + 38, 270);
    campo('Fecha de emisión', fechaLima(c.emitidoEn), izq + 300, y + 38, 200);
    campo('Pedido', pedido.codigo, izq + 14, y + 66, 270);
    const refPago = pedido.pago.referencia ? ` (${pedido.pago.referencia})` : '';
    campo('Forma de pago · Moneda', `${ETIQUETA_PAGO[pedido.pago.metodo] ?? pedido.pago.metodo}${refPago} · Soles (PEN)`, izq + 300, y + 66, 205);

    // ---------- Detalle ----------
    y += 110;
    const col = { cant: izq + 10, desc: izq + 55, ent: izq + 300, pu: izq + 385, imp: izq + 450 };
    doc.rect(izq, y, ancho, 24).fill(VIOLETA);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.4);
    doc.text('CANT.', col.cant, y + 8, { width: 40 });
    doc.text('DESCRIPCIÓN', col.desc, y + 8);
    doc.text('ENTREGA', col.ent, y + 8);
    doc.text('P. UNIT.', col.pu, y + 8, { width: 60, align: 'right' });
    doc.text('IMPORTE', col.imp, y + 8, { width: 55, align: 'right' });
    y += 24;

    pedido.items.forEach((it, i) => {
      const alto = 30;
      if (y + alto > doc.page.height - 190) { doc.addPage(); y = 50; }
      if (i % 2 === 0) doc.rect(izq, y, ancho, alto).fill(ZEBRA);
      const esRegalo = it.tipoEntrega === 'REGALO';
      doc.fillColor(OSCURO).font('Helvetica').fontSize(9);
      doc.text(String(it.cantidad), col.cant, y + 10, { width: 40 });
      doc.font('Helvetica-Bold').fontSize(9).text(recortar(it.titulo, 235, 'Helvetica-Bold', 9), col.desc, y + 5, { width: 240, lineBreak: false });
      doc.font('Helvetica').fontSize(7.4).fillColor(GRIS).text('Licencia digital de videojuego', col.desc, y + 17, { width: 235 });
      doc.fillColor(OSCURO).fontSize(8.4).text(esRegalo ? 'Regalo' : 'Mi biblioteca', col.ent, y + 10, { width: 80 });
      doc.fontSize(9).text(dinero(it.precioUnitario), col.pu, y + 10, { width: 60, align: 'right' });
      doc.font('Helvetica-Bold').text(dinero(it.subtotal), col.imp, y + 10, { width: 55, align: 'right' });
      y += alto;
    });
    doc.moveTo(izq, y).lineTo(der, y).lineWidth(0.8).strokeColor('#d1d5db').stroke();

    // ---------- Totales ----------
    y += 14;
    const tx = der - 200;
    const fila = (etiqueta, valor, negrita = false) => {
      doc.fillColor(negrita ? OSCURO : GRIS).font(negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(negrita ? 11 : 9.2)
        .text(etiqueta, tx, y, { width: 110 });
      doc.text(valor, tx + 110, y, { width: 90, align: 'right' });
      y += negrita ? 20 : 16;
    };
    fila('Op. gravada', dinero(c.subtotal));
    fila('IGV (18 %)', dinero(c.igv));
    doc.moveTo(tx, y - 2).lineTo(der, y - 2).lineWidth(0.8).strokeColor('#d1d5db').stroke();
    y += 4;
    doc.roundedRect(tx - 6, y - 5, 206, 28, 5).fill(VIOLETA);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text('TOTAL', tx + 4, y + 3, { width: 100 });
    doc.text(dinero(c.total), tx + 100, y + 3, { width: 90, align: 'right' });
    y += 40;

    doc.fillColor(OSCURO).font('Helvetica-Bold').fontSize(8.6).text(`SON: ${montoEnLetras(c.total)}`, izq, y, { width: ancho });
    y += 22;

    // ---------- Notas y pie ----------
    doc.fillColor(GRIS).font('Helvetica').fontSize(7.8)
      .text('Los precios incluyen IGV. Las licencias se entregan de forma digital en la biblioteca del comprador (o del destinatario, si es un regalo). ' +
        `Reembolsos: dentro de ${POLITICA_REEMBOLSO_DIAS} días desde la compra, solicitándolos en Soporte.`, izq, y, { width: ancho });

    // Sin margen inferior, para poder escribir el pie sin que PDFKit cree una página nueva.
    doc.page.margins.bottom = 0;
    const pie = doc.page.height - 70;
    doc.moveTo(izq, pie).lineTo(der, pie).lineWidth(0.6).strokeColor('#e5e7eb').stroke();
    doc.fillColor(GRIS).fontSize(7.4)
      .text('Representación impresa del comprobante de pago electrónico. DOCUMENTO DE DEMOSTRACIÓN de un proyecto académico (UTP): ' +
        'no tiene valor tributario ni fue enviado a SUNAT; el RUC del emisor es ficticio.', izq, pie + 8, { width: ancho, align: 'center' });

    doc.end();
  });
}
