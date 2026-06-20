import type { ScanSummary } from "./types.js";

export function formatScanReport(summary: ScanSummary) {
  const lines = [
    `Root: ${summary.root}`,
    `Tracks scanned: ${summary.trackCount}`,
    `Total size: ${formatBytes(summary.totalBytes)}`,
    `Known runtime: ${formatRuntime(summary.knownRuntimeSeconds)}`,
    `Tracks without runtime: ${summary.unknownRuntimeCount}`,
    `Duplicate candidate groups: ${summary.duplicateCandidateGroups}`,
    `Metadata parse errors: ${summary.parseErrorCount}`,
    "",
    "Extensions:",
    ...Object.entries(summary.extensionCounts)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([extension, count]) => `- ${extension}: ${count}`),
    "",
    "Buckets:",
    ...Object.entries(summary.bucketCounts)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([bucket, count]) => `- ${bucket}: ${count}`),
    "",
    "Folders:",
    ...summary.folderSummaries.map(
      (folder) =>
        `- ${folder.folder}: ${folder.trackCount} tracks, ${formatRuntime(folder.knownRuntimeSeconds)} known runtime, ${folder.unknownRuntimeCount} unknown`,
    ),
  ];

  return `${lines.join("\n")}\n`;
}

function formatRuntime(seconds: number) {
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  for (const unit of units) {
    if (value < 1024) return `${value.toFixed(2)} ${unit}`;
    value /= 1024;
  }
  return `${value.toFixed(2)} PB`;
}
