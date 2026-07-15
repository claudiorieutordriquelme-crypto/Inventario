-- =====================================================================
-- Acceso publico (sin login): la app entra directo y usa la anon key.
-- Reemplaza las politicas por-usuario (owner = auth.uid()) por acceso total,
-- y hace opcional la columna owner (los inserts anonimos no tienen uid).
--
-- ADVERTENCIA: con esto, cualquiera con la anon key / el enlace de la app puede
-- LEER y ESCRIBIR todos los datos (incluida informacion de clientes). Es la
-- decision tomada de "acceso directo / nube compartida".
--
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'materials','products','movements','customers',
    'stages','orders','designs','posts','ideas'
  ]
  loop
    -- owner ya no es obligatorio (inserts anonimos)
    execute format('alter table %I alter column owner drop not null;', t);
    -- quitar la politica por-usuario
    execute format('drop policy if exists "owner_all_%1$s" on %1$s;', t);
    -- acceso total (lectura y escritura) para anon y authenticated
    execute format('drop policy if exists "public_all_%1$s" on %1$s;', t);
    execute format('create policy "public_all_%1$s" on %1$s for all using (true) with check (true);', t);
  end loop;
end $$;
