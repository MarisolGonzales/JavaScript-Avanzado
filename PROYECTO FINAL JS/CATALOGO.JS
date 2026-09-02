const juegos = [
    {
        id: "witcher3",
        title: "The Witcher 3: Wild Hunt",
        price: 29.75,
        category: "RPG",
        image: "../../JUEGOS/witcher3.jpg",
        description:
            "Una aventura épica con decisiones impactantes y un mundo abierto inmersivo."
    },
    {
        id: "gtav",
        title: "Grand Theft Auto V",
        price: 60.00,
        category: "Acción",
        image: "../../JUEGOS/gtav.png",
        description:
            "Mundo abierto, crimen, carreras y cooperación con amigos en Los Santos."
    },
    {
        id: "minecraft",
        title: "Minecraft Ultra Edition",
        price: 89.00,
        category: "Supervivencia",
        image: "../../JUEGOS/minecraft.jpg",
        description:
            "Construye, explora y crea sin límites en un universo lleno de posibilidades."
    },
    {
        id: "dota2",
        title: "Dota 2",
        price: 0,
        category: "MOBA",
        image: "../../JUEGOS/Dota_2.jpg",
        description:
            "Combates estratégicos por equipos donde cada decisión puede cambiar la partida."
    },
    {
        id: "left4dead2",
        title: "Left 4 Dead 2",
        price: 15.00,
        category: "Cooperativo",
        image: "../../JUEGOS/Left_4_Dead_2.jpg",

        description:
            "Supervivencia intensa contra hordas en escenarios apocalípticos."
    }
];

const grid =
    document.getElementById("catalog-grid");
const buscador =
    document.getElementById("buscador");
const cantidadJuegos =
    document.getElementById("cantidad-juegos");
const emptyState =
    document.getElementById("empty-state");
const contador =
    document.getElementById("contador-carrito");
/* =========================================
   CARRITO
========================================= */
const carritoKey = "nexus_carrito";
function leerCarrito() {
    try {
        return JSON.parse(
            localStorage.getItem(carritoKey)
        ) || [];
    } catch (error) {
       return [];
    }
}
function guardarCarrito(carrito) {
    localStorage.setItem(
        carritoKey,
        JSON.stringify(carrito)
    );
}
function actualizarContadorCarrito() {
    if (!contador) return;
    const carrito = leerCarrito();
    contador.textContent = carrito.length;
}
/* =========================================
    PRECIO
========================================= */
function mostrarPrecio(precio) {
    if (precio === 0) {
        return `
            <span class="price free">
                GRATIS
            </span>
        `;
    }
  return `
        <span class="price">
            S/ ${precio.toFixed(2)}
        </span>
    `;
}
/* =========================================
    JUEGOS
========================================= */
let categoriaActual = "Todos";
unction obtenerJuegosFiltrados() {
    const texto =
        buscador
            ? buscador.value.toLowerCase().trim()
            : "";
    return juegos.filter(juego => {
        const coincideTexto =
            juego.title
                .toLowerCase()
                .includes(texto)    
            juego.category
                .toLowerCase()
                .includes(texto)       
            juego.description
                .toLowerCase()
                .includes(texto);
        const coincideCategoria =
            categoriaActual === "Todos"
            juego.category === categoriaActual;
        return (
            coincideTexto &&
            coincideCategoria
        );
    });
}
/* =========================================
   MOSTRAR CATÁLOGO
========================================= */
function renderCatalogo() {
    if (!grid) return;
    const lista =
        obtenerJuegosFiltrados();
    if (cantidadJuegos) {
        cantidadJuegos.textContent =
            lista.length;
    }
    if (!lista.length) {
       grid.innerHTML = "";
        if (emptyState) {
            emptyState.style.display =
                "block";
        }
        return;
    }
    if (emptyState) {
        emptyState.style.display =
            "none";
    }
    grid.innerHTML = lista.map(juego => {
       return `
           <article class="game-card">
                <div class="game-image">
                    <img
                        src="${juego.image}"
                        alt="${juego.title}"
                        loading="lazy"
                    >
                    <span class="game-category">
                        ${juego.category}
                    </span>
                </div>
                <div class="game-info">
                    <h3>
                        ${juego.title}
                    </h3>
                    <p>
                        ${juego.description}
                    </p>
                    <div class="game-price">
                       <span class="price-label">
                            Precio
                        </span>
                        ${mostrarPrecio(juego.price)}
                    </div>
                    <div class="actions">
                        <button
                            class="btn-buy"
                            data-id="${juego.id}"
                        >
                            <i class="fa-solid fa-cart-plus"></i>
                            Añadir
                        </button>
                        <a
                            href="detalle.html?id=${juego.id}"
                            class="btn-secondary"
                        >
                            Detalle
                        </a>
                    </div>
                </div>
            </article>
        `;
    }).join("");
    /* =====================================
       BOTONES AÑADIR AL CARRITO
    ===================================== */
    document
        .querySelectorAll(".btn-buy")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const id =
                        button.dataset.id;
                   const juego =
                        juegos.find(
                            item => item.id === id
                        );
                    if (!juego) return;
                    const carrito =
                        leerCarrito();
                    const yaExiste =
                        carrito.some(
                            item =>
                                item.id === juego.id
                        );
                    if (yaExiste) {
                        alert(
                            "Este juego ya está en tu carrito."
                        );
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
                    guardarCarrito(carrito);
                  actualizarContadorCarrito();
                    alert(
                        `${juego.title} fue agregado al carrito.`
                    );
                }
            );
        });
}

/* =========================================
   BUSCADOR
========================================= */

if (buscador) {
    buscador.addEventListener(
        "input",
        renderCatalogo
    );
}

/* =========================================
   CATEGORÍAS
========================================= */
document
    .querySelectorAll(".category-btn")
    .forEach(button => {
        button.addEventListener(
            "click",
            () => {
              document
                    .querySelectorAll(".category-btn")
                    .forEach(btn => {
                        btn.classList.remove(
                            "active"
                       );
                    });
                button.classList.add(
                    "active"
                );
                categoriaActual =
                    button.dataset.category;
                renderCatalogo();
            }
        );
    });


/* =========================================
   BOTÓN CARRITO
========================================= */

document
    .getElementById("btn-carrito-catalogo")
    ?.addEventListener(
        "click",
        () => {
            window.location.href =
                "carrito.html";
        }
    );

/* =========================================
   INICIALIZAR
========================================= */

renderCatalogo();
actualizarContadorCarrito();
