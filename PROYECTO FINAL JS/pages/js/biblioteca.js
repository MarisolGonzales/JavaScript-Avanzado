/* ==========================================================================
     MÓDULO DE BIBLIOTECA DE JUEGOS
   ========================================================================== */

class JuegoBiblioteca {
    constructor(title, image, description) {
        this.title = title;
        this.image = image;
        this.description = description;
    }

    // Método funcional de clase para estructurar el HTML individual
    renderizar() {
        return `
            <div class="game-card-lib">
                <img src="${this.image ?? '../../JUEGOS/default.jpg'}" alt="${this.title}">
                <div class="game-card-body">
                    <h3>${this.title}</h3>
                    <p>${this.description ?? 'Juego añadido a tu cuenta.'}</p>
                    <button class="btn-instalar" data-title="${this.title}">⬇ Instalar</button>
                </div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const bibliotecaContainer = document.getElementById('grid-biblioteca');
    if (!bibliotecaContainer) return;

    // Obtener datos del LocalStorage o usar datos predeterminados 
    const juegosCrudos = JSON.parse(localStorage.getItem('nexus_mis_juegos')) || [
        { title: "The Witcher 3: Wild Hunt", image: "../../JUEGOS/witcher3-banner.jpg", description: "Rol de mundo abierto épico." },
        { title: "Grand Theft Auto V", image: "../../JUEGOS/gtav-cover.png", description: "Acción en mundo abierto." }
    ];

    bibliotecaContainer.innerHTML = '';

    if (juegosCrudos.length === 0) {
        bibliotecaContainer.innerHTML = `
            <div class="empty-library">
                <h3>Tu biblioteca está vacía</h3>
                <p>Aún no has agregado ningún juego.</p>
                <a href="catalogo.html" class="btn-explorar">Ir al Catálogo</a>
            </div>
        `;
    } else {
        // Uso del método funcional de arreglos `.map()` para transformar datos en componentes HTML 
        const juegosComprados = juegosCrudos.map(j => new JuegoBiblioteca(j.title, j.image, j.description));
        bibliotecaContainer.innerHTML = juegosComprados.map(juego => juego.renderizar()).join('');

        // Asignación de eventos a elementos creados dinámicamente
        document.querySelectorAll('.btn-instalar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tituloJuego = e.target.getAttribute('data-title');
                alert(`Iniciando descarga de ${tituloJuego}...`);
            });
        });
    }
});