function readJSON(k) {
  try {
    return JSON.parse(localStorage.getItem(k));
  } catch (e) {
    return null;
  }
}

function writeJSON(k, v) {
  localStorage.setItem(k, JSON.stringify(v));
}

var listEl = document.getElementById('list');
var favorites = readJSON('favorites') || [];

if (!favorites.length) {
  listEl.innerHTML = '<div class="empty-state"><em>No tienes favoritos todavía.</em></div>';
} else {
  var sampleCatalog = {
    minecraft: { id: 'minecraft', title: 'Minecraft', price: 89.90 },
    gtav: { id: 'gtav', title: 'GTA V', price: 79.90 },
    witcher3: { id: 'witcher3', title: 'The Witcher 3', price: 89.90 },
    cyberpunk: { id: 'cyberpunk', title: 'Cyberpunk 2077', price: 99.90 }
  };

  listEl.innerHTML = '';

  favorites.forEach(function (id) {
    var data = sampleCatalog[id] || { id: id, title: id, price: 0 };
    var div = document.createElement('div');
    div.className = 'favorite-item';
    div.innerHTML = '<div><strong>' + data.title + '</strong><div class="favorite-meta">S/ ' + data.price.toFixed(2) + '</div></div>' +
      '<div class="favorite-actions"><button class="remove-btn" type="button">Eliminar</button><a class="view-link" href="detalle.html">Ver</a></div>';

    (function (gameId, node) {
      node.querySelector('.remove-btn').addEventListener('click', function () {
        var arr = readJSON('favorites') || [];
        var idx = arr.indexOf(gameId);

        if (idx !== -1) {
          arr.splice(idx, 1);
          writeJSON('favorites', arr);
          node.remove();
        }

        if ((readJSON('favorites') || []).length === 0) {
          listEl.innerHTML = '<div class="empty-state"><em>No tienes favoritos todavía.</em></div>';
        }
      });
    })(id, div);

    listEl.appendChild(div);
  });
}
