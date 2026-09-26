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
        developer: "CD PROJEKT RED",
        year: 2015,
        platforms: "PC, PlayStation, Xbox, Nintendo Switch",
        mode: "Un jugador",
        image: "assets/img/witcher3.jpg",
        description: "Una aventura épica de mundo abierto impregnada de magia y decisiones con consecuencias."
    },
    {
        id: 2,
        title: "Grand Theft Auto V",
        price: 79.90,
        category: "Acción",
        developer: "Rockstar North",
        year: 2013,
        platforms: "PC, PlayStation, Xbox",
        mode: "Un jugador y multijugador",
        image: "assets/img/gtav.png",
        description: "Explora el vasto mundo abierto de Los Santos y Blaine County en una experiencia inolvidable."
    },
    {
        id: 3,
        title: "Minecraft Ultra Edition",
        price: 69.90,
        category: "Aventura",
        developer: "Mojang Studios",
        year: 2011,
        platforms: "PC, PlayStation, Xbox, Nintendo Switch, móvil",
        mode: "Un jugador y multijugador",
        image: "assets/img/minecraft.jpg",
        description: "Construye, sobrevive y da rienda suelta a tu imaginación en universos infinitos."
    },
    {
        id: 4,
        title: "Dota 2",
        price: 49.90,
        category: "Estrategia",
        developer: "Valve",
        year: 2013,
        platforms: "PC",
        mode: "Multijugador en línea",
        image: "assets/img/Dota_2.jpg",
        description: "Combates tácticos multijugador en equipo donde la estrategia define la victoria."
    },
    {
        id: 5,
        title: "Left 4 Dead 2",
        price: 39.90,
        category: "Acción",
        developer: "Valve",
        year: 2009,
        platforms: "PC, Xbox 360",
        mode: "Cooperativo y multijugador",
        image: "assets/img/Left_4_Dead_2.jpg",
        description: "Acción cooperativa extrema para sobrevivir a implacables hordas de infectados."
    },
    {
        id: 6,
        title: "Cyberpunk 2077",
        price: 89.90,
        category: "RPG",
        developer: "CD PROJEKT RED",
        year: 2020,
        platforms: "PC, PlayStation, Xbox",
        mode: "Un jugador",
        image: "assets/img/cyberpunk-2077.jpg",
        description: "Explora Night City en una aventura de rol futurista donde tus decisiones moldean la historia."
    },
    {
        id: 7,
        title: "Elden Ring",
        price: 99.90,
        category: "RPG",
        developer: "FromSoftware",
        year: 2022,
        platforms: "PC, PlayStation, Xbox",
        mode: "Un jugador y cooperativo en línea",
        image: "assets/img/elden-ring.jpg",
        description: "Atraviesa las Tierras Intermedias y descubre los secretos de un vasto mundo de fantasía."
    },
    {
        id: 8,
        title: "Stardew Valley",
        price: 29.90,
        category: "Simulación",
        developer: "ConcernedApe",
        year: 2016,
        platforms: "PC, PlayStation, Xbox, Nintendo Switch, móvil",
        mode: "Un jugador y multijugador",
        image: "assets/img/stardew-valley.jpg",
        description: "Construye una nueva vida en el campo cultivando, explorando y conociendo a sus habitantes."
    },
    {
        id: 9,
        title: "Hollow Knight",
        price: 34.90,
        category: "Aventura",
        developer: "Team Cherry",
        year: 2017,
        platforms: "PC, PlayStation, Xbox, Nintendo Switch",
        mode: "Un jugador",
        image: "assets/img/hollow-knight.jpg",
        description: "Explora las ruinas de Hallownest en una aventura de acción dibujada a mano."
    },
    {
        id: 10,
        title: "Resident Evil 4",
        price: 119.90,
        category: "Acción",
        developer: "Capcom",
        year: 2023,
        platforms: "PC, PlayStation, Xbox",
        mode: "Un jugador",
        image: "assets/img/resident-evil-4.jpg",
        description: "Acompaña a Leon S. Kennedy en una misión de rescate llena de tensión y supervivencia."
    }
];
