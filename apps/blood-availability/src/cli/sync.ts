import pg from "pg";
import { CONFIG } from "../config";
import { EraktkoshSource } from "../provider/eraktkosh";
import { runSync } from "../sync/run";

const { Client } = pg;

if (!CONFIG.databaseUrl) {
  console.error("DATABASE_URL is required (see .env.example).");
  process.exit(1);
}

const manual = process.argv.includes("--manual");
const client = new Client({ connectionString: CONFIG.databaseUrl });
await client.connect();

try {
  const result = await runSync({
    db: client as never,
    source: new EraktkoshSource(),
    trigger: manual ? "manual" : "schedule",
    requestedBy: manual ? "cli" : null,
    logger: (message) => console.warn(message),
  });

  console.log(
    [
      `run ${result.runId}: ${result.status}`,
      `${result.centersSeen} centres`,
      `${result.centersReporting} reporting`,
      `${result.snapshotsInserted} new snapshots`,
      `${result.snapshotsUnchanged} unchanged`,
    ].join(" · ")
  );

  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  }
} finally {
  await client.end();
}
