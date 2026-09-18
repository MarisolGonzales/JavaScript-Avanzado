/* ==========================================================================
   NAV.JS — Script compartido por TODAS las páginas.
   Mantiene sincronizado el contador de items del carrito en el navbar,
   sin importar en qué vista se encuentre el usuario.
   ========================================================================== */

function actualizarContadorNav() {
    const carrito = JSON.parse(localStorage.getItem("nexus_carrito")) || [];
    const contador = document.getElementById("cart-count");
    if (contador) {
        contador.textContent = carrito.length;
    }
}

document.addEventListener("DOMContentLoaded", actualizarContadorNav);
