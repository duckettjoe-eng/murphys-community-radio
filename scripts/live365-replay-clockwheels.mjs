import { execFile as execFileCallback } from "node:child_process";
import crypto from "node:crypto";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const STATION_ID = "40167";
const COOKIE_DB =
  "/Users/joe/Library/Application Support/Codex/Partitions/codex-browser-app/Cookies";
const CLOCKWHEEL_COLOR = "#FD631C";

const REPLAY_CLOCKWHEELS = new Map([
  [
    "Replay Block - Thursday Shows",
    ["Replay - Golden Hour Groove", "Replay - Alt-Rock Barroom Radio"],
  ],
  [
    "Replay Block - Friday Shows",
    ["Replay - House Party Frequency", "Replay - Weird Late-Night FM"],
  ],
  [
    "Replay Block - Saturday Shows",
    ["Replay - Cali Sun Reggae Ride", "Replay - Campfire Americana"],
  ],
  [
    "Replay Block - Sunday Shows",
    ["Replay - Lowrider Soul Sunday", "Replay - Skull County Garage Gospel"],
  ],
]);

const apply = process.argv.includes("--apply");

if (!apply) {
  console.log("DRY RUN: add --apply to create replay clockwheels.");
}

const token = await readLive365BearerToken();
const [categories, clockwheels] = await Promise.all([
  listCategories(token),
  listClockwheels(token),
]);

const categoriesByName = new Map(categories.map((category) => [category.attributes.name, category]));
const clockwheelsByName = new Map(
  clockwheels.map((clockwheel) => [clockwheel.attributes.name, clockwheel]),
);

for (const [clockwheelName, categoryNames] of REPLAY_CLOCKWHEELS) {
  const existing = clockwheelsByName.get(clockwheelName);
  if (existing) {
    console.log(`CLOCKWHEEL exists, left unchanged: ${clockwheelName} (${existing.id})`);
    continue;
  }

  const categoryIds = [];
  for (const categoryName of categoryNames) {
    const category = categoriesByName.get(categoryName);
    if (!category) {
      console.log(`CLOCKWHEEL missing category: ${clockwheelName} needs ${categoryName}`);
      continue;
    }
    categoryIds.push(category.id);
  }

  if (categoryIds.length === 0) {
    console.log(`CLOCKWHEEL skipped no ready categories: ${clockwheelName}`);
    continue;
  }

  if (!apply) {
    console.log(
      `CLOCKWHEEL would create: ${clockwheelName} with ${categoryIds.length} random category entries`,
    );
    continue;
  }

  const created = await createClockwheel(token, clockwheelName);
  await updateClockwheelEntries(token, created.id, categoryIds);
  console.log(
    `CLOCKWHEEL created: ${clockwheelName} (${created.id}) with ${categoryIds.length} entries`,
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

async function listCategories(token) {
  return listPaged(token, "categories");
}

async function listClockwheels(token) {
  return listPaged(token, "clockwheels");
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

async function createClockwheel(token, name) {
  const json = await apiJson(token, "https://dashboard.live365.com/api/v1/clockwheels/", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "clockwheels",
        attributes: {
          name,
          color: CLOCKWHEEL_COLOR,
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

async function updateClockwheelEntries(token, clockwheelId, categoryIds) {
  await apiJson(token, "https://dashboard.live365.com/api/v1/bulk/clockwheel-entries/", {
    method: "POST",
    contentType: "application/json",
    body: JSON.stringify({
      clockwheel: clockwheelId,
      entries: categoryIds.map((categoryId) => ({
        select_type: "random",
        category: categoryId,
      })),
    }),
  });
}

async function apiJson(token, url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body) {
    headers.set("Content-Type", options.contentType ?? "application/vnd.api+json");
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
