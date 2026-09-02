const juegos = [
    {
        id: "witcher3",
        title: "The Witcher 3: Wild Hunt",
        price: 29.75,
        category: "RPG",
        image: "../../JUEGOS/witcher3.jpg",
        description:
            "Embárcate en una aventura épica como Geralt de Rivia. Explora un enorme mundo abierto lleno de monstruos, misiones, decisiones y personajes memorables."
    },
    {
        id: "gtav",
        title: "Grand Theft Auto V",
        price: 60.00,
        category: "Acción",
        image: "../../JUEGOS/gtav.png",
        description:
            "Explora Los Santos en una aventura llena de acción, vehículos, misiones y desafíos. Disfruta de una experiencia de mundo abierto llena de posibilidades."
    },
    {
        id: "minecraft",
        title: "Minecraft Ultra Edition",
        price: 89.00,
        category: "Supervivencia",
        image: "../../JUEGOS/minecraft.jpg",
        description:
            "Construye, explora y sobrevive en un mundo generado infinitamente. Reúne recursos, crea herramientas y construye todo lo que puedas imaginar."
    },
    {
        id: "dota2",
        title: "Dota 2",
        price: 0,
        category: "MOBA",
        image: "../../JUEGOS/Dota_2.jpg",
        description:
            "Forma equipo con otros jugadores y participa en intensas batallas estratégicas. Domina a tu héroe y trabaja con tu equipo para conseguir la victoria."
    },
    {
        id: "left4dead2",
        title: "Left 4 Dead 2",
        price: 15.00,
        category: "Cooperativo",
        image: "../../JUEGOS/Left_4_Dead_2.jpg",
        description:
            "Trabaja junto a tus compañeros para sobrevivir a peligrosas hordas en un mundo afectado por una epidemia. Cooperación, acción y supervivencia."
    }
];
const parametros =
    new URLSearchParams(
        window.location.search
    );
const juegoId =
    parametros.get("id");
const container =
    document.getElementById(
        "detalle-container"
    );
const contador =
    document.getElementById(
        "contador-carrito"
    );

const juego =
    juegos.find(
        item => item.id === juegoId
    );

/* =========================================
   CARRITO
========================================= */
const carritoKey =
    "nexus_carrito";
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
function actualizarContador() {
    if (!contador) return;
    const carrito =
        leerCarrito();
    contador.textContent =
        carrito.length;
}
function precioHTML(precio) {

    if (precio === 0) {

        return `
            <span class="detail-price free">
                GRATIS
            </span>
        `;

    }
    return `
        <span class="detail-price">
            S/ ${precio.toFixed(2)}
        </span>
    `;

}
function mostrarDetalle() {
    if (!container) return;
    if (!juego) {
       container.innerHTML = `
            <div class="not-found">
                <i class="fa-solid fa-gamepad"></i>
                <h2>
                    Juego no encontrado
                </h2>
                <p>
                    El juego que estás buscando
                    no existe en nuestro catálogo.
                </p>
                <a
                    href="catalogo.html"
                    class="btn-view-cart"
                >
                    <i class="fa-solid fa-arrow-left"></i>
                    Volver al catálogo
                </a>
            </div>
        `;
        return;
    }
    container.innerHTML = `
        <article class="game-detail">
            <!-- IMAGEN -->
            <div class="detail-image">
                <img
                    src="${juego.image}"
                    alt="${juego.title}"
                >
            </div>
            <!-- INFORMACIÓN -->
            <div class="detail-info">
                <span class="detail-category">
                    <i class="fa-solid fa-gamepad"></i>
                    ${juego.category}
                </span>
                <h1>
                    ${juego.title}
                </h1>
                <p class="detail-description">
                    ${juego.description}
                </p>
                <div class="detail-price-box">
                    <span class="detail-price-label">
                        Precio
                    </span>
                    ${precioHTML(juego.price)}
                </div>
                <div class="detail-actions">
                <button
                        class="btn-add-cart"
                        id="btn-add-cart"
                    >
                        <i class="fa-solid fa-cart-plus"></i>
                        Añadir al carrito
                    </button>
                    <a
                        href="carrito.html"
                        class="btn-view-cart"
                    >
                      <i class="fa-solid fa-cart-shopping"></i>
                      Ver carrito
                    </a>
                </div>
            </div>
        </article>
    `;
    document
        .getElementById("btn-add-cart")
        ?.addEventListener(
            "click",
            agregarAlCarrito
        );
}
function agregarAlCarrito() {
    if (!juego) return;
    const carrito =
        leerCarrito();
    const existe =
        carrito.some(
            item =>
                item.id === juego.id
        );
    if (existe) {
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
    actualizarContador();
    alert(
        `${juego.title} fue agregado al carrito.`
    );
}
document
    .getElementById("btn-carrito")
    ?.addEventListener(
        "click",
        () => {
            window.location.href =
                "carrito.html";

        }
    );

mostrarDetalle();
actualizarContador();
