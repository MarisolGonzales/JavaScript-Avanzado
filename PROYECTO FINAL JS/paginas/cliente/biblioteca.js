/* ==========================================
   LÓGICA DE LA BIBLIOTECA DE JUEGOS
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const bibliotecaContainer = document.getElementById('grid-biblioteca');
    if (!bibliotecaContainer) return;

    // Obtener juegos desde localStorage o usar los de prueba por defecto
    let juegosComprados = JSON.parse(localStorage.getItem('nexus_mis_juegos')) || [
        {
            title: "The Witcher 3: Wild Hunt",
            image: "../../juegos/witcher3-banner.jpg",
            description: "Rol de mundo abierto épico."
        },
        {
            title: "Grand Theft Auto V",
            image: "../../juegos/gtav-cover.png",
            description: "Acción en mundo abierto en Los Santos."
        },
        {
            title: "Minecraft Ultra Edition",
            image: "../../juegos/minecraft.jpg",
            description: "Construye y sobrevive en mundos infinitos."
        }
    ];

    bibliotecaContainer.innerHTML = '';

    if (juegosComprados.length === 0) {
        bibliotecaContainer.innerHTML = `
            <div class="empty-library">
                <h3>Tu biblioteca está vacía</h3>
                <p>Aún no has agregado ningún juego. Explora el catálogo para conseguir ofertas increíbles.</p>
                <a href="../catalogo/catalogo.html" class="btn-explorar">Ir al Catálogo</a>
            </div>
        `;
    } else {
        juegosComprados.forEach(juego => {
            const card = document.createElement('div');
            card.className = 'game-card-lib';

            card.innerHTML = `
                <img src="${juego.image}" alt="${juego.title}">
                <div class="game-card-body">
                    <h3>${juego.title}</h3>
                    <p>${juego.description || 'Juego añadido a tu cuenta.'}</p>
                    <button class="btn-instalar">⬇ Instalar</button>
                </div>
            `;

            // Evento para el botón de instalar
            card.querySelector('.btn-instalar').addEventListener('click', () => {
                alert(`Iniciando descarga de ${juego.title}...`);
            });

            bibliotecaContainer.appendChild(card);
        });
    }
});