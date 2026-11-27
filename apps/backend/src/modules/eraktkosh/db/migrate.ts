import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Queryable } from "./types";
import { INLINE_MIGRATIONS } from "./inline-migrations";

export interface MigrationDb extends Queryable {
  exec?: (sql: string) => Promise<unknown>;
}

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function executeSql(db: MigrationDb, sql: string): Promise<void> {
  if (db.exec) {
    await db.exec(sql);
  } else {
    await db.query(sql);
  }
}

export async function runMigrations(
  db: MigrationDb,
  directory?: string
): Promise<string[]> {
  const targetDir = directory ?? MIGRATIONS_DIR;

  let files: string[] | null = null;
  try {
    files = (await readdir(targetDir)).filter((f) => f.endsWith(".sql")).sort();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code;
    // If the caller asked for an explicit directory, propagate the error;
    // for the default dist/ directory on serverless hosts (Vercel), use the
    // compiled inline migrations instead of crashing with ENOENT.
    if (directory || code !== "ENOENT") {
      throw error;
    }
  }

  const applied: string[] = [];

  if (files && files.length > 0) {
    for (const file of files) {
      const sql = await readFile(path.join(targetDir, file), "utf8");
      await executeSql(db, sql);
      applied.push(file);
    }
    return applied;
  }

  for (const migration of INLINE_MIGRATIONS) {
    await executeSql(db, migration.sql);
    applied.push(migration.name);
  }

  return applied;
}
