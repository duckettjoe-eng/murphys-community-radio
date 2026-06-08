create extension if not exists pgcrypto;

create table if not exists public.archive_episodes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  status text not null default 'published',
  platform text not null default 'Mixcloud',
  account_slug text not null,
  source_id text not null,
  source_label text not null,
  host_name text not null,
  show_name text not null,
  show_slug text not null,
  episode_title text not null,
  episode_url text not null,
  mixcloud_key text not null,
  published_at timestamptz,
  source_created_at timestamptz,
  artwork_url text,
  embed_url text
);

create unique index if not exists archive_episodes_mixcloud_key_uidx
  on public.archive_episodes (mixcloud_key);

create unique index if not exists archive_episodes_episode_url_uidx
  on public.archive_episodes (episode_url);

create index if not exists archive_episodes_status_published_idx
  on public.archive_episodes (status, published_at desc);

alter table public.archive_episodes enable row level security;

revoke all on table public.archive_episodes from anon, authenticated;
