import { execFile as execFileCallback } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const STATION_ID = "40167";
const COOKIE_DB =
  "/Users/joe/Library/Application Support/Codex/Partitions/codex-browser-app/Cookies";
const EXPORT_ROOT = "/Users/joe/Desktop/murphys-community-radio/mcr_country_library_builder/exports";
const SHOW_TRACKS = path.join(EXPORT_ROOT, "mcr_country_monthly_show_tracks.csv");
const LONGFORM_SECONDS = 30 * 60;

const apply = process.argv.includes("--apply");

if (!apply) {
  console.log("DRY RUN: add --apply to delete matched Live365 country longform tracks/playlists.");
}

const longformPlanRows = (await readCsv(SHOW_TRACKS))
  .map((row) => ({
    artist: cleanMetadata(row.artist || "Unknown Artist"),
    title: cleanMetadata(row.title),
    album: cleanMetadata(row.album),
    durationSeconds: Number.parseFloat(row.duration || "0") || 0,
    showName: row.show_name,
    week: row.week,
  }))
  .filter(isLongformItem);

const planKeys = new Set(longformPlanRows.map((row) => metadataKey(row.artist, row.title)));

console.log(`Country longform candidates from plan: ${longformPlanRows.length}`);

const token = await readLive365BearerToken();
const tracks = await listTracks(token);
const matches = tracks.filter((track) => planKeys.has(trackKey(track)));

console.log(`Live365 tracks scanned: ${tracks.length}`);
console.log(`Matched country longform tracks in Live365: ${matches.length}`);

for (const track of matches) {
  const attrs = track.attributes ?? {};
  console.log(`TRACK ${track.id} | ${attrs.artist || "Unknown Artist"} - ${attrs.title || "Untitled"}`);
}

const playlists = await listPaged(token, "playlists");
const longformPlaylists = playlists.filter(
  (playlist) => normalize(playlist.attributes?.title) === normalize("MCR Country - Early Sunday Longform"),
);

console.log(`Matched country longform playlists in Live365: ${longformPlaylists.length}`);
for (const playlist of longformPlaylists) {
  console.log(`PLAYLIST ${playlist.id} | ${playlist.attributes?.title}`);
}

if (!apply) {
  process.exit(0);
}

for (const playlist of longformPlaylists) {
  await deleteResource(token, "playlists", playlist.id);
  console.log(`DELETED playlist ${playlist.id} | ${playlist.attributes?.title}`);
}

if (matches.length > 0) {
  await deleteTracks(token, matches.map((track) => track.id));
}

for (const track of matches) {
  const attrs = track.attributes ?? {};
  console.log(`DELETED track ${track.id} | ${attrs.artist || "Unknown Artist"} - ${attrs.title || "Untitled"}`);
}

console.log(`Done. Deleted ${matches.length} country longform track(s) and ${longformPlaylists.length} playlist(s).`);

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

    if (batch.length < 100) break;
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

async function deleteResource(token, resource, id) {
  await apiJson(token, `https://dashboard.live365.com/api/v1/${resource}/${id}`, {
    method: "DELETE",
  });
}

async function deleteTracks(token, trackIds) {
  await apiJson(token, "https://dashboard.live365.com/api/v1/bulk/delete-tracks/", {
    method: "POST",
    body: JSON.stringify({
      meta: {
        all_tracks: false,
      },
      data: {
        attributes: {
          track_uuids: trackIds,
        },
        relationships: {
          station: {
            data: {
              id: STATION_ID,
              type: "stations",
            },
          },
        },
        type: "delete_tracks",
      },
    }),
  });
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
  const payload = encrypted.subarray(3);

  try {
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, Buffer.alloc(16, 0x20));
    decipher.setAutoPadding(false);
    const decrypted = Buffer.concat([decipher.update(payload), decipher.final()]);
    const hostHash = crypto.createHash("sha256").update("dashboard.live365.com").digest();
    if (!decrypted.subarray(0, 32).equals(hostHash)) {
      throw new Error("Host hash mismatch");
    }
    const pad = decrypted.at(-1);
    return decrypted.subarray(32, decrypted.length - pad).toString("utf8");
  } catch (error) {
    throw new Error(`Could not decrypt Live365 bearer token from local browser session: ${error.message}`);
  }
}

async function readCsv(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift());
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
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
