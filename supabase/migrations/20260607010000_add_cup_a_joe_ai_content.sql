alter table public.cup_a_joe_items
  add column if not exists talking_points jsonb;

create table if not exists public.cup_a_joe_show_scripts (
  show_date date primary key,
  script text not null,
  segments jsonb not null default '[]'::jsonb,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cup_a_joe_show_scripts enable row level security;

revoke all on table public.cup_a_joe_show_scripts from anon, authenticated;
