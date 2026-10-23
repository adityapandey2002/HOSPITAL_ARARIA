/**
 * drizzle-kit configuration — DDL owner for the 9 application tables.
 *
 * Ownership contract: docs/adr/0001-dual-orm-table-ownership.md.
 * This tool must never be pointed at the 5 MikroORM-managed tables
 * (abha_profiles, care_contexts, fhir_bundles, consent_artefacts, audit_logs).
 */
import { defineConfig } from 'drizzle-kit';

import { resolveDatabaseConnection } from './src/config/database-url';

const db = resolveDatabaseConnection(process.env);

const connectionString =
  `postgresql://${encodeURIComponent(db.user)}:${encodeURIComponent(db.password)}` +
  `@${db.host}:${db.port}/${db.database}` +
  (db.ssl ? '?sslmode=require' : '');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/common/drizzle/schema.ts',
  out: './drizzle',
  dbCredentials: { url: connectionString },
  verbose: true,
  strict: true,
});
