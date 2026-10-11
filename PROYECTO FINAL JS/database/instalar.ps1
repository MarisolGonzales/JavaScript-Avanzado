# Instala la capa de datos distribuida de NEXUS GAMING (Windows PowerShell).
# Requiere psql en el PATH (carpeta bin de PostgreSQL).
# Uso:  $env:PGPASSWORD = "tu_clave_postgres" ; .\instalar.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$u = if ($env:PGUSER) { $env:PGUSER } else { "postgres" }
$h = if ($env:PGHOST) { $env:PGHOST } else { "localhost" }
$p = if ($env:PGPORT) { $env:PGPORT } else { "5432" }
function Run { psql -X -q -U $u -h $h -p $p -v ON_ERROR_STOP=1 @args; if ($LASTEXITCODE -ne 0) { throw "psql falló" } }

Write-Host "1/5 Roles y bases de datos..."
Run -d postgres -f 00_roles_y_bases.sql

Write-Host "2/5 Esquema de los nodos (Trujillo, Arequipa, Cusco)..."
Run -d nexus_trujillo -v region=trujillo -f 01_esquema_nodo.sql
Run -d nexus_arequipa -v region=arequipa -f 01_esquema_nodo.sql
Run -d nexus_cusco    -v region=cusco    -f 01_esquema_nodo.sql

Write-Host "3/5 Permisos del rol admin_nova..."
foreach ($db in "nexus_trujillo","nexus_arequipa","nexus_cusco","nexus_central") {
  Run -d $db -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_nova; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin_nova; GRANT ALL ON ALL ROUTINES IN SCHEMA public TO admin_nova;"
}

Write-Host "4/5 Base central: FDW, catálogo maestro y triggers de replicación..."
Run -d nexus_central -f 02_central_fdw.sql

Write-Host "5/5 Catálogo inicial (se replica a los 3 nodos)..."
Run -d nexus_central -f 03_datos_iniciales.sql

Write-Host "Listo. Verifica con:  psql -U $u -d nexus_central -f 99_verificacion.sql"
