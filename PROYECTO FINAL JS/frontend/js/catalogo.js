/* ==========================================================================
   CATÁLOGO DE JUEGOS - NEXUS GAMING
   ========================================================================== */

/* ==========================================================================
   CATÁLOGO DE JUEGOS - NEXUS GAMING
   Los datos vienen de juegos-data.js (CATALOGO_JUEGOS). Aquí solo se
   resuelven las rutas de imagen con el prefijo correcto para esta página.
   ========================================================================== */

const juegos = CATALOGO_JUEGOS.map(j => ({ ...j, image: IMG_BASE + j.image }));

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
            <img class="game-thumb" src="${juego.image}" alt="${juego.title}" onerror="manejarErrorImagen(this)">
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
    agregarAlCarritoObjeto(juego);
}

/* ==========================================
   DETALLES DEL JUEGO (modal compartido, ver game-modal.js)
   ========================================== */
function verDetalle(id) {
    const juego = juegos.find(j => j.id === id);
    abrirDetalleJuego(juego);
}

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
