# 2. Feedback tables are owned by Drizzle

Date: 2026-10-24

Status: accepted

## Context

The portal needs a live department feedback channel. Citizens reach it from a
public link (`/feedback`, `/feedback/<departmentId>`) without an account; HM and
the department heads/nodal officers read the responses internally.

That requires two new tables:

- `feedback` — one row per submission, scoped to one department.
- `feedback_viewers` — the per-user, per-department read grants that let a
  department head or nodal officer see one or more departments.

ADR-0001 makes Drizzle the DDL owner for application tables and MikroORM the
owner for ABDM/audit tables, and declares the ownership table a contract that
changes only through a new ADR. This is that ADR.

## Decision

Both tables are owned by **Drizzle**. The Drizzle count becomes **11**; the
MikroORM count stays **5**.

`feedback` is read-heavy, joins directly to `departments`, and is written by a
public endpoint with no transaction spanning ABDM entities. It belongs with the
other application tables (`notices`, `grievances`, `contact_messages`), not with
the identity-mapped ABDM/audit set.

`feedback_viewers` is a small authorization join table over `users` and
`departments`, both already Drizzle-owned. Putting it in MikroORM would create a
cross-ORM foreign key, which the ownership rule forbids.

## Consequences

- `drizzle/` gains a generated migration for both tables and the two new enums
  (`FeedbackServiceArea`, `FeedbackStatus`).
- `scripts/schema-check.ts` expects **11 + 5** tables and fails the build if a
  migration touches a table Drizzle does not own.
- `docs/ARCHITECTURE.md` and `AGENTS.md` must state 11 Drizzle-owned tables.
- Authorization is data, not a new role: `ADMIN` (HM) sees all departments;
  everyone else needs a `feedback_viewers` row. A future `HOSPITAL_MANAGER` role
  can be added without changing the tables.
- Deletion is restricted: a department with feedback cannot be deleted
  (`onDelete: restrict`). Deleting a user cascades their grants.

## Rejected alternatives

- **New `HOSPITAL_MANAGER` role** — would touch every guard and the user enum for
  one feature. The grant table already expresses the policy; role splitting can
  come later.
- **Storing feedback outside PostgreSQL** (Supabase table via the client SDK) —
  would introduce a second data-access path next to Drizzle and break the
  single-connection-scheme rule in ADR-0001.
