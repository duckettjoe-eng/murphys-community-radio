import fs from "node:fs/promises";
import path from "node:path";
import type { LibraryDatabase, SavedScan, ScanResult } from "./types.js";

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

function createScanId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  return `scan_${stamp}_${random}`;
}
