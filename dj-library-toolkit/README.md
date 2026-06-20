# Crate OS by XTRAGOODLABS

Local-first app for DJs with massive music libraries.

## Product Split

- Free core: scan, catalog, clean, classify, review, and export local libraries.
- Supporter broadcast toolkit: Live365 uploading/scheduling, archive publishing, mobile broadcast setup profiles, and station website publishing.
- Pro station builder: white-label website templates and managed station launch workflows.

## First Shared Contracts

- `src/entitlements.ts`: feature keys and tier rules for the paywall.
- `src/core/`: local scanner, classifier, duplicate hints, CSV, and report code.
- `src/paywall/`: feature gate primitives for the free/supporter/pro split.
- `schemas/station-package.schema.json`: bridge format between the desktop app and a radio station website.

## First CLI Slice

```sh
cd dj-library-toolkit
npm run build
node dist/cli/scan.js --root /path/to/music --out exports/library.csv --skip-metadata
node dist/cli/scan.js --root /path/to/music --save --skip-metadata
node dist/cli/serve.js
```

Add `--limit 100` for a small smoke test. Omit `--skip-metadata` when `ffprobe` is installed and you want duration/tag reads.
Saved scans go into `.crate-os/library.json` by default. The dashboard serves the most recent scan at `http://127.0.0.1:4173`.

This folder is the future standalone app/workspace. Station-specific Murphys Community Radio code should be extracted into reusable modules before public release.
