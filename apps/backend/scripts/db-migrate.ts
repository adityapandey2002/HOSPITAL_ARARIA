/**
 * Applies the full schema, respecting the DDL ownership split.
 *
 *   Drizzle   → the 11 application tables, from the checked-in SQL in `drizzle/`
 *   MikroORM  → the 5 clinical/audit tables, from the entity metadata
 *
 * Each tool is only ever pointed at its own tables, so neither can silently
 * drop the other's. See docs/adr/0001-dual-orm-table-ownership.md.
 *
 * Against Supabase, set `DATABASE_MIGRATION_URL` to the direct connection
 * (port 5432): DDL through the transaction pooler is not supported.
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
import { resolveMigrationConnection, tlsOptions } from '../src/config/database-url';

async function main() {
  const connection = resolveMigrationConnection(process.env);

  const pool = new Pool({
    host: connection.host,
    port: connection.port,
    user: connection.user,
    password: connection.password,
    database: connection.database,
    ssl: tlsOptions(connection.ssl),
  });

  try {
    console.log('Applying Drizzle migrations (11 owned tables)...');
    await migrate(drizzle(pool), { migrationsFolder: 'drizzle' });

    console.log('Applying MikroORM schema (5 owned tables)...');
    const orm = await MikroORM.init(createMikroOrmConfig());
    try {
      // Dropping the MikroORM tables destroys CERT-In audit history and ABDM
      // records, so it is opt-in and never the default — a routine production
      // `db:migrate` must only create what is missing.
      if (process.env.ALLOW_DESTRUCTIVE_SCHEMA === 'true') {
        console.warn('ALLOW_DESTRUCTIVE_SCHEMA=true — dropping MikroORM tables before recreating.');
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
