import type { ScanSummary } from "./types.js";

export function formatScanReport(summary: ScanSummary) {
  const lines = [
    `Root: ${summary.root}`,
    `Tracks scanned: ${summary.trackCount}`,
    `Total size: ${formatBytes(summary.totalBytes)}`,
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
  ];

  return `${lines.join("\n")}\n`;
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
