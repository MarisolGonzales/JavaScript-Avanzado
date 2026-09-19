/* ==========================================================================
   NAV.JS — Script compartido por TODAS las páginas.
   Mantiene sincronizado el contador de items del carrito en el navbar,
   sin importar en qué vista se encuentre el usuario.
   ========================================================================== */

// Placeholder embebido (data URI) para cuando una imagen de juego no carga.
// Al ser un data URI no depende de rutas relativas, así que funciona igual
// en index.html (raíz) que en cualquier página dentro de views/.
const IMG_PLACEHOLDER = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">' +
    '<rect width="400" height="225" fill="#14141b"/>' +
    '<g fill="#3a3a46">' +
    '<path d="M160 100h80l10 20h20a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10h-10l-8-10h-84l-8 10h-10a10 10 0 0 1-10-10v-20a10 10 0 0 1 10-10h20z"/>' +
    '</g>' +
    '<text x="50%" y="78%" font-family="Arial, sans-serif" font-size="13" fill="#5c5c68" text-anchor="middle">Imagen no disponible</text>' +
    '</svg>'
);

function manejarErrorImagen(img) {
    img.onerror = null;
    img.src = IMG_PLACEHOLDER;
}

function actualizarContadorNav() {
    const carrito = JSON.parse(localStorage.getItem("nexus_carrito")) || [];
    const contador = document.getElementById("cart-count");
    if (contador) {
        contador.textContent = carrito.length;
    }
}

document.addEventListener("DOMContentLoaded", actualizarContadorNav);
