# Spec: Hospital Quality Events (NQAS / KAYAKALP / MUSQAN) + Slideshow Admin

## Objective

Allow hospital administration to launch pan-hospital quality initiatives
(NQAS, KAYAKALP, MUSQAN) as events. Each event activates a per-department
checklist of required tasks. Department in-charges mark tasks complete.
The Hospital Manager (HM) gets a dashboard showing, per department and per
event, what is completed and what is pending, so support can be directed
where needed.

Separately, give admins a section to manage homepage slideshow images by
uploading a file or pasting an image URL, with ordering and active toggle.

**Users:** Admin (launch/manage events, manage slideshow), Department
in-charge (mark tasks done), HM (progress dashboard), public (sees slideshow).

**Success:** An admin can create an event, departments see their tasks, in-charges
mark done, HM sees live progress, slideshow images managed without code deploy.

## Assumptions

1. Events are admin-scoped; only ADMIN can create/launch.
2. Department in-charge is a STAFF user linked to a department (existing nodal officer pattern).
3. HM is an ADMIN or a dedicated role; reuse ADMIN for now.
4. Tasks are predefined templates per event type (NQAS/KAYAKALP/MUSQAN), activated per department.
5. Slideshow images stored via URL (upload to existing storage or external link); no new binary storage infra assumed initially.
6. Backend uses Drizzle (departments table owned by Drizzle) — new tables owned by Drizzle too.

## Capability map

| Module id | Responsibility | Depends on |
|---|---|---|
| quality-events | Event CRUD, launch, task templates | departments, users |
| quality-progress | Per-department task completion, HM dashboard | quality-events |
| slideshow | Image CRUD, ordering, active toggle | — |

Build order: slideshow → quality-events → quality-progress

## Tech stack / commands

Same as repo. Backend: NestJS + Drizzle. Frontend: Next.js. Tests: Jest.

Build: `npm run build`  Test: `npm test`  Lint: `npm run lint`

## Project structure (new)

Backend:
- `apps/backend/src/modules/quality-events/` (controller, service, dto, schema refs)
- `apps/backend/src/modules/slideshow/` (controller, service, dto)

Drizzle schema additions in `apps/backend/src/common/drizzle/schema.ts`:
- `quality_events` (id, type, title, description, startDate, endDate, isActive, createdBy, createdAt, updatedAt)
- `quality_event_tasks` (id, eventId, departmentId, title, description, isCompleted, completedBy, completedAt, createdAt)
- `slideshow_images` (id, url, alt, caption, sortOrder, isActive, createdAt, updatedAt)

Frontend:
- `apps/frontend/src/app/admin/quality-events/page.tsx` (launch + list events)
- `apps/frontend/src/app/admin/quality-events/[id]/page.tsx` (per-event progress)
- `apps/frontend/src/app/admin/slideshow/page.tsx` (image management)
- `apps/frontend/src/app/(public)/...` no new public page except slideshow component on home.

## Code style

Follow existing: NestJS modules, Drizzle queries, DTOs with class-validator, frontend shells, `@dh-araria/ui` primitives.

## API contract (draft)

Quality events:
- `GET /quality-events` (ADMIN) — list events
- `POST /quality-events` (ADMIN) — create/launch event { type, title, description, startDate, endDate, departmentIds? }
- `GET /quality-events/:id` (ADMIN) — event + per-department progress
- `PATCH /quality-events/:id` (ADMIN) — update
- `DELETE /quality-events/:id` (ADMIN) — delete (if no completions)
- `GET /quality-events/:id/tasks?departmentId=` (STAFF/ADMIN) — tasks for a department
- `PATCH /quality-events/:id/tasks/:taskId` (STAFF in-charge) — mark complete { isCompleted }
- `GET /quality-events/:id/progress` (ADMIN/HM) — aggregated per-department counts

Slideshow:
- `GET /slideshow` (public) — active images ordered
- `GET /admin/slideshow` (ADMIN) — all images
- `POST /admin/slideshow` (ADMIN) — add { url, alt, caption }
- `PATCH /admin/slideshow/:id` (ADMIN) — update/order/active
- `DELETE /admin/slideshow/:id` (ADMIN) — delete

## Boundaries

- Always: validate inputs, enforce roles server-side, no PII in URLs, tests for services.
- Ask first: adding dependencies, changing CI, DB migration execution.
- Never: commit secrets, edit vendor, remove failing tests, claim integrations not live.

## Success criteria

- Admin can create a NQAS/KAYAKALP/MUSQAN event.
- Each department gets its task checklist upon launch.
- Department in-charge can mark tasks done.
- HM dashboard shows per-department completion counts and pending items.
- Admin can add/reorder/toggle slideshow images by URL (and upload if storage exists).
- Homepage slideshow uses managed images.
- All endpoints role-guarded; tests pass; type-check passes.

## Open questions (resolved)

1. Task templates: **hardcoded per event type** (NQAS/KAYAKALP/MUSQAN).
2. HM role: **reuse ADMIN**.
3. Slideshow storage: **both** — URL paste now; file upload when storage provider exists.
4. Event lifecycle: **manual archive** (admin toggles).
5. Notifications: **none** for now (no transport).

## Delivery

Phase 0: schema + migrations + seed templates.
Phase 1: backend services + controllers + tests.
Phase 2: admin UI for events launch + progress dashboard.
Phase 3: department in-charge task view + mark complete.
Phase 4: slideshow admin + homepage integration.

STOP: awaiting approval before implementation.
