import { execFile as execFileCallback } from "node:child_process";
import crypto from "node:crypto";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const STATION_ID = "40167";
const COOKIE_DB =
  "/Users/joe/Library/Application Support/Codex/Partitions/codex-browser-app/Cookies";
const REVIEW_CATEGORY = "MCR Mixtape / DJ Edit Review";
const NORMAL_ROTATION_CATEGORIES = [
  "MCR Day Safe",
  "MCR Day Safe - Review",
  "MCR Club Late Night",
];
const PLAYLIST_COLOR = "#2E6F86";
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

const apply = process.argv.includes("--apply");

if (!apply) {
  console.log("DRY RUN: add --apply to mark matched Live365 tracks do_not_play and quarantine them.");
}

const token = await readLive365BearerToken();
const categories = await ensureCategories(token, [REVIEW_CATEGORY, ...NORMAL_ROTATION_CATEGORIES]);
const tracks = await listTracks(token);
const matches = tracks.filter(shouldBlockTrack);
const playableMatches = matches.filter((track) => !track.attributes?.do_not_play);

console.log(`Live365 tracks scanned: ${tracks.length}`);
console.log(`Matched mixtape/DJ-edit tracks: ${matches.length}`);
console.log(`Matched tracks still playable: ${playableMatches.length}`);

for (const track of matches) {
  const blocked = track.attributes?.do_not_play ? "blocked" : "PLAYABLE";
  console.log(`${blocked} | ${track.id} | ${trackLabel(track)}`);
}

if (!apply) {
  process.exit(0);
}

const reviewCategory = categories.get(REVIEW_CATEGORY);
const normalCategoryIds = new Set(
  NORMAL_ROTATION_CATEGORIES.map((name) => categories.get(name)?.id).filter(Boolean),
);

for (const track of matches) {
  const current = track.relationships?.categories?.data?.map((item) => item.id) ?? [];
  const next = [...new Set([...current.filter((id) => !normalCategoryIds.has(id)), reviewCategory.id])];
  await editTrack(token, track.id, {
    category_ids: next,
    do_not_play: true,
  });
  console.log(`QUARANTINE mixtape/DJ edit: ${trackLabel(track)}`);
}

console.log(`Done. Quarantined ${matches.length} matched track(s); ${playableMatches.length} were still playable.`);

async function ensureCategories(token, names) {
  const existing = await listPaged(token, "categories");
  const byName = new Map(existing.map((category) => [category.attributes.name, category]));
  for (const name of names) {
    if (byName.has(name)) continue;
    const created = await apiJson(token, "https://dashboard.live365.com/api/v1/categories/", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "categories",
          attributes: { name, color: PLAYLIST_COLOR },
          relationships: { station: { data: { id: STATION_ID, type: "stations" } } },
        },
        meta: {},
      }),
    });
    byName.set(name, created.data);
    console.log(`CATEGORY created: ${name}`);
  }
  return byName;
}

async function editTrack(token, trackId, attributes) {
  await apiJson(token, "https://dashboard.live365.com/api/v1/bulk/tracks/", {
    method: "POST",
    body: JSON.stringify({
      meta: { all_tracks: false },
      data: {
        attributes: {
          track_uuids: [trackId],
          ...attributes,
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

async function listTracks(token) {
  return listPaged(token, "tracks", 50);
}

async function listPaged(token, resource, maxPages = 20) {
  const items = [];

  for (let page = 1; page <= maxPages; page += 1) {
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

function shouldBlockTrack(track) {
  const attrs = track.attributes ?? {};
  const haystack = [attrs.artist, attrs.title, attrs.album, attrs.genre].join(" ").toLowerCase();
  if (haystack.includes("dj hello joey")) return false;
  const comparable = cleanComparable(haystack);
  return MIXTAPE_DJ_EDIT_TERMS.some((term) => comparable.includes(cleanComparable(term)));
}

function cleanComparable(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trackLabel(track) {
  const attrs = track.attributes ?? {};
  return `${attrs.artist || "Unknown Artist"} - ${attrs.title || "Untitled"}${attrs.album ? ` (${attrs.album})` : ""}`;
}
