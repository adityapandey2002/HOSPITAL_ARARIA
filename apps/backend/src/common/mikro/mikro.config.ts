/**
 * MikroORM configuration for the clinical / ABDM services (ABDM M2 + M3).
 *
 * MikroORM is used (rather than Drizzle) here because ABDM health-data writes
 * need a strict Unit of Work so that a bundle + its consent artefact + its
 * audit rows commit atomically, plus lifecycle hooks for the immutable
 * CERT-In audit trail.
 *
 * Read from `process.env` rather than `ConfigService` because MikroORM needs the
 * configuration object *at* `MikroORM.init()`, which runs inside a provider
 * factory. `ConfigModule` has already parsed `.env` into `process.env` by then,
 * and Joi has validated the values.
 */
import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

export function createMikroOrmConfig(
  overrides: Partial<Options<PostgreSqlDriver>> = {}
): Options<PostgreSqlDriver> {
  const env = process.env;

  const host = env.DB_HOST ?? 'localhost';
  // Managed Postgres (Supabase/Neon/Railway) requires TLS, a local devserver
  // usually does not. Default to TLS for any non-local host, same rule as
  // configuration.ts -> database.ssl, and allow an explicit DB_SSL override.
  const useSsl = env.DB_SSL ? env.DB_SSL === 'true' : host !== 'localhost';

  return {
    driver: PostgreSqlDriver,
    host,
    port: parseInt(env.DB_PORT ?? '5432', 10),
    user: env.DB_USERNAME ?? 'postgres',
    password: env.DB_PASSWORD ?? 'postgres',
    dbName: env.DB_NAME ?? 'dh_araria',
    // MikroORM v6 has no top-level `ssl`; pg/knex TLS settings are forwarded
    // verbatim through `driverOptions`.
    driverOptions: useSsl ? { ssl: { rejectUnauthorized: false } } : {},
    // `entities` is used from `dist` (production), `entitiesTs` from `src` (dev/test).
    entities: ['dist/modules/abdm/entities/*.entity.js', 'dist/common/mikro/entities/*.entity.js'],
    entitiesTs: ['src/modules/abdm/entities/*.entity.ts', 'src/common/mikro/entities/*.entity.ts'],
    debug: env.MIKRO_DEBUG === 'true',
    pool: {
      min: 2,
      max: parseInt(env.MIKRO_POOL_SIZE ?? '20', 10),
    },
    // Timestamps are stored UTC — CERT-In requires trustworthy audit clocks.
    forceUtcTimezone: true,
    strict: false,
    validate: true,
    // EntityManagers must come from an explicit fork or a Unit of Work; never
    // from the global context.
    allowGlobalContext: false,
    ...overrides,
  };
}
