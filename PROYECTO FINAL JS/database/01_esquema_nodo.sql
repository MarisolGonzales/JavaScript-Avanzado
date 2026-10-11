-- =============================================================================
-- NEXUS GAMING · Semana 10 · Esquema transaccional de UN servidor regional
-- Se ejecuta en nexus_trujillo, nexus_arequipa y nexus_cusco (mismo esquema):
--   psql -U postgres -d nexus_arequipa -v region=arequipa -f 01_esquema_nodo.sql
-- Tienda de juegos DIGITALES: carrito, pedido, pago, comprobante (boleta o
-- factura), historial de estados y entrega digital. Cada servidor guarda las
-- compras de los clientes de su zona y administra su propio stock de claves.
-- =============================================================================
\set ON_ERROR_STOP on
SET client_min_messages = warning;

-- ---------- Catálogo (réplica de nexus_central, se mantiene por triggers) ----
-- `stock` = claves de activación disponibles en ESTE servidor.
CREATE TABLE IF NOT EXISTS juego (
  id_juego      integer       PRIMARY KEY,
  titulo        varchar(120)  NOT NULL,
  categoria     varchar(40)   NOT NULL,
  precio        numeric(10,2) NOT NULL CHECK (precio >= 0),
  stock         integer       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  imagen        varchar(200),
  banner        varchar(200),
  descripcion   text,
  desarrollador varchar(80),
  anio          smallint,
  plataformas   varchar(120),
  modo          varchar(40),
  activo        boolean       NOT NULL DEFAULT true,
  actualizado   timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Carrito ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrito (
  id_carrito   serial        PRIMARY KEY,
  id_usuario   varchar(80)   NOT NULL,
  estado       varchar(12)   NOT NULL DEFAULT 'ABIERTO'
               CHECK (estado IN ('ABIERTO','CONVERTIDO','ABANDONADO')),
  creado_en    timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Un usuario solo puede tener UN carrito abierto a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS ux_carrito_abierto ON carrito(id_usuario) WHERE estado = 'ABIERTO';

-- tipo_entrega: DIGITAL = licencia para la cuenta del comprador; REGALO = para otra persona.
CREATE TABLE IF NOT EXISTS item_carrito (
  id_item      serial        PRIMARY KEY,
  id_carrito   integer       NOT NULL REFERENCES carrito(id_carrito) ON DELETE CASCADE,
  id_juego     integer       NOT NULL REFERENCES juego(id_juego),
  cantidad     integer       NOT NULL DEFAULT 1 CHECK (cantidad BETWEEN 1 AND 10),
  tipo_entrega varchar(10)   NOT NULL DEFAULT 'DIGITAL' CHECK (tipo_entrega IN ('DIGITAL','REGALO')),
  UNIQUE (id_carrito, id_juego, tipo_entrega)
);

-- ---------- Pedido, detalle, pago y comprobante -----------------------------
-- fecha_estimada: momento de entrega (inmediato en una tienda digital).
CREATE TABLE IF NOT EXISTS pedido (
  id_pedido        serial        PRIMARY KEY,
  codigo           varchar(20)   NOT NULL UNIQUE,
  id_usuario       varchar(80)   NOT NULL,
  nodo             varchar(10)   NOT NULL CHECK (nodo IN ('NORTE','SUR','CENTRO')),
  estado           varchar(12)   NOT NULL DEFAULT 'PENDIENTE'
                   CHECK (estado IN ('PENDIENTE','PAGADO','ENTREGADO','REEMBOLSADO')),
  monto_total      numeric(10,2) NOT NULL CHECK (monto_total >= 0),
  fecha_pedido     timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_estimada   timestamptz
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id_detalle       serial        PRIMARY KEY,
  id_pedido        integer       NOT NULL REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  id_juego         integer       NOT NULL REFERENCES juego(id_juego),
  cantidad         integer       NOT NULL CHECK (cantidad > 0),
  precio_unitario  numeric(10,2) NOT NULL CHECK (precio_unitario >= 0),
  tipo_entrega     varchar(10)   NOT NULL CHECK (tipo_entrega IN ('DIGITAL','REGALO')),
  clave_digital    varchar(24),
  subtotal         numeric(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

CREATE TABLE IF NOT EXISTS pago (
  id_pago          serial        PRIMARY KEY,
  id_pedido        integer       NOT NULL UNIQUE REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  metodo           varchar(10)   NOT NULL CHECK (metodo IN ('TARJETA','YAPE','PLIN')),
  monto            numeric(10,2) NOT NULL CHECK (monto >= 0),
  estado           varchar(12)   NOT NULL DEFAULT 'APROBADO'
                   CHECK (estado IN ('APROBADO','RECHAZADO','REEMBOLSADO')),
  referencia       varchar(30),     -- solo últimos 4 dígitos o celular enmascarado; JAMÁS la tarjeta completa
  fecha_pago       timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Comprobante de pago: BOLETA (consumidor final) o FACTURA (empresa con RUC).
CREATE TABLE IF NOT EXISTS comprobante (
  id_comprobante   serial        PRIMARY KEY,
  id_pedido        integer       NOT NULL UNIQUE REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  tipo             varchar(8)    NOT NULL DEFAULT 'BOLETA' CHECK (tipo IN ('BOLETA','FACTURA')),
  serie            char(4)       NOT NULL,
  numero           integer       NOT NULL,
  receptor_tipo_doc varchar(8)   NOT NULL DEFAULT 'SIN DOC' CHECK (receptor_tipo_doc IN ('DNI','RUC','SIN DOC')),
  receptor_doc     varchar(11),
  receptor_nombre  varchar(120),
  receptor_direccion varchar(160),
  subtotal         numeric(10,2) NOT NULL,
  igv              numeric(10,2) NOT NULL,
  total            numeric(10,2) NOT NULL,
  emitido_en       timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (serie, numero),
  -- Una factura SIEMPRE lleva RUC (11 dígitos) y razón social.
  CHECK (tipo <> 'FACTURA' OR (receptor_tipo_doc = 'RUC' AND receptor_doc ~ '^[0-9]{11}$' AND receptor_nombre IS NOT NULL))
);

-- ---------- Trazabilidad -----------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_estados (
  id_historial     serial        PRIMARY KEY,
  id_pedido        integer       NOT NULL REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  estado_anterior  varchar(12),
  estado_nuevo     varchar(12)   NOT NULL,
  comentario       varchar(200),
  fecha_cambio     timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_historial_pedido ON historial_estados(id_pedido, fecha_cambio);

-- ---------- Logística de entrega digital por región --------------------------
-- La tabla lleva el nombre de la región: detalle_logistica_arequipa, _cusco o _trujillo
-- (variable :region). Registra a QUÉ cuenta y por QUÉ canal se entregó cada pedido
-- (biblioteca propia o regalo) y el departamento del cliente.
\if :{?region}
\else
  \echo 'ERROR: ejecuta con  -v region=arequipa|cusco|trujillo'
  \quit
\endif

SELECT format($q$
  CREATE TABLE IF NOT EXISTS %1$I (
    id_logistica   serial        PRIMARY KEY,
    id_pedido      integer       NOT NULL UNIQUE REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    zona           varchar(40)   NOT NULL,                      -- departamento del cliente
    canal          varchar(10)   NOT NULL CHECK (canal IN ('BIBLIOTECA','REGALO')),
    destinatario   varchar(80),                                 -- correo de quien recibe el regalo
    mensaje        varchar(200),
    entregado_en   timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (canal <> 'REGALO' OR destinatario IS NOT NULL)
  )$q$, 'detalle_logistica_' || :'region') \gexec

SELECT format('CREATE INDEX IF NOT EXISTS %I ON %I(destinatario)', 'ix_logistica_destinatario_' || :'region', 'detalle_logistica_' || :'region') \gexec

CREATE INDEX IF NOT EXISTS ix_pedido_usuario ON pedido(id_usuario, fecha_pedido DESC);
CREATE INDEX IF NOT EXISTS ix_pedido_estado  ON pedido(estado);

-- =============================================================================
-- Lógica de negocio
-- =============================================================================

-- Semana 9 · Descuenta stock de forma transaccional. Si no alcanza, la
-- excepción hace ROLLBACK de toda la transacción que la invocó.
CREATE OR REPLACE PROCEDURE sp_descontar_stock(p_id_juego integer, p_cantidad integer)
LANGUAGE plpgsql AS $$
DECLARE
  v_stock integer;
BEGIN
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor que cero (recibido: %)', p_cantidad
      USING ERRCODE = '22023';
  END IF;

  -- FOR UPDATE bloquea la fila: dos compras simultáneas no pueden vender
  -- la misma clave dos veces.
  SELECT stock INTO v_stock FROM juego WHERE id_juego = p_id_juego AND activo FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El juego % no existe o está inactivo', p_id_juego USING ERRCODE = 'P0002';
  END IF;
  IF v_stock < p_cantidad THEN
    RAISE EXCEPTION 'Sin claves disponibles para el juego %: quedan %, solicitadas %',
      p_id_juego, v_stock, p_cantidad USING ERRCODE = 'P0001';
  END IF;

  UPDATE juego
     SET stock = stock - p_cantidad, actualizado = CURRENT_TIMESTAMP
   WHERE id_juego = p_id_juego;
END $$;

-- Devuelve claves al inventario (reembolso de un pedido).
CREATE OR REPLACE PROCEDURE sp_reponer_stock(p_id_juego integer, p_cantidad integer)
LANGUAGE plpgsql AS $$
BEGIN
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor que cero (recibido: %)', p_cantidad
      USING ERRCODE = '22023';
  END IF;
  UPDATE juego
     SET stock = stock + p_cantidad, actualizado = CURRENT_TIMESTAMP
   WHERE id_juego = p_id_juego;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El juego % no existe', p_id_juego USING ERRCODE = 'P0002';
  END IF;
END $$;

-- Semana 10 · Registra cada cambio de estado del pedido (alta y actualizaciones).
-- El comentario puede indicarse con  SELECT set_config('app.comentario', '...', true)
-- justo antes del INSERT/UPDATE; si no se indica, se usa un texto por defecto.
CREATE OR REPLACE FUNCTION fn_registrar_estado_pedido() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_coment text := NULLIF(current_setting('app.comentario', true), '');
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO historial_estados(id_pedido, estado_anterior, estado_nuevo, comentario)
    VALUES (NEW.id_pedido, NULL, NEW.estado, COALESCE(v_coment, 'Pedido creado'));
  ELSIF NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO historial_estados(id_pedido, estado_anterior, estado_nuevo, comentario)
    VALUES (NEW.id_pedido, OLD.estado, NEW.estado, COALESCE(v_coment, 'Cambio de estado'));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_historial_estados ON pedido;
CREATE TRIGGER trg_historial_estados
AFTER INSERT OR UPDATE OF estado ON pedido
FOR EACH ROW EXECUTE FUNCTION fn_registrar_estado_pedido();

-- Ciclo de vida: PENDIENTE → PAGADO → ENTREGADO; REEMBOLSADO es final y se alcanza
-- desde PAGADO o ENTREGADO. Impide saltos inválidos (p. ej. ENTREGADO → PENDIENTE).
CREATE OR REPLACE FUNCTION fn_validar_transicion_estado() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  orden text[] := ARRAY['PENDIENTE','PAGADO','ENTREGADO'];
BEGIN
  IF NEW.estado = OLD.estado THEN RETURN NEW; END IF;
  IF OLD.estado = 'REEMBOLSADO' THEN
    RAISE EXCEPTION 'El pedido % ya está REEMBOLSADO y no admite cambios', OLD.codigo;
  END IF;
  IF NEW.estado = 'REEMBOLSADO' THEN RETURN NEW; END IF;
  IF array_position(orden, NEW.estado) < array_position(orden, OLD.estado) THEN
    RAISE EXCEPTION 'Transición inválida: % -> %', OLD.estado, NEW.estado;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validar_transicion ON pedido;
CREATE TRIGGER trg_validar_transicion
BEFORE UPDATE OF estado ON pedido
FOR EACH ROW EXECUTE FUNCTION fn_validar_transicion_estado();
