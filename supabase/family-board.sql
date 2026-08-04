-- Eseguire una sola volta nel SQL Editor del progetto Supabase.
create extension if not exists pgcrypto;

create table if not exists public.vf_families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_hash text not null unique
);

create table if not exists public.vf_family_members (
  family_id uuid not null references public.vf_families(id) on delete cascade,
  user_id uuid not null,
  display_name text not null check (char_length(display_name) between 2 and 40),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table if not exists public.vf_family_messages (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.vf_families(id) on delete cascade,
  author_id uuid not null,
  author_name text not null,
  kind text not null check (kind in ('partita', 'squadra', 'logistica', 'altro')),
  content text not null check (char_length(content) between 1 and 500),
  match_id text,
  created_at timestamptz not null default now()
);

alter table public.vf_families enable row level security;
alter table public.vf_family_members enable row level security;
alter table public.vf_family_messages enable row level security;
revoke all on public.vf_families, public.vf_family_members, public.vf_family_messages from anon, authenticated;

create or replace function public.vf_join_family(p_invite_code text, p_display_name text)
returns void
language plpgsql security definer set search_path = public
as $$
declare selected_family uuid;
begin
  if auth.uid() is null then raise exception 'VF_AUTH_REQUIRED'; end if;
  if char_length(trim(p_display_name)) not between 2 and 40 then raise exception 'VF_INVALID_NAME'; end if;
  select id into selected_family from public.vf_families
    where invite_hash = encode(extensions.digest(trim(p_invite_code), 'sha256'), 'hex');
  if selected_family is null then raise exception 'VF_INVALID_INVITE'; end if;
  insert into public.vf_family_members(family_id, user_id, display_name)
  values (selected_family, auth.uid(), trim(p_display_name))
  on conflict (family_id, user_id) do update set display_name = excluded.display_name;
end;
$$;

create or replace function public.vf_list_family_messages()
returns table(id uuid, "authorName" text, kind text, content text, "matchId" text, "createdAt" timestamptz, "ownedByMe" boolean)
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.vf_family_members where user_id = auth.uid()) then raise exception 'VF_NOT_MEMBER'; end if;
  return query select m.id, m.author_name, m.kind, m.content, m.match_id, m.created_at, m.author_id = auth.uid()
    from public.vf_family_messages m
    where m.family_id in (select fm.family_id from public.vf_family_members fm where fm.user_id = auth.uid())
    order by m.created_at desc limit 100;
end;
$$;

create or replace function public.vf_post_family_message(p_content text, p_kind text, p_match_id text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare member public.vf_family_members; new_id uuid;
begin
  select * into member from public.vf_family_members where user_id = auth.uid() limit 1;
  if member.user_id is null then raise exception 'VF_NOT_MEMBER'; end if;
  if p_kind not in ('partita', 'squadra', 'logistica', 'altro') then raise exception 'VF_INVALID_KIND'; end if;
  insert into public.vf_family_messages(family_id, author_id, author_name, kind, content, match_id)
  values (member.family_id, auth.uid(), member.display_name, p_kind, trim(p_content), nullif(trim(p_match_id), '')) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.vf_delete_family_message(p_message_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.vf_family_messages where id = p_message_id and author_id = auth.uid();
end;
$$;

revoke all on function public.vf_join_family(text, text), public.vf_list_family_messages(), public.vf_post_family_message(text, text, text), public.vf_delete_family_message(uuid) from public;
grant execute on function public.vf_join_family(text, text), public.vf_list_family_messages(), public.vf_post_family_message(text, text, text), public.vf_delete_family_message(uuid) to authenticated;

insert into public.vf_families(name, invite_hash)
values ('Volley Family', 'e79955d72b1007ea278a0977d1d7a7324b68ecf219621ce527b9bc6b17bc76e8')
on conflict (invite_hash) do nothing;
