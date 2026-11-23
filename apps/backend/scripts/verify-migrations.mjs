/**
 * Feedback loop for the Vercel boot failure.
 *
 * Runs the migration runner exactly as the deployed function does: against the
 * compiled artifact in dist/, with no src/ directory anywhere in scope.
 *
 * RED  -> ENOENT: .../dist/modules/eraktkosh/db/migrations
 * GREEN -> migrations executed
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { runMigrations } = require('../dist/modules/eraktkosh/db/migrate.js');

(async () => {
  const executed = [];
  const db = { exec: async (sql) => { executed.push(String(sql)); } };
  try {
    const applied = await runMigrations(db);
    if (!executed.length) throw new Error('no SQL executed');
    if (!executed.some((s) => /create table/i.test(s))) throw new Error('schema SQL not executed');
    console.log(`GREEN applied=${JSON.stringify(applied)} statements=${executed.length}`);
  } catch (error) {
    console.log(`RED ${error.code || ''} ${error.message}`);
    process.exitCode = 1;
  }
})();
