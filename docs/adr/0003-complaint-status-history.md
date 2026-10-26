# 3. Complaint status history is a Drizzle-owned append-only table

Date: 2026-10-26

Status: accepted

## Context

Department staff can update the status of the complaints they are granted access
to (`complaint_viewers`). The admin panel also has to show *who* moved a
complaint to its current status and *when*.

Before this ADR, a status update only overwrote `grievances.complaintStatus` and
`grievances.assignedTo`. That last-writer column cannot answer "who did what":
each update destroys the previous actor, there is no timestamp per transition,
and a deleted staff account leaves no readable trail at all.

The portal needs a per-complaint timeline that both ADMIN and the department's
STAFF can read, that survives account renames and deletions, and that is written
in the same transaction as the status change.

## Decision

Add `complaint_status_history`, owned by **Drizzle**, with one row per
transition:

- `complaintId` — cascade delete with the complaint.
- `fromStatus`, `toStatus` — null `fromStatus` for the initial submission.
- `resolution` — the optional note supplied with the transition.
- `changedBy` — FK to `users`, `on delete set null`.
- `changedByName` — snapshot of the actor's display name at the time.
- `changedByRole` — `ADMIN`, `STAFF`, or null for a citizen submission.
- `createdAt` — server timestamp of the transition.

The service writes the status update and the history row inside one
`db.transaction`, so a complaint can never show a status the trail does not
explain. The list endpoint returns the history for the complaints on the current
page in a single batched query rather than one query per card.

The Drizzle-owned table count becomes **13**; MikroORM stays at **5**.

## Consequences

- `drizzle/0008_smiling_preak.sql` creates the table and its indexes.
- `npm run schema:check` expects **13 + 5** tables.
- `AGENTS.md`, `README.md` and `docs/ARCHITECTURE.md` state 13 Drizzle-owned
  tables.
- Citizen submissions are recorded with `changedBy = null` and the name the
  citizen typed, so anonymous complaints still have a readable first entry.
- The snapshot of the actor name means a later rename does not rewrite history,
  and deleting a staff account does not erase the trail.
- History rows are never updated or deleted by the application; retention
  follows the complaint itself and CERT-In audit retention lives separately in
  MikroORM's `audit_logs`.

## Rejected alternatives

- **Reuse `audit_logs`** — those rows are written by MikroORM and describe
  system-wide changes. The complaint timeline is a citizen-facing, per-record
  read path; joining across ORMs for it would break the ownership boundary.
- **Keep only `assignedTo` and `updatedAt`** — cannot represent more than the
  latest actor and cannot show a timeline.
- **A JSON column on `grievances`** — read-modify-write on a public form path,
  loses indexability per transition, and has no natural FK to the actor.
