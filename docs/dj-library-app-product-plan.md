# DJ Library App Product Plan

## Name

Crate OS by XTRAGOODLABS.

## Product Idea

A local-first app for DJs with massive libraries who need to inventory, clean, sort, audition, playlist, prepare, and publish music without losing control of their files.

The app should feel like a command center for real working DJs, not a streaming service clone. It should be honest about rights, metadata, duplicates, cue sheets, radio readiness, and platform quirks.

## Audience

- DJs with very large local music libraries
- community radio hosts
- mobile DJs who need dependable show prep
- internet radio programmers using Live365 or similar platforms
- collectors who need to find what is actually in their drives

## Donation Model

Release the core app as pay-what-you-want / donation-supported.

Good channels to evaluate:

- Gumroad: simple pay-what-you-want digital downloads
- itch.io: good for indie tools, pay-what-you-want, versioned downloads
- Ko-fi: good for donation/support with downloads or supporter posts
- GitHub Sponsors plus public releases: good if the project becomes open source

Recommended first release shape: free download with suggested donation, plus a paid supporter bundle containing templates, sample workflows, and extra guide docs.

## Current Pieces We Already Have

### Library Inventory

- `scripts/inventory-master-library.mjs`
- Scans a master music folder.
- Detects audio extensions.
- Classifies likely club, day-safe, longform, mixtape/DJ-edit, and review buckets.
- Exports CSV reports.

### Legal / Rights-Aware Library Builder

- `mcr_country_library_builder/app.py`
- SQLite-backed local library database.
- Searches public/legal music sources.
- Imports CSV artist submissions.
- Tracks source URL, download URL, license, and review status.
- Exports approved/review/rejected CSVs.
- Builds playlists and monthly show plans.
- Copies approved tracks into Mac Music library folders.

### Live365 Upload And Scheduling

- `scripts/live365-weekly-upload.mjs`
- `scripts/live365-mac-library-upload.mjs`
- `scripts/live365-country-shows.mjs`
- `scripts/live365-replay-categories.mjs`
- `scripts/live365-replay-playlists.mjs`
- `scripts/live365-replay-events.mjs`
- `scripts/live365-quarantine-mixtapes.mjs`
- Handles dry runs, uploads, cue sheets, playlists, events, replay categories, and quarantine workflows.
- Important: these scripts currently depend on Joe's local browser session and station-specific IDs. They need to become connector-based and user-configured before public release.

### Archive / Publishing

- `scripts/build-radio-archive.mjs`
- `scripts/build-and-upload-radio-archive.mjs`
- `scripts/sync-mixcloud-archive.mjs`
- Converts shows, chunks audio, generates archive metadata, syncs Mixcloud-style show archive data.

### Mobile Broadcast Setup

- `macbook-mobile-broadcast/`
- Documents djay Pro -> BlackHole -> BUTT -> Live365 setup.
- Includes safety checks for testing without going live.
- Good candidate for a guided checklist module, not core library management.

### Website / Radio Frontend

- Next.js station site with live player, show art, schedule logic, support pages, archive, and admin surfaces.
- This can become the demo/reference station template, but not the core DJ app.

## MVP App

The first public app should focus on the problem every serious DJ feels immediately:

1. Choose library folders.
2. Scan local audio files.
3. Build a searchable local catalog.
4. Detect duplicates and likely problem files.
5. Classify tracks into working buckets:
   - daytime safe
   - club / late night
   - house
   - hip-hop
   - reggae
   - country / Americana
   - longform / mixes
   - spoken word
   - needs review
6. Let the DJ correct tags and classifications.
7. Export playlists:
   - M3U / M3U8
   - CSV
   - Live365 upload plan
   - Rekordbox/Serato-friendly CSV where feasible
8. Produce a clean session report:
   - files scanned
   - missing metadata
   - duplicate candidates
   - explicit/review candidates
   - exported playlists

## Differentiators

- Local-first: no upload required just to organize a library.
- Huge-library friendly: built around scans, reports, filters, and bulk review.
- DJ-aware buckets instead of generic genre sorting.
- Radio-aware metadata checks.
- Dry-run first for destructive or platform-changing actions.
- Receipts for every operation.
- Rights-aware workflows for people who care about legal use.
- “Human-in-the-loop” review instead of pretending metadata guessing is perfect.

## App Architecture

Recommended path:

- Desktop app shell: Tauri or Electron
- Frontend: React / Next-style UI reused from this repo where practical
- Local database: SQLite
- Scanner worker: Node or Rust for filesystem/audio metadata
- Audio metadata: ffprobe / music-metadata
- Optional Python worker: keep the country/legal builder logic until ported
- Connectors:
  - Local folders
  - Apple Music folder import/export
  - Live365
  - Mixcloud/archive export
  - CSV/XLSX playlist imports

Tauri is probably better for a lightweight downloadable app. Electron is faster if we want to reuse the current Next/Node tooling with less friction.

## Safety Rules For Public Release

- Never ship Joe's Live365 station ID, tokens, cookie paths, or local folder paths as defaults.
- Every platform action needs:
  - dry run
  - preview
  - explicit apply button
  - log/receipt
- No automatic deletion in v1.
- No hidden file moving.
- All outputs go to an app-controlled export folder unless the user chooses otherwise.
- Secrets live in OS keychain or local encrypted storage, not config files.

## Packaging

### Free Core

- Library scan
- Search/filter catalog
- Duplicate candidates
- Basic buckets
- CSV/M3U export
- Session report

### Supporter / Broadcast Bundle

This is the paywall. The free app proves value by making a giant library usable. The paid/donation-supported layer turns that library into a working radio operation.

Paywall these modules:

- Live365 uploading and scheduling
- archive and publishing workflows
- mobile broadcast setup checklists
- website radio station bridge
- advanced cue-sheet and radio-readiness automation
- multi-station profiles
- saved recurring broadcast plans
- supporter templates and launch guides

Good gating rule: preview is free, apply/publish is supporter-only.

Examples:

- Free users can generate a Live365 upload plan CSV.
- Supporters can upload to Live365, attach cue sheets, build playlists, and schedule events.
- Free users can build a local archive manifest.
- Supporters can publish archive audio and sync public pages.
- Free users can read the mobile broadcast checklist.
- Supporters get guided setup reports, saved device profiles, and remote-show runbooks.

### Donation / Supporter Assets

- Live365 workflow templates
- Radio station launch checklist
- Mobile broadcast checklist
- Cue sheet templates
- Sample “massive library cleanup” playbooks
- Genre/radio bucket presets

### Crown Jewel Bridge: Website Radio Station

The website radio station becomes the premium destination and proof that the toolkit works.

The app should be able to export a station package:

- station profile
- show list
- host/DJ profiles
- show artwork
- schedule blocks
- Live365 stream settings
- archive episodes
- support/underwriter links
- now-playing display preferences
- public theme settings

The Murphys Community Radio website is the reference implementation. Later, this can become a paid station template or deployment service.

Bridge levels:

- Free: export static `station-package.json`.
- Supporter: publish/update archive data and show schedules.
- Pro/service: deploy and maintain a full radio station website.

### Possible Pro Later

- Live365 upload connector
- Recurring schedule builder
- Multi-station profiles
- Cloud sync
- Team review queues
- Advanced rights/source tracking
- white-label website station templates
- hosted station archive pages

## First Build Milestone

Create a standalone app named `dj-library-toolkit` with:

- onboarding screen
- folder picker
- scan job
- SQLite catalog
- tracks table
- filters by bucket/genre/duration/missing metadata
- duplicate candidates view
- playlist builder
- M3U/CSV export
- report export

Do not include Live365 write access in the first public MVP. Add Live365 as an opt-in connector once the local library core is stable.

## Source Cleanup Before Release

- Move reusable logic out of station-specific scripts.
- Replace hard-coded paths with user settings.
- Replace hard-coded station IDs with profiles.
- Add sample `.env.example` files.
- Remove private archive audio from packaged source.
- Add license.
- Add README with clear “what it does / what it does not do.”
- Add contribution and safety docs if open source.

## Immediate Next Steps

1. Create a new app folder or repo for `dj-library-toolkit`.
2. Extract the scanner/bucketing logic from `inventory-master-library.mjs`.
3. Define the SQLite schema for tracks, libraries, scans, buckets, playlists, and exports.
4. Build the first UI around local library scanning.
5. Import the country builder as a later “legal library” module.
6. Keep Live365 integration private until it has user-auth setup and safe previews.
