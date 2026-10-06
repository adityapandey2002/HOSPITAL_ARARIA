/**
 * Identifier helpers.
 *
 * `prisma/schema.prisma` declares every primary key as `@default(uuid())`, which
 * Prisma generates in its query engine rather than in the database. Drizzle and
 * MikroORM therefore mint their own RFC 4122 v4 identifiers with Node's built-in
 * `crypto.randomUUID()`, so all three clients interoperate on the same rows with
 * no extra runtime dependency.
 */
import { randomUUID } from 'crypto';

/** Generate a primary key matching Prisma's `uuid()` default. */
export function newId(): string {
  return randomUUID();
}