-- Execute uma vez no SQL Editor do projeto Supabase. Não altera o catálogo legado.
begin;

create table public.avare_equipe (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

create table public.avare_artistas (
  id uuid primary key default gen_random_uuid(),
  nome_artistico text not null check (char_length(btrim(nome_artistico)) between 1 and 160),
  biografia text not null default '' check (char_length(biografia) <= 5000),
  areas_atuacao text[] not null default '{}' check (cardinality(areas_atuacao) <= 20 and array_position(areas_atuacao, null) is null),
  publicado boolean not null default false,
  criado_em timestamptz not null default now()
);

alter table public.avare_equipe enable row level security;
alter table public.avare_artistas enable row level security;

revoke all on public.avare_equipe from anon, authenticated;
revoke all on public.avare_artistas from anon, authenticated;
grant select on public.avare_equipe to authenticated;
grant select (nome_artistico, biografia, areas_atuacao, publicado) on public.avare_artistas to anon;
grant select, insert, update on public.avare_artistas to authenticated;

create policy equipe_consulta_propria on public.avare_equipe
  for select to authenticated using (user_id = (select auth.uid()));

create policy catalogo_publicado on public.avare_artistas
  for select to anon, authenticated using (publicado = true);

create policy equipe_consulta_todos on public.avare_artistas
  for select to authenticated using (
    exists (select 1 from public.avare_equipe where user_id = (select auth.uid()))
  );

create policy equipe_cadastra on public.avare_artistas
  for insert to authenticated with check (
    exists (select 1 from public.avare_equipe where user_id = (select auth.uid()))
  );

create policy equipe_edita on public.avare_artistas
  for update to authenticated using (
    exists (select 1 from public.avare_equipe where user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.avare_equipe where user_id = (select auth.uid()))
  );

commit;
