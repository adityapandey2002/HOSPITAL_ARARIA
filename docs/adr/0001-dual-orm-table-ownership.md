# 1. Dual-ORM with strict table ownership

Date: 2026-10-16

Status: accepted

## Context

The backend grew three ORM clients against one PostgreSQL database. Prisma served auth, users,
doctors, appointments and health. Drizzle served departments, notices, blood-bank and grievances.
MikroORM served abdm and audit-log. `docs/ARCHITECTURE.md:45` describes this as "Dual-ORM", which
was wrong twice over: there were three clients, and no rule a reader could infer to predict which
one owned a given module.

Two concrete costs had accumulated:

- `BaseDrizzleRepository` and `BaseMikroRepository` were written with shared query helpers and
  correct pagination clamping. Neither had a single subclass. All eight list services
  re-implemented pagination by hand, with default limits of 10 in five services and 50 in two.
- `grievances` straddled two ORMs: Drizzle in the service, Prisma enum types in the controller.

Prisma had also become the sole owner of DDL and of the `DATABASE_URL` connection scheme, while
Drizzle and MikroORM read a `DB_*` scheme. Two schemes, one database, nothing cross-checking them.
And because `.gitignore:57` excluded `prisma/migrations/`, the migration history that the
"Prisma owns DDL" strategy depended on was never committed.

## Decision

The backend will run on exactly two ORMs, with each table having exactly one owner.

**Drizzle owns query and DDL for the 9 application tables:** `users`, `departments`, `doctors`,
`time_slots`, `appointments`, `blood_stock`, `grievances`, `notices`.

**MikroORM owns query and DDL for the 5 ABDM and audit tables:** `abha_profiles`, `care_contexts`,
`fhir_bundles`, `consent_artefacts`, `audit_logs`.

Prisma is removed entirely.

`DATABASE_URL` becomes the single connection scheme for both remaining frameworks. The `DB_*`
variables survive only as optional explicit overrides for the local Docker PostgreSQL container.

## Why the split falls where it does

ABDM entities and audit records are write-heavy, relationally rich, and operated inside explicit
transactions — the audit design already depends on MikroORM's Unit of Work. That needs an identity
map, which is the reason to keep MikroORM at all.

Application tables are read-heavy with hand-tuned joins and projections. Drizzle's explicit,
predictable SQL and small runtime bundle are the better fit, and the Drizzle schema already
defines `users`, `doctors`, `timeSlots` and `appointments` (`src/common/drizzle/schema.ts:109-251`)
from the earlier migration — they were written and never queried.

The alternative, having MikroORM own all 14 tables, was rejected: it would duplicate the 9 Drizzle
tables as Mikro entities and discard schema that already exists. Having Drizzle own all 14 was also
rejected: it would describe the 5 Mikro tables twice, once as a Drizzle table for migration
purposes and once as a Mikro entity.

## Consequences

**Enforcement is part of the decision, not an afterthought.** A table with two owners is the
failure mode that makes dual ORM unmaintainable, so:

- `drizzle-kit` may only emit DDL for the 9 Drizzle tables.
- MikroORM's schema generator may only emit DDL for the 5 Mikro tables.
- A `schema:check` script fails the build when either tool would touch a table it does not own.
- The ownership table in this ADR is the contract. Changing it requires a new ADR.

**Migration history starts clean.** The existing Supabase schema was dropped and rebuilt from the
generated migrations rather than baselined.

**Two `paginate` implementations remain, one per ORM.** This is the acceptable cost of two
adapters at a real seam. Both must clamp identically and emit the same `PaginatedMeta`, which is
declared once in `packages/shared`.

**This supersedes the data-access rationale in `docs/ARCHITECTURE.md:158-183`,** which argued for
Prisma owning DDL with lighter clients for read paths. Consolidating on the two surviving
lightweight clients completes that argument rather than contradicting it.

**Rejected alternative: one ORM total.** Prisma was the strongest single candidate on evidence —
it owns the schema definition, migrations and generated client. It was rejected because the stated
intent is a two-ORM architecture, with MikroORM retained specifically for the ABDM and audit
transaction work. If this ADR is ever revisited, note that the pagination work in
`docs/PLAN-orm-consolidation.md` Phase 4 makes either choice cheap later, because the duplicated
pagination is removed regardless of which client sits underneath.
