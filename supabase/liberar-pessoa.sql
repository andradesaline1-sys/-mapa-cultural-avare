-- Primeiro crie/convide a pessoa em Authentication > Users.
-- Troque apenas o e-mail abaixo. Execute novamente para cada pessoa autorizada.
do $$
declare
  email_da_pessoa text := 'TROQUE-PELO-EMAIL-DA-PESSOA';
  pessoa uuid;
begin
  select id into pessoa from auth.users where lower(email) = lower(email_da_pessoa);
  if pessoa is null then
    raise exception 'Conta não encontrada. Crie/convide a pessoa em Authentication > Users primeiro.';
  end if;
  insert into public.avare_equipe (user_id) values (pessoa) on conflict do nothing;
end $$;
