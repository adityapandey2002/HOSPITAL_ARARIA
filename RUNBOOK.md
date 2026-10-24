# Runbook — DH Araria Hospital Portal

Step-by-step instructions to run the project end-to-end.

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20 | Backend + frontend runtime |
| npm | >= 10 | Package manager (workspaces) |
| PostgreSQL | 15+ | Database (Supabase or local Docker) |

No Docker is required — the app runs against any reachable PostgreSQL instance.

---

## 2. Environment setup

Copy the example env file and fill in your Supabase credentials:

```powershell
cp apps/backend/.env.example apps/backend/.env
```

Open `apps/backend/.env` and set:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_DB_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?schema=public&sslmode=require"
DB_HOST=aws-0-REGION.pooler.supabase.com
DB_PORT=5432
DB_USERNAME=postgres.PROJECT_REF
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=postgres
JWT_SECRET=change-this-to-a-32-char-secret-in-production
```

**Get your connection string:** Supabase dashboard → Project Settings → Database → Connection string → choose **Session pooler** (port 5432).

If your Supabase free-tier project is paused, resume it in the dashboard first (otherwise you'll get `tenant/user ... not found`).

---

## 3. Install dependencies

From the repo root:

```powershell
npm install
```

This installs all workspaces (backend, frontend, shared, ui).

---

## 4. Database migration & seed

Run from the repo root:

```powershell
# Apply Drizzle migrations (8 app tables) + MikroORM schema (5 audit/clinical tables)
npm run db:migrate

# Seed idempotent demo data (admin/staff/patient users, departments, doctors, time slots, blood stock, notices)
npm run db:seed

# Verify the Drizzle/MikroORM table-ownership boundary (offline, no DB needed)
npm run schema:check
```

Expected output:
```
Applying Drizzle migrations (8 owned tables)...
Applying MikroORM schema (5 owned tables)...
Database is up to date.

Seeding database...
  admin user: admin@dhararia.gov.in
  staff user: staff@dhararia.gov.in
  patient user: demo@dhararia.gov.in
  departments: 15
  doctors: 6
  blood stock: 40 rows
  notices: 3
Seed complete.
```

Demo credentials:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dhararia.gov.in | Admin@123 |
| Staff | staff@dhararia.gov.in | Staff@123 |
| Patient | demo@dhararia.gov.in | Demo@123 |

---

## 5. Start the servers

### Backend (port 3001)

```powershell
npm run dev:backend
```

### Frontend (port 3000)

In a separate terminal:

```powershell
npm run dev:frontend
```

Or run both together:

```powershell
npm run dev
```

> **Note:** `npm run dev` may print a harmless `ENOWORKSPACES` error for the frontend — this is an npm/concurrently quirk. Both servers still start correctly (frontend on 3000, backend on 3001). If you prefer to avoid the error, run the two `dev:backend`/`dev:frontend` commands in separate terminals instead.

Verify the backend is up:

```powershell
curl http://localhost:3001/api/v1/health/live
# → {"success":true,"data":{"status":"ok","timestamp":"..."}}
```

Open the frontend at **http://localhost:3000**.

Swagger docs (backend, dev only): **http://localhost:3001/api/docs**

---

## 6. Run tests

From the repo root:

```powershell
npm test
```

Expected: 60 backend tests + 6 frontend tests, all passing.

Run only backend tests:

```powershell
npm run test --workspace=apps/backend
```

Run only frontend tests:

```powershell
npm run test --workspace=apps/frontend
```

---

## 7. Smoke-test the live API

With the backend running, verify the key endpoints:

```powershell
# Public: health
curl http://localhost:3001/api/v1/health/live

# Public: departments
curl http://localhost:3001/api/v1/departments?limit=3

# Public: doctors
curl http://localhost:3001/api/v1/doctors?limit=3

# Public: published notices
curl http://localhost:3001/api/v1/notices/published?limit=3

# Public: contact intake
curl -X POST http://localhost:3001/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","subject":"GENERAL","message":"Hello"}'

# Login as admin
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dhararia.gov.in","password":"Admin@123"}'

# Admin: contact inbox (use the accessToken from login)
curl http://localhost:3001/api/v1/contact?limit=5 \
  -H "Authorization: Bearer <accessToken>"

# Admin: contact stats
curl http://localhost:3001/api/v1/contact/stats \
  -H "Authorization: Bearer <accessToken>"

# Admin: audit logs
curl http://localhost:3001/api/v1/audit-logs?limit=5 \
  -H "Authorization: Bearer <accessToken>"
```

---

## 8. Build for production

```powershell
npm run build
```

This builds `packages/shared`, `packages/ui`, `apps/backend` (NestJS), and `apps/frontend` (Next.js standalone output).

### Docker

Build images from the repo root:

```powershell
docker build -f apps/backend/Dockerfile -t dh-araria-backend .
docker build -f apps/frontend/Dockerfile -t dh-araria-frontend .
```

Or bring up the full stack with Docker Compose:

```powershell
docker-compose up -d
```

---

## 9. Lint

```powershell
npm run lint
```

Should report 0 errors (warnings are acceptable).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `tenant/user ... not found` | Your Supabase project is paused. Resume it in the Supabase dashboard, wait ~1 minute, then retry. |
| `ENOTFOUND` on Supabase host | Confirm `DB_HOST` in `.env` matches the Session pooler host from Supabase. |
| `schema:check` fails | Run `npm run schema:check` from the repo root — it works offline and reports the ownership split. |
| Admin routes return 403 | Make sure you logged in and are sending `Authorization: Bearer <accessToken>`. |
| Port already in use | Kill the existing process on 3001/3000 or change `PORT`/`NEXT_PUBLIC_API_URL` in `.env`. |

---

## File locations

| Path | Purpose |
|------|---------|
| `apps/backend/.env` | Backend environment variables (create from `.env.example`) |
| `apps/backend/src/common/drizzle/schema.ts` | Drizzle DDL source of truth (9 tables) |
| `apps/backend/drizzle/` | Committed Drizzle migrations |
| `apps/backend/scripts/db-migrate.ts` | Migration script (Drizzle + MikroORM) |
| `apps/backend/scripts/seed.ts` | Idempotent seed script |
| `apps/backend/scripts/schema-check.ts` | Offline ownership-boundary check |
| `apps/backend/scripts/mikro-schema-update.ts` | Live MikroORM drift check |
| `apps/frontend/src/lib/api.ts` | Frontend API client |
| `docs/API.md` | Full API reference |
| `docs/DEVELOPER_GUIDE.md` | Local development setup |
| `docs/DEPLOYMENT.md` | Docker / Kubernetes deployment |
| `docs/adr/0001-dual-orm-table-ownership.md` | Drizzle vs MikroORM table contract |