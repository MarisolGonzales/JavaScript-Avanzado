/* ==========================================================================
   CATÁLOGO DE JUEGOS - NEXUS GAMING
   ========================================================================== */

const juegos = [
    {
        id: 1,
        title: "The Witcher 3: Wild Hunt",
        price: 59.90,
        category: "RPG",
        image: "../assets/img/witcher3.jpg",
        description: "Una aventura épica de mundo abierto impregnada de magia y decisiones con consecuencias."
    },
    {
        id: 2,
        title: "Grand Theft Auto V",
        price: 79.90,
        category: "Acción",
        image: "../assets/img/gtav.png",
        description: "Explora el vasto mundo abierto de Los Santos y Blaine County en una experiencia inolvidable."
    },
    {
        id: 3,
        title: "Minecraft Ultra Edition",
        price: 69.90,
        category: "Aventura",
        image: "../assets/img/minecraft.jpg",
        description: "Construye, sobrevive y da rienda suelta a tu imaginación en universos infinitos."
    },
    {
        id: 4,
        title: "Dota 2",
        price: 49.90,
        category: "Estrategia",
        image: "../assets/img/Dota_2.jpg",
        description: "Combates tácticos multijugador en equipo donde la estrategia define la victoria."
    },
    {
        id: 5,
        title: "Left 4 Dead 2",
        price: 39.90,
        category: "Acción",
        image: "../assets/img/Left_4_Dead_2.jpg",
        description: "Acción cooperativa extrema para sobrevivir a implacables hordas de infectados."
    }
];

// Referencias del DOM
const catalogRows = document.getElementById("catalog-grid");
const buscador = document.getElementById("search-input");
const contenedorFiltros = document.getElementById("category-filters");

let categoriaActiva = "Todos";
let textoBusqueda = "";

/* ==========================================
   FILTROS DE CATEGORÍA
   ========================================== */
function renderizarFiltros() {
    if (!contenedorFiltros) return;

    const categorias = ["Todos", ...new Set(juegos.map(j => j.category))];

    contenedorFiltros.innerHTML = categorias.map(cat => `
        <button class="filter-chip ${cat === categoriaActiva ? 'active' : ''}" data-categoria="${cat}">
            ${cat}
        </button>
    `).join("");

    contenedorFiltros.querySelectorAll(".filter-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            categoriaActiva = chip.dataset.categoria;
            renderizarFiltros();
            aplicarFiltros();
        });
    });
}

/* ==========================================
   RENDERIZADO DEL CATÁLOGO
   ========================================== */
function mostrarCatalogo(lista) {
    if (!catalogRows) return;

    catalogRows.innerHTML = "";

    if (lista.length === 0) {
        catalogRows.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <h3>No se encontraron juegos</h3>
                <p>Prueba con otro término de búsqueda o categoría.</p>
            </div>
        `;
        return;
    }

    const rowContainer = document.createElement("div");
    rowContainer.innerHTML = `<h2 class="catalog-row-title">Todos los juegos disponibles</h2>`;

    const rail = document.createElement("div");
    rail.className = "games-rail";

    lista.forEach(juego => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "game-card";

        tarjeta.innerHTML = `
            <img class="game-thumb" src="${juego.image}" alt="${juego.title}">
            <div class="game-info">
                <div class="game-top">
                    <span class="tag">${juego.category}</span>
                    <span class="price">S/ ${juego.price.toFixed(2)}</span>
                </div>
                <h3>${juego.title}</h3>
                <p class="game-desc">${juego.description}</p>
                <div class="game-actions">
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
   HASH TABLE (Map) PARA INDEXAR LA BÚSQUEDA
   --------------------------------------------
   En vez de recorrer el arreglo completo de juegos
   comparando texto en cada tecla que el usuario escribe,
   construimos una tabla hash una sola vez: cada palabra
   clave (del título, categoría o descripción) apunta a
   un Set con los IDs de los juegos donde aparece.
   Buscar una palabra es entonces una consulta directa
   sobre el Map, no un recorrido de todo el catálogo.
   ========================================== */
const indiceBusqueda = new Map();

function construirIndiceBusqueda() {
    juegos.forEach(juego => {
        const texto = `${juego.title} ${juego.category} ${juego.description}`.toLowerCase();
        const palabras = texto.split(/[^a-záéíóúñ0-9]+/).filter(Boolean);

        palabras.forEach(palabra => {
            if (!indiceBusqueda.has(palabra)) {
                indiceBusqueda.set(palabra, new Set());
            }
            indiceBusqueda.get(palabra).add(juego.id);
        });
    });
}

function buscarEnIndice(texto) {
    const termino = texto.toLowerCase().trim();
    if (termino === "") return new Set(juegos.map(j => j.id));

    const idsCoincidentes = new Set();

    // Recorremos las claves del hash table (no el catálogo completo)
    // y aceptamos coincidencias parciales, ej. "witch" encuentra "witcher".
    for (const [palabra, ids] of indiceBusqueda) {
        if (palabra.includes(termino)) {
            ids.forEach(id => idsCoincidentes.add(id));
        }
    }

    return idsCoincidentes;
}

/* ==========================================
   ORDENAMIENTO BURBUJA (BUBBLE SORT)
   --------------------------------------------
   Ordena los resultados filtrados por precio,
   de menor a mayor, usando el algoritmo clásico
   de intercambio por pares adyacentes.
   ========================================== */
function ordenarPorPrecioBurbuja(lista) {
    const arreglo = [...lista];
    const n = arreglo.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - 1 - i; j++) {
            if (arreglo[j].price > arreglo[j + 1].price) {
                const temporal = arreglo[j];
                arreglo[j] = arreglo[j + 1];
                arreglo[j + 1] = temporal;
            }
        }
    }

    return arreglo;
}

function aplicarFiltros() {
    let resultado = categoriaActiva === "Todos"
        ? juegos
        : juegos.filter(j => j.category === categoriaActiva);

    if (textoBusqueda.trim() !== "") {
        const idsCoincidentes = buscarEnIndice(textoBusqueda);
        resultado = resultado.filter(j => idsCoincidentes.has(j.id));
    }

    resultado = ordenarPorPrecioBurbuja(resultado);

    mostrarCatalogo(resultado);
}

/* ==========================================
   GESTIÓN DEL CARRITO
   ========================================== */
function agregarAlCarrito(id) {
    const juego = juegos.find(j => j.id === id);
    if (!juego) return;

    let carrito = JSON.parse(localStorage.getItem("nexus_carrito")) || [];

    if (carrito.some(item => item.id === juego.id)) {
        alert("Este juego ya se encuentra en tu carrito.");
        window.location.href = "carrito.html";
        return;
    }

    carrito.push({
        id: juego.id,
        titulo: juego.title,
        precio: juego.price,
        imagen: juego.image
    });

    localStorage.setItem("nexus_carrito", JSON.stringify(carrito));

    alert(`¡${juego.title} se añadió correctamente al carrito!`);
    window.location.href = "carrito.html";
}

/* ==========================================
   MODAL DE DETALLES DEL JUEGO
   ========================================== */
const modalOverlay = document.getElementById("modal-detalle");
const modalImg = document.getElementById("modal-img");
const modalTag = document.getElementById("modal-tag");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");
const modalPrice = document.getElementById("modal-price");
const modalBuy = document.getElementById("modal-buy");
const modalClose = document.getElementById("modal-close");

function verDetalle(id) {
    const juego = juegos.find(j => j.id === id);
    if (!juego || !modalOverlay) return;

    modalImg.src = juego.image;
    modalImg.alt = juego.title;
    modalTag.textContent = juego.category;
    modalTitle.textContent = juego.title;
    modalDesc.textContent = juego.description;
    modalPrice.textContent = `S/ ${juego.price.toFixed(2)}`;
    modalBuy.onclick = () => agregarAlCarrito(juego.id);

    modalOverlay.classList.add("active");
}

function cerrarModal() {
    if (modalOverlay) modalOverlay.classList.remove("active");
}

if (modalClose) modalClose.addEventListener("click", cerrarModal);

if (modalOverlay) {
    // Cierra al hacer clic fuera de la tarjeta (sobre el fondo oscuro)
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) cerrarModal();
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarModal();
});

if (buscador) {
    buscador.addEventListener("input", function () {
        textoBusqueda = this.value;
        aplicarFiltros();
    });
}

/* ==========================================
   INICIALIZACIÓN DE LA VISTA
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {
    construirIndiceBusqueda();
    renderizarFiltros();
    aplicarFiltros();
});
