import { execFile as execFileCallback } from "node:child_process";
import crypto from "node:crypto";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const STATION_ID = "40167";
const COOKIE_DB =
  "/Users/joe/Library/Application Support/Codex/Partitions/codex-browser-app/Cookies";

const apply = process.argv.includes("--apply");

const DESIRED_EVENTS = [
  {
    title: "Alt-Rock Barroom Radio",
    startTime: "2026-06-19T02:00:00+0000",
    seriesEnd: "2027-06-19T06:59:59+0000",
    recurringDays: [3],
    playlistTitle: "Alt Rock Bar Room",
    duration: 3600,
  },
  {
    title: "House Party Frequency",
    startTime: "2026-06-20T02:00:00+0000",
    seriesEnd: "2027-06-20T06:59:59+0000",
    recurringDays: [4],
    multitrackTitle: "House Party Frequency 6.5.2026",
    duration: 3600,
  },
  {
    title: "Weird Late-Night FM",
    startTime: "2026-06-20T03:00:00+0000",
    seriesEnd: "2027-06-20T06:59:59+0000",
    recurringDays: [4],
    multitrackTitle: "Night FM 6.5.2026",
    duration: 3600,
  },
  {
    title: "Campfire Americana",
    startTime: "2026-06-21T02:00:00+0000",
    seriesEnd: "2027-06-21T06:59:59+0000",
    recurringDays: [5],
    multitrackTitle: "Campfire Americana 5.30.2026",
    duration: 3600,
  },
  {
    title: "Skull County Garage Gospel",
    startTime: "2026-06-21T18:00:00+0000",
    seriesEnd: "2027-06-22T06:59:59+0000",
    recurringDays: [6],
    multitrackTitle: "Skull County Garage Gospel 5.31.2026",
    duration: 3600,
  },
  {
    title: "Replay Block - Thursday Shows",
    startTime: "2026-06-19T03:00:00+0000",
    seriesEnd: "2027-06-19T06:59:59+0000",
    recurringDays: [3],
    playlistTitle: "Replay Playlist - Thursday Shows",
    duration: 7200,
  },
  {
    title: "Replay Block - Friday Shows",
    startTime: "2026-06-20T04:00:00+0000",
    seriesEnd: "2027-06-20T06:59:59+0000",
    recurringDays: [4],
    playlistTitle: "Replay Playlist - Friday Shows",
    duration: 7200,
  },
  {
    title: "Replay Block - Saturday Shows",
    startTime: "2026-06-21T03:00:00+0000",
    seriesEnd: "2027-06-21T06:59:59+0000",
    recurringDays: [5],
    playlistTitle: "Replay Playlist - Saturday Shows",
    duration: 7200,
  },
  {
    title: "Replay Block - Sunday Shows",
    startTime: "2026-06-21T19:00:00+0000",
    seriesEnd: "2027-06-22T06:59:59+0000",
    recurringDays: [6],
    playlistTitle: "Replay Playlist - Sunday Shows",
    duration: 7200,
  },
];

if (!apply) {
  console.log("DRY RUN: add --apply to create non-duplicate schedule events.");
}

const token = await readLive365BearerToken();
const [events, playlists, tracks, clockwheels] = await Promise.all([
  listEvents(token),
  listPaged(token, "playlists"),
  listTracks(token),
  listPaged(token, "clockwheels"),
]);

const playlistsByTitle = new Map(playlists.map((item) => [normalize(item.attributes.title), item]));
const tracksByTitle = new Map(tracks.map((item) => [normalize(item.attributes.title), item]));
const clockwheelsByTitle = new Map(
  clockwheels.map((item) => [normalize(item.attributes.name), item]),
);

for (const event of DESIRED_EVENTS) {
  const existing = events.find((candidate) => isSameSlot(candidate, event));
  if (existing) {
    console.log(`EVENT exists, skipped: ${event.title} (${existing.id})`);
    continue;
  }

  const relationship = resolveSource(event);
  if (!relationship) {
    console.log(`EVENT skipped missing source: ${event.title}`);
    continue;
  }

  const conflicting = events.find((candidate) => isConflictingSlot(candidate, event));
  if (conflicting) {
    console.log(
      `EVENT skipped possible conflict: ${event.title} conflicts with ${conflicting.attributes.title} (${conflicting.id})`,
    );
    continue;
  }

  if (!apply) {
    console.log(`EVENT would create: ${event.title} at ${event.startTime}`);
    continue;
  }

  try {
    const created = await createEvent(token, event, relationship);
    console.log(`EVENT created: ${event.title} (${created.id})`);
  } catch (error) {
    console.log(`EVENT failed: ${event.title}: ${error.message}`);
  }
}

console.log("EVENT intentionally skipped: Dusty Crate Hip-Hop Hour, no ready cue-backed multitrack.");
console.log("EVENT intentionally skipped: Mashup Crate Hour, source still unclear.");

function resolveSource(event) {
  if (event.playlistTitle) {
    const playlist = playlistsByTitle.get(normalize(event.playlistTitle));
    return playlist ? { playlist: { data: { id: playlist.id, type: "playlists" } } } : null;
  }

  if (event.multitrackTitle) {
    const track = tracksByTitle.get(normalize(event.multitrackTitle));
    return track ? { multitrack: { data: { id: track.id, type: "tracks" } } } : null;
  }

  if (event.clockwheelTitle) {
    const clockwheel = clockwheelsByTitle.get(normalize(event.clockwheelTitle));
    return clockwheel ? { clockwheel: { data: { id: clockwheel.id, type: "clockwheels" } } } : null;
  }

  return null;
}

function isSameSlot(candidate, event) {
  return (
    normalize(candidate.attributes.title) === normalize(event.title) &&
    candidate.attributes.start_time === event.startTime &&
    JSON.stringify(candidate.attributes.recurring_days ?? []) === JSON.stringify(event.recurringDays)
  );
}

function isConflictingSlot(candidate, event) {
  return (
    candidate.attributes.start_time === event.startTime &&
    JSON.stringify(candidate.attributes.recurring_days ?? []) === JSON.stringify(event.recurringDays)
  );
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

async function listEvents(token) {
  const url = new URL("https://dashboard.live365.com/api/v1/events/");
  url.searchParams.set("filter[station]", STATION_ID);
  url.searchParams.set("filter[interval]", "2026-06-01:2027-07-01");
  const json = await apiJson(token, url);
  return Array.isArray(json.data) ? json.data : [];
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

async function createEvent(token, event, relationship) {
  const json = await apiJson(token, "https://dashboard.live365.com/api/v1/events/", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "events",
        attributes: {
          title: event.title,
          strict_start: true,
          start_time: event.startTime,
          duration: event.duration,
          is_instance: false,
          is_recurring: true,
          is_canceled: false,
          recurring_days: event.recurringDays,
          series_end: event.seriesEnd,
        },
        relationships: {
          station: {
            data: {
              id: STATION_ID,
              type: "stations",
            },
          },
          ...relationship,
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
