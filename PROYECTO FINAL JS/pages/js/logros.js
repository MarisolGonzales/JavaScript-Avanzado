const read = key => {
  try { return JSON.parse(localStorage.getItem(key)) || null; }
  catch (error) { console.error(`No se pudo leer ${key}`, error); return null; }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const definitions = {
  first_favorite: ['Primer favorito', 'Añadir tu primer juego a favoritos.'],
  first_purchase: ['Primera compra', 'Completar la primera compra simulada.']
};
const list = document.getElementById('list');

function render() {
  const saved = read('achievements') || {};
  list.innerHTML = Object.entries(definitions).map(([key, [title, description]]) => {
    const achievement = saved[key], unlocked = achievement && achievement.unlocked;
    return `<div class="achievement-item"><div class="achievement-top"><strong>${title}</strong>
      <span class="status ${unlocked ? 'unlocked' : 'locked'}">${unlocked ? 'Desbloqueado' : 'Bloqueado'}</span></div>
      <p>${description}</p>${unlocked ? `<div class="achievement-date">Fecha: ${achievement.unlockedAt || '--'}</div>` : ''}</div>`;
  }).join('');
}
document.getElementById('simulatePurchase').addEventListener('click', () => {
  const achievements = read('achievements') || {};
  if (achievements.first_purchase) return alert('Ya desbloqueaste este logro.');
  achievements.first_purchase = { unlocked: true, message: 'Has realizado tu primera compra (simulado)', unlockedAt: new Date().toISOString() };
  write('achievements', achievements);
  alert('Logro "Primera compra" desbloqueado (simulación).');
  render();
});
render();
