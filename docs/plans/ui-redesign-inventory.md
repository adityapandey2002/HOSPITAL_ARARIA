# UI Redesign Inventory — `apps/frontend` + `packages/ui`

**Snapshot:** `ed410c6 feat(complaints): attach photos to existing complaints from the admin card`
**Scope:** `apps/frontend/src/**` and `packages/ui/src/**` (node_modules, `.next`, `dist`, `coverage` excluded).
**Method:** static read only; counts are string occurrences in `.tsx/.ts/.css`, so a class that appears twice in one line counts twice.
**Reading this doc:** "own" shell = the page file itself imports `<Header/>`/`<Footer/>`; "layout" = inherited from `app/admin/layout.tsx`; "—" = none.

---

## 1. Route inventory (34 routes)

| Route | Page file | LOC | Shell | `<main>` className | Page hero | Client | Metadata |
|---|---|---|--:|---|---|:--:|:--:|
| `/` | `app/page.tsx` | 33 | own | `min-h-screen` (no offset) | gradient (in `Hero`) | N | ✅ |
| `/accessibility` | `app/accessibility/page.tsx` | 57 | own | `min-h-screen bg-gray-50 pt-32` | primary-600 | N | ✅ |
| `/admin/complaints` | `app/admin/complaints/page.tsx` | 14 | layout | layout `pt-32 bg-gray-50` | primary-700 | N | ✅ |
| `/admin/doctors` | `app/admin/doctors/page.tsx` | 467 | layout | layout `pt-32 bg-gray-50` | primary-700 | **Y** | ❌ |
| `/admin/nodal-officers` | `app/admin/nodal-officers/page.tsx` | 11 | layout | layout | primary-700 | N | ❌ (redirect) |
| `/admin/staff` | `app/admin/staff/page.tsx` | 15 | layout | layout `pt-32 bg-gray-50` | primary-700 | N | ✅ |
| `/appointments` | `app/appointments/page.tsx` | 33 | own | `min-h-screen pt-32` | primary-600 | N | ✅ |
| `/blood-bank` | `app/blood-bank/page.tsx` | 33 | own | `min-h-screen pt-32` | danger-600 | N | ✅ |
| `/blood-bank/donate` | `app/blood-bank/donate/page.tsx` | 100 | own | `min-h-screen bg-gray-50 pt-32` | danger-600 | N | ✅ |
| `/blood-bank/request` | `app/blood-bank/request/page.tsx` | 135 | own | `min-h-screen bg-gray-50 pt-32` | danger-600 | N | ✅ |
| `/complaint` | `app/complaint/page.tsx` | 49 | own | `min-h-screen bg-gray-50 pt-32` | warning-600 | N | ✅ |
| `/complaints/track` | `app/complaints/track/page.tsx` | 189 | own | `min-h-screen bg-gray-50 pt-32` | primary-700 | **Y** | route-layout¹ |
| `/contact` | `app/contact/page.tsx` | 33 | own | `min-h-screen pt-32` | primary-600 | N | ✅ |
| `/doctors` | `app/doctors/page.tsx` | 33 | own | `min-h-screen pt-32` | primary-600 | N | ✅ |
| `/doctors/[id]` | `app/doctors/[id]/page.tsx` | 224 | own | `min-h-screen bg-gray-50 pt-32` | primary-600 | N | ❌² |
| `/faqs` | `app/faqs/page.tsx` | 22 | own | `min-h-screen bg-gray-50 pt-32` | **none** | N | ✅ |
| `/feedback` | `app/feedback/page.tsx` | 59 | own | `min-h-screen bg-gray-50 pt-32` | primary-700 | N | ✅ |
| `/feedback/[departmentId]` | `app/feedback/[departmentId]/page.tsx` | 67 | own | `min-h-screen bg-gray-50 pt-32` | primary-700 | N | ✅ |
| `/feedback/inbox` | `app/feedback/inbox/page.tsx` | 33 | own | `min-h-screen bg-gray-50 pt-32` | primary-700 (py-10) | N | ✅ |
| `/forgot-password` | `app/forgot-password/page.tsx` | 21 | own | `min-h-screen bg-gray-50 pt-32` | **none** | N | ✅ |
| `/forms` | `app/forms/page.tsx` | 88 | own | `min-h-screen bg-gray-50 pt-32` | primary-600 | N | ✅ |
| `/grievances` | `app/grievances/page.tsx` | 33 | own | `min-h-screen pt-32` | warning-600 | N | ✅ |
| `/health-tips` | `app/health-tips/page.tsx` | 68 | own | `min-h-screen bg-gray-50 pt-32` | primary-600 | N | ✅ |
| `/insurance` | `app/insurance/page.tsx` | 69 | own | `min-h-screen bg-gray-50 pt-32` | primary-600 | N | ✅ |
| `/login` | `app/login/page.tsx` | 222 | **—** | none (`div pt-32`) | **none** | **Y** | ❌ |
| `/notices` | `app/notices/page.tsx` | 33 | own | `min-h-screen pt-32` | primary-600 | N | ✅ |
| `/notices/[id]` | `app/notices/[id]/page.tsx` | 132 | own | `min-h-screen bg-gray-50 pt-32` | primary-600 | N | ❌² |
| `/patient-rights` | `app/patient-rights/page.tsx` | 57 | own | `min-h-screen bg-gray-50 pt-32` | primary-600 | N | ✅ |
| `/privacy` | `app/privacy/page.tsx` | 71 | own | `min-h-screen bg-gray-50 pt-32` | primary-600 | N | ✅ |
| `/register` | `app/register/page.tsx` | 330 | **—** | none (`div pt-32`) | **none** | **Y** | ❌ |
| `/services` | `app/services/page.tsx` | 35 | own | `min-h-screen pt-32` | primary-600 | N | ✅ |
| `/services/[id]` | `app/services/[id]/page.tsx` | 226 | own | `min-h-screen bg-gray-50 pt-32` | primary-600 | N | ❌² |
| `/sitemap` | `app/sitemap/page.tsx` | 65 | own | `min-h-screen bg-gray-50 pt-32` | primary-600 | N | ✅ |
| `/terms` | `app/terms/page.tsx` | 77 | own | `min-h-screen bg-gray-50 pt-32` | primary-600 | N | ✅ |

¹ `app/complaints/track/layout.tsx` exists only to export `metadata` because the page is a client component (comment at lines 3–10).
² The page builds a `const metadata` object but **renders it as a React child**: `app/doctors/[id]/page.tsx:91`, `app/notices/[id]/page.tsx:66`, `app/services/[id]/page.tsx:104` each open their JSX with `<>{metadata}`. React throws "Objects are not valid as a React child" — these three detail routes crash whenever the record exists (and because they are rendered inside `<>`, `export const metadata` is not used either).

Non-route files: `app/layout.tsx` (91), `app/error.tsx` (61, client, no shell), `app/global-error.tsx` (69, client, inline styles only). There is **no `not-found.tsx` and no `loading.tsx` anywhere**.

**Hero dialects (5 variants for the same concept):**

| Variant | Padding / label size | Pages |
|---|---|---|
| A | `py-16`, `text-4xl sm:text-5xl`, centered | appointments, contact, doctors, notices, services, blood-bank |
| A' | A + `sm:py-20` | blood-bank/donate, blood-bank/request, complaint, doctors/[id], services/[id] |
| B | `py-12 sm:py-16`, `text-3xl sm:text-4xl`, left | accessibility, forms, health-tips, insurance, patient-rights, privacy, sitemap, terms, notices/[id] |
| C | B centered, `bg-primary-700` | feedback, feedback/[departmentId], complaints/track |
| D | `py-10 sm:py-12`, `bg-primary-700` (admin layout) | admin/*, feedback/inbox |
| — | no hero at all | home, faqs, forgot-password, login, register |

---

## 2. Shell problems

**Duplication**

| Metric | Count | Evidence |
|---|--:|---|
| Files importing both `Header` + `Footer` | 29 | 28 pages + `app/admin/layout.tsx` |
| `<Header />` / `<Footer />` JSX instances | 56 | same 29 files |
| Routes covered by the fixed shell | 32 / 34 | only `/login`, `/register` opt out |
| `<main … pt-32>` occurrences | 28 | see §1 |
| Total `pt-32` strings (incl. non-`main`) | 32 | + `Hero.tsx:15`, `login/page.tsx:43` & `:98`, `register/page.tsx:110` |
| Files that should use a shared layout | 29 | `apps/frontend/src/app/**/page.tsx` |

**The fixed-header offset is wrong at every breakpoint**

- `Header` is `fixed left-0 right-0 top-0 z-40` (`components/Header.tsx:69` and `:157`).
- Its height is **64 px** below `md` (`h-16` at `Header.tsx:100`/`:205`, top bar `hidden … md:flex` at `:74`/`:162`) and **~100 px** at `md+` (36 px top bar from `px-4 py-2 text-sm` + 64 px nav).
- `pt-32` = **128 px**. So the gap under the header is **64 px on mobile and 28 px on desktop** — a value that matches neither state, and the mismatch is visible as a band of body background above every coloured hero.
- Nothing compensates for zoom / large text: the top bar's three items (`Header.tsx:163–176`) are untruncated flex children with no `min-w-0`/`flex-wrap`, so at large text sizes or ~150 % zoom the bar wraps, the fixed header grows past 128 px, and it starts covering hero text.
- `pt-32` is repeated per page instead of being one layout rule, so any header change is a 28-file edit.
- `Hero.tsx:15` applies `pt-32` *inside* `min-h-screen`, so the home page's first paint is taller than the viewport and the "scroll" indicator (`Hero.tsx:121`) sits below the fold on short laptops.
- **Zero `scroll-mt-*` / `scroll-padding-top` in the repo.** The skip link (`app/layout.tsx:82`) and the footer "back to top" (`components/Footer.tsx:285`) both jump to `#main-content`, which lands under the fixed header.
- Skip-link target is missing entirely on `/login`, `/register`, `error.tsx`, `global-error.tsx` — `id="main-content"` does not exist there.

**Other shell defects worth knowing before a restyle**

| Issue | Where | Why it matters |
|---|---|---|
| Header markup duplicated twice | `Header.tsx:66–151` (loading) vs `:154–369` | 86-line near-duplicate of the whole shell; both must be edited |
| Brand wordmark disappears at 1280–1535 px | `Header.tsx:109`, `:215` — `hidden sm:block xl:hidden 2xl:block` | Desktop nav only appears at `xl` (`:222`); the wordmark is hidden exactly when the nav appears, so that band shows icon-only |
| 11 top-level nav links | `Header.tsx:21–33` | Fits only because the wordmark is hidden at `xl`; adding one link overflows an `max-w-7xl` container |
| Footer "Back to top" is permanently invisible | `Footer.tsx:285` — `invisible … group-hover:visible` but no ancestor has `group` | Dead control, `z-50`, `bottom-6 right-6` (will collide with a mobile bottom nav) |
| Footer link hover declares two colours | `Footer.tsx:120,137,154,171` — `hover:text-primary-400 hover:text-white` | Non-deterministic hover colour |
| Desktop nav breakpoint is `xl` (1280 px) | `Header.tsx:222`, `:275` | 1024–1279 px laptops get the hamburger + full-height menu |
| Mobile menu is `max-h-[85vh]` | `Header.tsx:290` | 85 vh **plus** the 64 px header, no body-scroll lock — menu scroll and page scroll fight each other |
| Header uses `bg-blue-*`, not the palette | `Header.tsx:74,106,162,212,…` | 17 of the app's 33 `bg-blue-*` hits; sweeping the shell to `primary-*` is the cheapest first restyle |

---

## 3. Data layer per page

`src/lib/api.ts` (319 LOC) exports exactly three things: `api` (class singleton, line 304), `handleApiResponse` (307) and `fetcher` (315). **`fetcher` is never imported anywhere; `swr` is a dependency but there is not one `useSWR` call in the codebase** — every client fetch is `useEffect` + `api.get`.

The class exposes 32 typed helpers (`getDoctors`, `getDepartments`, `getBloodStock`, `getNotices`, `getComplaints`, …); **23 of them are never called**. Components call the generic `api.get('/doctors')` instead.

| Route | Data source | Calls | Loading | Empty | Error |
|---|---|:--:|:--:|:--:|:--:|
| `/` | 6 client components with hard-coded mock arrays | none | — | — | — |
| `/appointments` | `AppointmentBooking` (client, `useEffect`) | `GET /departments`, `GET /doctors`, `GET /doctors/:id/slots`, `bookAppointment` | ✅ | ✅ | ✅ (toast) |
| `/doctors` | `DoctorsList` (`useEffect`, `:98–116`) | `GET /doctors?limit=100` | ✅ | ✅ | ❌ `catch → setDoctors([])` |
| `/doctors/[id]` | **server component** (`:59–73`) | `GET /doctors/:id` | ❌ no `loading.tsx` | n/a | `catch → notFound()` |
| `/services` | `DepartmentsList` (`:86–117`) + static `EmergencyServices` | `GET /departments?limit=100` | partial (text swap) | ❌ | ❌ |
| `/services/[id]` | **server** | `GET /departments/:id` | ❌ | n/a | `notFound()` |
| `/notices` | `NoticesList` (`:91–109`) | `GET /notices/published?limit=50` | ✅ | ✅ | ❌ `catch → []` |
| `/notices/[id]` | **server** | `GET /notices/:id` | ❌ | n/a | `notFound()` |
| `/blood-bank` | `BloodBankInventory` (`:84–101`) | `GET /blood-bank` | ✅ | ✅ | ✅ + retry |
| `/blood-bank/request`, `/donate` | static form / static copy | none | — | — | — |
| `/complaint` | `ComplaintForm` | `GET /departments`, `POST /complaints` | submit only | n/a | toast |
| `/complaints/track` | page itself | `api.trackComplaint` | submit only | n/a | inline message |
| `/grievances` | `GrievanceForm` | `api.submitGrievance` | submit only | n/a | toast |
| `/contact` | `ContactPage` | `api.submitContactMessage` | submit only | n/a | toast |
| `/feedback`, `/feedback/[departmentId]` | `SimpleFeedbackForm` / `FeedbackForm` | `GET /departments`, `POST /feedback` | ❌ departments | ❌ | toast |
| `/feedback/inbox` | `FeedbackInbox` (837 LOC) | `GET /feedback/scope`, `/users`, `/feedback`, `/feedback/stats`, `PATCH …/status`, `GET/POST/DELETE /feedback/access` | ✅ | ✅ | ✅ |
| `/admin/complaints` | `AdminComplaintsPanel` (990 LOC) | `GET /departments`, `/complaints/stats`, `/complaints`, `PATCH …/status`, `PATCH …/photo` | ✅ | ✅ | ✅ |
| `/admin/staff` | `StaffAccessPanel` | `GET /admin/staff`, `GET /departments`, `POST /admin/staff`, `PATCH /admin/staff/:id` | ✅ | ✅ | ✅ |
| `/admin/doctors` | page itself (`:45–84`) | `GET /admin/doctors`, `/departments`, `POST`, `DELETE` | ✅ | ✅ | toast only (`any`-typed catch) |
| `/login`, `/register` | `AuthContext` | `api.login` / `api.register` | submit only | n/a | toast + inline |
| `/forgot-password` | `ForgotPasswordForm` | `POST /auth/forgot-password` | submit only | n/a | inline |
| Static (no fetch) | `accessibility`, `faqs`, `forms`, `health-tips`, `insurance`, `patient-rights`, `privacy`, `sitemap`, `terms` | none | n/a | n/a | n/a |

**No loading / empty / error state at all:** `/faqs`, `/forms`, `/health-tips`, `/insurance`, `/patient-rights`, `/privacy`, `/sitemap`, `/terms`, `/accessibility`, `/blood-bank/donate`, `/blood-bank/request`, `/admin/nodal-officers`.

**Fetches but silently degrades to "empty":** `/doctors` (`DoctorsList.tsx:106–108`), `/notices` (`NoticesList.tsx:99–101`), `/services` (`DepartmentsList.tsx:107–109`). A backend outage is indistinguishable from "no records".

**Server-fetched detail routes have no `loading.tsx`,** so the whole route blocks on the API (axios `timeout: 30000`, `api.ts:22`).

**Broken link:** `GrievanceForm.tsx:144` and `:290` navigate to `/grievances/track`, a route that does not exist (the real route is `/complaints/track`).

---

## 4. Component inventory

### `apps/frontend/src/components` (26 components, 3 subfolders)

| Component | LOC | C/S | Props | Reuse | Hard-coded copy / mock data |
|---|--:|:--:|---|:--:|---|
| `Header.tsx` | 372 | C | — | 29 | 11 nav links (`:21`), address, 3 phone numbers, `loading` branch markup duplicated |
| `Footer.tsx` | 294 | C | — | 29 | 4 link groups (32 links; the 8 `/services/<slug>` links cannot resolve against the UUID-keyed `/services/[id]` route), 4 socials, "since 1985", 3 accreditation chips |
| `Hero.tsx` | 129 | C | — | 1 | 4 stats (300+ beds, 50+ doctors, 15+ departments), 3 trust badges |
| `Features.tsx` | 166 | C | — | 1 | 6 feature cards |
| `Departments.tsx` | 198 | C | — | 1 | **15 mock departments**, bed counts |
| `Doctors.tsx` | 242 | C | — | 1 | **6 mock doctors with fake ratings/review counts/fees** |
| `BloodBank.tsx` | 245 | S | — | 1 | 8 blood groups with invented unit counts + statuses |
| `Notices.tsx` | 250 | C | — | 1 | 5 mock notices |
| `EmergencyServices.tsx` | 207 | C | — | 1 | 4 services with phone numbers |
| `AppointmentBooking.tsx` | 551 | C | — | 1 | 3 appointment types, 3 steps, fee copy |
| `BloodBankInventory.tsx` | 463 | C | — | 1 | table copy, eligibility text |
| `ContactPage.tsx` | 368 | C | — | 1 | 7 subject options, 4 contact cards, 6 emergency numbers |
| `DepartmentsList.tsx` | 192 | C | — | 1 | colour palette map, "0 beds" placeholder (`:103`) |
| `DoctorsList.tsx` | 289 | C | — | 1 | department filter derived from data; no static doctor data |
| `NoticesList.tsx` | 305 | C | — | 1 | 6 category labels |
| `GrievanceForm.tsx` | 300 | C | — | 1 | 7 categories, CPGRAMS copy, 30-day SLA copy |
| `Providers.tsx` | 14 | C | `children` | 1 | — (wires `LanguageProvider` + `AuthProvider`) |
| `admin/StaffAccessPanel.tsx` | 625 | C | — | 1 | copy only |
| `complaints/AdminComplaintsPanel.tsx` | 990 | C | — | 1 | copy only; **largest file in scope** |
| `complaints/ComplaintForm.tsx` | 518 | C | `initialDepartmentId?: string` | 1 | copy only |
| `feedback/FeedbackInbox.tsx` | 837 | C | — | 1 | 3 per-item rating criteria, filter labels |
| `feedback/FeedbackForm.tsx` | 575 | C | `initialDepartmentId?: string` | 2 | 4 rating dimensions (overall, cleanliness, staff behaviour, wait time) |
| `feedback/SimpleFeedbackForm.tsx` | 415 | C | `initialDepartmentId?: string` | 1 | 4 rating dimensions |
| `feedback/FeedbackAccessPanel.tsx` | 351 | C | `departments: ScopeDepartment[]` | 1 | copy |
| `feedback/FeedbackShareLinks.tsx` | 113 | C | `departments: Array<{id,name}>` | 1 | copy |
| `feedback/RatingStars.tsx` | 186 | C | `StarRatingInput{name,legend,value,onChange,allowSkip?,required?,hint?,error?,size?}`; `RatingDisplay{value,className?}` | 3 | star sizes map |

Reuse verdict: **only `Header`/`Footer` (29 each), `RatingStars` (3) and `FeedbackForm` (2) are genuinely shared.** Every other component is one-off and used by exactly one route. The home page is 6 one-off mock-data sections; `/doctors` and `/services` render *different* components with the *same* visual language but live data (`DoctorsList` vs `Doctors`, `DepartmentsList` vs `Departments`) — a redesign must reconcile those pairs, not just restyle them.

### `packages/ui/src` (10 components, 317-line hooks file, 142-line utils)

| Component | LOC | C/S | Props | Used in app | Notes |
|---|--:|:--:|---|:--:|---|
| `Button.tsx` | 77 | C | `variant` (7), `size` (4), `loading`, native button props | **30 call-sites** | Class names asserted by tests (§6) |
| `Input.tsx` | 73 | C | `label,error,hint,leftIcon,rightIcon` + input props | 11 | Uses `danger-500/600` (valid) |
| `Select.tsx` | 73 | C | `label,error,hint,placeholder,options[]` | 9 | Inline SVG data-URL background (`:35`) |
| `Textarea.tsx` | 57 | C | `label,error,hint` | 4 | `min-h-[100px]` (`:31`) |
| `Badge.tsx` | 66 | C | `variant` (7), `size` (3), `dot` | 4 | **`success/warning/danger` variants use non-existent `-800` shades (`:25–27`)** |
| `Table.tsx` | 296 | C | `columns,data,keyExtractor,onRowClick,loading,emptyMessage,striped,hoverable,bordered,compact,pagination,sortConfig,onSort,selection` | 3 | Inline widths `100px`/`80px` (`:108`,`:123`); own `overflow-x-auto` wrapper |
| `Avatar.tsx` | 127 | C | `src,alt,name,size,shape` | 1 | Colour hash palette |
| `Alert.tsx` | 102 | C | `variant,title,dismissible,onDismiss` | **0** | `success/warning/danger` use missing `-200`/`-800` (`:19–21`) |
| `Card.tsx` | 112 | C | `variant,padding` (+ 5 sub-components) | **0** | Dead |
| `Modal.tsx` | 133 | C | `isOpen,onClose,title,description,children,size,showCloseButton,…` | **0** | Dead; `z-50` (`:71`), mutates `body.style.overflow` (`:44–49`) |
| `hooks/index.ts` | 317 | — | 12 hooks (`useLocalStorage`, `useDebounce`, `useBreakpoints`, `useAsyncState`, `useForm`, …) | 0 imported | Dead |
| `utils/index.ts` | 142 | — | `cn`, formatters, `getAvatarColor`, debounce/throttle | only `cn` | — |

`Alert`, `Card`, `Modal` and the entire hooks barrel are dead code — there is no shared dialog, card or alert primitive in actual use, which is why each page re-invents modals (`admin/doctors:313`, `StaffAccessPanel:446`, `AdminComplaintsPanel:950` all hand-roll `fixed inset-0 z-50`).

---

## 5. Styling conventions and debt

| Token | Occurrences (whole scope) | Comment |
|---|--:|---|
| `text-gray-*` | **554** | Dominant text system; 7 shades in play (300–900) |
| `bg-gray-*` | **140** | |
| `bg-white` | **159** | |
| `text-white` | 96 | Mostly on coloured heroes/buttons |
| `border-gray-*` | 169 | |
| `bg-primary-600` | **40** | 2 of them in `globals.css` (`.skip-link`, `.btn-primary`) |
| `bg-blue-*` (raw Tailwind) | **33** | `bg-blue-600` = 7 (Header 5, `BloodBank.tsx` 2); rest = `blue-50/100/700/800` |
| `rounded-2xl` | 96 | vs `rounded-xl` 96, `rounded-lg` 62 — no radius rule |
| `shadow-sm/md/lg/xl/2xl` | 71 | |
| `bg-gradient-*` | 6 | `Hero` ×3, `ContactPage:227`, `EmergencyServices:150`, `AdminComplaintsPanel:213` |
| `style={…}` | 22 | 6 in `global-error.tsx`, 3 in `ui/Table.tsx`, 11 are `animationDelay` |
| `text-[…]` | 7 | all in `AdminComplaintsPanel`/`StaffAccessPanel` (`text-[10px]`, `text-[11px]`) |
| `w-[…] / h-[…] / max-w-[…]` | 3 / 7 / 1 | `min-w-[200px]`, `max-w-[300px]`, `max-h-[85vh]`, `max-w-[300px]` |
| `p-[…]` | **0** | |
| arbitrary `[…px]` values | 14 | incl. `Table.tsx` inline widths |
| `pt-32` | 32 | see §2 |
| `max-w-7xl` | 1 | only `globals.css:84` |
| `container mx-auto px-4` | **81** | defeats the container's responsive padding (see below) |

**Biggest offenders by file** (combined `text-gray` + `bg-gray` + `bg-white`):

| File | LOC | Neutral classes | `bg-blue-*` | `rounded-2xl` |
|---|--:|--:|--:|--:|
| `components/complaints/AdminComplaintsPanel.tsx` | 990 | 48 | 0 | 9 |
| `components/feedback/FeedbackInbox.tsx` | 837 | 42 | 0 | 11 |
| `components/Header.tsx` | 372 | 39 | **17** | 0 |
| `components/BloodBankInventory.tsx` | 463 | 38 | 0 | 9 |
| `app/admin/doctors/page.tsx` | 467 | 37 | 0 | 1 |
| `components/admin/StaffAccessPanel.tsx` | 625 | 35 | 0 | 5 |
| `components/BloodBank.tsx` | 245 | 29 | 3 | 5 |
| `components/NoticesList.tsx` | 305 | 26 | 0 | 2 |

**Is remapping the Tailwind palette a viable lever? Mostly yes, with three caveats.**

1. **Yes for the brand colours.** `bg-primary-600` is used 40×, and `text-primary-600` 74×; a palette remap in `tailwind.config.ts:15–61` restyles the whole site. Semantic tokens (`primary/secondary/success/warning/danger`) exist for exactly this.
2. **No for the 110 dead shade references.** `tailwind.config.ts` defines only `50,100,500,600,700` for `success`/`warning`/`danger` (`:41–61`), but the code uses `200/300/400/800/900` **110 times**: `text-danger-800` ×21, `border-danger-200` ×22, `border-success-200` ×14, `text-success-800` ×7, `text-warning-800` ×8, `text-warning-900` ×7, plus `danger-300/400/900`, `success-300/900`. Those utilities generate **no CSS**, so error/success text currently inherits body colour and "error" borders fall back to Tailwind's default `gray-200`. Any redesign must add the missing shades or delete the classes. Examples: `Badge.tsx:25–27` (`-800` text), `Alert.tsx:19–21` (`-200` border + `-800` text), `StaffAccessPanel.tsx:316` (`border-danger-200` + `text-danger-800`), `FeedbackInbox.tsx:495` (`text-danger-900`), `Footer.tsx:241–243` (`danger-800/900/300/400`).
3. **Yes for neutrals, but that is the biggest diff.** 554 `text-gray-*` + 140 `bg-gray-*` + 169 `border-gray-*` is the actual design system. Remapping `gray` in the config changes contrast everywhere at once — including places already failing (§8).

**Structural styling debt**

- **Three parallel style systems:** `globals.css @layer components` (`.btn-*`, `.badge-*`, `.alert-*`, `.table-*`, `.card*`), `packages/ui` React components, and raw utilities in pages. The globals layer is dead: `btn-primary` 0 uses, `badge-*` 0, `alert-*` 0, `table-container` 0, `card-padded` 0. Only `.container`, `.form-label` (6), `.form-error` (6) and `.skip-link` (1) are live.
- `.container` is redefined at `globals.css:83–85` (`max-w-7xl px-4 sm:px-6 lg:px-8`), but 81 call-sites write `container mx-auto px-4`. Utilities beat components in the cascade, so **every container is 1280 px wide with 16 px gutters at all breakpoints** — the `sm:px-6 lg:px-8` from the token never applies, and `tailwind.config.ts:67–76`'s container padding config is entirely unused.
- Two button styles coexist: `globals.css .btn-primary` (dead) and `packages/ui Button` (live, 30 uses). The Header mixes both (`Button` at `:182`, raw `<Link className="bg-blue-600 …">` at `:245`).
- `rounded-lg`/`xl`/`2xl` are used almost equally (62/96/96) — no radius scale.
- No dark-mode implementation despite `globals.css:29–49` defining `.dark` variables; nothing ever adds the class.

---

## 6. Test and type gates

**Jest** — `apps/frontend/jest.config.js`: `ts-jest` preset, `jsdom`, `roots: ['<rootDir>/src']`, `testMatch **/*.test.{ts,tsx}`, coverage ignores `src/app/**`, module map `@dh-araria/ui/* → ../../packages/ui/src/*`, `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']` (mocks `next/navigation`, `next/image`, `sonner`, `matchMedia`, `ResizeObserver`, `IntersectionObserver`). `testTimeout: 30000`. There is **no test config in `packages/ui`** — its components are only tested through the frontend.

| Test file | What it asserts | CSS-class assertions | Imports `@dh-araria/ui` |
|---|---|:--:|:--:|
| `src/components/Button.test.tsx` (45) | render, click, `loading` disables + spinner svg, variant/size classes, disabled | **Yes**: `bg-primary-600` (:26), `bg-danger-600` (:29), `px-3 py-1.5 text-sm` (:34), `px-6 py-3 text-lg` (:37) | **Yes** (`:3`) |
| `src/components/complaints/AdminComplaintsPanel.test.tsx` (277) | list rendering, status mutations, photo upload, counts, history trail, responsive card grid | **Yes**: `flex-wrap` (:172), `min-w-0 basis-32` (:173), `truncate` (:174), `overflow-hidden` (:177), `shrink-0` (:178), `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (:185), `2xl:grid-cols-5` (:186) | No (transitively) |
| `src/components/admin/StaffAccessPanel.test.tsx` (165) | list, validation, POST payload, deactivate, edit preselect, role gate | No | No (transitively) |
| `src/components/feedback/RatingStars.test.tsx` (87) | radio per star, value reporting, aria-live, skip option, error `role="alert"`, display rounding | No (uses roles/text) | No |
| `src/lib/department-tag.test.ts` (18) | deterministic tone, `/^bg-/` prefix, fallback | **Yes** (prefix only) | No |
| `src/lib/complaint-image.test.ts` (~140) | 5 MB limit, MIME allow-list, data-URL validation, 1280 px downscale | No | No |
| `src/lib/feedback.test.ts` (~90) | query builder, error extraction, timestamp formatting | No | No |

**Consequences for a redesign:**

- `Button.test.tsx` pins the exact utility strings of `packages/ui/Button.tsx:24–40`. Changing `bg-primary-600` → `bg-brand-600`, or `px-3 py-1.5` → `px-2.5`, fails the build gate. Keep the class names and change the palette, or update the test in the same commit.
- `AdminComplaintsPanel.test.tsx:181–187` pins the responsive grid (`sm:grid-cols-2 … 2xl:grid-cols-5`) and the truncation strategy; a card-layout redesign must keep those classes or the test must change.
- `department-tag.test.ts:10–16` requires tones to start with `bg-`.
- Tests import `@/lib/api` and mock `api.get` — they do not exercise real loading/error branches, so silent-degradation bugs (§3) are untested.
- No tests cover `Header`, `Footer`, `Hero`, forms, or any layout. The shell is entirely unprotected.

---

## 7. Hard-coded visual constants

| Constant | Value | Where | Collides with… |
|---|---|---|---|
| Header height (nav) | `h-16` = 64 px | `Header.tsx:100`, `:205` | A taller/sticky header |
| Header height (top bar) | 36 px (`px-4 py-2 text-sm`), `hidden … md:flex` | `Header.tsx:74`, `:162` | Breakpoint-dependent offset |
| Total header | 64 px (<md) / ~100 px (md+) | derived | `pt-32` = 128 px in 28 files |
| Header z-index | `z-40` | `Header.tsx:69`, `:157` | Modals `z-50`, skip link `z-50`, footer FAB `z-50` |
| Modal/overlay z-index | `z-50` | `Modal.tsx:71`, `admin/doctors:313`, `StaffAccessPanel:446`, `AdminComplaintsPanel:950` | Any new sticky header at `z-40` will sit **under** modals but over page content; bottom nav needs a slot |
| Skip link | `z-50`, `-top-10 → top-0` | `globals.css:74–78` | Bottom nav / sticky header |
| Footer FAB | `fixed bottom-6 right-6 z-50 h-12 w-12` | `Footer.tsx:285` | **Directly overlaps a mobile bottom nav** |
| Container width | `max-w-7xl` (1280 px), 16 px gutters forced | `globals.css:84` + 81 `px-4` overrides | Wider/narrower redesign |
| Desktop nav breakpoint | `xl` = 1280 px | `Header.tsx:222`, `:275` | Hamburger at 1024–1279 |
| Brand visibility | `sm:block xl:hidden 2xl:block` | `Header.tsx:109`, `:215` | Wordmark vanishes 1280–1535 |
| Mobile menu max height | `85vh` | `Header.tsx:290` | Viewport-relative, no safe-area |
| Admin modal max height | `90vh` / `85vh` | `admin/doctors:315`, `AdminComplaintsPanel:969` | iOS dynamic viewport |
| Table column widths | `100px` / `80px` inline | `ui/Table.tsx:108`, `:123` | Card-based mobile layouts |
| Fixed min widths | `min-w-[200px]`, `max-w-[300px]` | `ContactPage:299`, `GrievanceForm:275`, `ComplaintForm:429` | Narrow phones |
| `min-h-screen` | 34 uses | pages + `Hero.tsx:15` | Mobile browser chrome (`100vh`), sticky header |
| Scroll anchoring | **none** (`scroll-mt` 0, `scroll-padding` 0) | — | Fixed header + in-page anchors |
| Safe-area insets | **none** (`env(safe-area-inset-*)` 0) | — | iPhone home indicator vs bottom nav |
| Theme colour | `#0ea5e9` / `#0369a1` | `app/layout.tsx:60–68` | New brand palette |
| Global body | `bg-gray-50 text-gray-900` | `app/layout.tsx:81` | Any page-canvas change |
| `Toaster` | `bg-white text-gray-900`, `top-right` | `app/layout.tsx:86` | Bottom nav / new toast position |

**Bottom-nav implications:** every page already ends with a ~600 px footer, no page reserves bottom padding, `pb-*` is only used ad hoc, and the one fixed bottom-right element (`Footer.tsx:285`) is invisible-but-present. A new mobile bottom nav must add `pb-[calc(4rem+env(safe-area-inset-bottom))]` on `<main>` and re-home or delete that FAB.

---

## 8. Risk list — 10 things that will bite during the restyle

| # | Risk | File(s) | Why it matters |
|--:|---|---|---|
| 1 | **Detail routes already crash** | `app/doctors/[id]/page.tsx:91`, `app/notices/[id]/page.tsx:66`, `app/services/[id]/page.tsx:104` | `{metadata}` is rendered as a React child; React throws "Objects are not valid as a React child". A redesign that "looks broken" on detail pages is actually a pre-existing render bug — fix it first or you will chase ghosts. |
| 2 | **Fixed header + magic `pt-32`** | `Header.tsx:69,157`; 28 `<main>`s | Any header height change shifts every page. Replace with a shared layout + CSS variable (`--header-h`) and `padding-block-start`, not another magic number. |
| 3 | **Contrast failures on coloured heroes** | `complaint/page.tsx:35` (`text-warning-100` on `warning-600` = **2.86:1**), `grievances/page.tsx:20`, `blood-bank/page.tsx:20` (`danger-100` on `danger-600` = 3.95), all `primary-600` heroes (`primary-100` = 3.57, white = 4.10) | These fail WCAG AA today. A token remap can silently make them worse — measure after every palette change. `bg-primary-600` + white at 4.10:1 also fails AA for normal-size links/buttons. |
| 4 | **110 references to non-existent shades** | `tailwind.config.ts:41–61` vs `Badge.tsx:25–27`, `Alert.tsx:19–21`, `Footer.tsx:241–243`, `FeedbackInbox.tsx:495`, `StaffAccessPanel.tsx:316` + ~90 more | No CSS is generated, so error/success states currently look like body text and borders fall back to gray. If you "fix the palette" by renaming shades, these silently stay broken. |
| 5 | **Tests pin CSS class strings** | `components/Button.test.tsx:26,29,34,37`; `complaints/AdminComplaintsPanel.test.tsx:172–186` | Renaming a utility or changing spacing breaks CI even if the UI is correct. Plan palette-only remaps for `Button`, and rewrite the grid assertions with the redesign. |
| 6 | **Duplicate `Header` markup / auth branch** | `Header.tsx:66–151` vs `:154–369` | Two copies of the shell (the loading one is 86 lines); restyling one leaves the loading state visually different, and it flashes on every first paint because `isLoading` starts `true` (`AuthContext.tsx`). |
| 7 | **First-paint shift (not a hydration mismatch)** | `Header.tsx:65` (loading shell with a **disabled** hamburger and no login button), `Hero.tsx:106` + `style={{animationDelay}}` | Server HTML and the first client render both show the loading shell; once the auth effect resolves (`isLoading` starts `true`), the header swaps to the real tree — a visible flash and layout change on every cold load. Animations restart on hydration. Keep `isLoading`-driven markup out of a sticky shell. |
| 8 | **Overflow: tables, modals, nav** | `ui/Table.tsx:96,136` (`overflow-x-auto`, fixed 100/80 px columns), `AdminComplaintsPanel:950–969` (modal), `Header.tsx:222` (11 links in 1280 px) | A mobile-first redesign will hit horizontal scroll on admin tables and the long-dept-name chip (`basis-32 truncate`, asserted by test). Plan a card fallback and keep the truncation contract. |
| 9 | **Accessibility scaffolding is thin** | `app/layout.tsx:82` skip link → missing `#main-content` on `/login`, `/register`, `error.tsx`, `global-error.tsx`; `Header.tsx:110/216` renders an `<h1>` on **every** page (duplicate H1 with the page hero); `Footer.tsx:86` uses `<h2>`; `/faqs` has **no `<h1>`** at all | Screen-reader heading outline is wrong site-wide. A visual redesign is the moment to move the brand to a `<div>`/`<p>` and add per-page H1s. |
| 10 | **Mock data on the home page vs live data elsewhere** | `Doctors.tsx` (6 fake doctors + ratings), `Departments.tsx` (15), `BloodBank.tsx` (invented unit counts), `Notices.tsx` (5) | The homepage currently advertises fabricated doctors/ratings and blood stock while `/doctors`, `/services`, `/notices`, `/blood-bank` show database content. Restyling amplifies this inconsistency (and it is a trust/compliance problem for a `.gov.in` site). Decide: wire to API or label as illustrative before polishing the visuals. |

**Bonus landmines:** `GrievanceForm.tsx:144,290` link to the non-existent `/grievances/track`; `Footer.tsx` links to eight `/services/<slug>` URLs that the UUID-keyed `/services/[id]` route cannot resolve; `login/page.tsx:198–204` prints demo credentials; `Footer.tsx:285` is a dead "back to top" that only works if an ancestor gets `group`; `ui/Alert`, `ui/Card`, `ui/Modal` and all 12 hooks are unused and will silently stay unstyled if the palette is remapped.

---

### Suggested order of attack (for the redesign planner)

1. Fix the three `{metadata}` crashes and the two dead links — they will masquerade as redesign regressions.
2. Introduce `app/(site)/layout.tsx` with one `<Header/>`/`<Footer/>` and a `--header-h` offset; delete 28 pairs of imports and 28 `pt-32`s.
3. Add the missing `success/warning/danger` shades (or delete the 110 classes), then remap the palette.
4. Split the shell into server `Header` + small client islands to remove the duplicate loading tree.
5. Replace the six home-page mock sections with the live `*List` components before restyling them.
6. Add `app/not-found.tsx`, `app/loading.tsx`, and per-route `error` recovery; add `text-*` error states where fetches currently `catch → []`.
7. Only then apply the visual language: one hero component (5 dialects today), one container rule (81 overrides), one radius/shadow scale.
