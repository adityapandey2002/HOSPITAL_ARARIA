/**
 * One-off first Hospital Manager (ADMIN) bootstrap.
 *
 * This is the production replacement for `db:seed`: it creates exactly one
 * account, with a password supplied by the operator, and never inserts demo
 * data. It is idempotent — re-running with the same email is a no-op — and it
 * refuses to silently promote an existing non-admin account.
 *
 * Required environment:
 *   ADMIN_EMAIL     valid e-mail address
 *   ADMIN_PASSWORD  at least 12 characters, not one of the published demo passwords
 *   ADMIN_NAME      display name (default: "Hospital Manager")
 *   ADMIN_PHONE     optional
 *
 *   npm run bootstrap:admin --workspace=apps/backend
 */
import { config as loadEnv } from 'dotenv';
loadEnv();

import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { newId } from '../src/common/drizzle/id';
import * as schema from '../src/common/drizzle/schema';
import { resolveDatabaseConnection, tlsOptions } from '../src/config/database-url';

const MIN_PASSWORD_LENGTH = 12;
const BCRYPT_ROUNDS = 12;

/** Passwords that appear in this repository or its documentation. */
const PUBLISHED_PASSWORDS = new Set([
  'Admin@123',
  'Doctor@123',
  'Staff@123',
  'Patient@123',
  'admin123',
  'password',
  'changeme',
]);

function fail(message: string): never {
  console.error(`Bootstrap failed: ${message}`);
  process.exit(1);
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Hospital Manager';
  const phone = process.env.ADMIN_PHONE?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail('ADMIN_EMAIL must be set to a valid e-mail address.');
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    fail(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (PUBLISHED_PASSWORDS.has(password)) {
    fail('ADMIN_PASSWORD is a published demo password. Choose a unique password.');
  }

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
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

    if (existing) {
      if (existing.role === 'ADMIN') {
        console.log(`Admin account already exists: ${email} (${existing.id}). No change made.`);
        return;
      }
      fail(
        `An account with e-mail ${email} already exists with role ${existing.role}. ` +
          'Refusing to promote it automatically; use the Users admin screen instead.'
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [created] = await db
      .insert(schema.users)
      .values({
        id: newId(),
        email,
        password: passwordHash,
        name,
        phone,
        role: 'ADMIN',
        isActive: true,
      })
      .returning({ id: schema.users.id, email: schema.users.email });

    console.log(`Created Hospital Manager account ${created.email} (${created.id}).`);
    console.log('Store the password in the hospital password manager; it is not recoverable.');
  } finally {
    await pool.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
