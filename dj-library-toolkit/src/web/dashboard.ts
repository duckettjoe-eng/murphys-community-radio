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
    .stat, .gate, .controls {
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
    .empty {
      border: 1px dashed rgba(214, 168, 71, 0.38);
      border-radius: 8px;
      color: var(--muted);
      padding: 32px;
      text-align: center;
      background: rgba(9, 11, 9, 0.72);
    }
    @media (max-width: 760px) {
      .stats, .toolbar, .gate { grid-template-columns: 1fr; }
      main, header { padding-left: 16px; padding-right: 16px; }
      th:nth-child(4), td:nth-child(4), th:nth-child(5), td:nth-child(5) { display: none; }
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
      <section class="controls">
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
              <th style="width: 20%">Artist</th>
              <th style="width: 24%">Title</th>
              <th style="width: 18%">Bucket</th>
              <th style="width: 18%">Readiness</th>
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
        <tr>
          <td>\${escapeHtml(track.artist || "")}</td>
          <td>\${escapeHtml(track.title || track.filename)}</td>
          <td class="bucket">\${escapeHtml(track.proposedBucket)}</td>
          <td class="\${track.live365Readiness.startsWith("skip") ? "warn" : ""}">\${escapeHtml(track.live365Readiness)}</td>
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
    els.search?.addEventListener("input", renderRows);
    els.bucket?.addEventListener("change", renderRows);
    els.readiness?.addEventListener("change", renderRows);
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
      <div class="label">Duplicate Groups</div>
      <div class="value">${scan.summary.duplicateCandidateGroups}</div>
    </div>
    <div class="stat">
      <div class="label">Last Scan</div>
      <div class="value">${new Date(scan.createdAt).toLocaleDateString()}</div>
    </div>
  </section>`;
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
