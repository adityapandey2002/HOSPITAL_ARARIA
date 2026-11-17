/**
 * Demo server: in-memory Postgres (PGlite), seeded from recorded fixtures.
 * Lets the UI run end-to-end without a database or provider access.
 *
 *   npm run dev  ->  http://localhost:8788
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { CONFIG } from "../config";
import { runMigrations } from "../db/migrate";
import type { Queryable } from "../db/types";
import { getArariaAvailability } from "../api/araria";
import { FixtureSource } from "../provider/fixture";
import { runSync } from "../sync/run";
import { pruneHistory } from "../sync/retention";

const WEB_DIR = fileURLToPath(new URL("../../web/", import.meta.url));
const PORT = Number(process.env.PORT ?? 8788);
const TOKEN = CONFIG.adminToken;

const db = new PGlite();
await runMigrations(db as never);

const source = new FixtureSource();
const seed = await runSync({
  db: db as unknown as Queryable,
  source,
  trigger: "backfill",
  now: new Date(),
  logger: (message) => console.warn(message),
});
console.log(`Seeded: ${seed.centersSeen} centres, ${seed.centersReporting} reporting.`);

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function requireAdmin(req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> {
  if (!TOKEN) {
    sendJson(res, 503, { error: "admin route disabled: ADMIN_TOKEN is not configured" });
    return false;
  }
  const authorization = req.headers.authorization ?? "";
  if (authorization !== `Bearer ${TOKEN}`) {
    sendJson(res, 401, { error: "unauthorized" });
    return false;
  }
  return true;
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  try {
    if (url.pathname === "/api/blood/araria" && req.method === "GET") {
      const data = await getArariaAvailability(db as unknown as Queryable);
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-data-as-of": data.asOf ?? "",
      });
      res.end(JSON.stringify(data));
      return;
    }

    if (url.pathname === "/api/blood/sync" && req.method === "POST") {
      if (!(await requireAdmin(req, res))) return;
      const result = await runSync({
        db: db as unknown as Queryable,
        source,
        trigger: "manual",
        requestedBy: "demo",
      });
      sendJson(res, 202, result);
      return;
    }

    if (url.pathname === "/api/blood/retention" && req.method === "POST") {
      if (!(await requireAdmin(req, res))) return;
      sendJson(res, 200, {
        removed: await pruneHistory(db as unknown as Queryable, { days: CONFIG.retentionDays }),
      });
      return;
    }

    if (url.pathname === "/health") {
      sendJson(res, 200, { ok: true, asOf: (await getArariaAvailability(db as unknown as Queryable)).asOf });
      return;
    }

    // Static files
    const relative = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
    const filePath = path.join(WEB_DIR, relative);
    if (!filePath.startsWith(WEB_DIR)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-cache",
    });
    res.end(body);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      sendJson(res, 404, { error: "not found" });
      return;
    }
    console.error(error);
    sendJson(res, 500, { error: "internal error" });
  }
});

server.listen(PORT, () => {
  console.log(`Demo: http://localhost:${PORT}`);
});
