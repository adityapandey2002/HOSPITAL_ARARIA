import type { Queryable } from "./types";
import { MIGRATIONS, type Migration } from "./migrations";

export interface MigrationDb extends Queryable {
  exec?: (sql: string) => Promise<unknown>;
}

/**
 * Apply the e-RaktKosh schema.
 *
 * The DDL lives in the compiled bundle (see ./migrations.ts), so this performs
 * no filesystem access. That matters in two places:
 *  - the Vercel serverless function, whose bundle only contains traced files;
 *  - tests, which should not depend on the working directory.
 *
 * Every statement is idempotent, so this is safe to call on each cold start.
 */
export async function runMigrations(
  db: MigrationDb,
  migrations: readonly Migration[] = MIGRATIONS
): Promise<string[]> {
  const applied: string[] = [];

  for (const migration of migrations) {
    if (db.exec) {
      await db.exec(migration.sql);
    } else {
      await db.query(migration.sql);
    }
    applied.push(migration.id);
  }

  return applied;
}
