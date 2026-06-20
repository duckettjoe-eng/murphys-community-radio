import http from "node:http";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { scanLibrary } from "../core/scanner.js";
import { defaultStorePath, latestScan } from "../core/store.js";
import { saveScan } from "../core/store.js";
import { renderDashboard } from "../web/dashboard.js";

const execFile = promisify(execFileCallback);
const args = parseArgs(process.argv.slice(2));
const port = args.port ? Number.parseInt(String(args.port), 10) : 4173;
const store = String(args.store ?? defaultStorePath);

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/scan") {
      await handleScanRequest(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/choose-folder") {
      await handleChooseFolderRequest(response);
      return;
    }

    if (request.url !== "/" && request.url !== "/index.html") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const scan = await latestScan(store);
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(renderDashboard(scan));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: message }));
  }
});

async function handleScanRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
) {
  const body = await readJsonBody(request);
  const root = String(body.root ?? "").trim();
  if (!root) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Choose a library folder before scanning." }));
    return;
  }

  const limit = body.limit ? Number.parseInt(String(body.limit), 10) : undefined;
  const result = await scanLibrary({
    root,
    limit: Number.isFinite(limit) ? limit : undefined,
    skipMetadata: Boolean(body.skipMetadata),
    ffprobePath:
      typeof body.ffprobePath === "string" && body.ffprobePath.trim()
        ? body.ffprobePath.trim()
        : undefined,
  });
  const savedScan = await saveScan(result, store);
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ scanId: savedScan.id, summary: savedScan.summary }));
}

async function handleChooseFolderRequest(response: http.ServerResponse) {
  if (process.platform !== "darwin") {
    response.writeHead(501, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Native folder picking is currently implemented for macOS." }));
    return;
  }

  try {
    const { stdout } = await execFile("osascript", [
      "-e",
      'POSIX path of (choose folder with prompt "Choose a music library folder for Crate OS")',
    ]);
    const folderPath = stdout.trim();
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ path: folderPath }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: message || "Folder selection was canceled." }));
  }
}

async function readJsonBody(request: http.IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    chunks.push(buffer);
    size += buffer.length;
    if (size > 1024 * 1024) {
      throw new Error("Request body is too large.");
    }
  }

  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

server.listen(port, "127.0.0.1", () => {
  console.log(`Crate OS dashboard: http://127.0.0.1:${port}`);
  console.log(`Store: ${store}`);
});

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
