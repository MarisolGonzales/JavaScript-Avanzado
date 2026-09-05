/* ==========================================================================
   CATÁLOGO DE JUEGOS - MÓDULO PRINCIPAL
   ========================================================================== */
const juegos = [
  {
    id: 'witcher3',
    title: 'The Witcher 3: Wild Hunt',
    price: 29.75,
    category: 'RPG',
    image: '../../JUEGOS/witcher3.jpg',
    description: 'Una aventura épica con decisiones impactantes y un mundo abierto inmersivo.'
  },
  {
    id: 'gtav',
    title: 'Grand Theft Auto V',
    price: 60.0,
    category: 'Acción',
    image: '../../JUEGOS/gtav.png',
    description: 'Mundo abierto, crimen, carreras y cooperación con amigos, todo en Los Santos.'
  },
  {
    id: 'minecraft',
    title: 'Minecraft Ultra Edition',
    price: 89.0,
    category: 'Supervivencia',
    image: '../../JUEGOS/minecraft.jpg',
    description: 'Construye, explora y crea sin límites en un universo infinito.'
  },
  {
    id: 'dota2',
    title: 'Dota 2',
    price: 0,
    category: 'MOBA',
    image: '../../JUEGOS/Dota_2.jpg',
    description: 'Combates estratégicos por equipos con habilidad, coordinación y evolución constante.'
  },
  {
    id: 'left4dead2',
    title: 'Left 4 Dead 2',
    price: 15.0,
    category: 'Cooperativo',
    image: '../../JUEGOS/Left_4_Dead_2.jpg',
    description: 'Supervivencia intensa contra hordas con amigos en escenarios apocalípticos.'
  }
];

const grid = document.getElementById('catalog-grid');
const buscador = document.getElementById('buscador');
const carritoKey = 'nexus_carrito';

function leerCarrito() {
  try {
    return JSON.parse(localStorage.getItem(carritoKey)) || [];
  } catch {
    return [];
  }
}

function guardarCarrito(carrito) {
  localStorage.setItem(carritoKey, JSON.stringify(carrito));
}

function actualizarContadorCarrito() {
  const contador = document.getElementById('contador-carrito');
  if (!contador) return;
  contador.textContent = leerCarrito().length;
}

function filtrarJuegos() {
  const texto = buscador ? buscador.value.toLowerCase() : '';
  return juegos.filter(juego => {
    return (
      juego.title.toLowerCase().includes(texto) ||
      juego.category.toLowerCase().includes(texto) ||
      juego.description.toLowerCase().includes(texto)
    );
  });
}

function renderCatalogo() {
  if (!grid) return;

  const lista = filtrarJuegos();

  if (!lista.length) {
    grid.innerHTML = '<div class="empty-state">No se encontraron resultados.</div>';
    return;
  }

  grid.innerHTML = lista.map(juego => `
    <article class="game-card">
      <img src="${juego.image}" alt="${juego.title}">
      <div class="game-info">
        <div class="game-top">
          <span class="badge">${juego.category}</span>
          <strong>S/ ${juego.price.toFixed(2)}</strong>
        </div>
        <h3>${juego.title}</h3>
        <p>${juego.description}</p>
        <div class="actions">
          <button class="btn-buy" data-id="${juego.id}">Añadir al carrito</button>
          <a href="detalle.html?id=${juego.id}" class="btn-secondary">Detalle</a>
        </div>
      </div>
    </article>
  `).join('');

  document.querySelectorAll('.btn-buy').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const juego = juegos.find(item => item.id === id);
      const carrito = leerCarrito();
      const yaExiste = carrito.some(item => item.id === juego.id);

      if (!yaExiste) {
        carrito.push({
          id: juego.id,
          titulo: juego.title,
          precio: juego.price,
          imagen: juego.image,
          regalo: false,
          destinatario: '',
          correoDestino: ''
        });
        guardarCarrito(carrito);
        actualizarContadorCarrito();
        alert(`${juego.title} agregado al carrito.`);
      } else {
        alert('Este juego ya está en tu carrito.');
      }
    });
  });

  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      const btnDetalle = card.querySelector('.btn-secondary');
      if (btnDetalle) {
        window.location.href = btnDetalle.href;
      }
    });
  });
}

if (buscador) {
  buscador.addEventListener('input', renderCatalogo);
}

document.getElementById('btn-carrito-catalogo')?.addEventListener('click', () => {
  window.location.href = 'carrito.html';
});

renderCatalogo();
actualizarContadorCarrito();