document.addEventListener("DOMContentLoaded", () => {
    renderizarFavoritos();
    document.addEventListener("nexus:favoritos-actualizados", renderizarFavoritos);
});

function renderizarFavoritos() {
    const contenedor = document.getElementById("favorite-grid");
    if (!contenedor) return;

    const favoritos = new Set(obtenerFavoritosIds());
    const juegos = CATALOGO_JUEGOS.filter(juego => favoritos.has(juego.id));

    if (juegos.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-heart"></i>
                <h2>Aún no guardas favoritos</h2>
                <p>Abre los detalles de un juego y guárdalo para encontrarlo aquí.</p>
                <a href="catalogo.html" class="btn-primary">Explorar catálogo</a>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = juegos.map(juego => `
        <article class="favorite-card">
            <img src="${IMG_BASE + juego.image}" alt="${juego.title}" onerror="manejarErrorImagen(this)">
            <div class="favorite-card-body">
                <div class="game-top"><span class="tag">${juego.category}</span><span class="price">S/ ${juego.price.toFixed(2)}</span></div>
                <h2>${juego.title}</h2>
                <p>${juego.description}</p>
                <div class="game-actions">
                    <button class="btn-secondary" type="button" data-detalle="${juego.id}">Detalles</button>
                    <button class="btn-favorite" type="button" data-quitar="${juego.id}" aria-label="Quitar ${juego.title} de favoritos"><i class="fa-solid fa-heart"></i> Quitar</button>
                </div>
            </div>
        </article>
    `).join("");

    contenedor.querySelectorAll("[data-detalle]").forEach(boton => {
        boton.addEventListener("click", () => {
            const juego = CATALOGO_JUEGOS.find(item => item.id === Number(boton.dataset.detalle));
            abrirDetalleJuego({ ...juego, image: IMG_BASE + juego.image });
        });
    });
    contenedor.querySelectorAll("[data-quitar]").forEach(boton => {
        boton.addEventListener("click", () => {
            const juego = CATALOGO_JUEGOS.find(item => item.id === Number(boton.dataset.quitar));
            alternarFavorito(juego);
        });
    });
}