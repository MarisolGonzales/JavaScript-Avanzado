"use strict";

const REGLAS_BASE = Object.freeze({
  igvPorcentaje: 18,
  descuentoClienteFrecuente: 5,
  descuentoMaximo: 50,
  envioExpresCentimos: 1500,
});

const OPCION_CLIENTE_FRECUENTE = 1 << 0;
const OPCION_ENVIO_EXPRES = 1 << 1;

const formulario = document.querySelector("#formCotizacion");
const inputProducto = document.querySelector("#producto");
const inputPrecio = document.querySelector("#precio");
const inputCantidad = document.querySelector("#cantidad");
const inputDescuento = document.querySelector("#descuento");
const inputClienteFrecuente = document.querySelector("#clienteFrecuente");
const inputEnvioExpres = document.querySelector("#envioExpres");
const mensajeError = document.querySelector("#mensajeError");
const panelResultado = document.querySelector("#panelResultado");

const salidas = {
  id: document.querySelector("#idOperacion"),
  producto: document.querySelector("#productoResultado"),
  subtotal: document.querySelector("#subtotalResultado"),
  descuento: document.querySelector("#descuentoResultado"),
  base: document.querySelector("#baseResultado"),
  igv: document.querySelector("#igvResultado"),
  envio: document.querySelector("#envioResultado"),
  total: document.querySelector("#totalResultado"),
  banderas: document.querySelector("#explicacionBanderas"),
};

const formateadorMoneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

let correlativo = 0n;

function crearIdOperacion() {
  correlativo += 1n;
  return BigInt(Date.now()) * 1_000_000n + correlativo;
}

function convertirImporteACentimos(texto) {
  const limpio = texto.trim();
  const partes = limpio.split(".");

  if (limpio === "" || partes.length > 2) {
    throw new TypeError("Ingresa un precio válido con punto decimal.");
  }

  const parteEntera = partes[0];
  const parteDecimal = partes[1] ?? "";

  if (parteEntera === "" || parteDecimal.length > 2) {
    throw new RangeError("El precio admite como máximo dos decimales.");
  }

  const enteros = Number(parteEntera);
  const decimales = Number(parteDecimal.padEnd(2, "0") || "0");

  if (
    !Number.isInteger(enteros) || enteros < 0 ||
    !Number.isInteger(decimales) || decimales < 0 || decimales > 99
  ) {
    throw new TypeError("El precio contiene caracteres o signos no válidos.");
  }

  const centimos = enteros * 100 + decimales;

  if (!Number.isSafeInteger(centimos) || centimos <= 0) {
    throw new RangeError("El precio debe ser mayor que 0 y estar dentro del rango permitido.");
  }

  return centimos;
}

function leerEntero(input, nombre, minimo, maximo) {
  const valor = Number(input.value);
  if (!Number.isInteger(valor) || valor < minimo || valor > maximo) {
    throw new RangeError(`${nombre} debe ser un entero entre ${minimo} y ${maximo}.`);
  }
  return valor;
}

function crearBanderas({ clienteFrecuente, envioExpres }) {
  let banderas = 0;
  if (clienteFrecuente) {
    banderas |= OPCION_CLIENTE_FRECUENTE;
  }
  if (envioExpres) {
    banderas |= OPCION_ENVIO_EXPRES;
  }
  return banderas;
}

function tieneOpcion(banderas, opcion) {
  return (banderas & opcion) !== 0;
}

function sumarCentimos(...valores) {
  let total = 0;
  for (const valor of valores) {
    total += valor;
  }
  return total;
}

function calcularCotizacion(datos, opciones = {}) {
  const reglas = { ...REGLAS_BASE, ...opciones };
  const banderas = reglas.banderas ?? 0;

  const subtotalCentimos = datos.precioCentimos * datos.cantidad;
  if (!Number.isSafeInteger(subtotalCentimos)) {
    throw new RangeError("El subtotal excede el rango de enteros seguros.");
  }

  const esFrecuente = tieneOpcion(banderas, OPCION_CLIENTE_FRECUENTE);
  const descuentoMinimo = esFrecuente ? reglas.descuentoClienteFrecuente : 0;
  const porcentajeDescuento = Math.max(datos.descuentoSolicitado, descuentoMinimo);

  const descuentoCentimos = Math.round((subtotalCentimos * porcentajeDescuento) / 100);
  const baseCentimos = subtotalCentimos - descuentoCentimos;
  const igvCentimos = Math.round((baseCentimos * reglas.igvPorcentaje) / 100);

  const tieneEnvio = tieneOpcion(banderas, OPCION_ENVIO_EXPRES);
  const envioCentimos = tieneEnvio ? reglas.envioExpresCentimos : 0;

  const totalCentimos = sumarCentimos(baseCentimos, igvCentimos, envioCentimos);

  return {
    id: crearIdOperacion(),
    producto: datos.producto,
    subtotalCentimos,
    descuentoCentimos,
    baseCentimos,
    igvCentimos,
    envioCentimos,
    totalCentimos,
    banderas,
    porcentajeDescuento,
  };
}

function centimosASoles(centimos) {
  return formateadorMoneda.format(centimos / 100);
}

function mostrarCotizacion(resultado) {
  salidas.id.textContent = resultado.id.toString();
  salidas.producto.textContent = resultado.producto;
  salidas.subtotal.textContent = centimosASoles(resultado.subtotalCentimos);
  salidas.descuento.textContent = `${centimosASoles(resultado.descuentoCentimos)} (${resultado.porcentajeDescuento}%)`;
  salidas.base.textContent = centimosASoles(resultado.baseCentimos);
  salidas.igv.textContent = centimosASoles(resultado.igvCentimos);
  salidas.envio.textContent = centimosASoles(resultado.envioCentimos);
  salidas.total.textContent = centimosASoles(resultado.totalCentimos);

  const esFrecuente = tieneOpcion(resultado.banderas, OPCION_CLIENTE_FRECUENTE);
  const tieneEnvio = tieneOpcion(resultado.banderas, OPCION_ENVIO_EXPRES);

  const mensajes = [];
  if (esFrecuente) mensajes.push("Cliente frecuente activo (mínimo 5% de descuento).");
  if (tieneEnvio) mensajes.push("Entrega express aplicada (S/ 15.00).");

  salidas.banderas.textContent = mensajes.join(" ") || "Sin opciones adicionales seleccionadas.";

  mensajeError.hidden = true;
  panelResultado.hidden = false;
}

function mostrarError(mensaje) {
  mensajeError.textContent = mensaje;
  mensajeError.hidden = false;
  panelResultado.hidden = true;
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  try {
    const producto = inputProducto.value.trim() || "Producto sin nombre";
    const precioCentimos = convertirImporteACentimos(inputPrecio.value);
    const cantidad = leerEntero(inputCantidad, "La cantidad", 1, 10000);
    const descuentoSolicitado = leerEntero(inputDescuento, "El descuento", 0, REGLAS_BASE.descuentoMaximo);

    const banderas = crearBanderas({
      clienteFrecuente: inputClienteFrecuente.checked,
      envioExpres: inputEnvioExpres.checked,
    });

    const cotizacion = calcularCotizacion(
      { producto, precioCentimos, cantidad, descuentoSolicitado },
      { banderas }
    );

    mostrarCotizacion(cotizacion);
  } catch (error) {
    mostrarError(error.message);
  }
});

formulario.addEventListener("reset", () => {
  mensajeError.hidden = true;
  panelResultado.hidden = true;
});