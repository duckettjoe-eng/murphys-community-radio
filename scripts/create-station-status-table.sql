create table if not exists public.station_status (
  key text primary key,
  is_live boolean not null default false,
  show_name text not null default 'Unscheduled Live Mix',
  host_name text not null default 'DJ Hello Joey',
  updated_at timestamptz not null default now()
);

insert into public.station_status (key, is_live, show_name, host_name)
values ('manual-live', false, 'Unscheduled Live Mix', 'DJ Hello Joey')
on conflict (key) do nothing;
