import { execFile as execFileCallback } from "node:child_process";
import crypto from "node:crypto";
import { openAsBlob } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const DEFAULT_STATION_ID = "40167";
const DEFAULT_UPLOAD_DIR = "/Users/joe/Desktop/MCR Live365 Upload MP3 Only";
const DEFAULT_CUE_ROOT = "/Users/joe/Desktop/spotify-live365-cues/output";
const COOKIE_DB =
  "/Users/joe/Library/Application Support/Codex/Partitions/codex-browser-app/Cookies";

const CURRENT_BATCH_CUES = new Map([
  [
    "Cali Sun Reggae Ride 5.30.2026.mp3",
    "Cali Sun Reggae Ride/Cali Sun Reggae Ride - Live365 Cue Sheet.csv",
  ],
  [
    "Campfire Americana 5.30.2026.mp3",
    "Campfire Americana 1/Campfire Americana 1 - Live365 Cue Sheet.csv",
  ],
  [
    "Golden Hour Groove 5.14.26.mp3",
    "Golden Hour Groove 1/Golden Hour Groove 1 - Live365 Cue Sheet.csv",
  ],
  [
    "Golden Hour Groove 6.4.2026.mp3",
    "Golden Hour Groove 2/Golden Hour Groove 2 - Live365 Cue Sheet.csv",
  ],
  [
    "House Party Frequency 6.5.2026.mp3",
    "House Party Frequency (+1hr Weekly)/House Party Frequency (+1hr Weekly) - Live365 Cue Sheet.csv",
  ],
  [
    "Lowrider Soul Sunday 5.31.2026.mp3",
    "Lowrider Soul Sunday/Lowrider Soul Sunday - Live365 Cue Sheet.csv",
  ],
  [
    "SITH Mix 1.mp3",
    "S.I.T.H. Quarantine Mix - April 25, 2020 at 15_36/S.I.T.H. Quarantine Mix - April 25, 2020 at 15_36 - Live365 Cue Sheet.csv",
  ],
  [
    "Skull County Garage Gospel 5.31.2026.mp3",
    "Skull County Garage Gospel 1/Skull County Garage Gospel 1 - Live365 Cue Sheet.csv",
  ],
  [
    "Weird Late-Night FM 5.29.2026.mp3",
    "Weird Late-Night FM/Weird Late-Night FM - Live365 Cue Sheet.csv",
  ],
  [
    "Weird Late-Night FM 6.5.2026.mp3",
    "Weird Late-Night FM 2/Weird Late-Night FM 2 - Live365 Cue Sheet.csv",
  ],
]);

const LIVE365_TITLE_ALIASES = new Map([
  ["Golden Hour Groove 5.14.26", ["Golden Era Groove 5.14.26"]],
  ["SITH Mix 1", ["Stay In The House Mix"]],
  ["Weird Late-Night FM 6.5.2026", ["Night FM 6.5.2026"]],
]);

const argv = parseArgs(process.argv.slice(2));
const stationId = argv.stationId ?? DEFAULT_STATION_ID;
const uploadDir = argv.uploadDir ?? DEFAULT_UPLOAD_DIR;
const cueRoot = argv.cueRoot ?? DEFAULT_CUE_ROOT;
const apply = Boolean(argv.apply);
const attachExistingOnly = Boolean(argv.attachExistingOnly);
const allowDuplicates = Boolean(argv.allowDuplicates);
const only = argv.only ? normalize(argv.only) : null;
const listLive = Boolean(argv.listLive);

if (!apply) {
  console.log("DRY RUN: add --apply to upload or attach cue sheets in Live365.");
}

const plan = await buildPlan();
printPlan(plan);

if (!apply && !listLive) {
  process.exit(0);
}

const token = await readLive365BearerToken();
const station = await apiJson(
  `https://dashboard.live365.com/api/v1/stations/${stationId}`,
  { token },
);
const mediaServiceUuid = station?.data?.attributes?.media_service_uuid;

if (!mediaServiceUuid) {
  throw new Error(`Could not find media_service_uuid for station ${stationId}.`);
}

const existingTracks = await listTracks({ token });

if (listLive) {
  for (const track of existingTracks) {
    const title = track?.attributes?.title ?? "";
    if (!only || normalize(title).includes(only)) {
      const markers = track?.attributes?.multitrack_metadata;
      console.log(
        `${track.id} | markers=${Array.isArray(markers) ? markers.length : 0} | ${title}`,
      );
    }
  }
  process.exit(0);
}

for (const item of plan.ready) {
  const title = titleFromMp3(item.mp3);
  const existing = findExistingTrack(existingTracks, title);

  if (existing && hasMarkers(existing)) {
    console.log(`SKIP existing with cues: ${title}`);
    continue;
  }

  if (existing) {
    console.log(`ATTACH cues to existing: ${title}`);
    await attachCueSheet({
      token,
      trackId: existing.id,
      cuePath: item.cue,
      mp3Path: item.mp3,
    });
    continue;
  }

  if (attachExistingOnly) {
    console.log(`SKIP not yet in Live365: ${title}`);
    continue;
  }

  if (!allowDuplicates && existingTracks.length === 0) {
    throw new Error("Track list was empty; refusing to upload without duplicate guard.");
  }

  console.log(`UPLOAD multitrack: ${title}`);
  const uploaded = await uploadMultitrack({
    token,
    mediaServiceUuid,
    mp3Path: item.mp3,
  });
  const trackId = uploaded?.data?.attributes?.uuid ?? uploaded?.data?.id;

  if (!trackId) {
    throw new Error(`Upload response did not include a track uuid for ${title}.`);
  }

  await waitForProcessing({ token, trackId });
  await attachCueSheet({ token, trackId, cuePath: item.cue, mp3Path: item.mp3 });
  console.log(`DONE ${title} (${trackId})`);
}

if (plan.missingCue.length) {
  console.log("\nMissing cue sheets; upload skipped:");
  for (const item of plan.missingCue) {
    console.log(`- ${path.basename(item)}`);
  }
}

async function buildPlan() {
  const entries = await fs.readdir(uploadDir, { withFileTypes: true });
  const mp3s = entries
    .filter((entry) => entry.isFile() || entry.isSymbolicLink())
    .map((entry) => path.join(uploadDir, entry.name))
    .filter((file) => file.toLowerCase().endsWith(".mp3"))
    .filter((file) => !isAltRock(path.basename(file)))
    .filter((file) => !only || normalize(path.basename(file)).includes(only))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

  const ready = [];
  const missingCue = [];

  for (const mp3 of mp3s) {
    const mappedCue = CURRENT_BATCH_CUES.get(path.basename(mp3));
    if (!mappedCue) {
      missingCue.push(mp3);
      continue;
    }

    const cue = path.join(cueRoot, mappedCue);
    try {
      await fs.access(cue);
      ready.push({ mp3, cue });
    } catch {
      missingCue.push(mp3);
    }
  }

  return { ready, missingCue };
}

function printPlan(plan) {
  console.log(`Station: ${stationId}`);
  console.log(`Upload folder: ${uploadDir}`);
  console.log(`Cue root: ${cueRoot}`);
  console.log(`Ready: ${plan.ready.length}`);
  for (const item of plan.ready) {
    console.log(`- ${path.basename(item.mp3)} -> ${path.basename(item.cue)}`);
  }
  console.log(`Missing cue: ${plan.missingCue.length}`);
  for (const mp3 of plan.missingCue) {
    console.log(`- ${path.basename(mp3)}`);
  }
}

async function readLive365BearerToken() {
  const [{ stdout: hex }, { stdout: password }] = await Promise.all([
    execFile("sqlite3", [
      COOKIE_DB,
      "select hex(encrypted_value) from cookies where host_key='dashboard.live365.com' and name='bearerToken' order by expires_utc desc limit 1;",
    ]),
    execFile("security", ["find-generic-password", "-w", "-s", "Codex Safe Storage"]),
  ]);

  const encrypted = Buffer.from(hex.trim(), "hex");
  if (encrypted.length <= 3 || encrypted.subarray(0, 3).toString() !== "v10") {
    throw new Error("Unsupported Live365 cookie encryption format.");
  }

  const key = crypto.pbkdf2Sync(
    password.replace(/\n$/, ""),
    "saltysalt",
    1003,
    16,
    "sha1",
  );
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, Buffer.alloc(16, " "));
  let decrypted = Buffer.concat([
    decipher.update(encrypted.subarray(3)),
    decipher.final(),
  ]);

  const hostHash = crypto.createHash("sha256").update("dashboard.live365.com").digest();
  if (decrypted.subarray(0, hostHash.length).equals(hostHash)) {
    decrypted = decrypted.subarray(hostHash.length);
  }

  const token = decrypted.toString("utf8");

  if (!token || token.length < 20 || /[^\x20-\x7e]/.test(token)) {
    throw new Error("Could not decrypt Live365 bearer token from local browser session.");
  }

  return token;
}

async function listTracks({ token }) {
  const tracks = [];

  for (let page = 1; page <= 20; page += 1) {
    const url = new URL("https://dashboard.live365.com/api/v1/tracks/");
    url.searchParams.set("page[number]", String(page));
    url.searchParams.set("page[size]", "100");
    url.searchParams.set("filter[station]", stationId);

    const json = await apiJson(url, { token });
    const batch = Array.isArray(json?.data) ? json.data : [];
    tracks.push(...batch);

    if (batch.length < 100) {
      break;
    }
  }

  return tracks;
}

async function uploadMultitrack({ token, mediaServiceUuid, mp3Path }) {
  const file = await openAsBlob(mp3Path, { type: "audio/mpeg" });
  const body = new FormData();
  body.append("file", file, path.basename(mp3Path));

  return apiJson(`https://media.live365.com/upload/${mediaServiceUuid}/track/multitrack`, {
    method: "POST",
    token,
    body,
  });
}

async function attachCueSheet({ token, trackId, cuePath, mp3Path }) {
  const durationSeconds = mp3Path ? await getAudioDurationSeconds(mp3Path) : null;
  const markers = limitMarkerDensity(
    trimMarkersToDuration(
    await parseCueSheet({ token, cuePath }),
    durationSeconds,
    cuePath,
    ),
    cuePath,
  );

  await apiJson(`https://dashboard.live365.com/api/v1/tracks/${trackId}`, {
    method: "PATCH",
    token,
    contentType: "application/vnd.api+json",
    body: JSON.stringify({
      data: {
        id: trackId,
        type: "tracks",
        attributes: {
          multitrack_metadata: markers,
        },
      },
      meta: {},
    }),
  });
  console.log(`CUES attached: ${path.basename(cuePath)} (${markers.length} rows)`);
}

function limitMarkerDensity(markers, cuePath) {
  const kept = [];
  const rules = [
    { max: 5, windowMs: 10 * 60 * 1000 },
    { max: 13, windowMs: 30 * 60 * 1000 },
  ];

  for (const marker of markers) {
    const offset = Number.parseFloat(marker.offset);
    if (!Number.isFinite(offset)) {
      continue;
    }

    const allowed = rules.every((rule) => {
      const recent = kept.filter((keptMarker) => {
        const keptOffset = Number.parseFloat(keptMarker.offset);
        return Number.isFinite(keptOffset) && offset - keptOffset < rule.windowMs;
      });
      return recent.length < rule.max;
    });

    if (allowed) {
      kept.push(marker);
    }
  }

  const removed = markers.length - kept.length;
  if (removed > 0) {
    console.log(
      `CUES thinned: ${path.basename(cuePath)} removed ${removed} marker(s) for Live365 density limit`,
    );
  }

  return kept;
}

async function getAudioDurationSeconds(mp3Path) {
  try {
    const { stdout } = await execFile("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      mp3Path,
    ]);
    const duration = Number.parseFloat(stdout);
    return Number.isFinite(duration) ? duration : null;
  } catch {
    return null;
  }
}

function trimMarkersToDuration(markers, durationSeconds, cuePath) {
  if (!durationSeconds) {
    return markers;
  }

  const durationMs = durationSeconds * 1000;
  const trimmed = markers.filter((marker) => {
    const offset = Number.parseFloat(marker.offset);
    return Number.isFinite(offset) && offset <= durationMs;
  });

  const removed = markers.length - trimmed.length;
  if (removed > 0) {
    console.log(
      `CUES trimmed: ${path.basename(cuePath)} removed ${removed} marker(s) past ${durationSeconds.toFixed(1)}s`,
    );
  }

  return trimmed;
}

async function parseCueSheet({ token, cuePath }) {
  const file = await openAsBlob(cuePath, { type: "text/csv" });
  const body = new FormData();
  body.append("file", file, path.basename(cuePath));

  const json = await apiJson(
    "https://dashboard.live365.com/api/v1/parse-multitrack-marker-file/",
    {
      method: "POST",
      token,
      body,
    },
  );

  const markers = sanitizeMarkers(json?.multitrack_metadata);
  if (!Array.isArray(markers) || markers.length === 0) {
    throw new Error(`Cue parser returned no markers for ${cuePath}.`);
  }

  return markers;
}

function sanitizeMarkers(markers) {
  if (!Array.isArray(markers)) {
    return markers;
  }

  return markers.map((marker) => {
    const next = { ...marker };
    const year = String(next.year ?? "").trim();

    if (/^\d{4}$/.test(year)) {
      next.year = year;
    } else {
      delete next.year;
    }

    for (const key of ["title", "artist", "album", "album_art_id"]) {
      if (next[key] === "") {
        delete next[key];
      }
    }

    return next;
  });
}

async function waitForProcessing({ token, trackId }) {
  const deadline = Date.now() + 20 * 60 * 1000;

  while (Date.now() < deadline) {
    const json = await apiJson(
      `https://dashboard.live365.com/api/v1/check-multitrack-processing/${trackId}`,
      { token },
    );

    if (!isProcessing(json?.data)) {
      return;
    }

    console.log(`WAIT processing: ${trackId}`);
    await sleep(15000);
  }

  throw new Error(`Timed out waiting for multitrack processing: ${trackId}`);
}

async function apiJson(url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Authorization", `Bearer ${options.token}`);

  if (options.contentType) {
    headers.set("Content-Type", options.contentType);
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
  });

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 500) };
    }
  }

  if (!response.ok) {
    throw new Error(
      `Live365 API ${response.status} ${response.statusText}: ${JSON.stringify(json)}`,
    );
  }

  return json;
}

function findExistingTrack(tracks, title) {
  const candidates = [title, ...(LIVE365_TITLE_ALIASES.get(title) ?? [])].map(normalize);
  return tracks.find((track) => candidates.includes(normalize(track?.attributes?.title ?? "")));
}

function hasMarkers(track) {
  const markers = track?.attributes?.multitrack_metadata;
  return Array.isArray(markers) && markers.length > 0;
}

function isProcessing(data) {
  if (typeof data === "boolean") return data;
  if (data == null) return false;
  if (typeof data === "string") return !["done", "complete", "completed", "false"].includes(data);
  if (typeof data === "object") {
    return Boolean(data.processing ?? data.is_processing ?? data.in_progress);
  }
  return false;
}

function isAltRock(filename) {
  return normalize(filename).includes("alt rock") || normalize(filename).includes("alt-rock");
}

function titleFromMp3(mp3Path) {
  return path.basename(mp3Path, path.extname(mp3Path));
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(args) {
  const parsed = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--apply") parsed.apply = true;
    else if (arg === "--attach-existing-only") parsed.attachExistingOnly = true;
    else if (arg === "--allow-duplicates") parsed.allowDuplicates = true;
    else if (arg === "--list-live") parsed.listLive = true;
    else if (arg === "--station-id") parsed.stationId = args[++index];
    else if (arg === "--upload-dir") parsed.uploadDir = args[++index];
    else if (arg === "--cue-root") parsed.cueRoot = args[++index];
    else if (arg === "--only") parsed.only = args[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}
