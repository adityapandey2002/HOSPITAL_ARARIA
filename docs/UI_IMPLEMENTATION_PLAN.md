# UI Implementation Plan — DH Araria Hospital Portal

**Source of truth:** `C:\Users\Aditya Pandey\Downloads\stitch_mobile_outline_assistant\`
(`ui_outline_prompt.md`, `district_hospital_araria_health_portal/DESIGN.md`, per-screen `code.html`/`screen.png`).
**Companion spec:** `docs/UI_OUTLINE_PROMPT.md` (route inventory, page specs, honesty rules).
**Design system:** `docs/DESIGN_SYSTEM.md`, `apps/frontend/tailwind.config.ts`, `packages/ui/src`.

**Goal:** Make every frontend page match the Stitch designs, with a UI that is
excellent, stable, and fully responsive across mobile (320–414 px), tablet
(768 px), laptop (1024 px), and desktop (1440–1920 px), with no horizontal
scroll, no dead ends, and no unverified claims.

**Operating rules (from the outline):** honesty rule, route integrity, WCAG 2.2
AA + GIGW 3.0, mobile-first, no `href="#"`, no forms without submit handlers,
no demo credentials in production.

---

## 1. Current state (already shipped)

| Area | Status |
|---|---|
| Route groups `(auth)`, `(public)` with shells | Done — `PublicShell`, `AuthShell`, `AdminShell` |
| Design tokens + fonts | Done — Atkinson Hyperlegible Next + Plus Jakarta Sans, surface/primary ramps |
| Primitive component library | Done — `packages/ui` (Button, Card, Input, Select, Textarea, Modal, Table, Alert, Badge, Avatar, Container, Section, PageHero, Prose, Breadcrumbs, Pagination, Stepper, Tabs, SegmentedControl, Skeleton, EmptyState, ErrorState, StatusBadge, DataList, Dialog, Sheet) |
| Home page redesign | Done — `HomeHero`, `QuickServices`, `DepartmentHighlights`, `DoctorHighlights`, `BloodHighlights`, `NoticeHighlights`, `EmergencyStrip`, `VisitBand` |
| `MediaFrame` | Done — `apps/frontend/src/components/layout/MediaFrame.tsx` |
| `department-icon` helper | Done — `apps/frontend/src/lib/department-icon.ts` |
| Auth pages (login/register) | Redesigned shell; need honesty + redirect validation |
| Detail pages (doctors, services, notices) | Redesigned; need slug/UUID fix, sanitization |
| `not-found.tsx` | Present |
| Admin pages | Partial — complaints, doctors, nodal-officers live; rest planned |

**Known open gaps carried into this plan:** services slug/UUID mismatch, grievance
tracking link, blood request form without backend, CPGRAMS/e-RaktKosh claims,
demo credentials, forgot-password honesty, notice HTML sanitization, doctor bio
interpolation bug, `/admin` index page.

---

## 2. Stitch screen → route mapping

| Stitch folder | Target route(s) | Status |
|---|---|---|
| `district_hospital_araria_home` (+ auto-slideshow variants) | `/` | Done (iterate on slideshow timing) |
| `district_hospital_araria_desktop_home` | `/` (desktop variant) | Fold into responsive `/` |
| `medical_services_departments_*` | `/services`, `/services/[id]` | Partial — needs redesign + slug fix |
| `doctors_and_pediatricians_*` | `/doctors`, `/doctors/[id]` | Partial — needs redesign |
| `book_appointment_*` (mobile + desktop wizard) | `/appointments` | Partial — wizard + auth gate |
| `blood_bank_inventory_*` | `/blood-bank` | Partial |
| `grievance_complaints_desk_*` (mobile + desktop admin) | `/admin/complaints` | Live — align visuals |
| `admin_operations_*` (mobile + desktop) | `/admin` dashboard | Planned — build dashboard |
| `complaint_triage_desk_*` | `/complaint`, `/complaints/track` | Partial |
| `modern_advanced_emergency_*` | Emergency sections | Fold into `/`, `/contact` |
| `modern_clean_pathology_*` | Health tips / services imagery | Asset only |

Every screen has `code.html` + `screen.png`. Use `screen.png` as the visual
reference and `code.html` only to extract layout proportions, not markup.

---

## 3. Responsive breakpoints (must test all)

`320, 375, 768, 1024, 1440, 1920 px` + 200 % text zoom + landscape.
No horizontal scroll at 320 px. Touch targets ≥ 44 px. Inputs ≥ 16 px to avoid
iOS zoom. Tables → cards or horizontal scroll with visible hint below `lg`.

---

## 4. Phases

### Phase 0 — Trust & dead ends (P0) — do first

1. **Route integrity**
   - Fix `/services/[id]` slug/UUID mismatch: add slug lookup or redirect UUID→slug; update footer/home links to canonical form.
   - Remove or build `/grievances/track` (decide per open decision #2).
   - Replace every `href="#"` in `/forms` with real PDFs (`download`, type, size).
   - Ensure `app/not-found.tsx` returns 404 status.
2. **Honesty pass**
   - Remove CPGRAMS / e-RaktKosh / "email & SMS sent" claims until wired; label planned features.
   - `/blood-bank/request`: build backend (`blood_requests`) OR convert to phone-only instruction (safe interim).
   - Hide demo credentials in production (`SHOW_DEMO_CREDENTIALS` gate already present — verify env).
3. **Auth gates**
   - Gate every admin page server-side; gate booking wizard before step 4; validate post-login redirects (same-origin relative only).
4. **Account area** — `/account` overview, appointments, grievances, profile, security (backend exists).
5. **Admin essentials** — `/admin` dashboard/redirect, notices, appointments, grievances, users.
6. **Password reset** — finish SMTP + token storage + `/reset-password`, or label forgot-password as help-desk-only.

### Phase 1 — Complete operational surface (P1)

- Admin: blood stock, contact messages, departments, audit log.
- Doctor edit + active/inactive toggle.
- Move feedback inbox to `/admin/feedback` with redirect from `/feedback/inbox`.
- Search/filters/pagination/URL state on every list (`/doctors`, `/notices`, `/services`, admin tables).
- Print views: appointments, notices, patient rights.
- Sitemap generated from route registry (`/sitemap` + XML).
- Content review dates/owners on legal pages.
- Notice content: sanitize HTML (allow-list) — remove `dangerouslySetInnerHTML`.

### Phase 2 — After core is stable (P2)

- ABHA linking/consent/records (deferred, backend gateway required).
- Language switcher + Bhashini (only when translation works).
- PWA offline + install prompt.
- Notification centre + SMS/email preferences.
- Appointment reschedule endpoint + UI.
- Donor registration + blood-request tracking.

---

## 5. Per-page task template (apply to every route)

For each route in the checklist, complete:

1. **Layout** — match Stitch `screen.png` proportions; use shells (no per-page Header/Footer).
2. **States** — loading skeleton (aria-hidden), empty, error with retry + phone fallback, success, permission.
3. **Data** — wire to real endpoints; no hard-coded names/stats; independent section loading (home).
4. **Forms** — labels, inline validation, `aria-invalid`/`aria-describedby`, error summary, focus management, keep values on server error, disabled only while submitting.
5. **Accessibility** — landmarks, one `h1`, focus rings ≥ 3:1, contrast 4.5:1, touch targets, reduced motion, table captions/headers, live regions.
6. **Responsive** — test 320/375/768/1024/1440/1920, no horizontal scroll, 200 % zoom.
7. **SEO** — unique title/description/canonical/OG; `noindex` on admin/account/auth/inbox/tracking.
8. **Honesty** — no unverified claims, no dead links, no stub forms.

---

## 6. Route coverage checklist

- [ ] `/` (done — iterate slideshow)
- [ ] `/services` (redesign + URL state)
- [ ] `/services/[id]` (slug/UUID + doctor grid)
- [ ] `/doctors` (search/filter/sort/pagination)
- [ ] `/doctors/[id]` (bio interpolation fix + availability)
- [ ] `/appointments` (wizard + auth gate + success panel)
- [ ] `/account` + sub-routes (planned)
- [ ] `/blood-bank` (status labels + accessible table alt)
- [ ] `/blood-bank/request` (build or phone-only)
- [ ] `/blood-bank/donate`
- [ ] `/grievances` (honesty pass)
- [ ] `/grievances/track` (build or remove link)
- [ ] `/complaint` (photo upload + success panel)
- [ ] `/complaints/track`
- [ ] `/feedback`, `/feedback/[departmentId]`
- [ ] `/feedback/inbox` (move under admin)
- [ ] `/notices`, `/notices/[id]` (sanitization)
- [ ] `/contact`
- [ ] Content pages: `/faqs`, `/forms`, `/health-tips`, `/insurance`, `/patient-rights`, `/privacy`, `/terms`, `/accessibility`, `/sitemap`
- [ ] `/login`, `/register`, `/forgot-password`, `/reset-password`
- [ ] `/admin` dashboard + all admin sub-routes
- [ ] Doctor/staff clinic desk
- [ ] `not-found`, `error`, `global-error`, loading states

---

## 7. Open product decisions (must be settled before building related pages)

1. Grievances vs complaints — merge or keep separate.
2. Public grievance tracking — build with reference+phone/OTP or remove CTA.
3. Service URL format — slugs vs UUIDs.
4. Blood request handling — build backend or phone-only interim.
5. Password reset delivery — SMTP + token table or help-desk-only.
6. Notice content format — sanitized rich text vs plain text.
7. Feedback inbox location — under `/admin/feedback`.
8. Doctor editing — add edit action.
9. Demo credentials — production gate.
10. e-RaktKosh/CPGRAMS claims — remove until wired.
11. Language selector — only when translation works.
12. Public department feedback indexing — default indexable.

---

## 8. Definition of done (per page)

See outline §11. Summary: route inventoried; no dead links; all states present;
keyboard-only + focus managed; screen-reader correct; responsive 320/768/1024/1440;
forms validate + announce; auth/role enforced in UI + API; `noindex` set where
required; real copy; correct dates/phones/emergency info; no PII in URLs/logs;
axe-core + `eslint-plugin-jsx-a11y` pass; public routes in HTML sitemap.

---

## 9. Execution guidance

- Work in small, verifiable slices (one route or one component per commit).
- Use the existing shells; pages render sections only.
- Reuse `@dh-araria/ui` primitives; compose, don't reinvent.
- Run `npm run type-check`, `npm test`, `npm run build:frontend`, `npm run schema:check` before each commit.
- Prefer parallel subagents for independent pages; protect context with pointers
  (commit hashes, file paths) instead of pasted code.
- Every change committed with a concise imperative message; no long uncommitted diff.

---

## 10. First three slices to start (recommended)

1. **P0 route integrity** — slug/UUID fix + `/forms` real PDFs + `/admin` index
   redirect (unblocks footer and admin shell).
2. **Honesty pass** — remove false integration claims + gate demo credentials +
   `/blood-bank/request` phone-only interim.
3. **`/appointments` wizard** — auth gate, slot refresh on 409, success panel
   with token, print action.

These three remove the most trust-damaging dead ends and unlock the rest of the
plan.
