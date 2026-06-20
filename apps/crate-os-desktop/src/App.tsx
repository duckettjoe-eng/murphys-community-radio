import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import { productByline, productName, productTagline } from "./lib/brand";
import { checkFeature } from "./lib/paywall/featureGate";

type ScanSummary = {
  scan_id: string;
  root: string;
  track_count: number;
  total_bytes: number;
  known_runtime_seconds: number;
  unknown_runtime_count: number;
};

type ScanProgress = {
  phase: "discovering" | "scanning" | "saved";
  current: number;
  total: number;
  path?: string;
};

type TrackRow = {
  path: string;
  relative_folder: string;
  filename: string;
  extension: string;
  file_size_bytes: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  duration_seconds: number | null;
  proposed_bucket: string;
  live365_readiness: string;
};

type EditableTrackField =
  | "title"
  | "artist"
  | "album"
  | "genre"
  | "year"
  | "proposed_bucket"
  | "live365_readiness";

type BulkForm = {
  artist: string;
  album: string;
  genre: string;
  year: string;
  proposed_bucket: string;
  live365_readiness: string;
};

const emptyBulkForm: BulkForm = {
  artist: "",
  album: "",
  genre: "",
  year: "",
  proposed_bucket: "",
  live365_readiness: "",
};

const bucketOptions = ["day_safe", "day_safe_review", "club_late_night", "longform_radio"];
const readinessOptions = [
  "metadata_review_before_upload",
  "ready_for_upload",
  "needs_rights_review",
  "do_not_upload",
];

export default function App() {
  const [folder, setFolder] = useState("");
  const [limit, setLimit] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [bulkForm, setBulkForm] = useState<BulkForm>(emptyBulkForm);
  const [metadataStatus, setMetadataStatus] = useState("");
  const gate = checkFeature("free", "live365.upload.apply");

  const refreshLatest = useCallback(async () => {
    const latest = await invoke<{ summary: ScanSummary | null; tracks: TrackRow[] }>(
      "latest_scan",
    );
    setSummary(latest.summary);
    setTracks(latest.tracks);
    setSelectedPaths(new Set());
  }, []);

  useEffect(() => {
    void refreshLatest();
    const unlisten = listen<ScanProgress>("scan-progress", (event) => {
      setProgress(event.payload);
    });
    return () => {
      void unlisten.then((dispose) => dispose());
    };
  }, [refreshLatest]);

  async function chooseFolder() {
    const selected = await invoke<string | null>("choose_folder");
    if (selected) setFolder(selected);
  }

  async function scan() {
    if (!folder) return;
    setIsScanning(true);
    try {
      const result = await invoke<ScanSummary>("scan_library", {
        root: folder,
        limit: limit ? Number(limit) : null,
      });
      setSummary(result);
      await refreshLatest();
    } finally {
      setIsScanning(false);
    }
  }

  function updateTrackField(path: string, field: EditableTrackField, value: string) {
    setTracks((currentTracks) =>
      currentTracks.map((track) => (track.path === path ? { ...track, [field]: value } : track)),
    );
  }

  async function saveTrack(track: TrackRow) {
    if (!summary) return;
    await invoke("update_track_metadata", {
      update: {
        scan_id: summary.scan_id,
        path: track.path,
        title: track.title,
        artist: track.artist,
        album: track.album,
        genre: track.genre,
        year: track.year,
        proposed_bucket: track.proposed_bucket,
        live365_readiness: track.live365_readiness,
      },
    });
    setMetadataStatus(`Saved ${track.title || track.filename}`);
  }

  function toggleTrack(path: string) {
    setSelectedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function toggleVisibleTracks() {
    setSelectedPaths((current) => {
      const visiblePaths = filteredTracks.map((track) => track.path);
      const allVisibleSelected = visiblePaths.every((path) => current.has(path));
      const next = new Set(current);
      for (const path of visiblePaths) {
        if (allVisibleSelected) {
          next.delete(path);
        } else {
          next.add(path);
        }
      }
      return next;
    });
  }

  async function applyBulkEdit() {
    if (!summary || selectedPaths.size === 0) return;
    const update = Object.fromEntries(
      Object.entries(bulkForm).filter(([, value]) => value.trim().length > 0),
    );
    if (Object.keys(update).length === 0) return;

    const paths = Array.from(selectedPaths);
    await invoke("bulk_update_tracks", {
      update: {
        scan_id: summary.scan_id,
        paths,
        ...update,
      },
    });
    setTracks((currentTracks) =>
      currentTracks.map((track) =>
        selectedPaths.has(track.path) ? { ...track, ...update } : track,
      ),
    );
    setBulkForm(emptyBulkForm);
    setMetadataStatus(`Updated ${paths.length.toLocaleString()} selected tracks`);
  }

  const filteredTracks = (() => {
    const query = search.trim().toLowerCase();
    if (!query) return tracks.slice(0, 500);
    return tracks
      .filter((track) =>
        [track.artist, track.title, track.album, track.filename, track.path]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 500);
  })();

  return (
    <main>
      <header>
        <div className="brand-lockup">
          {/* eslint-disable-next-line @next/next/no-img-element -- Vite/Tauri app, not a Next.js route. */}
          <img src="/crate-os-logo-mark.png" alt="Crate OS" className="brand-logo" />
          <div>
            <p className="topline">Local Library Command Center</p>
            <h1>{productName}</h1>
            <p className="product-byline">{productByline}</p>
            <p className="tagline">{productTagline}</p>
          </div>
        </div>
      </header>

      <section className="panel scan-panel">
        <div className="label">Library Scan</div>
        <div className="scan-form">
          <label>
            <span className="label">Folder</span>
            <input value={folder} onChange={(event) => setFolder(event.target.value)} />
          </label>
          <label>
            <span className="label">Limit</span>
            <input
              inputMode="numeric"
              placeholder="optional"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
          </label>
          <button type="button" onClick={chooseFolder}>
            Choose Folder
          </button>
          <button type="button" disabled={!folder || isScanning} onClick={scan}>
            {isScanning ? "Scanning..." : "Scan Library"}
          </button>
        </div>
        <p className="status">
          {progress
            ? `${progress.phase}: ${progress.current}/${progress.total}${progress.path ? ` - ${progress.path}` : ""}`
            : "Native folder picker, SQLite persistence, and scan progress are wired through Tauri."}
        </p>
      </section>

      {summary ? (
        <section className="stats">
          <Stat label="Tracks" value={summary.track_count.toLocaleString()} />
          <Stat label="Size" value={formatBytes(summary.total_bytes)} />
          <Stat label="Runtime" value={formatRuntime(summary.known_runtime_seconds)} />
          <Stat label="Unknown" value={summary.unknown_runtime_count.toLocaleString()} />
        </section>
      ) : null}

      <section className="panel gate">
        <div>
          <div className="label">Broadcast Toolkit</div>
          <strong>{gate.allowed ? "Unlocked" : "Supporter action locked"}</strong>
          <p>{gate.allowed ? "Broadcast writes are available." : gate.unlockMessage}</p>
        </div>
        <button disabled>Apply Live365 Upload</button>
      </section>

      <section className="panel">
        <div className="toolbar">
          <label>
            <span className="label">Search Tracks</span>
            <input
              placeholder="artist, title, album, path"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        <div className="bulk-editor">
          <div>
            <span className="label">Bulk Edit</span>
            <strong>{selectedPaths.size.toLocaleString()} selected</strong>
          </div>
          <input
            placeholder="artist"
            value={bulkForm.artist}
            onChange={(event) => setBulkForm({ ...bulkForm, artist: event.target.value })}
          />
          <input
            placeholder="album"
            value={bulkForm.album}
            onChange={(event) => setBulkForm({ ...bulkForm, album: event.target.value })}
          />
          <input
            placeholder="genre"
            value={bulkForm.genre}
            onChange={(event) => setBulkForm({ ...bulkForm, genre: event.target.value })}
          />
          <select
            value={bulkForm.proposed_bucket}
            onChange={(event) => setBulkForm({ ...bulkForm, proposed_bucket: event.target.value })}
          >
            <option value="">bucket</option>
            {bucketOptions.map((bucket) => (
              <option key={bucket} value={bucket}>
                {bucket}
              </option>
            ))}
          </select>
          <button type="button" disabled={selectedPaths.size === 0} onClick={applyBulkEdit}>
            Apply
          </button>
        </div>
        {metadataStatus ? <p className="status">{metadataStatus}</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="select-cell">
                  <input
                    type="checkbox"
                    checked={
                      filteredTracks.length > 0 &&
                      filteredTracks.every((track) => selectedPaths.has(track.path))
                    }
                    onChange={toggleVisibleTracks}
                  />
                </th>
                <th>Artist</th>
                <th>Title</th>
                <th>Album</th>
                <th>Genre</th>
                <th>Year</th>
                <th>Runtime</th>
                <th>Bucket</th>
                <th>Readiness</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.map((track) => (
                <tr key={track.path}>
                  <td className="select-cell">
                    <input
                      type="checkbox"
                      checked={selectedPaths.has(track.path)}
                      onChange={() => toggleTrack(track.path)}
                    />
                  </td>
                  <td>
                    <input
                      value={track.artist}
                      placeholder="artist"
                      onChange={(event) => updateTrackField(track.path, "artist", event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={track.title}
                      placeholder={track.filename}
                      onChange={(event) => updateTrackField(track.path, "title", event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={track.album}
                      placeholder="album"
                      onChange={(event) => updateTrackField(track.path, "album", event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={track.genre}
                      placeholder="genre"
                      onChange={(event) => updateTrackField(track.path, "genre", event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={track.year}
                      placeholder="year"
                      onChange={(event) => updateTrackField(track.path, "year", event.target.value)}
                    />
                  </td>
                  <td>{formatRuntime(track.duration_seconds)}</td>
                  <td>
                    <select
                      value={track.proposed_bucket}
                      onChange={(event) =>
                        updateTrackField(track.path, "proposed_bucket", event.target.value)
                      }
                    >
                      {bucketOptions.map((bucket) => (
                        <option key={bucket} value={bucket}>
                          {bucket}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={track.live365_readiness}
                      onChange={(event) =>
                        updateTrackField(track.path, "live365_readiness", event.target.value)
                      }
                    >
                      {readinessOptions.map((readiness) => (
                        <option key={readiness} value={readiness}>
                          {readiness}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button type="button" className="small-button" onClick={() => saveTrack(track)}>
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat panel">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  for (const unit of units) {
    if (value < 1024) return `${value.toFixed(1)} ${unit}`;
    value /= 1024;
  }
  return `${value.toFixed(1)} PB`;
}

function formatRuntime(seconds: number | null) {
  if (seconds === null) return "Unknown";
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
