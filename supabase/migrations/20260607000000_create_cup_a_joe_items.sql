create extension if not exists pgcrypto;

create table if not exists public.cup_a_joe_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  show_date date not null default current_date,
  use_in_show boolean default false,
  category text,
  title text not null,
  source text,
  url text,
  summary text,
  joe_notes text,
  segment text default 'Local Headlines',
  sort_order int default 0
);

create index if not exists cup_a_joe_items_show_date_idx
  on public.cup_a_joe_items (show_date);

create index if not exists cup_a_joe_items_rundown_idx
  on public.cup_a_joe_items (show_date, use_in_show, segment, sort_order);

alter table public.cup_a_joe_items enable row level security;

revoke all on table public.cup_a_joe_items from anon, authenticated;
