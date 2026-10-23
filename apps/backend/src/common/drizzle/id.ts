/**
 * Identifier helpers.
 *
 * No table declares a database-side ID default, so the writing client mints the
 * identifier. Drizzle and MikroORM both use `newId()` so rows are
 * interchangeable between the two ORMs and no extra runtime dependency is
 * needed.
 */
import { randomUUID } from 'crypto';

/** Generate an RFC 4122 v4 primary key. */
export function newId(): string {
  return randomUUID();
}
