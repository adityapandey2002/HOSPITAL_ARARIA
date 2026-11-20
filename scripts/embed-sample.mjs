/**
 * Regenerates `web/sample-data.json` (optionally) and the `EMBEDDED_SAMPLE`
 * fallback inside `web/app.js` from a single source.
 *
 *   node scripts/embed-sample.mjs                              # json -> app.js
 *   node scripts/embed-sample.mjs http://localhost:8788/api/blood/araria
 *
 * The page needs the embedded copy because browsers block fetch() on file://.
 * Keeping the two copies in sync by hand is the kind of thing that silently
 * rots, so `test/web-sample.test.ts` fails if they ever diverge.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SAMPLE_PATH = path.join(ROOT, "web", "sample-data.json");
const APP_PATH = path.join(ROOT, "web", "app.js");

const source = process.argv[2];

if (source) {
  const response = await fetch(source, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`${source} responded ${response.status}`);
  }
  const data = await response.json();
  await writeFile(SAMPLE_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`sample-data.json <- ${source}`);
}

const data = JSON.parse(await readFile(SAMPLE_PATH, "utf8"));
const app = await readFile(APP_PATH, "utf8");
const lines = app.split("\n");

const marker = "const EMBEDDED_SAMPLE = ";
const index = lines.findIndex((line) => line.trimStart().startsWith(marker));
if (index === -1) {
  throw new Error("Could not find EMBEDDED_SAMPLE in web/app.js");
}

lines[index] = `  const EMBEDDED_SAMPLE = ${JSON.stringify(data)};`;
await writeFile(APP_PATH, lines.join("\n"), "utf8");
console.log(`app.js EMBEDDED_SAMPLE <- sample-data.json (${data.centers.length} centres)`);
