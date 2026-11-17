import pg from "pg";
import { CONFIG } from "../config";
import { pruneHistory } from "../sync/retention";

const { Client } = pg;

if (!CONFIG.databaseUrl) {
  console.error("DATABASE_URL is required (see .env.example).");
  process.exit(1);
}

const client = new Client({ connectionString: CONFIG.databaseUrl });
await client.connect();

try {
  const removed = await pruneHistory(client as never, { days: CONFIG.retentionDays });
  console.log(`Removed ${removed} snapshot(s) older than ${CONFIG.retentionDays} days.`);
} finally {
  await client.end();
}
