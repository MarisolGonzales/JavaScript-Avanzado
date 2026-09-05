// Arreglo con tus archivos guardados en la carpeta 'juegos/'
const featuredGames = [
    {
        id: "witcher3",
        title: "The Witcher 3: Wild Hunt",
        description: "Explora un mundo abierto lleno de monstruos, magia y aventuras inolvidables con un 75% de descuento.",
        tag: "OFERTA DESTACADA",
        bannerImg: "JUEGOS/witcher3-banner.jpg",
        thumbImg: "JUEGOS/witcher3.jpg",
        discount: "-75%",
        oldPrice: "PEN 119.00",
        price: "PEN 29.75"
    },
    {
        id: "gtav",
        title: "Grand Theft Auto V",
        description: "Disfruta de la aclamada experiencia de mundo abierto de Los Santos y Blaine County.",
        tag: "DISPONIBLE AHORA",
        bannerImg: "JUEGOS/gtav-cover.png",
        thumbImg: "JUEGOS/gtav.png",
        discount: "-50%",
        oldPrice: "PEN 120.00",
        price: "PEN 60.00"
    },
    {
        id: "minecraft",
        title: "Minecraft Ultra Edition",
        description: "Construye, explora y sobrevive en mundos infinitos con texturas HD avanzadas.",
        tag: "NUEVO CONTENIDO",
        bannerImg: "JUEGOS/minecraft-cover.jpg",
        thumbImg: "JUEGOS/minecraft.jpg",
        discount: "-20%",
        oldPrice: "PEN 110.00",
        price: "PEN 89.00"
    },
    {
        id: "dota2",
        title: "Dota 2",
        description: "Competencia estratégica por equipos con partidas intensas y una comunidad enorme de jugadores.",
        tag: "TOP MULTIJUGADOR",
        bannerImg: "JUEGOS/Dota_2.jpg",
        thumbImg: "JUEGOS/Dota_2.jpg",
        discount: "-0%",
        oldPrice: "PEN 0.00",
        price: "PEN 0.00"
    },
    {
        id: "left4dead2",
        title: "Left 4 Dead 2",
        description: "Coopera con amigos para sobrevivir a oleadas de infectados en escenarios tensos y caóticos.",
        tag: "COOPERATIVO",
        bannerImg: "JUEGOS/Left_4_Dead_2.jpg",
        thumbImg: "JUEGOS/Left_4_Dead_2.jpg",
        discount: "-25%",
        oldPrice: "PEN 20.00",
        price: "PEN 15.00"
    }
];

let currentIndex = 0;
let autoSlideInterval;

/* ==========================================
   1. LÓGICA DEL CARRUSEL DINÁMICO
   ========================================== */

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

function actualizarNavbarSesion() {
    const userNav = document.getElementById('user-nav');
    if (!userNav) return;

    const usuarioSesion = localStorage.getItem('nexus_usuario_activo');

    if (usuarioSesion) {
        const usuario = JSON.parse(usuarioSesion);

        userNav.innerHTML = `
            <div class="user-menu-dropdown">
                <button class="btn-user-profile" id="btn-user-toggle">
                    <img src="${usuario.avatar}" alt="Avatar" class="nav-avatar">
                    <span class="nav-username">${usuario.nombre}</span>
                    <span class="arrow">▾</span>
                </button>
                <div class="dropdown-menu" id="dropdown-menu">
                    <a href="pages/html/perfil.html">👤 Mi Perfil</a>
                    <a href="pages/html/biblioteca.html">🎮 Mi Biblioteca</a>
                    <a href="pages/html/historial.html">📜 Historial de Compras</a>
                    <hr>
                    <a href="#" id="btn-logout" class="logout-link">🚪 Cerrar Sesión</a>
                </div>
            </div>
        `;

        document.getElementById('btn-user-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('dropdown-menu');
            if (dropdown) dropdown.classList.toggle('show');
        });

        document.getElementById('btn-logout').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('nexus_usuario_activo');
            alert('Has cerrado sesión correctamente.');
            window.location.reload();
        });

    } else {
        userNav.innerHTML = `
            <a href="pages/html/login.html" class="btn-iniciar-sesion">Iniciar Sesión</a>
        `;
    }
}

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('dropdown-menu');
    const btnToggle = document.getElementById('btn-user-toggle');
    
    if (dropdown && dropdown.classList.contains('show')) {
        if (btnToggle && !btnToggle.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    }
});

function activarBotonCarrito() {
    const btnCarrito = document.querySelector('.btn-carrito');
    if (!btnCarrito) return;

    btnCarrito.addEventListener('click', () => {
        window.location.href = 'pages/html/carrito.html';
    });
}

/* ==========================================
   3. DELEGACIÓN DE EVENTOS (BURBUJA) PARA DETALLES
   ========================================== */
document.addEventListener('click', (e) => {
    const banner = e.target.closest('.banner-promocional');
    if (banner && !e.target.closest('button')) {
        const juegoActual = featuredGames[currentIndex];
        if (juegoActual) {
            window.location.href = `pages/html/detalle.html?id=${juegoActual.id}`;
        }
        return;
    }

    const card = e.target.closest('.card');
    if (card && !e.target.closest('.buy-cart')) {
        const idJuego = card.dataset.id;
        if (idJuego) {
            window.location.href = `pages/html/detalle.html?id=${idJuego}`;
        }
        return;
    }
});

/* ==========================================
   4. LÓGICA DE BÚSQUEDA DESDE EL INICIO
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const inputBuscador = document.querySelector('.buscador input');
    const btnBuscador = document.querySelector('.buscador button');

    function ejecutarBusqueda() {
        if (!inputBuscador) return;
        const texto = inputBuscador.value.trim();
        if (texto !== '') {
            window.location.href = `pages/html/catalogo.html?busqueda=${encodeURIComponent(texto)}`;
        }
    }

    if (btnBuscador) {
        btnBuscador.addEventListener('click', ejecutarBusqueda);
    }

    if (inputBuscador) {
        inputBuscador.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                ejecutarBusqueda();
            }
        });
    }

    renderCarouselList();
    startAutoSlide();
    actualizarNavbarSesion();
    activarBotonCarrito();
});