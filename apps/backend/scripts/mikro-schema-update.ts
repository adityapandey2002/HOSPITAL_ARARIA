/**
 * MikroORM ↔ PostgreSQL schema drift check.
 *
 * Prisma remains the system of record for DDL (`npm run db:migrate`), so this
 * script never writes anything. It introspects the live database and prints the
 * DDL that the entities in `src/modules/abdm/entities` expect — if that output is
 * non-empty, the entities and the database have drifted and a matching Prisma
 * migration is missing.
 *
 * Requires a reachable database, because the comparison is against the real
 * schema rather than the Prisma file.
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
      '\nDo not apply this DDL directly. Add a matching migration to prisma/schema.prisma',
    );
    console.error('and run "npm run db:migrate", then mirror it in the entity files.');
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
          'and set DB_HOST/DB_PORT/DB_NAME, then re-run this check.',
      );
      process.exit(2);
    }

    console.error('Schema check failed:', error);
    process.exit(3);
  });