-- =============================================================================
-- NEXUS GAMING · Datos iniciales del catálogo (en nexus_central)
--   psql -U postgres -d nexus_central -f 03_datos_iniciales.sql
-- Al insertar aquí, los triggers replican el catálogo a los 3 nodos.
-- =============================================================================
\set ON_ERROR_STOP on

INSERT INTO juego (id_juego, titulo, categoria, precio, stock_inicial, imagen, banner,
                   descripcion, desarrollador, anio, plataformas, modo) VALUES
 (1, 'The Witcher 3: Wild Hunt', 'RPG', 59.9, 30, 'assets/img/witcher3.jpg', 'assets/img/witcher3-banner.jpg', 'Una aventura épica de mundo abierto impregnada de magia y decisiones con consecuencias.', 'CD PROJEKT RED', 2015, 'PC, PlayStation, Xbox, Nintendo Switch', 'Un jugador'),
 (2, 'Grand Theft Auto V', 'Acción', 79.9, 40, 'assets/img/gtav.png', 'assets/img/gtav-cover.png', 'Explora el vasto mundo abierto de Los Santos a través de tres protagonistas.', 'Rockstar North', 2013, 'PC, PlayStation, Xbox', 'Un jugador y multijugador'),
 (3, 'Minecraft Ultra Edition', 'Aventura', 69.9, 35, 'assets/img/minecraft.jpg', 'assets/img/minecraft-cover.jpg', 'Construye, explora y sobrevive en un mundo infinito generado por bloques.', 'Mojang Studios', 2011, 'PC, PlayStation, Xbox, Nintendo Switch, Móvil', 'Un jugador y multijugador'),
 (4, 'Dota 2', 'Estrategia', 49.9, 25, 'assets/img/Dota_2.jpg', NULL, 'El MOBA competitivo de Valve: dos equipos, un antiguo y cientos de héroes.', 'Valve', 2013, 'PC', 'Multijugador'),
 (5, 'Left 4 Dead 2', 'Acción', 39.9, 20, 'assets/img/Left_4_Dead_2.jpg', NULL, 'Sobrevive junto a tus amigos a hordas de infectados en campañas cooperativas.', 'Valve', 2009, 'PC, Xbox', 'Cooperativo'),
 (6, 'Cyberpunk 2077', 'RPG', 89.9, 30, 'assets/img/cyberpunk-2077.jpg', NULL, 'Un RPG de acción en Night City, una megalópolis obsesionada con el poder y la modificación corporal.', 'CD PROJEKT RED', 2020, 'PC, PlayStation, Xbox', 'Un jugador'),
 (7, 'Elden Ring', 'RPG', 99.9, 25, 'assets/img/elden-ring.jpg', NULL, 'Recorre las Tierras Intermedias en un mundo abierto creado por FromSoftware y George R. R. Martin.', 'FromSoftware', 2022, 'PC, PlayStation, Xbox', 'Un jugador y multijugador'),
 (8, 'Stardew Valley', 'Simulación', 29.9, 50, 'assets/img/stardew-valley.jpg', NULL, 'Hereda la granja de tu abuelo y construye la vida que siempre soñaste.', 'ConcernedApe', 2016, 'PC, PlayStation, Xbox, Nintendo Switch, Móvil', 'Un jugador y cooperativo'),
 (9, 'Hollow Knight', 'Aventura', 34.9, 25, 'assets/img/hollow-knight.jpg', NULL, 'Una aventura de acción en un vasto reino de insectos y héroes en ruinas.', 'Team Cherry', 2017, 'PC, PlayStation, Xbox, Nintendo Switch', 'Un jugador'),
 (10, 'Resident Evil 4', 'Acción', 119.9, 5, 'assets/img/resident-evil-4.jpg', NULL, 'El remake del clásico de survival horror: Leon debe rescatar a la hija del presidente.', 'Capcom', 2023, 'PC, PlayStation, Xbox', 'Un jugador')
ON CONFLICT (id_juego) DO NOTHING;
