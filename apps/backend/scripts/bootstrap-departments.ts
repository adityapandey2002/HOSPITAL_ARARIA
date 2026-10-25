/**
 * Insert the reference department list into a fresh production database.
 *
 * `db:seed` cannot do this: it creates demo users, doctors and notices, and it
 * refuses to run under `NODE_ENV=production`. But a database with zero
 * departments is also unusable — the public directory, the doctor form and the
 * public feedback form all require one, so `/feedback` has nothing to select and
 * every submission is rejected.
 *
 * This script inserts only `departments`, is keyed on `name` (the natural key),
 * and never updates or deletes a row. Re-running it is a no-op; an existing
 * department keeps whatever the hospital has since edited into it.
 *
 *   npm run bootstrap:departments
 */
import { config as loadEnv } from 'dotenv';
loadEnv();

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { newId } from '../src/common/drizzle/id';
import * as schema from '../src/common/drizzle/schema';
import { resolveDatabaseConnection, tlsOptions } from '../src/config/database-url';
import { DEPARTMENTS } from './data/departments';

function fail(message: string): never {
  console.error(`Bootstrap failed: ${message}`);
  process.exit(1);
}

async function main() {
  const connection = resolveDatabaseConnection(process.env);
  const pool = new Pool({
    host: connection.host,
    port: connection.port,
    user: connection.user,
    password: connection.password,
    database: connection.database,
    ssl: tlsOptions(connection.ssl),
    max: 1,
  });

  try {
    const db = drizzle(pool, { schema });

    // A missing table means migrations have not run. Say so instead of letting
    // the driver report `relation "departments" does not exist`.
    try {
      await db.select({ id: schema.departments.id }).from(schema.departments).limit(1);
    } catch {
      fail('the departments table does not exist. Run `npm run db:migrate` first.');
    }

    const existingRows = await db
      .select({ name: schema.departments.name })
      .from(schema.departments);
    const existing = new Set(existingRows.map((row) => row.name));

    const created: string[] = [];
    for (const department of DEPARTMENTS) {
      if (existing.has(department.name)) continue;

      await db.insert(schema.departments).values({
        id: newId(),
        name: department.name,
        description: department.description,
        icon: department.icon,
        isActive: true,
      });
      created.push(department.name);
    }

    const skipped = DEPARTMENTS.filter((department) => existing.has(department.name));

    console.log(`Departments in the reference list: ${DEPARTMENTS.length}`);
    console.log(`Created: ${created.length}${created.length ? ` -> ${created.join(', ')}` : ''}`);
    console.log(
      `Already present, left untouched: ${skipped.length}${
        skipped.length ? ` -> ${skipped.map((d) => d.name).join(', ')}` : ''
      }`
    );

    const others = [...existing].filter(
      (name) => !DEPARTMENTS.some((department) => department.name === name)
    );
    if (others.length) {
      console.log(`Also in the database, not in the reference list: ${others.join(', ')}`);
    }

    // Fail loudly on a silent no-op: an empty table after this run means the
    // operator would otherwise deploy a portal with nothing to select.
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.departments);

    if (total === 0) {
      fail('no departments exist after the run; check the database connection.');
    }
    console.log(`Departments in the database now: ${total}`);
  } finally {
    await pool.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
