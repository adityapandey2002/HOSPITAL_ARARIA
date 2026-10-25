/**
 * Enforces the DDL ownership boundary between Drizzle and MikroORM.
 *
 * Fails when:
 *   1. a table appears in both schemas (one tool would emit DDL for a table the
 *      other owns), or
 *   2. a checked-in Drizzle migration touches a table Drizzle does not own, or
 *   3. the two halves do not cover the expected 11 + 5 tables.
 *
 * Runs entirely offline — it reads Drizzle's table objects and MikroORM's entity
 * metadata, not the database — so it is safe in CI before a database exists.
 *
 * Contract: docs/adr/0001-dual-orm-table-ownership.md.
 *
 *   npm run schema:check
 */
import 'reflect-metadata';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { MikroORM } from '@mikro-orm/core';
import { is, getTableName } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

import { createMikroOrmConfig } from '../src/common/mikro/mikro.config';
import * as drizzleSchema from '../src/common/drizzle/schema';

const EXPECTED_DRIZZLE_TABLES = 11;
const EXPECTED_MIKRO_TABLES = 5;

function drizzleTableNames(): Set<string> {
  const names = new Set<string>();
  for (const value of Object.values(drizzleSchema)) {
    if (is(value, PgTable)) {
      names.add(getTableName(value));
    }
  }
  return names;
}

/** Table names mentioned in any `CREATE TABLE` / `ALTER TABLE` in the folder. */
function tablesTouchedByMigrations(folder: string): Map<string, string[]> {
  const touched = new Map<string, string[]>();
  for (const file of readdirSync(folder).filter((name) => name.endsWith('.sql'))) {
    const sql = readFileSync(join(folder, file), 'utf8');
    const pattern =
      /(?:CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?|ALTER\s+TABLE)\s+(?:"[^"]+"\.)?"([A-Za-z0-9_]+)"/gi;
    for (const match of sql.matchAll(pattern)) {
      const table = match[1];
      touched.set(table, [...(touched.get(table) ?? []), file]);
    }
  }
  return touched;
}

async function main(): Promise<number> {
  const failures: string[] = [];

  const drizzleTables = drizzleTableNames();

  // `connect: false` makes MikroORM build metadata without opening a socket.
  const orm = await MikroORM.init(createMikroOrmConfig({ connect: false }));
  let mikroTables: Set<string>;
  try {
    mikroTables = new Set(
      Object.values(orm.getMetadata().getAll()).map((meta) => meta.tableName)
    );
  } finally {
    await orm.close(true);
  }

  const overlap = [...drizzleTables].filter((table) => mikroTables.has(table));
  if (overlap.length > 0) {
    failures.push(`Tables claimed by both ORMs: ${overlap.join(', ')}`);
  }

  if (drizzleTables.size !== EXPECTED_DRIZZLE_TABLES) {
    failures.push(
      `Drizzle owns ${drizzleTables.size} tables, expected ${EXPECTED_DRIZZLE_TABLES}: ` +
        [...drizzleTables].sort().join(', ')
    );
  }

  if (mikroTables.size !== EXPECTED_MIKRO_TABLES) {
    failures.push(
      `MikroORM owns ${mikroTables.size} tables, expected ${EXPECTED_MIKRO_TABLES}: ` +
        [...mikroTables].sort().join(', ')
    );
  }

  for (const [table, files] of tablesTouchedByMigrations('drizzle')) {
    if (!drizzleTables.has(table)) {
      failures.push(
        `Drizzle migration ${[...new Set(files)].join(', ')} touches "${table}", ` +
          'which Drizzle does not own.'
      );
    }
  }

  if (failures.length > 0) {
    console.error('Schema ownership check FAILED:\n');
    for (const failure of failures) console.error(`  - ${failure}`);
    return 1;
  }

  console.log(
    `OK — Drizzle owns ${drizzleTables.size} tables, MikroORM owns ${mikroTables.size}, no overlap.`
  );
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error('Schema ownership check failed to run:', error);
    process.exit(3);
  });
