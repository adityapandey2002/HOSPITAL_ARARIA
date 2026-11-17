import { PGlite } from "@electric-sql/pglite";
import { runMigrations } from "../src/db/migrate";
import type { Queryable } from "../src/db/types";
import type { BloodSource } from "../src/provider/eraktkosh";
import { FixtureSource } from "../src/provider/fixture";
import type { RawAvailabilityRecord } from "../src/provider/schema";

export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite();
  await runMigrations(db as never);
  return db;
}

export function asDb(db: PGlite): Queryable {
  return db as unknown as Queryable;
}

/** Fixture source with an optional transform, for testing change detection. */
export function makeSource(
  transform?: (records: RawAvailabilityRecord[]) => RawAvailabilityRecord[]
): BloodSource {
  const fixtures = new FixtureSource();
  return {
    listCenters: () => fixtures.listCenters(),
    fetchAvailability: async (codes?: string[]) => {
      const records = await fixtures.fetchAvailability(codes);
      const next = transform ? transform(records) : records;
      if (!codes?.length) return next;
      return next.filter((r) => codes.includes(r.hospitalCode));
    },
  };
}

export async function count(db: PGlite, table: string): Promise<number> {
  const result = await db.query<{ n: number }>(`select count(*)::int as n from ${table}`);
  return Number(result.rows[0]!.n);
}
