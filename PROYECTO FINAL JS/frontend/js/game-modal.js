/* ==========================================================================
   GAME-MODAL.JS — Modal de "Detalles del juego" compartido entre la
   portada y el catálogo. Requiere que la página incluya el markup del
   modal (#modal-detalle y sus elementos internos).
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const modalOverlay = document.getElementById("modal-detalle");
    if (!modalOverlay) return;

    const modalImg = document.getElementById("modal-img");
    const modalTag = document.getElementById("modal-tag");
    const modalTitle = document.getElementById("modal-title");
    const modalDesc = document.getElementById("modal-desc");
    const modalPrice = document.getElementById("modal-price");
    const modalBuy = document.getElementById("modal-buy");
    const modalClose = document.getElementById("modal-close");

    window.abrirDetalleJuego = function (juego) {
        if (!juego) return;

        modalImg.onerror = () => manejarErrorImagen(modalImg);
        modalImg.src = juego.image;
        modalImg.alt = juego.title;
        modalTag.textContent = juego.category;
        modalTitle.textContent = juego.title;
        modalDesc.textContent = juego.description;
        modalPrice.textContent = `S/ ${juego.price.toFixed(2)}`;
        modalBuy.onclick = () => agregarAlCarritoObjeto(juego);

        modalOverlay.classList.add("active");
    };

    function cerrarModal() {
        modalOverlay.classList.remove("active");
    }

    modalClose.addEventListener("click", cerrarModal);
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) cerrarModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cerrarModal();
    });
});
