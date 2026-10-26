# UI Outline Prompt — DH Araria Hospital Portal

Use this document as the single source of truth when designing, building, or
reviewing any page in the District Hospital Araria digital healthcare portal.
It covers **every route that exists today**, every route the product still
needs, and the shared rules that apply to all of them.

Snapshot: **2026-10-26**, commit `d8ace37`. When a route is added or removed,
update the route inventory in section 3 in the same change.

Status key used throughout:

| Status | Meaning |
|---|---|
| **Live** | The route exists and its primary flow works end to end against the API. |
| **Partial** | The route exists but a key interaction is stubbed, unwired, or makes a claim the system cannot yet honour. |
| **Planned** | The page is required for the product but has not been built. |
| **Deferred** | Out of scope for the current phase; design only when the phase starts. |

---

## 1. Product context

- **Product:** Official digital healthcare portal for District Hospital Araria,
  Bihar, India (854311).
- **Purpose:** Let citizens book appointments, find doctors and departments,
  check blood availability, file grievances and complaints, track them, read
  notices, share feedback, and contact the hospital. Staff use authenticated
  areas for complaint triage, feedback review, doctor management, appointment
  management, notice publishing, and department access grants.
- **Audience:** Patients of all ages and digital literacy levels, caregivers,
  doctors, hospital staff, administrators, and emergency users. Many users are
  on low-end Android phones and slow networks.
- **Tone:** Official, calm, trustworthy, service-first. This is a public health
  utility, not a marketing landing page. Task completion matters more than
  decoration.
- **Compliance:** GIGW 3.0, WCAG 2.2 Level AA, Government of India
  accessibility and data-residency expectations. Admin and account pages are
  `noindex`.
- **Languages:** English now. Hindi and other Indian languages are a later
  phase (Bhashini). Urdu will require RTL support. Do not show a language
  selector until it actually changes the page language.
- **Deployment:** Next.js frontend on Vercel; backend API under `/api/v1`.

### What this portal is not

- It is not a replacement for emergency services. Every page keeps 102/108 and
  the hospital helpline reachable.
- It is not a clinical records portal yet. ABHA/ABDM record pages are deferred
  (section 6.6).
- It does not claim an integration is live until the integration exists. See
  the honesty rule in section 9.4.

---

## 2. Information architecture

### 2.1 Primary navigation

The current header renders eleven flat links, which is too many for a public
service. Use this structure:

**Desktop main nav:** Home · Services · Doctors · Appointments · Blood Bank ·
Notices · Contact · **Citizen Services** (menu)

The **Citizen Services** menu contains:

- Grievances
- File a Complaint
- Track Complaint
- Feedback

**Top utility bar (desktop):** Araria address, hospital phone, emergency
102/108, "Book Appointment", account menu (Login/Register when signed out;
My Appointments, My Grievances, Profile, Security, Admin Panel when authorised,
Logout when signed in).

**Mobile:** the same items in one scrollable drawer, with emergency contacts
pinned at the bottom and auth actions in a separate block.

Rules:

- Never show two links to the same destination with different labels in the
  same nav.
- The active route is visually and programmatically marked (`aria-current="page"`).
- The admin link is shown only to `ADMIN` and `STAFF`, in the account menu, not
  as a primary citizen link.
- The header must not hide emergency numbers on mobile.

### 2.2 Footer

Groups:

- **Quick links:** Home, Services, Doctors, Appointments, Blood Bank, Notices,
  Contact.
- **Our services:** Emergency, OPD, Diagnostics, Blood Bank, Ambulance,
  Pharmacy, Physiotherapy, Dietary.
- **Departments:** General Medicine, Pediatrics, Obstetrics & Gynecology,
  Orthopedics, General Surgery, Ophthalmology, ENT, Dermatology.
- **Patient resources:** Patient Rights, Insurance & Schemes, FAQs, Download
  Forms, Health Tips, Feedback, Grievances.
- **Legal:** Privacy Policy, Terms of Service, Accessibility Statement, Sitemap.
- **Contact block:** address, phone, email, OPD hours, emergency hours.

Every footer link must resolve to a real route. Do not ship `href="#"` or
slug links that the backend cannot serve.

### 2.3 Breadcrumbs

Detail pages must show a breadcrumb:

- `Home / Services / <Department>`
- `Home / Doctors / Dr <Name>`
- `Home / Notices / <Title>`
- `Home / Admin / <Section>` for admin detail views.

Breadcrumbs are a `nav` with an ordered list, and the last item is plain text.

### 2.4 Page shell

Every page includes:

- Skip link to `#main-content`.
- Header and footer.
- Exactly one `h1`.
- `main` with `id="main-content"` and top padding that clears the fixed header.
- Toast region (sonner) top-right.
- Auth and language providers.
- A consistent page-hero pattern for section landing pages: eyebrow (optional),
  `h1`, one-sentence description, optional primary action.

---

## 3. Route inventory

### 3.1 Public and citizen routes

| Route | Page | Auth | Indexable | Status | Primary API |
|---|---|---|---|---|---|
| `/` | Home | Public | Yes | Live | `/departments`, `/doctors`, `/blood-bank/summary`, `/notices/published` |
| `/services` | Services and departments index | Public | Yes | Live | `/departments` |
| `/services/[id]` | Department detail | Public | Yes | Partial — accepts the department UUID; footer links use slugs that do not resolve | `/departments/:id` |
| `/doctors` | Doctor directory | Public | Yes | Live | `/doctors` |
| `/doctors/[id]` | Doctor profile and availability | Public | Yes | Live | `/doctors/:id` |
| `/appointments` | Four-step booking wizard | Public until confirmation | Yes | Live | `/departments`, `/doctors`, `/doctors/:id/slots`, `POST /appointments` |
| `/blood-bank` | Blood inventory | Public | Yes | Live | `/blood-bank`, `/blood-bank/summary` |
| `/blood-bank/request` | Blood request form | Public | Yes | Partial — presentation only, no submit handler or API | None yet; see section 6.2 |
| `/blood-bank/donate` | Donation information | Public | Yes | Live | None |
| `/grievances` | CPGRAMS-style grievance form | Public | Yes | Partial — success screen links to `/grievances/track`, which does not exist; integration copy is not yet true | `POST /grievances` |
| `/grievances/track` | Public grievance tracking | Public | No | Planned — no public tracking endpoint yet | Needs backend design |
| `/complaint` | Complaint intake with photo | Public, optional auth | Yes | Live | `POST /complaints`, `/departments` |
| `/complaints/track` | Complaint tracking | Public | No | Live | `/complaints/track/:id` |
| `/feedback` | General feedback form | Public | Yes | Live | `POST /feedback` |
| `/feedback/[departmentId]` | Department feedback form | Public | Yes | Live | `POST /feedback` |
| `/notices` | Notices index | Public | Yes | Live | `/notices/published` |
| `/notices/[id]` | Notice detail | Public | Yes | Live | `/notices/:id` |
| `/contact` | Contact details and message form | Public | Yes | Live | `POST /contact` |
| `/faqs` | Frequently asked questions | Public | Yes | Live | None |
| `/forms` | Downloadable forms | Public | Yes | Partial — every download is `href="#"` | Needs static files |
| `/health-tips` | Health tips | Public | Yes | Live | None |
| `/insurance` | Insurance and schemes | Public | Yes | Live | None |
| `/patient-rights` | Patient rights and responsibilities | Public | Yes | Live | None |
| `/privacy` | Privacy policy | Public | Yes | Live | None |
| `/terms` | Terms of service | Public | Yes | Live | None |
| `/accessibility` | Accessibility statement | Public | Yes | Live | None |
| `/sitemap` | HTML sitemap | Public | Yes | Partial — omits several live routes | Route registry |

### 3.2 Account and authentication routes

| Route | Page | Auth | Indexable | Status | Primary API |
|---|---|---|---|---|---|
| `/login` | Sign in | Public | No | Live | `POST /auth/login` |
| `/register` | Create account | Public | No | Live | `POST /auth/register` |
| `/forgot-password` | Request reset link | Public | No | Partial — API returns success but sends no email yet | `POST /auth/forgot-password` |
| `/reset-password` | Set a new password from a token | Public | No | Planned | `POST /auth/reset-password` |
| `/account` | Account overview | PATIENT | No | Planned | `/appointments/my`, `/grievances/my`, `/users/profile` |
| `/account/appointments` | My appointments | PATIENT | No | Planned | `/appointments/my`, `DELETE /appointments/:id` |
| `/account/grievances` | My grievances | PATIENT | No | Planned | `/grievances/my` |
| `/account/profile` | Edit name and phone | PATIENT | No | Planned | `GET/PUT /users/profile` |
| `/account/security` | Change password | PATIENT | No | Planned | `POST /auth/change-password` |

Legacy alias: if `/appointments/my` or `/grievances/my` is used instead of the
account sub-routes, redirect to the account route. Do not maintain two pages
with the same data.

### 3.3 Staff, admin, and system routes

| Route | Page | Auth | Indexable | Status | Primary API |
|---|---|---|---|---|---|
| `/feedback/inbox` | Feedback inbox and access grants | STAFF, ADMIN | No | Live | `/feedback`, `/feedback/stats`, `/feedback/access`, `/feedback/scope` |
| `/admin` | Admin dashboard or redirect | STAFF, ADMIN | No | Planned — `admin/layout.tsx` exists but there is no index page | Aggregates |
| `/admin/complaints` | Complaint triage | STAFF, ADMIN | No | Live | `/complaints`, `/complaints/stats`, `/complaints/export` |
| `/admin/doctors` | Doctor management | ADMIN | No | Partial — add and delete work; edit is missing | `/admin/doctors` |
| `/admin/nodal-officers` | Department access grants | ADMIN | No | Live | `/admin/department-access`, `/users` |
| `/admin/appointments` | Appointment desk | STAFF, ADMIN, DOCTOR | No | Planned | `/appointments`, `/appointments/doctor/:id` |
| `/admin/notices` | Notice publishing | STAFF, ADMIN | No | Planned | `/notices` CRUD |
| `/admin/grievances` | Grievance triage | STAFF, ADMIN | No | Planned | `/grievances` CRUD |
| `/admin/blood-bank` | Blood stock management | STAFF, ADMIN | No | Planned | `/blood-bank/stock` |
| `/admin/contact-messages` | Contact message inbox | STAFF, ADMIN | No | Planned | `/contact` list and stats |
| `/admin/departments` | Department management | ADMIN | No | Planned | `/departments` CRUD |
| `/admin/users` | Users and roles | ADMIN | No | Planned | `/users` |
| `/admin/audit-log` | Audit trail | ADMIN | No | Planned | `/audit-logs` |
| `/doctor` or `/staff/appointments` | Clinic day list for doctors | DOCTOR, STAFF | No | Planned | `/appointments/doctor/:id`, `PUT /appointments/:id/status` |
| `app/not-found.tsx` | 404 page | Public | No | Planned | None |
| `app/error.tsx` | Route error boundary | Public | No | Live | `POST /client-errors` |
| `app/global-error.tsx` | Fatal error boundary | Public | No | Live | `POST /client-errors` |
| `app/**/loading.tsx` | Route-level loading states | Public | No | Planned — components currently own their skeletons | None |

### 3.4 Deferred routes (not current scope)

| Route | Page | Phase |
|---|---|---|
| `/abha` | Link or create an ABHA number | Phase 3 |
| `/abha/consent` | Consent artefact management | Phase 3 |
| `/records` | Health record list | Phase 3 |
| `/records/[bundleId]` | FHIR record viewer | Phase 3 |
| `/notifications` | SMS/email/in-app notification centre | After a transport exists |
| `/offline` | PWA offline fallback | After service-worker work |
| `/maintenance` | Planned maintenance page | Deployment phase |

Do not add navigation links to deferred routes. Dead links are worse than a
missing feature.

---

## 4. Public and citizen page specifications

### 4.1 Home (`/`)

**Purpose:** Explain the hospital, route citizens to the six core tasks, and
surface urgent information.

**Sections in order:**

1. **Hero** — hospital identity, "Government of Bihar" eyebrow, one-line service
   promise, primary CTA "Book Appointment", secondary CTA "Emergency Services",
   emergency phone. Trust indicators (24/7 emergency, doctor count, department
   count) must come from configuration or the API, not invented copy.
2. **Core services** — six cards: Appointments, Find a Doctor, Blood Bank,
   Grievances, Notices, Feedback. Each card is one link with an icon, title, and
   one-line description.
3. **Departments preview** — six to eight active departments from
   `/departments`, each with name, one-line description, doctor count, and a
   link to the department detail page.
4. **Doctors preview** — three or four featured doctors with name,
   specialization, qualification, availability, and a booking link.
5. **Blood bank summary** — eight blood groups, units available, last-updated
   timestamp, critical-stock callout, link to `/blood-bank`.
6. **Notices preview** — latest three to five published notices with category,
   date, and priority. Link to `/notices`.
7. **Visit information band** — OPD hours, address, phone, and a directions
   link. Useful for users who are not booking online.

**States:** each data-backed section loads independently. A failure in one
section shows an inline error with retry and does not blank the page.
Skeletons match the final card dimensions to avoid layout shift.

**Data:** `/departments`, `/doctors`, `/blood-bank/summary`,
`/notices/published`. Do not hard-code department or doctor names.

**Metadata:** `Hospital` or `MedicalOrganization` structured data, canonical URL,
OG image, and a description that names the hospital and district.

### 4.2 Services index (`/services`)

**Purpose:** Let a citizen browse departments and understand emergency care.

**Layout:**

- Page hero: "Our Medical Services", one-sentence description.
- Search field ("Search departments") and an optional category filter.
- Department cards in a responsive grid: icon, name, short description, doctor
  count, OPD hours, "View department" and "Book appointment" actions.
- Emergency services panel: ambulance 102/108, emergency department hours,
  what to do in an emergency, hospital address and directions.
- Empty state when filters match nothing; error state with retry; skeleton grid.

**Rules:**

- The whole card is not a single link if it contains two actions; use a heading
  link plus separate action links.
- Preserve the search and filter in the URL (`?q=`, `?department=`).
- Do not use fake department IDs.

### 4.3 Department detail (`/services/[id]`)

**Purpose:** Explain one department and list its doctors.

**Layout:**

- Breadcrumb.
- Hero: department icon, name, description.
- Information card: doctor count, OPD days and hours, hospital phone, location.
- Doctor grid for the department: name, specialization, qualification,
  experience, fee, rating, "Book appointment".
- Empty state when the department has no doctors: "No doctors are listed for
  this department yet. Call the hospital helpline for assistance."
- Related departments or "Back to all services" link.

**Rules:**

- Unknown or inactive department returns the 404 page.
- Support a human-readable slug as well as the UUID, or redirect UUID URLs to
  the slug. Footer and home links must use the canonical form.
- Metadata uses the department name and description.
- Do not render a doctor card if the API omitted required fields; skip it and
  log the data problem rather than showing "undefined".

**Known gap:** footer links currently use slugs such as
`/services/general-medicine`, while the page calls `/departments/:id` with a
UUID. Either add slug lookup on the backend or change the links to UUIDs.

### 4.4 Doctor directory (`/doctors`)

**Purpose:** Find a doctor by name, specialization, department, or availability.

**Layout:**

- Hero: "Our Specialist Doctors", one-sentence description.
- Toolbar: search by name/specialization/department, department select, sort by
  rating / experience / fee, result count, clear-filters action.
- Doctor cards: photo or initial avatar, name, specialization, qualification,
  department, experience, languages, available days, consultation fee, rating
  and review count, "View profile", "Book appointment".
- Pagination or "Load more" when the result set exceeds one screen.
- Skeleton grid; empty state with a clear-filters action; error state with retry.

**Rules:**

- URL state for `q`, `department`, `sort`, and `page`.
- Booking from a card passes the doctor to the wizard
  (`/appointments?doctorId=<id>`), so the user does not select the doctor twice.
- Do not show a rating if there are no reviews; show "New" or omit the stars.
- Images need meaningful alt text; initials are decorative and `aria-hidden`.

### 4.5 Doctor profile (`/doctors/[id]`)

**Purpose:** Give the citizen enough information to choose and book this doctor.

**Layout:**

- Breadcrumb.
- Hero: "Dr <Name>", specialization, department.
- Profile card: avatar, qualification, HPR ID when present, rating and review
  count, experience, department, consultation fee, languages, bio.
- Availability card: available days, timing, slot capacity, "Book appointment
  with Dr <Name>".
- Optional: related doctors in the same department.

**Rules:**

- Unknown or inactive doctor returns 404.
- The bio fallback must interpolate the doctor's name, specialization, and
  department. The current string renders literal `{doctor.specialization}`
  placeholders; fix it.
- The booking CTA carries `?doctorId=<id>`.
- Metadata uses `Dr <Name> | District Hospital Araria`.

### 4.6 Appointment booking (`/appointments`)

**Purpose:** Book an OPD, teleconsultation, or follow-up appointment.

**Four-step wizard:**

1. **Department** — selectable cards from `/departments`. Selected state is
   marked with a check icon and text, not colour alone.
2. **Doctor** — doctors in the selected department; name, specialization,
   qualification, fee, availability. Empty state with a phone number when no
   doctor is listed.
3. **Date and time** — date picker from today to 60 days ahead; appointment
   type (OPD, Teleconsultation, Follow-up); available slot chips from
   `/doctors/:id/slots?date=...`. No slots: explain that slots may be full and
   offer the hospital phone. A slot that becomes unavailable on submit must
   refresh the list and explain what happened.
4. **Details** — reason for visit (required, minimum 10 characters), optional
   notes, summary card (doctor, department, date, time, type, fee), and the
   confirm button.

**Auth gate:**

- Check authentication before step 4, not only on submit. If signed out, show an
  inline panel: "Sign in to confirm this appointment", with a login link that
  returns to the wizard and preserves the selection.
- Never lose the selected doctor/date/time when redirecting to login.
- After login, return to `/appointments` with the selection restored from
  session storage or query params.

**Success:**

- Replace the wizard with a confirmation panel, not only a toast.
- Show token number, doctor, department, date, time, type, fee, arrival
  instruction ("arrive 15 minutes early"), hospital address, a print action,
  "View my appointments", and "Book another".
- Announce the confirmation with a live region and move focus to the heading.

**Errors:**

- 401: session expired, link to login.
- 409: slot taken, refresh slots.
- 5xx/network: keep the form values and offer retry.
- Validation: inline errors plus a focusable error summary.

**Accessibility:** stepper uses `aria-current="step"`; each step has a heading
and receives focus on change; Back/Next are real buttons; no keyboard trap.

**Data:** `/departments`, `/doctors?departmentId=`, `/doctors/:id/slots`,
`POST /appointments`. Booking is authenticated; the API also accepts a
`patientId` for guests, but the UI must not invent one.

### 4.7 My appointments (`/account/appointments`)

**Status:** Planned. The API exists (`GET /appointments/my`,
`DELETE /appointments/:id`); there is no page.

**Layout:**

- Tabs: Upcoming, Past, Cancelled.
- Appointment cards: token number, doctor, department, date, time, type,
  status, fee, reason, actions.
- Actions: view details, cancel (confirmation with consequence text), book
  again, get directions.
- Empty state per tab with "Book an appointment" CTA.
- Auth gate for signed-out users, with redirect back.
- Pagination when needed.

**Rules:**

- Cancelling must state whether the slot is released and whether a fee applies.
- There is no reschedule endpoint. Do not show "Reschedule" until one exists;
  offer "Book a new appointment" and explain that the old one must be cancelled.
- `noindex`; never expose another patient's appointment.

### 4.8 Blood bank inventory (`/blood-bank`)

**Purpose:** Show current stock and route urgent requests to a human.

**Layout:**

- Page hero: "Blood Bank Inventory", one-sentence description.
- Status strip: last updated, source label, refresh action.
- Inventory: eight blood-group cards or a table, each with units available and
  a status label (Adequate, Low, Critical). Expand for component types (whole
  blood, packed red cells, platelets, plasma, cryoprecipitate).
- Critical-stock banner with the blood bank phone number.
- Actions: "Request blood", "Donate blood", "Call the blood bank".
- Accessible table alternative with caption and headers.

**Rules:**

- Status is never conveyed by colour alone; pair it with text and an icon.
- Thresholds must be named in the UI or configuration (for example: 0 =
  critical, 1–10 = low, 11+ = adequate). Do not hard-code unexplained colours.
- Do **not** label the data "e-RaktKosh integrated" unless the sync exists. The
  current integration is planned; label the source honestly, for example
  "Updated by the hospital blood bank".
- Loading skeleton, empty state ("Stock information is being updated; call the
  blood bank"), and error state with phone fallback.
- Metadata includes the hospital and blood bank.

**Data:** `/blood-bank`, `/blood-bank/summary`.

### 4.9 Blood request (`/blood-bank/request`)

**Status:** Partial — the form has no submit handler, no API, and no
persistence. Leaving it as a form that silently does nothing is a safety issue.

**Choose one:**

1. **Build it:** add a `blood_requests` table and endpoint, then collect patient
   name, blood group, units required, contact phone, hospital/ward, urgency
   (routine/urgent/emergency), needed-by date/time, and consent to be contacted.
   Return a reference number and show it in a success panel.
2. **Do not pretend:** replace the form with a clear instruction to call the
   blood bank on +91-6453-222102, with hours and an emergency note. This is the
   safe interim state.

**If built:**

- Validate phone, units (1–10), and needed-by date.
- Show a prominent emergency callout: for an emergency, call 102/108 and the
  blood bank; do not wait for the web form.
- Success includes reference, what happens next, and the phone number.
- Privacy note covers who sees the request.
- Rate limit and spam protection are server-side.

### 4.10 Blood donation (`/blood-bank/donate`)

**Purpose:** Explain eligibility and make it easy to donate.

**Layout:**

- Hero with a clear "Donate blood" message.
- Eligibility: age 18–65, weight above 45 kg, haemoglobin above 12.5 g/dL, good
  general health, and a "when not to donate" list (fever, recent surgery,
  pregnancy, certain medications).
- Blood bank hours and address.
- What to bring and what to expect (screening, donation time, refreshments).
- Actions: call the blood bank, get directions, "Check blood availability".
- Optional: upcoming donation camps (only if data exists).

**Rules:**

- Do not collect donor medical data on this page until a donor registration
  backend and privacy notice exist.
- Emergency phone remains visible.

### 4.11 Grievances (`/grievances`)

**Purpose:** File a CPGRAMS-style grievance and get a reference number.

**Layout:**

- Hero: "Grievance Redressal", 30-day resolution promise, privacy note.
- Category cards: medical negligence, staff behaviour, infrastructure, billing,
  appointment, medicine availability, cleanliness, other.
- Form: name, email, phone, category, subject, description, consent/declaration.
- Helper text: what makes a good grievance, what not to include (other
  patients' personal data), and the expected timeline.
- Success panel: reference number, copy action, what happens next, and a link to
  track status **only if the tracking route exists**.

**Honesty rule:** the current success screen says "CPGRAMS Integrated",
"Auto-forwarded", and "Also sent to your email and SMS". None of those are live.
Remove the claims until the integration and transport exist, or label them as
"planned".

**Known gaps:**

- The success CTA points to `/grievances/track`, which does not exist.
- There is no public grievance tracking endpoint. Either build
  `GET /grievances/track/:reference` with a reference + phone/OTP check, or
  remove the CTA and direct signed-in users to `/account/grievances`.
- Grievances and complaints are two separate intake flows. Decide whether they
  merge (see section 10).

### 4.12 File a complaint (`/complaint`)

**Purpose:** Fast complaint intake with an optional photo, separate from the
longer grievance form.

**Layout:**

- Hero: "File a Complaint", explanation that the hospital administration tracks
  it until resolution.
- Form: department (required), name (required, prefilled when signed in),
  complaint description (required), optional photo.
- Photo rules: JPEG/PNG/WebP, maximum 5 MB, preview, remove, camera capture on
  mobile, clear error for wrong type/size.
- Privacy notice: who can see the complaint and photo, how long it is kept.
- Success panel: reference number, copy action, submitted summary, link to
  `/complaints/track`, "File another complaint".

**Validation and accessibility:**

- Inline errors, `aria-invalid`, `aria-describedby`, and a focusable error
  summary.
- Move focus to the success heading.
- Do not upload the photo until the form is submitted.
- Do not put personal data in the URL.

**Data:** `POST /complaints`, `/departments`.

### 4.13 Complaint tracking (`/complaints/track`)

**Purpose:** Let a citizen check a complaint using its reference ID.

**Layout:**

- Hero: "Track Your Complaint".
- Form: reference ID, submit, helper text explaining where the ID came from.
- Result card: reference, department, status badge with icon, complaint details,
  resolution when present, submitted and last-updated timestamps, "File a new
  complaint".
- Not-found state: "We could not find a complaint with that reference. Check the
  ID and try again."
- Loading state on the button; error state for network failure.

**Rules:**

- `noindex`.
- Mask or omit personal details; the reference ID is the only proof required, so
  do not add name/phone to the result.
- Status is shown with text and icon, not colour alone.
- Long IDs wrap; provide a copy action.

**Data:** `GET /complaints/track/:id`.

### 4.14 General feedback (`/feedback`)

**Purpose:** Collect quick, mostly anonymous feedback about a visit.

**Layout:**

- Hero: "Share your feedback", one-sentence purpose.
- Form: department, service area, overall rating (1–5, accessible stars),
  criteria ratings (cleanliness, staff behaviour, waiting time), optional
  comment, optional name/phone/email, anonymous explanation.
- Consent/notice: how feedback is used and who sees it.
- Submit, loading, success panel, rate-limit message ("You recently submitted
  feedback; please try again later").
- Links: "Have a complaint?" and staff inbox only for authorised users.

**Rules:**

- The rating control must be keyboard operable with radio-group semantics; arrow
  keys change the value; the current value is announced.
- Do not require contact details for anonymous feedback.
- Do not show the staff inbox link to the public unless the destination handles
  permission denial gracefully.

**Data:** `POST /feedback`.

### 4.15 Department feedback (`/feedback/[departmentId]`)

**Purpose:** A shareable link that opens the feedback form with one department
preselected.

**Layout:** same as general feedback, with:

- Hero: "How was your visit?"
- Department shown as a read-only chip or preselected field.
- Link to the general form for another department.
- Staff inbox link only when authorised.

**Rules:**

- Validate the department; unknown/inactive shows a clear message and the
  general form link, not a broken form.
- The department must not be changeable in a way that contradicts the shared
  link unless the user explicitly chooses "Change department".
- Metadata is `noindex`? Public department feedback links may be indexed; keep
  them indexable only if the hospital wants them discoverable. Default:
  indexable.

### 4.16 Notices index (`/notices`)

**Purpose:** Publish official circulars, recruitment, tenders, and health
advisories.

**Layout:**

- Hero: "Notices & Announcements".
- Toolbar: search by title/content, category filter (All, General, Recruitment,
  Tender, Public Health, Schedule Change, Emergency), clear filters.
- List rows or cards: title, category badge, priority badge, published date,
  "New" indicator for recent items, attachment indicator, short excerpt,
  "Read notice".
- Pagination or "Load more".
- Empty state with clear filters; error state with retry; skeleton list.

**Rules:**

- URL state for `q`, `category`, `page`.
- Sort newest first by `publishedAt`.
- Do not hide an API outage behind hard-coded sample notices; show the error.
- Emergency notices must be visually distinct and appear first.

**Data:** `/notices/published`.

### 4.17 Notice detail (`/notices/[id]`)

**Purpose:** Read one official notice and download its attachment.

**Layout:**

- Breadcrumb.
- Hero: priority badge, category badge, title, published date.
- Body: notice content with preserved paragraph breaks.
- Attachment card: file name/type/size if known, accessible download link.
- Back to notices; print action; share action.
- Expired notice: show "This notice expired on <date>" while keeping the content
  readable.

**Rules:**

- Sanitize HTML before rendering. The current page uses
  `dangerouslySetInnerHTML` on API content; this must go through an allow-list
  sanitizer or be rendered as plain text with paragraphs.
- Unknown, unpublished, or expired-and-hidden notices return 404.
- Metadata uses the title and a plain-text excerpt.
- Attachments open in a new tab with `rel="noopener noreferrer"` and a label
  that includes the file type.

**Data:** `/notices/:id`.

### 4.18 Contact (`/contact`)

**Purpose:** Give every channel and accept a message.

**Layout:**

- Hero: "Contact Us".
- Contact cards: address with directions, hospital phone, emergency 102/108,
  blood bank phone, email, OPD hours, emergency hours.
- Department-wise contact list when available.
- Contact form: name, email, phone, subject, message, consent.
- Map: embedded map or a static map image plus a directions link. The map must
  have a text alternative and must not be the only way to find the hospital.
- Success panel and error handling.

**Rules:**

- Phone numbers are `tel:` links; email is `mailto:`.
- Do not promise a response time that the hospital has not agreed to.
- Form validation is inline; server errors keep the entered values.
- Rate-limit message is specific.
- Privacy note explains where messages go.

**Data:** `POST /contact`.

### 4.19 Content and legal pages

These pages share a layout: page hero, prose body with a maximum readable
width, last-reviewed date, and a contact CTA. They are static, but they still
need loading-free rendering, metadata, and a print stylesheet.

| Route | Required content | Specific rules |
|---|---|---|
| `/faqs` | OPD timing, booking, blood availability, complaints, records, emergency numbers | Accordion with `aria-expanded` and `aria-controls`; one open item at a time is optional; include search when the list grows; contact CTA at the end. |
| `/forms` | Patient registration, consent, medico-legal, birth registration, death registration, complaint form | Real PDF files with file type and size; `download` attribute; accessible link names; last-updated date. No `href="#"`. |
| `/health-tips` | Hydration, exercise, diet, checkups, vaccination, mental health | Short, reviewed copy; reviewer/date; medical disclaimer; no personalised advice. |
| `/insurance` | PM-JAY, CGHS, Bihar state scheme, ESIC, private insurance, cashless claims | Eligibility, documents required, help desk, empanelled providers, last-updated date. Do not claim empanelment without confirmation. |
| `/patient-rights` | Rights and responsibilities | Charter-style list, print action, complaint CTA, link to the official charter PDF when available. |
| `/privacy` | Data collected, purpose, legal basis, retention, sharing, security, rights, grievance officer, contact | Name the data protection/grievance officer and the request process; state the last-updated date; link to the accessibility statement. |
| `/terms` | Acceptance, use, appointments, privacy, liability, governing law, contact | Plain language; link to privacy; state that medical advice is not provided by the website. |
| `/accessibility` | Conformance target, features, known limitations, feedback contact, date | State WCAG 2.2 AA and GIGW 3.0; list known gaps honestly; give an email and phone for barriers; include the last audit date. |
| `/sitemap` | All public routes grouped by section | Generate from a route registry so it cannot drift; include detail-page patterns; link to the XML sitemap; mark admin/account pages as excluded. |

**Content governance:** every legal or medical content page shows "Last reviewed:
<date>" and an owner. Copy changes to these pages need a named reviewer.

---

## 5. Authentication, account, and admin pages

### 5.1 Login (`/login`)

- Centered card with hospital branding, one `h1` ("Sign in to your account"),
  and a link to register.
- Fields: email, password with show/hide, remember me, forgot password.
- Session-expired banner when `?expired=true`.
- Redirect target: only same-origin relative paths. Reject absolute URLs and
  protocol-relative URLs to prevent open redirects.
- Loading state on submit; inline validation; API error toast with an actionable
  message.
- Demo credentials: render only when `NODE_ENV !== 'production'` and the flag is
  explicitly enabled. The current page shows them unconditionally; fix this.
- Terms and privacy links.
- `noindex`.

### 5.2 Register (`/register`)

- Fields: full name, email, Indian phone, password, confirm password, terms
  consent.
- Password rules: at least 8 characters, upper, lower, number, special.
- Strength meter with text, not colour alone; announce the current strength.
- Show/hide controls with accessible labels.
- Inline validation; focus the first invalid field; keep values on server error.
- Success: toast plus redirect to the intended destination (default
  `/account`).
- Remove disabled Google/GitHub buttons or label them "Not available yet". A
  disabled button with no explanation is a dead end.
- `noindex`.

### 5.3 Forgot password (`/forgot-password`)

- Email field, submit, anti-enumeration message ("If an account exists...").
- Explain that the user should check spam and contact the help desk if no email
  arrives.
- **Honesty:** no mail transport exists yet. Do not tell the user an email was
  sent when it was not. Until SMTP and a reset-token table exist, show the
  help-desk path instead, or finish the backend first.
- `noindex`.

### 5.4 Reset password (`/reset-password`)

**Status:** Planned. The API route exists but is a stub.

- Read the token from the query string; never log it.
- Fields: new password, confirm password; same rules as registration.
- States: valid token, expired/invalid token, success, network error.
- Success redirects to login with a confirmation message.
- If the backend still returns success without validating the token, do not
  ship this page; fix the backend first.
- `noindex`.

### 5.5 Account area (`/account`, `/account/*`)

**Status:** Planned. The backend endpoints exist.

**Shell:** signed-in only; sidebar or tabs for Overview, Appointments,
Grievances, Profile, Security. `noindex`. Redirect to login with a return path;
show a permission-denied page for the wrong role.

- **Overview:** next appointment, open grievances count, recent feedback,
  profile completeness, quick actions.
- **Appointments:** as section 4.7.
- **Grievances:** list with reference, category, subject, status, submitted
  date, last update, resolution; detail view; link to file a new grievance.
  Read-only unless the backend supports comments/attachments.
- **Profile:** name, phone, email (read-only unless the backend supports email
  change), save, success/error.
- **Security:** change password (current, new, confirm), show/hide, strength,
  success clears the form, error explains which rule failed. Optionally show
  active sessions when the backend supports it.

### 5.6 Staff and admin shell

- Server-side or layout-level role check: `ADMIN` and `STAFF` only. Do not rely
  on hiding a link.
- `noindex` on every admin page.
- Consistent admin header with the section title, one-sentence description, and
  tabs: Complaints, Feedback, Appointments, Notices, Grievances, Doctors, Nodal
  Officers, Blood Bank, Contact Messages, Departments, Users, Audit Log.
- Tabs scroll horizontally on mobile; the active tab is marked.
- `/admin` should be a dashboard or a redirect to the first permitted tab. A
  layout without an index page is a 404 today.
- Every admin page has: loading, empty, error, permission-denied, and success
  states.
- Destructive actions require confirmation and explain consequences.
- Tables become cards or scroll horizontally on mobile; never clip actions.
- Export actions show progress and a filename.

**Admin dashboard (`/admin`):**

- KPI cards: today's appointments, pending complaints, new feedback, critical
  blood groups.
- Quick links to the most-used sections.
- Recent activity from the audit log.
- "Updated at" timestamp and refresh.

### 5.7 Admin complaints (`/admin/complaints`)

**Live.**

- KPI strip: total, submitted, under review, in progress, resolved, rejected.
- Filters: search, status, department, date range, sort.
- Cards or table: reference, citizen name, department tag, submitted date,
  status, photo thumbnail, assigned officer.
- Row detail: full complaint, photo with alt text, status history, resolution
  field, update action.
- Actions: update status, add resolution, export CSV, refresh.
- Staff see only their department scope; admins see all. Show a scope banner.
- Optimistic status update is allowed only if the API result is reconciled and
  failures roll back visibly.
- Photo viewer: accessible dialog with caption and close on Escape.
- Empty state explains the filter or the absence of complaints.

### 5.8 Feedback inbox (`/feedback/inbox`)

**Live.** This is the staff inbox even though it sits outside `/admin`.

- Stats: total, new, acknowledged, resolved, average rating.
- Filters: department, status, service area, rating, date.
- Feedback cards: department, service area, overall rating, criteria ratings,
  comment, contact details when provided, submitted date, status badge.
- Status actions: Acknowledge, Resolve, with pending state and error recovery.
- Access panel: grant/revoke department access (ADMIN only).
- Share links: department feedback URLs with copy action.
- Pagination; empty, error, and permission-denied states.
- `noindex`.
- Consider moving to `/admin/feedback` with a redirect from the current URL.

### 5.9 Admin doctors (`/admin/doctors`)

**Partial.**

- Search by name, specialization, or department; department filter; refresh.
- Table: doctor, specialization, department, experience, fee, rating, actions.
- Add doctor modal: name, email, phone, specialization, qualification,
  experience, department, fee, HPR ID, languages, bio. Required-field
  validation with inline errors.
- Edit doctor: **missing**; add it with the same form, prefilled.
- Delete: confirmation explaining that the doctor and linked user are affected.
- Active/inactive toggle when the API supports it.
- Empty, loading, error states.
- `noindex`.

### 5.10 Nodal officers (`/admin/nodal-officers`)

**Live.**

- Explanation: nodal officers can view and update complaints for their
  department only.
- Table: staff member, email, department, role, granted date, actions.
- Assign modal: staff member select, department select, explanation of scope.
- Revoke: confirmation.
- Empty state with a clear "Assign access" CTA.
- `noindex`.

### 5.11 Admin appointments (`/admin/appointments`)

**Planned.** API exists.

- Day view with date picker and department/doctor/status filters.
- Summary: total, confirmed, checked-in, completed, no-show, cancelled.
- Table/cards: token, patient, doctor, department, date, time, type, status,
  actions.
- Actions: confirm, check in, complete, mark no-show, cancel, reschedule (needs
  a backend endpoint).
- Doctor view: today's list for one doctor, ordered by time/token.
- Print day list.
- Permission: staff/admin see the desk; doctors see their own list.
- `noindex`.

### 5.12 Admin notices (`/admin/notices`)

**Planned.** API exists.

- List: title, category, priority, published date, expiry, status
  (draft/published/expired), author, actions.
- Create/edit: title, content (plain text or sanitized rich text), category,
  priority, publish date, expiry date, attachment, language, publish toggle.
- Preview before publishing.
- Publish/unpublish with confirmation; show the public URL.
- Delete with confirmation.
- Validation: title, content, publish date, expiry after publish date.
- `noindex`.

### 5.13 Admin grievances (`/admin/grievances`)

**Planned.** API exists.

- Filters: status, category, assigned officer, date, search.
- Table: reference, citizen, category, subject, status, assigned to, submitted,
  age/SLA.
- Detail: description, contact, status history, assignment, resolution.
- Actions: assign, update status, add resolution, export.
- SLA indicator for the 30-day promise; escalate when overdue.
- `noindex`.

### 5.14 Admin blood stock (`/admin/blood-bank`)

**Planned.** API exists.

- Matrix editor: 8 blood groups × 5 component types.
- Actions: set absolute units, increment/decrement, save, refresh.
- Validation: non-negative integers; confirm large changes.
- Low/critical highlighting with text labels.
- Last-updated timestamp and audit note.
- `noindex`.

### 5.15 Admin contact messages (`/admin/contact-messages`)

**Planned.** API exists.

- Inbox list: name, email, phone, subject, date, read/archived.
- Detail: full message, reply link (`mailto:`), mark read/archived.
- Filters: read state, date, search.
- Empty and error states.
- `noindex`.

### 5.16 Admin departments (`/admin/departments`)

**Planned.** API exists.

- List: name, description, icon, doctor count, active state, order.
- Create/edit: name, description, icon, image, active.
- Delete: blocked with an explanation when doctors are attached.
- `noindex`.

### 5.17 Admin users (`/admin/users`)

**Planned.** API exists.

- List: name, email, phone, role, active, created date.
- Filters: role, active, search.
- Actions: change role, activate/deactivate, delete (ADMIN only).
- Confirm role changes and deletions; explain the effect on linked records.
- Never expose password hashes or tokens.
- `noindex`.

### 5.18 Audit log (`/admin/audit-log`)

**Planned.** API exists (`/audit-logs`).

- Read-only table: timestamp, actor, action, resource, resource ID, IP,
  user agent.
- Filters: actor, action, resource, date range.
- Detail drawer with the JSON details, formatted readably.
- Export.
- `noindex`; access is ADMIN only.

### 5.19 Doctor / staff clinic desk

**Planned.**

- Today's appointments for the signed-in doctor (or a selected doctor for
  staff).
- Ordered by time/token; patient name, reason, type, status.
- Actions: call next, check in, complete, no-show.
- Empty state for a quiet day.
- `noindex`.

---

## 6. System pages and deferred scope

### 6.1 404 page (`app/not-found.tsx`)

- Header and footer, one `h1` ("Page not found"), short explanation, links to
  Home, Services, Doctors, Appointments, Contact.
- Search or a sitemap link.
- Do not blame the user. Do not show a stack trace.
- Return the correct 404 status.

### 6.2 Error boundaries (`error.tsx`, `global-error.tsx`)

Already live. Keep:

- Plain-language message, retry action, home link, reference/digest when
  available, hospital phone for urgent help.
- The global boundary must render its own `<html>`/`<body>` and must not depend
  on Tailwind.
- Report one PII-free telemetry event per error.

### 6.3 Loading states

- Prefer route-level `loading.tsx` for page shells and component skeletons for
  data sections.
- Skeletons mirror the final layout and are `aria-hidden`.
- Announce long operations with a polite live region.
- Never show a blank screen or an infinite spinner.

### 6.4 Offline and maintenance

Deferred, but design the copy now:

- Offline: "You are offline. Cached information may be out of date. Call
  +91-6453-222123 for urgent help."
- Maintenance: expected return time, emergency numbers, and a status link.
- Both pages keep the header/footer and emergency contacts.

### 6.5 Session expiry and permission states

- Session expiry: modal or page explaining that the session ended, with a login
  link that returns to the same page.
- Permission denied: explain which role is required, offer the correct
  destination, and never reveal whether a record exists.
- Do not redirect silently.

### 6.6 Deferred ABDM pages

Phase 3, when the backend gateway and consent lifecycle are real:

- `/abha` — link or create an ABHA number.
- `/abha/consent` — view, grant, and revoke consent artefacts.
- `/records` — list care contexts and FHIR bundles.
- `/records/[bundleId]` — record viewer with consent proof and audit notice.
- Every read shows who accessed what and why; consent expiry is visible.

Do not ship placeholder ABHA screens or links.

---

## 7. Cross-cutting UX requirements

### 7.1 Required page states

Every data-backed page implements:

| State | Requirement |
|---|---|
| Loading | Skeleton or spinner that matches the final layout; no layout jump. |
| Empty | Icon, heading, one-sentence explanation, primary action or phone number. |
| Error | What failed, retry, and a fallback channel (phone/email) for critical services. |
| Success | Confirmation with the next step, reference number where relevant. |
| Permission | Who can access, what to do next, no data leakage. |
| Partial | If one section fails, the rest of the page still works. |

### 7.2 Forms

- Label every field; placeholders are not labels.
- Required fields are marked in text, not only with an asterisk.
- Helper text explains the expected format ("Enter full name as per Aadhaar",
  "10-digit mobile number").
- Inline validation on blur and submit; error summary with links to fields.
- `aria-invalid`, `aria-describedby`, and focus management on failure.
- Keep values after a server error.
- Disable submit only while submitting; never leave a form permanently disabled.
- Success moves focus to the confirmation heading.
- Destructive actions require confirmation.

### 7.3 Lists, filters, and pagination

- List endpoints paginate; the UI provides page controls or "Load more".
- Filters and pagination live in the URL and survive refresh/back.
- Result counts use correct singular/plural.
- Clear-filters action appears when any filter is active.
- Empty states distinguish "no data" from "no matches".
- Sorting is explicit and visible.

### 7.4 Authentication and authorization

- Gate the UI early, not only at the final submit.
- Preserve the intended destination through login.
- Validate redirect targets as same-origin relative paths.
- Hide admin navigation from unauthorised users, but enforce roles on the server.
- Never render another user's data from a guessed ID.
- Treat 401, 403, 404, and 429 as distinct states with different copy.

### 7.5 File uploads

- State accepted types and maximum size before the picker.
- Validate on the client and the server.
- Show a preview, file name, size, and remove action.
- Never upload before submit unless the product explicitly supports drafts.
- Scan/validate on the server; never trust the MIME type alone.

### 7.6 Print and share

- Appointment confirmation, prescriptions (future), patient rights, and notices
  are printable. Use a print stylesheet that hides navigation and buttons.
- Share actions copy a canonical URL. Never include personal data in a share
  URL.

### 7.7 SEO and metadata

- Public pages: unique title, description, canonical URL, OG/Twitter image.
- Detail pages: title from the record, description from the content.
- Admin, account, inbox, tracking, login, register, reset: `noindex, nofollow`.
- One `h1` per page; logical heading order.
- Structured data for the hospital and notices when appropriate.
- The HTML sitemap and XML sitemap must agree.

### 7.8 Privacy and safety

- Collect the minimum data needed for the task.
- Explain who sees it and how long it is kept.
- Do not put names, phone numbers, or reference IDs in analytics or URLs.
- Mask personal data in staff lists where full data is not needed.
- Emergency copy is never hidden behind a form or a login.
- Medical content includes a disclaimer and a review date.

### 7.9 Telemetry

- Report client errors with a route and digest, never with form contents.
- Log key funnel events without PII: booking started, booking confirmed,
  complaint submitted, feedback submitted, login failed (reason category only).
- Do not add a third-party analytics script without a privacy review.

---

## 8. Accessibility requirements (non-negotiable)

Target: **WCAG 2.2 Level AA** and **GIGW 3.0**.

- Keyboard-only operation for every flow, including the booking wizard, star
  ratings, photo upload, filters, modals, and admin tables.
- Focus management: move focus on route change, modal open, wizard step change,
  and success state; trap focus in modals; return focus on close.
- Landmarks: `header`, `nav` with an accessible name, `main`, `footer`.
- One `h1`; no skipped heading levels.
- Visible focus rings with at least 3:1 contrast against the adjacent colour.
- Text contrast at least 4.5:1; large text 3:1; never rely on colour alone.
- Touch targets at least 44×44 CSS pixels.
- `prefers-reduced-motion` disables non-essential animation.
- High-contrast and forced-colours modes remain usable.
- Images have meaningful alt text; decorative images are `alt=""` and
  `aria-hidden`.
- Icons that carry meaning have a text label or an accessible name.
- Live regions announce toasts, status changes, and async results.
- Tables have captions, header cells, and scope.
- Error messages are associated with their fields and summarised.
- Video has captions; audio has a transcript.
- The skip link is the first focusable element.
- `lang` is correct; RTL is supported when Urdu is added.
- No information is conveyed only by hover.
- Time limits can be extended; the booking flow does not expire mid-entry.

Page-specific checks:

- Booking wizard: stepper semantics, focus per step, no keyboard trap.
- Rating: radio-group semantics and arrow-key support.
- Photo upload: keyboard-operable picker, error announced.
- Admin tables: sortable headers announce direction; row actions have names.
- Modals: labelled by their heading, Escape closes, focus returns.

---

## 9. Responsive design, content, and visual system

### 9.1 Responsive

- Mobile-first. Test at 320, 375, 768, 1024, 1440, and 1920 px.
- No horizontal page scroll at 320 px.
- Header collapses below `xl`; the mobile drawer contains every nav item and
  emergency contacts.
- Grids: 1 column on mobile, 2 on small tablets, 3–4 on large screens.
- Tables become cards or horizontally scrollable with a visible hint.
- Sticky action bars on mobile must not cover the footer or the keyboard.
- Font sizes remain readable; no text below 14 px for body copy.
- Forms use full-width controls on mobile and 16 px+ inputs to avoid iOS zoom.
- Test with 200% text zoom and landscape orientation.

### 9.2 Content and copy

- Indian English, respectful address, short paragraphs.
- No lorem ipsum, no placeholder names, no invented statistics.
- Use real service language: "Book an appointment", "Check blood availability",
  "File a complaint".
- Emergency copy is unambiguous and repeated at the point of need.
- Dates use `en-IN` formatting and include the year.
- Numbers and units are explicit ("10 units", "₹500", "9:00 AM–4:00 PM").
- Error messages state what went wrong and how to fix it.
- Every content page has an owner and a last-reviewed date.

### 9.3 Visual system

- **Colours:** existing Tailwind palette. Primary sky (`primary-600` `#0284c7`),
  secondary fuchsia (`secondary-600` `#c026d3`), semantic success/warning/danger,
  gray neutrals. Do not introduce a new palette.
- **Typography:** Inter. One `h1`; `h2` for sections; `h3` for cards. Body 16 px
  minimum.
- **Spacing:** Tailwind scale only; no arbitrary pixel values.
- **Radius:** cards `rounded-xl`; large feature panels may use `rounded-2xl`
  sparingly; buttons/inputs `rounded-lg`; badges `rounded-full`. Do not use
  `rounded-2xl` on every surface.
- **Elevation:** one subtle shadow level for cards; no shadow-heavy stacks.
- **Container:** `max-w-7xl` with responsive horizontal padding.
- **Components:** reuse `@dh-araria/ui` (`Button`, `Card`, `Input`, `Select`,
  `Textarea`, `Modal`, `Table`, `Alert`, `Badge`, `Avatar`). Prefer composition.
- **Icons:** lucide-react, 16–24 px, decorative unless labelled.

### 9.4 The honesty rule

A government health portal loses trust permanently when it claims something it
cannot do. Therefore:

- Do not say "integrated with e-RaktKosh", "CPGRAMS integrated", "email and SMS
  sent", "ABDM linked", or "24/7 online" unless the integration is live and
  monitored.
- Do not show a form that has no submit handler.
- Do not link to a route that does not exist.
- Do not show demo credentials in production.
- If a feature is planned, either omit it or label it clearly as "coming soon"
  with no dead controls.
- "Last updated" timestamps must reflect real data.

---

## 10. Delivery plan

### P0 — fix trust and dead ends before the next public launch

1. **Route integrity:** fix `/services/[id]` slug/UUID mismatch; remove or build
   `/grievances/track`; replace every `href="#"` in `/forms`; add
   `app/not-found.tsx`.
2. **Honesty pass:** remove CPGRAMS/e-RaktKosh/SMS/email claims until wired;
   convert `/blood-bank/request` to a real form or a phone-only instruction;
   hide demo credentials in production.
3. **Auth gates:** gate every admin page; gate the booking wizard before step 4;
   validate post-login redirects.
4. **Account:** `/account` overview, appointments, grievances, profile,
   security.
5. **Admin essentials:** `/admin` dashboard/redirect, notices, appointments,
   grievances, users.
6. **Password reset:** either finish SMTP + token storage and ship
   `/reset-password`, or label forgot-password as help-desk-only.

### P1 — complete the operational surface

- Admin blood stock, contact messages, departments, audit log.
- Doctor edit and active/inactive management.
- Move feedback inbox under `/admin/feedback` with a redirect.
- Search, filters, pagination, and URL state on every list.
- Print views for appointments, notices, and patient rights.
- Sitemap generated from the route registry.
- Content review dates and owners.

### P2 — after the core is stable

- ABHA linking, consent management, and record viewer.
- Language switcher and Bhashini translation.
- PWA offline page and install prompt.
- Notification centre and SMS/email preferences.
- Appointment reschedule endpoint and UI.
- Donor registration and blood-request tracking.

---

## 11. Page definition of done

A page is done only when all of these are true:

- [ ] The route is in the inventory in section 3 with the correct status.
- [ ] Every link on the page resolves to a real route; no `#` placeholders.
- [ ] Loading, empty, error, success, and permission states exist where relevant.
- [ ] Keyboard-only use works; focus is visible and managed.
- [ ] Screen-reader structure and live announcements are correct.
- [ ] Responsive at 320, 768, 1024, and 1440 px with no horizontal scroll.
- [ ] Forms validate inline and announce errors; values survive server errors.
- [ ] Auth and role rules are enforced in the UI and the API.
- [ ] `noindex` is set on admin, account, auth, inbox, and tracking pages.
- [ ] Copy is real, specific, and free of unverified claims.
- [ ] Dates, phone numbers, and emergency information are correct.
- [ ] No personal data appears in URLs, analytics, or client logs.
- [ ] The page passes axe-core and `eslint-plugin-jsx-a11y`.
- [ ] The route is included in the HTML sitemap when public.

### Route coverage checklist

- [ ] `/`
- [ ] `/services`
- [ ] `/services/[id]`
- [ ] `/doctors`
- [ ] `/doctors/[id]`
- [ ] `/appointments`
- [ ] `/blood-bank`
- [ ] `/blood-bank/request`
- [ ] `/blood-bank/donate`
- [ ] `/grievances`
- [ ] `/grievances/track` (planned)
- [ ] `/complaint`
- [ ] `/complaints/track`
- [ ] `/feedback`
- [ ] `/feedback/[departmentId]`
- [ ] `/feedback/inbox`
- [ ] `/notices`
- [ ] `/notices/[id]`
- [ ] `/contact`
- [ ] `/faqs`
- [ ] `/forms`
- [ ] `/health-tips`
- [ ] `/insurance`
- [ ] `/patient-rights`
- [ ] `/privacy`
- [ ] `/terms`
- [ ] `/accessibility`
- [ ] `/sitemap`
- [ ] `/login`
- [ ] `/register`
- [ ] `/forgot-password`
- [ ] `/reset-password` (planned)
- [ ] `/account` and sub-routes (planned)
- [ ] `/admin` (planned)
- [ ] `/admin/complaints`
- [ ] `/admin/doctors`
- [ ] `/admin/nodal-officers`
- [ ] `/admin/appointments` (planned)
- [ ] `/admin/notices` (planned)
- [ ] `/admin/grievances` (planned)
- [ ] `/admin/blood-bank` (planned)
- [ ] `/admin/contact-messages` (planned)
- [ ] `/admin/departments` (planned)
- [ ] `/admin/users` (planned)
- [ ] `/admin/audit-log` (planned)
- [ ] Doctor/staff clinic desk (planned)
- [ ] 404, error, loading, offline, maintenance

---

## 12. Open product decisions

These must be decided by the product owner before the related page is built.
Do not let an implementer guess.

| Decision | Why it matters | Current state |
|---|---|---|
| Grievances vs complaints | Two intake flows confuse citizens and split staff triage. | Both exist; `/grievances` is CPGRAMS-style, `/complaint` is photo-based. |
| Public grievance tracking | The success screen links to a page that does not exist, and no public endpoint exists. | Broken link; build with reference + phone/OTP or remove. |
| Service URL format | Footer uses slugs, detail page expects UUIDs. | Broken footer links. |
| Blood request handling | A form with no backend is a safety risk. | Static form. |
| Password reset delivery | No SMTP or token table. | API stub; UI says email sent. |
| Notice content format | Raw HTML creates XSS risk. | `dangerouslySetInnerHTML`. |
| Feedback inbox location | It is a staff page outside `/admin`. | Live at `/feedback/inbox`. |
| Doctor editing | Admin page says "edit" but has no edit action. | Add and delete only. |
| Demo credentials | Public production login must not show test accounts. | Always rendered. |
| e-RaktKosh / CPGRAMS claims | False integration claims damage trust. | Copy claims both. |
| Language selector | Showing it before translation works is misleading. | Not shown. |
| Public department feedback indexing | Share links may be crawled. | Indexable. |

---

## 13. Anti-patterns to avoid

- Purple/indigo as the default accent; purple-to-blue hero gradients.
- `rounded-2xl` on every card and input.
- Generic stock hero sections disconnected from hospital services.
- Lorem ipsum, invented statistics, fake doctor names, or placeholder reviews.
- Dead links, `href="#"`, disabled buttons with no explanation.
- Forms that do not submit, or success messages for actions that did not happen.
- Claiming an integration, email, or SMS that is not wired.
- Missing loading, empty, error, success, or permission states.
- Colour as the only indicator of status.
- Tables that clip actions on mobile.
- Admin pages protected only by a hidden link.
- Demo credentials in production.
- Personal data in URLs, analytics, or error logs.
- Raw HTML from the API rendered without sanitization.
- Components over 200 lines without splitting.
- Inline styles or arbitrary pixel values.
- Multiple pages for the same job with different copy.

---

## 14. Final instruction

When in doubt, prefer clarity, accessibility, honesty, and task completion over
visual novelty. A citizen on a slow phone in a hospital corridor should be able
to book, check blood, complain, or call for help without guessing, without
reading English perfectly, and without encountering a dead end.
