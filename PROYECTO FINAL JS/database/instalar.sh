#!/usr/bin/env bash
# Instala la capa de datos distribuida de NEXUS GAMING (Linux / macOS / Git Bash).
# Uso:  PGPASSWORD=tu_clave_postgres ./instalar.sh
set -euo pipefail
cd "$(dirname "$0")"

PGUSER="${PGUSER:-postgres}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
run() { psql -X -q -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -v ON_ERROR_STOP=1 "$@"; }

echo "1/5 Roles y bases de datos..."
run -d postgres -f 00_roles_y_bases.sql

echo "2/5 Esquema de los nodos (Trujillo, Arequipa, Cusco)..."
run -d nexus_trujillo -v region=trujillo -f 01_esquema_nodo.sql
run -d nexus_arequipa -v region=arequipa -f 01_esquema_nodo.sql
run -d nexus_cusco    -v region=cusco    -f 01_esquema_nodo.sql

echo "3/5 Permisos del rol admin_nova..."
for db in nexus_trujillo nexus_arequipa nexus_cusco nexus_central; do
  run -d "$db" -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_nova; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin_nova; GRANT ALL ON ALL ROUTINES IN SCHEMA public TO admin_nova;"
done

echo "4/5 Base central: FDW, catálogo maestro y triggers de replicación..."
run -d nexus_central -f 02_central_fdw.sql

echo "5/5 Catálogo inicial (se replica a los 3 nodos)..."
run -d nexus_central -f 03_datos_iniciales.sql

echo "Listo. Verifica con:  psql -U $PGUSER -d nexus_central -f 99_verificacion.sql"
