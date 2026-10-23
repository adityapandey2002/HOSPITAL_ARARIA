/**
 * MikroORM ↔ PostgreSQL schema drift check.
 *
 * MikroORM owns the DDL for the five clinical/audit tables (see
 * docs/adr/0001-dual-orm-table-ownership.md). This script never writes: it
 * introspects the live database and prints the DDL the entities in
 * `src/modules/abdm/entities` and `src/common/mikro/entities` expect. Non-empty
 * output means the entities and the database have drifted.
 *
 * Requires a reachable database, because the comparison is against the real
 * schema rather than the entity files alone.
 *
 *   npm run mikro:schema:update
 */
import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/postgresql';
import type { Options } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { createMikroOrmConfig } from '../src/common/mikro/mikro.config';
import { AuditLog } from '../src/common/mikro/entities/audit-log.entity';
import {
  AbhaProfile,
  CareContext,
  ConsentArtefact,
  FhirBundle,
} from '../src/modules/abdm/entities';

async function main(): Promise<number> {
  const orm = await MikroORM.init(
    createMikroOrmConfig({
      entities: [AuditLog, AbhaProfile, CareContext, ConsentArtefact, FhirBundle],
    } as Partial<Options<PostgreSqlDriver>>),
  );

  try {
    const sql = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false, dropTables: false });
    const trimmed = sql.trim();

    if (trimmed.length === 0) {
      console.log('OK — MikroORM entities match the database schema.');
      return 0;
    }

    console.error('DRIFT DETECTED — the database does not match the MikroORM entities:\n');
    console.error(trimmed);
    console.error(
      '\nDo not apply this DDL by hand in production. Capture it as the MikroORM-owned',
    );
    console.error('schema change it represents, then re-run this check.');
    return 1;
  } finally {
    await orm.close(true);
  }
}

main()
  .then((exitCode) => process.exit(exitCode))
  .catch((error: unknown) => {
    if (error instanceof Error && 'code' in error && error.code === 'ECONNREFUSED') {
      console.error(
        'Cannot reach PostgreSQL — start it with "docker-compose up -d postgres" ' +
          'or point DATABASE_URL at a reachable server, then re-run this check.',
      );
      process.exit(2);
    }

    console.error('Schema check failed:', error);
    process.exit(3);
  });