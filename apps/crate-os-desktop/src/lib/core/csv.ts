import type { LibraryTrack } from "./types.js";

const headers: Array<keyof LibraryTrack> = [
  "path",
  "relativeFolder",
  "filename",
  "extension",
  "fileSizeBytes",
  "artist",
  "title",
  "album",
  "durationSeconds",
  "genre",
  "year",
  "proposedBucket",
  "live365Readiness",
  "duplicateKey",
  "parseError",
];

export function tracksToCsv(tracks: LibraryTrack[]) {
  return [
    headers.join(","),
    ...tracks.map((track) => headers.map((header) => csvCell(track[header])).join(",")),
  ].join("\n");
}

function csvCell(value: unknown) {
  const stringValue = String(value ?? "");
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}
