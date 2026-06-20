create table if not exists scans (
  id text primary key,
  root text not null,
  started_at text not null,
  track_count integer not null,
  total_bytes integer not null,
  known_runtime_seconds real not null,
  unknown_runtime_count integer not null
);

create table if not exists tracks (
  id integer primary key autoincrement,
  scan_id text not null references scans(id) on delete cascade,
  path text not null,
  relative_folder text not null,
  filename text not null,
  extension text not null,
  file_size_bytes integer not null,
  title text not null,
  artist text not null,
  album text not null,
  genre text not null,
  year text not null,
  duration_seconds real,
  proposed_bucket text not null,
  live365_readiness text not null
);

create index if not exists idx_tracks_scan_id on tracks(scan_id);
create index if not exists idx_tracks_path on tracks(path);
