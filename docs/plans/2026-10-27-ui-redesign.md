# UI Redesign Plan — Stitch screens → production portal

**Status:** proposed, awaiting sign-off
**Snapshot:** `dd552ff docs: extract the design contract from the Stitch screens`
**Inputs**

- `docs/plans/ui-redesign-design-contract.md` — tokens, shells and screen structure extracted from the 15 Stitch designs.
- `docs/plans/ui-redesign-inventory.md` — every route, component, style count and landmine in the current frontend.
- `docs/UI_OUTLINE_PROMPT.md` — product, route, accessibility and honesty rules.
- `docs/ACCESSIBILITY.md` — WCAG 2.2 AA / GIGW 3.0 commitments.

**Scope:** `apps/frontend` and `packages/ui`. Backend contracts do not change.
**Non-goal:** adding new product features. The one exception is routes the designs require but the app lacks (`/admin`, `/admin/grievances`); those are flagged as new work, not reskins.

---

## 0. One-page summary

The bundle gives us **12 distinct screens** covering **4 public routes and 3 admin routes**. The other **29 live routes have no design**. So this is not a "copy the HTML" job — it is three jobs in one:

1. **Repair the foundation.** The current frontend has no shared layout (28 pages each render their own `Header`/`Footer` and a magic `pt-32`), three detail routes crash on render, 110 colour classes generate no CSS, and contrast fails AA on six hero variants. Restyling first would bury those bugs under a new coat of paint.
2. **Build one design system.** A token layer, a 15-component primitive library, and three shells (public, auth, admin). Every undesigned page is then composed from those primitives rather than invented.
3. **Apply it page family by page family**, each behind a green build, a route-parity check, and a responsive/visual test matrix from 320 px to 1920 px.

The plan deliberately **does not** reproduce the Stitch markup. That markup is a static mock: it has no data states, no error handling, no focus management, no skip links, no `h1`s in half the screens, off-token radii, and hotlinked Google images. We take its **visual language and layout structure**, and keep our **runtime, data layer and accessibility**.

**Headline decisions**

| Decision | Choice | Why |
|---|---|---|
| Palette migration | Recolour the existing `primary`/`secondary` scales + add semantic surface tokens | 40 `bg-primary-600` and 74 `text-primary-600` call-sites restyle for free; `Button.test.tsx` keeps passing |
| Shell | Route groups + one `sticky` header per shell | Kills 29 duplicated shells, 28 `pt-32` offsets and the header-overlap class of bugs |
| Fonts | `next/font/google` → Atkinson Hyperlegible Next + Plus Jakarta Sans | Both exist in the installed Next 16 font catalogue; self-hosted at build, no runtime Google request |
| Icons | Keep `lucide-react` | Already installed, tree-shaken; Material Symbols would add a font request and a 200-icon rewrite |
| Admin shell | Sidebar on desktop, bottom nav on mobile | The Stitch bundle ships two incompatible admin shells; pick one, use top tabs only inside Grievances |
| Images | Local `next/image` assets only | The bundle hotlinks `lh3.googleusercontent.com`; the trauma photo shows **Indore** signage and cannot be used |
| Delivery | 7 phases, every phase shippable | No half-restyled deploy; each phase ends green on build + tests + token gate + Playwright |

**Estimate:** 20–22 agent-days serial. With three parallel agents after Phase 2, 10–12 calendar days.

---

## 1. Goal and success criteria

**Goal:** the portal looks and behaves like the Stitch designs at every width, with production-grade states, accessibility and performance, and without regressing any existing flow.

**Success criteria (all measured, not asserted):**

1. **Visual match** — the designed screens match the bundle at 390 px (all) and 1440 px (where a desktop variant exists) within one spacing step, confirmed by side-by-side review.
2. **Responsive** — zero horizontal page scroll at 320, 360, 390, 414, 768, 1024, 1280, 1440, 1920; every route has a deliberate layout at each width (no orphaned narrow column on wide screens).
3. **Viewport fill** — no route shows a short page with dead space under the content; the footer sits at the viewport bottom on short pages.
4. **Accessibility** — axe-core: zero serious/critical issues on 12 representative routes; keyboard-only completion of booking, complaint, feedback and admin triage; 200 % zoom and 200 % text-spacing pass.
5. **Contrast** — every text/background pair used in the UI passes 4.5:1 (3:1 for ≥24 px or ≥18.66 px bold), measured and recorded in `docs/DESIGN_SYSTEM.md`.
6. **Stability** — `npm run build`, `npm test`, `npm run lint`, `npm run schema:check` and the new `npm run ui:verify` all green at every phase boundary.
7. **No dead ends** — zero `href="#"`, zero links to non-existent routes, zero forms without submit handlers (per `UI_OUTLINE_PROMPT.md` §9.4).
8. **Performance** — LCP ≤ 2.5 s on a simulated Moto G4 / Slow 4G for `/`, `/services`, `/appointments`; CLS < 0.1; no 1.5 MB PNG delivered to mobile.

**Non-goals:** dark mode (the current `.dark` block is dead and the design has none), Hindi/RTL, new backend endpoints, replacing the data layer.

---

## 2. Ground truth from the audits

These are facts, not opinions. Every phase below is ordered around them.

| # | Finding | Consequence for the plan |
|--:|---|---|
| 1 | `doctors/[id]:91`, `notices/[id]:66`, `services/[id]:104` render `{metadata}` as a React child | These routes **crash today**. Fix in Phase 0 or every redesign review will chase a ghost. |
| 2 | 29 files import `Header`+`Footer`; 28 `<main>` use `pt-32`; header is 64 px (<md) / ~100 px (md+) | Replace with route-group layouts. `pt-32` is wrong at every breakpoint by 64 px or 28 px. |
| 3 | 110 utilities reference `success/warning/danger` shades that do not exist | Error/success states currently render colourless. Add full ramps **before** any visual QA. |
| 4 | `Header.tsx` has two near-duplicate trees (loading vs loaded) and `isLoading` starts `true` | The shell flashes on every cold load. Rebuild it as a server shell + small client islands. |
| 5 | 554 `text-gray-*`, 169 `border-gray-*`, 159 `bg-white`, 96 `rounded-2xl`, 81 `container mx-auto px-4` overrides | The "design system" is raw utilities. Introduce tokens + a ratchet; do not attempt a big-bang rename. |
| 6 | `Button.test.tsx` asserts `bg-primary-600`, `bg-danger-600`, `px-3 py-1.5 text-sm` | Keep the class names and recolour the scale; if a size changes, update the test in the same commit. |
| 7 | `AdminComplaintsPanel.test.tsx` pins the responsive card grid and truncation (`basis-32 truncate`) | Keep those contracts when restyling that panel, or rewrite the assertions deliberately. |
| 8 | No `not-found.tsx`, no `loading.tsx`, no `scroll-mt`, no safe-area insets | Add all four in Phases 0–2. |
| 9 | Home renders 6 mock sections (fake doctors, ratings, blood stock); detail pages render DB data | The home page is a **trust** problem for a `.gov.in` site. Wire it to the API or label it illustrative before polishing. |
| 10 | `/services/[id]` is UUID-keyed but the footer links 8 slugs | Decide: add slug lookup, or drop the slug links. Do not ship 8 broken links. |

---

## 3. The design contract (what "like that only" means)

Full detail in `ui-redesign-design-contract.md`. The short version that every implementation task links to:

### 3.1 Tokens

**Brand and surfaces**

| Token | Hex | Use |
|---|---|---|
| `primary` | `#006194` | primary buttons, active nav, links, icons |
| `primary-container` | `#007BB9` | hover fill |
| `surface` | `#F7F9FF` | page canvas |
| `surface-low` | `#F1F4FA` | inputs, inactive chips, section bands |
| `surface-container` | `#EBEEF4` | inset panels, secondary chips |
| `surface-high` | `#E5E8EE` | status strips, table headers |
| `surface-highest` | `#DFE3E8` | pressed/selected |
| `card` | `#FFFFFF` | cards, header |
| `on-surface` | `#181C20` | headings, body |
| `on-surface-variant` | `#3F4850` | secondary copy |
| `outline` | `#707881` | icons, placeholders, borders (≥3:1 only) |
| `outline-variant` | `#BFC7D2` | dividers |
| `emergency` | `#DC2626` | 102/108 strip, emergency CTA |
| `success` | `#16A34A` fill / `#15803D` text | "Adequate", online |
| `tertiary` | `#894D00` on `#FFDCC0` | "Low" stock |

**Typography** — Atkinson Hyperlegible Next for `h1`–`h3`; Plus Jakarta Sans for everything else.
`h1` 36/44/700 · `h2` 28/36/700 · `h3` 22/28/600 · body-lg 18/28 · body 16/24 · body-sm 14/20 · label 14/20/600 · label-sm 12/16/600.
On <768 px, `h1` uses `clamp(1.75rem, 6vw, 2.25rem)` so it never overflows 320 px.

**Shape** — `rounded` 0.25rem, `rounded-lg` 0.5rem, `rounded-xl` 0.75rem, `rounded-full`. **No `rounded-2xl` in new code**; it is mapped to 0.75rem as a deprecation alias.

**Space** — Tailwind numeric scale only. 12 px gaps = `gap-3`, 20 px card padding = `p-5`, 24 px gutter = `px-6`, 32 px section gap = `gap-8`, 48 px section rhythm = `py-12`. No custom spacing keys, no arbitrary pixel values.

**Elevation** — `shadow-sm` for cards, `shadow-md` on hover, `shadow-xl` only for dialogs and the hero media. Header/bottom bars use `shadow-[0_1px_8px_rgba(0,0,0,0.04)]` / `shadow-[0_-1px_8px_rgba(0,0,0,0.04)]`.

### 3.2 Deliberate deviations from the bundle

| Bundle | We build | Reason |
|---|---|---|
| Material Symbols icon font | `lucide-react` equivalents | No extra font request, already a dependency, tree-shaken |
| `fixed` header + `pt-[120px]` | `sticky` header + CSS variable offset | Same visual result, no magic numbers, no overlap at zoom |
| `rounded-2xl` modals | `rounded-xl` | Off-token; max radius is 12 px |
| Hotlinked Google photos | Local `next/image` assets | Privacy, performance, data residency |
| 1,400+ OPD, "NABL Accredited", "HMIS Synced", "ABHA Linked" | Only claims the hospital can evidence | Honesty rule, `UI_OUTLINE_PROMPT.md` §9.4 |
| Two admin shells | Sidebar + mobile bottom nav; top tabs inside Grievances only | One shell, one set of breakpoints |

---

## 4. Architecture changes

### 4.1 Shells and route groups

```
app/
  layout.tsx                 ← html/body/fonts/Providers/Toaster/skip link ONLY
  (public)/
    layout.tsx               ← PublicShell: sticky header, emergency strip, footer, mobile bottom nav
    page.tsx                 ← /
    services/…  doctors/…  appointments/…  blood-bank/…  notices/…
    complaint/… complaints/… grievances/… feedback/… contact/…
    faqs/… forms/… health-tips/… insurance/… patient-rights/…
    privacy/… terms/… accessibility/… sitemap/…
  (auth)/
    layout.tsx               ← AuthShell: brand panel + card, no nav
    login/… register/… forgot-password/…
  admin/
    layout.tsx               ← AdminShell: sidebar ≥lg, top bar, bottom nav <lg
```

Route groups do not change URLs. Verified by a route-manifest check (§10).

### 4.2 Single sources of truth (deep modules)

| Module | Interface | Hides |
|---|---|---|
| `src/config/hospital.ts` | `HOSPITAL` constant + `telHref()` | Address, 4 phone numbers, email, OPD windows, fees, bed count, GPS. The designs disagree on every one of these; one object ends the drift. |
| `src/config/navigation.ts` | `PUBLIC_NAV`, `CITIZEN_MENU`, `FOOTER_GROUPS`, `ADMIN_NAV` | Nav, drawer, footer and the HTML sitemap all render from this. Kills dead links permanently. |
| `src/lib/content.ts` | `SITE_FACTS` (verified claims only) | Stat strips and trust badges read from here, never from JSX literals. |
| `packages/ui` primitives | Small prop surfaces (§6) | Every page stops re-inventing cards, dialogs, tabs and empty states. |

### 4.3 Sticky offset, scroll and safe areas

```css
:root {
  --header-h: 4rem;        /* mobile: brand bar only */
  --bottom-nav-h: 5rem;
  --admin-sidebar-w: 18rem;
}
@media (min-width: 768px) { :root { --header-h: 7.5rem; } }  /* utility 40px + nav 80px */
html { scroll-padding-top: calc(var(--header-h) + 1rem); }
```

- `main` gets `padding-top: 0` (sticky handles it) and `padding-bottom: calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))` below `lg`.
- The 102/108 emergency strip is the first row of `<main>` on mobile — it scrolls away, so the sticky offset stays 64 px — and lives inside the 40 px utility bar at `md+`.
- Booking summary uses `lg:sticky lg:top-[calc(var(--header-h)+1.25rem)]`, never `top-[140px]`.
- `body` is `flex min-h-dvh flex-col`; `main` is `flex-1`. Short pages still fill the viewport and the footer never floats.

---

## 5. Responsive contract (the part the user cares most about)

### 5.1 Breakpoint intent

| Width | Layout intent |
|---|---|
| 320–359 | Smallest supported. Single column, 16 px gutters, bottom nav, no two-up controls. `h1` ≤ 30 px. |
| 360–413 | Common Android. 24 px gutters, 2-up quick-service tiles, 2-up stat pairs. |
| 414–767 | Large phone. 2-up cards, full-width primary CTA, sticky action bar. |
| 768–1023 | Tablet portrait. 2-col catalogs, 4-up stats, 4-up blood grid, header gains the utility bar. |
| 1024–1279 | Tablet landscape / small laptop. 3-col catalogs, 12-col booking split (8/4), bottom nav hidden, full nav still hidden. |
| 1280–1535 | Laptop. Full desktop nav appears. `max-w-7xl` (1280) content. |
| 1536–1919 | Desktop. Shell widens to 1440 (`max-w-[90rem]`), catalogs go 4-up, home hero becomes 7/5. |
| 1920+ | Large display. Same 1440 content column, but full-bleed tinted section bands so the page reads as designed for the screen, not stretched. Dashboards cap at 1600. |

**Rule:** every page must have an explicit answer at 320, 768, 1024, 1280, 1536 and 1920. No route may rely on "it just centres".

### 5.2 Per-family responsive rules

| Family | Mobile (<768) | Tablet (768–1023) | Desktop (≥1024) | Wide (≥1536) |
|---|---|---|---|---|
| Home | slider full-bleed, 2×3 quick services, stacked cards | hero splits at `lg`, services 3-up | hero 6/6, departments 3-up, doctors 3-up, blood 8-up | hero 7/5, container 1440, departments 4-up |
| Services | 1-col cards, filter pills scroll horizontally with edge fade | 2-col | 3-col + sticky filter rail at `xl` | 4-col |
| Doctors | 1-col cards, filters in a sheet | 2-col | 3-col | 4-col |
| Booking | stepper compact ("Step 2 of 4"), 1-col, sticky bottom action bar | 1-col + summary below | 8/4 split, summary sticky | same, content 1200 |
| Blood bank | 2-col group cards, Cards/Table toggle defaults to Cards | 4-col | 8-col, table available | same |
| Notices | 1-col list rows | 2-col cards | list + right rail (filters) | same |
| Forms | full-width fields, 16 px font, sticky submit | max-w-2xl centred | 2/3 form + 1/3 help rail | same |
| Content/legal | prose, collapsible ToC | prose | prose + sticky ToC at `xl` | prose 72ch + ToC, no stretch |
| Admin | list cards, bottom nav, filters in sheet | 2-col cards | sidebar + KPI 4-up + 8/4 content | content 1600, KPI 4-up |

### 5.3 Overflow and touch rules

- **No horizontal page scroll** at any width. Wide tables get `overflow-x-auto` **inside** a bordered container with a visible "scroll for more" hint; below `lg` they become stacked cards (use `DataList`).
- Touch targets ≥ 44×44 px, including icon buttons, filter chips, pagination and bottom-nav items. Visual size may be smaller than the hit area.
- Inputs are ≥ 16 px font on mobile (prevents iOS zoom).
- Modals/sheets: `max-h-[90dvh]`, internal scroll, focus trap, Escape, restore focus, `aria-modal`.
- Sticky bars must not cover the footer, the last field, or the keyboard: use `scroll-margin-bottom` on form actions.
- Images: fixed `aspect-[16/9]` or `aspect-square` wrappers to guarantee CLS 0.
- Long words (department names, references) get `break-words`; truncation always has a `title` or visible expansion.

### 5.4 Contrast pairs to verify

| Pair | Expected | Notes |
|---|---|---|
| `on-primary` on `primary` | 6.7:1 | passes |
| `on-primary` on `primary-container` | 4.6:1 | passes, hover only |
| `on-surface` on `surface` | 15.9:1 | passes |
| `on-surface-variant` on `surface` | 8.6:1 | passes |
| `tertiary` on `tertiary-fixed` | 5.2:1 | "Low" badge |
| `on-error-container` on `error-container` | 8.4:1 | critical banner |
| `success` text on white | 3.3:1 | **fails** — use `success-strong #15803D` (5.0:1) for text, `#16A34A` only for fills/dots ≥ 24 px |
| `outline` on white | 4.46:1 | icons/borders only, **not** body text |
| white on `emergency` | 4.8:1 | passes |

Every new pair goes into `docs/DESIGN_SYSTEM.md` with its measured ratio. The Playwright suite has a contrast assertion for the 12 designed screens so a token tweak cannot silently regress.

---

## 6. Component library (`packages/ui`)

Build once, use everywhere. Existing components are extended, not duplicated. Each row is one task with unit tests.

| Component | Interface (small) | Replaces |
|---|---|---|
| `Container` | `size: content \| wide \| prose \| admin`, `as` | 81 `container mx-auto px-4` overrides |
| `PageHero` | `eyebrow?`, `title`, `description?`, `actions?`, `tone` | 5 hero dialects |
| `Section` | `title?`, `description?`, `action?`, `tone`, `spacing` | ad-hoc section headers |
| `Card` (+ `CardHeader/Title/Body/Footer`) | `variant`, `padding`, `interactive` | `.card*` globals + hand-rolled panels |
| `Button` | existing variants + `emergency`, `asChild`-style link variant | raw `<Link className="bg-blue-600">` |
| `Field` family (`Input`, `Select`, `Textarea`, `Checkbox`, `RadioCard`) | `label`, `hint`, `error`, `required` + native props | 6 form dialects |
| `StatusBadge` | `tone: neutral \| info \| success \| warning \| critical`, `label`, `icon?` | 4 badge recipes, colour-only status |
| `Alert` | `tone`, `title`, `action?`, `onDismiss?` | 6 hand-rolled banners |
| `Dialog` / `Sheet` | `open`, `onOpenChange`, `title`, `description?`, `footer?` | 3 hand-rolled `fixed inset-0 z-50` modals |
| `Tabs` | `items`, `value`, `onValueChange`, `variant: underline \| pill` | `AdminTabs`, filter pills |
| `DataList` | `columns`, `rows`, `renderCard(row)`, `loading`, `empty`, `pagination` | `Table` + horizontal scroll on mobile |
| `Pagination` | `page`, `pageCount`, `onPageChange` | 3 duplicated paginators |
| `Skeleton` | `variant`, `lines` | ad-hoc `animate-pulse` blocks |
| `EmptyState` | `icon`, `title`, `description`, `action?` | 8 inconsistent empties |
| `ErrorState` | `title`, `description`, `onRetry`, `fallbackHref` | silent `catch → []` |
| `Breadcrumbs` | `items: {label, href?}[]` | 3 manual breadcrumbs |
| `Stepper` | `steps`, `current` | booking wizard |
| `SegmentedControl` | `options`, `value`, `onChange` | Cards/Table toggle |
| `StatCard` | `label`, `value`, `delta?`, `tone`, `icon?` | KPI tiles |
| `Prose` | children + `max-w-[72ch]` | legal pages |
| `MediaFrame` | `src`, `alt`, `ratio`, `priority`, `scrim?` | raw `<img>` and CLS-prone media |

**Guardrails**

- Every interactive primitive ships `focus-visible:ring-2 ring-primary ring-offset-2`.
- `StatusBadge` never conveys status by colour alone — icon or text always present.
- `Dialog` uses native `<dialog>` semantics or a focus trap; Escape and focus restore are tested.
- `Button` keeps `bg-primary-600` / `bg-danger-600` class names (test contract) until the test is deliberately rewritten.

**Not adopted:** Storybook (heavy for this repo). Replacement: a Playwright "kitchen sink" page rendered only under `E2E=1` at `/__ui` — screenshot-tested, never shipped (excluded from the route manifest).

---

## 7. Page-by-page plan

`Design` = source screen. `—` = no design; compose from the contract.

### 7.0 Design coverage map

| Stitch folder | Design | Target route | Viewport | Phase |
|---|---|---|---|---|
| `district_hospital_araria_home` (+ 2 slideshow variants) | `home-m` | `/` | mobile | 3 |
| `district_hospital_araria_desktop_home` | `home-d` | `/` | desktop | 3 |
| `medical_services_departments_district_hospital_araria` | `services-m` | `/services` | mobile | 3 |
| `medical_services_departments_desktop_portal` | `services-d` | `/services`, adapted for `/services/[id]` | desktop | 3 |
| `book_appointment_district_hospital_araria` | `book-m` | `/appointments` | mobile | 3 |
| `book_appointment_wizard_desktop_portal` | `book-d` | `/appointments` | desktop | 3 |
| `blood_bank_inventory_district_hospital_araria` | `blood` | `/blood-bank` | mobile-first | 3 |
| `admin_operations_dashboard_district_hospital_araria` | `admin-m` | `/admin` (new) | mobile | 5 |
| `admin_operations_portal_desktop` | `admin-d` | `/admin` (new) | desktop | 5 |
| `complaint_triage_desk_district_hospital_araria` | `triage-m` | `/admin/complaints` | mobile | 5 |
| `grievance_complaints_desk_mobile_admin` | `griev-m` | `/admin/complaints` — list state | mobile | 5 |
| `grievance_complaints_desk_desktop_admin` | `griev-d` | `/admin/grievances` (new) | desktop | 5 |
| 3 photography folders | assets | home slides, `/services` panels | both | 3 |

The three home folders are **one** component with an `intervalMs` prop. Do not build three pages.
`triage-m` and `griev-m` both target `/admin/complaints`; ship **one** page with triage as the top section and the list below.

### 7.1 Public

| Route | Design | Work | Phase |
|---|---|---|---|
| `/` | home-m, home-d | Hero carousel (pause/play, reduced-motion), emergency strip, OPD band, 6 quick services, departments, doctors, blood matrix, notices, visit band. **Replace mock data with live list components.** | 3 |
| `/services` | services-m, services-d | Search + filter pills in URL, responsive catalog, emergency panel, empty/error/skeleton. | 3 |
| `/services/[id]` | services-d (adapted) | Breadcrumb, hero, info card, doctor grid, 404 for unknown. Fix `{metadata}` crash + slug/UUID. | 3 |
| `/doctors` | — | Search/filter/sort toolbar, doctor cards, URL state, skeleton/empty/error. | 3 |
| `/doctors/[id]` | — | Breadcrumb, profile, availability card, booking CTA with `?doctorId=`. Fix crash. | 3 |
| `/appointments` | book-m, book-d | 4-step wizard, consultation mode, 7-day strip, slot chips, sticky summary, auth gate before step 4, success ticket with print. | 3 |
| `/blood-bank` | blood | Status strip, 8-group cards + accessible table, critical banner, request/donate/call actions, thresholds labelled. | 3 |
| `/blood-bank/request` | blood (modal) | Either a real submitted request (needs API) or a phone-only instruction with hours. **Decide before build.** | 3 |
| `/blood-bank/donate` | — | Eligibility, what to expect, hours, actions. | 3 |
| `/notices` | home-d (rows) | Toolbar, category filters in URL, list rows, priority, skeleton/empty/error. | 3 |
| `/notices/[id]` | — | Breadcrumb, badges, prose body, attachment card, print. Fix crash + sanitise HTML. | 3 |
| `/complaint` | triage-m (intake tone) | Form + photo upload in a `Field` layout, error summary, success panel. | 4 |
| `/complaints/track` | — | Reference form, status timeline, not-found and error states. | 4 |
| `/grievances` | — | Category cards, long form, success panel, **remove CPGRAMS/SMS claims**. | 4 |
| `/feedback` | — | Rating groups, anonymous path, consent, success. | 4 |
| `/feedback/[departmentId]` | — | Same form with preselected department chip. | 4 |
| `/contact` | — | Contact cards, department contacts, form, map alternative. | 4 |
| `/faqs`, `/forms`, `/health-tips`, `/insurance`, `/patient-rights`, `/privacy`, `/terms`, `/accessibility`, `/sitemap` | — | Shared `ContentLayout`: hero, prose 72ch, sticky ToC ≥xl, last-reviewed line. Fix `href="#"` downloads. Generate sitemap from navigation config. | 4 |

### 7.2 Auth

| Route | Work | Phase |
|---|---|---|
| `/login` | AuthShell, show/hide password, session-expired banner, safe redirect, demo credentials only in dev-with-flag. | 5 |
| `/register` | AuthShell, strength meter with text, inline validation, focus first invalid. | 5 |
| `/forgot-password` | AuthShell, anti-enumeration copy, help-desk fallback (no false "email sent"). | 5 |

### 7.3 Admin

| Route | Design | Work | Phase |
|---|---|---|---|
| `/admin` | admin-m, admin-d | **New page.** Dashboard: KPI strip, needs-attention triage preview, department roster, blood/O− alert, audit feed, export. | 5 |
| `/admin/complaints` | triage-m + griev-m | Triage section on top, filter bar, cards ≥lg / stacked <lg, photo dialog, status history, export. Keep test's grid contract. | 5 |
| `/admin/grievances` | griev-d | **New page.** KPI tiles, SLA filter, workflow strips, resolve/update flows. | 5 |
| `/admin/doctors` | — | Table → cards <lg, add/edit dialog (edit is missing today), delete confirm. | 5 |
| `/admin/nodal-officers`, `/admin/staff` | — | Shared `DataList` + access dialog; role gate. | 5 |
| `/feedback/inbox` | — | Stats, filters, cards, status actions, access panel, share links. | 5 |
| `/admin/*` shell | admin-m, admin-d | Sidebar ≥lg, bottom nav <lg, skip link, `noindex`, role gate. | 2 |

---

## 8. Phased delivery

Every phase ends with: `npm run build`, `npm test`, `npm run lint`, `npm run schema:check`, `npm run ui:verify` green, and one commit per coherent unit.

### Phase 0 — Stop the bleeding (0.5–1 day)

| Task | Files | Acceptance |
|---|---|---|
| Remove `{metadata}` from JSX in 3 detail pages; export real metadata | `app/doctors/[id]/page.tsx`, `app/notices/[id]/page.tsx`, `app/services/[id]/page.tsx` | Detail routes render; `next build` emits metadata |
| `/grievances/track` → `/complaints/track` | `components/GrievanceForm.tsx:144,290` | No dead link |
| Footer service slugs → `/services` until slugs exist | `components/Footer.tsx` | 8 links resolve |
| Replace every `href="#"` in `/forms` with a disabled "Not available" state | `app/forms/page.tsx` | No fake download |
| Add full `success`/`warning`/`danger` 50–950 ramps | `tailwind.config.ts` | 110 utilities generate CSS |
| Add `app/not-found.tsx` | new | Correct 404 status |
| Add `#main-content` to login/register/error/global-error | 4 files | Skip link works |
| Hide demo credentials unless `NODE_ENV !== 'production' && NEXT_PUBLIC_SHOW_DEMO` | `app/login/page.tsx` | No prod credentials |

**Gate:** the three detail routes load; grep finds zero `href="#"` and zero `/grievances/track`.

### Phase 1 — Foundation (2–3 days)

| Task | Acceptance |
|---|---|
| Fonts via `next/font/google` (`Atkinson_Hyperlegible_Next`, `Plus_Jakarta_Sans`) | Build succeeds; no Google request at runtime; `font-heading`/`font-sans` resolve |
| Token layer in `tailwind.config.ts` + `globals.css` (colours, radii, font sizes, container) | `bg-primary-600` is now `#006194`; surfaces available |
| `docs/DESIGN_SYSTEM.md` with the token table, component recipes, contrast pairs, do/don't | Doc reviewed |
| Update `UI_OUTLINE_PROMPT.md` §2.1 and §9.3 to point at the new system | No contradictory guidance |
| Build the 15 primitives in §6 (start with Container, PageHero, Section, Card, Button, Field, StatusBadge, Alert, Skeleton, EmptyState, ErrorState) | Unit tests per primitive; all exported from `@dh-araria/ui` |
| `scripts/check-ui-tokens.mjs` + baseline + `npm run ui:verify` | New violations fail CI; baseline only shrinks |
| Playwright + API fixtures + 9-width smoke spec | `npm run e2e` passes without a database |
| Route manifest check | `docs/route-manifest.json` matches the filesystem |
| Capture baseline screenshots of all 34 routes at 390/768/1440 | Stored under `docs/design/baseline/` |

**Gate:** build + tests + token gate + route manifest + Playwright baseline all green. **No page has been restyled yet.**

### Phase 2 — Shells (2 days)

| Task | Acceptance |
|---|---|
| Move public routes into `app/(public)/`; auth into `app/(auth)/` | Route manifest unchanged |
| `PublicShell`: sticky header, utility bar ≥md, emergency strip, mobile drawer, footer, bottom nav | No `pt-32` anywhere; `#main-content` present on every route |
| `AuthShell` | Login/register/forgot-password share it |
| `AdminShell`: sidebar ≥lg, top bar, bottom nav <lg | Tabs scroll horizontally on mobile |
| Delete 29 `Header`/`Footer` imports + 28 offsets | `grep -c "pt-32"` = 0 |
| Brand is a `<div>`, per-page `h1` is the only `h1` | Heading audit passes |
| Toaster repositioned (bottom-centre mobile above nav, top-right desktop) | No overlap with header |

**Gate:** Playwright nav test at 390 and 1440 (drawer, active state, bottom nav, skip link, scroll offset), axe zero critical on shell pages.

### Phase 3 — Public core (5–6 days, parallelisable by route family)

Home · Services (+detail) · Doctors (+detail) · Appointments · Blood bank (+request/donate) · Notices (+detail).

**Gate per route:** visual match at 390/1440, all five states (loading/empty/error/success/permission) implemented where relevant, axe clean, contrast asserted, no overflow at 320/1920.

### Phase 4 — Citizen services and content (4 days)

Complaint · Track · Grievances · Feedback (2 routes) · Contact · 9 content/legal routes.

**Gate:** keyboard-only completion of complaint + feedback; axe clean on all 17 routes; no dead links; content honesty pass signed off.

### Phase 5 — Auth and admin (4 days)

Login · Register · Forgot password · `/admin` · `/admin/complaints` · `/admin/grievances` · `/admin/doctors` · `/admin/nodal-officers` · `/admin/staff` · `/feedback/inbox`.

**Gate:** role gate verified per route, `noindex` present, mobile card layouts, photo dialog focus-trapped, export works.

### Phase 6 — Hardening (2–3 days)

- Full responsive sweep at 9 widths + 200 % zoom + 200 % text spacing + landscape.
- `prefers-reduced-motion` and forced-colours pass.
- Perf: font subsetting, AVIF/WebP assets, `sizes` audit, bundle analysis, LCP/CLS budgets.
- Visual snapshots committed; ratchet baseline reduced to zero for public routes.
- Update `docs/UI_OUTLINE_PROMPT.md`, `docs/ACCESSIBILITY.md`, `README` screenshots.

**Gate:** success criteria §1 all true; sign-off.

---

## 9. Execution model for agents

Parallelism is how this lands in 12 days — and how it goes wrong. Rules:

1. **Shared files are serialised.** `tailwind.config.ts`, `globals.css`, `packages/ui/**`, `components/layout/**` are owned by the Foundation agent until Phase 2 ends. No page agent edits them.
2. **One agent per route directory.** A page agent may create files under its own route folder and its own feature components. Anything shared goes through a request to the owner, not a drive-by edit.
3. **Context pointers, not repetition.** Every task prompt links: this plan, `ui-redesign-design-contract.md` §3–§6, `ui-redesign-inventory.md` §8, `docs/DESIGN_SYSTEM.md`. Do not paste the design tokens into each prompt.
4. **No workarounds.** If a primitive is missing, add it to `packages/ui` with a test — do not inline a one-off variant.
5. **Commit per coherent unit** (AGENTS.md habit). Small diffs recover cheaply.
6. **A page is not done because it looks right.** Done = §14 checklist.

Suggested parallel tracks after Phase 2:

| Track | Owner | Files |
|---|---|---|
| A | Home + blood bank | `app/(public)/page.tsx`, `blood-bank/**`, `components/home/**`, `components/blood/**` |
| B | Services + doctors | `app/(public)/services/**`, `doctors/**`, `components/services/**`, `components/doctors/**` |
| C | Appointments | `app/(public)/appointments/**`, `components/appointments/**` |
| D | Citizen services + content | `complaint/**`, `complaints/**`, `grievances/**`, `feedback/**`, `contact/**`, content routes |
| E | Admin | `app/admin/**`, `components/admin/**` |

Shared-file changes (nav labels, footer groups, new primitives) are batched into one "foundation v2" commit between phases.

---

## 10. Verification matrix

### 10.1 Commands

```bash
npm run build            # must pass at every phase boundary
npm test                 # jest, all workspaces
npm run lint
npm run schema:check
npm run ui:verify        # token ratchet + route manifest + type-check
npm run e2e              # Playwright, API fixtures, no DB
npm run e2e:a11y         # axe on 12 routes
npm run e2e:visual       # screenshots, 9 widths
```

### 10.2 Route coverage

| Group | Routes | Visual | Axe | Keyboard | 320 px | 1920 px |
|---|---|:--:|:--:|:--:|:--:|:--:|
| Public core | `/`, `/services`, `/services/[id]`, `/doctors`, `/doctors/[id]`, `/appointments`, `/blood-bank`, `/notices`, `/notices/[id]` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Citizen | `/complaint`, `/complaints/track`, `/grievances`, `/feedback`, `/contact` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Content | 9 legal/content routes | sample | ✅ | — | ✅ | ✅ |
| Auth | 3 routes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | 7 routes | ✅ | ✅ | ✅ | ✅ | ✅ |

### 10.3 Responsive assertions (automated)

For every route in the matrix:

- `document.documentElement.scrollWidth <= window.innerWidth` at 320/360/390/414/768/1024/1280/1440/1920.
- Header does not overlap the first `h1` (`getBoundingClientRect().top` of `h1` ≥ header bottom).
- Bottom nav visible below `lg`, absent at/above `lg`.
- Footer bottom ≥ viewport bottom − 1 px on short pages (viewport fill).
- Every `button`/`a`/`input` inside the main landmark has a hit area ≥ 44 px (allowlist inline text links).
- No element overflows its container horizontally.

### 10.4 Manual review

- Side-by-side with `screen.png` at 390 and 1440 for the 12 designed screens.
- 200 % zoom, 200 % text spacing, landscape phone, iOS Safari with safe areas.
- Screen-reader pass on booking and complaint flows (NVDA or VoiceOver).
- Reduced-motion pass: carousel does not autoplay; animations ≤ 0.01 ms.

---

## 11. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|--:|---|:--:|:--:|---|
| 1 | Detail-route crash blamed on redesign | High | Medium | Phase 0 fixes it first |
| 2 | Palette remap degrades contrast somewhere unmeasured | Medium | High | Contrast pairs table + Playwright contrast assertion + axe |
| 3 | Route-group move changes a URL | Low | High | Route manifest check; URLs are file-system-independent for groups |
| 4 | Parallel agents conflict on shared files | High | High | File-ownership matrix; foundation agent owns shared files |
| 5 | `Button.test.tsx` breaks on class change | Medium | Low | Recolour scale, keep class names; update tests deliberately |
| 6 | Admin table/card test breaks on restyle | Medium | Medium | Preserve grid/truncation contract or rewrite test in the same commit |
| 7 | Sticky header + mobile bottom nav cover content | Medium | High | CSS variables, `flex min-h-dvh`, safe-area padding, automated overlap assertions |
| 8 | Stitch statistics shipped as fact | High | High | `SITE_FACTS` + honesty review gate in Phase 4 |
| 9 | Photos unusable (Indore signage, NABL sign, licence) | High | Medium | Use MCH + lab only with crop; fallback to branded panel; commission Araria photo |
| 10 | Scope creep into new features (`/admin`, account area) | High | Medium | `/admin` and `/admin/grievances` are explicitly scoped; account area is out of scope |
| 11 | Fonts fail to build or cause CLS | Low | Medium | `next/font` self-hosts with `display: swap`; verified in Phase 1 |
| 12 | No backend during UI work | High | Medium | Playwright API fixtures; frontend runs standalone |
| 13 | Mobile admin unusable with real data volumes | Medium | High | Card layout, pagination, filter sheet, 50-row test fixture |
| 14 | Accessibility regressions from custom components | Medium | High | Primitives tested once; axe gate per route |
| 15 | Token ratchet blocks legitimate work | Low | Low | Baseline per file, allowlist escape hatch with a reason comment |

---

## 12. Environment improvements (make the next task easier)

These are as important as the pixels.

1. **`docs/DESIGN_SYSTEM.md`** — the contract reviewers enforce: tokens, component recipes, states, contrast pairs, do/don't. Any deviation needs an ADR.
2. **Token ratchet** (`scripts/check-ui-tokens.mjs`) — counts banned patterns per file; CI fails if a count rises. New files start at zero. This is how raw `bg-blue-*` stops coming back.
3. **Route manifest** (`docs/route-manifest.json` + check script) — makes route-group refactors and accidental deletions impossible to miss.
4. **Playwright + API fixtures** — deterministic screenshots and a11y runs with no database. Unblocks UI work entirely from backend availability.
5. **Design QA route** (`/__ui`, `E2E`-only) — one page rendering every primitive in every state and width. Screenshot-tested.
6. **Screenshot archive** (`docs/design/<date>/<route>-<width>.webp`) — visual history in git, not in someone's Downloads folder.
7. **Issue template for UI** — requires: route, design source, states, widths, a11y notes. Prevents "make it nicer" tickets.
8. **Cadence**
   - Every PR: `ui:verify` + affected Playwright specs.
   - Weekly: 9-width visual diff + axe sweep; triage drift in one issue.
   - Per phase: side-by-side design review at 390/1440.
   - Monthly: dependency, font and image-licence audit; re-check `docs/LAUNCH-READINESS.md`.

---

## 13. Open decisions (need a human answer before the phase noted)

| # | Decision | Options | Recommendation | Needed by |
|--:|---|---|---|---|
| 1 | Facility facts | 150 vs 300 beds; OPD 08:00–14:00 vs 08:30–13:30; fee ₹0/₹2/₹5/₹15 | One `HOSPITAL` config signed off by the hospital | Phase 3 |
| 2 | Accreditation claims | "NABL Accredited", "NQAS", "GIGW certified", "HMIS Synced", "ABHA Linked" | Ship only evidenced claims; use "NABL standard" / "Accessibility commitment" | Phase 3 |
| 3 | Blood request | Build the backend table + endpoint, or phone-only page | Phone-only now; build later | Phase 3 |
| 4 | Service slugs | Add slug lookup, or drop slug URLs | Add slug lookup (small backend change) | Phase 3 |
| 5 | Trauma photo | It shows Indore signage | Do not use; use MCH + lab, fallback panel | Phase 3 |
| 6 | Logo | Bundle has none | Use existing `icon.svg` lockup; commission an official emblem later | Phase 2 |
| 7 | Admin gating | Current auth is localStorage; no server-side role check | Client `RequireRole` + API enforcement now; cookie session later | Phase 5 |
| 8 | Account area | `/account/*` is planned in `UI_OUTLINE_PROMPT.md` | Out of scope for this redesign; separate phase | — |

---

## 14. Page definition of done

A route is done only when all are true:

- [ ] Matches the design contract at 390 and 1440; no off-token colour, radius or spacing.
- [ ] Layout defined and reviewed at 320, 360, 414, 768, 1024, 1280, 1536, 1920.
- [ ] No horizontal scroll at any width; long content wraps or truncates with a title.
- [ ] Footer sits at the viewport bottom on short content.
- [ ] Loading (skeleton), empty, error+retry, success, permission states implemented.
- [ ] One `h1`, logical heading order, landmarks, skip link works.
- [ ] Keyboard-only completion of the primary task; visible focus; focus moved on step/success/dialog.
- [ ] Touch targets ≥ 44 px; inputs ≥ 16 px on mobile.
- [ ] axe: zero serious/critical; contrast pairs measured.
- [ ] `prefers-reduced-motion` honoured; no autoplay without a pause control.
- [ ] No `href="#"`, no non-existent route, no unsubmitted form, no invented statistic.
- [ ] `aria-current="page"` on the active nav item; nav/footer render from `navigation.ts`.
- [ ] Metadata correct; admin/account/tracking `noindex`.
- [ ] Screenshot committed; `ui:verify` and the page's Playwright spec green.

---

## Appendix A — file-level change map

| Area | Files | Change |
|---|---|---|
| Tokens | `apps/frontend/tailwind.config.ts`, `src/styles/globals.css` | Palette ramp, surfaces, radii, font sizes, container, focus ring, reduced motion |
| Fonts | `src/app/layout.tsx` | `next/font` variables, `bg-surface`, flex column, Toaster |
| Shell | `src/app/(public)/layout.tsx`, `(auth)/layout.tsx`, `admin/layout.tsx`, `src/components/layout/**` | New shells; delete `Header`/`Footer` usages from pages |
| Config | `src/config/hospital.ts`, `navigation.ts`, `src/lib/content.ts` | New |
| Primitives | `packages/ui/src/components/**` | Extend + add §6 components; export barrel |
| Pages | 34 route files | Remove shell imports/offsets; compose primitives |
| Tests | `packages/ui/**/*.test.tsx`, `apps/frontend/src/**/*.test.tsx`, `e2e/**` | New primitive + e2e tests; update pinned class assertions |
| Tooling | `scripts/check-ui-tokens.mjs`, `scripts/check-routes.mjs`, `package.json`, `playwright.config.ts`, `e2e/fixtures/**` | New gates and fixtures |
| Docs | `docs/DESIGN_SYSTEM.md`, `docs/plans/**`, `docs/UI_OUTLINE_PROMPT.md`, `docs/ACCESSIBILITY.md` | New + updated |

## Appendix B — commit sequence (illustrative)

```
fix(frontend): stop rendering metadata objects in three detail pages
fix(frontend): remove the dead grievance-track link and slug footer links
fix(ui): add the missing success/warning/danger colour ramps
feat(ui): add design tokens, fonts and container rules
feat(ui): add the primitive component library with tests
test(e2e): add Playwright, API fixtures and the responsive smoke matrix
chore(ui): add the token ratchet and route manifest gates
refactor(layout): move routes into public and auth groups with shared shells
feat(public): rebuild the home page on live data
feat(public): rebuild services and service detail
feat(public): rebuild doctors and doctor detail
feat(public): rebuild the appointment wizard
feat(public): rebuild blood bank, notices and their detail pages
feat(public): rebuild complaint, grievance, feedback and contact flows
feat(content): add the shared content layout and fix download links
feat(auth): rebuild login, register and forgot password
feat(admin): add the admin shell and dashboard
feat(admin): rebuild complaint triage and add the grievance desk
chore(ui): harden responsive, motion and performance; update docs
```
