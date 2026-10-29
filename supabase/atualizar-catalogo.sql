-- Execute no SQL Editor depois de ativar-equipe.sql.
-- Amplia o catálogo existente sem apagar artistas nem acessos da equipe.
begin;

alter table public.avare_artistas add column if not exists perfil jsonb not null default '{}'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.avare_artistas'::regclass and conname = 'avare_perfil_valido') then
    alter table public.avare_artistas add constraint avare_perfil_valido
      check (jsonb_typeof(perfil) = 'object' and octet_length(perfil::text) <= 24000);
  end if;
end $$;
grant select (id, perfil) on public.avare_artistas to anon;

-- Fotos públicas: só a equipe pode enviar arquivos para sua própria pasta.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avare-perfis', 'avare-perfis', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists avare_fotos_envio on storage.objects;
create policy avare_fotos_envio on storage.objects for insert to authenticated with check (
  bucket_id = 'avare-perfis' and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.avare_equipe where user_id = (select auth.uid()))
);

create table if not exists public.avare_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  artista_id uuid not null references public.avare_artistas(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nome_exibicao text not null check (char_length(btrim(nome_exibicao)) between 2 and 80),
  nota integer not null check (nota between 1 and 5),
  comentario text not null check (char_length(btrim(comentario)) between 10 and 2000),
  aprovado boolean not null default false,
  rejeitado boolean not null default false,
  criado_em timestamptz not null default now(),
  enviado_em timestamptz not null default now(),
  check (not (aprovado and rejeitado)),
  unique (artista_id, usuario_id)
);
create index if not exists avare_avaliacoes_usuario_envio on public.avare_avaliacoes(usuario_id, enviado_em);
create index if not exists avare_avaliacoes_artista on public.avare_avaliacoes(artista_id);
alter table public.avare_avaliacoes enable row level security;
revoke all on public.avare_avaliacoes from anon, authenticated;
grant select on public.avare_avaliacoes to authenticated;
grant update (aprovado, rejeitado) on public.avare_avaliacoes to authenticated;

drop policy if exists equipe_consulta_avaliacoes on public.avare_avaliacoes;
create policy equipe_consulta_avaliacoes on public.avare_avaliacoes for select to authenticated using (
  exists (select 1 from public.avare_equipe where user_id = (select auth.uid()))
);
drop policy if exists equipe_modera_avaliacoes on public.avare_avaliacoes;
create policy equipe_modera_avaliacoes on public.avare_avaliacoes for update to authenticated using (
  exists (select 1 from public.avare_equipe where user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.avare_equipe where user_id = (select auth.uid()))
);

-- Estas views expõem exclusivamente textos aprovados de artistas publicados.
-- Não incluem e-mails, IDs de usuários ou comentários aguardando revisão.
create or replace view public.avare_avaliacoes_publicas with (security_barrier = true) as
select r.id, r.artista_id, r.nome_exibicao, r.nota, r.comentario, r.enviado_em as criado_em
from public.avare_avaliacoes r join public.avare_artistas a on a.id = r.artista_id
where r.aprovado and not r.rejeitado and a.publicado;
revoke all on public.avare_avaliacoes_publicas from anon, authenticated;
grant select on public.avare_avaliacoes_publicas to anon, authenticated;

create or replace view public.avare_notas_publicas with (security_barrier = true) as
select artista_id, count(*)::integer as total, round(avg(nota), 1) as media
from public.avare_avaliacoes_publicas group by artista_id;
revoke all on public.avare_notas_publicas from anon, authenticated;
grant select on public.avare_notas_publicas to anon, authenticated;

create or replace function public.avare_enviar_avaliacao(p_artista uuid, p_nome text, p_nota integer, p_comentario text)
returns void language plpgsql security definer set search_path = '' as $$
declare pessoa uuid := auth.uid();
begin
  if pessoa is null or not exists (select 1 from auth.users where id = pessoa and email_confirmed_at is not null) then
    raise exception 'Confirme seu e-mail para avaliar.';
  end if;
  if p_nome is null or p_comentario is null or p_nota is null
    or char_length(btrim(p_nome)) not between 2 and 80
    or p_nota not between 1 and 5
    or char_length(btrim(p_comentario)) not between 10 and 2000 then
    raise exception 'Confira nome, nota e comentário.';
  end if;
  if not exists (select 1 from public.avare_artistas where id = p_artista and publicado) then
    raise exception 'Artista não disponível para avaliação.';
  end if;
  -- Serializa envios da mesma conta e limita a frequência no servidor.
  perform pg_advisory_xact_lock(hashtext(pessoa::text));
  if exists (select 1 from public.avare_avaliacoes where usuario_id = pessoa and enviado_em > now() - interval '60 seconds') then
    raise exception 'Aguarde um minuto antes de enviar outra avaliação.';
  end if;
  if (select count(*) from public.avare_avaliacoes where usuario_id = pessoa and not aprovado and not rejeitado and artista_id <> p_artista) >= 10 then
    raise exception 'Aguarde a revisão das avaliações anteriores.';
  end if;
  insert into public.avare_avaliacoes (artista_id, usuario_id, nome_exibicao, nota, comentario)
  values (p_artista, pessoa, btrim(p_nome), p_nota, btrim(p_comentario))
  on conflict (artista_id, usuario_id) do update set
    nome_exibicao = excluded.nome_exibicao, nota = excluded.nota, comentario = excluded.comentario,
    aprovado = false, rejeitado = false, enviado_em = now();
end $$;
revoke all on function public.avare_enviar_avaliacao(uuid,text,integer,text) from public, anon;
grant execute on function public.avare_enviar_avaliacao(uuid,text,integer,text) to authenticated;

commit;
