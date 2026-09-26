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
    const modalDeveloper = document.getElementById("modal-developer");
    const modalYear = document.getElementById("modal-year");
    const modalPlatforms = document.getElementById("modal-platforms");
    const modalMode = document.getElementById("modal-mode");
    const modalPrice = document.getElementById("modal-price");
    const modalBuy = document.getElementById("modal-buy");
    const modalFavorite = document.getElementById("modal-favorite");
    const modalClose = document.getElementById("modal-close");

    window.abrirDetalleJuego = function (juego) {
        if (!juego) return;

        modalImg.onerror = () => manejarErrorImagen(modalImg);
        modalImg.src = juego.image;
        modalImg.alt = juego.title;
        modalTag.textContent = juego.category;
        modalTitle.textContent = juego.title;
        modalDesc.textContent = juego.description;
        if (modalDeveloper) modalDeveloper.textContent = juego.developer || "No especificado";
        if (modalYear) modalYear.textContent = juego.year || "No especificado";
        if (modalPlatforms) modalPlatforms.textContent = juego.platforms || "No especificadas";
        if (modalMode) modalMode.textContent = juego.mode || "No especificado";
        modalPrice.textContent = `S/ ${juego.price.toFixed(2)}`;
        modalBuy.onclick = () => agregarAlCarritoObjeto(juego);
        if (modalFavorite) actualizarBotonFavorito(juego);
        if (typeof registrarDetalleVisto === "function") registrarDetalleVisto(juego.id);

        modalOverlay.classList.add("active");
    };

    function actualizarBotonFavorito(juego) {
        const favorito = esJuegoFavorito(juego.id);
        modalFavorite.setAttribute("aria-pressed", String(favorito));
        modalFavorite.innerHTML = favorito
            ? '<i class="fa-solid fa-heart"></i> Quitar de favoritos'
            : '<i class="fa-regular fa-heart"></i> Guardar en favoritos';
        modalFavorite.onclick = () => {
            alternarFavorito(juego);
            actualizarBotonFavorito(juego);
        };
    }

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
