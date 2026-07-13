-- =====================================================================
-- Esquema para el modo nube (Supabase / Postgres).
--
-- Formato JSONB uniforme: una tabla por tipo de entidad, cada fila guarda el
-- objeto completo en la columna `data`. Esto refleja 1:1 los tipos de
-- src/lib/types.ts, evita mapeo de columnas y hace la sincronizacion trivial.
-- El aislamiento multiusuario se hace por la columna `owner` + Row Level
-- Security (cada usuario ve solo sus datos).
--
-- Ejecutar completo en el SQL Editor de Supabase.
-- =====================================================================

create extension if not exists "pgcrypto";

-- Crea las 8 tablas de entidades con estructura uniforme.
do $$
declare t text;
begin
  foreach t in array array[
    'materials','products','movements','customers',
    'stages','orders','designs','posts'
  ]
  loop
    execute format($f$
      create table if not exists %I (
        id text primary key,
        owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
        data jsonb not null,
        updated_at timestamptz not null default now()
      );
    $f$, t);

    execute format('alter table %I enable row level security;', t);

    -- Politica: el dueno puede hacer todo sobre sus filas.
    execute format($f$
      create policy "owner_all_%1$s" on %1$s
      for all using (owner = auth.uid()) with check (owner = auth.uid());
    $f$, t);

    -- Indice por dueno para acelerar la carga.
    execute format('create index if not exists idx_%1$s_owner on %1$s(owner);', t);
  end loop;
end $$;

-- Lectura publica de productos marcados para el catalogo (venta social / redes).
-- Permite mostrar el catalogo sin sesion iniciada.
create policy "catalogo_publico_read" on products
  for select using ((data->>'catalogoPublico')::boolean = true);
