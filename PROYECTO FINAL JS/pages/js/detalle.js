/* ==========================================================================
   DETALLE DE JUEGO - NEXUS GAMING
   ========================================================================== */

const juegos = {
    witcher3: ['The Witcher 3: Wild Hunt', 29.75, 'RPG', 'CD Projekt Red', '../../JUEGOS/witcher3.jpg', 'Explora un mundo abierto lleno de monstruos, magia y decisiones que cambian la historia.'],
    gtav: ['Grand Theft Auto V', 60, 'Acción', 'Rockstar Games', '../../JUEGOS/gtav.png', 'Una experiencia de mundo abierto con misiones, coches y tensión constante en Los Santos.'],
    minecraft: ['Minecraft Ultra Edition', 89, 'Aventura', 'Mojang', '../../JUEGOS/minecraft.jpg', 'Explora, construye y crea en mundos infinitos con una experiencia visual mejorada.'],
    dota2: ['Dota 2', 0, 'MOBA', 'Valve', '../../JUEGOS/Dota_2.jpg', 'Combates estratégicos por equipos en un juego de habilidad y coordinación.'],
    left4dead2: ['Left 4 Dead 2', 15, 'Cooperativo', 'Valve', '../../JUEGOS/Left_4_Dead_2.jpg', 'Sobrevive junto a otros jugadores a hordas de infectados en escenarios intensos.']
};

const id = new URLSearchParams(location.search).get('id') || 'minecraft';
const game = juegos[id] || juegos.minecraft;
const [title, price, category, developer, image, description] = game;

const $ = selector => document.querySelector(selector);

const read = key => {
    try { 
        return JSON.parse(localStorage.getItem(key)) || null; 
    } catch (error) { 
        console.error(`No se pudo leer ${key}`, error); 
        return null; 
    }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

/* ==========================================
   RENDERIZADO DE DATOS EN LA VISTA
   ========================================== */
$('#title').textContent = title;
$('#img').src = image;
$('#img').alt = `${title} portada`;
$('#price').textContent = `Precio: S/ ${price.toFixed(2)}`;
$('#category').textContent = category;
$('#developer').textContent = developer;
$('#description').textContent = description;

/* ==========================================
   GESTIÓN DE FAVORITOS (CON SEGURIDAD DE SESIÓN)
   ========================================== */
const favorites = () => read('favorites') || [];
const favoriteButton = $('#favBtn');

const updateFavorite = () => {
    favoriteButton.textContent = favorites().includes(id) ? '♥ En favoritos' : '♡ Agregar a favoritos';
};

const notifyAchievement = (key, message) => {
    const achievements = read('achievements') || {};
    if (achievements[key]) return;
    achievements[key] = { unlocked: true, message, unlockedAt: new Date().toISOString() };
    write('achievements', achievements);
    
    const achMessageElem = $('#achMessage');
    if (achMessageElem) {
        achMessageElem.textContent = message;
        setTimeout(() => { achMessageElem.textContent = ''; }, 3500);
    }
};

favoriteButton.addEventListener('click', () => {
    // 🔒 Validación de sesión obligatoria para favoritos
    const usuarioSesion = localStorage.getItem('nexus_usuario_activo');
    if (!usuarioSesion) {
        alert('Acceso restringido: Debes iniciar sesión para poder agregar juegos a favoritos.');
        window.location.href = 'login.html'; // Ajusta a '../html/login.html' si tu estructura lo requiere
        return;
    }

    const list = favorites();
    const index = list.indexOf(id);

    if (index < 0) {
        list.push(id);
        notifyAchievement('first_favorite', '¡Has añadido tu primer favorito!');
    } else {
        list.splice(index, 1);
    }

    write('favorites', list);
    updateFavorite();
});

updateFavorite();

/* ==========================================
   GESTIÓN DEL CARRITO (CON SEGURIDAD DE SESIÓN)
   ========================================== */
$('#cartBtn').addEventListener('click', () => {
    // 🔒 Validación de sesión obligatoria para el carrito
    const usuarioSesion = localStorage.getItem('nexus_usuario_activo');
    if (!usuarioSesion) {
        alert('Acceso restringido: Debes iniciar sesión para poder comprar o agregar juegos al carrito.');
        window.location.href = 'login.html';
        return;
    }

    const cart = read('nexus_carrito') || [];
    
    if (cart.some(item => item.id === id)) {
        alert('El juego ya está en el carrito.');
        window.location.href = 'carrito.html';
        return;
    }

    cart.push({ 
        id, 
        titulo: title, 
        precio: price, 
        imagen: image, 
        regalo: false, 
        destinatario: '', 
        correoDestino: '' 
    });
    
    write('nexus_carrito', cart);
    alert('Juego agregado al carrito.');
    window.location.href = 'carrito.html';
});