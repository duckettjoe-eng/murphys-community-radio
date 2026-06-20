# DJ Library App Paywall And Website Bridge

## Principle

The free app helps DJs understand and organize their own libraries. The supporter tier helps them operate like a broadcaster.

That keeps the giveaway generous while making the paid value obvious.

## Tier Shape

### Free: Library Core

Purpose: help a DJ with a massive library get control.

Included:

- folder scanning
- local SQLite catalog
- search and filters
- duplicate candidates
- missing metadata reports
- basic bucket suggestions
- manual corrections
- CSV export
- M3U/M3U8 export
- local session reports
- basic station-package export

Not included:

- platform publishing
- Live365 writes
- scheduled event creation
- archive hosting sync
- website deployment or live updates

### Supporter: Broadcast Toolkit

Purpose: turn a prepared library into repeatable radio workflows.

Included:

- Live365 upload dry run and apply
- cue sheet attach/update
- Live365 playlist builder
- Live365 scheduling builder
- replay block builder
- quarantine/review workflows
- archive conversion and publishing
- Mixcloud/archive sync
- mobile broadcast setup checklist
- mobile broadcast test report template
- station-package publish/update
- saved broadcast profiles
- supporter workflow templates

### Pro / Service: Station Builder

Purpose: help someone launch a public web radio presence.

Included later:

- white-label station website template
- hosted station archive pages
- custom domain launch guide
- underwriter/support pages
- station branding kit
- managed deployment support
- multi-host/admin workflows

## Entitlement Rules

Use feature entitlements, not vague plan checks.

Recommended entitlement keys:

```json
{
  "library.scan": "free",
  "library.catalog": "free",
  "library.duplicates": "free",
  "library.export.basic": "free",
  "library.export.stationPackage": "free",
  "live365.plan": "free",
  "live365.upload.apply": "supporter",
  "live365.cues.apply": "supporter",
  "live365.playlists.apply": "supporter",
  "live365.schedule.apply": "supporter",
  "live365.quarantine.apply": "supporter",
  "archive.build.local": "free",
  "archive.publish": "supporter",
  "archive.sync.mixcloud": "supporter",
  "mobileBroadcast.checklist": "free",
  "mobileBroadcast.deviceProfile": "supporter",
  "mobileBroadcast.report": "supporter",
  "stationWebsite.exportPackage": "free",
  "stationWebsite.publishUpdates": "supporter",
  "stationWebsite.deployTemplate": "pro"
}
```

Good UX rule: let users preview paid outcomes. Gate the irreversible or platform-writing action.

Examples:

- A free user can see which files would upload to Live365.
- A supporter can click `Upload`.
- A free user can preview generated Live365 schedule events.
- A supporter can click `Create Events`.
- A free user can build local archive files.
- A supporter can publish the archive.

## Payment / Donation Model

Start with pay-what-you-want supporter unlock.

Possible fulfillment paths:

- hosted checkout issues a license key
- supporter download includes an unlock file
- GitHub release is free, supporter key unlocks broadcast modules
- manual supporter codes while validating demand

Avoid heavy DRM. The trust-based tone fits this product. Make donation valuable through convenience, templates, publishing, and continued updates.

## License Storage

Local desktop app should store supporter status in:

- macOS Keychain on Mac
- Windows Credential Manager on Windows
- Secret Service / keyring on Linux

Keep a plain local fallback only for non-secret license metadata:

```json
{
  "licenseEmail": "user@example.com",
  "tier": "supporter",
  "checkedAt": "2026-06-19T00:00:00.000Z"
}
```

Do not store platform tokens in project files. Live365 and publishing tokens must stay in OS secure storage.

## Website Bridge

The app should generate a portable station package that a radio website can ingest.

Initial file:

```text
station-package.json
```

Suggested schema:

```json
{
  "schemaVersion": "1.0.0",
  "station": {
    "name": "Murphys Community Radio",
    "tagline": "Amplifying the voices of Calaveras County",
    "streamUrl": "https://streaming.live365.com/a11326",
    "timezone": "America/Los_Angeles"
  },
  "shows": [
    {
      "id": "dusty-crate-hip-hop-hour",
      "title": "Dusty Crate Hip-Hop Hour",
      "host": "DJ Hello Joey",
      "artwork": "artwork/shows/dusty-crate-hip-hop-hour.png",
      "description": "Classic hip-hop, crate finds, and boom bap."
    }
  ],
  "schedule": [
    {
      "showId": "dusty-crate-hip-hop-hour",
      "day": "friday",
      "start": "18:00",
      "end": "19:00"
    }
  ],
  "archive": [
    {
      "id": "dusty-crate-2026-06-05",
      "showId": "dusty-crate-hip-hop-hour",
      "title": "Dusty Crates Hip Hop 6.5.2026",
      "publishedAt": "2026-06-05T18:00:00-07:00",
      "audioUrl": "https://example.com/archive/dusty-crate-2026-06-05.mp3"
    }
  ],
  "support": {
    "donationUrl": "https://example.com/support",
    "underwriteUrl": "https://example.com/underwrite"
  }
}
```

## Bridge Flow

1. DJ scans and organizes local library.
2. DJ builds show crates/playlists.
3. DJ exports or publishes a station package.
4. Website reads the package.
5. Website updates:
   - live player labels
   - show pages
   - schedule
   - archive
   - support calls-to-action

For Murphys Community Radio, this repo becomes the reference website adapter.

## Code Boundary

Keep these layers separate:

- `core`: local scan/catalog/export, always free
- `broadcast`: Live365, archive publishing, mobile setup, supporter
- `station-web`: station package generation and website adapter, supporter/pro
- `connectors`: platform-specific code behind capability checks

Do not let Live365 scripts depend on Joe's local browser cookie path in the public app. Users need their own connector setup.

## First Implementation Steps

1. Add entitlement constants to the new app.
2. Build a `FeatureGate` UI component.
3. Build free preview screens for Live365 plan, archive plan, and station package.
4. Add disabled supporter actions with clear unlock copy.
5. Extract station-package generation from current site/show/archive data.
6. Build a website adapter that reads a station package into the Murphys site.
