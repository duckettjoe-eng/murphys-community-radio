import http from "node:http";
import { defaultStorePath, latestScan } from "../core/store.js";
import { renderDashboard } from "../web/dashboard.js";

const args = parseArgs(process.argv.slice(2));
const port = args.port ? Number.parseInt(String(args.port), 10) : 4173;
const store = String(args.store ?? defaultStorePath);

const server = http.createServer(async (request, response) => {
  if (request.url !== "/" && request.url !== "/index.html") {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const scan = await latestScan(store);
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(renderDashboard(scan));
});

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
