"use strict";


/*  REGLAS ACADÉMICAS */

const NOTA_MINIMA = 0;

const NOTA_MAXIMA = 20;

const NOTA_APROBATORIA = 12;

const NOTA_EN_RIESGO = 8;


/*ELEMENTOS DEL DOM */

const form =
    document.querySelector("#formNotas");

const inputNombre =
    document.querySelector("#nombre");

const inputNota1 =
    document.querySelector("#nota1");

const inputNota2 =
    document.querySelector("#nota2");

const inputNota3 =
    document.querySelector("#nota3");

const mensajeError =
    document.querySelector("#mensajeError");

const panelResultado =
    document.querySelector("#panelResultado");

const nombreResultado =
    document.querySelector("#nombreResultado");

const promedioResultado =
    document.querySelector("#promedioResultado");

const estadoResultado =
    document.querySelector("#estadoResultado");

const barraProgreso =
    document.querySelector("#barraProgreso");


/*ESTADO */

let numeroIntentos = 0;


/* VALIDAR Y CONVERTIR NOTA*/

function convertirNota(input, etiqueta) {

    const texto =
        input.value.trim();


    if (texto === "") {

        throw new TypeError(
            `Ingresa ${etiqueta}.`
        );

    }


    const nota =
        Number(texto);


    if (!Number.isFinite(nota)) {

        throw new TypeError(
            `${etiqueta} debe ser un número válido.`
        );

    }


    if (
        nota < NOTA_MINIMA ||
        nota > NOTA_MAXIMA
    ) {

        throw new RangeError(

            `${etiqueta} debe estar entre ` +
            `${NOTA_MINIMA} y ${NOTA_MAXIMA}.`

        );

    }


    return nota;

}


/* CALCULAR PROMEDIO*/

function calcularPromedio(
    nota1,
    nota2,
    nota3
) {

    return (
        nota1 +
        nota2 +
        nota3
    ) / 3;

}


/* OBTENER ESTADO */

function obtenerEstado(promedio) {

    if (promedio >= 18) {

        return "Excelente";

    }


    if (promedio >= 15) {

        return "Logro destacado";

    }


    if (
        promedio >= NOTA_APROBATORIA
    ) {

        return "Aprobado";

    }


    /*
       RETO DE EXTENSIÓN

       Menor de 8:
       En riesgo

       8 a menor de 12:
       Requiere refuerzo
    */

    if (
        promedio < NOTA_EN_RIESGO
    ) {

        return "En riesgo";

    }


    return "Requiere refuerzo";

}


/* OBTENER CLASE CSS */

function obtenerClaseEstado(
    promedio
) {

    if (promedio >= 18) {

        return "estado--excelente";

    }


    if (promedio >= 15) {

        return "estado--logrado";

    }


    if (
        promedio >= NOTA_APROBATORIA
    ) {

        return "estado--aprobado";

    }


    if (
        promedio < NOTA_EN_RIESGO
    ) {

        return "estado--riesgo";

    }


    return "estado--refuerzo";

}


/*  LIMPIAR ERROR */

function limpiarMensajeError() {

    mensajeError.textContent = "";

    mensajeError.hidden = true;

}


/*  MOSTRAR RESULTADO */

function mostrarResultado(
    nombre,
    promedio,
    estado
) {

    nombreResultado.textContent =
        `Estudiante: ${nombre}`;


    promedioResultado.textContent =
        promedio.toFixed(2);


    estadoResultado.textContent =
        estado;


    /*
       Primero eliminamos cualquier
       clase de estado anterior.
    */

    estadoResultado.className =
        "resultado__estado";


    estadoResultado.classList.add(
        obtenerClaseEstado(promedio)
    );


    /*
       Calculamos el porcentaje
       para la barra de progreso.
    */

    const porcentaje =
        (
            promedio /
            NOTA_MAXIMA
        ) * 100;


    barraProgreso.style.width =
        `${porcentaje}%`;


    panelResultado.hidden =
        false;

}


/* MOSTRAR ERROR */

function mostrarError(error) {

    panelResultado.hidden =
        true;


    mensajeError.textContent =
        error.message;


    mensajeError.hidden =
        false;


    console.error(error);

}


/* MANEJAR ENVÍO*/

function manejarEnvio(evento) {

    /*
       Evita que la página
       se recargue.
    */

    evento.preventDefault();


    limpiarMensajeError();


    numeroIntentos += 1;


    try {


        /*  NOMBRE*/

        const nombre =
            inputNombre.value.trim();


        if (nombre === "") {

            throw new TypeError(
                "Ingresa el nombre del estudiante."
            );

        }


        /* NOTA 1 */

        const nota1 =
            convertirNota(
                inputNota1,
                "la nota 1"
            );


        /*  NOTA 2 */

        const nota2 =
            convertirNota(
                inputNota2,
                "la nota 2"
            );


        /* NOTA 3*/

        const nota3 =
            convertirNota(
                inputNota3,
                "la nota 3"
            );


        /* PROMEDIO*/

        const promedio =
            calcularPromedio(
                nota1,
                nota2,
                nota3
            );


        /* ESTADO*/

        const estado =
            obtenerEstado(
                promedio
            );


        /*  MOSTRAR */

        mostrarResultado(
            nombre,
            promedio,
            estado
        );


        /* CONSOLA*/

        console.table({

            nombre,

            nota1,

            nota2,

            nota3,

            promedio,

            estado

        });


    } catch (error) {

        mostrarError(error);


    } finally {

        console.info(
            `Intento de cálculo número ${numeroIntentos}.`
        );

    }

}


/* MANEJAR REINICIO */

function manejarReinicio() {

    numeroIntentos = 0;


    limpiarMensajeError();


    panelResultado.hidden =
        true;


    barraProgreso.style.width =
        "0%";


    inputNombre.focus();

}


/*  EVENTOS*/

form.addEventListener(
    "submit",
    manejarEnvio
);


form.addEventListener(
    "reset",
    manejarReinicio
);


/* PRUEBAS INICIALES*/

console.log(
    "Laboratorio de JavaScript iniciado."
);


console.log(
    "Promedio de prueba:",
    calcularPromedio(
        18,
        16,
        17
    )
);


console.log(
    "Estado de prueba:",
    obtenerEstado(
        17
    )
);


console.log(
    "Estado de riesgo:",
    obtenerEstado(
        7.99
    )
);