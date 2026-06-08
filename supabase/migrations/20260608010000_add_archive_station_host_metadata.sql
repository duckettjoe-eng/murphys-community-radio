alter table public.archive_episodes
  add column if not exists station_name text,
  add column if not exists host_username text,
  add column if not exists description text,
  add column if not exists tags jsonb not null default '[]'::jsonb;

update public.archive_episodes
set station_name = source_label
where station_name is null;

delete from public.archive_episodes
where lower(account_slug) <> 'skullcountyradio';

alter table public.archive_episodes
  alter column station_name set not null;
