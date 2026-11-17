import pg from "pg";
import { runMigrations } from "../db/migrate";
import { CONFIG } from "../config";

const { Client } = pg;

if (!CONFIG.databaseUrl) {
  console.error("DATABASE_URL is required (see .env.example).");
  process.exit(1);
}

const client = new Client({ connectionString: CONFIG.databaseUrl });
await client.connect();

try {
  const applied = await runMigrations(client as never);
  console.log(applied.length ? `Applied: ${applied.join(", ")}` : "No migrations found.");
} finally {
  await client.end();
}
