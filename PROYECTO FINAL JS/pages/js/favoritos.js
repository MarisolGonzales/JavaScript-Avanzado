const read = key => {
  try { return JSON.parse(localStorage.getItem(key)) || null; }
  catch (error) { console.error(`No se pudo leer ${key}`, error); return null; }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const catalog = {
  minecraft: ['Minecraft', 89.90],
  gtav: ['GTA V', 79.90],
  witcher3: ['The Witcher 3', 89.90],
  cyberpunk: ['Cyberpunk 2077', 99.90]
};
const list = document.getElementById('list');
const empty = '<div class="empty-state"><em>No tienes favoritos todavía.</em></div>';

function render() {
  const favorites = read('favorites') || [];
  if (!favorites.length) return (list.innerHTML = empty);
  list.innerHTML = favorites.map(id => {
    const [title, price] = catalog[id] || [id, 0];
    return `<div class="favorite-item" data-id="${id}">
      <div><strong>${title}</strong><div class="favorite-meta">S/ ${price.toFixed(2)}</div></div>
      <div class="favorite-actions"><button class="remove-btn" type="button">Eliminar</button>
      <a class="view-link" href="detalle.html?id=${id}">Ver</a></div>
    </div>`;
  }).join('');
}
list.addEventListener('click', event => {
  if (!event.target.matches('.remove-btn')) return;
  const item = event.target.closest('[data-id]');
  write('favorites', (read('favorites') || []).filter(id => id !== item.dataset.id));
  render();
});
render();
