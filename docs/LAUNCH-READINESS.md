# Production Launch Readiness — DH Araria Hospital Portal

Assessment date: 2026-10-24
Scope: the monorepo at `apps/backend`, `apps/frontend`, `packages/*`
Verdict: **NO-GO for public production** until the P0 blockers below are closed.

This is a point-in-time assessment, not a certification. Items marked "unverified"
were not exercised because they need a deployed environment, real traffic, or an
external audit.

---

## Assessment evidence

| Gate | Command | Result |
|------|---------|--------|
| Unit tests | `npm test` | **PASS** — 66 tests (60 backend, 6 frontend). Jest warns that a worker did not exit gracefully (likely an open handle). |
| Build | `npm run build` | **PASS** — packages, backend, and frontend compile; Next lint/type-check pass; 13/13 static pages generated. |
| Schema ownership | `npm run schema:check` | **PASS** — Drizzle owns 9 tables, MikroORM owns 5, no overlap. |
| Dependency audit | `npm audit --omit=dev` | **FAIL** — 23 production vulnerabilities: 2 critical, 12 high, 9 moderate. |
| Lint | backend ESLint | **UNVERIFIED** — the type-aware backend lint did not finish within 3 minutes on this machine; Next's lint (frontend) passed during `next build`. |
| E2E | `npm run test:e2e` | **NO TESTS** — the suite is configured with `--passWithNoTests` and there are no `*.e2e-spec.ts` files. |
| Deploy config | manual | **INCOMPLETE** — `docs/DEPLOYMENT.md` references `k8s/`, `infra/terraform/`, `nginx/ssl/`, and `nginx/conf.d/`, none of which are committed. |

Reproduce the audit with `npm audit --omit=dev --json`; the two critical findings are
`next` (multiple RCE/DoS advisories, fixed in 14.2.35) and `tar` (transitive via
`bcrypt` 5.x, fixed by `bcrypt` 6).

---

## Checklist status

Legend: ✅ done · ⚠️ partial / unverified · ❌ missing

### Code quality
- ✅ Unit tests pass (66).
- ⚠️ Build passes, but with webpack cache warnings and many `no-explicit-any` lint warnings.
- ⚠️ No e2e coverage of the critical citizen flows (login, book appointment, grievance, blood bank, notices).
- ⚠️ One `console.log` remains in production frontend code (`src/context/LanguageContext.tsx:52`).
- ✅ No `TODO`/`FIXME`/`HACK` markers in application source.
- ⚠️ Jest worker leak warning — investigate with `--detectOpenHandles` before trusting CI stability.
- ⚠️ Backend ESLint could not be verified end-to-end in this environment.

### Security
- ❌ **2 critical / 12 high** production dependency vulnerabilities (`npm audit --omit=dev`).
  - `next` 14.2.3 → 14.2.35 (non-major fix available; includes critical RCE advisories).
  - `drizzle-orm` 0.33 → 0.45.3 (SQL-injection advisory; major upgrade).
  - `zod` 3.23 → 4.6.7 (DoS advisory; major upgrade).
  - `bcrypt` 5.1.1 → 6.0.0 (pulls the fixed `tar`; native module, retest Docker build).
  - `body-parser` / `multer` / `file-type` via Nest 10; fixed in Nest 12 (major).
- ✅ No `.env` files committed; only `.env.example` is tracked.
- ✅ `JWT_SECRET` is required by Joi validation with a 32-character minimum.
- ✅ `helmet`, compression, explicit CORS origin, global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`.
- ✅ Global `ThrottlerGuard`, stricter `@Throttle` on login/register/password-reset/contact.
- ✅ Global `JwtAuthGuard` + `RolesGuard` (the guard-ordering bug is documented and fixed).
- ✅ Swagger UI is disabled when `NODE_ENV=production`.
- ❌ `HttpExceptionFilter` returns `exception.message` for unhandled `Error`s, leaking
  internal details in 500 responses. Return a generic message when
  `NODE_ENV=production`.
- ⚠️ Access and refresh tokens live in `localStorage`, which is XSS-exposed.
  `docs/SECURITY.md` claims an httpOnly refresh cookie and token rotation; the code
  sends the refresh token in the request body instead.
- ⚠️ CSP in `nginx/nginx.conf` allows `'unsafe-inline'` and `'unsafe-eval'`.
- ⚠️ `docs/SECURITY.md` marks CERT-In, GIGW, and WCAG as "✅ Implemented/Compliant"
  without an audit trail in the repo. Treat these as claims until a CERT-In/STQC
  assessment exists.

### Performance
- ❌ No load test, Lighthouse run, or Core Web Vitals evidence.
- ⚠️ `Doctor` imagery uses a raw `<img>` (`src/components/Doctors.tsx:171`) rather
  than `next/image`; no responsive sizes or lazy loading there.
- ⚠️ `next.config.js` only allows `localhost` as an image domain.
- ✅ No obvious N+1 pattern in the reviewed list services; queries use explicit
  joins/projections and pagination.
- ⚠️ Database indexes were not audited against real query plans.

### Accessibility
- ✅ Skip link, semantic nav landmarks, `aria-label`s on key controls, `role="status"` /
  `role="alert"` on blood-bank async states, labelled form controls.
- ⚠️ No axe-core or Lighthouse CI in the repo; the WCAG 2.2 AA claim in
  `docs/ACCESSIBILITY.md` has no automated evidence.
- ⚠️ Contrast, focus management in modals, and screen-reader flows were not manually
  exercised in this assessment.

### Infrastructure
- ✅ Health probes exist and are public: `/api/v1/health`, `/api/v1/health/ready`,
  `/api/v1/health/live`; the first two probe both ORMs and return 503 when either is down.
- ✅ Non-root users in both Dockerfiles; `HEALTHCHECK` present; `npm ci` from the
  workspace root.
- ✅ Committed Drizzle migrations (2 SQL files) plus a re-runnable `db:migrate`.
- ✅ `docker-compose.yml` includes PostgreSQL tuning for the two connection pools
  (20 + 20 against `max_connections=200`).
- ❌ No CI/CD pipeline (`.github/workflows/` does not exist). Nothing blocks a merge
  that fails tests, build, schema check, or audit.
- ❌ `k8s/`, `infra/terraform/`, `nginx/ssl/`, and `nginx/conf.d/` are referenced by
  `docs/DEPLOYMENT.md` but absent. The production path in the docs cannot be executed
  as written.
- ⚠️ The `nginx` compose profile will fail without the missing TLS certificates and
  `conf.d` directory.
- ⚠️ DNS, TLS issuance, WAF, and MeghRaj provisioning are operator-owned and unverified.

### Observability
- ✅ Structured request logging via `LoggingInterceptor`; 5xx errors are logged with stacks.
- ❌ No error tracking / APM (no Sentry, OpenTelemetry, or equivalent).
- ❌ No `/metrics` endpoint or Prometheus integration, despite `docs/DEPLOYMENT.md`
  referencing a `k8s/production/prometheus-alerts.yaml` that does not exist.
- ❌ No frontend error boundary (`app/error.tsx` / `global-error.tsx` absent) and no
  client-side error reporting.
- ⚠️ `pino` is a backend dependency but is never imported; `LOG_LEVEL` is validated but
  unused. Logging is Nest's default text logger, not JSON.
- ❌ No alert definitions or runbook-backed dashboards committed.

### Documentation
- ✅ README, RUNBOOK, ARCHITECTURE, API, SECURITY, DEPLOYMENT, ACCESSIBILITY, and an ADR exist.
- ⚠️ `docs/DEPLOYMENT.md` health-check examples and Kubernetes probes use
  `/health/live` and `/health/ready`; the real backend paths are
  `/api/v1/health/live` and `/api/v1/health/ready`. Through the ingress, `/health/*`
  routes to the frontend, not the backend.
- ⚠️ `docs/DEPLOYMENT.md` verification curls `/api/docs` in production, but Swagger is
  intentionally disabled when `NODE_ENV=production`.
- ❌ `docs/DEPLOYMENT.md` instructs `npm run db:seed` in production. The seed creates
  accounts with published demo passwords (`Admin@123`, `Staff@123`, `Demo@123`).
  **Do not run this against production.**
- ⚠️ No changelog or release-notes convention.

### Feature flags
- ❌ `apps/frontend/.env.example` declares `NEXT_PUBLIC_ENABLE_APPOINTMENTS`,
  `NEXT_PUBLIC_ENABLE_GRIEVANCES`, `NEXT_PUBLIC_ENABLE_BLOOD_BANK`, and
  `NEXT_PUBLIC_ENABLE_NOTICES`, but no code reads them. There is no kill switch and
  no staged-rollout mechanism.

---

## P0 — must close before public production

1. **Clear the dependency audit.** Minimum: upgrade `next` to 14.2.35. Then plan the
   major upgrades (`drizzle-orm` 0.45.x, `zod` 4.x, `bcrypt` 6.x) with regression
   tests, and either move to Nest 12 or document a compensating control for the
   `body-parser`/`multer` advisories. Re-run `npm audit --omit=dev` and require zero
   critical/high findings.
2. **Remove `db:seed` from the production procedure.** Replace it with a one-off
   first-admin bootstrap that takes credentials from the environment. Add a guard so
   `seed.ts` refuses to run when `NODE_ENV=production` unless an explicit override is set.
3. **Add CI** (GitHub Actions): `npm ci` → `schema:check` → `build` → `test` →
   `npm audit --omit=dev --audit-level=high` → frontend type-check. Make it required
   for merges to the release branch.
4. **Stop leaking 500 details.** In `HttpExceptionFilter`, map non-`HttpException`
   errors to `"Internal server error"` in production (keep the stack in logs).
5. **Make the deployment path real.** Either commit the `k8s/`, `infra/terraform/`,
   `nginx/ssl/`, and `nginx/conf.d/` artefacts or rewrite `docs/DEPLOYMENT.md` as a
   template that explicitly says those files must be supplied per environment.
6. **Add production error visibility.** At minimum: a frontend `app/error.tsx` and
   `global-error.tsx`; server + client error reporting to an approved service; alerting
   on 5xx rate, p95 latency, pod restarts, DB pool saturation, and certificate expiry.

## P1 — close before or during the canary

- Add e2e tests for the five citizen journeys and run them against staging.
- Fix the Jest open-handle warning (`jest --detectOpenHandles`).
- Move refresh tokens to an httpOnly, secure, same-site cookie (or amend SECURITY.md
  to match the implemented design) and add revocation.
- Wire the `NEXT_PUBLIC_ENABLE_*` flags to real checks, or delete them. Every flag
  needs an owner and an expiry date.
- Correct the health paths and the `/api/docs` assertion in DEPLOYMENT.md.
- Use `pino` (or remove it) and drive log level from `LOG_LEVEL`.
- Add axe-core/Lighthouse CI; convert the Doctors `<img>` to `next/image`.
- Tighten CSP (nonces or hashes; drop `unsafe-eval`).
- Verify backup restore into staging on a schedule and keep the evidence.

## P2 — after launch

- Changelog / release-notes habit.
- Load test at expected peak (appointment slot contention, grievance spikes).
- Index review against `EXPLAIN ANALYZE` for the busiest list endpoints.
- Remove the obsolete `version:` key from `docker-compose.yml`.

---

## Staged rollout plan

There is no feature-flag service in the codebase, so use infrastructure-level
canarying first; add per-feature flags before the next release.

1. **Staging** — deploy the exact image tag; run `db:migrate`, `schema:check`, the
   e2e suite, and a manual smoke test of login → book → view → submit grievance.
2. **Production, dark** — deploy with the new backend/frontend image but keep the
   public ingress pointed at the previous version. Confirm `/health/live` and
   `/health/ready` return 200 for the new pods.
3. **Internal users** — route staff traffic (or 1 of N backend replicas) to the new
   version for 24 hours.
4. **Canary 5%** — shift 5% of traffic at the ingress; monitor for 24–48 hours.
5. **25% → 50% → 100%** — advance only when every threshold below is green.
6. **Full rollout** — monitor one week, then clean up flags/dead paths.

### Advance / hold / roll back thresholds

| Metric | Advance | Hold and investigate | Roll back |
|---|---|---|---|
| Error rate | within 10% of baseline | 10–100% above baseline | >2× baseline |
| P95 latency | within 20% of baseline | 20–50% above baseline | >50% above baseline |
| Client JS errors | no new error types | new errors <0.1% of sessions | new errors >0.1% of sessions |
| Business metrics | neutral or positive | decline <5% | decline >5% |
| Error budget burn | normal | faster than baseline | budget exhausted |

Roll back immediately on data-integrity issues, a security finding, or a spike in
user-reported failures.

---

## Rollback plan

### Trigger conditions
- 5xx rate >2× baseline for 10 minutes.
- P95 latency >50% above baseline for 10 minutes.
- Any data-corruption signal (duplicate appointments, negative blood stock, missing audit rows).
- A newly disclosed critical vulnerability in a deployed dependency.

### Application
```bash
# Kubernetes
kubectl rollout undo deployment/backend -n production
kubectl rollout undo deployment/frontend -n production
kubectl rollout status deployment/backend -n production

# Compose / VM: redeploy the previous immutable image tag
docker compose -f docker-compose.yml up -d --no-deps backend frontend
```
Target: under 5 minutes.

### Database
- Drizzle migrations are **forward-only** (no down migrations committed). Prefer
  restore-from-backup or point-in-time recovery over ad-hoc SQL.
- MikroORM reconciliation uses `updateSchema({ safe: true })` and is additive only;
  it does not drop columns.
- Before a release, take a verified snapshot and record the restore command and the
  measured restore time.
```bash
kubectl scale deployment/backend --replicas=0 -n production
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" /path/to/backup.dump
kubectl scale deployment/backend --replicas=5 -n production
```
Target: under 15 minutes, exercised at least once in staging.

### Communication
Notify the on-call engineer, the DevOps lead, and the Project Director; record the
trigger, the rollback timestamp, and the verification result in the incident log.

---

## Post-launch verification (first hour)

```bash
# 1. Health (correct paths — note the /api/v1 prefix)
curl -fsS https://dhararia.bihar.gov.in/api/v1/health/live
curl -fsS https://dhararia.bihar.gov.in/api/v1/health/ready

# 2. Public read path
curl -fsS "https://dhararia.bihar.gov.in/api/v1/notices?page=1&limit=5"

# 3. Error monitoring: confirm no new error types and no 5xx spike
# 4. Latency dashboard: p50/p95/p99 within the rollout thresholds
# 5. Manual critical flow: login → book appointment → view blood bank →
#    submit grievance → read notice
# 6. Logs: confirm request logs are flowing and readable
# 7. Rollback: confirm the previous image tag is still available in the registry
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

Suggested starting SLOs for this service: 99.5% monthly availability for the public
read paths, 99.0% for appointment booking, and p95 API latency under 500 ms.

---

## Sign-off

| Role | Name | Date | Decision |
|------|------|------|----------|
| DevOps Lead | | | |
| Security Officer | | | |
| Project Director | | | |

A launch is approved only when every P0 item is closed, the staging smoke test and
rollback drill have passed, and the sign-off row above is complete.
