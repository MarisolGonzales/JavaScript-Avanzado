-- =============================================================================
-- NEXUS GAMING · Semana 9 · Paso 0: roles y bases de datos de cada nodo
-- Ejecutar conectado como superusuario (postgres) a la base "postgres":
--   psql -U postgres -f 00_roles_y_bases.sql
-- =============================================================================

-- Rol de aplicación. CAMBIA la clave antes de usar fuera del laboratorio.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_nova') THEN
    CREATE ROLE admin_nova LOGIN PASSWORD 'cambiar_esta_clave';
  END IF;
END $$;

-- Una base de datos por nodo regional (simulan sedes descentralizadas).
--   nexus_central  -> base maestra: catálogo y consultas globales (FDW)
--   nexus_trujillo -> nodo NORTE
--   nexus_arequipa -> nodo SUR
--   nexus_cusco    -> nodo CENTRO
SELECT format('CREATE DATABASE %I OWNER admin_nova', d)
FROM unnest(ARRAY['nexus_central','nexus_trujillo','nexus_arequipa','nexus_cusco']) AS d
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = d)
\gexec
