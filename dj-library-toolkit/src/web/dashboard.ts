import { productByline, productName, productTagline } from "../brand.js";
import { checkFeature } from "../paywall/featureGate.js";
import type { SavedScan, TrackBucket } from "../core/types.js";

export function renderDashboard(scan: SavedScan | null) {
  const live365Gate = checkFeature("free", "live365.upload.apply");
  const tracks = scan?.tracks ?? [];
  const bucketOptions = uniqueBuckets(tracks.map((track) => track.proposedBucket));
  const tracksJson = JSON.stringify(tracks).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${productName} ${productByline}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #050806;
      --panel: #090b09;
      --panel-strong: #11140f;
      --line: rgba(214, 168, 71, 0.22);
      --line-soft: rgba(248, 239, 216, 0.1);
      --text: #fff8e8;
      --cream: #f8efd8;
      --muted: rgba(248, 239, 216, 0.58);
      --gold: #d6a847;
      --gold-hot: #f3c866;
      --orange: #fb923c;
      --green: #86efac;
      --red: #fb7185;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top left, rgba(214, 168, 71, 0.18), transparent 34rem),
        radial-gradient(circle at 88% 10%, rgba(251, 146, 60, 0.11), transparent 28rem),
        linear-gradient(135deg, #050806 0%, #07120c 48%, #0f1410 100%);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header {
      border-bottom: 1px solid var(--line);
      padding: 26px 24px 22px;
      position: relative;
    }
    header::after {
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
      bottom: 0;
      content: "";
      height: 1px;
      left: 0;
      opacity: 0.7;
      position: absolute;
      right: 0;
    }
    .topline {
      color: var(--gold);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.34em;
      margin: 0 0 12px;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      font-size: 44px;
      font-weight: 950;
      line-height: 0.95;
      letter-spacing: 0;
    }
    h1 span { color: var(--gold-hot); }
    .tagline {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 15px;
      line-height: 1.6;
    }
    main {
      margin: 0 auto;
      max-width: 1500px;
      padding: 24px 24px 34px;
    }
    .stats {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-bottom: 16px;
    }
    .stat, .gate, .controls, .scan-panel, .folders {
      border: 1px solid var(--line);
      background: rgba(9, 11, 9, 0.84);
      border-radius: 8px;
      box-shadow: 0 18px 55px rgba(0, 0, 0, 0.22);
      padding: 16px;
    }
    .label {
      color: var(--gold);
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.2em;
    }
    .value {
      margin-top: 6px;
      color: var(--cream);
      font-size: 26px;
      font-weight: 950;
    }
    .toolbar {
      align-items: end;
      display: grid;
      gap: 12px;
      grid-template-columns: minmax(0, 1fr) 220px 220px;
      margin-bottom: 14px;
    }
    .metadata-tools {
      border: 1px solid var(--line-soft);
      border-radius: 8px;
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(5, minmax(0, 1fr)) 160px 170px;
      margin-bottom: 14px;
      padding: 12px;
    }
    .scan-panel {
      margin-bottom: 16px;
    }
    .scan-form {
      align-items: end;
      display: grid;
      gap: 12px;
      grid-template-columns: minmax(0, 1fr) 150px 190px 150px 180px;
      margin-top: 14px;
    }
    .checkbox {
      align-items: center;
      border: 1px solid var(--line-soft);
      border-radius: 6px;
      display: flex;
      gap: 10px;
      min-height: 45px;
      padding: 11px 12px;
    }
    .checkbox input {
      width: auto;
    }
    .row-check {
      width: auto;
    }
    .status {
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
      margin-top: 10px;
      min-height: 20px;
    }
    .status.error { color: var(--red); }
    .status.success { color: var(--green); }
    input, select, button {
      width: 100%;
      border: 1px solid var(--line-soft);
      background: #050806;
      color: var(--text);
      border-radius: 6px;
      padding: 11px 12px;
      font: inherit;
    }
    input:focus, select:focus {
      border-color: rgba(214, 168, 71, 0.72);
      outline: 2px solid rgba(214, 168, 71, 0.22);
    }
    button {
      background: var(--gold);
      border-color: transparent;
      color: #080a07;
      cursor: pointer;
      font-weight: 950;
    }
    button[disabled] {
      background: rgba(248, 239, 216, 0.1);
      border-color: var(--line-soft);
      color: var(--muted);
      cursor: not-allowed;
    }
    .gate {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 180px;
      gap: 14px;
      align-items: center;
      margin-bottom: 16px;
    }
    .gate strong {
      color: var(--cream);
      display: block;
      font-size: 18px;
      margin-top: 6px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      table-layout: fixed;
    }
    th, td {
      border-bottom: 1px solid var(--line-soft);
      padding: 10px 8px;
      text-align: left;
      vertical-align: top;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    th {
      color: var(--muted);
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }
    tbody tr:hover { background: rgba(214, 168, 71, 0.06); }
    .bucket {
      color: var(--orange);
      font-weight: 850;
    }
    .warn { color: var(--red); }
    .folders {
      margin-bottom: 16px;
    }
    .section-head {
      align-items: end;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
    }
    .section-note {
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
    }
    .empty {
      border: 1px dashed rgba(214, 168, 71, 0.38);
      border-radius: 8px;
      color: var(--muted);
      padding: 32px;
      text-align: center;
      background: rgba(9, 11, 9, 0.72);
    }
    @media (max-width: 760px) {
      .stats, .toolbar, .gate, .scan-form, .metadata-tools { grid-template-columns: 1fr; }
      main, header { padding-left: 16px; padding-right: 16px; }
      .section-head { align-items: start; flex-direction: column; }
      th.optional, td.optional { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <p class="topline">Local Library Command Center</p>
    <h1>${productName} <span>${productByline}</span></h1>
    <p class="tagline">${productTagline}</p>
  </header>
  <main>
    <section class="scan-panel">
      <div class="label">Library Scan</div>
      <form class="scan-form" id="scan-form">
        <label>
          <div class="label">Folder Path</div>
          <input id="scan-root" name="root" placeholder="/Volumes/Music/DJ Library" autocomplete="off">
        </label>
        <label>
          <div class="label">Limit</div>
          <input id="scan-limit" name="limit" placeholder="optional" inputmode="numeric">
        </label>
        <label class="checkbox">
          <input id="skip-metadata" name="skipMetadata" type="checkbox">
          <span>Fast scan, skip metadata</span>
        </label>
        <button id="choose-folder-button" type="button">Choose Folder</button>
        <button id="scan-button" type="submit">Scan Library</button>
      </form>
      <div class="status" id="scan-status">Metadata is read by default so runtime and tags are available. Use fast scan only for rough inventory passes.</div>
    </section>
    ${scan ? renderStats(scan) : `<div class="empty">No saved scan yet. Run <code>node dist/cli/scan.js --root /path/to/music --save --skip-metadata</code>.</div>`}
    ${scan ? `
      <section class="gate">
        <div>
          <div class="label">Broadcast Toolkit</div>
          <strong>${live365Gate.allowed ? "Live365 apply actions are unlocked." : "Supporter action locked"}</strong>
          <div>${live365Gate.allowed ? "This station profile can write to broadcast platforms." : live365Gate.unlockMessage}</div>
        </div>
        <button disabled>Apply Live365 Upload</button>
      </section>
      ${renderFolderSummaries(scan)}
      <section class="controls">
        <div class="metadata-tools">
          <label>
            <div class="label">Bulk Artist</div>
            <input id="bulk-artist" placeholder="leave blank">
          </label>
          <label>
            <div class="label">Bulk Album</div>
            <input id="bulk-album" placeholder="leave blank">
          </label>
          <label>
            <div class="label">Bulk Genre</div>
            <input id="bulk-genre" placeholder="leave blank">
          </label>
          <label>
            <div class="label">Bulk Year</div>
            <input id="bulk-year" placeholder="leave blank">
          </label>
          <label>
            <div class="label">Bulk Runtime</div>
            <input id="bulk-duration" placeholder="seconds">
          </label>
          <button id="bulk-apply" type="button">Apply Selected</button>
          <button id="save-metadata" type="button">Save Metadata</button>
        </div>
        <div class="toolbar">
          <label>
            <div class="label">Search</div>
            <input id="search" placeholder="artist, title, album, path">
          </label>
          <label>
            <div class="label">Bucket</div>
            <select id="bucket">
              <option value="">All buckets</option>
              ${bucketOptions.map((bucket) => `<option value="${bucket}">${bucket}</option>`).join("")}
            </select>
          </label>
          <label>
            <div class="label">Readiness</div>
            <select id="readiness">
              <option value="">All readiness</option>
              <option value="eligible_reviewed_by_bucket">eligible_reviewed_by_bucket</option>
              <option value="metadata_review_before_upload">metadata_review_before_upload</option>
              <option value="skip_live365_over_4_hours">skip_live365_over_4_hours</option>
              <option value="skip_mixtape_dj_edit_review">skip_mixtape_dj_edit_review</option>
              <option value="skip_short_audio_review">skip_short_audio_review</option>
            </select>
          </label>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 42px"></th>
              <th style="width: 16%">Artist</th>
              <th style="width: 18%">Title</th>
              <th class="optional" style="width: 15%">Album</th>
              <th style="width: 12%">Genre</th>
              <th style="width: 80px">Year</th>
              <th style="width: 100px">Runtime</th>
              <th class="optional" style="width: 15%">Bucket</th>
              <th>Path</th>
            </tr>
          </thead>
          <tbody id="tracks"></tbody>
        </table>
      </section>
    ` : ""}
  </main>
  <script>
    const tracks = ${tracksJson};
    const els = {
      search: document.getElementById("search"),
      bucket: document.getElementById("bucket"),
      readiness: document.getElementById("readiness"),
      tracks: document.getElementById("tracks"),
      bulkArtist: document.getElementById("bulk-artist"),
      bulkAlbum: document.getElementById("bulk-album"),
      bulkGenre: document.getElementById("bulk-genre"),
      bulkYear: document.getElementById("bulk-year"),
      bulkDuration: document.getElementById("bulk-duration"),
      bulkApply: document.getElementById("bulk-apply"),
      saveMetadata: document.getElementById("save-metadata"),
      scanForm: document.getElementById("scan-form"),
      scanRoot: document.getElementById("scan-root"),
      scanLimit: document.getElementById("scan-limit"),
      skipMetadata: document.getElementById("skip-metadata"),
      chooseFolderButton: document.getElementById("choose-folder-button"),
      scanButton: document.getElementById("scan-button"),
      scanStatus: document.getElementById("scan-status"),
    };
    function renderRows() {
      if (!els.tracks) return;
      const q = (els.search?.value || "").toLowerCase();
      const bucket = els.bucket?.value || "";
      const readiness = els.readiness?.value || "";
      const filtered = tracks.filter((track) => {
        const haystack = [track.artist, track.title, track.album, track.path].join(" ").toLowerCase();
        return (!q || haystack.includes(q)) &&
          (!bucket || track.proposedBucket === bucket) &&
          (!readiness || track.live365Readiness === readiness);
      }).slice(0, 500);
      els.tracks.innerHTML = filtered.map((track) => \`
        <tr data-path="\${escapeHtml(track.path)}">
          <td><input class="row-check" type="checkbox" data-field="selected"></td>
          <td><input data-field="artist" value="\${escapeAttr(track.artist || "")}"></td>
          <td><input data-field="title" value="\${escapeAttr(track.title || track.filename)}"></td>
          <td class="optional"><input data-field="album" value="\${escapeAttr(track.album || "")}"></td>
          <td><input data-field="genre" value="\${escapeAttr(track.genre || "")}"></td>
          <td><input data-field="year" value="\${escapeAttr(track.year || "")}"></td>
          <td><input data-field="durationSeconds" value="\${track.durationSeconds ?? ""}" placeholder="seconds"></td>
          <td class="optional bucket">\${escapeHtml(track.proposedBucket)}</td>
          <td title="\${escapeHtml(track.path)}">\${escapeHtml(track.path)}</td>
        </tr>
      \`).join("");
    }
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char]));
    }
    function escapeAttr(value) {
      return escapeHtml(value).replace(new RegExp(String.fromCharCode(96), "g"), "&#96;");
    }
    function formatRuntime(seconds) {
      if (seconds === null || seconds === undefined || Number.isNaN(Number(seconds))) return "Unknown";
      const rounded = Math.round(Number(seconds));
      const hours = Math.floor(rounded / 3600);
      const minutes = Math.floor((rounded % 3600) / 60);
      const secs = rounded % 60;
      if (hours > 0) return \`\${hours}h \${minutes}m\`;
      if (minutes > 0) return \`\${minutes}m \${secs}s\`;
      return \`\${secs}s\`;
    }
    els.search?.addEventListener("input", renderRows);
    els.bucket?.addEventListener("change", renderRows);
    els.readiness?.addEventListener("change", renderRows);
    els.bulkApply?.addEventListener("click", () => {
      const selectedRows = getRows().filter((row) => row.querySelector('[data-field="selected"]')?.checked);
      const rows = selectedRows.length ? selectedRows : getRows();
      const bulk = {
        artist: els.bulkArtist?.value || "",
        album: els.bulkAlbum?.value || "",
        genre: els.bulkGenre?.value || "",
        year: els.bulkYear?.value || "",
        durationSeconds: els.bulkDuration?.value || "",
      };
      for (const row of rows) {
        for (const [field, value] of Object.entries(bulk)) {
          if (!value) continue;
          const input = row.querySelector(\`[data-field="\${field}"]\`);
          if (input) input.value = value;
        }
      }
      setScanStatus(\`Applied bulk metadata to \${rows.length} visible row(s). Click Save Metadata to keep it.\`, "success");
    });
    els.saveMetadata?.addEventListener("click", async () => {
      const updates = getRows().map((row) => ({
        path: row.dataset.path,
        artist: row.querySelector('[data-field="artist"]')?.value || "",
        title: row.querySelector('[data-field="title"]')?.value || "",
        album: row.querySelector('[data-field="album"]')?.value || "",
        genre: row.querySelector('[data-field="genre"]')?.value || "",
        year: row.querySelector('[data-field="year"]')?.value || "",
        durationSeconds: row.querySelector('[data-field="durationSeconds"]')?.value || null,
      })).filter((update) => update.path);
      setScanStatus("Saving metadata edits.", "");
      try {
        const response = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Save failed.");
        setScanStatus(\`Saved metadata for \${data.changed} track(s). Refreshing...\`, "success");
        window.location.reload();
      } catch (error) {
        setScanStatus(error instanceof Error ? error.message : String(error), "error");
      }
    });
    function getRows() {
      return [...document.querySelectorAll("tbody#tracks tr")];
    }
    els.chooseFolderButton?.addEventListener("click", async () => {
      els.chooseFolderButton.disabled = true;
      els.chooseFolderButton.textContent = "Choosing...";
      setScanStatus("Opening the system folder picker.", "");
      try {
        const response = await fetch("/api/choose-folder", { method: "POST" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to choose a folder.");
        els.scanRoot.value = data.path;
        setScanStatus("Folder selected. Ready to scan.", "success");
      } catch (error) {
        setScanStatus(error instanceof Error ? error.message : String(error), "error");
      } finally {
        els.chooseFolderButton.disabled = false;
        els.chooseFolderButton.textContent = "Choose Folder";
      }
    });
    els.scanForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const root = els.scanRoot?.value?.trim();
      if (!root) {
        setScanStatus("Choose a folder path first.", "error");
        return;
      }

      els.scanButton.disabled = true;
      els.scanButton.textContent = "Scanning...";
      setScanStatus("Scanning local files. Large libraries can take a while.", "");

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            root,
            limit: els.scanLimit?.value || undefined,
            skipMetadata: Boolean(els.skipMetadata?.checked),
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Scan failed.");
        setScanStatus(\`Saved \${data.summary.trackCount} tracks. Refreshing...\`, "success");
        window.location.reload();
      } catch (error) {
        setScanStatus(error instanceof Error ? error.message : String(error), "error");
      } finally {
        els.scanButton.disabled = false;
        els.scanButton.textContent = "Scan Library";
      }
    });
    function setScanStatus(message, tone) {
      if (!els.scanStatus) return;
      els.scanStatus.textContent = message;
      els.scanStatus.className = \`status \${tone || ""}\`;
    }
    renderRows();
  </script>
</body>
</html>`;
}

function renderStats(scan: SavedScan) {
  return `<section class="stats">
    <div class="stat">
      <div class="label">Tracks</div>
      <div class="value">${scan.summary.trackCount}</div>
    </div>
    <div class="stat">
      <div class="label">Size</div>
      <div class="value">${formatBytes(scan.summary.totalBytes)}</div>
    </div>
    <div class="stat">
      <div class="label">Known Runtime</div>
      <div class="value">${formatRuntime(scan.summary.knownRuntimeSeconds ?? 0)}</div>
    </div>
    <div class="stat">
      <div class="label">Unknown Runtime</div>
      <div class="value">${scan.summary.unknownRuntimeCount ?? scan.tracks.filter((track) => track.durationSeconds === null).length}</div>
    </div>
    <div class="stat">
      <div class="label">Duplicate Groups</div>
      <div class="value">${scan.summary.duplicateCandidateGroups}</div>
    </div>
    <div class="stat">
      <div class="label">Last Scan</div>
      <div class="value">${new Date(scan.createdAt).toLocaleDateString()}</div>
    </div>
  </section>`;
}

function renderFolderSummaries(scan: SavedScan) {
  const folderSummaries = scan.summary.folderSummaries ?? [];
  const rows = folderSummaries
    .slice(0, 100)
    .map(
      (folder) => `<tr>
        <td title="${escapeHtml(folder.folder)}">${escapeHtml(folder.folder)}</td>
        <td>${folder.trackCount}</td>
        <td>${formatRuntime(folder.knownRuntimeSeconds)}</td>
        <td>${folder.unknownRuntimeCount}</td>
        <td class="optional">${formatBytes(folder.totalBytes)}</td>
      </tr>`,
    )
    .join("");

  return `<section class="folders">
    <div class="section-head">
      <div>
        <div class="label">Folder Runtime</div>
        <div class="section-note">Top ${Math.min(folderSummaries.length, 100)} folders by path, with known-duration totals.</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Folder</th>
          <th style="width: 110px">Tracks</th>
          <th style="width: 150px">Runtime</th>
          <th style="width: 130px">Unknown</th>
          <th class="optional" style="width: 130px">Size</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] ?? char);
}

function uniqueBuckets(buckets: TrackBucket[]) {
  return [...new Set(buckets)].sort();
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

function formatRuntime(seconds: number) {
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
