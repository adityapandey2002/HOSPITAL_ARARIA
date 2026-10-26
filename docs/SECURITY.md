# DH Araria Hospital Portal - Security Guide

## Overview

This document describes the security controls that exist in this repository and
the ones the operator must provide on Vercel and Supabase. It maps the
CERT-In directions, MeitY guidance and GIGW to concrete code where that mapping
exists; where a control is procedural or platform-provided, the text says so.

The deployed shape is two Vercel projects (Next.js frontend, NestJS API as a
single Node function) over one Supabase PostgreSQL database. There is no
Kubernetes cluster, no Redis, no WAF configuration and no log pipeline in this
repository. Those are either platform features or operator tasks, and the
sections below distinguish them.

## Security Framework

### Compliance Standards

| Standard | Applicability | Status |
|----------|---------------|--------|
| **CERT-In Directions 2022** | Mandatory for Indian government systems | Partial: the audit trail and retention method exist; log shipping and six-hour reporting are operator processes |
| **MeitY Open Source Policy** | Required for government software | Not assessed: licence inventory and OpenForge publication are release tasks |
| **GIGW 3.0** | Government website guidelines | Partial: accessibility work is in progress; see `docs/ARCHITECTURE.md` |
| **WCAG 2.2 AA** | Accessibility standard | Partial: component tests exist; no axe automation is wired into CI and no formal audit has been done |
| **ABDM Security** | Healthcare data protection | Partial: bundle, consent and audit logic exist behind staff auth; gateway transport and certificates are Phase 3 |
| **ISO 27001** | Information security management | Not pursued |
| **HIPAA** | US healthcare regulation | Not applicable; Indian context |

### Security Principles

1. **Defense in depth** - platform edge, application guards and query-level scope each stand alone
2. **Least privilege** - roles plus per-department grants for feedback
3. **Data minimisation** - feedback is anonymous unless the citizen supplies contact fields
4. **Audit sensitive writes** - ABDM writes commit together with their audit row
5. **Fail secure** - the production JWT secret rejects the template value, and password-reset tokens are signed with a derived, single-purpose secret
6. **Redact errors** - 5xx bodies never carry driver details or stack traces in production

## Application Security

### Authentication

#### JWT implementation

```text
Algorithm: HS256 (symmetric, `JWT_SECRET`)
Issuer:    dh-araria
Audience:  dh-araria-users
Access:    15 minutes (`JWT_ACCESS_EXPIRY`)
Refresh:   7 days (`JWT_REFRESH_EXPIRY`)

Claims:
{
  "sub":   "user-uuid",
  "email": "user@example.com",
  "role":  "PATIENT | DOCTOR | STAFF | ADMIN",
  "iss":   "dh-araria",
  "aud":   "dh-araria-users",
  "iat":   1699267200,
  "exp":   1699268100
}
```

`JWT_SECRET` must be at least 32 characters. When `NODE_ENV=production`, Joi
rejects the two placeholder values from the example environment files, so a
copied template cannot become the signing key for real accounts.

Access and refresh tokens carry the same claims and are signed with the same
secret. There is no `type` claim, so the API does not distinguish them: a
refresh token is accepted as a bearer token for its full seven-day lifetime.
The 15-minute access-token expiry is therefore not a containment boundary until
this is fixed.

#### Password security

- **Algorithm**: bcrypt with cost factor 12
- **Policy** (registration and password change): 8-50 characters, at least one
  uppercase letter, one lowercase letter, one number and one special character
  from `@$!%*?&`
- **Not implemented**: password history, account lockout after failed attempts,
  and forced rotation. The throttler limits login to 10 requests per minute per
  IP but does not lock an account.

#### Password reset

`POST /api/v1/auth/forgot-password` issues a JWT signed with
`JWT_SECRET + ":password-reset"`, valid for 15 minutes and bound to the current
password hash, so changing the password invalidates outstanding tokens. No SMTP
transport is wired up yet. The token is written to the debug log at every
`NODE_ENV`, and it is also returned in the response body when
`NODE_ENV=development`. Password-reset delivery is therefore not usable in
production until a mail provider is configured, and the log line should be
removed before one is.

#### Multi-factor authentication

Not implemented. e-Pramaan SSO, OTP, digital certificates and biometric login
are Phase 3 items with no code path today.

### Authorization

#### Role-based access control

| Role | Intended scope |
|------|----------------|
| **PATIENT** | Own appointments, profile, grievances |
| **DOCTOR** | Own schedule, assigned appointments, patient records created through ABDM |
| **STAFF** | Appointments, grievances, notices, blood bank |
| **ADMIN** | User management, configuration, all feedback departments |

`JwtStrategy` re-reads the user row on every request and rejects inactive
accounts immediately, so deactivation does not wait for token expiry.
`RolesGuard` enforces `@Roles(...)` declarations; routes without `@Roles` accept
any authenticated role, which is why resource-level checks live in services.

#### Resource-level permissions

The feedback module is the reference implementation for per-resource scope:

- `FeedbackService.accessibleDepartmentIds()` returns `null` for `ADMIN` (all
  departments) and the granted department ids for everyone else.
- `requireDepartmentAccess()` loads the row, returns 404 when it does not exist,
  and 403 when it belongs to a department the caller cannot read.
- Every read and the status update go through one of those helpers, so a new
  route cannot widen scope by omitting a decorator.

The 404/403 split lets an authenticated user distinguish "does not exist" from
"exists elsewhere". It reveals existence, not content, but it is a deliberate
trade-off worth revisiting if feedback ids become guessable in practice.

### Session management

- Access and refresh tokens are stored in `localStorage` by the frontend, not in
  an httpOnly cookie. Any XSS that survives React escaping can read them.
- There is no server-side session store, no concurrent-session limit, no idle
  timeout and no absolute timeout beyond the token expiry.
- Logout is client-side. The API has no denylist, so a copied refresh token
  remains valid until it expires.
- Tokens are sent in the `Authorization: Bearer` header; cookies are not used,
  so CSRF does not apply to the API as written.

## Data Protection

### Classification

| Level | Examples | Protection in this system |
|-------|----------|---------------------------|
| **Public** | Notices, department information, doctor profiles | Integrity only; served over HTTPS |
| **Internal** | Staff schedules, internal memos | Authentication plus TLS in transit |
| **Confidential** | Appointments, grievances, user profiles, feedback contact details | Authentication, role scope, TLS in transit, provider-managed encryption at rest |
| **Restricted** | ABDM records, consent artefacts, audit logs | MikroORM-owned tables, department/role checks, audit rows written in the same transaction |

### Encryption

#### At rest

Encryption at rest is Supabase-managed. The repository does not implement
Transparent Data Encryption, column encryption or its own key management; there
is no KMS or Vault integration. Verify the project's disk-encryption and backup
settings in the Supabase console.

#### In transit

- TLS is required for every non-local database host. `resolveDatabaseConnection()`
  enables it automatically, and `?sslmode=require` in `DATABASE_URL` forces it.
- `tlsOptions()` passes `{ rejectUnauthorized: false }`, which encrypts the
  connection but **does not verify the server certificate**. That stops passive
  interception, not an active man-in-the-middle. Treat it as a known weakness
  and tighten it once the Supabase CA is pinned in deployment.
- Browser-to-Vercel and Vercel-to-Supabase traffic is HTTPS/TLS; there is no
  plaintext listener in the deployed shape.
- Certificate pinning and mutual TLS are not implemented.

### Field-level encryption

Not active. `fhir_bundles` has `encryptedData` and `encryptionKey` columns for
the Phase 3 Fidelius flow, but nothing writes them today. The ABDM module stores
FHIR JSON in a `jsonb` column.

### Data retention

| Data type | Target | Enforced by |
|-----------|--------|-------------|
| Audit logs | 180 days | `AuditLogService.purgeOlderThan()` exists, but **nothing invokes it**; `ScheduleModule` is registered with no `@Cron` handler |
| Application logs | 180 days | Not enforced; Vercel's log retention is much shorter and no drain is configured |
| Appointments | 7 years | Policy only; no archival job |
| Grievances | 5 years | Policy only; no archival job |
| Browser error reports | Not stored | `POST /api/v1/client-errors` writes one log line and persists nothing |

The retention table describes the hospital's target policy. Only the audit
purge method exists in code, and it must be invoked by an external scheduler.

## Network Security

### Topology

```text
Citizen browser
    |
    | HTTPS
    v
Vercel edge (TLS termination, DDoS mitigation)
    |
    +--> Frontend project (Next.js: SSR and static assets)
    |
    +--> Backend project (one Node function: /api/v1/*)
             |
             | PostgreSQL over TLS
             v
         Supabase transaction pooler :6543
             |
             v
         PostgreSQL database

Operator workstation / CI
    |
    | PostgreSQL over TLS (DDL only)
    v
Supabase direct connection :5432
```

### Exposed surfaces

| Source | Destination | Port | Purpose |
|--------|-------------|------|---------|
| Internet | Vercel frontend and backend | 443 | Public site and API |
| Vercel function | Supabase pooler | 6543 | Application queries |
| Operator / CI | Supabase direct | 5432 | `db:migrate`, `db:seed`, `bootstrap:admin` |
| Vercel function | External APIs | 443 | ABDM and other Phase 3 integrations |

The database must not accept connections from the public internet beyond the
Supabase endpoints. Supabase network restrictions (IP allowlisting) are
plan-dependent; verify in the console whether they are enabled and restrict the
direct port to the operator's egress addresses.

### What does not exist

- No Kubernetes cluster, therefore no NetworkPolicy, PodSecurityPolicy or
  cluster RBAC to configure.
- No ingress controller, WAF rule set or anti-DDoS appliance in this repository.
  Vercel provides edge DDoS mitigation; a WAF, if required, must be added in
  front of the deployment.
- No Redis, queue or cache tier. The `REDIS_*` keys in configuration are unused
  and no Redis client is installed.
- No service mesh or mTLS between components; the frontend and backend are
  separate Vercel projects that talk over public HTTPS.

## Infrastructure Security

### Vercel

- Two projects from one repository: the frontend uses the Next.js preset; the
  backend builds `apps/backend` and serves every path through `api/index.js`.
- Environment variables are scoped per project and per environment (Production,
  Preview, Development). Secrets belong in the Vercel dashboard, never in
  `vercel.json` or the repository.
- Deployments are immutable: a rollback promotes a previous deployment. A
  rollback does not revert a database migration, so migrations must be
  backward compatible for one release.
- `vercel.json` pins region `bom1`. The backend requests 1024 MB and a
  30-second `maxDuration` for the `api/index.js` function; confirm the effective
  limits in the dashboard.
- Function instances are short-lived and share nothing. Do not rely on the
  filesystem for sessions or uploads; no upload endpoint exists today and
  `UPLOAD_PATH` is unused.

### Supabase

- The application connects as a PostgreSQL role with a password. It does not
  use the Supabase client SDK, so Row Level Security is not part of the trust
  boundary: authorization is enforced by the NestJS guards and services.
- Never ship the Supabase service-role key to the frontend. The frontend only
  needs `NEXT_PUBLIC_API_URL`.
- Use the transaction pooler (`:6543`) for application traffic and the direct
  connection (`:5432`) for DDL. Running migrations through the pooler fails or
  leaks session state.
- Rotate the database password if it has ever been pasted into a ticket, a
  screenshot or a chat. Rotating it requires updating both Vercel projects and
  the operator environment.

### Secrets management

| Secret | Where it lives | Rotation |
|--------|----------------|----------|
| `DATABASE_URL`, `DATABASE_MIGRATION_URL` | Backend Vercel project; operator `.env` for migrations | On suspected exposure |
| `JWT_SECRET` | Backend Vercel project | Invalidates every session; plan a maintenance window |
| `NEXT_PUBLIC_API_URL` | Frontend Vercel project | Not secret; build-time constant |
| GitHub Actions credentials | Repository secrets | Per GitHub policy |

There is no External Secrets Operator, Vault or KMS integration. Secrets are
injected as environment variables at build and runtime. `apps/backend/.env` is
gitignored; the committed `.env.example` files contain placeholders only.

### Dependency audit gate

`npm run audit:ci` runs `npm audit --omit=dev --json` and fails on:

- any **critical** production vulnerability, with no exceptions;
- any **high** vulnerability not covered by an unexpired allowlist entry;
- any malformed or **expired** allowlist entry, even if nothing is vulnerable.

The allowlist is `docs/security/audit-allowlist.json`. Every entry needs a
package name, a reason and an expiry date; the gate warns when an entry no
longer matches a finding so it can be deleted rather than left to rot.

| Package | Advisory scope | Compensating control | Expires |
|---------|----------------|----------------------|---------|
| `axios` | SSRF/proxy-credential advisories with no fixed 1.x release | The browser client only calls `NEXT_PUBLIC_API_URL`, a build-time constant; it never accepts a user-supplied URL or proxy | 2027-01-31 |
| `form-data` | Multipart parsing advisory, no fixed 4.x release | Reached only through `axios` and `supertest`; public forms submit JSON, and no multipart body is built from user-controlled field names | 2027-01-31 |
| `zod` | Oversized-collection memory DoS, fix unpublished | Frontend form validation only, with bounded string fields; the backend re-validates every request with class-validator DTOs and Joi | 2027-01-31 |
| `body-parser` | DoS via trailing bytes after a compressed body; fix (2.4.0) unpublished | Both parsers are mounted explicitly in `src/bootstrap.ts` with a 100 kB limit, bounding decompressed size per request. The only exception is `POST /api/v1/complaints`, which accepts a compressed photo and therefore gets a 2 MB limit (see `docs/adr/0004-complaint-image-storage.md`); the Vercel function is capped at 30 s and 1024 MB | 2027-01-31 |
| `express` | Flagged only because it depends on the vulnerable `body-parser` | Same 100 kB parser limit and serverless timeout; no advisory names Express itself | 2027-01-31 |
| `@nestjs/platform-express` | Aggregate finding through Express 5 / body-parser | 11.2.5 is the newest release outside the separately flagged ranges; 12.x would force TypeScript 6. Tracked through `body-parser` | 2027-01-31 |
| `multer` | Multipart DoS advisories; the fix (2.5.0) is unpublished and Nest pins 2.2.0 | No upload endpoint exists in `apps/backend/src`, so the multipart parser is never reached | 2027-01-31 |

Where a fix needs a version that the registry does not publish yet, the entry
records the control that makes the advisory unreachable rather than a promise to
upgrade. `docs/LAUNCH-READINESS.md` carries the same table with the audit counts
for the current tree.

Renewing an entry means re-justifying the compensating control and moving the
date, not deleting the reason. The gate runs in CI on every push and pull
request.

## API Security

### Rate limiting

The global throttler is 100 requests per minute per IP, configured from
`RATE_LIMIT_TTL` and `RATE_LIMIT_LIMIT`. Routes override it:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/v1/auth/register` | 5 | 1 minute |
| `POST /api/v1/auth/login` | 10 | 1 minute |
| `POST /api/v1/auth/forgot-password` | 3 | 1 hour |
| `POST /api/v1/feedback` | 5 | 1 minute |
| `POST /api/v1/contact` | 5 | 1 minute |
| `POST /api/v1/client-errors` | 20 | 1 minute |
| Everything else | 100 | 1 minute |

On Vercel, `app.set('trust proxy', 1)` makes the throttler key on the visitor
IP. Without it, every visitor would share the edge proxy's address and the
public limits would collapse into one global bucket.

### Input validation

- `ValidationPipe` is global with `whitelist: true`,
  `forbidNonWhitelisted: true` and implicit conversion. Unknown fields are
  rejected rather than ignored.
- When `NODE_ENV=production`, validation messages are suppressed so field names
  and constraints are not echoed to an attacker.
- Configuration is validated by Joi at boot; a missing `DATABASE_URL`, a short
  `JWT_SECRET` or the template secret aborts startup.
- Queries are parameterised through Drizzle and MikroORM; there is no string
  concatenation of user input into SQL.

```typescript
// Password policy, registration and change-password
@MinLength(8)
@MaxLength(50)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
  message:
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
})
password!: string;
```

### Security headers

`helmet()` is applied in `src/bootstrap.ts` with the default header set. In
production the default Content Security Policy is enabled; in development CSP is
disabled so the Next.js dev server works. `crossOriginEmbedderPolicy` is off.

```typescript
app.use(
  helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
```

There is no nginx in the deployment, so header configuration belongs in
`helmet()`, not in a server block.

### CORS

`FRONTEND_URL` is an origin allowlist. It may be a comma-separated list so the
production domain and a Vercel preview URL can coexist; credentials are allowed
and the preflight cache is 24 hours.

```typescript
app.enableCors({
  origin: resolveFrontendOrigins(configService.get<string>('frontendUrl')),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
});
```

### Error handling

`HttpExceptionFilter` catches everything. In production, any response with
status 500 or above is rewritten to `Internal server error` /
`INTERNAL_ERROR` with no `details`; the original message and stack go to the
function log. 4xx responses keep their message so form validation remains
usable.

### Feedback abuse controls

The public feedback write is the most exposed endpoint, so it has four
independent controls:

1. **Throttle** - 5 requests per minute per IP, separate from the global 100.
2. **Honeypot** - `CreateFeedbackDto` declares a hidden `website` field with
   `@IsEmpty()`. A filled value fails validation; a human never sees the field.
3. **Server-owned fields** - `id`, `status`, `createdAt` and `updatedAt` are set
   in the service. A caller cannot create pre-acknowledged feedback or forge a
   timestamp.
4. **Department check** - the target department must exist and be active, or the
   request returns 404 before any insert.

Reads require authentication and are restricted to `ADMIN` or a grant in
`feedback_viewers`. Grant creation is `ADMIN`-only and refuses `PATIENT`
accounts, because a feedback row can contain another patient's phone number or
email address.

## Vulnerability Management

### Automated

| Check | When | Gate |
|-------|------|------|
| Table-ownership check (`schema:check`) | Every push and PR | Fails on a table claimed by both ORMs |
| Type-check and builds (shared, backend, frontend) | Every push and PR | Fails the run |
| Jest suites | Every push and PR | Fails the run |
| Production dependency audit (`audit:ci`) | Every push and PR | Fails on critical/high, or an expired exception |

The CI workflow is `.github/workflows/ci.yml`. It runs offline; no database is
required.

### Manual

Penetration testing, DAST and container scanning are not configured in the
repository. When they are performed, they run against the deployed Vercel URLs
and report through the incident process below.

### Response targets

| Severity | Target |
|----------|--------|
| Critical (CVSS >= 9.0) | 24 hours |
| High (7.0-8.9) | 72 hours |
| Medium (4.0-6.9) | 7 days |
| Low (0.1-3.9) | Next maintenance window |

These are targets, not an automated SLA. The audit gate enforces the critical
and high cases at merge time.

## Incident Response

### Classification

| Level | Criteria | Response time | Team |
|-------|----------|---------------|------|
| **P1 - Critical** | Data breach, service down, active exploit | 15 minutes | Security, platform owner, management |
| **P2 - High** | Vulnerability exploited, partial outage | 1 hour | Security, platform owner |
| **P3 - Medium** | Suspicious activity, failed attacks | 4 hours | Security |
| **P4 - Low** | Policy violation, scan finding | 24 hours | Security |

### Playbooks

#### Data breach

1. **Contain** - rotate `DATABASE_URL`, `JWT_SECRET` and any exposed provider
   token; disable affected accounts.
2. **Assess** - identify the tables and rows reached, using `audit_logs` where
   the access went through ABDM and Vercel logs otherwise.
3. **Notify** - CERT-In within six hours, then affected individuals and
   management.
4. **Remediate** - patch the defect, redeploy, verify with a smoke test.
5. **Recover** - restore from a Supabase backup only if data integrity was lost.
6. **Review** - post-incident write-up and a control change.

#### Service outage

1. **Detect** - `/api/v1/health` returns 503, or Vercel reports function errors.
2. **Triage** - check Supabase status and connection counts, then the most
   recent deployment.
3. **Mitigate** - promote the previous Vercel deployment, or wait for Supabase.
4. **Communicate** - status page and stakeholders.
5. **Resolve** - permanent fix with a regression test.
6. **Review** - post-mortem and action items.

### CERT-In reporting

The six-hour notification is a manual process. Keep an incident record with the
detection time, affected systems, data categories, containment actions and the
reporter, and submit it through the CERT-In channel the hospital has registered.
The repository contains no automated submission client.

## Audit and Logging

### What is audited

`audit_logs` is a MikroORM-owned table. Rows are written by `AuditLogService`
from the ABDM module:

- `logWith(em, entry)` uses the caller's EntityManager, so the audit row commits
  or rolls back with the clinical change.
- `log(entry)` is best-effort and swallows failures; an audit outage must not
  take down the citizen-facing operation it records.

Actions currently recorded are `CARE_CONTEXT_CREATE`, `CARE_CONTEXT_COMPLETE`,
`FHIR_BUNDLE_CREATE`, `FHIR_BUNDLE_STATUS_CHANGE`, `FHIR_BUNDLE_VIEW`,
`CONSENT_ARTEFACT_CREATE`, `CONSENT_ARTEFACT_STATUS_CHANGE` and
`FHIR_RECORDS_DISCLOSED`. **Authentication events are not written to
`audit_logs`**: login success, login failure, logout, permission denials and
rate-limit hits exist as constants in `SECURITY_EVENT_ACTIONS` but no code path
emits them. They appear only in function logs, if at all.

Each row carries `action`, `resource`, `resourceId`, `userId`, `ipAddress`,
`userAgent`, `correlationId`, JSON `details` and a server-side `createdAt`.
`details` is metadata only; raw FHIR payloads and diagnoses must not be stored
there.

### Retention

`AuditLogService.purgeOlderThan(180)` deletes rows older than 180 days and
returns the count. Nothing calls it: `ScheduleModule.forRoot()` is registered in
`AppModule`, but there is no `@Cron` handler, and an in-process schedule would
not run reliably on short-lived Vercel functions anyway. Until an external
scheduler invokes it, audit rows grow without bound. The method is the only code
path that deletes audit rows.

### Application logs

- Nest's `Logger` writes to stdout; Vercel captures it per invocation. The
  format is Nest's text format, not JSON. The `pino` dependency is declared but
  not used.
- `LoggingInterceptor` records method, URL, user, IP and user agent on entry,
  then status and duration on completion.
- `HttpExceptionFilter` logs 5xx with the original error and stack.
- `POST /api/v1/client-errors` emits one `client_error` line with message,
  digest, path (query string removed), user agent, timestamp and the first ten
  stack frames.

No log drain, SIEM, WORM storage or hash-chained log integrity is configured.
Shipping logs to a 180-day retention store is an operator task.

## Secure Development

### CI gates

`.github/workflows/ci.yml` runs, in order:

1. `npm ci`
2. `npm run schema:check` - fails if the Drizzle/MikroORM boundary drifts
3. build of `packages/shared`
4. backend lint (`npm run lint --workspace=apps/backend`)
5. backend build
6. frontend lint (`npm run lint --workspace=apps/frontend`)
7. frontend build
8. `npm test`
9. `npm run audit:ci`

Next 16 no longer lints during `next build`, so the frontend lint step is the
only thing enforcing that config on a pull request.

The workflow uses placeholder `DATABASE_URL` and `JWT_SECRET` values because no
step connects to a database.

### Secure coding checklist

- [x] Input validation on all endpoints (`ValidationPipe`, class-validator)
- [x] Parameterised queries only (Drizzle and MikroORM)
- [x] Authentication on all non-public endpoints (global `JwtAuthGuard`)
- [x] Authorization checks in the service layer, not only on controllers
- [x] Secrets never committed; environment files are gitignored
- [x] 5xx responses redacted in production
- [x] Client-error reports strip query strings before logging
- [ ] Logs contain no sensitive data - review each new log statement
- [ ] Dependencies scanned and updated - covered by `audit:ci`, but exceptions
      need periodic review
- [ ] Cryptography reviewed - certificate verification is currently disabled for
      database TLS

### Code review focus

- Authentication and authorization logic, especially new feedback routes
- Input validation and mass-assignment risk (build inserts field by field)
- Secret handling and environment-variable names
- Error handling and response redaction
- Log statements that could capture PII
- Dependency changes and allowlist entries

## Third-Party Integrations

No external integration is enabled. The configuration keys exist and default to
empty strings, and `AbdmService` keeps gateway transport behind a port that has
no implementation yet.

| Integration | Planned authentication | Data shared | Status |
|-------------|------------------------|-------------|--------|
| **ABDM** | Mutual TLS plus JWT | PHI, encrypted with Fidelius | Partial: local M2/M3 storage and consent records; gateway transport not implemented |
| **e-Pramaan** | OAuth 2.0 | Minimal PII | Phase 3 |
| **Bhashini** | API key and secret | Text content | Phase 3 |
| **CPGRAMS** | API key and certificate | Grievance data | Phase 3 |
| **e-RaktKosh** | API key | Blood inventory | Phase 3 |

Before enabling any of them, add the credential to the backend Vercel project
(never to the frontend), confirm the data-sharing agreement, and add an audit
event for every call that carries PHI.

## Compliance Checklist

### CERT-In Directions 2022

- [x] Audit trail for ABDM writes, committed with the business change
- [x] Audit retention method (`purgeOlderThan(180)`)
- [ ] Audit purge scheduled - no cron job exists
- [ ] 180-day application-log retention - no log drain exists
- [ ] Six-hour incident reporting - manual process, no client in the repository
- [ ] NTP synchronisation - provided by the platform, not by the application
- [ ] Vulnerability management programme - dependency gate exists; DAST and
      penetration tests do not
- [ ] Secure configuration baselines - platform defaults only
- [ ] Authentication events in the audit trail - constants exist, emission does
      not

### GIGW 3.0

- [ ] WCAG 2.2 AA compliance - automated checks only
- [ ] Bilingual content
- [x] Feedback mechanism - public department feedback form
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Accessibility statement

### MeitY Open Source Policy

- [ ] No proprietary dependencies
- [ ] Licence compliance inventory
- [ ] OpenForge publication ready
- [ ] Community contribution guidelines

## Security Testing

### Automated (CI)

```yaml
# .github/workflows/ci.yml (abridged)
- run: npm run schema:check
- run: npm run build:backend
- run: npm run build:frontend
- run: npm test
- run: npm run audit:ci
```

### Manual

```bash
# Dependency audit outside CI
npm run audit:ci

# DAST and penetration testing are run against a deployed URL, not locally.
# Suggested coverage:
# - Authentication bypass
# - Authorization bypass (feedback department scope)
# - Injection (SQL)
# - XSS (reflected, stored, DOM)
# - CSRF (not applicable to bearer-token API as written)
# - SSRF (outbound integrations are disabled)
# - Broken access control
# - Security misconfiguration
```

## Training and Awareness

### Developer training

| Topic | Frequency | Audience |
|-------|-----------|----------|
| Secure coding practices | Quarterly | All developers |
| OWASP Top 10 | Annually | All developers |
| Threat modelling | Per project | Architects and leads |
| Incident response | Quarterly | Security team |
| New vulnerabilities | Monthly | All technical staff |

### User awareness

- Phishing simulations - quarterly
- Password hygiene - annual
- Data handling - onboarding and annual
- Incident reporting - onboarding and posters

## Contacts and Escalation

| Role | Contact | Availability |
|------|---------|--------------|
| **CISO** | ciso@dhararia.gov.in | 24/7 |
| **Security team** | security@dhararia.gov.in | 24/7 |
| **Platform owner** | devops@dhararia.gov.in | Business hours and on-call |
| **DBA** | dba@dhararia.gov.in | Business hours and on-call |
| **CERT-In** | incident@cert-in.org.in | 24/7 |
| **NIC-CERT** | ncert@nic.in | 24/7 |

---

*Document Version: 2.0*  
*Last Updated: 2026-10-24*  
*Classification: CONFIDENTIAL - Government Use Only*
