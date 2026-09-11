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
const filtros = document.getElementById('category-filters');
const carritoKey = 'nexus_carrito';

let categoriaActiva = 'Todos';

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

  if (contador) {
    contador.textContent = leerCarrito().length;
  }
}

function filtrarJuegos() {
  const texto = buscador ? buscador.value.toLowerCase().trim() : '';

  return juegos.filter(juego =>
    (categoriaActiva === 'Todos' || juego.category === categoriaActiva) &&
    (
      juego.title.toLowerCase().includes(texto) ||
      juego.category.toLowerCase().includes(texto) ||
      juego.description.toLowerCase().includes(texto)
    )
  );
}

function renderFiltros() {
  if (!filtros) return;

  const categorias = ['Todos', ...new Set(juegos.map(juego => juego.category))];

  filtros.innerHTML = categorias.map(categoria => `
    <button
      class="filter-chip ${categoria === categoriaActiva ? 'active' : ''}"
      type="button"
      data-category="${categoria}"
    >
      ${categoria}
    </button>
  `).join('');

  filtros.querySelectorAll('.filter-chip').forEach(boton => {
    boton.addEventListener('click', () => {
      categoriaActiva = boton.dataset.category;
      renderFiltros();
      renderCatalogo();
    });
  });
}

function tarjetaJuego(juego) {
  const precio = juego.price === 0 ? 'Gratis' : `S/ ${juego.price.toFixed(2)}`;

  return `
    <article class="game-card" data-id="${juego.id}" tabindex="0">
      <img src="${juego.image}" alt="Portada de ${juego.title}">

      <div class="game-info">
        <div class="game-top">
          <span class="badge">${juego.category}</span>
          <strong>${precio}</strong>
        </div>

        <h3>${juego.title}</h3>
        <p>${juego.description}</p>

        <div class="actions">
          <button class="btn-buy" data-id="${juego.id}">Añadir</button>
          <a href="detalle.html?id=${juego.id}" class="btn-secondary">Detalle</a>
        </div>
      </div>
    </article>
  `;
}

function agregarEventosTarjetas() {
  document.querySelectorAll('.btn-buy').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();

      const juego = juegos.find(item => item.id === button.dataset.id);
      const carrito = leerCarrito();
      const yaExiste = carrito.some(item => item.id === juego.id);

      if (yaExiste) {
        alert('Este juego ya está en tu carrito.');
        return;
      }

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
    });
  });

  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', event => {
      if (event.target.closest('.btn-buy') || event.target.closest('a')) return;

      window.location.href = `detalle.html?id=${card.dataset.id}`;
    });

    card.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        window.location.href = `detalle.html?id=${card.dataset.id}`;
      }
    });
  });
}

function renderCatalogo() {
  if (!grid) return;

  const lista = filtrarJuegos();

  if (!lista.length) {
    grid.innerHTML = '<div class="empty-state">No se encontraron resultados.</div>';
    return;
  }

  const hayBusqueda = buscador && buscador.value.trim();
  const hayFiltro = categoriaActiva !== 'Todos';

  const grupos = hayBusqueda || hayFiltro
    ? [['Resultados', lista]]
    : [
        ['Recomendados para ti', lista],
        ['Gratis para jugar', lista.filter(juego => juego.price === 0)],
        [
          'Para jugar con amigos',
          lista.filter(juego => ['MOBA', 'Cooperativo'].includes(juego.category))
        ]
      ];

  grid.innerHTML = grupos
    .filter(([, juegosGrupo]) => juegosGrupo.length)
    .map(([titulo, juegosGrupo]) => `
      <section class="catalog-row">
        <h2 class="catalog-row-title">${titulo}</h2>
        <div class="games-rail">
          ${juegosGrupo.map(tarjetaJuego).join('')}
        </div>
      </section>
    `)
    .join('');

  agregarEventosTarjetas();
}

function revisarParametroBusqueda() {
  const params = new URLSearchParams(window.location.search);
  const busquedaParam = params.get('busqueda');

  if (busquedaParam && buscador) {
    buscador.value = busquedaParam;
  }
}

if (buscador) {
  buscador.addEventListener('input', renderCatalogo);
}

document.getElementById('btn-carrito-catalogo')?.addEventListener('click', () => {
  window.location.href = 'carrito.html';
});

revisarParametroBusqueda();
renderFiltros();
renderCatalogo();
actualizarContadorCarrito();
