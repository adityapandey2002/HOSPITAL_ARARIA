# Production Launch Readiness — DH Araria Hospital Portal

Assessment date: 2026-10-25
Scope: the monorepo at `apps/backend`, `apps/frontend`, `packages/*`
Deployment target: **Vercel** (Next.js frontend project + NestJS serverless function)
backed by **Supabase PostgreSQL**
Verdict: **GO for the first production deployment**, conditional on the operator
checklist in `docs/DEPLOYMENT.md` (nothing in the repository can create the
Supabase project, the two Vercel projects, or the first admin account).

This is a point-in-time assessment, not a certification. Items marked
"unverified" were not exercised because they need a deployed environment, real
traffic, or an external audit. The previous revision of this document was
written against a Kubernetes/MeghRaj target and is superseded.

---

## Assessment evidence

Every row below was produced from a clean `npm install` on this tree.

| Gate | Command | Result |
|------|---------|--------|
| Schema ownership | `npm run schema:check` | **PASS** — Drizzle owns 11 tables, MikroORM owns 5, no overlap. |
| Backend type-check | `npx tsc --noEmit -p apps/backend/tsconfig.json` | **PASS** — 0 errors. |
| Backend lint | `npm run lint --workspace=apps/backend` | **PASS** — 0 errors, 24 warnings (`no-explicit-any`, unused test imports). |
| Backend tests | `npm test --workspace=apps/backend -- --runInBand` | **PASS** — 6 suites, 86 tests. |
| Backend build | `npm run build:backend` | **PASS** — `nest build` emits `dist/`, including `dist/bootstrap.js` for the Vercel function. |
| Frontend type-check | `npm run type-check --workspace=apps/frontend` | **PASS** — 0 errors. |
| Frontend lint | `npm run lint --workspace=apps/frontend` | **PASS** — 0 errors, 74 warnings (unused imports, `<img>`, `set-state-in-effect` kept at warn). |
| Frontend tests | `npm test --workspace=apps/frontend -- --runInBand` | **PASS** — 3 suites, 23 tests. |
| Frontend build | `npm run build:frontend` | **PASS** — Next.js 16.4.3, all routes emitted. |
| Dependency audit | `npm run audit:ci` | **PASS** — 0 critical, 7 high (all allowlisted), 3 moderate, 0 low. |
| E2E | `npm run test:e2e` | **NO TESTS** — the suite is configured with `--passWithNoTests` and no `*.e2e-spec.ts` exists. |
| Live deployment | manual | **NOT PERFORMED** — `docs/DEPLOYMENT.md` is complete but has not been executed against real Vercel/Supabase projects. |

### Dependency audit detail

Critical count is **0**. The seven high findings are four distinct causes, all
time-boxed in `docs/security/audit-allowlist.json` with an expiry of
**2027-01-31** and a documented compensating control in `docs/SECURITY.md`:

| Package | Why it cannot be fixed today | Control |
|---|---|---|
| `axios` | No 1.x release contains the fix (registry latest is 1.12.2; advisories reference 1.15.0). | Client only calls the build-time `NEXT_PUBLIC_API_URL`; no user-supplied URL or proxy config. |
| `form-data` | Fix is 4.0.6, unpublished (latest 4.0.4). | Reached only through `axios`/`supertest`; all public forms submit JSON. |
| `zod` | Fix is 4.6.7, unpublished (latest 4.6.5). | Frontend form validation only; backend re-validates every request with `class-validator` DTOs. |
| `body-parser`, `express`, `@nestjs/platform-express` | One transitive chain: `body-parser` 2.4.0 (the fix) is unpublished. Express 5 cannot use body-parser 1.x. | Both parsers mounted explicitly in `src/bootstrap.ts` with a 100 kB limit; Vercel caps the function at 30 s / 1024 MB. |
| `multer` | The newest advisory covers `<2.5.0`; 2.5.0 is unpublished and Nest pins 2.2.0 exactly. | No upload endpoint exists in the backend, so the multipart parser is never reached. |

The registry on this machine is behind the advisory database for all four causes
(advisories name versions that do not exist yet). The gate has a hard expiry, so
CI fails on 2027-02-01 unless these are upgraded or renewed with fresh evidence.

---

## What changed since the previous assessment

Every P0 from the prior revision is closed in code:

| Previous P0 | Now |
|---|---|
| Clear the dependency audit (2 critical / 12 high) | **Closed** — 0 critical; 7 high allowlisted with controls and an expiry. `next` 14.2.3 → 16.4.3 removed the two critical RCEs; `tar` left the tree. |
| Remove `db:seed` from the production procedure | **Closed** — `db:seed` refuses to run under `NODE_ENV=production` unless `ALLOW_PROD_SEED=true`, and `bootstrap:admin` creates the first ADMIN from `ADMIN_EMAIL`/`ADMIN_PASSWORD`. |
| Add CI | **Closed** — `.github/workflows/ci.yml`: `npm ci` → `schema:check` → shared build → backend lint → backend build → frontend lint → frontend build → `npm test` → `audit:ci`. |
| Stop leaking 500 details | **Closed** — `HttpExceptionFilter` maps non-`HttpException` errors to a generic message when `NODE_ENV=production`; the stack stays in logs. |
| Make the deployment path real | **Closed** — `docs/DEPLOYMENT.md` is now a Vercel + Supabase runbook; the Kubernetes/MeghRaj artefacts were never committed and are no longer referenced. |
| Add production error visibility | **Partially closed** — `app/error.tsx`, `app/global-error.tsx`, and the public `POST /api/v1/client-errors` endpoint emit one PII-free structured log line per client crash. No third-party APM and no alert rules are committed. |

Additional blockers found and fixed after the previous assessment:

- **Refresh tokens were accepted as access tokens.** Both tokens were signed with
  the same secret and carried the same claims, so a 7-day refresh token could be
  used as a bearer credential. Both now carry an explicit `typ` claim and both
  verifiers reject the wrong kind.
- **Serverless pool defaults were 20, not 1.** Joi applied `.default(20)` and
  `@nestjs/config` copies validated defaults into `process.env`, so the
  serverless branch in the configuration factory never fired. The defaults moved
  into `defaultPoolSize()` in `src/config/database-url.ts`, shared by Drizzle and
  MikroORM, and the Joi fields are now optional.
- **The Vercel function limit was keyed to `api/index.ts`** while the committed
  entry point is `api/index.js`, so the memory/timeout limits may not have
  applied.
- **`db:migrate` ran the MikroORM reconcile through `DATABASE_URL`** even when
  `DATABASE_MIGRATION_URL` pointed at the direct connection, so DDL could hit the
  transaction pooler.
- **The password-reset token was written to the debug log in every
  environment.** It is now logged only when `NODE_ENV=development`, matching the
  response-body gate.
- **Migration `0000` could not repair a database created by `drizzle-kit push`.**
  Because it uses `CREATE TABLE IF NOT EXISTS`, the seven tables the push had
  created kept their missing `"updatedAt"` DEFAULT, and every insert into them
  failed with SQLSTATE 23502 — including `bootstrap:admin`, which is how the gap
  was found during the first deployment attempt. Migration
  `0004_timestamp_defaults` restores the default and is a no-op on a database
  that `db:migrate` created.

---

## Remaining gaps

### Ships with a documented risk

- **No e2e coverage.** Unit tests cover the feedback service (25 cases), auth,
  and the rating UI, but no browser test drives login → book appointment →
  grievance → notice. The first production smoke test in `docs/DEPLOYMENT.md`
  is manual.
- **Third-party APM / alerting is absent.** Client and server errors are logged;
  nothing pages a human. Configure Vercel log drains and Supabase alerts before
  real traffic.
- **Database TLS is encrypted but not verified** (`rejectUnauthorized: false` in
  `tlsOptions`). Traffic cannot be read in transit, but a forged certificate is
  not detected. Pinning Supabase's CA bundle is the fix; it is not wired yet.
- **Logout does not revoke the refresh token.** The API is stateless and has no
  denylist; the client discards both tokens.
- **The 180-day audit-log purge exists only as a documented intention.** There is
  no scheduled job, so `audit_logs` grows indefinitely until one is added.
- **React 18 is deprecated by Next 16.** The build prints a warning and Next 17
  will require React 19.

### Requires an operator

- Create the Supabase project and both connection strings.
- Create the two Vercel projects, set every environment variable, and redeploy
  the frontend once `NEXT_PUBLIC_API_URL` is final (it is baked in at build time).
- Run `db:migrate` with `DATABASE_MIGRATION_URL`, then `bootstrap:admin`.
- Set `FRONTEND_URL` to the real origins after the first frontend deployment.
- Confirm the Supabase plan's PITR/backup retention and the Vercel function
  limits actually applied in the dashboard.

### P1 — close during the first month

- Add Playwright e2e coverage for the five citizen journeys plus the feedback
  submission and inbox flows.
- Pin the Supabase CA bundle so `rejectUnauthorized` can be `true`.
- Wire an APM and alert rules (5xx rate, p95 latency, DB connection saturation,
  function cold-start failures).
- Implement a refresh-token denylist (or document the risk as accepted).
- Schedule the 180-day audit purge.
- Remove dead configuration and dependencies (`pino`, `pino-pretty`, `REDIS_*`,
  `UPLOAD_PATH`, the `NEXT_PUBLIC_ENABLE_*` flags), or implement them.
- Reduce the 98 lint warnings; promote `react-hooks/set-state-in-effect` to an
  error once the mount-loading effects are refactored.
- Plan the React 19 upgrade before Next 17.

### P2 — after launch

- Load test at expected peak (appointment slot contention, feedback bursts).
- Review indexes against `EXPLAIN ANALYZE` for the busiest list endpoints.
- Changelog / release-notes convention.
- Remove the obsolete `version:` key from `docker-compose.yml`.

---

## Deployment path

The runbook is `docs/DEPLOYMENT.md`. The shape is:

1. **Supabase** — one project. `DATABASE_URL` is the transaction pooler
   (`:6543`) used by both ORMs at runtime; `DATABASE_MIGRATION_URL` is the direct
   connection (`:5432`) used only for DDL.
2. **Backend Vercel project** — root directory `apps/backend`, build via
   `apps/backend/vercel.json`, one function (`api/index.js`) that requires the
   compiled `dist/bootstrap`. Region `bom1`. It never imports `src/`: Vercel's
   TypeScript transpile omits `emitDecoratorMetadata`, which breaks Nest DI.
3. **Migrations and first admin** — `npm run db:migrate` with
   `DATABASE_MIGRATION_URL`, then `npm run schema:check`, then
   `npm run bootstrap:admin`. Never `db:seed`.
4. **Frontend Vercel project** — root directory `apps/frontend`, Next.js preset,
   region `bom1`, `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` set before the
   build.
5. **Close the loop** — set the backend's `FRONTEND_URL` to the deployed origins
   (comma-separated allowlist) and redeploy the backend.
6. **Smoke test** — `/api/v1/health`, the public notices read, the feedback form
   on a real phone, and the inbox with an ADMIN account.

`DRIZZLE_POOL_SIZE=1` and `MIKRO_POOL_SIZE=1` are no longer required for
correctness — the defaults are serverless-aware — but setting them explicitly is
still recommended so a dashboard change cannot reintroduce a 20-connection pool.

---

## Rollback plan

### Trigger conditions

- 5xx rate more than 2× baseline for 10 minutes.
- p95 latency more than 50% above baseline for 10 minutes.
- Any data-corruption signal (duplicate appointments, negative blood stock,
  missing audit rows).
- A newly disclosed critical vulnerability in a deployed dependency.

### Application — Vercel instant rollback

```bash
# Promote the previous good deployment back to production, no rebuild.
vercel rollback <deployment-url> --scope <team>

# Or in the dashboard: Deployments -> previous deployment -> "Promote to Production".
```

Both projects roll back independently, so a bad backend deploy does not force a
frontend rollback. Target: under 2 minutes.

### Database

Migrations are **forward-only**; there are no down migrations. A bad schema
change is recovered by restoring the database, not by an ad-hoc `DROP`:

```bash
# Supabase dashboard -> Database -> Backups -> restore the pre-release snapshot,
# or use PITR to the timestamp before the migration.
# Then re-run the read-only check against the restored database:
npm run schema:check
```

`db:migrate` never drops the MikroORM tables unless
`ALLOW_DESTRUCTIVE_SCHEMA=true`, so a routine re-run of migrations is additive.
Target: under 30 minutes, and the restore must be exercised once in staging
before the first public release.

### Communication

Notify the on-call engineer, the DevOps lead, and the Project Director; record
the trigger, the rollback timestamp, and the verification result in the incident
log.

---

## Post-launch verification (first hour)

Replace the hosts with the real Vercel project domains.

```bash
# 1. Health — note the /api/v1 prefix and that this is the backend project.
curl -fsS https://<backend>.vercel.app/api/v1/health/live
curl -fsS https://<backend>.vercel.app/api/v1/health/ready

# 2. Public read path.
curl -fsS "https://<backend>.vercel.app/api/v1/notices?page=1&limit=5"

# 3. Public feedback write path (expect 200 and a reference id).
curl -fsS -X POST https://<backend>.vercel.app/api/v1/feedback \
  -H 'Content-Type: application/json' \
  -d '{"departmentId":"<uuid>","serviceArea":"OPD","rating":5}'

# 4. Throttle still works: the sixth POST inside a minute must return 429.

# 5. Frontend: open /feedback on a phone, submit, then confirm the row appears in
#    /feedback/inbox for an ADMIN and for a granted department viewer, and not
#    for an ungranted account.

# 6. Logs: confirm request logs and any client_error lines are visible.
# 7. Rollback: confirm the previous deployment is still listed as promotable.
```

---

## Error-budget policy

Adopt this before the first release and record the SLOs in the runbook:

| Budget remaining | Action |
|---|---|
| >20% | Ship normally; monitor closely. |
| 0–20% | Slow rollouts only; no high-risk changes. |
| Exhausted | Freeze feature work; reliability work only. |
| Reset | Resume normal pace; keep the fix that recovered it. |

Suggested starting SLOs for this service: 99.5% monthly availability for the
public read paths, 99.0% for appointment booking and feedback submission, and
p95 API latency under 500 ms.

---

## Sign-off

| Role | Name | Date | Decision |
|------|------|------|----------|
| DevOps Lead | | | |
| Security Officer | | | |
| Project Director | | | |

A public launch is approved when the operator checklist in `docs/DEPLOYMENT.md`
is complete, the first-hour smoke test above passes, and the sign-off row is
filled.
