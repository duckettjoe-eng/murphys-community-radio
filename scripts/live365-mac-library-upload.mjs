import { execFile as execFileCallback } from "node:child_process";
import crypto from "node:crypto";
import { openAsBlob } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const STATION_ID = "40167";
const COOKIE_DB =
  "/Users/joe/Library/Application Support/Codex/Partitions/codex-browser-app/Cookies";
const INVENTORY =
  "/Volumes/xtragood/Documents/Murphys Community Radio/Reports/qc_approved.csv";
const PLAN_EXPORT =
  "/Users/joe/Desktop/murphys-community-radio/mcr_country_library_builder/exports/live365_macbook_approved_upload_plan.csv";
const TMP_DIR = path.join(os.tmpdir(), "mcr-live365-mac-library-upload");
const PLAYLIST_COLOR = "#2E6F86";
const MIN_BROADCAST_SECONDS = 45;
const MAX_LIVE365_SECONDS = 4 * 60 * 60;
const CATEGORY_BY_BUCKET = {
  day_safe: "MCR Day Safe",
  day_safe_review: "MCR Day Safe - Review",
  club_late_night: "MCR Club Late Night",
  longform_early_sunday: "MCR Early Sunday Longform",
  quarantine_spoken_word: "MCR Quarantine - Spoken Word Review",
  mixtape_dj_edit_review: "MCR Mixtape / DJ Edit Review",
};
const NORMAL_ROTATION_BUCKETS = ["day_safe", "day_safe_review", "club_late_night"];
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
  "drum & bass",
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
  "alternative",
  "americana",
  "blues",
  "classic",
  "country",
  "folk",
  "funk",
  "hip-hop",
  "hip hop",
  "jazz",
  "oldies",
  "pop",
  "r&b",
  "reggae",
  "rock",
  "soul",
];
const LONGFORM_TERMS = [
  "audiobook",
  "episode",
  "interview",
  "lecture",
  "podcast",
  "sermon",
  "speech",
  "spoken word",
];
const SPOKEN_WORD_QUARANTINE_TERMS = [
  "bible",
  "church",
  "homily",
  "lecture",
  "ministry",
  "pastor",
  "podcast",
  "prayer",
  "preacher",
  "preaching",
  "rev",
  "reverend",
  "scripture",
  "sermon",
  "speech",
  "spoken word",
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

const CLOCKWHEELS = [
  {
    name: "MCR AutoDJ - Day Safe",
    categories: ["MCR Day Safe"],
  },
  {
    name: "MCR AutoDJ - Club Late Night",
    categories: ["MCR Club Late Night"],
  },
  {
    name: "MCR AutoDJ - Early Sunday Longform",
    categories: ["MCR Early Sunday Longform"],
  },
];

const EVENTS = [
  {
    title: "MCR AutoDJ - Day Safe Mon-Wed",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-22T13:00:00+0000",
    duration: 43200,
    recurringDays: [0, 1, 2],
  },
  {
    title: "MCR AutoDJ - Day Safe Thursday",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-18T13:00:00+0000",
    duration: 43200,
    recurringDays: [3],
  },
  {
    title: "MCR AutoDJ - Day Safe Friday",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-19T13:00:00+0000",
    duration: 46800,
    recurringDays: [4],
  },
  {
    title: "MCR AutoDJ - Day Safe Saturday",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-20T13:00:00+0000",
    duration: 39600,
    recurringDays: [5],
  },
  {
    title: "MCR AutoDJ - Day Safe Sunday Morning",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-21T13:00:00+0000",
    duration: 14400,
    recurringDays: [6],
  },
  {
    title: "MCR AutoDJ - Day Safe Sunday Afternoon",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-21T21:00:00+0000",
    duration: 14400,
    recurringDays: [6],
  },
  {
    title: "MCR AutoDJ - Day Safe Prime Time Monday",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-23T01:00:00+0000",
    duration: 18000,
    recurringDays: [0],
  },
  {
    title: "MCR AutoDJ - Day Safe Prime Time Tuesday",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-24T01:00:00+0000",
    duration: 18000,
    recurringDays: [1],
  },
  {
    title: "MCR AutoDJ - Day Safe Prime Time Wednesday",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-25T01:00:00+0000",
    duration: 18000,
    recurringDays: [2],
  },
  {
    title: "MCR AutoDJ - Day Safe Prime Time Thursday",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-26T01:00:00+0000",
    duration: 18000,
    recurringDays: [3],
  },
  {
    title: "MCR AutoDJ - Day Safe Prime Time Friday",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-20T02:00:00+0000",
    duration: 14400,
    recurringDays: [4],
  },
  {
    title: "MCR AutoDJ - Day Safe Prime Time Saturday",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-21T00:00:00+0000",
    duration: 21600,
    recurringDays: [5],
  },
  {
    title: "MCR AutoDJ - Day Safe Prime Time Sunday",
    clockwheelTitle: "MCR AutoDJ - Day Safe",
    startTime: "2026-06-22T01:00:00+0000",
    duration: 18000,
    recurringDays: [6],
  },
  {
    title: "MCR AutoDJ - Club Late Night Mon-Thu",
    clockwheelTitle: "MCR AutoDJ - Club Late Night",
    startTime: "2026-06-23T06:00:00+0000",
    duration: 25200,
    recurringDays: [0, 1, 2, 3],
  },
  {
    title: "MCR AutoDJ - Club Late Night Friday",
    clockwheelTitle: "MCR AutoDJ - Club Late Night",
    startTime: "2026-06-20T06:00:00+0000",
    duration: 25200,
    recurringDays: [4],
  },
  {
    title: "MCR AutoDJ - Club Late Saturday",
    clockwheelTitle: "MCR AutoDJ - Club Late Night",
    startTime: "2026-06-21T05:00:00+0000",
    duration: 14400,
    recurringDays: [5],
  },
  {
    title: "MCR AutoDJ - Early Sunday Longform",
    clockwheelTitle: "MCR AutoDJ - Early Sunday Longform",
    startTime: "2026-06-21T09:00:00+0000",
    duration: 14340,
    recurringDays: [6],
  },
  {
    title: "MCR AutoDJ - Club Late Night Sunday",
    clockwheelTitle: "MCR AutoDJ - Club Late Night",
    startTime: "2026-06-22T06:00:00+0000",
    duration: 25200,
    recurringDays: [6],
  },
];

const argv = parseArgs(process.argv.slice(2));
const apply = Boolean(argv.apply);
const schedule = Boolean(argv.schedule);
const repairSchedule = Boolean(argv["repair-schedule"]);

if (!apply && !repairSchedule) {
  console.log("DRY RUN: add --apply to upload/categorize the non-country Mac library.");
}
if (apply && !schedule && !repairSchedule) {
  console.log("Schedule events disabled; add --schedule to create clockwheel schedule blocks.");
}

let plan = [];
if (!repairSchedule) {
  const sourceRows = (await readCsv(INVENTORY)).map(normalizeInventoryRow);
  plan = sourceRows.filter((row) => row.live365_upload_status === "eligible_reviewed_by_bucket");
  const skipped = sourceRows.filter((row) => row.live365_upload_status !== "eligible_reviewed_by_bucket");
  await fs.writeFile(PLAN_EXPORT, toCsv([...plan, ...skipped]));
  console.log(`Approved MacBook QC tracks: ${sourceRows.length}`);
  console.log(`Eligible for Live365 upload/categorizing: ${plan.length}`);
  console.log(`Skipped before upload: ${skipped.length}`);
  console.log(`Review/export plan: ${PLAN_EXPORT}`);
  for (const [bucket, rows] of groupBy(plan, (row) => row.proposed_bucket)) {
    console.log(`- ${bucket}: ${rows.length}`);
  }
}

if (!apply && !repairSchedule) process.exit(0);

const token = await readLive365BearerToken();
const categories = await ensureCategories(token, Object.values(CATEGORY_BY_BUCKET));

if (repairSchedule) {
  const tracks = await listTracks(token);
  const quarantined = await quarantineExistingTracks(token, tracks, categories);
  const clockwheels = await ensureClockwheels(token, categories);
  if (schedule) await ensureScheduleEvents(token, clockwheels);
  else console.log("Schedule events disabled; add --schedule to create clockwheel schedule blocks.");
  await verifyRotationSafety(token, categories);
  console.log(`Done. Quarantined ${quarantined} spoken-word/religious podcast track(s).`);
  process.exit(0);
}

const station = await apiJson(token, `https://dashboard.live365.com/api/v1/stations/${STATION_ID}`);
const mediaServiceUuid = station?.data?.attributes?.media_service_uuid;
if (!mediaServiceUuid) throw new Error(`Could not find media_service_uuid for station ${STATION_ID}.`);

const tracksByKey = new Map((await listTracks(token)).map((track) => [trackKey(track), track]));
const uploaded = [];

for (const item of plan) {
  const artist = cleanMetadata(item.artist || "Unknown Artist");
  const title = cleanMetadata(item.title || path.basename(item.path, path.extname(item.path)));
  const album = cleanMetadata(item.album || "MacBook Music Library");
  const key = metadataKey(artist, title);
  let track = tracksByKey.get(key);

  if (!track) {
    const uploadPath = await uploadablePath(item.path);
    console.log(`UPLOAD ${item.proposed_bucket}: ${artist} - ${title}`);
    let response;
    try {
      response = await uploadMusicTrack({ token, mediaServiceUuid, filePath: uploadPath });
    } catch (error) {
      if (String(error.message || error).includes("Track is already part of library")) {
        console.log(`SKIP duplicate file already in Live365: ${artist} - ${title}`);
        continue;
      }
      throw error;
    }
    const trackId = response?.data?.attributes?.uuid ?? response?.data?.id;
    if (!trackId) throw new Error(`Upload response did not include a track uuid for ${item.path}.`);
    await updateTrackMetadata(token, trackId, { artist, title, album });
    track = await getTrack(token, trackId);
    tracksByKey.set(trackKey(track), track);
  } else {
    console.log(`TRACK exists: ${artist} - ${title} (${track.id})`);
  }

  const categoryName = CATEGORY_BY_BUCKET[item.proposed_bucket] ?? "MCR Day Safe - Review";
  const category = categories.get(categoryName);
  await addTrackToCategory(token, track, category.id);
  uploaded.push({ ...item, artist, title, trackId: track.id, categoryName });
}

if (schedule) {
  const clockwheels = await ensureClockwheels(token, categories);
  await ensureScheduleEvents(token, clockwheels);
}

console.log(`Done. Uploaded/categorized ${uploaded.length} Mac library track(s).`);

async function uploadablePath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".mp3", ".m4a", ".aac", ".flac", ".mp4"].includes(ext)) return filePath;
  await fs.mkdir(TMP_DIR, { recursive: true });
  const out = path.join(TMP_DIR, `${path.basename(filePath, ext)}.mp3`);
  await execFile("/opt/homebrew/bin/ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    filePath,
    "-codec:a",
    "libmp3lame",
    "-b:a",
    "192k",
    out,
  ]);
  return out;
}

function normalizeInventoryRow(row) {
  const mountedPath = mountedMacbookPath(row.path || row.source_path || "");
  const normalized = {
    path: mountedPath,
    filename: row.filename || path.basename(mountedPath),
    extension: (row.extension || path.extname(mountedPath)).toLowerCase(),
    file_size_bytes: row.file_size_bytes || "",
    file_size_mb: row.file_size_mb || "",
    artist: row.artist || "",
    title: row.title || "",
    album: row.album || "",
    duration_seconds: row.duration_seconds || "",
    genre: row.genre || "",
    year: row.year || row.date || "",
    qc_status: row.qc_status || "",
    qc_reasons: row.qc_reasons || "",
    proposed_bucket: row.proposed_bucket || "",
    live365_upload_status: row.live365_upload_status || "",
    parse_error: row.parse_error || "",
  };
  const haystack = metadataHaystack(normalized);
  if (shouldBlockMixtapeDjEdit(haystack)) {
    normalized.proposed_bucket = "mixtape_dj_edit_review";
    normalized.live365_upload_status = "skip_mixtape_dj_edit_review";
    return normalized;
  }
  if (!normalized.proposed_bucket) normalized.proposed_bucket = classifyBucket(normalized);
  if (!normalized.live365_upload_status) normalized.live365_upload_status = live365Status(normalized);
  return normalized;
}

function mountedMacbookPath(filePath) {
  return String(filePath || "").replace(
    /^\/Users\/xtragood\//,
    "/Volumes/xtragood/",
  );
}

function classifyBucket(row) {
  const duration = Number.parseFloat(row.duration_seconds || "0");
  const haystack = metadataHaystack(row);

  if (duration > MAX_LIVE365_SECONDS) return "too_long_for_live365_review";
  if (shouldQuarantineMetadata(haystack, duration)) return "quarantine_spoken_word";
  if (shouldBlockMixtapeDjEdit(haystack)) return "mixtape_dj_edit_review";
  if (duration > 30 * 60 || includesTerm(haystack, LONGFORM_TERMS)) return "longform_early_sunday";
  if (duration > 0 && duration < MIN_BROADCAST_SECONDS) return "short_audio_review";
  if (includesTerm(haystack, CLUB_TERMS)) return "club_late_night";
  if (includesTerm(haystack, DAY_SAFE_TERMS)) return "day_safe";
  return "day_safe_review";
}

function live365Status(row) {
  const duration = Number.parseFloat(row.duration_seconds || "0");
  if (shouldBlockMixtapeDjEdit(metadataHaystack(row))) return "skip_mixtape_dj_edit_review";
  if (!row.path) return "skip_missing_file_path";
  if (!row.artist || !row.title) return "skip_missing_metadata";
  if (!row.duration_seconds) return "metadata_review_before_upload";
  if (duration > MAX_LIVE365_SECONDS) return "skip_live365_over_4_hours";
  if (duration < MIN_BROADCAST_SECONDS) return "skip_short_audio_review";
  return "eligible_reviewed_by_bucket";
}

function metadataHaystack(row) {
  return [
    row.path,
    row.filename,
    row.artist,
    row.title,
    row.album,
    row.genre,
  ]
    .join(" ")
    .toLowerCase();
}

async function uploadMusicTrack({ token, mediaServiceUuid, filePath }) {
  const ext = path.extname(filePath).toLowerCase();
  const type = ext === ".m4a" || ext === ".mp4" ? "audio/mp4" : "audio/mpeg";
  const file = await openAsBlob(filePath, { type });
  const body = new FormData();
  body.append("file", file, path.basename(filePath));
  return apiJson(token, `https://media.live365.com/upload/${mediaServiceUuid}/track/music`, {
    method: "POST",
    body,
  });
}

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

async function addTrackToCategory(token, track, categoryId) {
  const current = track.relationships?.categories?.data?.map((item) => item.id) ?? [];
  if (current.includes(categoryId)) return;
  await setTrackCategories(token, track.id, [...new Set([...current, categoryId])]);
}

async function setTrackCategories(token, trackId, categoryIds) {
  await apiJson(token, "https://dashboard.live365.com/api/v1/bulk/tracks/", {
    method: "POST",
    body: JSON.stringify({
      meta: { all_tracks: false },
      data: {
        attributes: {
          track_uuids: [trackId],
          category_ids: categoryIds,
        },
        relationships: { station: { data: { id: STATION_ID, type: "stations" } } },
        type: "edit_tracks",
      },
    }),
  });
}

async function quarantineExistingTracks(token, tracks, categories) {
  const quarantine = categories.get(CATEGORY_BY_BUCKET.quarantine_spoken_word);
  const normalCategoryIds = new Set(
    NORMAL_ROTATION_BUCKETS.map((bucket) => categories.get(CATEGORY_BY_BUCKET[bucket])?.id).filter(Boolean),
  );
  let quarantined = 0;

  for (const track of tracks) {
    if (!shouldQuarantineTrack(track)) continue;

    const current = track.relationships?.categories?.data?.map((item) => item.id) ?? [];
    const next = [...new Set([...current.filter((id) => !normalCategoryIds.has(id)), quarantine.id])];
    if (sameSet(current, next)) continue;

    await setTrackCategories(token, track.id, next);
    quarantined += 1;
    console.log(`QUARANTINE spoken-word review: ${trackLabel(track)}`);
  }

  return quarantined;
}

async function ensureClockwheels(token, categories) {
  const existing = await listPaged(token, "clockwheels");
  const byName = new Map(existing.map((clockwheel) => [clockwheel.attributes.name, clockwheel]));
  for (const config of CLOCKWHEELS) {
    let clockwheel = byName.get(config.name);
    if (!clockwheel) {
      const created = await apiJson(token, "https://dashboard.live365.com/api/v1/clockwheels/", {
        method: "POST",
        body: JSON.stringify({
          data: {
            type: "clockwheels",
            attributes: { name: config.name, color: PLAYLIST_COLOR },
            relationships: { station: { data: { id: STATION_ID, type: "stations" } } },
          },
          meta: {},
        }),
      });
      clockwheel = created.data;
      byName.set(config.name, clockwheel);
      console.log(`CLOCKWHEEL created: ${config.name}`);
    }
    const entries = config.categories
      .map((name) => categories.get(name)?.id)
      .filter(Boolean)
      .map((categoryId) => ({ select_type: "random", category: categoryId }));
    await apiJson(token, "https://dashboard.live365.com/api/v1/bulk/clockwheel-entries/", {
      method: "POST",
      body: JSON.stringify({ clockwheel: clockwheel.id, entries }),
      contentType: "application/json",
    });
    console.log(`CLOCKWHEEL updated: ${config.name} (${entries.length} categories)`);
  }
  return byName;
}

async function ensureScheduleEvents(token, clockwheels) {
  const events = await listEvents(token);
  for (const event of EVENTS) {
    const existing = events.find((candidate) => isSameSlot(candidate, event));
    if (existing) {
      console.log(`EVENT exists, skipped: ${event.title} (${existing.id})`);
      continue;
    }
    const conflict = events.find((candidate) => isConflictingSlot(candidate, event));
    if (conflict) {
      console.log(`EVENT skipped conflict: ${event.title} conflicts with ${conflict.attributes.title}`);
      continue;
    }
    const clockwheel = clockwheels.get(event.clockwheelTitle);
    if (!clockwheel) {
      console.log(`EVENT skipped missing clockwheel: ${event.title}`);
      continue;
    }
    try {
      const created = await apiJson(token, "https://dashboard.live365.com/api/v1/events/", {
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
              series_end: "2027-06-30T06:59:59+0000",
            },
            relationships: {
              station: { data: { id: STATION_ID, type: "stations" } },
              clockwheel: { data: { id: clockwheel.id, type: "clockwheels" } },
            },
          },
          meta: {},
        }),
      });
      console.log(`EVENT created: ${event.title} (${created.data.id})`);
    } catch (error) {
      if (String(error.message || error).includes("409 CONFLICT")) {
        console.log(`EVENT skipped conflict: ${event.title}: ${error.message}`);
        continue;
      }
      throw error;
    }
  }
}

async function verifyRotationSafety(token, categories) {
  const tracks = await listTracks(token);
  const normalCategoryIds = new Set(
    NORMAL_ROTATION_BUCKETS.map((bucket) => categories.get(CATEGORY_BY_BUCKET[bucket])?.id).filter(Boolean),
  );
  const unsafeNormalTracks = tracks.filter((track) => {
    if (!shouldQuarantineTrack(track)) return false;
    const current = track.relationships?.categories?.data?.map((item) => item.id) ?? [];
    return current.some((id) => normalCategoryIds.has(id));
  });

  if (unsafeNormalTracks.length === 0) {
    console.log("VERIFY ok: no podcast/reverend/sermon tracks remain in normal rotation categories.");
  } else {
    console.log(`VERIFY warning: ${unsafeNormalTracks.length} unsafe track(s) still appear in normal rotation categories.`);
    for (const track of unsafeNormalTracks.slice(0, 20)) console.log(`- ${trackLabel(track)}`);
  }

  const events = await listEvents(token);
  const earlySundayLongform = events.filter(
    (event) => normalize(event.attributes?.title) === normalize("MCR AutoDJ - Early Sunday Longform"),
  );
  if (
    earlySundayLongform.length === 1 &&
    earlySundayLongform[0].attributes.start_time === "2026-06-21T09:00:00+0000" &&
    Number(earlySundayLongform[0].attributes.duration) === 14340
  ) {
    console.log("VERIFY ok: Early Sunday Longform is scheduled only for Sunday 2 AM-5:59 AM.");
  } else {
    console.log(`VERIFY warning: found ${earlySundayLongform.length} Early Sunday Longform schedule event(s).`);
  }
}

async function updateTrackMetadata(token, trackId, item) {
  await apiJson(token, "https://dashboard.live365.com/api/v1/bulk/tracks/", {
    method: "POST",
    body: JSON.stringify({
      meta: { all_tracks: false },
      data: {
        attributes: {
          track_uuids: [trackId],
          title: item.title,
          artist: item.artist,
          album: item.album,
        },
        relationships: { station: { data: { id: STATION_ID, type: "stations" } } },
        type: "edit_tracks",
      },
    }),
  });
}

async function getTrack(token, trackId) {
  return (await apiJson(token, `https://dashboard.live365.com/api/v1/tracks/${trackId}`)).data;
}

async function listTracks(token) {
  const tracks = [];
  for (let page = 1; page <= 50; page += 1) {
    const url = new URL("https://dashboard.live365.com/api/v1/tracks/");
    url.searchParams.set("filter[station]", STATION_ID);
    url.searchParams.set("page[number]", String(page));
    url.searchParams.set("page[size]", "100");
    const json = await apiJson(token, url);
    const batch = Array.isArray(json.data) ? json.data : [];
    tracks.push(...batch);
    if (batch.length < 100) break;
  }
  return tracks;
}

async function listEvents(token) {
  const url = new URL("https://dashboard.live365.com/api/v1/events/");
  url.searchParams.set("filter[station]", STATION_ID);
  url.searchParams.set("filter[interval]", "2026-06-01:2027-07-01");
  const json = await apiJson(token, url);
  return Array.isArray(json.data) ? json.data : [];
}

async function listPaged(token, resource) {
  const items = [];
  for (let page = 1; page <= 20; page += 1) {
    const url = new URL(`https://dashboard.live365.com/api/v1/${resource}/`);
    url.searchParams.set("filter[station]", STATION_ID);
    url.searchParams.set("page[number]", String(page));
    url.searchParams.set("page[size]", "100");
    const json = await apiJson(token, url);
    const batch = Array.isArray(json.data) ? json.data : [];
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

async function apiJson(token, url, options = {}) {
  const attempts = 8;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const headers = new Headers(options.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", options.contentType ?? "application/vnd.api+json");
    }

    try {
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
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < attempts) {
          await delay(3000 * attempt);
          continue;
        }
        const error = new Error(
          `Live365 API ${response.status} ${response.statusText}: ${JSON.stringify(json)}`,
        );
        error.noRetry = !retryable;
        throw error;
      }
      return json;
    } catch (error) {
      if (error.noRetry) throw error;
      if (attempt >= attempts) throw error;
      console.log(`RETRY ${attempt}/${attempts - 1}: ${error.message}`);
      await delay(3000 * attempt);
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const key = crypto.pbkdf2Sync(password.replace(/\n$/, ""), "saltysalt", 1003, 16, "sha1");
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, Buffer.alloc(16, " "));
  let decrypted = Buffer.concat([decipher.update(encrypted.subarray(3)), decipher.final()]);
  const hostHash = crypto.createHash("sha256").update("dashboard.live365.com").digest();
  if (decrypted.subarray(0, hostHash.length).equals(hostHash)) decrypted = decrypted.subarray(hostHash.length);
  const token = decrypted.toString("utf8");
  if (!token || token.length < 20 || /[^\x20-\x7e]/.test(token)) throw new Error("Could not decrypt Live365 bearer token.");
  return token;
}

async function readCsv(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  const rows = [];
  const lines = text.split(/\r?\n/).filter(Boolean);
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
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else current += char;
  }
  values.push(current);
  return values;
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

function groupBy(items, fn) {
  const map = new Map();
  for (const item of items) {
    const key = fn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function trackKey(track) {
  return metadataKey(track?.attributes?.artist, track?.attributes?.title);
}

function metadataKey(artist, title) {
  return `${normalize(artist)}|${normalize(title)}`;
}

function shouldQuarantineTrack(track) {
  const attributes = track?.attributes ?? {};
  const duration = trackDurationSeconds(track);
  const haystack = [
    attributes.artist,
    attributes.title,
    attributes.album,
    attributes.genre,
    attributes.description,
    attributes.filename,
    attributes.original_filename,
  ].join(" ");
  return shouldQuarantineMetadata(haystack, duration);
}

function shouldBlockMixtapeDjEdit(haystack) {
  if (haystack.includes("dj hello joey")) return false;
  return includesTerm(cleanComparable(haystack), MIXTAPE_DJ_EDIT_TERMS);
}

function shouldQuarantineMetadata(value, duration) {
  const hasQuarantineTerm = includesTerm(value, SPOKEN_WORD_QUARANTINE_TERMS);
  const isLongSpokenWord = duration > 30 * 60 && includesTerm(value, LONGFORM_TERMS);
  return hasQuarantineTerm || isLongSpokenWord;
}

function trackDurationSeconds(track) {
  const attributes = track?.attributes ?? {};
  const candidates = [
    attributes.duration_seconds,
    attributes.duration,
    attributes.length,
    attributes.length_seconds,
    attributes.runtime,
  ];
  for (const candidate of candidates) {
    const parsed = Number.parseFloat(candidate);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function trackLabel(track) {
  const attributes = track?.attributes ?? {};
  return `${cleanMetadata(attributes.artist || "Unknown Artist")} - ${cleanMetadata(attributes.title || track?.id || "Unknown Title")}`;
}

function sameSet(left, right) {
  if (left.length !== right.length) return false;
  const leftSet = new Set(left);
  return right.every((item) => leftSet.has(item));
}

function cleanMetadata(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 240) || "Unknown";
}

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function includesTerm(value, terms) {
  const normalizedValue = ` ${normalize(value)} `;
  return terms.some((term) => normalizedValue.includes(` ${normalize(term)} `));
}

function toCsv(rows) {
  const headers = [
    "path",
    "filename",
    "extension",
    "file_size_bytes",
    "file_size_mb",
    "artist",
    "title",
    "album",
    "duration_seconds",
    "genre",
    "year",
    "qc_status",
    "qc_reasons",
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

function parseArgs(args) {
  const parsed = {};
  for (const arg of args) {
    if (arg === "--apply") parsed.apply = true;
    else if (arg === "--schedule") parsed.schedule = true;
    else if (arg === "--repair-schedule") parsed["repair-schedule"] = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}
