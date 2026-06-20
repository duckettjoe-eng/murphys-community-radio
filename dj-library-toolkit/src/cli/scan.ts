import fs from "node:fs/promises";
import path from "node:path";
import { productByline, productName } from "../brand.js";
import { tracksToCsv } from "../core/csv.js";
import { formatScanReport } from "../core/report.js";
import { scanLibrary } from "../core/scanner.js";
import { defaultStorePath, saveScan } from "../core/store.js";

const args = parseArgs(process.argv.slice(2));
const root = String(args.root ?? "");
const out = String(args.out ?? "exports/library-scan.csv");
const reportOut = String(args.report ?? out.replace(/\.csv$/i, ".report.txt"));
const limit = args.limit ? Number.parseInt(String(args.limit), 10) : undefined;
const store = String(args.store ?? defaultStorePath);

if (!root) {
  console.error(`Usage: node dist/cli/scan.js --root /path/to/music [--out exports/library.csv] [--skip-metadata] [--limit 100]`);
  process.exit(1);
}

console.log(`${productName} ${productByline}`);
console.log(`Scanning: ${root}`);
console.log(Boolean(args["skip-metadata"]) ? "Metadata: filename-only" : "Metadata: ffprobe");

const result = await scanLibrary({
  root,
  limit,
  skipMetadata: Boolean(args["skip-metadata"]),
  ffprobePath: typeof args.ffprobe === "string" ? args.ffprobe : undefined,
  onProgress(event) {
    if (event.type === "files") console.log(`Found ${event.audioFiles} audio files...`);
    if (event.type === "metadata" && (event.current % 250 === 0 || event.current === event.total)) {
      console.log(`Metadata ${event.current}/${event.total}...`);
    }
  },
});

await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, tracksToCsv(result.tracks));
await fs.writeFile(reportOut, formatScanReport(result.summary));

console.log(`Wrote CSV: ${out}`);
console.log(`Wrote report: ${reportOut}`);
if (args.save) {
  const savedScan = await saveScan(result, store);
  console.log(`Saved scan: ${savedScan.id}`);
  console.log(`Store: ${store}`);
}
console.log(formatScanReport(result.summary));

function parseArgs(raw: string[]) {
  const parsed: Record<string, string | boolean> = {};
  for (let index = 0; index < raw.length; index += 1) {
    const arg = raw[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = raw[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}
