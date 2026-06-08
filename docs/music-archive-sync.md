# Music Archive Sync

The Music Archive sync reads public Skull County Radio uploads from the
Mixcloud API and stores them in the Supabase `archive_episodes` table. Each
cloudcast detail response supplies the station account and, when present, its
host attribution. Separate DJ account uploads are not required.

## Setup

Apply the Supabase migration:

```bash
supabase db push
```

Configure these local variables in `.env.local`:

```text
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MIXCLOUD_ARCHIVE_SLUGS=skullcountyradio
```

`MIXCLOUD_ARCHIVE_SLUGS` is optional. `skullcountyradio` is used by default.

For the daily GitHub Actions workflow, add `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` as repository secrets. Optionally add
`MIXCLOUD_ARCHIVE_SLUGS` as a repository variable.

## Manual Sync

```bash
npm run archive:mixcloud
```

The command upserts uploads by Mixcloud key so station and host metadata can
be corrected without creating duplicates. Repeated show names remain separate
episodes.

Host attribution comes from the cloudcast detail response's `hosts` array.
When Mixcloud has not supplied a host, the sync checks the title, description,
and tags. The pending-host upload titled `Life of a G (Driving Music Vol. 1)`
is attributed to DJ Donette G until Mixcloud supplies direct host metadata.
