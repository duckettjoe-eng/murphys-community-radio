import fs from "node:fs/promises";
import path from "node:path";
import { classifyTrack, duplicateKey, live365Readiness } from "./classifier.js";
import { summarizeTracks } from "./scanner.js";
import type { LibraryDatabase, LibraryTrack, SavedScan, ScanResult } from "./types.js";

export const defaultStorePath = ".crate-os/library.json";

export async function loadDatabase(storePath = defaultStorePath): Promise<LibraryDatabase> {
  try {
    const text = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(text) as LibraryDatabase;
    if (parsed.schemaVersion === "0.1.0" && Array.isArray(parsed.scans)) {
      return parsed;
    }
  } catch {
    // Missing or unreadable stores start fresh. Import/repair can come later.
  }

  return {
    schemaVersion: "0.1.0",
    scans: [],
  };
}

export async function saveScan(result: ScanResult, storePath = defaultStorePath): Promise<SavedScan> {
  const database = await loadDatabase(storePath);
  const savedScan: SavedScan = {
    id: createScanId(),
    createdAt: new Date().toISOString(),
    summary: result.summary,
    tracks: result.tracks,
  };

  database.scans.unshift(savedScan);
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, `${JSON.stringify(database, null, 2)}\n`);
  return savedScan;
}

export async function latestScan(storePath = defaultStorePath) {
  const database = await loadDatabase(storePath);
  return database.scans[0] ?? null;
}

export type TrackMetadataUpdate = {
  path: string;
  artist?: string;
  title?: string;
  album?: string;
  genre?: string;
  year?: string;
  durationSeconds?: number | null;
};

export async function updateLatestScanTracks(
  updates: TrackMetadataUpdate[],
  storePath = defaultStorePath,
) {
  const database = await loadDatabase(storePath);
  const scan = database.scans[0];
  if (!scan) throw new Error("No saved scan is available to edit.");

  const updatesByPath = new Map(updates.map((update) => [update.path, update]));
  let changed = 0;

  scan.tracks = scan.tracks.map((track) => {
    const update = updatesByPath.get(track.path);
    if (!update) return track;
    changed += 1;
    return refreshTrack({
      ...track,
      artist: update.artist ?? track.artist,
      title: update.title ?? track.title,
      album: update.album ?? track.album,
      genre: update.genre ?? track.genre,
      year: update.year ?? track.year,
      durationSeconds:
        update.durationSeconds === undefined
          ? track.durationSeconds
          : update.durationSeconds,
    });
  });
  scan.summary = summarizeTracks(scan.summary.root, scan.tracks);

  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, `${JSON.stringify(database, null, 2)}\n`);
  return { changed, scan };
}

function refreshTrack(track: LibraryTrack): LibraryTrack {
  return {
    ...track,
    proposedBucket: classifyTrack(track),
    live365Readiness: live365Readiness(track),
    duplicateKey: duplicateKey(track),
  };
}

function createScanId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  return `scan_${stamp}_${random}`;
}
