# Crate OS Desktop

Crate OS by XTRAGOODLABS is a local-first desktop app for scanning DJ libraries, storing scan results in SQLite, and preparing library workflows behind supporter/paywall gates.

## Requirements

- Node.js and npm
- Rust/Cargo from `rustup`
- macOS, Windows, or Linux desktop environment supported by Tauri

On macOS, install Rust with:

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Then restart the terminal so `cargo` is on PATH.

## Run In Development

```sh
cd apps/crate-os-desktop
npm install
npm run tauri:dev
```

That starts Vite and opens the native Tauri window with the folder picker, scan progress events, and local SQLite persistence.

## Build Checks

Frontend build:

```sh
npm run build
```

Native app bundle:

```sh
npm run tauri:build
```

macOS app bundle without the DMG wrapper:

```sh
npm run tauri:build:app
```

The current scanner walks audio folders, reads runtime, preserves editable metadata across rescans, stores scan summaries and tracks in SQLite, and emits progress. Exports can target selected tracks, the active folder, or the full latest scan as CSV, DJ prep CSV, or M3U8 playlist; JSON backup and Live365 CSV are supporter-gated.
