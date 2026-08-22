"use strict";

const REGLAS_BASE = Object.freeze({
    igvPorcentaje: 18,
    descuentoClienteFrecuente: 5,
    descuentoMaximo: 50,

    // Envíos
    envioExpresCentimos: 1500,
    envioNormalCentimos: 1000,
    envioGratisDesdeCentimos: 50000,

    // Instalación
    instalacionTecnicaCentimos: 3500,
});

const OPCION_CLIENTE_FRECUENTE = 1 << 0;
const OPCION_ENVIO_EXPRES = 1 << 1;
const OPCION_INSTALACION = 1 << 2;

const formulario = document.querySelector("#formCotizacion");
const inputProducto = document.querySelector("#producto");
const inputPrecio = document.querySelector("#precio");
const inputCantidad = document.querySelector("#cantidad");
const inputDescuento = document.querySelector("#descuento");

const inputClienteFrecuente =
    document.querySelector("#clienteFrecuente");

const inputEnvioExpres =
    document.querySelector("#envioExpres");

const inputInstalacionTecnica =
    document.querySelector("#instalacionTecnica");

const mensajeError =
    document.querySelector("#mensajeError");

const panelResultado =
    document.querySelector("#panelResultado");

const salidas = {
    id: document.querySelector("#idOperacion"),
    producto: document.querySelector("#productoResultado"),
    subtotal: document.querySelector("#subtotalResultado"),
    descuento: document.querySelector("#descuentoResultado"),
    base: document.querySelector("#baseResultado"),
    igv: document.querySelector("#igvResultado"),
    envio: document.querySelector("#envioResultado"),
    instalacion: document.querySelector("#instalacionResultado"),
    total: document.querySelector("#totalResultado"),
    banderas: document.querySelector("#explicacionBanderas"),
    mensajeEnvio: document.querySelector("#mensajeEnvio"),
};

const formateadorMoneda = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
});

let correlativo = 0n;


// ======================================================
// CREAR ID
// ======================================================

function crearIdOperacion() {
    correlativo += 1n;

    return BigInt(Date.now()) * 1_000_000n + correlativo;
}


// ======================================================
// CONVERTIR PRECIO A CÉNTIMOS
// ======================================================

function convertirImporteACentimos(texto) {

    const limpio = texto.trim();

    const partes = limpio.split(".");

    if (limpio === "" || partes.length > 2) {
        throw new TypeError(
            "Ingresa un precio válido con punto decimal."
        );
    }

    const parteEntera = partes[0];

    const parteDecimal = partes[1] ?? "";

    if (parteEntera === "" || parteDecimal.length > 2) {
        throw new RangeError(
            "El precio admite como máximo dos decimales."
        );
    }

    const enteros = Number(parteEntera);

    const decimales =
        Number(parteDecimal.padEnd(2, "0") || "0");

    if (
        !Number.isInteger(enteros) ||
        enteros < 0 ||
        !Number.isInteger(decimales) ||
        decimales < 0 ||
        decimales > 99
    ) {
        throw new TypeError(
            "El precio contiene caracteres o signos no válidos."
        );
    }

    const centimos = enteros * 100 + decimales;

    if (!Number.isSafeInteger(centimos) || centimos <= 0) {
        throw new RangeError(
            "El precio debe ser mayor que 0 y estar dentro del rango permitido."
        );
    }

    return centimos;
}


// ======================================================
// LEER ENTEROS
// ======================================================

function leerEntero(input, nombre, minimo, maximo) {

    const valor = Number(input.value);

    if (
        !Number.isInteger(valor) ||
        valor < minimo ||
        valor > maximo
    ) {
        throw new RangeError(
            `${nombre} debe ser un entero entre ${minimo} y ${maximo}.`
        );
    }

    return valor;
}


// ======================================================
// CREAR BANDERAS
// ======================================================

function crearBanderas({
    clienteFrecuente,
    envioExpres,
    instalacionTecnica
}) {

    let banderas = 0;

    if (clienteFrecuente) {
        banderas |= OPCION_CLIENTE_FRECUENTE;
    }

    if (envioExpres) {
        banderas |= OPCION_ENVIO_EXPRES;
    }

    if (instalacionTecnica) {
        banderas |= OPCION_INSTALACION;
    }

    return banderas;
}


// ======================================================
// COMPROBAR BANDERAS
// ======================================================

function tieneOpcion(banderas, opcion) {

    return (banderas & opcion) !== 0;
}


// ======================================================
// SUMAR CÉNTIMOS
// ======================================================

function sumarCentimos(...valores) {

    let total = 0;

    for (const valor of valores) {
        total += valor;
    }

    return total;
}


// ======================================================
// CALCULAR COTIZACIÓN
// ======================================================

function calcularCotizacion(datos, opciones = {}) {

    const reglas = {
        ...REGLAS_BASE,
        ...opciones
    };

    const banderas = reglas.banderas ?? 0;

    // -----------------------------
    // SUBTOTAL
    // -----------------------------

    const subtotalCentimos =
        datos.precioCentimos * datos.cantidad;

    if (!Number.isSafeInteger(subtotalCentimos)) {
        throw new RangeError(
            "El subtotal excede el rango de enteros seguros."
        );
    }


    // -----------------------------
    // DESCUENTO
    // -----------------------------

    const esFrecuente =
        tieneOpcion(
            banderas,
            OPCION_CLIENTE_FRECUENTE
        );

    const descuentoMinimo =
        esFrecuente
            ? reglas.descuentoClienteFrecuente
            : 0;

    const descuentoAplicado = Math.min(
        Math.max(
            datos.descuento,
            descuentoMinimo
        ),
        reglas.descuentoMaximo
    );

    const descuentoCentimos = Math.round(
        subtotalCentimos *
        descuentoAplicado /
        100
    );


    // -----------------------------
    // BASE IMPONIBLE
    // -----------------------------

    const baseImponibleCentimos =
        subtotalCentimos - descuentoCentimos;


    // -----------------------------
    // IGV
    // -----------------------------

    const igvCentimos = Math.round(
        baseImponibleCentimos *
        reglas.igvPorcentaje /
        100
    );


    // ==================================================
    // MEJORA 1: ENVÍO GRATIS
    // ==================================================

    const esExpress =
        tieneOpcion(
            banderas,
            OPCION_ENVIO_EXPRES
        );

    let envioCentimos;

    if (esExpress) {

        // Express siempre cuesta S/15

        envioCentimos =
            reglas.envioExpresCentimos;

    } else if (
        baseImponibleCentimos >=
        reglas.envioGratisDesdeCentimos &&
        !esExpress
    ) {

        // Si llega a S/500 y no es express,
        // el envío es gratis.

        envioCentimos = 0;

    } else {

        // Si no llega a S/500,
        // paga envío normal de S/10.

        envioCentimos =
            reglas.envioNormalCentimos;
    }


    // ==================================================
    // MEJORA 2: INSTALACIÓN TÉCNICA
    // ==================================================

    const instalacionCentimos =
        tieneOpcion(
            banderas,
            OPCION_INSTALACION
        )
            ? reglas.instalacionTecnicaCentimos
            : 0;


    // ==================================================
    // TOTAL
    // ==================================================

    const componentes = [
        baseImponibleCentimos,
        igvCentimos,
        envioCentimos,
        instalacionCentimos
    ];

    const totalCentimos =
        sumarCentimos(...componentes);


    return {
        ...datos,
        reglas,
        banderas,
        descuentoAplicado,
        subtotalCentimos,
        descuentoCentimos,
        baseImponibleCentimos,
        igvCentimos,
        envioCentimos,
        instalacionCentimos,
        totalCentimos,
    };
}


// ======================================================
// FORMATEAR DINERO
// ======================================================

function formatearCentimos(centimos) {

    return formateadorMoneda.format(
        centimos / 100
    );
}


// ======================================================
// ERRORES
// ======================================================

function limpiarError() {

    mensajeError.textContent = "";

    mensajeError.hidden = true;
}


function mostrarError(mensaje) {

    mensajeError.textContent = mensaje;

    mensajeError.hidden = false;
}


// ======================================================
// MOSTRAR RESULTADO
// ======================================================

function mostrarResultado(resultado) {

    salidas.id.value =
        crearIdOperacion().toString();

    salidas.producto.textContent =
        `${resultado.producto} × ${resultado.cantidad}`;

    salidas.subtotal.value =
        formatearCentimos(
            resultado.subtotalCentimos
        );

    salidas.descuento.value =
        `-${formatearCentimos(
            resultado.descuentoCentimos
        )} (${resultado.descuentoAplicado} %)`;

    salidas.base.value =
        formatearCentimos(
            resultado.baseImponibleCentimos
        );

    salidas.igv.value =
        formatearCentimos(
            resultado.igvCentimos
        );

    salidas.envio.value =
        formatearCentimos(
            resultado.envioCentimos
        );

    salidas.instalacion.value =
        formatearCentimos(
            resultado.instalacionCentimos
        );


    // ==================================================
    // MOSTRAR CUÁNTO FALTA PARA ENVÍO GRATIS
    // ==================================================

    const faltaEnvioGratis = Math.max(
        0,
        resultado.reglas.envioGratisDesdeCentimos -
        resultado.baseImponibleCentimos
    );

    if (resultado.envioCentimos === 0) {

        salidas.mensajeEnvio.textContent =
            "¡Envío gratuito alcanzado!";

    } else {

        salidas.mensajeEnvio.textContent =
            `Faltan ${formatearCentimos(
                faltaEnvioGratis
            )} para obtener envío gratuito.`;
    }


    // ==================================================
    // MOSTRAR TOTAL
    // ==================================================

    salidas.total.value =
        formatearCentimos(
            resultado.totalCentimos
        );


    // ==================================================
    // MOSTRAR BANDERAS
    // ==================================================

    const frecuente =
        tieneOpcion(
            resultado.banderas,
            OPCION_CLIENTE_FRECUENTE
        );

    const expres =
        tieneOpcion(
            resultado.banderas,
            OPCION_ENVIO_EXPRES
        );

    const instalacion =
        tieneOpcion(
            resultado.banderas,
            OPCION_INSTALACION
        );

    salidas.banderas.textContent =
        `Banderas ${resultado.banderas
            .toString(2)
            .padStart(3, "0")}: ` +

        `cliente frecuente ${frecuente ? "sí" : "no"}; ` +

        `envío express ${expres ? "sí" : "no"}; ` +

        `instalación ${instalacion ? "sí" : "no"}.`;


    panelResultado.hidden = false;
}


// ======================================================
// EVENTO CALCULAR
// ======================================================

function manejarEnvio(evento) {

    evento.preventDefault();

    limpiarError();

    try {

        const producto =
            inputProducto.value.trim();

        if (producto === "") {

            throw new TypeError(
                "Escribe el nombre del producto o servicio."
            );
        }


        const precioCentimos =
            convertirImporteACentimos(
                inputPrecio.value
            );


        const cantidad =
            leerEntero(
                inputCantidad,
                "La cantidad",
                1,
                10000
            );


        const descuento =
            leerEntero(
                inputDescuento,
                "El descuento",
                0,
                50
            );


        const banderas =
            crearBanderas({

                clienteFrecuente:
                    inputClienteFrecuente.checked,

                envioExpres:
                    inputEnvioExpres.checked,

                instalacionTecnica:
                    inputInstalacionTecnica.checked
            });


        const datos = {
            producto,
            precioCentimos,
            cantidad,
            descuento
        };


        const resultado =
            calcularCotizacion(
                datos,
                { banderas }
            );


        mostrarResultado(resultado);

    } catch (error) {

        panelResultado.hidden = true;

        mostrarError(
            error instanceof Error
                ? error.message
                : "Ocurrió un error inesperado."
        );
    }
}


// ======================================================
// BOTÓN LIMPIAR
// ======================================================

function manejarReinicio() {

    limpiarError();

    panelResultado.hidden = true;

    queueMicrotask(
        () => inputProducto.focus()
    );
}


// ======================================================
// EVENTOS
// ======================================================

formulario.addEventListener(
    "submit",
    manejarEnvio
);

formulario.addEventListener(
    "reset",
    manejarReinicio
);

inputProducto.focus();