export type TrackBucket =
  | "club_late_night"
  | "day_safe"
  | "day_safe_review"
  | "longform_radio"
  | "mixtape_dj_edit_review"
  | "short_audio_review"
  | "spoken_word_review"
  | "too_long_for_live365_review";

export type Live365Readiness =
  | "eligible_reviewed_by_bucket"
  | "metadata_review_before_upload"
  | "skip_live365_over_4_hours"
  | "skip_mixtape_dj_edit_review"
  | "skip_short_audio_review";

export type AudioMetadata = {
  artist: string;
  title: string;
  album: string;
  durationSeconds: number | null;
  genre: string;
  year: string;
  parseError: string;
};

export type LibraryTrack = AudioMetadata & {
  path: string;
  relativeFolder: string;
  filename: string;
  extension: string;
  fileSizeBytes: number | null;
  proposedBucket: TrackBucket;
  live365Readiness: Live365Readiness;
  duplicateKey: string;
};

export type FolderSummary = {
  folder: string;
  trackCount: number;
  totalBytes: number;
  knownRuntimeSeconds: number;
  unknownRuntimeCount: number;
};

export type ScanOptions = {
  root: string;
  ffprobePath?: string;
  limit?: number;
  skipMetadata?: boolean;
  onProgress?: (event: ScanProgressEvent) => void;
};

export type ScanProgressEvent =
  | { type: "directories"; visitedDirectories: number; audioFiles: number }
  | { type: "files"; audioFiles: number }
  | { type: "metadata"; current: number; total: number };

export type ScanSummary = {
  root: string;
  trackCount: number;
  totalBytes: number;
  knownRuntimeSeconds: number;
  unknownRuntimeCount: number;
  extensionCounts: Record<string, number>;
  bucketCounts: Record<TrackBucket, number>;
  duplicateCandidateGroups: number;
  parseErrorCount: number;
  folderSummaries: FolderSummary[];
};

export type ScanResult = {
  tracks: LibraryTrack[];
  summary: ScanSummary;
};

export type SavedScan = {
  id: string;
  createdAt: string;
  summary: ScanSummary;
  tracks: LibraryTrack[];
};

export type LibraryDatabase = {
  schemaVersion: "0.1.0";
  scans: SavedScan[];
};
