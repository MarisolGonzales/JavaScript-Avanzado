# Capa de datos distribuida · PostgreSQL + `postgres_fdw` (Semanas 9 y 10)

```
                     ┌────────────────────────── nexus_central ──────────────────────────┐
                     │ juego (catálogo maestro) ──triggers replicar_catalogo_*──┐         │
                     │ usuario · ticket · vistas v_pedidos_global / v_detalle_global /    │
                     │ v_ventas_por_nodo / v_stock_global / v_stock_bajo        │         │
                     │ servidores srv_norte · srv_sur · srv_centro (postgres_fdw)         │
                     └───────────────┬──────────────────┬───────────────────┬─┘         │
                       FOREIGN TABLE │                  │                   │
                  nodo_norte.*       │   nodo_sur.*     │   nodo_centro.*   │
                     ┌───────────────▼──┐ ┌─────────────▼────┐ ┌────────────▼─────┐
                     │ nexus_trujillo   │ │ nexus_arequipa   │ │ nexus_cusco      │
                     │ NORTE            │ │ SUR              │ │ CENTRO           │
                     │ claves · carrito │ │ (mismo esquema)  │ │ (mismo esquema)  │
                     │ pedido · pago …  │ │                  │ │                  │
                     └──────────────────┘ └──────────────────┘ └──────────────────┘
```

Es una tienda de **juegos digitales**: el cliente no ve ni elige servidores. Su **departamento** decide cuál guarda sus pedidos
(fragmentación por región). Los tres nodos viven en la misma instancia (`localhost:5432`) para el laboratorio; en producción bastaría cambiar `host`/`port`.

## Instalación

```powershell
# Windows (psql en el PATH)
$env:PGPASSWORD = "clave_de_postgres"
.\instalar.ps1
```
```bash
# Linux / macOS / Git Bash
PGPASSWORD=clave_de_postgres ./instalar.sh
```

Es **repetible**: se puede ejecutar de nuevo sobre una instalación existente. Verificación: `psql -U postgres -d nexus_central -f 99_verificacion.sql` (imprime `OK:` en cada comprobación).
Las cuentas de demostración las crea la API la primera vez que se conecta (el hash de las contraseñas lo calcula Node, no el SQL).

| Script | Qué hace |
|---|---|
| `00_roles_y_bases.sql` | Rol `admin_nova` y las 4 bases de datos |
| `01_esquema_nodo.sql` | Esquema de **un nodo**: `juego`, `carrito`, `item_carrito`, `pedido`, `detalle_pedido`, `pago`, `comprobante` (boleta o factura), `historial_estados`, `detalle_logistica_<región>`, `sp_descontar_stock`, `sp_reponer_stock` y triggers de estado |
| `02_central_fdw.sql` | Servidores remotos, `USER MAPPING`, `FOREIGN TABLE`, catálogo maestro, `usuario`, `ticket`, funciones/triggers `replicar_catalogo_*` y vistas globales |
| `03_datos_iniciales.sql` | 10 juegos; al insertarlos los triggers los replican a los 3 nodos |
| `99_verificacion.sql` | Comprueba la replicación, que el stock local no se pisa y la baja lógica |

## Piezas pedidas en el curso

**Semana 9:** `CREATE SERVER srv_norte | srv_sur | srv_centro` · `CREATE USER MAPPING` para `admin_nova` y `postgres` · `FOREIGN TABLE` `nodo_norte.pedido`, `nodo_sur.pedido`, `nodo_centro.pedido` (+ `IMPORT FOREIGN SCHEMA`) · `sp_descontar_stock(integer, integer)` transaccional (`FOR UPDATE`, excepción si no hay claves).

**Semana 10:** `carrito` / `item_carrito` (un solo carrito abierto por usuario; `tipo_entrega` DIGITAL | REGALO) · `pedido` / `detalle_pedido` / `pago` / `comprobante` · `historial_estados` con `fecha_cambio … DEFAULT CURRENT_TIMESTAMP`, alimentada por trigger, y otro trigger que impide transiciones inválidas (ciclo PENDIENTE → PAGADO → ENTREGADO; REEMBOLSADO es final) · `replicar_catalogo_arequipa()` (+ `_cusco`, `_trujillo`) · `detalle_logistica_arequipa` (+ `_cusco`, `_trujillo`).

Adaptación a tienda digital: `detalle_logistica_*` registra la **entrega digital** (departamento del cliente, canal BIBLIOTECA o REGALO, destinatario y mensaje) y `pedido.fecha_estimada` es el momento de entrega (inmediato). El `comprobante` exige RUC y razón social cuando es factura.

## Cosas que aprendimos al probarlo

- `postgres_fdw` **no soporta** `INSERT … ON CONFLICT DO UPDATE`; la réplica hace `UPDATE` y, si no afectó filas, `INSERT`.
- En PL/pgSQL, `FOUND` **no se actualiza** con `EXECUTE`; hay que leer `GET DIAGNOSTICS … ROW_COUNT`.
- En un `INSERT` por FDW los `DEFAULT` remotos no se aplican: se envían todas las columnas.
- El stock se envía solo al **crear** el juego: replicarlo siempre pisaría las ventas de cada servidor.

## Seguridad

`cambiar_esta_clave` es una clave de ejemplo: cámbiala en `00_roles_y_bases.sql`, en el `USER MAPPING` de `02_central_fdw.sql` y en `.env`.
Las claves del `USER MAPPING` quedan en el catálogo de PostgreSQL; limita quién puede leer `pg_user_mappings`.
