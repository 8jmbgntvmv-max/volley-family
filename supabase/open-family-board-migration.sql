-- Eseguire una volta nel SQL Editor Supabase per aprire l'app e la bacheca
-- a chiunque usi il link pubblico. I messaggi esistenti restano nella stessa famiglia.
begin;

-- Mantiene la famiglia già usata dalla bacheca esistente; crea la riga solo
-- se il database non contiene ancora quella famiglia.
update public.vf_families
set name = 'Volley Family'
where invite_hash = 'e79955d72b1007ea278a0977d1d7a7324b68ecf219621ce527b9bc6b17bc76e8';

insert into public.vf_families(name, invite_hash)
select 'Volley Family', 'open-family-board-v1'
where not exists (
  select 1 from public.vf_families
  where invite_hash = 'e79955d72b1007ea278a0977d1d7a7324b68ecf219621ce527b9bc6b17bc76e8'
)
on conflict (invite_hash) do nothing;

drop function if exists public.vf_join_family(text, text);

create or replace function public.vf_join_family(p_display_name text)
returns void
language plpgsql security definer set search_path = public
as $$
declare selected_family uuid;
begin
  if auth.uid() is null then raise exception 'VF_AUTH_REQUIRED'; end if;
  if char_length(trim(p_display_name)) not between 2 and 40 then raise exception 'VF_INVALID_NAME'; end if;

  select id into selected_family
  from public.vf_families
  where name = 'Volley Family'
  order by (invite_hash = 'e79955d72b1007ea278a0977d1d7a7324b68ecf219621ce527b9bc6b17bc76e8') desc, id
  limit 1;
  if selected_family is null then raise exception 'VF_FAMILY_NOT_CONFIGURED'; end if;

  insert into public.vf_family_members(family_id, user_id, display_name)
  values (selected_family, auth.uid(), trim(p_display_name))
  on conflict (family_id, user_id) do update set display_name = excluded.display_name;
end;
$$;

revoke all on function public.vf_join_family(text) from public;
grant execute on function public.vf_join_family(text) to authenticated;

commit;
