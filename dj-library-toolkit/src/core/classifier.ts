import type { LibraryTrack, Live365Readiness, TrackBucket } from "./types.js";

export const audioExtensions = new Set([
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

const clubTerms = [
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

const daySafeTerms = [
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

const longformTerms = [
  "audiobook",
  "interview",
  "lecture",
  "mix",
  "podcast",
  "sermon",
  "speech",
  "talk",
];

const mixtapeDjEditTerms = [
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

export function classifyTrack(track: Pick<LibraryTrack, "album" | "artist" | "durationSeconds" | "filename" | "genre" | "path" | "title">): TrackBucket {
  const duration = track.durationSeconds ?? 0;
  const haystack = buildHaystack(track);

  if (duration > 4 * 60 * 60) return "too_long_for_live365_review";
  if (shouldBlockMixtapeDjEdit(haystack)) return "mixtape_dj_edit_review";
  if (duration > 30 * 60 || includesAny(haystack, longformTerms)) return "longform_radio";
  if (duration > 0 && duration < 45) return "short_audio_review";
  if (includesAny(haystack, ["spoken word", "spoken-word", "talk"])) return "spoken_word_review";
  if (includesAny(haystack, clubTerms)) return "club_late_night";
  if (includesAny(haystack, daySafeTerms)) return "day_safe";
  return "day_safe_review";
}

export function live365Readiness(track: Pick<LibraryTrack, "album" | "artist" | "durationSeconds" | "filename" | "genre" | "path" | "title">): Live365Readiness {
  const duration = track.durationSeconds ?? 0;
  const haystack = buildHaystack(track);

  if (shouldBlockMixtapeDjEdit(haystack)) return "skip_mixtape_dj_edit_review";
  if (track.durationSeconds === null) return "metadata_review_before_upload";
  if (duration > 4 * 60 * 60) return "skip_live365_over_4_hours";
  if (duration < 45) return "skip_short_audio_review";
  return "eligible_reviewed_by_bucket";
}

export function duplicateKey(track: Pick<LibraryTrack, "artist" | "fileSizeBytes" | "title">) {
  const artist = normalizeComparable(track.artist);
  const title = normalizeComparable(track.title);
  const sizeBucket = track.fileSizeBytes ? Math.round(track.fileSizeBytes / 1024 / 1024) : "unknown";
  return `${artist}|${title}|${sizeBucket}`;
}

function buildHaystack(track: Pick<LibraryTrack, "album" | "artist" | "filename" | "genre" | "path" | "title">) {
  return [track.path, track.filename, track.artist, track.title, track.album, track.genre]
    .join(" ")
    .toLowerCase();
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function shouldBlockMixtapeDjEdit(haystack: string) {
  if (haystack.includes("dj hello joey")) return false;
  const comparable = normalizeComparable(haystack);
  return mixtapeDjEditTerms.some((term) => comparable.includes(normalizeComparable(term)));
}

function normalizeComparable(value: string) {
  return value.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
