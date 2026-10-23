# AGENTS.md

Guidance for AI coding agents working in this repo.

## Project

DH Araria Hospital Portal — a digital healthcare platform for a district hospital, built to Government of India accessibility and data-residency standards. NestJS backend, Next.js frontend, npm workspaces monorepo.

See `docs/ARCHITECTURE.md` for the system and container diagrams, and `docs/DEVELOPER_GUIDE.md` for setup.

## Commands

Run from the repo root; the root `package.json` forwards into workspaces.

- `npm run dev` — frontend and backend together
- `npm run build` — packages first, then apps
- `npm test` — all workspaces
- `npm run db:generate` — regenerate Drizzle SQL from `schema.ts` (no database needed)
- `npm run db:migrate` — apply Drizzle migrations, then reconcile MikroORM schema
- `npm run db:seed` — idempotent demo data
- `npm run db:studio` — Drizzle Studio
- `npm run schema:check` — enforce the Drizzle/MikroORM table-ownership boundary (offline)

## Git habit (mandatory)

Commit every change — even minimum ones — in parallel with making it, rather than leaving a long uncommitted diff. Preferred cadence:

- `git add -A && git commit -m "<concise, imperative summary>"` after each coherent unit of work (a new endpoint, a DTO sweep, one component wired, one doc fix, etc.).
- Do not wait until "everything is done" to commit. A build failure or context reset mid-work is much cheaper to recover from with small, frequent commits.

No database is required to commit; schema:check, tsc, and Jest all run offline.

## Database

PostgreSQL with two ORMs and a hard ownership boundary (see
`docs/adr/0001-dual-orm-table-ownership.md`):

- **Drizzle** owns 9 tables: `users`, `departments`, `doctors`, `time_slots`,
  `appointments`, `blood_stock`, `grievances`, `notices`, `contact_messages`.
  The schema at `apps/backend/src/common/drizzle/schema.ts` is the DDL source of
  truth; `drizzle/` holds the committed migrations.
- **MikroORM** owns 5 tables: `abha_profiles`, `care_contexts`, `fhir_bundles`,
  `consent_artefacts`, `audit_logs`. `db:migrate` reconciles them with
  `updateSchema({ safe: true })`.

`DATABASE_URL` is the single connection scheme, read by both ORMs, drizzle-kit
and the scripts through `apps/backend/src/config/database-url.ts`. Backend env
vars go in `apps/backend/.env` (gitignored); `@nestjs/config` validates them
against `apps/backend/src/config/validation.ts` on boot.

## Agent skills

### Issue tracker

Issues live in GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Multi-context: a root `GLOSSARY-MAP.md` points at per-context glossaries for the backend domain contexts (appointments, grievances, blood-bank, notices, abdm, portal). See `docs/agents/domain.md`.
