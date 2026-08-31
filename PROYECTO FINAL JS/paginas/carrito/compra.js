/* ------------------------------------------
   1. VARIABLES GENERALES
   ------------------------------------------ */
const CLAVE_CARRITO = "nexus_carrito";
const CLAVE_HISTORIAL = "nexus_historial_compras";
const CLAVE_BIBLIOTECA = "nexus_mis_juegos";

let metodoElegido = "Tarjeta";   // Método de pago seleccionado
let totalAPagar = 0;             // Total que se va a cobrar

/* ------------------------------------------
   2. FUNCIONES DE APOYO
   ------------------------------------------ */

function darFormatoSoles(monto) {
    return "S/ " + monto.toFixed(2);
}

function leerCarrito() {
    // Evita que la página se caiga si el dato guardado está dañado
    try {
        const datos = localStorage.getItem(CLAVE_CARRITO);

        if (datos) {
            return JSON.parse(datos);
        }
    } catch (error) {
        console.log("No se pudo leer el carrito guardado: " + error);
    }

    return [];
}

function mostrarMensaje(texto, tipo) {
    const caja = document.getElementById("mensaje");
    let icono = "fa-circle-check";

    if (tipo === "error") {
        icono = "fa-triangle-exclamation";
    }

    caja.className = "mensaje visible " + tipo;
    caja.innerHTML = '<i class="fa-solid ' + icono + '"></i>' + texto;
    window.scrollTo(0, 0);
}

// Deja solo los números de un texto: "12a3 45" -> "12345"
function dejarSoloNumeros(texto) {
    let numeros = "";

    for (let i = 0; i < texto.length; i++) {
        const caracter = texto.charAt(i);

        if (caracter >= "0" && caracter <= "9") {
            numeros += caracter;
        }
    }

    return numeros;
}

// [^\s@]+  -> uno o más caracteres que no sean espacios ni arroba
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esCorreoValido(correo) {
    return FORMATO_CORREO.test(correo);
}

function contarRegalos(carrito) {
    let regalos = 0;

    carrito.forEach(function (item) {
        if (item.regalo === true) {
            regalos += 1;
        }
    });

    return regalos;
}

/* ------------------------------------------
   3. FORMATO DE LOS CAMPOS DE LA TARJETA
   ------------------------------------------ */

// Separa el número de tarjeta de 4 en 4: "4589123456781234" -> "4589 1234 5678 1234"
function formatearNumeroTarjeta(texto) {
    const numeros = dejarSoloNumeros(texto).substring(0, 16);
    let resultado = "";

    for (let i = 0; i < numeros.length; i++) {
        // Cada 4 dígitos se agrega un espacio
        if (i > 0 && i % 4 === 0) {
            resultado += " ";
        }

        resultado += numeros.charAt(i);
    }

    return resultado;
}

// Pone la barra automáticamente: "0928" -> "09/28" (solo 4 números)
function formatearFecha(texto) {
    const numeros = dejarSoloNumeros(texto).substring(0, 4);

    if (numeros.length > 2) {
        return numeros.substring(0, 2) + "/" + numeros.substring(2);
    }

    return numeros;
}

/* ------------------------------------------
   4. RESUMEN DEL PEDIDO
   ------------------------------------------ */
function mostrarResumen() {
    const carrito = leerCarrito();
    const lista = document.getElementById("lista-resumen");
    let total = 0;

    lista.innerHTML = "";

    carrito.forEach(function (item) {
        total += item.precio;

        // Si el juego es un regalo se muestra para quién es
        let textoRegalo = "";

        if (item.regalo === true) {
            textoRegalo = '<span class="regalo-para"><i class="fa-solid fa-gift"></i> Regalo para ' + item.destinatario + '</span>';
        }

        const fila = document.createElement("li");
        fila.innerHTML = `
            <span>${item.titulo}${textoRegalo}</span>
            <span>${darFormatoSoles(item.precio)}</span>
        `;
        lista.appendChild(fila);
    });

    totalAPagar = total;

    document.getElementById("res-regalos").textContent = contarRegalos(carrito);
    document.getElementById("res-total").textContent = darFormatoSoles(totalAPagar);
    document.getElementById("contador-carrito").textContent = carrito.length;

    // Si el carrito está vacío no se puede comprar
    if (carrito.length === 0) {
        lista.innerHTML = '<li><span>No hay juegos en tu carrito</span></li>';
        mostrarMensaje("Tu carrito está vacío. Regresa al catálogo y agrega juegos antes de pagar.", "error");
    }
}

/* ------------------------------------------
   5. CAMBIO DE MÉTODO DE PAGO
   ------------------------------------------ */
function cambiarMetodo(metodo) {
    metodoElegido = metodo;

    const opcionesMetodo = ["metodo-tarjeta", "metodo-yape", "metodo-plin", "metodo-paypal"];

    opcionesMetodo.forEach(function (id) {
        document.getElementById(id).classList.remove("seleccionado");
    });

    const bloquesDatos = ["datos-tarjeta", "datos-billetera", "datos-paypal"];

    bloquesDatos.forEach(function (id) {
        document.getElementById(id).classList.remove("visible");
    });

    // ELECCIÓN
    if (metodo === "Tarjeta") {
        document.getElementById("metodo-tarjeta").classList.add("seleccionado");
        document.getElementById("datos-tarjeta").classList.add("visible");

    } else if (metodo === "Yape") {
        document.getElementById("metodo-yape").classList.add("seleccionado");
        document.getElementById("datos-billetera").classList.add("visible");

    } else if (metodo === "Plin") {
        document.getElementById("metodo-plin").classList.add("seleccionado");
        document.getElementById("datos-billetera").classList.add("visible");

    } else {
        document.getElementById("metodo-paypal").classList.add("seleccionado");
        document.getElementById("datos-paypal").classList.add("visible");
    }
}

/* ------------------------------------------
   6. VALIDACIONES
   ------------------------------------------ */

// Valida nombre y correo. Devuelve el texto del error o "" si todo está bien
function validarDatosPersonales(nombre, correo) {
    if (nombre.length === 0 || correo.length === 0) {
        return "Debes completar tu nombre y tu correo electrónico.";
    }

    if (nombre.length < 5) {
        return "El nombre debe tener al menos 5 letras.";
    }

    if (esCorreoValido(correo) === false) {
        return "El correo no es válido. Ejemplo: correo@gmail.com";
    }

    return "";
}

// Valida los datos de la tarjeta
function validarTarjeta() {

    // Se quitan los espacios del número antes de revisarlo
    const numero = dejarSoloNumeros(document.getElementById("tarjeta-numero").value);
    const fecha = document.getElementById("tarjeta-fecha").value.trim();
    const cvv = dejarSoloNumeros(document.getElementById("tarjeta-cvv").value);

    if (numero.length !== 16) {
        return "El número de tarjeta debe tener 16 dígitos.";
    }

    if (fecha.length !== 5) {
        return "Completa la fecha de vencimiento con el formato MM/AA. Ejemplo: 09/28";
    }

    // La fecha se parte en mes y año usando el "/"
    const partes = fecha.split("/");
    const mes = Number(partes[0]);
    const anio = 2000 + Number(partes[1]);

    if (mes < 1 || mes > 12) {
        return "El mes de vencimiento debe estar entre 01 y 12.";
    }

    // Se compara con la fecha de hoy para no aceptar tarjetas vencidas
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
        return "Esa tarjeta ya venció. Revisa la fecha de vencimiento.";
    }

    if (anio > anioActual + 15) {
        return "El año de vencimiento no es válido.";
    }

    if (cvv.length !== 3) {
        return "El CVV debe tener 3 dígitos.";
    }

    return "";
}

// Valida los datos de Yape o Plin
function validarBilletera() {
    const celular = dejarSoloNumeros(document.getElementById("billetera-celular").value);
    const codigo = dejarSoloNumeros(document.getElementById("billetera-codigo").value);

    if (celular.length !== 9) {
        return "El número de celular debe tener 9 dígitos.";
    }

    if (celular.charAt(0) !== "9") {
        return "El número de celular debe empezar con 9.";
    }

    if (codigo.length !== 6) {
        return "El código de aprobación debe tener 6 dígitos.";
    }

    return "";
}

// Valida los datos de PayPal.
function validarPaypal() {
    const correo = document.getElementById("paypal-correo").value.trim();

    if (correo.length === 0) {
        return "Escribe el correo de tu cuenta PayPal.";
    }

    if (esCorreoValido(correo) === false) {
        return "El correo de tu cuenta PayPal no es válido. Ejemplo: correo@gmail.com";
    }

    return "";
}

/* ------------------------------------------
   7. CONFIRMAR LA COMPRA
   ------------------------------------------ */

function armarTextoMetodo() {
    if (metodoElegido === "Tarjeta") {
        const numero = dejarSoloNumeros(document.getElementById("tarjeta-numero").value);
        const ultimos = numero.substring(12, 16);
        return "Tarjeta (**** " + ultimos + ")";
    }

    if (metodoElegido === "PayPal") {
        const correo = document.getElementById("paypal-correo").value.trim();
        return "PayPal (" + correo + ")";
    }

    const celular = dejarSoloNumeros(document.getElementById("billetera-celular").value);
    return metodoElegido + " (celular ***" + celular.substring(6, 9) + ")";
}

function guardarCompra(orden, fecha, textoMetodo, carrito) {
    
    // Historial de compras
    let historial = [];

    try {
        const historialGuardado = localStorage.getItem(CLAVE_HISTORIAL);

        if (historialGuardado) {
            historial = JSON.parse(historialGuardado);
        }
    } catch (error) {
        console.log("No se pudo leer el historial guardado: " + error);
    }

    // Biblioteca del cliente
    let biblioteca = [];

    try {
        const bibliotecaGuardada = localStorage.getItem(CLAVE_BIBLIOTECA);

        if (bibliotecaGuardada) {
            biblioteca = JSON.parse(bibliotecaGuardada);
        }
    } catch (error) {
        console.log("No se pudo leer la biblioteca guardada: " + error);
    }

    carrito.forEach(function (item) {
        let nombreJuego = item.titulo;

        if (item.regalo === true) {
            // Los regalos solo quedan en el historial, van a la cuenta de la otra persona
            nombreJuego = item.titulo + " (Regalo para " + item.destinatario + ")";
        } else {
            biblioteca.push({
                title: item.titulo,
                image: item.imagen,
                description: "Juego comprado en la orden " + orden
            });
        }

        historial.push({
            orden: orden,
            fecha: fecha,
            juego: nombreJuego,
            metodo: textoMetodo,
            monto: darFormatoSoles(item.precio),
            estado: "Completado"
        });
    });

    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
    localStorage.setItem(CLAVE_BIBLIOTECA, JSON.stringify(biblioteca));
}

// Muestra el comprobante final y oculta el formulario
function mostrarComprobante(orden, fecha, nombre, correo, textoMetodo, carrito) {
    const detalle = document.getElementById("detalle-boleta");
    const regalos = contarRegalos(carrito);
    const paraMi = carrito.length - regalos;

    detalle.innerHTML = `
        <div class="linea-resumen"><span>Orden</span><span>${orden}</span></div>
        <div class="linea-resumen"><span>Fecha</span><span>${fecha}</span></div>
        <div class="linea-resumen"><span>Cliente</span><span>${nombre}</span></div>
        <div class="linea-resumen"><span>Correo</span><span>${correo}</span></div>
        <div class="linea-resumen"><span>Método de pago</span><span>${textoMetodo}</span></div>
        <div class="linea-resumen"><span>Juegos para tu cuenta</span><span>${paraMi}</span></div>
        <div class="linea-resumen"><span>Juegos de regalo</span><span>${regalos}</span></div>
        <div class="linea-total"><span>PAGADO</span><span>${darFormatoSoles(totalAPagar)}</span></div>
    `;

    // Mensaje distinto si compró regalos
    const textoFinal = document.getElementById("texto-final");

    if (regalos > 0) {
        textoFinal.textContent = "Tus juegos están en tu biblioteca y los regalos fueron enviados al correo de cada persona.";
    } else {
        textoFinal.textContent = "Tus juegos ya fueron enviados a tu biblioteca.";
    }

    document.getElementById("form-compra").style.display = "none";
    document.getElementById("comprobante").classList.add("visible");
}

// Función principal que se ejecuta al enviar el formulario
function confirmarCompra(evento) {
    evento.preventDefault();

    const carrito = leerCarrito();

    if (carrito.length === 0) {
        mostrarMensaje("No puedes pagar porque tu carrito está vacío.", "error");
        return;
    }

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();

    // Validar nombre y correo
    let error = validarDatosPersonales(nombre, correo);

    // Validar los datos del método de pago elegido
    if (error === "") {
        if (metodoElegido === "Tarjeta") {
            error = validarTarjeta();
        } else if (metodoElegido === "PayPal") {
            error = validarPaypal();
        } else {
            error = validarBilletera();
        }
    }

    if (error !== "") {
        mostrarMensaje(error, "error");
        return;
    }

    // Si todo está correcto se genera la compra
    const orden = "#NX-" + (Math.floor(Math.random() * 9000) + 1000);
    const fecha = new Date().toLocaleDateString("es-PE");
    const textoMetodo = armarTextoMetodo();

    guardarCompra(orden, fecha, textoMetodo, carrito);

    // El carrito se vacía porque la compra ya se realizó
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify([]));
    document.getElementById("contador-carrito").textContent = "0";

    mostrarMensaje("Compra realizada correctamente. ¡Gracias por tu compra, " + nombre + "!", "ok");
    mostrarComprobante(orden, fecha, nombre, correo, textoMetodo, carrito);
}

/* ------------------------------------------
   8. INICIO DE LA PÁGINA
   ------------------------------------------ */
document.addEventListener("DOMContentLoaded", function () {
    mostrarResumen();

    // Eventos de los métodos de pago
    const opciones = document.querySelectorAll('input[name="metodo"]');

    opciones.forEach(function (opcion) {
        opcion.addEventListener("change", function () {
            cambiarMetodo(opcion.value);
        });
    });

    //Formato de los números de la tarjeta
    const campoTarjeta = document.getElementById("tarjeta-numero");

    campoTarjeta.addEventListener("input", function () {
        campoTarjeta.value = formatearNumeroTarjeta(campoTarjeta.value);
    });

    // Formato fecha
    const campoFecha = document.getElementById("tarjeta-fecha");

    campoFecha.addEventListener("input", function () {
        campoFecha.value = formatearFecha(campoFecha.value);
    });

    // Formato cvv
    const camposNumericos = ["tarjeta-cvv", "billetera-celular", "billetera-codigo"];

    camposNumericos.forEach(function (id) {
        const campo = document.getElementById(id);

        campo.addEventListener("input", function () {
            campo.value = dejarSoloNumeros(campo.value);
        });
    });

    // Evento del formulario
    document.getElementById("form-compra").addEventListener("submit", confirmarCompra);
});
