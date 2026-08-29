"use strict";

const formulario = document.querySelector("#formPerfil");

const campoNombre = document.querySelector("#nombre");
const campoCorreo = document.querySelector("#correo");
const campoTelefono = document.querySelector("#telefono");
const campoBiografia = document.querySelector("#biografia");

const contadorCaracteres = document.querySelector("#contadorCaracteres");
const alertaBiografia = document.querySelector("#alertaBiografia");

const mensajes = document.querySelector("#mensajes");
const tarjetaPerfil = document.querySelector("#tarjetaPerfil");

const palabraBuscar = document.querySelector("#palabraBuscar");
const btnBuscar = document.querySelector("#btnBuscar");
const resultadoBusqueda = document.querySelector("#resultadoBusqueda");

const PATRON_NOMBRE =
    /^[\p{L}\p{M}]+(?:[ '\-][\p{L}\p{M}]+)*$/u;

const PATRON_CORREO =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

const PATRON_TELEFONO =
    /^9\d{8}$/u;

const PATRON_ETIQUETA =
    /#[\p{L}\p{N}_]+/gu;

const PATRON_PALABRA =
    /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;


/* =========================================
   NORMALIZACIÓN
========================================= */

function colapsarEspacios(texto) {

    return texto
        .trim()
        .replace(/\s+/gu, " ");

}


function capitalizarNombre(texto) {

    return colapsarEspacios(texto)
        .toLocaleLowerCase("es-PE")
        .replace(
            /(^|[ '\-])\p{L}/gu,
            coincidencia =>
                coincidencia.toLocaleUpperCase("es-PE")
        );

}


/* =========================================
   TELÉFONO
========================================= */

function limpiarTelefono(texto) {

    return texto.replace(/[\s-]/gu, "");

}


/* Mejora nivel 2 */

function formatearTelefono(telefono) {

    return telefono.replace(
        /^(9\d{2})(\d{3})(\d{3})$/,
        "$1 $2 $3"
    );

}


/* =========================================
   UNICODE
========================================= */

function contarPuntosUnicode(texto) {

    return [...texto].length;

}


/* Mejora nivel 3 */

function contarGrafemas(texto) {

    const segmentador = new Intl.Segmenter("es", {
        granularity: "grapheme"
    });

    return [...segmentador.segment(texto)].length;

}


/* =========================================
   PALABRAS
========================================= */

function contarPalabras(texto) {

    return texto.match(PATRON_PALABRA)?.length ?? 0;

}


/* =========================================
   ETIQUETAS
========================================= */

function extraerEtiquetas(texto) {

    const encontradas =
        texto.match(PATRON_ETIQUETA) ?? [];

    return [
        ...new Set(
            encontradas.map(etiqueta =>
                etiqueta.toLocaleLowerCase("es-PE")
            )
        )
    ];

}


/* =========================================
   INICIALES
   Mejora nivel 1
========================================= */

function obtenerIniciales(nombre) {

    const iniciales = nombre
        .split(" ")
        .filter(Boolean)
        .map(palabra => palabra[0].toLocaleUpperCase("es-PE"))
        .join("");

    return `${iniciales}`;

}


/* =========================================
   MENCIONES
   Mejora nivel 2
========================================= */

function extraerMenciones(texto) {

    const menciones = [];

    /*
        (?<![\w.@])
        Evita comenzar dentro de un correo.

        @
        Busca el símbolo @.

        ([\p{L}\p{N}_]+)
        Captura el nombre del usuario.

        (?![\w.-]*@)
        Evita casos relacionados con correos.
    */

    const patron =
        /(?<![\w.@])@([\p{L}\p{N}_]+)(?![\w.-]*@)/gu;

    for (const coincidencia of texto.matchAll(patron)) {

        menciones.push(`@${coincidencia[1]}`);

    }

    return [...new Set(menciones)];

}


/* =========================================
   ESCAPE SEGURO PARA REGEXP
   Mejora nivel 3
========================================= */

function escaparRegExp(texto) {

    return texto.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

}


/* =========================================
   BUSCAR PALABRA
========================================= */

function buscarPalabra(texto, palabra) {

    if (!palabra.trim()) {

        return 0;

    }

    const palabraSegura = escaparRegExp(
        palabra.trim()
    );

    const patron = new RegExp(
        `\\b${palabraSegura}\\b`,
        "giu"
    );

    return texto.match(patron)?.length ?? 0;

}


/* =========================================
   VALIDACIÓN
========================================= */

function validarPerfil({ nombre, correo, telefono }) {

    const errores = [];

    if (!PATRON_NOMBRE.test(nombre)) {

        errores.push(
            "El nombre solo puede contener letras, espacios, apóstrofes o guiones."
        );

    }

    if (!PATRON_CORREO.test(correo)) {

        errores.push(
            "El correo no tiene una estructura válida."
        );

    }

    if (!PATRON_TELEFONO.test(telefono)) {

        errores.push(
            "El teléfono debe comenzar con 9 y contener exactamente 9 dígitos."
        );

    }

    return errores;

}


/* =========================================
   ERRORES
========================================= */

function mostrarErrores(errores) {

    mensajes.replaceChildren();

    const titulo = document.createElement("strong");

    titulo.textContent =
        "Revisa los siguientes datos:";

    const lista = document.createElement("ul");

    errores.forEach(error => {

        const elemento =
            document.createElement("li");

        elemento.textContent = error;

        lista.append(elemento);

    });

    mensajes.append(titulo, lista);

    mensajes.hidden = false;

    tarjetaPerfil.hidden = true;

}


/* =========================================
   ETIQUETAS
========================================= */

function mostrarEtiquetas(etiquetas) {

    const lista =
        document.querySelector("#listaEtiquetas");

    lista.replaceChildren();

    const valores =
        etiquetas.length > 0
            ? etiquetas
            : ["Sin etiquetas"];

    valores.forEach(etiqueta => {

        const elemento =
            document.createElement("li");

        elemento.textContent = etiqueta;

        lista.append(elemento);

    });

}


/* =========================================
   MOSTRAR PERFIL
========================================= */

function mostrarPerfil(perfil) {

    document.querySelector("#salidaNombre")
        .textContent = perfil.nombre;


    /* Iniciales */

    document.querySelector("#salidaIniciales")
        .textContent =
        `Iniciales: ${perfil.iniciales}`;


    /* Teléfono formateado */

    document.querySelector("#salidaContacto")
        .textContent =
        `${perfil.correo} · ${perfil.telefonoFormateado}`;


    document.querySelector("#salidaBiografia")
        .textContent =
        perfil.biografia ||
        "Sin biografía registrada.";


    document.querySelector("#totalPalabras")
        .textContent =
        perfil.palabras;


    document.querySelector("#totalPuntos")
        .textContent =
        perfil.puntosUnicode;


    document.querySelector("#totalGrafemas")
        .textContent =
        perfil.grafemas;


    document.querySelector("#totalEtiquetas")
        .textContent =
        perfil.etiquetas.length;


    mostrarEtiquetas(perfil.etiquetas);


    mensajes.hidden = true;

    tarjetaPerfil.hidden = false;


    /* Alerta de más de 200 puntos Unicode */

    if (perfil.puntosUnicode > 200) {

        alertaBiografia.hidden = false;
        alertaBiografia.classList.add("supera-limite");

    } else {

        alertaBiografia.hidden = true;
        alertaBiografia.classList.remove("supera-limite");

    }

}


/* =========================================
   ENVÍO DEL FORMULARIO
========================================= */

function manejarEnvio(evento) {

    evento.preventDefault();


    const telefonoLimpio =
        limpiarTelefono(campoTelefono.value);


    const perfil = {

        nombre:
            capitalizarNombre(campoNombre.value),

        correo:
            campoCorreo.value
                .trim()
                .toLocaleLowerCase("es-PE"),

        telefono:
            telefonoLimpio,

        telefonoFormateado:
            formatearTelefono(telefonoLimpio),

        biografia:
            colapsarEspacios(
                campoBiografia.value
            )

    };


    const errores =
        validarPerfil(perfil);


    if (errores.length > 0) {

        mostrarErrores(errores);

        return;

    }


    perfil.palabras =
        contarPalabras(perfil.biografia);


    perfil.puntosUnicode =
        contarPuntosUnicode(perfil.biografia);


    perfil.grafemas =
        contarGrafemas(perfil.biografia);


    perfil.etiquetas =
        extraerEtiquetas(perfil.biografia);


    perfil.menciones =
        extraerMenciones(perfil.biografia);


    perfil.iniciales =
        obtenerIniciales(perfil.nombre);


    mostrarPerfil(perfil);

}


/* =========================================
   CONTADOR
========================================= */

function actualizarContador() {

    const puntos =
        contarPuntosUnicode(
            campoBiografia.value
        );

    contadorCaracteres.textContent =
        campoBiografia.value.length;


    if (puntos > 200) {

        alertaBiografia.hidden = false;

        alertaBiografia.classList.add(
            "supera-limite"
        );

    } else {

        alertaBiografia.hidden = true;

        alertaBiografia.classList.remove(
            "supera-limite"
        );

    }

}


/* =========================================
   BÚSQUEDA
========================================= */

function ejecutarBusqueda() {

    const texto =
        campoBiografia.value;

    const palabra =
        palabraBuscar.value;

    const cantidad =
        buscarPalabra(texto, palabra);


    if (!palabra.trim()) {

        resultadoBusqueda.textContent =
            "Ingresa una palabra para buscar.";

        return;

    }


    resultadoBusqueda.textContent =
        `La palabra "${palabra}" aparece ${cantidad} vez/veces.`;

}


/* =========================================
   REINICIAR
========================================= */

function reiniciarInterfaz() {

    contadorCaracteres.textContent = "0";

    mensajes.hidden = true;

    mensajes.replaceChildren();

    tarjetaPerfil.hidden = true;

    alertaBiografia.hidden = true;

    alertaBiografia.classList.remove(
        "supera-limite"
    );

    resultadoBusqueda.textContent = "";

    palabraBuscar.value = "";

}


/* =========================================
   EVENTOS
========================================= */

campoBiografia.addEventListener(
    "input",
    actualizarContador
);


formulario.addEventListener(
    "submit",
    manejarEnvio
);


btnBuscar.addEventListener(
    "click",
    ejecutarBusqueda
);


formulario.addEventListener(
    "reset",
    () => {

        queueMicrotask(
            reiniciarInterfaz
        );

    }
);
