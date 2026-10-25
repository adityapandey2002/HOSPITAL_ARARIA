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

import { defaultPoolSize, resolveDatabaseConnection, tlsOptions } from '../../config/database-url';
import { AbhaProfile } from '../../modules/abdm/entities/abha-profile.entity';
import { CareContext } from '../../modules/abdm/entities/care-context.entity';
import { ConsentArtefact } from '../../modules/abdm/entities/consent-artefact.entity';
import { FhirBundle } from '../../modules/abdm/entities/fhir-bundle.entity';
import { AuditLog } from './entities/audit-log.entity';

/**
 * Entity classes are registered **explicitly** rather than by glob.
 *
 * The glob form (`dist/**\/*.entity.js`) fails on Vercel for two independent
 * reasons:
 *
 * 1. It is resolved against `process.cwd()`. In a Vercel function the cwd and
 *    the project root are not guaranteed to agree, so the glob matches nothing
 *    and `MikroORM.init()` throws `MetadataError: No entities were discovered`
 *    — at cold start, before any route exists, so every request returns 500.
 * 2. Vercel decides what to ship inside a function by statically tracing
 *    `require` calls. A glob buried in a config object is invisible to that
 *    tracer, so the entity files can be left out of the bundle entirely.
 *
 * Importing the classes fixes both: the dependency is a real `require`, and
 * discovery no longer depends on the working directory.
 */
const ENTITIES = [AbhaProfile, CareContext, ConsentArtefact, FhirBundle, AuditLog];

export function createMikroOrmConfig(
  overrides: Partial<Options<PostgreSqlDriver>> = {}
): Options<PostgreSqlDriver> {
  const env = process.env;
  const database = resolveDatabaseConnection(env);
  const ssl = tlsOptions(database.ssl);

  return {
    driver: PostgreSqlDriver,
    host: database.host,
    port: database.port,
    user: database.user,
    password: database.password,
    dbName: database.database,
    // MikroORM v6 has no top-level `ssl`; pg/knex TLS settings are forwarded
    // verbatim through `driverOptions`.
    driverOptions: ssl ? { ssl } : {},
    // Registered as classes, not globs — see the note above ENTITIES.
    entities: ENTITIES,
    debug: env.MIKRO_DEBUG === 'true',
    pool: {
      // Serverless instances idle out; an eager minimum would hold connections
      // open on every cold instance and exhaust a Supabase pooler.
      min: parseInt(env.MIKRO_POOL_MIN ?? '0', 10),
      // Same serverless-aware ceiling as Drizzle: 1 on a function instance,
      // 20 on a long-lived server, unless MIKRO_POOL_SIZE overrides it.
      max: parseInt(env.MIKRO_POOL_SIZE ?? String(defaultPoolSize(env)), 10),
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
