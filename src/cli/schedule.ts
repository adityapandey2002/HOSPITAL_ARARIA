import pg from "pg";
import { CONFIG } from "../config.js";
import { EraktkoshSource } from "../provider/eraktkosh.js";
import { runSync } from "../sync/run.js";
import { pruneHistory } from "../sync/retention.js";

const { Client } = pg;

if (!CONFIG.databaseUrl) {
  console.error("DATABASE_URL is required (see .env.example).");
  process.exit(1);
}

const intervalMs = Math.max(1, CONFIG.syncIntervalMinutes) * 60_000;
const retentionMs = 24 * 60 * 60_000;

let lastRetentionDay = new Date().getUTCDate();
let stopping = false;

process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});

async function runOnce(trigger: "schedule" | "backfill"): Promise<void> {
  const client = new Client({ connectionString: CONFIG.databaseUrl });
  await client.connect();
  try {
    const result = await runSync({
      db: client as never,
      source: new EraktkoshSource(),
      trigger,
      logger: (message) => console.warn(message),
    });
    console.log(
      `${new Date().toISOString()} run ${result.runId}: ${result.status} · ` +
        `${result.centersSeen} centres · ${result.centersReporting} reporting`
    );

    const today = new Date().getUTCDate();
    if (today !== lastRetentionDay) {
      const removed = await pruneHistory(client as never, { days: CONFIG.retentionDays });
      if (removed) console.log(`${new Date().toISOString()} retention removed ${removed}`);
      lastRetentionDay = today;
    }
  } finally {
    await client.end();
  }
}

console.log(`Scheduler: every ${CONFIG.syncIntervalMinutes} minutes, retention nightly.`);
await runOnce("backfill");

while (!stopping) {
  await new Promise((resolve) => setTimeout(resolve, intervalMs));
  if (stopping) break;
  try {
    await runOnce("schedule");
  } catch (error) {
    console.error(error);
  }
}

console.log("Scheduler stopped.");
