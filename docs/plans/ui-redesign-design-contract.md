# UI Redesign Design Contract — Stitch Bundle → `apps/frontend`

**Source bundle:** `C:\Users\Aditya Pandey\Downloads\stitch_mobile_outline_assistant`
**Target:** `apps/frontend` + `packages/ui`
**Repo snapshot:** `af99644 docs: inventory the frontend before the UI redesign`
**Companion:** `docs/plans/ui-redesign-inventory.md` (current route and component inventory)

## 0. Reading rules

- **Authority rule: the embedded `tailwind.config` in each `code.html` wins over `DESIGN.md` prose.** Section 2.4 lists every disagreement.
- Every `code.html` carries its own copy of the config. All 14 copies were extracted and compared; colours, typography, radius, and spacing are identical.
- Class names below are quoted verbatim. Do not "tidy" them into different tokens.
- "New route" means the route does not exist in `apps/frontend/src/app` today.
- Nothing here asserts a Stitch screen is complete. Sections 7.3, 7.4, and 8 record what is contradictory, unverifiable, or missing.

---

## 1. Bundle map

The bundle has **18 directories**: 14 with `code.html`, 3 photography-only, 1 with only `DESIGN.md`. The 14 markup files collapse to **12 distinct screen designs**.

| # | Directory | Files | Role | Design ID |
|---|---|---|---|---|
| 1 | `district_hospital_araria_home` | `code.html`, `screen.png` | Mobile public home, no autoplay | `home-m` |
| 2 | `district_hospital_araria_home_auto_slideshow` | `code.html`, `screen.png` | Same markup, 4500 ms interval | `home-m` |
| 3 | `district_hospital_araria_home_auto_slideshow_6s` | `code.html`, `screen.png` | Same markup, 6000 ms interval | `home-m` |
| 4 | `district_hospital_araria_desktop_home` | `code.html`, `screen.png` | Desktop public home | `home-d` |
| 5 | `medical_services_departments_district_hospital_araria` | `code.html`, `screen.png` | Mobile services | `services-m` |
| 6 | `medical_services_departments_desktop_portal` | `code.html`, `screen.png` | Desktop services | `services-d` |
| 7 | `book_appointment_district_hospital_araria` | `code.html`, `screen.png` | Mobile 4-step booking | `book-m` |
| 8 | `book_appointment_wizard_desktop_portal` | `code.html`, `screen.png` | Desktop 4-step booking | `book-d` |
| 9 | `blood_bank_inventory_district_hospital_araria` | `code.html`, `screen.png` | Blood bank, mobile-first | `blood` |
| 10 | `admin_operations_dashboard_district_hospital_araria` | `code.html`, `screen.png` | Mobile admin dashboard | `admin-m` |
| 11 | `admin_operations_portal_desktop` | `code.html`, `screen.png` | Desktop admin, sidebar | `admin-d` |
| 12 | `complaint_triage_desk_district_hospital_araria` | `code.html`, `screen.png` | Mobile complaint triage | `triage-m` |
| 13 | `grievance_complaints_desk_mobile_admin` | `code.html`, `screen.png` | Mobile complaint list | `griev-m` |
| 14 | `grievance_complaints_desk_desktop_admin` | `code.html`, `screen.png` | Desktop grievance desk | `griev-d` |
| 15 | `district_hospital_araria_health_portal` | `DESIGN.md` | Token spec only, no screen | — |
| 16 | `doctors_and_pediatricians_with_stethoscopes_attending_smiling_indian_mother_and` | `screen.png` | Photography | asset `mch` |
| 17 | `modern_advanced_emergency_trauma_center_and_ambulance_bay_of_an_indian` | `screen.png` | Photography | asset `trauma` |
| 18 | `modern_clean_pathology_laboratory_and_digital_diagnostic_medical_equipment` | `screen.png` | Photography | asset `lab` |

**Home variants.** `home`, `home_auto_slideshow`, and `home_auto_slideshow_6s` are one design. Only the carousel interval differs: none, `4500`, `6000`. Build one component with an `intervalMs` prop and honour `prefers-reduced-motion`. Do not build three pages.

---

## 2. Token contract

### 2.1 Colour

| Role | Token | Hex | Used for |
|---|---|---|---|
| Brand | `primary` | `#006194` | primary buttons, active nav, icons, links |
| Brand hover | `primary-container` | `#007BB9` | button/nav hover fill |
| On brand | `on-primary` | `#FFFFFF` | text on primary |
| On brand container | `on-primary-container` | `#FDFCFF` | text on active nav chip |
| Pale brand | `primary-fixed` | `#CCE5FF` | step icons, soft brand fills |
| Page canvas | `surface` | `#F7F9FF` | page background |
| Card white | `surface-container-lowest` | `#FFFFFF` | cards, header, focused inputs |
| Lowest tint | `surface-container-low` | `#F1F4FA` | inputs, inactive chips, section bands |
| Tint | `surface-container` | `#EBEEF4` | secondary chips, inset panels |
| Tint high | `surface-container-high` | `#E5E8EE` | status strips, table headers |
| Tint highest | `surface-container-highest` | `#DFE3E8` | pressed/selected surfaces |
| Body text | `on-surface` | `#181C20` | headings and body |
| Muted text | `on-surface-variant` | `#3F4850` | secondary copy, inactive nav |
| Hairline | `outline` | `#707881` | placeholders, icons, borders |
| Hairline soft | `outline-variant` | `#BFC7D2` | dividers |
| Warning | `tertiary` | `#894D00` | "Low" stock, warnings |
| Warning fill | `tertiary-fixed` | `#FFDCC0` | "Low" badge background |
| Neutral accent | `secondary` | `#565E74` | secondary text, admin chip hover |
| Neutral fill | `secondary-container` | `#DAE2FD` | Admin chip, info blocks |
| Error | `error` | `#BA1A1A` | destructive/error text |
| Error fill | `error-container` | `#FFDAD6` | error banners, critical badges |
| On error fill | `on-error-container` | `#93000A` | text on error fill |
| Emergency | `emergency-red` | `#DC2626` | 102/108 strip, emergency CTAs |
| Success | `success-green` | `#16A34A` | "Adequate", online dots |

`surface-dim`, `surface-bright`, `inverse-*`, `on-*-fixed*`, `tertiary-container`, `surface-tint`, and `surface-variant` exist in the config but are effectively unused. `neutral-text` and `surface-bg` are legacy aliases; prefer `on-surface` and `surface-container-lowest`. Do not build a second palette from these.

### 2.2 Typography (exact, from config)

| Token | Family | Size / line-height / weight | Used for |
|---|---|---|---|
| `headline-xl` | Atkinson Hyperlegible Next | 36 / 44 / 700 | page `h1` (home hero, services, grievance desk) |
| `headline-lg` | Atkinson Hyperlegible Next | 28 / 36 / 700 | section `h2`, booking step titles |
| `headline-md` | Atkinson Hyperlegible Next | 22 / 28 / 600 | card titles, modal titles, sub-sections |
| `body-lg` | Plus Jakarta Sans | 18 / 28 / 400 | hero/supporting paragraphs |
| `body-md` | Plus Jakarta Sans | 16 / 24 / 400 | default body and input text |
| `body-sm` | Plus Jakarta Sans | 14 / 20 / 400 | helper text, legal copy |
| `label-md` | Plus Jakarta Sans | 14 / 20 / 600 | buttons, tabs, nav, form labels |
| `label-sm` | Plus Jakarta Sans | 12 / 16 / 600 | badges, uppercase eyebrows, footer meta |

Apply as paired utilities: `font-headline-xl text-headline-xl`, `font-body-md text-body-md`, etc. The config defines family and size under the same key; `text-headline-md` without `font-headline-md` silently falls back to the inherited family.

### 2.3 Space, radius, elevation

| Axis | Token | Value | Notes |
|---|---|---|---|
| Space | `gutter` | `1.5rem` (24px) | public mobile gutters and card padding |
| Space | `margin` | `1rem` (16px) | compact mobile gutters (admin uses `px-margin`) |
| Space | `space-xs` | `0.375rem` | icon/text gaps |
| Space | `space-sm` | `0.75rem` | chip and row gaps |
| Space | `space-md` | `1.25rem` | card padding, stack gaps |
| Space | `space-lg` | `2rem` | section padding, grid gaps |
| Space | `space-xl` | `3rem` | desktop section rhythm |
| Radius | `rounded` (DEFAULT) | `0.25rem` | small buttons, nav items, tags |
| Radius | `rounded-lg` | `0.5rem` | inputs, primary buttons, step tiles |
| Radius | `rounded-xl` | `0.75rem` | cards, banners, modals, icon tiles |
| Radius | `rounded-full` | `9999px` | pills, avatars, chips, icon buttons |
| Shadow | `shadow-sm` / `shadow-md` / `shadow-xl` | Tailwind defaults | card lift / hover lift / hero and modal |
| Shadow | `shadow-[0_1px_8px_rgba(0,0,0,0.04)]` | literal | sticky headers and bottom nav |
| Shadow | `shadow-[0_-1px_8px_rgba(0,0,0,0.04)]` | literal | upward shadow for bottom bars |

Radius counts: `rounded-full` 300, `rounded-xl` 268, `rounded-lg` 193, `rounded` 133, `rounded-md` 13, `rounded-2xl` 7. **`rounded-2xl` is not in the design config** (only `DEFAULT`, `lg`, `xl`, `full` are overridden), so those 7 uses resolve to Tailwind's stock `1rem`. Replace with `rounded-xl` or add `2xl` deliberately. There is no `boxShadow`, `screens`, or `maxWidth` override in any config.

### 2.4 `DESIGN.md` vs the configs

| Claim | `DESIGN.md` | Config (authoritative) | Contract |
|---|---|---|---|
| Primary | `#0284C7` prose | `#006194` | use `#006194` |
| Neutral dark | `#0F172A` prose | absent; `on-surface #181C20` | use `on-surface`; do not add slate-900 |
| Radius | `sm .25 / DEFAULT .5 / md .75 / lg 1 / xl 1.5` (frontmatter) | `DEFAULT .25 / lg .5 / xl .75 / full` | use config; `md`/`sm`/`2xl` are not tokens |
| Body size | "never below 16px" | `body-sm 14px`, `label-sm 12px` | 14/12 are allowed for helper and badge text |
| Mobile margin | "minimum 16px outer margins" | `gutter 24px` public; `margin 16px` admin | 24px public, 16px admin |
| Spacing rhythm | "minimum 12px (`space-md`)" | `space-md` is 20px; `space-sm` is 12px | use 12px gaps, 20px card padding |
| Borders | "crisp 1px structural borders" | borders appear only on radios (`border-2`), dividers (`border-t`), inputs (`border-0`), and one `border-l-4` accent | do not add a bordered-card system; use tonal surfaces + `shadow-sm` |
| Shapes | "0.5rem base, up to 1rem" | `rounded-lg .5`, `rounded-xl .75` | max card radius is `.75rem` |

---

## 3. Route map and screen contract

| Design ID | Route | Viewport | Shell | Source folder |
|---|---|---|---|---|
| `home-m` | `/` | mobile | public mobile | `district_hospital_araria_home` (+ 2 variants) |
| `home-d` | `/` | desktop | public desktop | `district_hospital_araria_desktop_home` |
| `services-m` | `/services` | mobile | public mobile | `medical_services_departments_district_hospital_araria` |
| `services-d` | `/services` | desktop | public desktop | `medical_services_departments_desktop_portal` |
| `book-m` | `/appointments` | mobile | public mobile | `book_appointment_district_hospital_araria` |
| `book-d` | `/appointments` | desktop | public desktop | `book_appointment_wizard_desktop_portal` |
| `blood` | `/blood-bank` | mobile-first | public mobile | `blood_bank_inventory_district_hospital_araria` |
| `admin-m` | `/admin` **(new)** | mobile | admin mobile | `admin_operations_dashboard_district_hospital_araria` |
| `admin-d` | `/admin` **(new)** | desktop | admin sidebar | `admin_operations_portal_desktop` |
| `triage-m` | `/admin/complaints` | mobile | admin mobile | `complaint_triage_desk_district_hospital_araria` |
| `griev-m` | `/admin/complaints` | mobile | admin mobile (tabs) | `grievance_complaints_desk_mobile_admin` |
| `griev-d` | `/admin/grievances` **(new)** | desktop | admin top-tab | `grievance_complaints_desk_desktop_admin` |

`/admin` and `/admin/grievances` have no page file today. `apps/frontend/src/app/admin/` contains only `complaints`, `doctors`, `nodal-officers`, `staff`. A `/admin` dashboard landing page is new work, not a reskin.

### 3.1 `home-m` — `/` mobile

| Order | Block | Key classes / behaviour |
|---|---|---|
| 1 | Sticky header | `fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe`; `h-16` row: "DH Araria", "Govt. of Bihar", `person`, `menu` |
| 2 | Emergency strip | `bg-emergency-red text-on-error px-gutter py-2 flex items-center justify-between text-label-sm`; "Emergency Helpline:" + "102 (Ambulance)" + "108 (Disaster)" |
| 3 | Main | `flex flex-col relative w-full px-gutter pt-28 pb-28 bg-surface flex-grow` |
| 4 | Hero carousel | 4 slides, counter `1 / 4`, `chevron_left` / `chevron_right`, eyebrow, `headline-xl`, body, CTA. Slides: Main Campus & Trauma Wing; Emergency 102/108 fleet; Maternal & Child Health; Advanced Diagnostics & Lab |
| 5 | Action pair | `Book Appointment` (`rounded-lg min-h-[48px]`) and `Emergency Care` (`bg-emergency-red rounded-xl min-h-[48px]`) |
| 6 | OPD band | "Active Now" + "Morning 08:00 AM – 02:00 PM \| Evening 04:00 PM – 07:00 PM" |
| 7 | Notice + quick services | one vaccination notice with `View`; 2×3 grid: Appointments, Find Doctor, Blood Bank, Grievances, Notices, Feedback |
| 8 | Departments + stock | 4 cards (General Medicine 6, Pediatrics 4, Obstetrics 5, Orthopedics 3) with `OPD Open`/`24/7 Care`; 8-group stock `Updated 15 mins ago` + critical O− + `Request Unit` |
| 9 | Bottom nav | `fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl`; `h-20`; five `w-16 h-16 min-h-[44px] min-w-[44px]` items: Home, Services, Appointments, Blood Bank, More |

### 3.2 `home-d` — `/` desktop

| Order | Block | Key classes / behaviour |
|---|---|---|
| 1 | Utility bar | `h-10`, `max-w-7xl mx-auto px-6`; address/phone/emergency; Book Appointment (`bg-primary px-3 py-1 rounded`), Staff Login |
| 2 | Main bar | `h-20`, logo + "Health Department, Government of Bihar"; nav `hidden xl:flex items-center gap-2`; Admin chip `hidden sm:inline-flex`; avatar `w-8 h-8 rounded-full bg-primary` |
| 3 | Main | `w-full pt-[120px] bg-surface min-h-[calc(100vh-120px)]` |
| 4 | Hero | `max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center`; copy + two CTAs left, `h-[400px] rounded-xl overflow-hidden shadow-xl` slideshow right with 3 tabs |
| 5 | Live band | `bg-surface-container-high py-space-sm px-6`: OPD status + urgent notice |
| 6 | Services | six `p-6 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md`: Appointments, Find Doctors, Blood Bank, Grievance, Notices, Feedback |
| 7 | Departments | six cards with OPD line + `Consult Doctor` / `View Details` |
| 8 | Doctors | three `h4` cards: Dr. Rajesh Kumar Verma, Dr. Sunita Priyadarshini, Dr. Tariq Anwer; specialty, languages, room, timing, `Book Appointment` |
| 9 | Lower sections | 8-group blood matrix + `+91-6453-222102`; 3 notices with `Download PDF`; counters 1–6, ₹2 fee, May I Help desk, map placeholder, GPS; 4-column footer + compliance badges |

### 3.3 `services-m` — `/services` mobile

- Public mobile shell; title "All Services"; pills All Services / Clinical & OPD / Diagnostics / Emergency / Specialty.
- "Departments & Clinics" + "12 Active Units", but only **5 cards** render: General Medicine, Emergency & Trauma, Pediatrics, Radiology & Pathology, Orthopedics.
- Card: icon tile, title, room/doctor, `Open`/`Closed`/`24/7`, staffing count, timing, `View Details` + `Book OPD` (or `Book Test`, `Call 102`).
- Emergency block: 102 (`Free 24/7 Pickup Service`) and 108 (`Advanced Life Support`).
- The "Department Name / Location Info / Staffing / OPD Timings / About Department" modal is a **template**: every value is placeholder copy (`Detailed description of services offered...`).

### 3.4 `services-d` — `/services` desktop

- Public desktop shell; `main pt-[120px]`.
- Accreditation strip: "NHM Bihar / District Health Society Araria", "100% Free Essential Diagnostics & Medicines", "OPD 08:30 AM – 02:00 PM (Mon–Sat)".
- Header: eyebrow "Civil Hospital Campus · 300-Bed Secondary Care Referral Center"; `h1` "Our Medical Services & Clinical Departments"; paragraph claims NQAS.
- Search `w-full pl-12 pr-10 py-3.5 bg-surface-container-low rounded-lg` + clear button; empty state `search_off` "No Clinical Services Found" + `Reset Search & Filters`.
- Chips `px-4 py-2 rounded-full font-label-md text-label-md`; active `bg-primary text-on-primary shadow-sm`; emergency `text-emergency-red hover:bg-error-container`.
- Nine `article.dept-card ... rounded-xl shadow-sm hover:shadow-md`: General Medicine, Pediatrics & Neonatology, Obstetrics & Gynecology, Orthopedics & Trauma, General & Laparoscopic Surgery, Ophthalmology, ENT, Pathology & Radiology, Emergency & Casualty. Each has facilities, timing, `Dept Details` + `Book Token` (Pathology `Test Catalog`; Emergency `Triage Guide` + `Call 102`).
- OPD flow 3 steps (Registration, Consultation, Pharmacy & Diagnostics) + `Read Citizen Charter Rights`; emergency `bg-error-container` banner with `Dial 102` / `Dial 108`; footer.

### 3.5 `book-m` — `/appointments` mobile

- Public mobile shell; `Step 1 of 4`.
- Step 1: 4 department radio cards (General Medicine, Pediatrics & Neonatology, Orthopedics, Obstetrics & Gynecology) with `check`.
- Step 2: Dr. R. K. Verma (`Available Today`, MBBS MD, 15 years, Room 104) and Dr. Ananya Kumari (`Available Tomorrow`, MBBS DCH, 8 years, Room 202); fee `₹15.00 (Free under AB-PMJAY)`.
- Step 3: date + morning slots 09:00–11:30 (`11:00 AM (Full)` disabled); name, age, gender, mobile, complaint; "Have an Ayushman ID or Health ID? Quick Fill".
- Step 4: success ticket — token `AR-2023-8942`, department, doctor, date/slot, room; "arrive 15 minutes prior with Aadhaar card"; `Book Another Appointment`.
- Footer `Back` / `Continue`; emergency notice; bottom nav.

### 3.6 `book-d` — `/appointments` desktop

- Public desktop shell; 4-step header `rounded-xl bg-surface-container-lowest p-space-md shadow-sm`, step 3 active.
- `grid grid-cols-1 lg:grid-cols-12`; form `lg:col-span-8`, summary `lg:col-span-4 lg:sticky lg:top-[140px]`.
- Consultation switcher: In-Person OPD (Free) vs Teleconsultation (e-Sanjeevani).
- 7-day strip: Today (full), Tomorrow (selected `bg-primary ... shadow-md scale-[1.02]`), Saturday, Sunday (closed), Mon/Tue/Wed.
- Sessions: Morning 08:30–01:30 (active), Evening 04:00–06:30 (8 slots); slot chips; `h-12` inputs `rounded-lg bg-surface-container-low`; consent `w-6 h-6`.
- Sticky summary: facility, department, specialist, slot, fee, guidelines, helpdesk `Call`, trust badge.
- Actions: `Previous Step (Select Doctor)` + `Proceed to Verification & Token Generation`.

### 3.7 `blood` — `/blood-bank`

- Public mobile shell; "Updated 10m ago" + "Live Inventory".
- Critical alert `bg-error-container text-on-error-container p-gutter rounded-xl`: O− 2 units, `Donate O- Now` + `Request Blood` + `Call Bank`.
- `Cards` / `Table` toggle `flex bg-surface-container-high p-1 rounded-xl`.
- Eight cards `bg-surface-container-low p-space-md rounded-xl shadow-sm`: A+ 42, A− 6, B+ 58, B− 8, AB+ 18, AB− 12, O+ 75, O− 2; badges `Adequate` (`bg-success-green/10 text-success-green`), `Low` (`bg-tertiary-fixed text-tertiary`), `Critical` (`bg-error-container text-on-error-container`); each shows "Safe threshold: >N".
- Table view: Blood Group / Available Units / Status. Request modal: patient name + group select + `Submit Requisition`; `close` icon; no dialog semantics.
- Quick actions: `Call 102`, donate, request.

### 3.8 `admin-m` — `/admin` mobile

- Admin mobile shell: `h-20` header with "DH Araria Admin Portal", "ADMIN / STAFF", notifications, avatar; "HMIS Grid: Online · Sync Active" strip.
- Greeting: Dr. A. K. Verma, "Nodal Duty Superintendent · DH Araria"; `Morning (08:00 - 14:00)`; "Synced: Just now".
- 2-column stats: Visits 142 (`84 done`), Complaints 9 (`2 SLA Alert`), Reviews 4.3 (`92% Net Positive`), O− 2 `CRITICAL`.
- Action rows: Triage Complaints (2 escalated), OPD Doctor On-Duty Roster, Emergency Bed / Blood Update.
- Departments: General Medicine 4/4, Pediatrics 3/3, Orthopedics 2 (Heavy), Casualty 24/7 (3 beds). Facility "150 Bed Operational Capacity". Audit log 3 rows.
- Bottom nav `h-16`: Dashboard, Complaints, Doctors, More.

### 3.9 `admin-d` — `/admin` desktop

- Fixed sidebar `w-72 bg-surface-container-low`, 6 nav items (Clinical Dashboard, OPD Registrations, Bed Inventory, Blood Bank Stock, Doctor & Staff Duty, Grievance Redressal) + "Back to Public Portal".
- Fixed header `h-16` offset `left-72`; actions New Notice / Roster Update / Export Reports; `main pt-16 px-8`.
- Identity: Dr. A. K. Verma, MD, Class-I Gazetted, CMS; UID `BR-ARA-001`; SLA warning `#ARA-GRV-882` (< 2h).
- KPIs: OPD 384 (+14.2%; 240/98/46), Grievances 12 (3 nearing 48h), Critical Blood 2 units O−, Attendance 24/28 (85.7%).
- Grievance table: rows `#ARA-GRV-882/881/879` with department, issue, nodal officer, SLA clock, actions; filters; pagination 1/4.
- Lower panels: NABL lab metrics, NICU 8/10, ICU 12/15, PSA oxygen 99.4%, audit trail, NHM export.

### 3.10 `griev-d` — `/admin/grievances` desktop

- Top-tab shell: `header fixed top-0 w-full z-50`, inner `h-28 w-full px-gutter flex flex-col justify-between py-space-xs`; brand row + horizontal tabs (Grievance & Complaints active, Doctors Roster, Appointments Desk, Blood Bank Stock); `main w-full pt-28 px-gutter`.
- Charter alert (`< 6 hrs`); `h1` "Citizen Grievance & Redressal Desk", "12 Live", desk ID `DH-ARR-GRV-2026`.
- Four KPI tiles: Total 12, Submitted 4, In Progress 3, Resolved 5.
- Filters: Department, Status, `48h SLA Tracking Active`, `Clear filters`.
- Six cards: sanitation (SUBMITTED, Triage Level 1, geo-tagged proof), pharmacy (IN PROGRESS, batch check), radiology (UNDER REVIEW, engineer ticket), casualty (RESOLVED, 5/5), MCH (IN PROGRESS, electrical), blood bank (RESOLVED, e-RaktKosh).
- Each card: workflow strip (Submitted → Under Review → In Progress → Resolved), contact, last-update line, Review/Start/Resolve/Update. Pagination "Showing 1–4 · Total 12 · Page 1 of 3"; statutory footer.

### 3.11 Admin complaints mobile — two competing designs

Both map to `/admin/complaints`; **pick one before implementation**.

| | `triage-m` | `griev-m` |
|---|---|---|
| Header | `h-20`, admin identity, HMIS strip | `h-16` + `h-12` horizontal tabs |
| Title | "Complaints / Grievance Triage" | "Complaints Admin Panel" |
| Default | 3 triage cards with SLA alert | 3-row list + 4 stat tiles |
| Controls | `All 9 / Pending 4 / In Progress 3 / Resolved 42`, search, tune | `Total 12 / Submitted 4 / In Progress 3 / Resolved 5`, Refresh, CSV, filters |
| Actions | Assign, Call, Update Resolution, View Details | View Attachment, Update Proof, Review, Start, Resolve, Re-open |
| Bottom nav | `h-16` Dashboard / Complaints / Doctors / More | same |

Recommended: `griev-m` as the list state and `triage-m` as the top "needs attention" section of one page. Do not ship two pages.

---

## 4. Responsive rules

| Breakpoint | Tokens in bundle | Contract |
|---|--:|---|
| base | — | single column; public gutter 24px; admin gutter 16px; bottom nav visible |
| `sm:` | 12 | 2-col cards, inline Admin chip, 4-col blood grid |
| `md:` | 21 | 4-col stats, 7-col blood matrix, side-by-side footer |
| `lg:` | 20 | desktop phone block, 3-col catalog, 12-col booking split |
| `xl:` | 21 | full public nav `hidden xl:flex`; `max-w-7xl` |

There is **no `2xl:` usage**. Do not design a fourth desktop width.

| Pattern | Exact classes | Where |
|---|---|---|
| Card catalog | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md` | services desktop |
| Stat pairs | `grid grid-cols-2 gap-space-sm` | admin mobile |
| Stat quad | `grid grid-cols-1 md:grid-cols-4 gap-space-md` | admin/grievance desktop |
| Booking | `grid grid-cols-1 lg:grid-cols-12 gap-space-lg` + `lg:col-span-8` / `lg:col-span-4` | appointment desktop |
| Blood grid | `grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8` | home / blood |
| Footer | `grid grid-cols-1 md:grid-cols-4 gap-space-lg` | public desktop |

**Container and offset**

- Public desktop: `max-w-7xl mx-auto px-6`; page `pt-[120px]` (utility `h-10` + main `h-20`, both fixed).
- Admin sidebar: content starts `left-72`; header `h-16`; page `pt-16 px-8`.
- Admin top tabs: header `h-28`; page `pt-28`.
- Mobile public: `pt-28 pb-28`; nav `h-20`.
- Mobile admin: `pt-28 pb-20` or `pb-24`; nav `h-16`.

**Touch targets.** Stated minimum is 44px, but these miss it: filter chips `px-4 py-2` (~36px), utility `Book Appointment px-3 py-1` (~26px), desktop nav `px-3 py-2` (~36px), admin tab pills `min-h-[36px]`. Raise to `min-h-[44px]` without changing visual weight. Primary buttons already use `min-h-[48px]`.

**Sticky offset.** Booking summary uses `lg:sticky lg:top-[140px]` (120px header + 20px). Keep it tied to header height.

---

## 5. Navigation shells

### 5.1 Public desktop

| Layer | Exact classes | Contents |
|---|---|---|
| Utility bar | `h-10`, `max-w-7xl mx-auto px-6 flex items-center justify-between font-label-sm text-label-sm` | address, phone, "Emergency: 102 / 108"; Book Appointment, Staff Login |
| Main bar | `h-20`, `max-w-7xl mx-auto px-6 flex items-center justify-between` | logo + "District Hospital Araria / Health Department, Government of Bihar"; nav; Admin chip; avatar |
| Nav item | `px-3 py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md` | Home, Services, Doctors, Appointments, Blood Bank, Notices, Citizen Services, Contact |
| Active | `bg-primary-container text-on-primary-container font-label-md rounded` | one per page |
| Admin chip | `hidden sm:inline-flex items-center px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm` | "Admin Access" + `person` |
| Wrapper | `fixed top-0 left-0 w-full z-50 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]` | both bars |

`Citizen Services` has no dedicated route today. Map it to `/services` or remove it; do not ship a dead link.

### 5.2 Public mobile

| Layer | Exact classes | Contents |
|---|---|---|
| Header | `fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe` | `h-16`: `menu`, "DH Araria" + "Govt. of Bihar", `person` |
| Emergency strip | `bg-emergency-red text-on-error px-gutter py-2 flex items-center justify-between text-label-sm` | "Emergency Helpline:" + 102 + 108 |
| Main | `flex flex-col relative w-full px-gutter pt-28 pb-28 bg-surface flex-grow` | page content |
| Bottom nav | `fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]` | `h-20`; 5 items |
| Item | `flex flex-col items-center justify-center gap-space-xs w-16 h-16 min-h-[44px] min-w-[44px]` | icon + `text-label-sm` |
| Active | `text-primary font-bold` (`aria-current="page"`) | one per page |

The `menu` button has no drawer markup. Implement a sheet (Services, Doctors, Notices, Grievances, Feedback, Contact, Staff Login) or remove it.

### 5.3 Admin desktop — sidebar (`admin-d`)

| Layer | Exact classes | Contents |
|---|---|---|
| Sidebar | `fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col shadow-[0_1px_8px_rgba(0,0,0,0.04)]` | brand, 6 items, "Back to Public Portal" |
| Nav item | `flex items-center gap-space-sm p-space-xs rounded-lg` | icon + label |
| Active | `bg-primary-container text-on-primary-container font-label-md rounded` | one per page |
| Header | `fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest ... px-8` | title, HMIS, notices, help, avatar |
| Main | `relative pt-16 w-full px-8 bg-surface min-h-screen` | content |

### 5.4 Admin desktop — top tabs (`griev-d`)

| Layer | Exact classes | Contents |
|---|---|---|
| Header | `fixed top-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]` | brand + tabs |
| Inner | `h-28 w-full px-gutter flex flex-col justify-between py-space-xs` | two rows |
| Tabs | `flex items-center gap-space-xs overflow-x-auto` | Grievance & Complaints, Doctors Roster, Appointments Desk, Blood Bank Stock |
| Active | `bg-primary-container text-on-primary-container font-bold rounded-lg shadow-sm` | one per page |
| Main | `w-full pt-28 bg-surface min-h-[calc(100vh-80px)] px-gutter` | content |

This shell is incompatible with 5.3. Recommend sidebar for `/admin`, top tabs only inside the grievance module, never both on one page.

### 5.5 Admin mobile

| | `admin-m` / `triage-m` | `griev-m` |
|---|---|---|
| Header | `h-20 px-margin`, identity + notifications/avatar | `h-16 px-margin`, title + refresh/avatar |
| Strip | "HMIS Grid: Online · Sync Active" | `h-12` tab pills `min-h-[36px]` |
| Main | `pt-28 pb-24` | `pt-28 pb-20` |
| Bottom nav | `h-16`, 4 items | `h-16`, 4 items |

Standardise the header height: `h-20` and `h-16` produce different `pt` values and different nav overlap.

---

## 6. Component vocabulary

| Component | Exact recipe | Notes |
|---|---|---|
| Primary button | `inline-flex items-center justify-center gap-space-xs min-h-[48px] px-6 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-md hover:bg-primary-container transition-colors` | canonical CTA |
| Compact primary | `px-5 py-2.5 bg-primary text-on-primary font-label-md text-label-md rounded shadow-sm hover:bg-primary-container` | filters/reset; raise to 44px |
| Secondary button | `px-3 py-2.5 rounded bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest` | "Dept Details" |
| Ghost button | `px-4 py-2 rounded bg-surface-container text-primary font-label-sm text-label-sm hover:bg-primary hover:text-on-primary` | notice downloads |
| Emergency button | `bg-emergency-red text-on-error font-label-md py-space-sm px-space-md rounded-xl ... min-h-[48px] shadow-sm hover:opacity-90` | 102/108 |
| Destructive text | `text-error hover:bg-error-container` | critical actions |
| Text input | `w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none` | no border; focus is a surface change |
| Search input | `w-full pl-12 pr-10 py-3.5 bg-surface-container-low rounded-lg text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:bg-surface-container` | icon left, clear right |
| Textarea | `w-full p-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md resize-none focus:bg-surface-container-lowest` | booking symptoms |
| Select | native `select` with the same `h-12 rounded-lg bg-surface-container-low` recipe | blood group, filters |
| Radio card | `relative flex flex-col p-space-md rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container` + `peer sr-only` input | department/doctor/mode |
| Checkbox | `w-6 h-6 rounded bg-surface-container-lowest text-primary` | consent/declaration |
| Segmented toggle | `flex bg-surface-container-high p-1 rounded-xl`; active `bg-surface-container-lowest shadow-sm rounded-lg` | Cards/Table |
| Filter chip | `px-4 py-2 rounded-full font-label-md text-label-md bg-surface-container-low text-on-surface-variant hover:bg-surface-container` | active `bg-primary text-on-primary shadow-sm`; emergency `text-emergency-red hover:bg-error-container` |
| Status pill | `px-2 py-0.5 rounded-full text-[11px] font-bold bg-success-green/10 text-success-green` | Low `bg-tertiary-fixed text-tertiary`; Critical `bg-error-container text-on-error-container` |
| Eyebrow badge | `px-2 py-0.5 rounded text-xs uppercase tracking-wider font-label-sm bg-primary text-on-primary` | over hero images |
| Card | `p-6 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all` | standard content card |
| Compact card | `p-3 rounded-lg bg-surface-container-lowest shadow-sm` | stats, blood groups |
| Icon tile | `w-9 h-9 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center` | steps; secondary `bg-secondary-fixed` |
| Stat tile | `p-space-md rounded-xl bg-surface-container-low shadow-sm` + `headline-lg` number + `label-sm` caption | admin |
| List row | `bg-surface-container-lowest rounded-xl shadow-sm p-space-md` + title/status/meta/actions | complaints |
| Alert banner | `bg-error-container text-on-error-container p-gutter rounded-xl mb-gutter shadow-sm` | critical stock/SLA |
| Info banner | `bg-surface-container-high px-gutter py-3 rounded-xl mb-gutter` | "Updated 10m ago" |
| Modal | overlay + `bg-surface-container-lowest w-full max-w-md rounded-2xl p-space-lg shadow-xl` | **`rounded-2xl` is off-token**; use `rounded-xl` |
| Stepper | `w-full mb-space-lg bg-surface-container-lowest rounded-xl p-space-md shadow-sm` + numbered circles | booking |
| Table | `w-full text-left` inside `bg-surface-container-lowest rounded-xl shadow-sm`; header `bg-surface-container-high` | blood/table, grievance |
| Pagination | `flex items-center justify-between` + `chevron_left` / `chevron_right` + "Page 1 of 3" | admin lists |
| Empty state | centred `search_off` + `headline-md` + body + reset CTA | services search |
| Toast | fixed bottom pill + `check_circle` + message | "Action completed successfully" |
| Avatar | `w-8 h-8 rounded-full bg-primary` (public) / `w-10 h-10 rounded-full bg-surface-container-high` (admin) | initials or `person` |
| Icon set | Material Symbols Outlined ligatures (`calendar_month`, `bloodtype`, `e911_emergency`, `support_agent`) | load once, set weight |

**Accessibility defects in the vocabulary**

- No `focus-visible` anywhere; 30 `focus:outline-none` vs 12 `focus:ring`. Add `focus-visible:ring-2 ring-primary ring-offset-2` to every interactive element.
- No `<dialog>`/`role="dialog"`; modals are plain `div`s. Add focus trap, `aria-modal`, labelled title, Escape, and focus restore.
- No skip link in any file. Add "Skip to main content" as the first focusable element in each shell.
- Mobile services, blood bank, appointments, complaint triage, admin portal, and booking wizard render no `h1`. Give each page exactly one `h1`; the visual title can stay small.
- Decorative Material Symbols are not consistently `aria-hidden="true"`.

---

## 7. Content inventory

### 7.1 Reusable institutional block

| Fact | Value used across screens |
|---|---|
| Address | "District Hospital Road, Ward No. 12, Araria, Bihar - 854311" |
| Main phone | `+91-6453-222123` / control room `06453-222123` |
| Emergency | `+91-6453-222999`; ambulance `102`; disaster `108` |
| Blood bank | `+91-6453-222102` |
| Email | `ms-dh-araria@bihar.gov.in` |
| GPS | `26.1512° N, 87.5147° E` |
| OPD windows | `07:30–13:30` and `15:30–18:30` (footer) |
| Facility UID | `BR-ARA-001` (admin only) |
| Desk ID | `DH-ARR-GRV-2026` (admin only) |

### 7.2 Screen content counts

| Screen | Rows | Claims and numbers present |
|---|---|---|
| `home-m` | 4 departments, 6 quick services, 8 blood groups | OPD 08:00–14:00 + 16:00–19:00, stock 14/3/22/2/8/1/31/critical |
| `home-d` | 6 services, 6 departments, 3 doctors, 3 notices, 8 groups | 150 beds, fee ₹2, stock 28/06/34/04/19/02/42/01, © 2025 |
| `services-m` | 5 cards, "12 Active Units" | rooms 102/108/112, doctor counts 4/3/2 |
| `services-d` | 9 departments | "300-Bed", "NQAS", "64+ free tests", OPD 08:30–14:00, fee ₹2 |
| `book-m` | 4 departments, 2 doctors, 6 slots | fee ₹15 (free under AB-PMJAY), OPD 09:00–14:00, token `AR-2023-8942`, date 25 Oct 2023 |
| `book-d` | 7 days, 2 sessions, 8 slots | fee ₹5, OPD 08:30–13:30 / 16:00–18:30, ABHA synced badge |
| `blood` | 8 groups | stock 42/6/58/8/18/12/75/2, thresholds 20/10/20/10/10/5/30/15 |
| `admin-m` | 4 departments, 3 audit rows | 142 visits, 9 complaints, 4.3 rating, 92% positive, 150 beds, 2026 ticket IDs |
| `admin-d` | 3 grievance rows, 6 nav items | 384 OPD, 24/28 doctors, 12 grievances, NICU 8/10, ICU 12/15, oxygen 99.4% |
| `griev-d` | 6 complaint cards | 12 live, 4/3/5 split, 48h SLA, 120-minute assessment, 2026 dates |
| `triage-m` / `griev-m` | 3 cards each | 9 vs 12 totals, 2 critical vs 1 SLA, 42 resolved vs 5 resolved |

### 7.3 Numbers that must be reconciled before build

| Subject | Conflicting values | Source screens | Contract |
|---|---|---|---|
| Bed count | "150+", "150 Bed Operational Capacity", "300-Bed Secondary Care Referral Center" | `home-d`, `admin-m`, `services-d` | one value from facility data |
| Doctor count | "18+", "29 +4", "24/28", "4 Doctors Available" | `home-d`, `admin-d`, doctor cards | one roster-derived count |
| OPD hours | 08:00–14:00 + 16:00–19:00; 08:30–14:00; 09:00–14:00; 09:00–16:00; 08:30–13:30 + 16:00–18:30; 07:30–13:30 + 15:30–18:30 | six screens + footer | one schedule per department, from data |
| OPD fee | ₹2; ₹5; ₹0/free | `home-d`, `book-d`, `book-m` | one fee rule; "free under AB-PMJAY" only if true |
| Blood stock | 14/3/22/2/8/1/31/crit; 28/06/34/04/19/02/42/01; 42/6/58/8/18/12/75/2 | home mobile, home desktop, blood page | live inventory only; never hard-code |
| Grievance totals | 9 vs 12; resolved 42 vs 5 | triage vs list | derive from one query |
| Footer year | © 2025 while notices are Oct 2025 and admin rows are 2026 | footer, notices, admin | current year at render |
| Doctor names | R. K. Sharma / R. K. Verma / Rajesh Kumar Verma; Anjali Mehta / Ananya Kumari; S. K. Verma | services, booking, home | placeholder — replace from DB |
| Initials | every doctor avatar renders "DR" | doctor cards | derive initials from name |

### 7.4 Honesty flags

Every claim below is **content, not UI**. Ship only what the hospital can evidence. The redesign must not copy these strings blindly.

| Claim | Where | Risk | Contract action |
|---|---|---|---|
| "NABL Accredited" | mobile home slide, admin lab panel | accreditation number/validity absent | use "NABL Standard" until certificate is on file |
| "HMIS Synced" / "HMIS Connected" / "HMIS Grid: Online · National Health Grid Sync Active" | all admin screens | implies live government integration | show only if a real sync job exists; otherwise "Last updated" |
| "e-RaktKosh Sync" / "generated via e-RaktKosh" | blood bank, grievance card | implies integration | label manual entry unless integrated |
| "ABHA Linked" / "ABHA profile fetched and synced" | booking desktop, admin | implies ABDM integration | remove until the consent-artefact flow is live |
| "100% Free Generic Drugs" / "100% Free Essential Diagnostics" | home, services | absolute claim | "Free essential medicines/diagnostics as available" |
| "NQAS certified" | services desktop | certification claim | "NQAS-aligned" or remove |
| "GIGW 3.0 & WCAG 2.2 AA certified" | every footer | self-certification; markup fails basics | "Accessibility commitment" until audited |
| "1,400+ Daily OPD" | home trust strip | unsourced | remove or bind to a real count |
| "92% Net Positive" / "4.3" rating | admin mobile | unsourced | derive from the feedback table |
| "PSA Oxygen Plant 99.4% Purity" | admin desktop | live telemetry claim | show only with sensor source + timestamp |
| "SLA" / "Bihar Grievance Act" deadlines | grievances | legal commitment | keep only if the SLA policy is configured and enforceable |
| Staff names and complaint IDs | admin screens | look real, are demo data | mark seed data; never ship as production records |

---

## 8. Gaps and conflicts

### 8.1 Routes with no design

No Stitch screen covers:

`/doctors`, `/doctors/[id]`, `/notices`, `/notices/[id]`, `/contact`, `/complaint`, `/complaints/track`, `/grievances`, `/feedback`, `/feedback/[departmentId]`, `/feedback/inbox`, `/services/[id]`, `/blood-bank/donate`, `/blood-bank/request`, `/login`, `/register`, `/forgot-password`, `/accessibility`, `/faqs`, `/forms`, `/health-tips`, `/insurance`, `/patient-rights`, `/privacy`, `/sitemap`, `/terms`, `/admin/doctors`, `/admin/staff`.

Rule: extend the nearest public shell and Section 6 vocabulary. Do not invent new hero layouts, token values, or admin shells.

### 8.2 Missing states

- No loading, error, empty, or offline state (only the services search empty state).
- No validation errors, disabled-submit, or success/failure states beyond the booking ticket.
- Pagination, sorting, and bulk-select in admin tables are visual only.
- No mobile drawer for `menu`; no modal focus management; no toast live region.
- No print styles for the appointment token.

### 8.3 Structural conflicts

| Conflict | Evidence | Decision needed |
|---|---|---|
| Two admin desktop shells | `admin-d` sidebar `w-72` + `h-16` vs `griev-d` `h-28` top tabs | sidebar for `/admin`; top tabs only inside grievances |
| Two mobile admin shells | `admin-m`/`triage-m` `h-20` vs `griev-m` `h-16` + `h-12` tabs | one header height |
| Two `/admin/complaints` designs | triage cards vs list + stats | one page, triage as top section |
| `/admin` and `/admin/grievances` do not exist | admin dir has only complaints/doctors/nodal-officers/staff | create or re-map; no dead links |
| `Citizen Services` has no route | desktop nav | map to `/services` or remove |
| Login/register sit outside the shell | inventory | decide whether they adopt the public shell |
| Duplicate triage lists | dashboard card + full desk | dashboard shows 2–3, desk shows all |
| Radius drift | 7 `rounded-2xl`, 13 `rounded-md` | normalise to `rounded-xl` / `rounded-lg` |
| Bottom-nav shadow points down | `shadow-[0_1px_8px...]` on bottom nav | use `shadow-[0_-1px_8px...]` |
| Dark mode declared, never used | `darkMode: "class"`, no `dark:` classes | remove the flag or design dark tokens |

---

## 9. Image assets

All three photographs are 1376×768 PNG, ~1.5 MB each. They are the only real photography; every other image slot is a coloured `div` placeholder.

| Asset | File | Size | Subject | Allowed use | Blocker |
|---|---|---:|---|---|---|
| `mch` | `doctors_and_pediatricians_.../screen.png` | 1,519 KB | doctors and pediatricians with a smiling mother and child | home MCH slide, `/services` maternal card | none observed; confirm licence and alt text |
| `trauma` | `modern_advanced_emergency_trauma_.../screen.png` | 1,757 KB | trauma centre exterior + ambulance bay | home emergency slide, `/services` emergency banner | signage reads "DISTRICT HOSPITAL & TRAUMA CENTER • INDORE" — **cannot be used as Araria** without retouch or a new photo |
| `lab` | `modern_clean_pathology_.../screen.png` | 1,499 KB | pathology lab and diagnostic equipment | home diagnostics slide, `/services` pathology card | wall sign reads "NABL ACCREDITED" — do not reuse that claim unless verified; crop if needed |

**Image contract**

- Serve responsive `next/image` sizes; do not ship 1.5 MB PNGs to mobile.
- Keep a 16:9 crop with a dark scrim for hero text, matching the bundle's full-bleed image + white `headline-md` + bottom gradient.
- Alt text describes the care setting, not the headline. Decorative slides get `alt=""` only when the adjacent heading carries the meaning.
- Do not use the Indore photo on any Araria page. Commission or licence an Araria campus photo, or fall back to a `bg-primary` panel with the 102/108 CTA.
- The bundle has no logo, favicon, emblem, or doctor portraits. Those are open asset requests.
