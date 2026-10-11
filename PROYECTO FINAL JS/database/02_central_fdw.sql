-- =============================================================================
-- NEXUS GAMING · Semana 9 y 10 · Base CENTRAL: FDW, catálogo maestro y réplica
--   psql -U postgres -d nexus_central -f 02_central_fdw.sql
-- Requiere que 01_esquema_nodo.sql ya se haya ejecutado en los 3 nodos.
-- =============================================================================
\set ON_ERROR_STOP on
SET client_min_messages = warning;

CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- ---------- 1. Servidores remotos (un servidor por nodo) ---------------------
-- Todos viven en la misma instancia (localhost:5432) para el laboratorio; en
-- producción bastaría cambiar host/port de cada servidor.
DROP SERVER IF EXISTS srv_norte  CASCADE;
DROP SERVER IF EXISTS srv_sur    CASCADE;
DROP SERVER IF EXISTS srv_centro CASCADE;

CREATE SERVER srv_norte  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'localhost', port '5432', dbname 'nexus_trujillo');
CREATE SERVER srv_sur    FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'localhost', port '5432', dbname 'nexus_arequipa');
CREATE SERVER srv_centro FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'localhost', port '5432', dbname 'nexus_cusco');

-- ---------- 2. Mapeo de usuarios --------------------------------------------
-- Los roles locales admin_nova y postgres se conectan a los nodos con el rol de
-- mínimo privilegio admin_nova. CAMBIA la clave (misma que en 00_roles_y_bases).
DO $$
DECLARE s text; r text;
BEGIN
  FOREACH s IN ARRAY ARRAY['srv_norte','srv_sur','srv_centro'] LOOP
    FOREACH r IN ARRAY ARRAY['admin_nova','postgres'] LOOP
      EXECUTE format(
        'CREATE USER MAPPING FOR %I SERVER %I OPTIONS (user %L, password %L)',
        r, s, 'admin_nova', 'cambiar_esta_clave');
    END LOOP;
  END LOOP;
END $$;

-- ---------- 3. Esquemas por nodo y tablas foráneas --------------------------
CREATE SCHEMA IF NOT EXISTS nodo_norte;
CREATE SCHEMA IF NOT EXISTS nodo_sur;
CREATE SCHEMA IF NOT EXISTS nodo_centro;

-- Tabla foránea principal pedido: nodo_norte.pedido, nodo_sur.pedido, nodo_centro.pedido
DO $$
DECLARE n record;
BEGIN
  FOR n IN SELECT * FROM (VALUES
      ('nodo_norte','srv_norte'),('nodo_sur','srv_sur'),('nodo_centro','srv_centro')
    ) AS t(esquema, servidor)
  LOOP
    EXECUTE format($f$
      CREATE FOREIGN TABLE %I.pedido (
        id_pedido      integer,
        codigo         varchar(20),
        id_usuario     varchar(80),
        nodo           varchar(10),
        estado         varchar(14),
        monto_total    numeric(10,2),
        fecha_pedido   timestamptz,
        fecha_estimada timestamptz
      ) SERVER %I OPTIONS (schema_name 'public', table_name 'pedido')$f$,
      n.esquema, n.servidor);

    -- El resto de tablas se importan con su definición real.
    EXECUTE format(
      'IMPORT FOREIGN SCHEMA public LIMIT TO (juego, detalle_pedido, pago, comprobante, historial_estados) FROM SERVER %I INTO %I',
      n.servidor, n.esquema);
  END LOOP;
END $$;

-- Las tablas de logística tienen nombre regional.
IMPORT FOREIGN SCHEMA public LIMIT TO (detalle_logistica_trujillo) FROM SERVER srv_norte  INTO nodo_norte;
IMPORT FOREIGN SCHEMA public LIMIT TO (detalle_logistica_arequipa) FROM SERVER srv_sur    INTO nodo_sur;
IMPORT FOREIGN SCHEMA public LIMIT TO (detalle_logistica_cusco)    FROM SERVER srv_centro INTO nodo_centro;

-- ---------- 4. Catálogo maestro ---------------------------------------------
CREATE TABLE IF NOT EXISTS juego (
  id_juego       integer       PRIMARY KEY,
  titulo         varchar(120)  NOT NULL,
  categoria      varchar(40)   NOT NULL,
  precio         numeric(10,2) NOT NULL CHECK (precio >= 0),
  stock_inicial  integer       NOT NULL DEFAULT 25 CHECK (stock_inicial >= 0),
  imagen         varchar(200),
  banner         varchar(200),
  descripcion    text,
  desarrollador  varchar(80),
  anio           smallint,
  plataformas    varchar(120),
  modo           varchar(40),
  activo         boolean       NOT NULL DEFAULT true,
  actualizado    timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cuentas de usuario (viven solo en la base central). La contraseña se guarda con
-- hash scrypt + sal (lo calcula la API); NUNCA en texto plano.
CREATE TABLE IF NOT EXISTS usuario (
  email          varchar(80)   PRIMARY KEY,
  nombre         varchar(80)   NOT NULL,
  password_hash  text          NOT NULL,
  rol            varchar(8)    NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente','soporte','admin')),
  departamento   varchar(30)   NOT NULL DEFAULT 'Lima',
  creado_en      timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Soporte al cliente: consultas y solicitudes de reembolso, con respuesta del personal.
CREATE TABLE IF NOT EXISTS ticket (
  id_ticket      serial        PRIMARY KEY,
  asunto         varchar(120)  NOT NULL,
  mensaje        varchar(1000) NOT NULL,
  tipo           varchar(10)   NOT NULL DEFAULT 'CONSULTA' CHECK (tipo IN ('CONSULTA','REEMBOLSO')),
  pedido         varchar(20),                       -- código del pedido (reembolsos)
  usuario        varchar(80)   NOT NULL,
  fecha          timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado         varchar(10)   NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO','RESUELTO')),
  respuesta      varchar(1000),
  respondido_por varchar(80),
  respondido_en  timestamptz
);
CREATE INDEX IF NOT EXISTS ix_ticket_usuario ON ticket(usuario, id_ticket DESC);

-- ---------- 5. Replicación del catálogo hacia los nodos ---------------------
-- Regla: el catálogo (título, precio, imagen...) se replica siempre; el stock
-- solo se envía al CREAR el juego. Después cada nodo lo administra localmente,
-- así una actualización de precio en central no pisa las ventas del nodo.
-- postgres_fdw no soporta ON CONFLICT DO UPDATE, por eso se hace UPDATE + INSERT.
-- Además, en un INSERT por FDW los DEFAULT remotos no se aplican: se envían todas
-- las columnas explícitamente (por eso 'actualizado' va con CURRENT_TIMESTAMP).
CREATE OR REPLACE FUNCTION fn_replicar_juego(p_esquema text, p_op text, p_new juego, p_old juego)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_filas integer;
BEGIN
  IF p_op = 'DELETE' THEN
    -- Baja lógica: los pedidos históricos conservan su referencia al juego.
    EXECUTE format('UPDATE %I.juego SET activo = false, actualizado = CURRENT_TIMESTAMP WHERE id_juego = $1', p_esquema)
      USING p_old.id_juego;
    RETURN;
  END IF;

  EXECUTE format($f$UPDATE %I.juego
      SET titulo=$2, categoria=$3, precio=$4, imagen=$5, banner=$6, descripcion=$7,
          desarrollador=$8, anio=$9, plataformas=$10, modo=$11, activo=$12,
          actualizado=CURRENT_TIMESTAMP
    WHERE id_juego=$1$f$, p_esquema)
    USING p_new.id_juego, p_new.titulo, p_new.categoria, p_new.precio,
          p_new.imagen, p_new.banner, p_new.descripcion, p_new.desarrollador,
          p_new.anio, p_new.plataformas, p_new.modo, p_new.activo;
  -- Ojo: FOUND no se actualiza con EXECUTE; hay que leer ROW_COUNT.
  GET DIAGNOSTICS v_filas = ROW_COUNT;

  IF v_filas = 0 THEN
    EXECUTE format($f$INSERT INTO %I.juego
        (id_juego, titulo, categoria, precio, stock, imagen, banner, descripcion,
         desarrollador, anio, plataformas, modo, activo, actualizado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,CURRENT_TIMESTAMP)$f$, p_esquema)
      USING p_new.id_juego, p_new.titulo, p_new.categoria, p_new.precio,
            p_new.stock_inicial, p_new.imagen, p_new.banner, p_new.descripcion,
            p_new.desarrollador, p_new.anio, p_new.plataformas, p_new.modo, p_new.activo;
  END IF;
END $$;

-- Una función disparadora por sede, como pide el laboratorio.
CREATE OR REPLACE FUNCTION replicar_catalogo_arequipa() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM fn_replicar_juego('nodo_sur', TG_OP, NEW, OLD);
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE OR REPLACE FUNCTION replicar_catalogo_cusco() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM fn_replicar_juego('nodo_centro', TG_OP, NEW, OLD);
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE OR REPLACE FUNCTION replicar_catalogo_trujillo() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM fn_replicar_juego('nodo_norte', TG_OP, NEW, OLD);
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_replicar_arequipa ON juego;
DROP TRIGGER IF EXISTS trg_replicar_cusco    ON juego;
DROP TRIGGER IF EXISTS trg_replicar_trujillo ON juego;

CREATE TRIGGER trg_replicar_arequipa AFTER INSERT OR UPDATE OR DELETE ON juego
  FOR EACH ROW EXECUTE FUNCTION replicar_catalogo_arequipa();
CREATE TRIGGER trg_replicar_cusco    AFTER INSERT OR UPDATE OR DELETE ON juego
  FOR EACH ROW EXECUTE FUNCTION replicar_catalogo_cusco();
CREATE TRIGGER trg_replicar_trujillo AFTER INSERT OR UPDATE OR DELETE ON juego
  FOR EACH ROW EXECUTE FUNCTION replicar_catalogo_trujillo();

-- ---------- 6. Vistas globales (consultas distribuidas) ---------------------
CREATE OR REPLACE VIEW v_pedidos_global AS
  SELECT 'NORTE'::text AS nodo_origen, p.* FROM nodo_norte.pedido  p
  UNION ALL
  SELECT 'SUR',    p.* FROM nodo_sur.pedido    p
  UNION ALL
  SELECT 'CENTRO', p.* FROM nodo_centro.pedido p;

-- Detalle de todos los pedidos con su estado y fecha (para "juegos más vendidos", etc.).
CREATE OR REPLACE VIEW v_detalle_global AS
  SELECT 'NORTE'::text AS nodo_origen, d.id_juego, d.cantidad, d.subtotal, p.estado, p.fecha_pedido
    FROM nodo_norte.detalle_pedido d JOIN nodo_norte.pedido p USING (id_pedido)
  UNION ALL
  SELECT 'SUR', d.id_juego, d.cantidad, d.subtotal, p.estado, p.fecha_pedido
    FROM nodo_sur.detalle_pedido d JOIN nodo_sur.pedido p USING (id_pedido)
  UNION ALL
  SELECT 'CENTRO', d.id_juego, d.cantidad, d.subtotal, p.estado, p.fecha_pedido
    FROM nodo_centro.detalle_pedido d JOIN nodo_centro.pedido p USING (id_pedido);

-- Incluye también las regiones sin ventas (LEFT JOIN desde la lista de nodos).
CREATE OR REPLACE VIEW v_ventas_por_nodo AS
  SELECT n.nodo,
         count(p.id_pedido)                                             AS pedidos,
         count(p.id_pedido) FILTER (WHERE p.estado <> 'REEMBOLSADO')    AS pedidos_validos,
         COALESCE(sum(p.monto_total) FILTER (WHERE p.estado <> 'REEMBOLSADO'), 0) AS ingresos
    FROM (VALUES ('NORTE'),('SUR'),('CENTRO')) AS n(nodo)
    LEFT JOIN v_pedidos_global p ON p.nodo_origen = n.nodo
   GROUP BY n.nodo;

CREATE OR REPLACE VIEW v_stock_global AS
  SELECT 'NORTE'::text AS nodo, id_juego, titulo, stock FROM nodo_norte.juego  WHERE activo
  UNION ALL
  SELECT 'SUR',    id_juego, titulo, stock FROM nodo_sur.juego    WHERE activo
  UNION ALL
  SELECT 'CENTRO', id_juego, titulo, stock FROM nodo_centro.juego WHERE activo;

CREATE OR REPLACE VIEW v_stock_bajo AS
  SELECT * FROM v_stock_global WHERE stock <= 5 ORDER BY stock, titulo;

-- ---------- 7. Permisos para el rol de la aplicación ------------------------
GRANT USAGE ON FOREIGN DATA WRAPPER postgres_fdw TO admin_nova;
GRANT USAGE ON FOREIGN SERVER srv_norte, srv_sur, srv_centro TO admin_nova;
GRANT USAGE ON SCHEMA nodo_norte, nodo_sur, nodo_centro TO admin_nova;
GRANT ALL ON ALL TABLES IN SCHEMA nodo_norte, nodo_sur, nodo_centro TO admin_nova;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_nova;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin_nova;
