import { execFile as execFileCallback } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { audioExtensions, classifyTrack, duplicateKey, live365Readiness } from "./classifier.js";
import type { AudioMetadata, FolderSummary, LibraryTrack, ScanOptions, ScanResult, TrackBucket } from "./types.js";

const execFile = promisify(execFileCallback);

export async function scanLibrary(options: ScanOptions): Promise<ScanResult> {
  const audioFiles: string[] = [];
  let visitedDirectories = 0;

  for await (const filePath of walkAudio(options.root, () => {
    visitedDirectories += 1;
    if (visitedDirectories % 250 === 0) {
      options.onProgress?.({ type: "directories", visitedDirectories, audioFiles: audioFiles.length });
    }
  })) {
    audioFiles.push(filePath);
    if (audioFiles.length % 500 === 0) {
      options.onProgress?.({ type: "files", audioFiles: audioFiles.length });
    }
    if (options.limit && audioFiles.length >= options.limit) break;
  }

  const tracks: LibraryTrack[] = [];
  for (let index = 0; index < audioFiles.length; index += 1) {
    const filePath = audioFiles[index];
    const ext = path.extname(filePath).toLowerCase();

    const stat = await safeStat(filePath);

    const metadata = options.skipMetadata
      ? metadataFromFilename(filePath)
      : await probeMetadata(filePath, options.ffprobePath);

    const draft = {
      path: filePath,
      relativeFolder: relativeFolder(options.root, filePath),
      filename: path.basename(filePath),
      extension: ext,
      fileSizeBytes: stat?.size ?? null,
      ...metadata,
    };
    const proposedBucket = classifyTrack(draft);
    const track: LibraryTrack = {
      ...draft,
      proposedBucket,
      live365Readiness: live365Readiness(draft),
      duplicateKey: duplicateKey(draft),
    };

    tracks.push(track);
    options.onProgress?.({ type: "metadata", current: index + 1, total: audioFiles.length });
  }

  return {
    tracks,
    summary: summarizeTracks(options.root, tracks),
  };
}

export function summarizeTracks(root: string, tracks: LibraryTrack[]) {
  const extensionCounts: Record<string, number> = {};
  const bucketCounts = emptyBucketCounts();
  let totalBytes = 0;
  let knownRuntimeSeconds = 0;
  let unknownRuntimeCount = 0;

  for (const track of tracks) {
    extensionCounts[track.extension || "(none)"] =
      (extensionCounts[track.extension || "(none)"] ?? 0) + 1;
    totalBytes += track.fileSizeBytes ?? 0;
    bucketCounts[track.proposedBucket] += 1;
    if (track.durationSeconds === null) {
      unknownRuntimeCount += 1;
    } else {
      knownRuntimeSeconds += track.durationSeconds;
    }
  }

  return {
    root,
    trackCount: tracks.length,
    totalBytes,
    knownRuntimeSeconds,
    unknownRuntimeCount,
    extensionCounts,
    bucketCounts,
    duplicateCandidateGroups: countDuplicateCandidateGroups(tracks),
    parseErrorCount: tracks.filter((track) => track.parseError).length,
    folderSummaries: summarizeFolders(tracks),
  };
}

async function* walkAudio(root: string, onDirectory: () => void): AsyncGenerator<string> {
  onDirectory();
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return;
  }

  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walkAudio(entryPath, onDirectory);
    } else if (entry.isFile() && audioExtensions.has(path.extname(entryPath).toLowerCase())) {
      yield entryPath;
    }
  }
}

async function safeStat(filePath: string) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

function metadataFromFilename(filePath: string): AudioMetadata {
  const ext = path.extname(filePath);
  return {
    artist: "",
    title: path.basename(filePath, ext),
    album: "",
    durationSeconds: null,
    genre: "",
    year: "",
    parseError: "",
  };
}

function relativeFolder(root: string, filePath: string) {
  const folder = path.dirname(path.relative(root, filePath));
  return folder === "." ? "(root)" : folder;
}

async function probeMetadata(filePath: string, ffprobePath = "ffprobe"): Promise<AudioMetadata> {
  try {
    const { stdout } = await execFile(
      ffprobePath,
      ["-v", "error", "-print_format", "json", "-show_format", filePath],
      { timeout: 20000, maxBuffer: 1024 * 1024 },
    );
    const parsed = JSON.parse(stdout) as {
      format?: {
        duration?: string;
        tags?: Record<string, string | string[]>;
      };
    };
    const tags = parsed.format?.tags ?? {};
    return {
      durationSeconds: parseDuration(parsed.format?.duration),
      artist: pickTag(tags, ["artist", "ARTIST", "album_artist", "Album Artist"]),
      title: pickTag(tags, ["title", "TITLE"]) || path.basename(filePath, path.extname(filePath)),
      album: pickTag(tags, ["album", "ALBUM"]),
      genre: pickTag(tags, ["genre", "GENRE"]),
      year: normalizeYear(pickTag(tags, ["date", "DATE", "year", "YEAR"])),
      parseError: "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...metadataFromFilename(filePath),
      parseError: message.includes("timed out") ? "ffprobe timeout" : message,
    };
  }
}

function parseDuration(value: string | undefined) {
  const duration = Number.parseFloat(value ?? "");
  return Number.isFinite(duration) ? duration : null;
}

function pickTag(tags: Record<string, string | string[]>, keys: string[]) {
  for (const key of keys) {
    const value = tags[key];
    if (Array.isArray(value) && value.length) return String(value[0]);
    if (value) return String(value);
  }
  return "";
}

function normalizeYear(value: string) {
  const match = value.match(/\d{4}/);
  return match ? match[0] : "";
}

function emptyBucketCounts(): Record<TrackBucket, number> {
  return {
    club_late_night: 0,
    day_safe: 0,
    day_safe_review: 0,
    longform_radio: 0,
    mixtape_dj_edit_review: 0,
    short_audio_review: 0,
    spoken_word_review: 0,
    too_long_for_live365_review: 0,
  };
}

function countDuplicateCandidateGroups(tracks: LibraryTrack[]) {
  const counts = new Map<string, number>();
  for (const track of tracks) {
    if (!track.title) continue;
    counts.set(track.duplicateKey, (counts.get(track.duplicateKey) ?? 0) + 1);
  }
  return [...counts.values()].filter((count) => count > 1).length;
}

function summarizeFolders(tracks: LibraryTrack[]): FolderSummary[] {
  const folders = new Map<string, FolderSummary>();

  for (const track of tracks) {
    const folder = track.relativeFolder || "(root)";
    const summary = folders.get(folder) ?? {
      folder,
      trackCount: 0,
      totalBytes: 0,
      knownRuntimeSeconds: 0,
      unknownRuntimeCount: 0,
    };

    summary.trackCount += 1;
    summary.totalBytes += track.fileSizeBytes ?? 0;
    if (track.durationSeconds === null) {
      summary.unknownRuntimeCount += 1;
    } else {
      summary.knownRuntimeSeconds += track.durationSeconds;
    }
    folders.set(folder, summary);
  }

  return [...folders.values()].sort((left, right) =>
    left.folder.localeCompare(right.folder),
  );
}
