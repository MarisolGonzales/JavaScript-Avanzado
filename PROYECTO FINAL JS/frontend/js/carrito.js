/* ==========================================================================
   GESTIÓN DEL CARRITO DE COMPRAS - NEXUS GAMING
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    cargarCarrito();
    inicializarModalPago();
});

function cargarCarrito() {
    const contenedorCarrito = document.getElementById("lista-carrito");
    const subtotalSpan = document.getElementById("cart-subtotal");
    const totalSpan = document.getElementById("cart-total");

    if (!contenedorCarrito) return;

    let carrito = JSON.parse(localStorage.getItem("nexus_carrito")) || [];

    if (carrito.length === 0) {
        contenedorCarrito.innerHTML = `
            <div class="empty-cart">
                <i class="fa-solid fa-cart-shopping"></i>
                <h3>Tu carrito está vacío</h3>
                <p>Explora nuestro catálogo y añade tus juegos favoritos.</p>
                <a href="catalogo.html" class="btn-primary">Ir al catálogo</a>
            </div>
        `;
        if (subtotalSpan) subtotalSpan.textContent = "S/ 0.00";
        if (totalSpan) totalSpan.textContent = "S/ 0.00";
        return;
    }

    contenedorCarrito.innerHTML = "";
    let subtotalGeneral = 0;

    carrito.forEach((item, index) => {
        subtotalGeneral += item.precio;

        const fila = document.createElement("div");
        fila.className = "cart-item";

        fila.innerHTML = `
            <img src="${item.imagen}" alt="${item.titulo}" onerror="manejarErrorImagen(this)">
            <div class="cart-item-info">
                <h4>${item.titulo}</h4>
                <span class="price">S/ ${item.precio.toFixed(2)}</span>
            </div>
            <button class="btn-danger btn-eliminar-item" data-index="${index}">
                <i class="fa-solid fa-trash"></i> Quitar
            </button>
        `;
        contenedorCarrito.appendChild(fila);
    });

    if (subtotalSpan) subtotalSpan.textContent = `S/ ${subtotalGeneral.toFixed(2)}`;
    if (totalSpan) totalSpan.textContent = `S/ ${subtotalGeneral.toFixed(2)}`;

    contenedorCarrito.querySelectorAll(".btn-eliminar-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            carrito.splice(index, 1);
            localStorage.setItem("nexus_carrito", JSON.stringify(carrito));
            cargarCarrito();
            actualizarContadorNav();
        });
    });
}

/* ==========================================================================
   MODAL DE MÉTODOS DE PAGO
   --------------------------------------------------------------------------
   Al hacer clic en "Finalizar compra" ya no se dispara un alert(): se abre
   este modal con pestañas para Tarjeta, Yape y Plin. Cada método valida sus
   propios campos y, al confirmar, ejecuta la misma lógica de compra
   (mover los juegos a la biblioteca y registrar el historial).
   ========================================================================== */
function inicializarModalPago() {
    const btnFinalizar = document.getElementById("btn-finalizar-compra");
    const modalPago = document.getElementById("modal-pago");
    const btnCerrarPago = document.getElementById("pago-close");
    const tabs = document.querySelectorAll(".payment-tab");
    const paneles = document.querySelectorAll(".payment-panel");
    const pagoTotalSpan = document.getElementById("pago-total");
    const pasoMetodo = document.getElementById("pago-paso-metodo");
    const pasoExito = document.getElementById("pago-paso-exito");

    if (!btnFinalizar || !modalPago) return;

    btnFinalizar.addEventListener("click", () => {
        const carrito = JSON.parse(localStorage.getItem("nexus_carrito")) || [];
        if (carrito.length === 0) {
            alert("No hay productos en el carrito para comprar.");
            return;
        }

        const total = carrito.reduce((suma, item) => suma + item.precio, 0);
        if (pagoTotalSpan) pagoTotalSpan.textContent = `S/ ${total.toFixed(2)}`;

        pasoMetodo.style.display = "block";
        pasoExito.style.display = "none";
        modalPago.classList.add("active");
    });

    btnCerrarPago.addEventListener("click", () => modalPago.classList.remove("active"));
    modalPago.addEventListener("click", (e) => {
        if (e.target === modalPago) modalPago.classList.remove("active");
    });

    // Cambiar entre pestañas de método de pago
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            paneles.forEach(p => p.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(`panel-${tab.dataset.metodo}`).classList.add("active");
        });
    });

    // Formateo simple del número de tarjeta en grupos de 4
    const inputTarjeta = document.getElementById("tarjeta-numero");
    if (inputTarjeta) {
        inputTarjeta.addEventListener("input", (e) => {
            let valor = e.target.value.replace(/\D/g, "").slice(0, 16);
            e.target.value = valor.replace(/(.{4})/g, "$1 ").trim();
        });
    }

    const inputExp = document.getElementById("tarjeta-exp");
    if (inputExp) {
        inputExp.addEventListener("input", (e) => {
            let valor = e.target.value.replace(/\D/g, "").slice(0, 4);
            if (valor.length > 2) valor = `${valor.slice(0, 2)}/${valor.slice(2)}`;
            e.target.value = valor;
        });
    }

    // Cada panel valida sus propios campos antes de confirmar el pago
    document.getElementById("panel-tarjeta").addEventListener("submit", (e) => {
        e.preventDefault();
        const numero = inputTarjeta.value.replace(/\s/g, "");
        const exp = inputExp.value;
        const cvv = document.getElementById("tarjeta-cvv").value;

        if (numero.length < 16 || !/^\d{2}\/\d{2}$/.test(exp) || cvv.length < 3) {
            alert("Revisa los datos de tu tarjeta: número, vencimiento (MM/AA) y CVV.");
            return;
        }
        confirmarPago();
    });

    document.getElementById("panel-yape").addEventListener("submit", (e) => {
        e.preventDefault();
        const numero = document.getElementById("yape-numero").value;
        if (!/^9\d{8}$/.test(numero)) {
            alert("Ingresa un número de celular válido asociado a Yape (9 dígitos).");
            return;
        }
        confirmarPago();
    });

    document.getElementById("panel-plin").addEventListener("submit", (e) => {
        e.preventDefault();
        const numero = document.getElementById("plin-numero").value;
        if (!/^9\d{8}$/.test(numero)) {
            alert("Ingresa un número de celular válido asociado a Plin (9 dígitos).");
            return;
        }
        confirmarPago();
    });

    function confirmarPago() {
        const tabActiva = document.querySelector(".payment-tab.active");
        const metodo = tabActiva ? tabActiva.dataset.metodo : "tarjeta";

        finalizarCompra(metodo);
        pasoMetodo.style.display = "none";
        pasoExito.style.display = "block";
    }
}

const NOMBRES_METODO_PAGO = {
    tarjeta: "Tarjeta de crédito/débito",
    yape: "Yape",
    plin: "Plin"
};

function finalizarCompra(metodo) {
    let carrito = JSON.parse(localStorage.getItem("nexus_carrito")) || [];
    if (carrito.length === 0) return;

    let biblioteca = JSON.parse(localStorage.getItem("nexus_biblioteca")) || [];
    let total = 0;

    carrito.forEach(juegoCarrito => {
        total += juegoCarrito.precio;
        const yaExiste = biblioteca.some(j => j.id === juegoCarrito.id);
        if (!yaExiste) {
            biblioteca.push({
                id: juegoCarrito.id,
                titulo: juegoCarrito.titulo,
                imagen: juegoCarrito.imagen,
                fechaAdquisicion: new Date().toLocaleDateString()
            });
        }
    });

    // Registrar la compra en el historial como un recibo/boleta completo
    const ahora = new Date();
    let historial = JSON.parse(localStorage.getItem("nexus_historial")) || [];
    historial.unshift({
        boleta: `NX-${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(historial.length + 1).padStart(4, "0")}`,
        fecha: ahora.toLocaleDateString(),
        hora: ahora.toLocaleTimeString(),
        metodoPago: NOMBRES_METODO_PAGO[metodo] || "Tarjeta de crédito/débito",
        items: carrito.map(j => ({ titulo: j.titulo, precio: j.precio })),
        subtotal: total,
        total: total
    });
    localStorage.setItem("nexus_historial", JSON.stringify(historial));

    localStorage.setItem("nexus_biblioteca", JSON.stringify(biblioteca));
    localStorage.removeItem("nexus_carrito");

    cargarCarrito();
    actualizarContadorNav();
}
