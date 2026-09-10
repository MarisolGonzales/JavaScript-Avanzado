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
   2. VENTAS (vienen del historial guardado por compra.js)
   ------------------------------------------ */
const CLAVE_HISTORIAL = "nexus_historial_compras";

function leerHistorial() {
  try {
    const datos = localStorage.getItem(CLAVE_HISTORIAL);
    if (datos) {
      return JSON.parse(datos);
    }
  } catch (error) {
    console.log("No se pudo leer el historial de ventas: " + error);
  }
  return [];
}

/* ------------------------------------------
   3. PROTECCIÓN DE LOGIN
   ------------------------------------------ */
if (localStorage.getItem("adminLogueado") !== "true") {
  window.location.href = "admin.html";
}

/* ------------------------------------------
   4. DIBUJAR LA TABLA DE JUEGOS
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
   5. DIBUJAR LA TABLA DE VENTAS
   ------------------------------------------ */
function dibujarVentas() {
  const cuerpo = document.getElementById("cuerpo-ventas");
  const historial = leerHistorial();

  if (historial.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="4">Todavía no hay ventas registradas.</td></tr>`;
    return;
  }

  // Las ventas más recientes primero
  const ordenadas = historial.slice().reverse();

  cuerpo.innerHTML = ordenadas.map(function (venta) {
    return `
      <tr>
        <td>${venta.fecha}</td>
        <td>${venta.cliente || "-"}</td>
        <td>${venta.juego}</td>
        <td>${venta.monto}</td>
      </tr>
    `;
  }).join("");
}

/* ------------------------------------------
   6. CALCULAR Y DIBUJAR LAS ESTADÍSTICAS
   ------------------------------------------ */
function calcularEstadisticas() {
  const historial = leerHistorial();

  const elTotal = document.getElementById("stat-total-ventas");
  const elJuegoTop = document.getElementById("stat-juego-top");
  const elCantidad = document.getElementById("stat-cantidad-ventas");

  if (historial.length === 0) {
    elTotal.textContent = "PEN 0.00";
    elJuegoTop.textContent = "-";
    elCantidad.textContent = "0";
    return;
  }

  // Ingresos totales
  let totalIngresos = 0;
  const conteoPorJuego = {};

  historial.forEach(function (venta) {
    // montoNumero viene de compra.js; si faltara, se saca del texto "S/ 29.75"
    const monto = typeof venta.montoNumero === "number"
      ? venta.montoNumero
      : parseFloat(String(venta.monto).replace("S/", "").trim()) || 0;

    totalIngresos += monto;

    conteoPorJuego[venta.juego] = (conteoPorJuego[venta.juego] || 0) + 1;
  });

  // Juego más vendido
  let juegoTop = "-";
  let maxVentas = 0;

  for (const nombreJuego in conteoPorJuego) {
    if (conteoPorJuego[nombreJuego] > maxVentas) {
      maxVentas = conteoPorJuego[nombreJuego];
      juegoTop = nombreJuego;
    }
  }

  elTotal.textContent = "PEN " + totalIngresos.toFixed(2);
  elJuegoTop.textContent = juegoTop;
  elCantidad.textContent = historial.length;
}

/* ------------------------------------------
   7. INICIO DE LA PÁGINA
   ------------------------------------------ */
document.addEventListener("DOMContentLoaded", function () {
  dibujarJuegos();
  dibujarVentas();
  calcularEstadisticas();
});