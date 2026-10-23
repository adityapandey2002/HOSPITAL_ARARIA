# ORM Consolidation & Phase-1 API Plan

Status: implemented through Phase 5, with the remaining gaps listed at the end
Created: 2026-10-16
Supersedes: nothing. Amends the data-access section of `docs/ARCHITECTURE.md`.

## Decision

The backend drops Prisma and runs on **exactly two ORMs**:

- **Drizzle** — query + DDL for the 9 application tables
- **MikroORM** — query + DDL for the 5 ABDM and audit tables

Prisma is removed entirely: the client, the CLI, `prisma/schema.prisma`, `prisma/seed.ts`, and
the `DATABASE_URL` connection scheme.

### Table ownership is a hard boundary

Each table has exactly one owner. No table may be written by both frameworks, and neither
framework's migration tooling may emit DDL for the other's tables.

| Owner | Tables |
|---|---|
| Drizzle | `users`, `departments`, `doctors`, `time_slots`, `appointments`, `blood_stock`, `grievances`, `notices`, `contact_messages` |
| MikroORM | `abha_profiles`, `care_contexts`, `fhir_bundles`, `consent_artefacts`, `audit_logs` |

Rationale for the split: ABDM entities and audit records are write-heavy, relationally rich and
transaction-scoped, which is MikroORM's strength and needs its identity map for the Unit-of-Work
auditing the design already relies on. Application tables are read-heavy with hand-tuned joins,
where Drizzle's explicit SQL and small bundle win.

Recorded as `docs/adr/0001-dual-orm-table-ownership.md`.

## Current state

The backend **does not compile**. `tsc -p tsconfig.build.json --noEmit` reports 42 errors, all
TS2564 (strict property initialisation) across the MikroORM entities and `pagination.dto.ts`.

The documented setup path is also broken, independently of this work:

| Defect | Location |
|---|---|
| `DATABASE_URL` absent from both `.env.example` files, so `PrismaService.$connect()` throws | `apps/backend/.env.example`, `prisma/schema.prisma:10` |
| `prisma/migrations/` gitignored, defeating "Prisma owns all DDL" | `.gitignore:57` |
| Docker + nginx probe `/health/live`, which 404s behind the `/api/v1` prefix | `apps/backend/Dockerfile:56`, `nginx/nginx.conf:167` |
| `test/jest-e2e.json` contains CommonJS in a `.json` file | `apps/backend/test/jest-e2e.json:1` |
| Root `npm test` fails: two packages declare `"test": "jest"` with no Jest installed | `packages/shared/package.json:10`, `packages/ui/package.json:10` |
| `main.ts` reads flat `PORT`/`NODE_ENV`/`FRONTEND_URL` while `configuration.ts` defines nested keys — both resolve today via the validated env, but it leaves two spellings of every setting and bypasses the computed values; standardise on the nested keys | `apps/backend/src/main.ts:24-26` |
| `NODE_ENV=staging` is documented but rejected by Joi | `apps/backend/src/config/validation.ts:7` |

## Plan

### Phase 0 — Unblock the build

- Add definite-assignment assertions to the 5 MikroORM entity files and `pagination.dto.ts` (42 errors).
- Fix `main.ts` to read the nested config keys that `configuration.ts` actually defines.
- Add `staging` to the `NODE_ENV` Joi enum.
- Remove the stray `apps/backend/test.ts` and `test.js` (the former contains a deliberate type error).

Exit: `npx tsc -p tsconfig.build.json --noEmit` is clean.

### Phase 1 — One connection scheme

`DATABASE_URL` becomes the single source of truth for all three consumers. It replaces `DB_HOST`,
`DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`.

- One parser that turns the URL into pool config, used by the Drizzle pool and the MikroORM driver.
  `DB_*` remain as optional explicit overrides for local Docker, never as a required scheme.
- Joi validates `DATABASE_URL` as required, so a missing value fails at boot with a clear message
  rather than deep inside a connection attempt.
- `drizzle-kit` gets added to `package.json` properly. It is currently present in the root
  `node_modules` with **zero entries in `package-lock.json`** — an orphan install that will vanish
  on the next clean install.
- Fix the two health-check paths.
- Repair the e2e Jest config and the two package test scripts.

### Phase 2 — Remove Prisma

Five services move to Drizzle. The Drizzle schema already defines `users`, `doctors`, `timeSlots`
and `appointments` (`src/common/drizzle/schema.ts:109-251`) — they were written and never used, so
this is a query-syntax rewrite, not new schema.

| File | Change |
|---|---|
| `modules/users/users.service.ts` | Prisma → Drizzle; `findByEmail` must keep selecting `password` for the login path |
| `modules/doctors/doctors.service.ts` | Prisma → Drizzle; needs `department`, `user`, `timeSlots` via `leftJoin`, plus an `ilike` search replacing `mode: 'insensitive'` |
| `modules/appointments/appointments.service.ts` | Prisma → Drizzle; the four-step booking invariant (doctor active, slot available, no double-booking, token number) must be preserved exactly, and the double-booking check must run inside a transaction |
| `modules/auth/auth.service.ts` | Prisma → route user access through `UsersService` so one module owns the `users` table |
| `modules/health/health.controller.ts` | Prisma ping → Drizzle ping, and add the MikroORM probe that is currently missing |
| `common/auth/jwt.strategy.ts` | Remove the unused Prisma injection |
| `common/prisma/` | Delete |
| `prisma/schema.prisma`, `prisma/seed.ts` | Delete after porting the seed to Drizzle |

Enum imports move from `@prisma/client` to `@dh-araria/shared`. Six files currently import Prisma
enums, including `grievances.controller.ts` which mixes Prisma enum types into a Drizzle-backed
module.

Every response shape must be preserved. The `include` clauses in the Prisma services select
specific nested fields, and the frontend depends on those exact shapes.

### Phase 3 — DDL and migrations

- `drizzle.config.ts` plus a real `drizzle-kit` dependency, generating the initial migration for
  the 9 Drizzle tables.
- MikroORM's schema generator creates the 5 Mikro tables. The existing read-only drift script
  (`scripts/mikro-schema-update.ts`) becomes the enforcement path.
- Replace the Prisma npm scripts (`db:generate`, `db:push`, `db:migrate`, `db:migrate:prod`,
  `db:studio`, `db:seed`) with Drizzle and MikroORM equivalents.
- Add a `schema:check` script that fails when either tool would emit DDL for a table it does not own.
- Commit the migration history. `.gitignore` must not exclude it.

Per the decision above, the existing Supabase schema is **dropped and recreated from scratch**. The
migration history starts clean. Take a `pg_dump --schema-only` snapshot first, in case anything in
there turns out to be worth keeping.

### Phase 4 — Architectural fixes

In priority order. Candidate 2 first, because it is a live authorization hole.

1. **Authorization (security hole).** Six routes carry `@Roles(...)` metadata but omit
   `RolesGuard` from `@UseGuards`, so the metadata is never read:
   `appointments.controller.ts:22,63,91,99` and `blood-bank.controller.ts:55,71`.
   `RolesGuard` is a plain provider in `common.module.ts:26`, not an `APP_GUARD`, so it runs only
   where explicitly listed. Any authenticated patient can reach the admin appointment list and
   mutate blood stock. Consolidate the four spellings of "staff" into one policy module, register
   the guard globally, and standardise on `ForbiddenException`.
2. **Pagination.** Eleven re-implementations; the two base repository classes that already clamp
   have zero subclasses. Subclass them for real, and move `PaginatedMeta` into
   `packages/shared`. Fixes two live bugs at once: `departments` awaits its count sequentially, and
   `blood-bank` counts the unfiltered table while paging a filtered one.
3. **Domain enums.** Nine vocabularies are each declared five times, in two incompatible formats —
   `packages/shared/src/constants/index.ts:105` uses `{ value: 'A+' }` where the server accepts
   `A_POSITIVE`. `docs/API.md:471` teaches the failing value. Single source of truth in
   `packages/shared`, consumed by services, schemas and frontend.
4. **Sorting and filtering.** Three services interpolate raw `sortBy` into `orderBy`. Fold sorting
   into the pagination module as declared data, which closes the interpolation by construction.

### Phase 5 — Complete the APIs

Backend has 58 routes; 19 of the 24 endpoints the frontend declares have no caller.

- **Wire the three fake submits.** `GrievanceForm.tsx:65`, `AppointmentBooking.tsx:129` and
  `ContactPage.tsx:118` all `await setTimeout(1500)` and report success. The grievance form is the
  urgent one: it mints a client-side `GRS-...` id that is never persisted and displays
  "Auto-forwarded to CPGRAMS" at line 123, with no CPGRAMS call anywhere. `POST /grievances`
  already exists and is unwired.
- **Add the contact endpoint.** `POST /contact` has no backend route at all.
- **ABDM.** The four webhooks documented at `docs/API.md:707-710` do not exist. The two routes that
  do exist are undocumented. Add discovery, request, notify and consent callbacks with signature
  verification, and document `GET /abdm/bundles/:id` and `POST /abdm/consents/:id/revoke`.
- **Audit log query endpoints.** `AuditLogService.find` exists with no route in front of it.
- **Forgot/reset password.** `auth.service.ts:181-200` are TODO stubs that return success, never
  send mail and never validate a token.
- **Real DTOs.** Nine sites use `@Body() data: any` with services accepting `data: any` and
  `as Insert` casts. Only auth has DTOs.

### Phase 6 — Frontend data layer

- One data module per domain context, built on `useAsyncState` (`packages/ui/src/hooks/index.ts:181`,
  zero importers) or the already-installed `swr` with the ready-made `fetcher` export.
- Delete the module-level fixtures. They are why the homepage blood stock contradicts the detail
  page, and `departments` is triplicated with a fourth variant in `AppointmentBooking.tsx`.
- Trim `api.ts` from 27 methods to the endpoints actually in use.

### Phase 7 — Documentation

- Adopt one status vocabulary for control claims: implemented / planned / not applicable.
- `SECURITY.md` currently marks CERT-In as implemented while the 180-day retention purge it relies
  on has no `@Cron` anywhere. Mark honestly, or schedule it.
- Fix the `RS256` claim (`jwt.strategy.ts:16` signs HS256) and the httpOnly-cookie claim
  (`AuthContext.tsx:90` uses `localStorage`).
- Delete or wire up Redis, which appears in `docker-compose.yml` with zero consumers.
- Rewrite the data-access sections of `ARCHITECTURE.md` for the real two-ORM model, and correct the
  "Dual-ORM" container label.

## Sequencing

Phases 0 and 1 first — nothing can be verified until the build compiles and the environment works.
Phase 2 before 3, since migrations must reflect the final query layer. Phase 4 candidate 2 before
candidate 1-style work touching the same services, because both edit
`grievances.service.ts`. Phase 5 before 6, so the frontend is written once against final routes.

## Risks

| Risk | Mitigation |
|---|---|
| Response-shape drift during the Prisma rewrite silently breaks the frontend | Preserve each `include`/`select` shape exactly; the two live frontend calls are auth and `GET /blood-bank` |
| Token-number derivation and the double-booking check are read-then-write | Move both into one transaction with the right lock; the current Prisma code has no transaction either |
| Two DDL owners drift | `schema:check` fails the build; ownership table above is the contract |
| Orphan `drizzle-kit` install masks a broken lockfile | Add it properly in Phase 1 so a clean install reproduces it |

## Delivered

Phases 0–4 are complete and verified without a database:

- `tsc` clean for backend and frontend; `npm run build` builds every workspace.
- 60 backend tests and 6 frontend tests pass.
- `npm run schema:check` reports 9 Drizzle + 5 MikroORM tables, no overlap.
- `POST /contact` and its admin inbox routes exist; `contact_messages` is in
  migration `0001_quick_aqueduct.sql`.
- Every write endpoint validates a real DTO; no `@Body() data: any` remains.
- Grievance, contact, appointment, department, doctor and notice pages read
  from the API; the appointment form resolves real departments, doctors and
  weekday slots instead of hardcoded ids.
- Forgot/reset password issues a 15-minute JWT bound to the current password
  hash, so it is single-use. A mail transport still has to deliver it.

## Remaining

1. **Database verification.** No reachable PostgreSQL instance was available
   (`DATABASE_URL` points at a paused/deleted Supabase project). Run
   `db:migrate`, `db:seed`, `schema:check:live` and boot the API once one exists.
2. **ABDM inbound webhooks.** Blocked on sandbox enrolment and gateway
   certificates; see `docs/API.md`.
3. **Homepage fixtures.** `Departments.tsx`, `Notices.tsx` and `BloodBank.tsx`
   are marketing teasers and still render module-level arrays; the full list
   pages they link to are API-driven.
4. **Email delivery.** `forgotPassword` logs the token in development and
   returns it only when `NODE_ENV=development`; production needs an SMTP/SMS
   provider.
5. **Guest booking.** `POST /appointments` accepts an unauthenticated request
   only when it carries an existing `patientId`; there is no guest-registration
   flow yet.
