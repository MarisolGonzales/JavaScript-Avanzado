// detalle.js - Maneja detalle del juego, favoritos y notificaciones de logros
(function(){
  // Datos de ejemplo. En integración real, estos vendrían del catálogo o querystring.
  var sampleGame = {
    id: 'minecraft',
    title: 'Minecraft',
    price: 89.90,
    category: 'Aventura',
    developer: 'Mojang',
    // img se intentará resolver en la carpeta local 'juegos' usando el id + extensión, con fallback a placeholder
    img: null,
    description: 'Explora, construye y crea en mundos infinitos. Juego de ejemplo para la práctica.'
  };

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
  function renderGame(game){n    titleEl.textContent = game.title;
    imgEl.alt = game.title + ' portada';
    (function loadLocalImage(imgEl, game){
      var exts = ['.png','.jpg','.jpeg','.webp','.svg'];
      var base = 'juegos/' + game.id;
      var idx = 0;
      function attempt(){
        if(idx >= exts.length){
          imgEl.src = 'https://via.placeholder.com/640x360.png?text=' + encodeURIComponent(game.title);
          return;
        }
        imgEl.onerror = function(){ idx++; attempt(); };
        imgEl.src = base + exts[idx];
      }
      attempt();
    })(imgEl, game);
    priceEl.textContent = 'Precio: S/ ' + game.price.toFixed(2);
    catEl.textContent = game.category;
    devEl.textContent = game.developer;
    descEl.textContent = game.description;
  }

  renderGame(sampleGame);

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
