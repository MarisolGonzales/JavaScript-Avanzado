/* ------------------------------------------
   1. JUEGOS (copia temporal de catalogo.js)
   Mañana esto se reemplaza por localStorage
   ------------------------------------------ */
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

/* ------------------------------------------
   2. PROTECCIÓN DE LOGIN
   ------------------------------------------ */
if (localStorage.getItem("adminLogueado") !== "true") {
  window.location.href = "admin.html";
}

/* ------------------------------------------
   3. DIBUJAR LA TABLA DE JUEGOS
   ------------------------------------------ */
function dibujarJuegos() {
  const cuerpo = document.getElementById("cuerpo-juegos");

  cuerpo.innerHTML = juegos.map(function (juego) {
    return `
      <tr>
        <td><img src="${juego.image}" alt="${juego.title}"></td>
        <td>${juego.title}</td>
        <td>S/ ${juego.price.toFixed(2)}</td>
        <td>${juego.category}</td>
        <td>
          <button class="btn-fila" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-fila eliminar" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

/* ------------------------------------------
   4. INICIO DE LA PÁGINA
   ------------------------------------------ */
document.addEventListener("DOMContentLoaded", function () {
  dibujarJuegos();
});