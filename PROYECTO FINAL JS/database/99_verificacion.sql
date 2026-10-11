-- =============================================================================
-- NEXUS GAMING · Verificación de la capa distribuida (Semanas 9 y 10)
--   psql -U postgres -d nexus_central -f 99_verificacion.sql
-- Cada bloque imprime OK o aborta con un error explicativo.
-- =============================================================================
\set ON_ERROR_STOP on
\echo '--- 1. El catálogo se replicó a los 3 nodos'
DO $$
DECLARE c integer; n text;
BEGIN
  FOREACH n IN ARRAY ARRAY['nodo_norte','nodo_sur','nodo_centro'] LOOP
    EXECUTE format('SELECT count(*) FROM %I.juego WHERE activo', n) INTO c;
    IF c <> (SELECT count(*) FROM juego WHERE activo) THEN
      RAISE EXCEPTION 'El nodo % tiene % juegos y central tiene %', n, c, (SELECT count(*) FROM juego WHERE activo);
    END IF;
  END LOOP;
  RAISE NOTICE 'OK: los 3 nodos tienen el mismo catálogo que central';
END $$;

\echo '--- 2. Un cambio de precio en central se replica y NO pisa el stock local'
UPDATE nodo_sur.juego SET stock = stock - 3 WHERE id_juego = 1;  -- simula ventas en Arequipa
UPDATE juego SET precio = 64.90 WHERE id_juego = 1;
DO $$
DECLARE p numeric; s integer;
BEGIN
  SELECT precio, stock INTO p, s FROM nodo_sur.juego WHERE id_juego = 1;
  IF p <> 64.90 THEN RAISE EXCEPTION 'El precio no se replicó (%).', p; END IF;
  IF s <> 27    THEN RAISE EXCEPTION 'El stock local fue sobrescrito (%).', s; END IF;
  RAISE NOTICE 'OK: precio replicado (64.90) y stock local conservado (27)';
END $$;
UPDATE juego SET precio = 59.90 WHERE id_juego = 1;
UPDATE nodo_sur.juego SET stock = 30 WHERE id_juego = 1;

\echo '--- 3. La baja de un juego en central es lógica en los nodos'
INSERT INTO juego(id_juego, titulo, categoria, precio, stock_inicial)
VALUES (999, 'Juego de prueba', 'Prueba', 10, 1);
DELETE FROM juego WHERE id_juego = 999;
DO $$
BEGIN
  IF (SELECT activo FROM nodo_centro.juego WHERE id_juego = 999) THEN
    RAISE EXCEPTION 'El juego 999 debería estar inactivo en el nodo centro';
  END IF;
  RAISE NOTICE 'OK: baja lógica replicada';
END $$;
-- Limpieza de la prueba (borrado físico directo en cada nodo)
DELETE FROM nodo_norte.juego  WHERE id_juego = 999;
DELETE FROM nodo_sur.juego    WHERE id_juego = 999;
DELETE FROM nodo_centro.juego WHERE id_juego = 999;

\echo '--- 4. Consultas distribuidas (vistas globales)'
SELECT * FROM v_ventas_por_nodo ORDER BY nodo;
SELECT * FROM v_stock_bajo;
