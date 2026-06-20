# DJ Library Toolkit

Local-first app for DJs with massive music libraries.

## Product Split

- Free core: scan, catalog, clean, classify, review, and export local libraries.
- Supporter broadcast toolkit: Live365 uploading/scheduling, archive publishing, mobile broadcast setup profiles, and station website publishing.
- Pro station builder: white-label website templates and managed station launch workflows.

## First Shared Contracts

- `src/entitlements.ts`: feature keys and tier rules for the paywall.
- `schemas/station-package.schema.json`: bridge format between the desktop app and a radio station website.

This folder is intentionally small for now. It is the future standalone app/workspace; station-specific Murphys Community Radio code should be extracted into reusable modules before public release.
