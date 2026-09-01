/* ------------------------------------------
   1. VARIABLES GENERALES
   ------------------------------------------ */
const CLAVE_CARRITO = "nexus_carrito";      // Nombre con el que se guarda el carrito
const CLAVE_AMIGOS = "nexus_amigos";        // Lista de amigos del usuario

let idJuegoEnModal = 0;                     // Juego que se está regalando
let amigoElegido = null;                    // Amigo seleccionado dentro del modal
let opcionRegalo = "amigos";                // Puede ser "amigos" o "correo"

/* ------------------------------------------
   2. FUNCIONES DE APOYO
   ------------------------------------------ */

// Formato de soles: 29.7 -> "S/ 29.70"
function darFormatoSoles(monto) {
    return "S/ " + monto.toFixed(2);
}

function leerCarrito() {
    // El try-catch evita que la página se caiga si el dato guardado está dañado
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

function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}
// Lista de amigos del usuario
function leerAmigos() {
    try {
        const datos = localStorage.getItem(CLAVE_AMIGOS);

        if (datos) {
            return JSON.parse(datos);
        }
    } catch (error) {
        console.log("No se pudo leer la lista de amigos: " + error);
    }

    return [];
}

function mostrarMensaje(texto, tipo, donde) {
    const caja = document.getElementById(donde);
    let icono = "fa-circle-check";

    if (tipo === "error") {
        icono = "fa-triangle-exclamation";
    }

    caja.className = "mensaje visible " + tipo;
    caja.innerHTML = '<i class="fa-solid ' + icono + '"></i>' + texto;
}

function ocultarMensaje(donde) {
    document.getElementById(donde).className = "mensaje";
}

function buscarJuego(id) {
    const carrito = leerCarrito();
    let encontrado = null;

    carrito.forEach(function (item) {
        if (item.id === id) {
            encontrado = item;
        }
    });

    return encontrado;
}

// [^\s@]+  -> uno o más caracteres que no sean espacios ni arroba
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esCorreoValido(correo) {
    return FORMATO_CORREO.test(correo);
}

/* ------------------------------------------
   3. CÁLCULOS DEL CARRITO
   ------------------------------------------ */

function calcularTotal(carrito) {
    let total = 0;

    carrito.forEach(function (item) {
        total += item.precio;
    });

    return total;
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
   4. ACCIONES DEL CARRITO
   ------------------------------------------ */

function eliminarJuego(id) {
    const carrito = leerCarrito();
    const nuevoCarrito = [];
    let nombreEliminado = "";

    carrito.forEach(function (item) {
        if (item.id === id) {
            nombreEliminado = item.titulo;
        } else {
            nuevoCarrito.push(item);
        }
    });

    guardarCarrito(nuevoCarrito);
    mostrarMensaje("Se eliminó " + nombreEliminado + " de tu carrito.", "error", "mensaje");
    dibujarCarrito();
}

function vaciarCarrito() {
    const carrito = leerCarrito();

    if (carrito.length === 0) {
        mostrarMensaje("Tu carrito ya está vacío.", "error", "mensaje");
        return;
    }

    const confirmar = confirm("¿Seguro que deseas vaciar tu carrito?");

    if (confirmar === true) {
        guardarCarrito([]);
        mostrarMensaje("Tu carrito quedó vacío.", "error", "mensaje");
        dibujarCarrito();
    }
}

function continuarCompra() {
    const carrito = leerCarrito();

    if (carrito.length === 0) {
        mostrarMensaje("Tu carrito está vacío. Ve al catálogo y agrega juegos.", "error", "mensaje");
        return;
    }

    window.location.href = "compra.html";
}

/* ------------------------------------------
   5. MODAL DE REGALO
   ------------------------------------------ */

// Abre el modal para el juego elegido
function abrirModal(id) {
    const juego = buscarJuego(id);

    idJuegoEnModal = id;
    amigoElegido = null;

    document.getElementById("modal-juego").innerHTML = "Vas a regalar <strong>" + juego.titulo + "</strong>";
    document.getElementById("regalo-nombre").value = "";
    document.getElementById("regalo-correo").value = "";

    if (juego.regalo === true) {
        document.getElementById("btn-quitar-regalo").style.display = "flex";
    } else {
        document.getElementById("btn-quitar-regalo").style.display = "none";
    }

    ocultarMensaje("mensaje-modal");
    cambiarOpcion("amigos");
    dibujarAmigos();

    document.getElementById("modal-regalo").classList.add("visible");
}

function cerrarModal() {
    document.getElementById("modal-regalo").classList.remove("visible");
}

function cambiarOpcion(opcion) {
    opcionRegalo = opcion;

    const botonAmigos = document.getElementById("opcion-amigos");
    const botonCorreo = document.getElementById("opcion-correo");
    const panelAmigos = document.getElementById("panel-amigos");
    const panelCorreo = document.getElementById("panel-correo");

    if (opcion === "amigos") {
        botonAmigos.classList.add("activa");
        botonCorreo.classList.remove("activa");
        panelAmigos.classList.add("visible");
        panelCorreo.classList.remove("visible");
    } else {
        botonCorreo.classList.add("activa");
        botonAmigos.classList.remove("activa");
        panelCorreo.classList.add("visible");
        panelAmigos.classList.remove("visible");
    }

    ocultarMensaje("mensaje-modal");
}

// Dibuja la lista de amigos dentro del modal
function dibujarAmigos() {
    const contenedor = document.getElementById("lista-amigos");
    const amigos = leerAmigos();

    contenedor.innerHTML = "";

    // Si el usuario todavía no tiene amigos se le ofrece enviarlo por correo
    if (amigos.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-amigos">
                <i class="fa-solid fa-user-slash"></i>
                <p>Todavía no tienes amigos agregados en tu cuenta.<br>
                   Puedes enviarle el juego a cualquier persona usando su correo.</p>
                <button type="button" class="btn-secundario" id="btn-ir-correo">
                    <i class="fa-solid fa-envelope"></i> ENVIARLO POR CORREO
                </button>
            </div>
        `;

        document.getElementById("btn-ir-correo").addEventListener("click", function () {
            cambiarOpcion("correo");
        });

        return;
    }

    amigos.forEach(function (amigo) {
        const tarjeta = document.createElement("div");
        tarjeta.className = "amigo";

        // La inicial del nombre se usa como avatar
        const inicial = amigo.nombre.charAt(0).toUpperCase();

        tarjeta.innerHTML = `
            <div class="amigo-inicial">${inicial}</div>
            <div class="amigo-datos">
                <h4>${amigo.nombre}</h4>
                <span>${amigo.correo}</span>
            </div>
            <i class="fa-solid fa-circle-check check"></i>
        `;

        // Al hacer clic se marca ese amigo y se desmarcan los demás
        tarjeta.addEventListener("click", function () {
            const todos = document.querySelectorAll(".amigo");

            todos.forEach(function (uno) {
                uno.classList.remove("seleccionado");
            });

            tarjeta.classList.add("seleccionado");
            amigoElegido = amigo;
            ocultarMensaje("mensaje-modal");
        });

        contenedor.appendChild(tarjeta);
    });
}

// Guarda el regalo con los datos elegidos en el modal
function confirmarRegalo() {
    let destinatario = "";
    let correoDestino = "";

    if (opcionRegalo === "amigos") {
        if (amigoElegido === null) {
            mostrarMensaje("Elige a un amigo de la lista o envíaselo por correo.", "error", "mensaje-modal");
            return;
        }

        destinatario = amigoElegido.nombre;
        correoDestino = amigoElegido.correo;

    } else {
        destinatario = document.getElementById("regalo-nombre").value.trim();
        correoDestino = document.getElementById("regalo-correo").value.trim();

        if (destinatario.length < 3) {
            mostrarMensaje("Escribe el nombre de la persona (mínimo 3 letras).", "error", "mensaje-modal");
            return;
        }

        if (esCorreoValido(correoDestino) === false) {
            mostrarMensaje("El correo no es válido. Ejemplo: luis@gmail.com", "error", "mensaje-modal");
            return;
        }
    }

    // Se guardan los datos del regalo en el juego
    const carrito = leerCarrito();

    carrito.forEach(function (item) {
        if (item.id === idJuegoEnModal) {
            item.regalo = true;
            item.destinatario = destinatario;
            item.correoDestino = correoDestino;
        }
    });

    guardarCarrito(carrito);
    cerrarModal();
    mostrarMensaje("El juego se enviará como regalo a " + destinatario + ".", "ok", "mensaje");
    dibujarCarrito();
}

// Quita el regalo y el juego vuelve a ser para la cuenta del usuario
function quitarRegalo() {
    const carrito = leerCarrito();
    let titulo = "";

    carrito.forEach(function (item) {
        if (item.id === idJuegoEnModal) {
            item.regalo = false;
            item.destinatario = "";
            item.correoDestino = "";
            titulo = item.titulo;
        }
    });

    guardarCarrito(carrito);
    cerrarModal();
    mostrarMensaje(titulo + " ya no se enviará como regalo.", "error", "mensaje");
    dibujarCarrito();
}

/* ------------------------------------------
   6. DIBUJAR LA PÁGINA
   ------------------------------------------ */

// Dibuja los juegos del carrito y actualiza el resumen
function dibujarCarrito() {
    const contenedor = document.getElementById("lista-carrito");
    const carrito = leerCarrito();

    contenedor.innerHTML = "";

    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div class="carrito-vacio">
                <i class="fa-solid fa-cart-flatbed"></i>
                <p>Tu carrito está vacío. Ve al catálogo para agregar juegos.</p>
                <a href="catalogo.html" class="btn-primario">
                    <i class="fa-solid fa-gamepad"></i> IR AL CATÁLOGO
                </a>
            </div>
        `;
    } else {
        carrito.forEach(function (item) {
            const fila = document.createElement("div");
            fila.className = "item-carrito";

            // Lo que se muestra cambia según si el juego es un regalo o no
            let claseBotonRegalo = "btn-regalo";
            let claseDatosRegalo = "datos-regalo";
            let textoEstado = "Licencia digital para tu cuenta";
            let datosRegalo = "";

            if (item.regalo === true) {
                claseBotonRegalo = "btn-regalo activo";
                claseDatosRegalo = "datos-regalo visible";
                textoEstado = '<span class="etiqueta-regalo"><i class="fa-solid fa-gift"></i> REGALO</span>';
                datosRegalo = `
                    <i class="fa-solid fa-paper-plane"></i>
                    Para <strong>${item.destinatario}</strong> &middot; ${item.correoDestino}
                    <button class="btn-cambiar">CAMBIAR</button>
                `;
            }

            fila.innerHTML = `
                <div class="item-fila">
                    <img src="${item.imagen}" alt="${item.titulo}">
                    <div class="item-info">
                        <h4>${item.titulo}</h4>
                        <span>${textoEstado}</span>
                    </div>
                    <div class="item-precio">${darFormatoSoles(item.precio)}</div>
                    <button class="${claseBotonRegalo}" title="Enviar como regalo">
                        <i class="fa-solid fa-gift"></i>
                    </button>
                    <button class="btn-eliminar" title="Eliminar del carrito">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>

                <div class="${claseDatosRegalo}">${datosRegalo}</div>
            `;

            // El botón de regalo abre el modal
            fila.querySelector(".btn-regalo").addEventListener("click", function () {
                abrirModal(item.id);
            });

            // El botón eliminar quita el juego
            fila.querySelector(".btn-eliminar").addEventListener("click", function () {
                eliminarJuego(item.id);
            });

            // El botón cambiar solo existe cuando el juego ya es un regalo
            if (item.regalo === true) {
                fila.querySelector(".btn-cambiar").addEventListener("click", function () {
                    abrirModal(item.id);
                });
            }

            contenedor.appendChild(fila);
        });
    }

    actualizarResumen(carrito);
}

// Actualiza los precios del resumen y el contador del navbar
function actualizarResumen(carrito) {
    const total = calcularTotal(carrito);

    document.getElementById("res-cantidad").textContent = carrito.length;
    document.getElementById("res-regalos").textContent = contarRegalos(carrito);
    document.getElementById("res-total").textContent = darFormatoSoles(total);
    document.getElementById("contador-carrito").textContent = carrito.length;
}

/* ------------------------------------------
   7. INICIO DE LA PÁGINA
   ------------------------------------------ */
document.addEventListener("DOMContentLoaded", function () {
    dibujarCarrito();

    // Botones del resumen
    document.getElementById("btn-vaciar").addEventListener("click", vaciarCarrito);
    document.getElementById("btn-comprar").addEventListener("click", continuarCompra);

    // Botones del modal
    document.getElementById("btn-cerrar-modal").addEventListener("click", cerrarModal);
    document.getElementById("btn-confirmar-regalo").addEventListener("click", confirmarRegalo);
    document.getElementById("btn-quitar-regalo").addEventListener("click", quitarRegalo);

    document.getElementById("opcion-amigos").addEventListener("click", function () {
        cambiarOpcion("amigos");
    });

    document.getElementById("opcion-correo").addEventListener("click", function () {
        cambiarOpcion("correo");
    });

    // Cerrar el modal al hacer clic fuera de la ventana
    document.getElementById("modal-regalo").addEventListener("click", function (evento) {
        if (evento.target.id === "modal-regalo") {
            cerrarModal();
        }
    });
});
