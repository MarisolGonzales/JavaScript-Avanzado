/* ==========================================================================
   BIBLIOTECA DE JUEGOS - NEXUS GAMING
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    cargarBiblioteca();
});

function cargarBiblioteca() {
    const contenedor = document.getElementById("contenedor-biblioteca");
    if (!contenedor) return;

    const biblioteca = JSON.parse(localStorage.getItem("nexus_biblioteca")) || [];
    contenedor.innerHTML = "";

    if (biblioteca.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-library">
                <i class="fa-solid fa-bookmark"></i>
                <h3>Tu biblioteca está vacía</h3>
                <p>Aún no posees ningún juego registrado. Adquiere títulos desde el catálogo.</p>
                <a href="catalogo.html" class="btn-primary">Ir al catálogo</a>
            </div>
        `;
        return;
    }

    biblioteca.forEach(juego => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "library-card";

        tarjeta.innerHTML = `
            <img src="${juego.imagen}" alt="${juego.titulo}">
            <div class="library-card-body">
                <h3>${juego.titulo}</h3>
                <p class="library-date">Adquirido: ${juego.fechaAdquisicion || "Reciente"}</p>
                <button class="btn-jugar" data-titulo="${juego.titulo}">
                    <i class="fa-solid fa-play"></i> Jugar
                </button>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });

    contenedor.querySelectorAll(".btn-jugar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const titulo = e.currentTarget.dataset.titulo;
            alert(`Iniciando ${titulo}... ¡Que disfrutes la partida!`);
        });
    });
}
