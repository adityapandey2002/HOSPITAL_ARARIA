# Plan — Feedback launch on Vercel + Supabase

Date: 2026-10-24
Owner: chief-of-staff session
Goal: ship the department feedback system and close the launch blockers, targeting
Vercel (Next.js frontend + NestJS serverless backend) and Supabase (PostgreSQL).

## Product decision

- Public feedback is **anonymous** and reachable from a shareable link
  (`/feedback` and `/feedback/<departmentId>`), rate-limited per IP.
- **HM level** is the existing `ADMIN` role: it sees every department, every
  response, and manages access grants.
- A **department head / nodal officer** sees only the departments explicitly
  granted to them. Grants live in `feedback_viewers` and support one or many
  departments per user.
- Feedback is **live**: submissions appear immediately in the HM inbox. Status
  workflow is `NEW → ACKNOWLEDGED → RESOLVED`.

## Work breakdown

| # | Work | Owner | Commit boundary |
|---|------|-------|-----------------|
| T1 | Shared contract: Drizzle `feedback` + `feedback_viewers`, enums, shared types/constants, ADR-0002, schema-check count | lead | one commit |
| T2 | Backend `feedback` module: public submit, scoped list/stats/status, grant management, tests | subagent | one commit |
| T3 | Frontend: public form + department link, HM/viewer inbox, access management, nav | subagent | one commit |
| T4 | P0 hardening: dependency audit, production seed guard, 500 redaction, error boundaries/client error telemetry, CI | subagent | one commit |
| T5 | Vercel + Supabase deployment: serverless Nest entry, `vercel.json`, env templates, migration runbook | subagent | one commit |
| T6 | Docs: README, DEPLOYMENT, API, ARCHITECTURE, SECURITY, LAUNCH-READINESS, glossary | doc-updater | one commit |
| T7 | Full verification: `schema:check`, tests, build, audit; final launch verdict | lead | verification only |

## Non-goals for this pass

- Replacing Nest with Supabase Edge Functions or rewriting the backend in Deno.
- Adding a new `HOSPITAL_MANAGER` role. `ADMIN` is the HM role for now; the
  permission seam is the grant table, so a future role split is additive.
- Email/SMS notification on new feedback (Phase 2).

## Environment rules

- Every API route validates input with a DTO; no ad-hoc `any`.
- Every list route paginates and clamps `limit`.
- Authorization is enforced in the service, not only the controller, so a new
  controller cannot bypass department scope.
- No workarounds: migrations are generated, not hand-written; table ownership is
  recorded in an ADR; docs reference real paths.
