-- Repair the `updatedAt` defaults on databases that predate this migration set.
--
-- Why this exists: the deployed database was first created with
-- `drizzle-kit push`, which created these tables without a DEFAULT on
-- "updatedAt". Migration 0000 used `CREATE TABLE IF NOT EXISTS`, so applying it
-- to that database was a silent no-op and the missing defaults survived.
--
-- Drizzle's `.defaultNow()` is a *column* default: inserts that omit the column
-- are sent as `values (..., default)`, so without the database-side default every
-- insert fails with 23502 (null value in column "updatedAt"). That is what broke
-- `bootstrap:admin`, and it would have broken every appointment, grievance and
-- notice write in production too.
--
-- Setting a default that is already set is a no-op, so this migration is safe to
-- apply on a fresh database (where 0000 created the columns correctly).

ALTER TABLE IF EXISTS "users" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE IF EXISTS "departments" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE IF EXISTS "doctors" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE IF EXISTS "time_slots" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE IF EXISTS "appointments" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE IF EXISTS "grievances" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE IF EXISTS "notices" ALTER COLUMN "updatedAt" SET DEFAULT now();
