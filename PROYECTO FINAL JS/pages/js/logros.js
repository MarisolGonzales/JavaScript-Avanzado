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

var defaultAchievements = {
  first_favorite: {
    key: 'first_favorite',
    title: 'Primer favorito',
    desc: 'Añadir tu primer juego a favoritos.'
  },
  first_purchase: {
    key: 'first_purchase',
    title: 'Primera compra',
    desc: 'Completar la primera compra simulada.'
  }
};

var list = document.getElementById('list');

function render() {
  var stored = readJSON('achievements') || {};
  list.innerHTML = '';

  Object.keys(defaultAchievements).forEach(function (k) {
    var meta = defaultAchievements[k];
    var s = stored[k] && stored[k].unlocked;
    var div = document.createElement('div');
    div.className = 'achievement-item';

    div.innerHTML = '<div class="achievement-top"><strong>' + meta.title + '</strong><span class="status ' + (s ? 'unlocked' : 'locked') + '">' + (s ? 'Desbloqueado' : 'Bloqueado') + '</span></div>' +
      '<p>' + meta.desc + '</p>' +
      (s ? '<div class="achievement-date">Fecha: ' + (stored[k].unlockedAt || '--') + '</div>' : '');

    list.appendChild(div);
  });
}

render();

document.getElementById('simulatePurchase').addEventListener('click', function () {
  var ach = readJSON('achievements') || {};

  if (!ach.first_purchase) {
    ach.first_purchase = {
      unlocked: true,
      message: 'Has realizado tu primera compra (simulado)',
      unlockedAt: new Date().toISOString()
    };
    writeJSON('achievements', ach);
    alert('Logro "Primera compra" desbloqueado (simulación).');
    render();
  } else {
    alert('Ya desbloqueaste este logro.');
  }
});
