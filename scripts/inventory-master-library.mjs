import { execFile as execFileCallback } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const DEFAULT_ROOT = "/Volumes/xtragood/Documents/Murphys Community Radio/Master Library";
const DEFAULT_OUT =
  "/Users/joe/Desktop/murphys-community-radio/mcr_country_library_builder/exports/macbook_master_library_inventory.csv";
const AUDIO_EXTENSIONS = new Set([
  ".aac",
  ".aif",
  ".aiff",
  ".alac",
  ".flac",
  ".m4a",
  ".mp3",
  ".mp4",
  ".wav",
]);
const CLUB_TERMS = [
  "acid",
  "after hours",
  "afterhours",
  "bassline",
  "breakbeat",
  "club",
  "dance",
  "deep house",
  "disco",
  "dj ",
  "dnb",
  "drum and bass",
  "dubstep",
  "edm",
  "electro",
  "garage",
  "hard house",
  "house",
  "jungle",
  "rave",
  "remix",
  "tech house",
  "techno",
  "trance",
];
const DAY_SAFE_TERMS = [
  "acoustic",
  "americana",
  "blues",
  "classic",
  "country",
  "folk",
  "funk",
  "jazz",
  "oldies",
  "pop",
  "reggae",
  "rock",
  "soul",
];
const LONGFORM_TERMS = [
  "audiobook",
  "interview",
  "lecture",
  "mix",
  "podcast",
  "sermon",
  "speech",
  "talk",
];
const MIXTAPE_DJ_EDIT_TERMS = [
  "blood diamonds cocaine",
  "blood, diamonds & cocaine",
  "blogspot",
  "bumsquaddjz",
  "dj action pac",
  "dj green lantern",
  "dj symphony",
  "hip hop is read",
  "hosted by",
  "j love",
  "lights out mixed by dj green lantern",
  "mixed by dj",
  "mixtape",
  "mixtapes",
  "monster mixtapes",
  "monstermixtapes",
  "staten we go hard",
  "the columbian necktie",
  "the grey album",
  "the tape deck",
];

const args = parseArgs(process.argv.slice(2));
const root = args.root || DEFAULT_ROOT;
const out = args.out || DEFAULT_OUT;
const maxFiles = Number.parseInt(args.limit || "0", 10);
const skipMetadata = Boolean(args["skip-metadata"]);

await fs.mkdir(path.dirname(out), { recursive: true });

console.log(`Inventory root: ${root}`);
console.log(`CSV output: ${out}`);
console.log(skipMetadata ? "Metadata pass: skipped" : "Metadata pass: ffprobe");

const audioFiles = [];
let visitedDirs = 0;
for await (const filePath of walk(root)) {
  const ext = path.extname(filePath).toLowerCase();
  if (!AUDIO_EXTENSIONS.has(ext)) continue;
  audioFiles.push(filePath);
  if (audioFiles.length % 500 === 0) {
    console.log(`Found ${audioFiles.length} audio files...`);
  }
  if (maxFiles && audioFiles.length >= maxFiles) break;
}

console.log(`Path scan complete: ${audioFiles.length} audio files in ${visitedDirs} directories.`);

const rows = [];
const extensionCounts = new Map();
const bucketCounts = new Map();
let totalBytes = 0;

for (let index = 0; index < audioFiles.length; index += 1) {
  const filePath = audioFiles[index];
  const ext = path.extname(filePath).toLowerCase();
  extensionCounts.set(ext || "(none)", (extensionCounts.get(ext || "(none)") || 0) + 1);

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch (error) {
    rows.push(baseRow(filePath, { parse_error: `stat: ${error.message}` }));
    continue;
  }

  totalBytes += stat.size;

  let metadata = {};
  if (!skipMetadata) {
    metadata = await probe(filePath);
  }

  const row = baseRow(filePath, {
    file_size_bytes: stat.size,
    ...metadata,
  });
  row.proposed_bucket = classify(row);
  row.live365_upload_status = live365Status(row);
  bucketCounts.set(row.proposed_bucket, (bucketCounts.get(row.proposed_bucket) || 0) + 1);
  rows.push(row);

  if ((index + 1) % 250 === 0 || index + 1 === audioFiles.length) {
    console.log(`Metadata ${index + 1}/${audioFiles.length}...`);
  }
}

await fs.writeFile(out, toCsv(rows));
console.log(`Wrote ${rows.length} rows.`);
console.log(`Total size: ${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);
console.log("Extensions:");
for (const [ext, count] of [...extensionCounts.entries()].sort()) {
  console.log(`- ${ext}: ${count}`);
}
console.log("Buckets:");
for (const [bucket, count] of [...bucketCounts.entries()].sort()) {
  console.log(`- ${bucket}: ${count}`);
}

async function* walk(dir) {
  visitedDirs += 1;
  if (visitedDirs % 250 === 0) {
    console.log(`Visited ${visitedDirs} directories; found ${audioFiles.length} audio files...`);
  }

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    console.warn(`WARN: cannot read ${dir}: ${error.message}`);
    return;
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(entryPath);
    } else if (entry.isFile()) {
      yield entryPath;
    }
  }
}

async function probe(filePath) {
  try {
    const { stdout } = await execFile(
      "/opt/homebrew/bin/ffprobe",
      [
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        filePath,
      ],
      { timeout: 20000, maxBuffer: 1024 * 1024 },
    );
    const parsed = JSON.parse(stdout);
    const tags = parsed.format?.tags || {};
    return {
      duration_seconds: parsed.format?.duration || "",
      artist: pickTag(tags, ["artist", "ARTIST", "album_artist", "Album Artist"]),
      title: pickTag(tags, ["title", "TITLE"]),
      album: pickTag(tags, ["album", "ALBUM"]),
      genre: pickTag(tags, ["genre", "GENRE"]),
      year: normalizeYear(pickTag(tags, ["date", "DATE", "year", "YEAR"])),
      parse_error: "",
    };
  } catch (error) {
    return {
      duration_seconds: "",
      artist: "",
      title: "",
      album: "",
      genre: "",
      year: "",
      parse_error: error.killed ? "ffprobe timeout" : error.message,
    };
  }
}

function baseRow(filePath, values = {}) {
  const ext = path.extname(filePath).toLowerCase();
  const titleFromName = path.basename(filePath, ext);
  return {
    path: filePath,
    filename: path.basename(filePath),
    extension: ext,
    file_size_bytes: "",
    artist: "",
    title: titleFromName,
    album: "",
    duration_seconds: "",
    genre: "",
    year: "",
    proposed_bucket: "",
    live365_upload_status: "",
    parse_error: "",
    ...values,
  };
}

function classify(row) {
  const duration = Number.parseFloat(row.duration_seconds || "0");
  const haystack = [
    row.path,
    row.filename,
    row.artist,
    row.title,
    row.album,
    row.genre,
  ]
    .join(" ")
    .toLowerCase();

  if (duration > 4 * 60 * 60) return "too_long_for_live365_review";
  if (shouldBlockMixtapeDjEdit(haystack)) return "mixtape_dj_edit_review";
  if (duration > 30 * 60 || includesAny(haystack, LONGFORM_TERMS)) return "longform_early_sunday";
  if (duration > 0 && duration < 45) return "short_audio_review";
  if (includesAny(haystack, CLUB_TERMS)) return "club_late_night";
  if (includesAny(haystack, DAY_SAFE_TERMS)) return "day_safe";
  return "day_safe_review";
}

function live365Status(row) {
  const duration = Number.parseFloat(row.duration_seconds || "0");
  const haystack = [
    row.path,
    row.filename,
    row.artist,
    row.title,
    row.album,
    row.genre,
  ]
    .join(" ")
    .toLowerCase();
  if (shouldBlockMixtapeDjEdit(haystack)) return "skip_mixtape_dj_edit_review";
  if (!row.duration_seconds) return "metadata_review_before_upload";
  if (duration > 4 * 60 * 60) return "skip_live365_over_4_hours";
  if (duration < 45) return "skip_short_audio_review";
  return "eligible_reviewed_by_bucket";
}

function includesAny(value, terms) {
  return terms.some((term) => value.includes(term));
}

function shouldBlockMixtapeDjEdit(haystack) {
  if (haystack.includes("dj hello joey")) return false;
  const comparable = haystack.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  return MIXTAPE_DJ_EDIT_TERMS.some((term) => comparable.includes(term.replace(/[^a-z0-9]+/g, " ").trim()));
}

function pickTag(tags, keys) {
  for (const key of keys) {
    const value = tags[key];
    if (Array.isArray(value) && value.length) return String(value[0]);
    if (value) return String(value);
  }
  return "";
}

function normalizeYear(value) {
  const match = String(value || "").match(/\d{4}/);
  return match ? match[0] : "";
}

function parseArgs(raw) {
  const parsed = {};
  for (let index = 0; index < raw.length; index += 1) {
    const arg = raw[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = raw[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function toCsv(rows) {
  const headers = [
    "path",
    "filename",
    "extension",
    "file_size_bytes",
    "artist",
    "title",
    "album",
    "duration_seconds",
    "genre",
    "year",
    "proposed_bucket",
    "live365_upload_status",
    "parse_error",
  ];
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
}

function csvCell(value) {
  const stringValue = String(value ?? "");
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}
