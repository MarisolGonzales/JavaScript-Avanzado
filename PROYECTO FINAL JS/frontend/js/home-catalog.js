/* ==========================================================================
   HOME-CATALOG.JS — Vitrina de juegos en la portada (index.html)
   Reutiliza los mismos datos y la misma tarjeta visual que el catálogo,
   estilo "destacados" de una tienda digital.
   ========================================================================== */

const juegosHome = CATALOGO_JUEGOS.map(j => ({ ...j, image: IMG_BASE + j.image }));

document.addEventListener("DOMContentLoaded", () => {
    const rail = document.getElementById("home-games-rail");
    if (!rail) return;

    rail.innerHTML = juegosHome.map(juego => `
        <div class="game-card">
            <img class="game-thumb" src="${juego.image}" alt="${juego.title}" onerror="manejarErrorImagen(this)">
            <div class="game-info">
                <div class="game-top">
                    <span class="tag">${juego.category}</span>
                    <span class="price">S/ ${juego.price.toFixed(2)}</span>
                </div>
                <h3>${juego.title}</h3>
                <p class="game-desc">${juego.description}</p>
                <div class="game-actions">
                    <button class="btn-secondary" onclick="verDetalleHome(${juego.id})">Detalles</button>
                    <button class="btn-buy" onclick="comprarDesdeHome(${juego.id})">Comprar</button>
                </div>
            </div>
        </div>
    `).join("");
});

function verDetalleHome(id) {
    const juego = juegosHome.find(j => j.id === id);
    abrirDetalleJuego(juego);
}

function comprarDesdeHome(id) {
    const juego = juegosHome.find(j => j.id === id);
    agregarAlCarritoObjeto(juego);
}
