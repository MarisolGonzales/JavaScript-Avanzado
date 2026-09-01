// detalle.js - Maneja detalle del juego, favoritos y notificaciones de logros
(function(){
  var gameCatalog = {
    witcher3: {
      id: 'witcher3',
      title: 'The Witcher 3: Wild Hunt',
      price: 29.75,
      category: 'RPG',
      developer: 'CD Projekt Red',
      img: '../../JUEGOS/witcher3.jpg',
      description: 'Explora un mundo abierto lleno de monstruos, magia y decisiones que cambian la historia.'
    },
    gtav: {
      id: 'gtav',
      title: 'Grand Theft Auto V',
      price: 60.00,
      category: 'Acción',
      developer: 'Rockstar Games',
      img: '../../JUEGOS/gtav.png',
      description: 'Una experiencia de mundo abierto con misiones, coches y tensión constante en Los Santos.'
    },
    minecraft: {
      id: 'minecraft',
      title: 'Minecraft Ultra Edition',
      price: 89.00,
      category: 'Aventura',
      developer: 'Mojang',
      img: '../../JUEGOS/minecraft.jpg',
      description: 'Explora, construye y crea en mundos infinitos con una experiencia visual mejorada.'
    },
    dota2: {
      id: 'dota2',
      title: 'Dota 2',
      price: 0,
      category: 'MOBA',
      developer: 'Valve',
      img: '../../JUEGOS/Dota_2.jpg',
      description: 'Combates estratégicos por equipos en un juego de habilidad, coordinación y decisiones instantáneas.'
    },
    left4dead2: {
      id: 'left4dead2',
      title: 'Left 4 Dead 2',
      price: 15.00,
      category: 'Cooperativo',
      developer: 'Valve',
      img: '../../JUEGOS/Left_4_Dead_2.jpg',
      description: 'Sobrevive junto a otros jugadores a hordas de infectados en escenarios intensos.'
    }
  };

  var sampleGame = gameCatalog.minecraft;

  // Utilidades simples para localStorage (guardado como JSON)
  function readJSON(key){
    var raw = localStorage.getItem(key);
    try{
      return raw ? JSON.parse(raw) : null;
    }catch(e){
      console.error('Error parseando', key, e);
      return null;
    }
  }
  function writeJSON(key, val){
    localStorage.setItem(key, JSON.stringify(val));
  }

  // Obtener elementos DOM
  var titleEl = document.getElementById('title');
  var imgEl = document.getElementById('img');
  var priceEl = document.getElementById('price');
  var catEl = document.getElementById('category');
  var devEl = document.getElementById('developer');
  var descEl = document.getElementById('description');
  var favBtn = document.getElementById('favBtn');
  var cartBtn = document.getElementById('cartBtn');
  var achMessage = document.getElementById('achMessage');

  // Mostrar datos (podría leerse querystring ?id=...)
  function renderGame(game){
    titleEl.textContent = game.title;
    imgEl.alt = game.title + ' portada';
    imgEl.src = game.img || 'https://via.placeholder.com/640x360.png?text=' + encodeURIComponent(game.title);
    priceEl.textContent = 'Precio: S/ ' + game.price.toFixed(2);
    catEl.textContent = game.category;
    devEl.textContent = game.developer;
    descEl.textContent = game.description;
  }

  var params = new URLSearchParams(window.location.search);
  var selectedId = params.get('id') || sampleGame.id;
  renderGame(gameCatalog[selectedId] || sampleGame);

  // FAVORITOS: almacena un array de ids en 'favorites'
  
  function getFavorites(){
    return readJSON('favorites') || [];
  }
  function isFavorite(gameId){
    var arr = getFavorites();
    return arr.indexOf(gameId) !== -1;
  }
  function toggleFavorite(gameId){
    var arr = getFavorites();
    var idx = arr.indexOf(gameId);
    if(idx === -1){
      arr.push(gameId);
      writeJSON('favorites', arr);
      favBtn.textContent = '♥ En favoritos';
      showAchievement('first_favorite', '¡Has añadido tu primer favorito!');
    } else {
      arr.splice(idx,1);
      writeJSON('favorites', arr);
      favBtn.textContent = '♡ Agregar a favoritos';
    }
  }

  // INICIALIZAR estado del botón de favoritos
  function initFavButton(){
    if(isFavorite(sampleGame.id)){
      favBtn.textContent = '♥ En favoritos';
    } else {
      favBtn.textContent = '♡ Agregar a favoritos';
    }
  }
  initFavButton();

  favBtn.addEventListener('click', function(){
    toggleFavorite(sampleGame.id);
  });

  // CARRITO: añade a 'cart' (otro integrante puede procesar la compra)
  function getCart(){
    return readJSON('cart') || [];
  }
  function addToCart(game){
    var cart = getCart();
    // evitar duplicados simple: buscar por id
    var exists = cart.some(function(item){ return item.id === game.id; });
    if(!exists){
      cart.push({id: game.id, title: game.title, price: game.price, addedAt: new Date().toISOString()});
      writeJSON('cart', cart);
      alert('Juego agregado al carrito.');
      // Marcar logro de primer compra cuando se confirme (simulación: desbloqueo al agregar al carrito no cuenta)
    } else {
      alert('El juego ya está en el carrito.');
    }
  }

  cartBtn.addEventListener('click', function(){
    addToCart(sampleGame);
  });

  // LOGROS: guardamos un objeto en 'achievements' con banderas y mensajes
  function getAchievements(){
    return readJSON('achievements') || {};
  }
  function setAchievement(key, unlocked, message){
    var ach = getAchievements();
    if(!ach[key] && unlocked){
      ach[key] = {unlocked: true, message: message || '' , unlockedAt: new Date().toISOString()};
      writeJSON('achievements', ach);
      // mostrar notificación pequeña en la página
      achMessage.textContent = message || 'Has desbloqueado un logro.';
      setTimeout(function(){ achMessage.textContent = ''; }, 3500);
    }
  }

  // Usado por acciones que tienen que desbloquear logros: ejemplo "first_favorite" se lanza en toggle
  function showAchievement(key, message){
    var ach = getAchievements();
    if(!ach[key]){
      setAchievement(key, true, message);
    }
  }

  // Si el usuario ya tiene algún logro previo, mostrar un pequeño recordatorio (no intrusivo)
  (function showExisting(){
    var ach = getAchievements();
    var keys = Object.keys(ach).filter(function(k){ return ach[k] && ach[k].unlocked; });
    if(keys.length){
      // mostrar el último desbloqueado
      var last = ach[keys[keys.length-1]];
      achMessage.textContent = 'Último logro: ' + (last.message || keys[keys.length-1]);
      setTimeout(function(){ achMessage.textContent = ''; }, 2500);
    }
  })();

})();
