// ===============================
// CATÁLOGO DE JUEGOS
// ===============================

const juegos = [
    {
        id: 1,
        title: "The Witcher 3",
        price: 59.90,
        category: "RPG",
        image: "../../JUEGOS/witcher3.jpg",
        description: "Una aventura épica de mundo abierto."
    },
    {
        id: 2,
        title: "GTA V",
        price: 79.90,
        category: "Acción",
        image: "../../JUEGOS/gtav.png",
        description: "Explora Los Santos y vive una gran aventura."
    },
    {
        id: 3,
        title: "Minecraft",
        price: 69.90,
        category: "Aventura",
        image: "../../JUEGOS/minecraft.jpg",
        description: "Construye, explora y sobrevive en un mundo infinito."
    },
    {
        id: 4,
        title: "Dota 2",
        price: 49.90,
        category: "Estrategia",
        image: "../../JUEGOS/Dota_2.jpg",
        description: "Juego competitivo de estrategia y acción."
    },
    {
        id: 5,
        title: "Left 4 Dead 2",
        price: 39.90,
        category: "Acción",
        image: "../../JUEGOS/Left_4_Dead_2.jpg",
        description: "Sobrevive junto a tus amigos contra hordas de infectados."
    }
];

// ===============================
// MOSTRAR CATÁLOGO
// ===============================

const catalogGrid = document.getElementById("catalog-grid");

function mostrarCatalogo(lista = juegos) {

    if (!catalogGrid) return;

    catalogGrid.innerHTML = "";

    lista.forEach(juego => {

        const tarjeta = document.createElement("div");

        tarjeta.className = "game-card";

        tarjeta.innerHTML = `
            <img src="${juego.image}" alt="${juego.title}">

            <div class="game-info">
                <h3>${juego.title}</h3>

                <p>${juego.description}</p>

                <span class="category">
                    ${juego.category}
                </span>

                <h4>
                    S/ ${juego.price.toFixed(2)}
                </h4>

                <div class="game-buttons">

                    <button
                        class="btn-detalle"
                        onclick="verDetalle(${juego.id})">
                        Ver detalles
                    </button>

                    <button
                        class="btn-carrito"
                        onclick="agregarAlCarrito(${juego.id})">
                        Añadir al carrito
                    </button>

                </div>
            </div>
        `;

        catalogGrid.appendChild(tarjeta);
    });
}

// ===============================
// AGREGAR AL CARRITO
// ===============================

function agregarAlCarrito(id) {

    const juego = juegos.find(j => j.id === id);

    if (!juego) {
        console.error("Juego no encontrado");
        return;
    }

    let carrito =
        JSON.parse(localStorage.getItem("nexus_carrito")) || [];

    carrito.push({
        id: juego.id,
        titulo: juego.title,
        precio: juego.price,
        imagen: juego.image,
        regalo: false,
        destinatario: "",
        correoDestino: ""
    });

    // Guardar carrito
    localStorage.setItem(
        "nexus_carrito",
        JSON.stringify(carrito)
    );

    // Actualizar contador
    actualizarContadorCarrito();

    // Ir automáticamente al carrito
    window.location.href = "carrito.html";
}

// ===============================
// CONTADOR DEL CARRITO
// ===============================

function actualizarContadorCarrito() {

    const carrito =
        JSON.parse(localStorage.getItem("nexus_carrito")) || [];

    const contador =
        document.getElementById("cart-count");

    if (contador) {
        contador.textContent = carrito.length;
    }
}

// ===============================
// VER DETALLES
// ===============================

function verDetalle(id) {

    const juego = juegos.find(j => j.id === id);

    if (!juego) return;

    alert(
        `${juego.title}\n\n` +
        `Categoría: ${juego.category}\n` +
        `Precio: S/ ${juego.price.toFixed(2)}\n\n` +
        `${juego.description}`
    );
}

// ===============================
// BUSCADOR
// ===============================

const buscador =
    document.getElementById("search-input");

if (buscador) {

    buscador.addEventListener("input", function () {

        const texto =
            this.value.toLowerCase().trim();

        const resultados = juegos.filter(juego =>
            juego.title.toLowerCase().includes(texto) ||
            juego.category.toLowerCase().includes(texto)
        );

        mostrarCatalogo(resultados);
    });
}
function agregarAlCarrito(id) {

    // 🔒 Validar si hay un usuario logueado desde la vista de catálogo
    const usuarioSesion = localStorage.getItem('nexus_usuario_activo');
    if (!usuarioSesion) {
        alert('Debes iniciar sesión para poder comprar o agregar juegos al carrito.');
        window.location.href = 'login.html'; // Redirige al login estando en pages/html/
        return;
    }

    const juego = juegos.find(j => j.id === id);

    if (!juego) {
        console.error("Juego no encontrado");
        return;
    }

    let carrito = JSON.parse(localStorage.getItem("nexus_carrito")) || [];

    // Opcional: validar si ya existe en el carrito también aquí
    if (carrito.some(item => item.id === juego.id)) {
        alert('El juego ya está en el carrito.');
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

    // Guardar carrito
    localStorage.setItem("nexus_carrito", JSON.stringify(carrito));

    // Actualizar contador
    actualizarContadorCarrito();

    // Ir automáticamente al carrito
    window.location.href = "carrito.html";
}
// ===============================
// BOTÓN DEL CARRITO
// ===============================

const botonCarrito =
    document.getElementById("btn-carrito-catalogo");

if (botonCarrito) {

    botonCarrito.addEventListener("click", function () {

        window.location.href = "carrito.html";

    });
}

// ===============================
// INICIAR
// ===============================

mostrarCatalogo();
actualizarContadorCarrito();
