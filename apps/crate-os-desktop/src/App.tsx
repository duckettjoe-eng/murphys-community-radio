import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function App() {
  const [folder, setFolder] = useState("");
  const [limit, setLimit] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [search, setSearch] = useState("");
  const gate = checkFeature("free", "live365.upload.apply");

  const refreshLatest = useCallback(async () => {
    const latest = await invoke<{ summary: ScanSummary | null; tracks: TrackRow[] }>(
      "latest_scan",
    );
    setSummary(latest.summary);
    setTracks(latest.tracks);
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

  const filteredTracks = useMemo(() => {
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
  }, [search, tracks]);

  return (
    <main>
      <header>
        <p className="topline">Local Library Command Center</p>
        <h1>
          {productName} <span>{productByline}</span>
        </h1>
        <p className="tagline">{productTagline}</p>
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
        <table>
          <thead>
            <tr>
              <th>Artist</th>
              <th>Title</th>
              <th>Folder</th>
              <th>Runtime</th>
              <th>Bucket</th>
            </tr>
          </thead>
          <tbody>
            {filteredTracks.map((track) => (
              <tr key={track.path}>
                <td>{track.artist}</td>
                <td>{track.title || track.filename}</td>
                <td>{track.relative_folder}</td>
                <td>{formatRuntime(track.duration_seconds)}</td>
                <td className="bucket">{track.proposed_bucket}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
