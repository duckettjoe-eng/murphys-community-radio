alter table public.cup_a_joe_items
  add column if not exists estimated_minutes numeric not null default 1,
  add column if not exists completed_at timestamptz;

update public.cup_a_joe_items
set estimated_minutes = case segment
  when 'Opening' then 1
  when 'Local Headlines' then 2
  when 'Weather' then 1
  when 'Events' then 1
  when 'Community Notes' then 1
  when 'Music Breaks' then 0
  when 'Closing' then 1
  else 1
end
where estimated_minutes = 1;
