import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Queryable } from "./types";

export interface MigrationDb extends Queryable {
  exec?: (sql: string) => Promise<unknown>;
}

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

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
