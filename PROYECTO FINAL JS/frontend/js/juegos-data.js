/* ==========================================================================
   DATOS DEL CATÁLOGO - NEXUS GAMING
   --------------------------------------------------------------------------
   Fuente única de los juegos disponibles. La usan tanto el catálogo
   (views/catalogo.html) como la portada (index.html) y el panel de
   administrador (views/perfil.html), para no repetir el mismo arreglo
   en tres archivos distintos.

   IMPORTANTE: las rutas de imagen son relativas a "frontend/", por eso
   cada página que use este archivo debe anteponer su propio prefijo
   (ver CATALOGO_PREFIJO más abajo).
   ========================================== */

const CATALOGO_JUEGOS = [
    {
        id: 1,
        title: "The Witcher 3: Wild Hunt",
        price: 59.90,
        category: "RPG",
        image: "assets/img/witcher3.jpg",
        description: "Una aventura épica de mundo abierto impregnada de magia y decisiones con consecuencias."
    },
    {
        id: 2,
        title: "Grand Theft Auto V",
        price: 79.90,
        category: "Acción",
        image: "assets/img/gtav.png",
        description: "Explora el vasto mundo abierto de Los Santos y Blaine County en una experiencia inolvidable."
    },
    {
        id: 3,
        title: "Minecraft Ultra Edition",
        price: 69.90,
        category: "Aventura",
        image: "assets/img/minecraft.jpg",
        description: "Construye, sobrevive y da rienda suelta a tu imaginación en universos infinitos."
    },
    {
        id: 4,
        title: "Dota 2",
        price: 49.90,
        category: "Estrategia",
        image: "assets/img/Dota_2.jpg",
        description: "Combates tácticos multijugador en equipo donde la estrategia define la victoria."
    },
    {
        id: 5,
        title: "Left 4 Dead 2",
        price: 39.90,
        category: "Acción",
        image: "assets/img/Left_4_Dead_2.jpg",
        description: "Acción cooperativa extrema para sobrevivir a implacables hordas de infectados."
    }
];
