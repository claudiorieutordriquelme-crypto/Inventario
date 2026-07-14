-- =====================================================================
-- Tabla para el modulo Planning (ideas / productos en desarrollo).
-- Misma estructura JSONB uniforme + RLS por owner que el resto.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
-- =====================================================================

create table if not exists ideas (
  id text primary key,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table ideas enable row level security;

create policy "owner_all_ideas" on ideas
  for all using (owner = auth.uid()) with check (owner = auth.uid());

create index if not exists idx_ideas_owner on ideas(owner);
