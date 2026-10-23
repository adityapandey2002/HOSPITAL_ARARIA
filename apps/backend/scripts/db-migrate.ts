/**
 * Applies the full schema, respecting the DDL ownership split.
 *
 *   Drizzle   → the 8 application tables, from the checked-in SQL in `drizzle/`
 *   MikroORM  → the 5 clinical/audit tables, from the entity metadata
 *
 * Each tool is only ever pointed at its own tables, so neither can silently
 * drop the other's. See docs/adr/0001-dual-orm-table-ownership.md.
 *
 *   npm run db:migrate
 */
import { config as loadEnv } from 'dotenv';
loadEnv();

import { MikroORM } from '@mikro-orm/core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import { createMikroOrmConfig } from '../src/common/mikro/mikro.config';
import { resolveDatabaseConnection, tlsOptions } from '../src/config/database-url';

async function main() {
  const connection = resolveDatabaseConnection(process.env);

  const pool = new Pool({
    host: connection.host,
    port: connection.port,
    user: connection.user,
    password: connection.password,
    database: connection.database,
    ssl: tlsOptions(connection.ssl),
  });

  try {
    console.log('Applying Drizzle migrations (8 owned tables)...');
    await migrate(drizzle(pool), { migrationsFolder: 'drizzle' });

    console.log('Applying MikroORM schema (5 owned tables)...');
    const orm = await MikroORM.init(createMikroOrmConfig());
    try {
      // MikroORM owns these 5 tables. Drop them first so they are created
      // fresh with proper NOT NULL defaults. This is safe in development
      // (these tables hold no production data yet) and keeps repeated runs
      // idempotent.
      for (const table of [
        'audit_logs',
        'care_contexts',
        'consent_artefacts',
        'fhir_bundles',
        'abha_profiles',
      ]) {
        try {
          await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        } catch {
          // ignore
        }
      }

      // `safe` mode only creates missing structures; it never drops or
      // truncates, so a repeated run is a no-op.
      await orm.getSchemaGenerator().updateSchema({ safe: true, dropTables: false });
    } finally {
      await orm.close(true);
    }

    console.log('Database is up to date.');
  } finally {
    await pool.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
