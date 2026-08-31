// Arreglo con tus archivos guardados en la carpeta 'juegos/'
const featuredGames = [
    {
        title: "The Witcher 3: Wild Hunt",
        description: "Explora un mundo abierto lleno de monstruos, magia y aventuras inolvidables con un 75% de descuento.",
        tag: "OFERTA DESTACADA",
        bannerImg: "juegos/witcher3-banner.jpg", // Tu banner panorámico
        thumbImg: "juegos/witcher3-banner.jpg",  // Tu carátula/icono de la derecha
        discount: "-75%",
        oldPrice: "PEN 119.00",
        price: "PEN 29.75"
    },
    {
        title: "Grand Theft Auto V",
        description: "Disfruta de la aclamada experiencia de mundo abierto de Los Santos y Blaine County.",
        tag: "DISPONIBLE AHORA",
        bannerImg: "juegos/gtav-cover.png",     // Tu banner panorámico guardado en juegos/
        thumbImg: "juegos/gtav.png",             // Tu carátula vertical guardada en juegos/
        discount: "-50%",
        oldPrice: "PEN 120.00",
        price: "PEN 60.00"
    },
    {
        title: "Minecraft Ultra Edition",
        description: "Construye, explora y sobrevive en mundos infinitos con texturas HD avanzadas.",
        tag: "NUEVO CONTENIDO",
        bannerImg: "juegos/minecraft-cover.jpg", // Tu banner panorámico guardado en juegos/
        thumbImg: "juegos/minecraft.jpg",         // Tu carátula vertical guardada en juegos/
        discount: "-20%",
        oldPrice: "PEN 110.00",
        price: "PEN 89.00"
    }
];

let currentIndex = 0;
let autoSlideInterval;

/* ==========================================
   1. LÓGICA DEL CARRUSEL DINÁMICO
   ========================================== */

// Dibujar la lista lateral de la derecha
function renderCarouselList() {
    const listContainer = document.getElementById('carousel-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';

    featuredGames.forEach((game, index) => {
        const item = document.createElement('div');
        item.className = `carousel-item ${index === 0 ? 'active' : ''}`;
        item.onclick = () => selectGame(index);
        
        item.innerHTML = `
            <img src="${game.thumbImg}" alt="${game.title}">
            <span>${game.title}</span>
        `;
        listContainer.appendChild(item);
    });
}

// Cambiar la información y la imagen del Banner Principal
function selectGame(index) {
    currentIndex = index;
    const game = featuredGames[index];
    const bannerImgElem = document.getElementById('banner-img');

    if (bannerImgElem) {
        bannerImgElem.src = game.bannerImg;
    }

    const tagElem = document.getElementById('banner-tag');
    const titleElem = document.getElementById('banner-title');
    const descElem = document.getElementById('banner-desc');
    const discountElem = document.getElementById('banner-discount');
    const oldPriceElem = document.getElementById('banner-old-price');
    const priceElem = document.getElementById('banner-price');

    if (tagElem) tagElem.textContent = game.tag;
    if (titleElem) titleElem.textContent = game.title;
    if (descElem) descElem.textContent = game.description;
    if (discountElem) discountElem.textContent = game.discount;
    if (oldPriceElem) oldPriceElem.textContent = game.oldPrice;
    if (priceElem) priceElem.textContent = game.price;

    // Actualizar el estado 'active' en la columna derecha
    const items = document.querySelectorAll('.carousel-item');
    items.forEach((item, idx) => {
        if (idx === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    resetAutoSlide();
}

function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % featuredGames.length;
        selectGame(currentIndex);
    }, 5000);
}

function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
}


/* ==========================================
   2. GESTIÓN DE SESIÓN DE USUARIO Y NAVBAR
   ========================================== */

// Actualiza el navbar según el estado de la sesión
function actualizarNavbarSesion() {
    const userNav = document.getElementById('user-nav');
    if (!userNav) return;

    // Leer los datos del usuario activo guardados en localStorage tras el Login
    const usuarioSesion = localStorage.getItem('nexus_usuario_activo');

    if (usuarioSesion) {
        const usuario = JSON.parse(usuarioSesion);

        // Si inició sesión: Mostrar avatar, nombre y menú desplegable
        userNav.innerHTML = `
            <div class="user-menu-dropdown">
                <button class="btn-user-profile" id="btn-user-toggle">
                    <img src="${usuario.avatar}" alt="Avatar" class="nav-avatar">
                    <span class="nav-username">${usuario.nombre}</span>
                    <span class="arrow">▾</span>
                </button>
                <div class="dropdown-menu" id="dropdown-menu">
                    <a href="paginas/cliente/perfil.html">👤 Mi Perfil</a>
                    <a href="paginas/cliente/biblioteca.html">🎮 Mi Biblioteca</a>
                    <a href="paginas/cliente/historial.html">📜 Historial de Compras</a>
                    <hr>
                    <a href="#" id="btn-logout" class="logout-link">🚪 Cerrar Sesión</a>
                </div>
            </div>
        `;

        // Event listener para desplegar menú
        document.getElementById('btn-user-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('dropdown-menu');
            if (dropdown) dropdown.classList.toggle('show');
        });

        // Event listener para cerrar sesión
        document.getElementById('btn-logout').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('nexus_usuario_activo');
            alert('Has cerrado sesión correctamente.');
            window.location.reload();
        });

    } else {
        // Si no ha iniciado sesión: Mostrar únicamente el botón "Iniciar Sesión"
        userNav.innerHTML = `
            <a href="paginas/cliente/login.html" class="btn-iniciar-sesion">Iniciar Sesión</a>
        `;
    }
}

// Cerrar el menú desplegable si se hace clic fuera de él
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('dropdown-menu');
    const btnToggle = document.getElementById('btn-user-toggle');
    
    if (dropdown && dropdown.classList.contains('show')) {
        if (btnToggle && !btnToggle.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    }
});


// Botón del carrito
function activarBotonCarrito() {
    const btnCarrito = document.querySelector('.btn-carrito');
    if (!btnCarrito) return;

    btnCarrito.addEventListener('click', () => {
        window.location.href = 'paginas/carrito/carrito.html';
    });
}


/* ==========================================
   3. INICIALIZACIÓN
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    renderCarouselList();
    startAutoSlide();
    actualizarNavbarSesion();
    activarBotonCarrito();
});