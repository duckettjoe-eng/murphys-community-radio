import { execFile as execFileCallback } from "node:child_process";
import crypto from "node:crypto";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const STATION_ID = "40167";
const COOKIE_DB =
  "/Users/joe/Library/Application Support/Codex/Partitions/codex-browser-app/Cookies";

const CATEGORY_COLOR = "#4A90E2";

const REPLAY_CATEGORIES = [
  "Replay - Golden Hour Groove",
  "Replay - Alt-Rock Barroom Radio",
  "Replay - Dusty Crate Hip-Hop Hour",
  "Replay - House Party Frequency",
  "Replay - Weird Late-Night FM",
  "Replay - Cali Sun Reggae Ride",
  "Replay - Campfire Americana",
  "Replay - Lowrider Soul Sunday",
  "Replay - Skull County Garage Gospel",
];

const READY_ASSIGNMENTS = new Map([
  [
    "Replay - Golden Hour Groove",
    ["Golden Era Groove 5.14.26", "Golden Hour Groove 6.4.2026"],
  ],
  [
    "Replay - Alt-Rock Barroom Radio",
    [
      "Alt Rock Bar Room Radio 5.14.26",
      "Alt-Rock Bar Room Radio 6.4.26",
      "Alt Rock Bar Room Radio 6.11.2026",
    ],
  ],
  ["Replay - House Party Frequency", ["House Party Frequency 6.5.2026"]],
  [
    "Replay - Weird Late-Night FM",
    ["Weird Late-Night FM 5.29.2026", "Night FM 6.5.2026"],
  ],
  ["Replay - Cali Sun Reggae Ride", ["Cali Sun Reggae Ride 5.30.2026"]],
  ["Replay - Campfire Americana", ["Campfire Americana 5.30.2026"]],
  ["Replay - Lowrider Soul Sunday", ["Lowrider Soul Sunday 5.31.2026"]],
  ["Replay - Skull County Garage Gospel", ["Skull County Garage Gospel 5.31.2026"]],
]);

const apply = process.argv.includes("--apply");

if (!apply) {
  console.log("DRY RUN: add --apply to create categories and assign tracks.");
}

const token = await readLive365BearerToken();
const [categories, tracks] = await Promise.all([listCategories(token), listTracks(token)]);
const categoriesByName = new Map(categories.map((category) => [category.attributes.name, category]));
const tracksByTitle = new Map(tracks.map((track) => [normalize(track.attributes.title), track]));

const finalCategories = new Map(categoriesByName);

for (const name of REPLAY_CATEGORIES) {
  const existing = categoriesByName.get(name);
  if (existing) {
    console.log(`CATEGORY exists: ${name} (${existing.id})`);
    continue;
  }

  if (!apply) {
    console.log(`CATEGORY would create: ${name}`);
    continue;
  }

  const created = await createCategory(token, name);
  finalCategories.set(name, created);
  console.log(`CATEGORY created: ${name} (${created.id})`);
}

for (const [categoryName, titles] of READY_ASSIGNMENTS) {
  const category = finalCategories.get(categoryName);
  if (!category) {
    console.log(`ASSIGN skipped missing category: ${categoryName}`);
    continue;
  }

  const trackIds = [];
  const missingTitles = [];

  for (const title of titles) {
    const track = tracksByTitle.get(normalize(title));
    if (!track) {
      missingTitles.push(title);
      continue;
    }

    const currentCategoryIds = track.relationships?.categories?.data?.map((item) => item.id) ?? [];
    if (currentCategoryIds.includes(category.id)) {
      console.log(`ASSIGN exists: ${title} -> ${categoryName}`);
      continue;
    }

    trackIds.push(track.id);
  }

  for (const title of missingTitles) {
    console.log(`ASSIGN missing track: ${title} -> ${categoryName}`);
  }

  if (trackIds.length === 0) {
    continue;
  }

  if (!apply) {
    console.log(`ASSIGN would add ${trackIds.length} track(s) -> ${categoryName}`);
    continue;
  }

  await addTracksToCategory(token, trackIds, category.id);
  console.log(`ASSIGN added ${trackIds.length} track(s) -> ${categoryName}`);
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

async function listCategories(token) {
  const categories = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = new URL("https://dashboard.live365.com/api/v1/categories/");
    url.searchParams.set("page[number]", String(page));
    url.searchParams.set("page[size]", "100");
    url.searchParams.set("filter[station]", STATION_ID);
    const json = await apiJson(token, url);
    const batch = Array.isArray(json.data) ? json.data : [];
    categories.push(...batch);
    if (batch.length < 100) break;
  }
  return categories;
}

async function listTracks(token) {
  const tracks = [];
  for (let page = 1; page <= 20; page += 1) {
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

async function createCategory(token, name) {
  const json = await apiJson(token, "https://dashboard.live365.com/api/v1/categories/", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "categories",
        attributes: {
          name,
          color: CATEGORY_COLOR,
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

async function addTracksToCategory(token, trackIds, categoryId) {
  await apiJson(token, "https://dashboard.live365.com/api/v1/bulk/tracks/", {
    method: "POST",
    body: JSON.stringify({
      meta: {
        all_tracks: false,
      },
      data: {
        type: "edit_tracks",
        attributes: {
          track_uuids: trackIds,
          category_ids: [categoryId],
          keep_categories: true,
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
    }),
  });
}

async function apiJson(token, url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body) {
    headers.set("Content-Type", "application/vnd.api+json");
  }

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
