/* ==========================================================================
   CATÁLOGO DE JUEGOS - NEXUS GAMING
   ========================================================================== */

const juegos = [
    {
        id: 1,
        title: "The Witcher 3: Wild Hunt",
        price: 59.90,
        category: "RPG",
        image: "../../JUEGOS/witcher3.jpg",
        description: "Una aventura épica de mundo abierto impregnada de magia y decisiones con consecuencias."
    },
    {
        id: 2,
        title: "Grand Theft Auto V",
        price: 79.90,
        category: "Acción",
        image: "../../JUEGOS/gtav.png",
        description: "Explora el vasto mundo abierto de Los Santos y Blaine County en una experiencia inolvidable."
    },
    {
        id: 3,
        title: "Minecraft Ultra Edition",
        price: 69.90,
        category: "Aventura",
        image: "../../JUEGOS/minecraft.jpg",
        description: "Construye, sobrevive y da rienda suelta a tu imaginación en universos infinitos."
    },
    {
        id: 4,
        title: "Dota 2",
        price: 49.90,
        category: "Estrategia",
        image: "../../JUEGOS/Dota_2.jpg",
        description: "Combates tácticos multijugador en equipo donde la estrategia define la victoria."
    },
    {
        id: 5,
        title: "Left 4 Dead 2",
        price: 39.90,
        category: "Acción",
        image: "../../JUEGOS/Left_4_Dead_2.jpg",
        description: "Acción cooperativa extrema para sobrevivir a implacables hordas de infectados."
    }
];

// Referencias del DOM
const catalogRows = document.querySelector(".catalog-rows") || document.getElementById("catalog-grid");
const buscador = document.getElementById("search-input");
const botonCarritoCatalogo = document.getElementById("btn-carrito-catalogo");

/* ==========================================
    RENDERIZADO DEL CATÁLOGO (ADAPTADO A TU CSS)
   ========================================== */
function mostrarCatalogo(lista = juegos) {
    if (!catalogRows) return;

    // Si tu estructura usa contenedores por filas o un grid general, lo adaptamos dinámicamente
    catalogRows.innerHTML = "";

    if (lista.length === 0) {
        catalogRows.innerHTML = `
            <div class="empty-state">
                <h3>No se encontraron juegos que coincidan con tu búsqueda.</h3>
            </div>
        `;
        return;
    }

    // Creamos una sección principal con el riel/grilla compatible con tu CSS
    const rowContainer = document.createElement("div");
    rowContainer.innerHTML = <h2 class="catalog-row-title">Todos los Juegos Disponibles</h2>;
    
    const rail = document.createElement("div");
    rail.className = "games-rail"; // Utiliza tu clase exacta de CSS

    lista.forEach(juego => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "game-card"; // Utiliza tu clase exacta de CSS

        // Estructura interna exacta compatible con tus clases .game-info, .badge, .actions, etc.
        tarjeta.innerHTML = `
            <img src="${juego.image}" alt="${juego.title}">
            <div class="game-info">
                <div class="game-top">
                    <span class="badge">${juego.category}</span>
                    <span style="color: #4ade80; font-weight: bold; font-size: 0.85rem;">S/ ${juego.price.toFixed(2)}</span>
                </div>
                <h3>${juego.title}</h3>
                <p>${juego.description}</p>
                <div class="actions">
                    <button class="btn-secondary" onclick="verDetalle(${juego.id})">Detalles</button>
                    <button class="btn-buy" onclick="agregarAlCarrito(${juego.id})">Comprar</button>
                </div>
            </div>
        `;

        rail.appendChild(tarjeta);
    });

    rowContainer.appendChild(rail);
    catalogRows.appendChild(rowContainer);
}

/* ==========================================
   GESTIÓN DEL CARRITO Y SEGURIDAD DE SESIÓN
   ========================================== */
function agregarAlCarrito(id) {
    // 🔒 Validación estricta: Si el usuario no ha iniciado sesión, se le bloquea y redirige al login
    const usuarioSesion = localStorage.getItem('nexus_usuario_activo');
    if (!usuarioSesion) {
        alert('Acceso restringido: Debes iniciar sesión para poder comprar o agregar juegos al carrito.');
        window.location.href = 'login.html';
        return;
    }

    const juego = juegos.find(j => j.id === id);
    if (!juego) {
        console.error("Juego no encontrado en el catálogo");
        return;
    }

    let carrito = JSON.parse(localStorage.getItem("nexus_carrito")) || [];

    // Verificar si el juego ya está agregado previamente
    if (carrito.some(item => item.id === juego.id)) {
        alert('Este juego ya se encuentra registrado en tu carrito.');
        window.location.href = "carrito.html";
        return;
    }

    carrito.push({
        id: juego.id,
        titulo: juego.title,
        precio: juego.price,
        imagen: juego.image,
        regalo: false,
        destinatario: "",
        correoDestino: ""
    });

    localStorage.setItem("nexus_carrito", JSON.stringify(carrito));
    actualizarContadorCarrito();

    alert(¡${juego.title} se añadió correctamente al carrito!);
    window.location.href = "carrito.html";
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem("nexus_carrito")) || [];
    const contador = document.getElementById("cart-count");

    if (contador) {
        contador.textContent = carrito.length;
    }
}

/* ==========================================
   INTERACCIÓN DE DETALLES Y BUSCADOR
   ========================================== */
function verDetalle(id) {
    const juego = juegos.find(j => j.id === id);
    if (!juego) return;

    alert(
        📌 ${juego.title}\n\n +
        • Categoría: ${juego.category}\n +
        • Precio Oficial: S/ ${juego.price.toFixed(2)}\n\n +
        Descripción: ${juego.description}
    );
}

// Búsqueda en tiempo real conectada al input del catálogo
if (buscador) {
    buscador.addEventListener("input", function () {
        const texto = this.value.toLowerCase().trim();

        const resultados = juegos.filter(juego =>
            juego.title.toLowerCase().includes(texto) ||
            juego.category.toLowerCase().includes(texto) ||
            juego.description.toLowerCase().includes(texto)
        );

        mostrarCatalogo(resultados);
    });
}

// Botón global del carrito en la barra de navegación superior
if (botonCarritoCatalogo) {
    botonCarritoCatalogo.addEventListener("click", function () {
        window.location.href = "carrito.html";
    });
}

/* ==========================================
   INICIALIZACIÓN DE LA VISTA
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    mostrarCatalogo();
    actualizarContadorCarrito();
});
