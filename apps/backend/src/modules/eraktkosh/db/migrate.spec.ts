import { runMigrations } from './migrate';
import { MIGRATIONS } from './migrations';

/**
 * Regression guard for the production outage where every API route returned
 * 500 FUNCTION_INVOCATION_FAILED because the migration runner tried to
 * `readdir` a `.sql` directory that `nest build` never copied into `dist/`.
 *
 * The schema must come from the compiled bundle, with no filesystem access.
 */
describe('runMigrations', () => {
  it('applies the embedded schema without touching the filesystem', async () => {
    const executed: string[] = [];
    const db = {
      query: async (sql: string) => {
        executed.push(sql);
        return { rows: [] };
      },
    };

    const applied = await runMigrations(db as never);

    expect(applied).toEqual(MIGRATIONS.map((migration) => migration.id));
    expect(executed).toHaveLength(MIGRATIONS.length);
    expect(executed[0]).toMatch(/create table if not exists ek_centers/i);
    expect(executed[0]).toMatch(/create or replace view v_ek_summary/i);
  });

  it('uses exec when the driver exposes one', async () => {
    const executed: string[] = [];
    const db = {
      exec: async (sql: string) => {
        executed.push(sql);
      },
      query: async () => {
        throw new Error('query should not be used when exec exists');
      },
    };

    await runMigrations(db as never);

    expect(executed).toHaveLength(MIGRATIONS.length);
  });
});
