import { execFile as execFileCallback } from "node:child_process";
import crypto from "node:crypto";
import { openAsBlob } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const STATION_ID = "40167";
const COOKIE_DB =
  "/Users/joe/Library/Application Support/Codex/Partitions/codex-browser-app/Cookies";
const COUNTRY_ROOT = "/Users/joe/Music/Music/Media.localized/Music/MCR Country Audition Shows";
const EXPORT_ROOT = "/Users/joe/Desktop/murphys-community-radio/mcr_country_library_builder/exports";
const AUDITION_LOG = path.join(EXPORT_ROOT, "mcr_country_audition_download_log.csv");
const COPY_LOG = path.join(EXPORT_ROOT, "macbook_audition_copy_log.csv");
const PLAYLIST_COLOR = "#4C7A3F";
const LIVE365_MAX_AUDIO_SECONDS = 4 * 60 * 60;
const LONGFORM_SECONDS = 30 * 60;

const argv = parseArgs(process.argv.slice(2));
const apply = Boolean(argv.apply);
const only = argv.only ? normalize(argv.only) : null;

if (!apply) {
  console.log("DRY RUN: add --apply to upload country tracks and create Live365 playlists.");
}

const plan = await buildPlan();
printPlan(plan);

if (!apply) {
  process.exit(0);
}

const token = await readLive365BearerToken();
const station = await apiJson(token, `https://dashboard.live365.com/api/v1/stations/${STATION_ID}`);
const mediaServiceUuid = station?.data?.attributes?.media_service_uuid;

if (!mediaServiceUuid) {
  throw new Error(`Could not find media_service_uuid for station ${STATION_ID}.`);
}

let tracks = await listTracks(token);
const uploadedByKey = new Map(tracks.map((track) => [trackKey(track), track]));
const trackIdsByPlanKey = new Map();

for (const item of plan.items) {
  if (item.durationSeconds > LIVE365_MAX_AUDIO_SECONDS) {
    console.log(
      `SKIP over Live365 4-hour limit: ${item.artist} - ${item.title} (${Math.round(
        item.durationSeconds / 60,
      )} min)`,
    );
    continue;
  }

  const key = metadataKey(item.artist, item.title);
  const existing = uploadedByKey.get(key);
  if (existing) {
    console.log(`TRACK exists: ${item.artist} - ${item.title} (${existing.id})`);
    trackIdsByPlanKey.set(item.planKey, existing.id);
    continue;
  }

  try {
    console.log(`UPLOAD music: ${item.artist} - ${item.title}`);
    const uploaded = await uploadMusicTrack({
      token,
      mediaServiceUuid,
      mp3Path: item.path,
    });
    const trackId = uploaded?.data?.attributes?.uuid ?? uploaded?.data?.id;
    if (!trackId) {
      throw new Error(`Upload response did not include a track uuid for ${item.path}.`);
    }

    await updateTrackMetadata(token, trackId, item);
    const refreshed = await getTrack(token, trackId);
    uploadedByKey.set(trackKey(refreshed), refreshed);
    trackIdsByPlanKey.set(item.planKey, trackId);
    console.log(`DONE ${item.artist} - ${item.title} (${trackId})`);
  } catch (error) {
    console.log(`TRACK failed, skipped: ${item.artist} - ${item.title}: ${error.message}`);
  }
}

tracks = await listTracks(token);
const playlists = await listPaged(token, "playlists");
const playlistsByTitle = new Map(playlists.map((item) => [normalize(item.attributes.title), item]));

for (const episode of plan.episodes) {
  const title = live365PlaylistTitle(episode);
  const existing = playlistsByTitle.get(normalize(title));
  const trackIds = episode.items.map((item) => trackIdsByPlanKey.get(item.planKey)).filter(Boolean);
  if (trackIds.length === 0) {
    console.log(`PLAYLIST skipped no uploaded tracks: ${title}`);
    continue;
  }

  if (existing) {
    await updatePlaylist(token, existing.id, title, trackIds);
    console.log(`PLAYLIST updated: ${title} (${existing.id}) with ${trackIds.length} track(s)`);
  } else {
    const created = await createPlaylist(token, title, trackIds);
    console.log(`PLAYLIST created: ${title} (${created.id}) with ${trackIds.length} track(s)`);
  }
}

async function buildPlan() {
  const copyRows = await readCsv(COPY_LOG);
  const auditionRows = await readCsv(AUDITION_LOG);
  const copiedBySource = new Map(copyRows.map((row) => [row.source, row.destination]));
  const items = [];

  for (const row of auditionRows) {
    if (!["downloaded", "already_exists"].includes(row.action)) {
      continue;
    }

    let finalPath = copiedBySource.get(row.path);
    if (!finalPath) {
      continue;
    }

    if (finalPath.toLowerCase().endsWith(".flac")) {
      finalPath = finalPath.slice(0, -5) + ".mp3";
    }

    try {
      await fs.access(finalPath);
    } catch {
      continue;
    }

    const item = {
      showName: row.show_name,
      week: Number.parseInt(row.week, 10),
      position: Number.parseInt(row.position, 10),
      artist: cleanMetadata(row.artist || "Unknown Artist"),
      title: cleanMetadata(row.title || path.basename(finalPath, path.extname(finalPath))),
      album: cleanMetadata(`${row.show_name} - Week ${row.week}`),
      durationSeconds: Number.parseFloat(row.duration || "0") || 0,
      path: finalPath,
      planKey: `${row.show_name}|${row.week}|${row.position}|${row.track_id}`,
      sourceUrl: row.source_url,
      licenseUrl: row.license_url,
    };
    item.isLongform = isLongformItem(item);

    if (!only || normalize(`${item.showName} ${item.artist} ${item.title}`).includes(only)) {
      items.push(item);
    }
  }

  items.sort(
    (a, b) =>
      a.showName.localeCompare(b.showName) || a.week - b.week || a.position - b.position,
  );

  const episodesByKey = new Map();
  for (const item of items.filter((item) => !item.isLongform)) {
    const key = `${item.showName}|${item.week}`;
    if (!episodesByKey.has(key)) {
      episodesByKey.set(key, {
        showName: item.showName,
        week: item.week,
        items: [],
      });
    }
    episodesByKey.get(key).items.push(item);
  }

  const longformItems = items
    .filter((item) => item.isLongform)
    .sort((a, b) => a.showName.localeCompare(b.showName) || a.week - b.week || a.position - b.position);
  if (longformItems.length > 0) {
    episodesByKey.set("Early Sunday Longform|1", {
      showName: "Early Sunday Longform",
      week: 1,
      longform: true,
      items: longformItems,
    });
  }

  return {
    items,
    episodes: [...episodesByKey.values()].sort(
      (a, b) => a.showName.localeCompare(b.showName) || a.week - b.week,
    ),
  };
}

function printPlan(plan) {
  console.log(`Station: ${STATION_ID}`);
  console.log(`Music folder: ${COUNTRY_ROOT}`);
  console.log(`Tracks ready for Live365: ${plan.items.length}`);
  const overLimit = plan.items.filter((item) => item.durationSeconds > LIVE365_MAX_AUDIO_SECONDS);
  const longform = plan.items.filter((item) => item.isLongform);
  if (overLimit.length > 0) {
    console.log(`Tracks over Live365 4-hour upload limit: ${overLimit.length}`);
  }
  console.log(`Tracks reserved for early Sunday longform only: ${longform.length}`);
  for (const episode of plan.episodes) {
    console.log(`- ${live365PlaylistTitle(episode)}: ${episode.items.length} track(s)`);
  }
}

async function uploadMusicTrack({ token, mediaServiceUuid, mp3Path }) {
  const file = await openAsBlob(mp3Path, { type: "audio/mpeg" });
  const body = new FormData();
  body.append("file", file, path.basename(mp3Path));

  return apiJson(token, `https://media.live365.com/upload/${mediaServiceUuid}/track/music`, {
    method: "POST",
    body,
  });
}

async function updateTrackMetadata(token, trackId, item) {
  await apiJson(token, "https://dashboard.live365.com/api/v1/bulk/tracks/", {
    method: "POST",
    body: JSON.stringify({
      meta: {
        all_tracks: false,
      },
      data: {
        attributes: {
          track_uuids: [trackId],
          title: item.title,
          artist: item.artist,
          album: item.album,
        },
        relationships: {
          station: {
            data: {
              id: STATION_ID,
              type: "stations",
            },
          },
        },
        type: "edit_tracks",
      },
    }),
  });
}

async function createPlaylist(token, title, tracks) {
  const json = await apiJson(token, "https://dashboard.live365.com/api/v1/playlists/", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "playlists",
        attributes: {
          title,
          color: PLAYLIST_COLOR,
          tracks,
        },
        relationships: {
          station: {
            data: {
              id: STATION_ID,
              type: "stations",
            },
          },
        },
      },
      meta: {},
    }),
  });
  return json.data;
}

async function updatePlaylist(token, playlistId, title, tracks) {
  const json = await apiJson(token, `https://dashboard.live365.com/api/v1/playlists/${playlistId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        id: playlistId,
        type: "playlists",
        attributes: {
          title,
          color: PLAYLIST_COLOR,
          tracks,
        },
      },
      meta: {},
    }),
  });
  return json.data;
}

async function getTrack(token, trackId) {
  const json = await apiJson(token, `https://dashboard.live365.com/api/v1/tracks/${trackId}`);
  return json.data;
}

async function listTracks(token) {
  const tracks = [];

  for (let page = 1; page <= 50; page += 1) {
    const url = new URL("https://dashboard.live365.com/api/v1/tracks/");
    url.searchParams.set("page[number]", String(page));
    url.searchParams.set("page[size]", "100");
    url.searchParams.set("filter[station]", STATION_ID);

    const json = await apiJson(token, url);
    const batch = Array.isArray(json.data) ? json.data : [];
    tracks.push(...batch);

    if (batch.length < 100) {
      break;
    }
  }

  return tracks;
}

async function listPaged(token, resource) {
  const items = [];
  for (let page = 1; page <= 20; page += 1) {
    const url = new URL(`https://dashboard.live365.com/api/v1/${resource}/`);
    url.searchParams.set("page[number]", String(page));
    url.searchParams.set("page[size]", "100");
    url.searchParams.set("filter[station]", STATION_ID);
    const json = await apiJson(token, url);
    const batch = Array.isArray(json.data) ? json.data : [];
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

async function apiJson(token, url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/vnd.api+json");
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
    throw new Error(`Live365 API ${response.status} ${response.statusText}: ${JSON.stringify(json)}`);
  }

  return json;
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

async function readCsv(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  const rows = [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return rows;
  const headers = parseCsvLine(lines[0]);
  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  }
  return rows;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function trackKey(track) {
  return metadataKey(track?.attributes?.artist, track?.attributes?.title);
}

function metadataKey(artist, title) {
  return `${normalize(artist)}|${normalize(title)}`;
}

function live365PlaylistTitle(episode) {
  if (episode.longform) {
    return "MCR Country - Early Sunday Longform";
  }
  return `MCR Country - ${episode.showName} - Week ${episode.week}`;
}

function isLongformItem(item) {
  const text = normalize(`${item.artist} ${item.title} ${item.album}`);
  return (
    item.durationSeconds > LONGFORM_SECONDS ||
    /\b(podcast|interview|sermon|speech|talk|lecture|oral history)\b/.test(text)
  );
}

function cleanMetadata(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 240) || "Unknown";
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseArgs(args) {
  const parsed = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--apply") parsed.apply = true;
    else if (arg === "--only") parsed.only = args[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}
