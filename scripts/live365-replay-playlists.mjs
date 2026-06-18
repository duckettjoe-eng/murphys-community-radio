import { execFile as execFileCallback } from "node:child_process";
import crypto from "node:crypto";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const STATION_ID = "40167";
const COOKIE_DB =
  "/Users/joe/Library/Application Support/Codex/Partitions/codex-browser-app/Cookies";
const PLAYLIST_COLOR = "#4A90E2";

const REPLAY_PLAYLISTS = new Map([
  [
    "Replay Playlist - Thursday Shows",
    ["Golden Era Groove 5.14.26", "Golden Hour Groove 6.4.2026", "Alt Rock Bar Room Radio 6.11.2026"],
  ],
  [
    "Replay Playlist - Friday Shows",
    ["House Party Frequency 6.5.2026", "Weird Late-Night FM 5.29.2026", "Night FM 6.5.2026"],
  ],
  [
    "Replay Playlist - Saturday Shows",
    ["Cali Sun Reggae Ride 5.30.2026", "Campfire Americana 5.30.2026"],
  ],
  [
    "Replay Playlist - Sunday Shows",
    ["Lowrider Soul Sunday 5.31.2026", "Skull County Garage Gospel 5.31.2026"],
  ],
]);

const apply = process.argv.includes("--apply");

if (!apply) {
  console.log("DRY RUN: add --apply to create replay playlists.");
}

const token = await readLive365BearerToken();
const [playlists, tracks] = await Promise.all([listPaged(token, "playlists"), listTracks(token)]);
const playlistsByTitle = new Map(playlists.map((item) => [normalize(item.attributes.title), item]));
const tracksByTitle = new Map(tracks.map((item) => [normalize(item.attributes.title), item]));

for (const [playlistTitle, trackTitles] of REPLAY_PLAYLISTS) {
  const existing = playlistsByTitle.get(normalize(playlistTitle));
  if (existing) {
    console.log(`PLAYLIST exists, left unchanged: ${playlistTitle} (${existing.id})`);
    continue;
  }

  const trackIds = [];
  for (const trackTitle of trackTitles) {
    const track = tracksByTitle.get(normalize(trackTitle));
    if (!track) {
      console.log(`PLAYLIST missing track: ${playlistTitle} needs ${trackTitle}`);
      continue;
    }
    trackIds.push(track.id);
  }

  if (trackIds.length === 0) {
    console.log(`PLAYLIST skipped no ready tracks: ${playlistTitle}`);
    continue;
  }

  if (!apply) {
    console.log(`PLAYLIST would create: ${playlistTitle} with ${trackIds.length} multitrack(s)`);
    continue;
  }

  const created = await createPlaylist(token, playlistTitle, trackIds);
  console.log(`PLAYLIST created: ${playlistTitle} (${created.id}) with ${trackIds.length} multitrack(s)`);
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
  if (!token || /[^\x20-\x7e]/.test(token)) {
    throw new Error("Could not decrypt Live365 bearer token from local browser session.");
  }
  return token;
}

async function listTracks(token) {
  const tracks = [];
  for (let page = 1; page <= 20; page += 1) {
    const url = new URL("https://dashboard.live365.com/api/v1/tracks/");
    url.searchParams.set("page[number]", String(page));
    url.searchParams.set("page[size]", "100");
    url.searchParams.set("filter[station]", STATION_ID);
    url.searchParams.set("filter[media_type]", "multitrack");
    const json = await apiJson(token, url);
    const batch = Array.isArray(json.data) ? json.data : [];
    tracks.push(...batch);
    if (batch.length < 100) break;
  }
  return tracks;
}

async function listPaged(token, resource) {
  const items = [];
  for (let page = 1; page <= 10; page += 1) {
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

async function apiJson(token, url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/vnd.api+json");
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`Live365 API ${response.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
