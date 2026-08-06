-- Eseguire una sola volta nel SQL Editor, dopo family-board.sql.
-- Prima di eseguire questo file, salvare nel Vault di Supabase un token GitHub
-- fine-grained chiamato vf_github_actions_token, limitato al repository
-- 8jmbgntvmv-max/volley-family con permesso Actions: Read and write.

create extension if not exists pg_net with schema extensions;

create table if not exists public.vf_news_refresh_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null,
  requested_at timestamptz not null default now(),
  github_request_id bigint
);

create table if not exists public.vf_news_links (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.vf_families(id) on delete cascade,
  submitted_by uuid not null,
  team text not null check (team in ('altino', 'matese', 'perugia')),
  title text not null check (char_length(title) between 3 and 180),
  url text not null,
  created_at timestamptz not null default now(),
  unique (family_id, url)
);

alter table public.vf_news_refresh_requests enable row level security;
alter table public.vf_news_links enable row level security;
revoke all on public.vf_news_refresh_requests, public.vf_news_links from anon, authenticated;

create or replace function public.vf_request_news_refresh()
returns jsonb
language plpgsql security definer set search_path = public, extensions, vault, net
as $$
declare
  last_request timestamptz;
  github_token text;
  net_request_id bigint;
begin
  if auth.uid() is null then raise exception 'VF_AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.vf_family_members where user_id = auth.uid()) then
    raise exception 'VF_NOT_MEMBER';
  end if;

  select max(requested_at) into last_request from public.vf_news_refresh_requests;
  if last_request is not null and last_request > now() - interval '3 minutes' then
    return jsonb_build_object('accepted', false, 'reason', 'cooldown', 'requestedAt', last_request);
  end if;

  select decrypted_secret into github_token
  from vault.decrypted_secrets
  where name = 'vf_github_actions_token'
  order by created_at desc limit 1;
  if coalesce(github_token, '') = '' then raise exception 'VF_REFRESH_NOT_CONFIGURED'; end if;

  select net.http_post(
    url := 'https://api.github.com/repos/8jmbgntvmv-max/volley-family/actions/workflows/deploy.yml/dispatches',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || github_token,
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2026-03-10',
      'User-Agent', 'Volley-Family'
    ),
    body := jsonb_build_object('ref', 'main')
  ) into net_request_id;

  insert into public.vf_news_refresh_requests(requested_by, github_request_id)
  values (auth.uid(), net_request_id);
  return jsonb_build_object('accepted', true, 'requestId', net_request_id, 'requestedAt', now());
end;
$$;

create or replace function public.vf_submit_news_link(p_team text, p_title text, p_url text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  member public.vf_family_members;
  new_id uuid;
  clean_url text := trim(p_url);
begin
  select * into member from public.vf_family_members where user_id = auth.uid() limit 1;
  if member.user_id is null then raise exception 'VF_NOT_MEMBER'; end if;
  if p_team not in ('altino', 'matese', 'perugia')
    or char_length(trim(p_title)) not between 3 and 180
    or clean_url !~* '^https://(www\.)?(instagram\.com|facebook\.com)/' then
    raise exception 'VF_INVALID_NEWS_LINK';
  end if;
  insert into public.vf_news_links(family_id, submitted_by, team, title, url)
  values (member.family_id, auth.uid(), p_team, trim(p_title), clean_url)
  on conflict (family_id, url) do update set title = excluded.title, team = excluded.team
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.vf_list_public_news_links()
returns table(id uuid, team text, title text, url text, "createdAt" timestamptz)
language sql security definer set search_path = public
as $$
  select l.id, l.team, l.title, l.url, l.created_at
  from public.vf_news_links l
  order by l.created_at desc
  limit 100;
$$;

revoke all on function public.vf_request_news_refresh(), public.vf_submit_news_link(text, text, text), public.vf_list_public_news_links() from public;
grant execute on function public.vf_request_news_refresh(), public.vf_submit_news_link(text, text, text) to authenticated;
grant execute on function public.vf_list_public_news_links() to anon, authenticated;
