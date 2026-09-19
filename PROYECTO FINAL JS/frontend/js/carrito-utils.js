/* ==========================================================================
   CARRITO-UTILS.JS — Lógica de "agregar al carrito" compartida entre
   el catálogo (views/catalogo.html) y la portada (index.html), para no
   duplicar la misma función en dos archivos.
   ========================================================================== */

function agregarAlCarritoObjeto(juego) {
    if (!juego) return;

    let carrito = JSON.parse(localStorage.getItem("nexus_carrito")) || [];

    if (carrito.some(item => item.id === juego.id)) {
        alert("Este juego ya se encuentra en tu carrito.");
        redirigirCarrito();
        return;
    }

    carrito.push({
        id: juego.id,
        titulo: juego.title,
        precio: juego.price,
        imagen: juego.image
    });

    localStorage.setItem("nexus_carrito", JSON.stringify(carrito));
    actualizarContadorNav();

    alert(`¡${juego.title} se añadió correctamente al carrito!`);
    redirigirCarrito();
}

function redirigirCarrito() {
    // Funciona igual desde la raíz (index.html) que desde /views/
    const enViews = window.location.pathname.includes("/views/");
    window.location.href = enViews ? "carrito.html" : "views/carrito.html";
}
