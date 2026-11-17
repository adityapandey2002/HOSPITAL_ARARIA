import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Queryable } from "./types";

export interface MigrationDb extends Queryable {
  exec?: (sql: string) => Promise<unknown>;
}

const MIGRATIONS_DIR = fileURLToPath(new URL("../../db/migrations/", import.meta.url));

/**
 * Applies every .sql file in db/migrations in filename order.
 * Statements are written to be idempotent, so re-running is safe.
 */
export async function runMigrations(
  db: MigrationDb,
  directory: string = MIGRATIONS_DIR
): Promise<string[]> {
  const files = (await readdir(directory)).filter((f) => f.endsWith(".sql")).sort();
  const applied: string[] = [];

  for (const file of files) {
    const sql = await readFile(path.join(directory, file), "utf8");
    if (db.exec) {
      await db.exec(sql);
    } else {
      await db.query(sql);
    }
    applied.push(file);
  }

  return applied;
}
