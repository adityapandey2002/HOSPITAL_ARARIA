# DH Araria Hospital Portal - Deployment Guide (Vercel + Supabase)

## Overview

The portal runs as two Vercel projects over one Supabase PostgreSQL database:

| Component | Host | Root directory | Region |
|-----------|------|----------------|--------|
| Frontend (Next.js) | Vercel project | `apps/frontend` | `bom1` |
| API (NestJS in a Node function) | Vercel project | `apps/backend` | `bom1` |
| PostgreSQL | Supabase | — | the project's region |

The backend keeps two entry points over one shared bootstrap:

```
apps/backend/src/bootstrap.ts   createApp() — middleware, prefix, versioning,
                                pipes, filters, Swagger, trust-proxy
        ├── src/main.ts         long-lived server: createApp() + listen(PORT)
        └── api/index.js        Vercel function: createApp({ init: true }),
                                hands the Express instance to the Node runtime
```

`api/index.js` is plain CommonJS and loads the **compiled** `dist/bootstrap`.
It must never import from `src/`: Vercel transpiles TypeScript functions without
`emitDecoratorMetadata`, which breaks Nest's dependency injection. `nest build`,
run by the project's build command, emits the decorator metadata first.

> The Kubernetes and Terraform artefacts that earlier drafts of this document
> described were never committed. A legacy `nginx/nginx.conf` and the `nginx`
> service in `docker-compose.yml` remain for the old container stack, but the
> Vercel deployment does not use them. `nginx/ssl/` and `nginx/conf.d/` are
> absent, so that compose profile is not runnable as committed.

## Prerequisites

- Node.js 20 and npm 10 on the operator machine.
- A Vercel account with permission to create projects in the hospital's team.
- A Supabase account with permission to create a project.
- The repository checked out, with `npm ci` already run (the migration and
  bootstrap scripts run through `ts-node`).
- Optional: `psql`, for the verification query in step 3.

---

## 1. Create the Supabase project

1. Create the project in the Supabase dashboard. Pick the region your
   data-residency policy requires; the Vercel functions run in `bom1`, so a
   nearby region keeps query latency down.
2. Store the database password in the hospital password manager. It is not
   recoverable from the dashboard.
3. Open **Project Settings → Database → Connection string** and copy **both**
   URIs. They are different endpoints onto the same database:

| Variable | Supabase endpoint | Port | Used by |
|----------|-------------------|------|---------|
| `DATABASE_URL` | Transaction pooler | 6543 | The application: Drizzle and MikroORM, in every function instance |
| `DATABASE_MIGRATION_URL` | Direct connection | 5432 | `drizzle-kit` and `npm run db:migrate` only |

Why the split: DDL through a transaction pooler is not supported, and a
migration that leaks session state can corrupt the schema mid-run. The
application, by contrast, wants many short-lived pooled connections.
`resolveMigrationConnection()` in `apps/backend/src/config/database-url.ts`
reads `DATABASE_MIGRATION_URL` and falls back to `DATABASE_URL`, so local
development needs only one variable.

TLS is automatic: `database-url.ts` enables TLS for any host that is not
`localhost`/`127.0.0.1`/`::1`, and honours `sslmode` in the URL.

> Direct-connection reachability (IPv4 versus IPv6, and any paid add-on it
> requires on your plan) is plan-specific. Confirm it in the Supabase dashboard
> before you rely on `DATABASE_MIGRATION_URL` from the operator machine.

Do not run application traffic through the direct connection: every Vercel
instance would hold its own session.

---

## 2. Create the backend Vercel project

1. **Add New → Project**, import this repository, and set **Root Directory** to
   `apps/backend`.

   > **Do not accept Vercel's "Services" import.** Because the repository is a
   > monorepo, the import screen offers to group `apps/backend` and
   > `apps/frontend` into one project with a `services` block in a root
   > `vercel.json`. That path rebuilds the backend as a **container** from
   > `apps/backend/Dockerfile` — a different, beta deployment model with
   > different limits — and abandons the function, region pinning and instant
   > rollback this runbook is written against. Set the Root Directory first; the
   > multi-application banner disappears and the normal single-app import
   > remains. The frontend gets its own project in step 5.
   >
   > Turn on **"Include files outside of the Root Directory in the Build Step"**
   > as well: every command here starts with `cd ../..` to reach the workspace
   > root, and without the toggle that directory does not exist during the build.

2. Leave the framework preset at its auto-detected value. The build is driven by
   `apps/backend/vercel.json`, which sets:

   ```json
   "installCommand": "cd ../.. && npm ci --include=dev",
   "buildCommand": "cd ../.. && npm run build --workspace=packages/shared && npm run build:backend",
   "regions": ["bom1"]
   ```

   The install runs at the repo root because this is an npm workspace; the
   build compiles `packages/shared` first (the backend imports its types) and
   then runs `nest build`, which emits `dist/bootstrap.js`.

   `--include=dev` is required, not decorative. `NODE_ENV=production` (below) is
   in the install environment, and npm treats that as `omit=dev`: a plain
   `npm ci` installs production dependencies only — about 325 of the lockfile's
   1,259 packages — and drops `typescript` and `@nestjs/cli`. The build then
   dies with `sh: line 1: tsc: command not found` (exit 127) inside
   `packages/shared`, which looks like a broken install but is a deliberately
   trimmed one.

   **Set the Application Preset to `Other`, not the auto-detected `Container`.**
   Vercel sees `apps/backend/Dockerfile` and offers container mode, which builds
   that file with `apps/backend` as the build context — while the Dockerfile
   starts with `COPY package.json package-lock.json .npmrc ./`, files that only
   exist at the repository root. The build fails at the first `COPY`. Container
   mode also ignores the `functions` and `regions` keys below.

   `apps/backend/public/` is committed empty on purpose: with the `Other` preset
   Vercel looks for an output directory named `public` and fails the build when
   it is missing. Nothing is served from it — the rewrite below sends every path
   to the function.
3. The only route is the function `api/index.js`. Every path is rewritten to it:

   ```json
   "rewrites": [{ "source": "/(.*)", "destination": "/api/index" }]
   ```

   The function builds the Nest container once per warm instance
   (`createApp({ init: true })`) and reuses it; a failed bootstrap is not cached,
   so the next request retries instead of failing for the instance's lifetime.
4. The committed `vercel.json` asks for 1024 MB of memory and a 30 s maximum
   duration, keyed to the function entry point `api/index.js`. Confirm in the
   Vercel dashboard that the deployed function shows those limits; the dashboard
   is authoritative if the two ever disagree.
5. Add the environment variables from the table below, for **Production** (and
   **Preview** if you use preview deployments).
6. Deploy. The first deployment will build and boot, but `/api/v1/health` returns
   503 until the schema exists — that is expected before step 3.

### Backend environment variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `NODE_ENV` | yes | `development` | Set to `production`. Disables Swagger UI and redacts 5xx bodies. Also makes npm skip devDependencies, hence `--include=dev` in the install command. |
| `DATABASE_URL` | yes | — | Supabase transaction pooler (port 6543). Read by both ORMs. |
| `FRONTEND_URL` | yes | `http://localhost:3000` | Comma-separated origin allowlist; see step 6. |
| `JWT_SECRET` | yes | — | At least 32 characters. The `.env.example` placeholder is rejected when `NODE_ENV=production`. |
| `DRIZZLE_POOL_SIZE` | no | `1` on Vercel, `20` elsewhere | Recommended: pin `1` so a dashboard change cannot widen it. See the note below. |
| `MIKRO_POOL_SIZE` | no | `1` on Vercel, `20` elsewhere | Recommended: pin `1`. See the note below. |
| `MIKRO_POOL_MIN` | no | `0` | Keep at `0`; an eager minimum holds connections open on idle instances. |
| `JWT_ACCESS_EXPIRY` | no | `15m` | |
| `JWT_REFRESH_EXPIRY` | no | `7d` | |
| `LOG_LEVEL` | no | `info` | |
| `RATE_LIMIT_TTL` | no | `60000` | Global throttle window (ms). |
| `RATE_LIMIT_LIMIT` | no | `100` | Global requests per window. |
| `RATE_LIMIT_AUTH_LIMIT` | no | `10` | Auth requests per window. |
| `DATABASE_MIGRATION_URL` | no | falls back to `DATABASE_URL` | **Do not set it on Vercel.** It belongs on the operator machine only. |
| `ALLOW_DESTRUCTIVE_SCHEMA` | no | `false` | Never set it anywhere. It drops the MikroORM-owned tables, `audit_logs` included. |

The optional integration variables (`ABDM_*`, `BHASHINI_*`, `EPRAAMAN_*`,
`CPGRAMS_*`, `ERAKTKOSH_*`, `SMTP_*`, `REDIS_*`) are validated by
`apps/backend/src/config/validation.ts` and default to empty. None is needed to
serve the portal.

> **Pool sizing.** Both ORMs resolve their ceiling through
> `defaultPoolSize()` in `src/config/database-url.ts`: 1 connection when
> `VERCEL`/`AWS_LAMBDA_FUNCTION_NAME`/`FUNCTION_NAME` is set, 20 otherwise.
> Setting `DRIZZLE_POOL_SIZE=1` and `MIKRO_POOL_SIZE=1` explicitly is still
> recommended, so the value is visible in the dashboard and cannot be widened by
> accident. One connection per pool per warm instance is the safe starting
> point; raise it only after checking Supabase's connection limit.

---

## 3. Apply migrations from an operator machine

Migrations are not run by the Vercel build. They run once, from a machine that
can reach the database, before the first request is served.

1. Put the **direct** connection string in `apps/backend/.env`:

   ```env
   # Both variables point at the direct connection for this operator session.
   DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
   DATABASE_MIGRATION_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
   ```

   `DATABASE_URL` is overridden deliberately: `db:migrate` applies Drizzle
   migrations through `DATABASE_MIGRATION_URL`, but the MikroORM reconciliation
   in the same script builds its config from `DATABASE_URL`. Leaving the pooler
   URL there would send DDL through the transaction pooler.

2. Run the migration from the repository root:

   ```bash
   npm run db:migrate
   ```

   This applies `apps/backend/drizzle/0000`–`0003` (0002 creates `feedback` and
   `feedback_viewers`, 0003 adds the rating CHECK constraints), then reconciles
   the five MikroORM entities with `updateSchema({ safe: true, dropTables: false })`.
   A repeated run is a no-op.

3. Verify the ownership boundary offline:

   ```bash
   npm run schema:check
   ```

   It exits non-zero unless Drizzle owns 11 tables, MikroORM owns 5, no table is
   claimed twice, and no Drizzle migration touches a MikroORM table.

4. Optional, before restoring `DATABASE_URL`: confirm the tables exist.

   ```bash
   psql "$DATABASE_MIGRATION_URL" -c '\dt'
   ```

   Expect 16 tables: the 11 Drizzle-owned application tables and the 5
   MikroORM-owned clinical/audit tables.

A fresh database also has **no departments**, and `db:seed` is not allowed to fix
that in production. The public directory, the doctor form and the public feedback
form all need at least one, so `/feedback` would otherwise have an empty
dropdown and reject every submission:

```bash
npm run bootstrap:departments
```

It inserts the 15 standard district-hospital departments defined in
`apps/backend/scripts/data/departments.ts`, keyed on `name`. It never updates or
deletes a row, so re-running it is a no-op and any edit made later in the portal
survives. Check the names against the hospital's own signage and amend that file
before the first public link is shared.

Never run `db:seed` against this database: it inserts the demo accounts whose
passwords are published in this repository. The script refuses to run when
`NODE_ENV=production` unless `ALLOW_PROD_SEED=true`, but the guard is not a
reason to try.

---

## 4. Create the first Hospital Manager account

`db:seed` is for local development only. Production starts with exactly one
account, created by the operator:

```bash
ADMIN_EMAIL=hm@dhararia.bihar.gov.in \
ADMIN_PASSWORD='<at least 12 characters, not a published demo password>' \
ADMIN_NAME='Hospital Manager' \
npm run bootstrap:admin
```

On PowerShell:

```powershell
$env:ADMIN_EMAIL="hm@dhararia.bihar.gov.in"
$env:ADMIN_PASSWORD="<at least 12 characters>"
$env:ADMIN_NAME="Hospital Manager"
npm run bootstrap:admin
```

The script (`apps/backend/scripts/bootstrap-admin.ts`):

- creates one `ADMIN` account and nothing else;
- refuses a password shorter than 12 characters or one of the demo passwords
  published in this repository;
- is idempotent — re-running with the same e-mail reports the existing account
  and changes nothing;
- refuses to promote an existing non-admin account with that e-mail.

It connects through `DATABASE_URL`, so it runs inside the operator session set
up in step 3 (direct connection) and needs no Vercel access. Store the password
in the hospital password manager; it is not recoverable.

### Rotating the Hospital Manager password

There is no self-service reset in production: `forgot-password` only returns the
token in the response body when `NODE_ENV=development`, because no mail transport
is configured. The operator path is the same script with an explicit flag:

```bash
ADMIN_EMAIL=hm@dhararia.bihar.gov.in \
ADMIN_PASSWORD='<the new password>' \
ADMIN_RESET_PASSWORD=true \
npm run bootstrap:admin
```

Without `ADMIN_RESET_PASSWORD=true` the script never touches an existing
account. Rotation also refuses a non-admin account with that e-mail. Use it after
anyone who has seen the password leaves the project, and before go-live if the
password was ever shared over chat or e-mail.

The `ADMIN` role is what the documentation calls HM. That account sees every
department in the feedback inbox and is the only role allowed to manage
`feedback_viewers` grants.

---

## 5. Create the frontend Vercel project

1. **Add New → Project**, import the same repository, and set **Root Directory**
   to `apps/frontend`.
2. Framework preset: **Next.js**. `apps/frontend/vercel.json` supplies the rest:

   ```json
   {
     "framework": "nextjs",
     "installCommand": "cd ../.. && npm ci",
     "buildCommand": "cd ../.. && npm run build:packages && npm run build:frontend",
     "regions": ["bom1"]
   }
   ```

   The build command is not optional: `@dh-araria/shared` and `@dh-araria/ui`
   resolve through `dist/`, which is gitignored, so a bare `next build` fails
   with "module not found" on the first deploy. Building the two workspace
   packages first is exactly what `npm run build` does locally.

3. Set the environment variables. Both are compiled into the client bundle, so
   they must be correct **before** the build:

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `NEXT_PUBLIC_API_URL` | yes | `https://dh-araria-api.vercel.app/api/v1` | The backend project's origin **plus `/api/v1`**. Without the suffix every request 404s. |
| `NEXT_PUBLIC_APP_URL` | yes | `https://feedback.dhararia.bihar.gov.in` | The frontend's public origin. Used for `metadataBase` and as the fallback origin when composing copyable per-department links. |

4. Deploy.

`NEXT_PUBLIC_*` values are inlined at build time. Changing one in the dashboard
does nothing until the project is redeployed.

---

## 6. Set `FRONTEND_URL` and redeploy the backend

The backend's CORS allowlist comes from `FRONTEND_URL`. It accepts one origin or
a comma-separated list, so the production domain and a Vercel preview URL can
both be allowed:

```env
FRONTEND_URL=https://feedback.dhararia.bihar.gov.in,https://dh-araria-frontend-git-main-hospital.vercel.app
```

`bootstrap.ts` splits the value and passes the list to `enableCors` with
`credentials: true`; `validation.ts` validates each entry as an `http(s)` origin.
An origin that is not on the list is rejected by the browser with a CORS error,
not by the API with a 403.

After changing `FRONTEND_URL`, **redeploy the backend** — environment changes
apply to new deployments, not to already-running instances.

### Proxy trust

`bootstrap.ts` sets `trust proxy` to `1` only when `isServerlessRuntime()` is
true. Vercel's edge is exactly one hop, so Express then reports the citizen's
address in `req.ip`. Without it every visitor shares the proxy's address and the
public 5-requests-per-minute feedback throttle becomes one global bucket.

---

## 7. Smoke tests

Replace the hostnames with the ones Vercel assigned.

```bash
# 1. Liveness — no database access, must always answer once the function boots
curl -fsS https://dh-araria-api.vercel.app/api/v1/health/live

# 2. Readiness — probes Drizzle and MikroORM; exits non-zero on 503
curl -fsS https://dh-araria-api.vercel.app/api/v1/health

# 3. Public read path (no token)
curl -fsS "https://dh-araria-api.vercel.app/api/v1/departments"
curl -fsS "https://dh-araria-api.vercel.app/api/v1/notices/published?page=1&limit=5"

# 4. Feedback is public to write, authenticated to read
curl -s -o /dev/null -w '%{http_code}\n' \
  https://dh-araria-api.vercel.app/api/v1/feedback          # expect 401

# 5. The inbox page loads (redirects to /login when signed out)
curl -fsS https://feedback.dhararia.bihar.gov.in/feedback/inbox
```

Then, in a browser:

1. Open `/feedback`, submit a rating, and confirm success.
2. Sign in as the bootstrap admin and confirm the row appears at
   `/feedback/inbox`.
3. Move it `NEW → ACKNOWLEDGED → RESOLVED`.
4. Open `/feedback/<departmentId>` for one department from the **Public feedback
   links** panel and confirm the department is preselected.

---

## 8. Rollback

### Application

Vercel keeps every deployment. In the project, open **Deployments**, pick the
last known-good one, and use **Instant Rollback** (or **Promote to Production**).
The switch is immediate and does not rebuild.

- Roll back the frontend and the backend independently; they share only the API
  contract at `/api/v1`.
- A rollback restores code, not configuration. If the incident was caused by an
  environment-variable change, fix the variable and redeploy — rolling back to an
  older deployment re-applies that older deployment's variables.
- Rolling back the backend past a migration is only safe while the previous
  version still matches the schema. Drizzle migrations in this repository are
  forward-only: there are no down migrations to run.

### Database

A database rollback is a **Supabase restore**, never a destructive
`db:migrate`:

1. Stop writes by rolling the backend back to a version that cannot write the
   affected tables, or by pausing the project in the Supabase dashboard.
2. Restore from the Supabase backup or point-in-time recovery to a timestamp
   before the bad change.
3. Redeploy the matching application version and re-run the smoke tests.

Do not "fix" a bad migration by setting `ALLOW_DESTRUCTIVE_SCHEMA=true`. That
flag makes `db:migrate` drop `audit_logs`, `care_contexts`, `consent_artefacts`,
`fhir_bundles` and `abha_profiles` before recreating them — it destroys CERT-In
audit history and ABDM records.

Record the restore timestamp and the measured restore time in the incident log.

---

## Local development

Local development keeps one PostgreSQL instance and one `.env` per app.

> **Never keep a `.env` at the repository root.** `ConfigModule` resolves its
> `envFilePath` (`['.env.local', '.env']`) against the **working directory**, and
> `@nestjs/config` lets those values overwrite ones already in the environment,
> including an explicitly supplied `DATABASE_URL`. A root `.env` left over from
> an earlier database therefore wins over `apps/backend/.env` for any command
> run from the repository root, and the failure looks like a wrong database
> rather than a stray file. `npm run dev` is unaffected because npm sets the
> working directory to `apps/backend`; ad-hoc `node dist/main.js` from the root
> is not.

```bash
# 1. Install once, at the repository root
npm ci

# 2. Environment
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# 3. Point apps/backend/.env at a local database
#    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dh_araria
#    DATABASE_MIGRATION_URL stays unset and falls back to DATABASE_URL.

# 4. Schema and demo data
npm run db:migrate
npm run db:seed        # demo accounts only; never against production

# 5. Both dev servers
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/api/docs (disabled when `NODE_ENV=production`)
- Health: http://localhost:3001/api/v1/health/live

`npm run db:generate` regenerates SQL from `src/common/drizzle/schema.ts`; it
does not need a database. Commit the generated file. `db:push` is a development
shortcut only — production schema changes must ship as a committed migration.

For a local non-demo admin, the same bootstrap applies:

```bash
ADMIN_EMAIL=hm@example.test ADMIN_PASSWORD='a-unique-12-char-password' npm run bootstrap:admin
```

---

## Troubleshooting

| Symptom | Likely cause | Resolution |
|---------|--------------|------------|
| 503 from `/api/v1/health`, logs show `too many clients already` or `remaining connection slots are reserved` | Pool exhaustion. The default is 1 per ORM on Vercel, so this usually means the variables were set too high in the dashboard, or many instances are cold at once. | Confirm `DRIZZLE_POOL_SIZE=1` and `MIKRO_POOL_SIZE=1` in the backend project, then check the pooler's client limit in the Supabase dashboard. |
| `db:migrate` fails with `DATABASE_URL is not a valid PostgreSQL connection string`, but the value in `.env` looks correct | A variable exported earlier in the same shell session is overriding the file — `dotenv` never overrides an existing environment variable. The error names whichever variable actually failed (`DATABASE_URL` or `DATABASE_MIGRATION_URL`). | Run `Remove-Item Env:DATABASE_URL, Env:DATABASE_MIGRATION_URL` in PowerShell (`unset` in bash), or open a fresh terminal, then retry. |
| The same error appears after pasting a connection string | A wrapping quote, or a leftover placeholder such as `<password>` or `YOUR_PROJECT_REF`. | Quotes and surrounding whitespace are stripped automatically; placeholders are rejected with a message naming the field. Paste the raw URI from Supabase → Project Settings → Database → Connection string, with no quotes. |
| `db:migrate` fails with a DDL or prepared-statement error | `DATABASE_MIGRATION_URL` is the transaction pooler (port 6543), or `DATABASE_URL` is. | Run migrations with both variables on the direct connection (port 5432), as in step 3. |
| `db:migrate` connects but MikroORM reconciliation fails | The operator session is pointed at the pooler, or the database role lacks DDL rights on the MikroORM tables. | `db:migrate` reconciles MikroORM through `DATABASE_MIGRATION_URL`; confirm that variable, not just `DATABASE_URL`, is the direct connection. |
| Every path returns 500 — including `/favicon.ico` and `/` — and the function log shows `MetadataError: No entities were discovered` | MikroORM entities were registered as file globs (`dist/**/*.entity.js`). A glob is invisible to Vercel's static file tracer and resolves against the working directory, so the entity files can be missing or unmatched at cold start. | Already fixed: `mikro.config.ts` imports and registers the five entity classes. If it reappears, look for a glob reintroduced into `entities`. |
| `/favicon.ico` returns 404 on the backend URL | Correct behaviour — the backend is an API, not a website. Browsers request a favicon from every origin they visit. | None. The favicon belongs to the frontend project. |
| Backend build fails with `sh: line 1: tsc: command not found` (exit 127), right after `added 3xx packages` | `NODE_ENV=production` is in the install environment, so npm set `omit=dev` and skipped `typescript` and `@nestjs/cli`. The package count is the tell: a full install is ~1,250 packages. | Ensure `installCommand` is `cd ../.. && npm ci --include=dev` (committed in `apps/backend/vercel.json`), then redeploy. |
| Frontend build fails with `Module not found: Can't resolve '@dh-araria/shared'` (or `@dh-araria/ui`) | `next build` ran without the workspace packages. Both publish only `dist/`, which is gitignored, so a fresh clone has no module to resolve. | Keep `buildCommand` in `apps/frontend/vercel.json`: `cd ../.. && npm run build:packages && npm run build:frontend`. |
| The import screen offers "Services" instead of a single app | The repository is a monorepo, so Vercel proposes grouping both apps into one project. | Set **Root Directory** to `apps/backend` (or `apps/frontend`) before importing. Do not accept the services grouping — see step 2. |
| Frontend requests go to `http://localhost:3001` in production, or 404 on every call | `NEXT_PUBLIC_API_URL` was missing or wrong at build time. | Set it to `https://<backend-origin>/api/v1`, then **redeploy** the frontend. |
| Browser console shows a CORS error | The calling origin is not in `FRONTEND_URL`. Origins are compared byte-for-byte with the browser's `Origin` header, which has no trailing slash and no path. | Add `scheme://host[:port]`, comma-separated, then redeploy. Trailing slashes, paths, whitespace, duplicates and letter case are normalised automatically since `resolveFrontendOrigins` was introduced, so a pasted address-bar URL is safe. |
| Function times out at 30 s, usually on the first request after idle | Cold start: container creation plus `createApp()` plus the first database connection. | Expected on a cold instance. If it persists, check database latency, and confirm in the dashboard that the function still has 1024 MB / 30 s. |
| All citizens share one rate-limit bucket | `trust proxy` is not applied because the runtime marker is absent. | Confirm the deployment is on Vercel (`VERCEL` is set); `isServerlessRuntime()` keys off it. |
| `JWT_SECRET still holds the example value` at boot | The placeholder from `.env.example` was copied into production. | Generate a unique secret of at least 32 characters and redeploy. |
| `bootstrap:admin` fails with `null value in column "updatedAt"` (SQLSTATE 23502) | The database was first created with `drizzle-kit push`, which left `"updatedAt"` without a DEFAULT. Migration `0000` uses `CREATE TABLE IF NOT EXISTS`, so it was a no-op there and the hole survived. Every insert into seven tables fails the same way. | Run `npm run db:migrate`, which applies `0004_timestamp_defaults` and restores the default. Re-run `bootstrap:admin`. A fresh project created by `db:migrate` never hits this. |
| The database holds `admin@dhararia.gov.in` and other published demo accounts | `db:seed` ran against it. Products of `db:seed` must never reach production. | Do not promote that database. Create a fresh Supabase project, `npm run db:migrate`, then `npm run bootstrap:admin`. |
| 502 from the function with no Nest log line | The function failed to load `dist/bootstrap`. | Check the build log: `nest build` must run before the function is packaged. An import from `src/` in `api/index.js` also breaks this. |

---

## Maintenance windows

| Activity | Frequency | Window | Duration |
|----------|-----------|--------|----------|
| Dependency updates (Dependabot PRs) | Weekly | Monday | review only |
| Supabase backup verification | Monthly | First Sunday 02:00–04:00 IST | 1 hour |
| Restore drill | Quarterly | Scheduled | 2 hours |
| JWT secret rotation | Annually, or on suspicion | Scheduled | 30 minutes |

Vercel and Supabase both deploy without a maintenance window, so application
releases need none. A database restore does: announce it, pause writes, and
expect the API to return 503 while it runs.

---

## Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| DevOps Lead | devops@dhararia.gov.in | Primary |
| Database Admin | dba@dhararia.gov.in | Secondary |
| Security Officer | security@dhararia.gov.in | Tertiary |
| Project Director | director@dhararia.gov.in | Executive |

---

*Document Version: 2.0*
*Last Updated: 2026-10-24*
*Classification: Internal - Government Use*
