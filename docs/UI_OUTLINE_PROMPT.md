# UI Outline Prompt — DH Araria Hospital Portal

Use this document as the single source of truth when designing or rebuilding the user interface for the District Hospital Araria digital healthcare portal. The goal is a production-quality, government-grade, accessible UI that looks like it was built by a design-aware engineering team — not an AI-generated template.

---

## 1. Product context

- **Product:** Official digital healthcare portal for District Hospital Araria, Bihar, India.
- **Purpose:** Let citizens book appointments, find doctors and departments, check blood availability, file grievances, read notices, share feedback, and contact the hospital. Staff use authenticated areas for feedback triage and access grants.
- **Audience:** Patients of all ages and digital literacy levels, caregivers, doctors, hospital staff, administrators, and emergency users. Many users will be on low-end Android phones and slow networks.
- **Tone:** Official, calm, trustworthy, service-first. This is a public health utility, not a marketing landing page. Clarity and task completion matter more than decoration.
- **Compliance:** GIGW 3.0, WCAG 2.2 Level AA, Government of India accessibility and data-residency expectations.
- **Languages:** English now; Hindi plus 20 Indian languages via Bhashini in a later phase. Urdu requires RTL support.
- **Deployment:** Next.js frontend on Vercel; backend API at `/api/v1`.

## 2. Brand and design system

### Colors

Use the existing Tailwind palette. Do not introduce a new palette.

- **Primary:** sky blue scale (`primary-50` to `primary-950`), anchor `primary-600` `#0284c7`.
- **Secondary:** fuchsia/magenta scale, anchor `secondary-600` `#c026d3`.
- **Semantic:** `success`, `warning`, `danger` with 50/100/500/600/700 shades.
- **Neutrals:** gray scale for surfaces, borders, muted text.
- **Surfaces:** white cards on `gray-50` page background; dark mode variables already defined.

### Typography

- Font family: Inter for both body and headings.
- Hierarchy: one `h1` per page; `h2` section titles; `h3` subsection/card titles; body; small helper text.
- Do not skip heading levels. Do not use heading styles for non-heading content.

### Spacing and radius

- Use the Tailwind spacing scale in 0.25rem increments. No arbitrary pixel values.
- Card radius: `rounded-xl`. Button/input radius: `rounded-lg`. Badges: `rounded-full`.
- Container: `max-w-7xl` with responsive horizontal padding.

### Components

Reuse `@dh-araria/ui` components: `Button` (variants and sizes), `Card` family, `Input`, `Select`, `Textarea`, `Modal`, `Table`, `Alert`, `Badge`, `Avatar`. Prefer composition over heavy configuration.

## 3. Global shell

Every page includes:

- **Skip link** to `#main-content`.
- **Header** with:
  - Top bar (desktop): location, phone, emergency numbers, "Book Appointment", "Login / Register".
  - Main nav: Home, Services, Doctors, Appointments, Blood Bank, Grievances, Feedback, Notices, Contact.
  - Logo with hospital name and "Government of Bihar".
  - Mobile menu with all nav items, emergency contacts, and auth actions.
  - Scroll-aware sticky header with blur/shadow.
- **Main content** with `id="main-content"` and top padding to clear the fixed header.
- **Footer** with quick links, contact details, emergency numbers, accessibility statement, privacy/terms links.
- **Toast notifications** (sonner) top-right.
- **Auth and language providers** wrapping the app.

Accessibility requirements for the shell:

- `nav` with `aria-label="Main navigation"`.
- Mobile menu button with `aria-expanded`, `aria-controls`, and accessible label.
- All interactive elements keyboard reachable and at least 44x44px touch targets.
- Visible focus rings.

## 4. Page inventory and UI requirements

### 4.1 Home (`/`)

Sections in order:

1. **Hero:** hospital identity, one-line service promise, primary CTA "Book Appointment", secondary CTA "Emergency Services", trust indicators (24/7 emergency, 50+ doctors, 15+ departments). Use a real hospital image or a restrained illustration, not a generic stock hero.
2. **Features:** grid of core services (appointments, doctor directory, blood bank, grievances, notices, feedback) with icons and short descriptions.
3. **Departments preview:** 6-8 department cards linking to Services.
4. **Doctors preview:** 3-4 featured doctor cards.
5. **Blood bank summary:** compact stock strip with critical-stock alerts.
6. **Notices preview:** latest 3-5 notices with category badges and dates.

States: loading skeletons, empty states for each data-backed section, error state with retry.

### 4.2 Services (`/services`)

- Page header with title and subtitle.
- Department search/filter.
- Department cards: name, short description, icon, doctor count, "View doctors" and "Book appointment" actions.
- Emergency services panel: ambulance 102/108, emergency department hours, what to do in an emergency, map/directions link.

### 4.3 Doctors (`/doctors`)

- Search by name/specialization.
- Filter by department and availability.
- Doctor cards: photo placeholder, name, specialization, qualifications, available days, consultation fee, "Book appointment" CTA.
- Empty state when no doctors match filters.
- Loading skeleton grid.

### 4.4 Appointments (`/appointments`)

Multi-step booking wizard:

1. **Step 1 — Department:** selectable department cards; selected state clearly marked.
2. **Step 2 — Doctor:** list of available doctors in the selected department with specialization, fee, availability.
3. **Step 3 — Date and time:** date picker (today to +60 days), appointment type selector (OPD, Teleconsultation, Follow-up), available time slot chips.
4. **Step 4 — Details:** reason textarea, optional notes, appointment summary card, confirm button.

Cross-cutting requirements:

- Stepper with completed/active/upcoming states and accessible labels.
- Previous/Next navigation; disable Next until the step is valid.
- Auth gate: if not signed in, show a clear message and link to login with redirect back to appointments.
- Success state: toast with token number and arrival instruction; reset form.
- Error state: toast with actionable message.
- Empty state for "no doctors" and "no slots".
- Do not allow submission with missing required fields.

### 4.5 Blood Bank (`/blood-bank`)

- Page header with e-RaktKosh integration badge and last-updated timestamp.
- Blood group inventory grid (A+, A-, B+, B-, O+, O-, AB+, AB-) showing units available.
- Color-coded stock status: adequate, low, critical.
- Critical stock alert banner.
- Actions: "Request blood", "Donate blood", "Contact blood bank".
- Loading skeleton and error retry.
- Accessible table alternative for screen readers.

### 4.6 Grievances (`/grievances`)

- Complaint form: category, subject, description, optional attachments, contact details.
- CPGRAMS integration note and 30-day resolution timeline.
- Ticket status lookup by reference number.
- Success state with reference number and next steps.
- Validation and inline errors.
- Privacy note about how grievance data is handled.

### 4.7 Notices (`/notices`)

- Filter by category: circular, recruitment, tender, health advisory.
- Search by keyword.
- Notice cards/list rows: title, category badge, date, attachment link, "New" indicator.
- Pagination or "load more".
- Empty state for no notices.
- Download/view PDF links with accessible labels.

### 4.8 Contact (`/contact`)

- Hospital address, phone, email, working hours.
- Emergency numbers with click-to-call.
- Contact form: name, email, phone, subject, message.
- Map embed or directions link.
- Department-wise contact list if available.

### 4.9 Feedback (`/feedback`, `/feedback/[departmentId]`, `/feedback/inbox`)

Public feedback form:

- Department selector, service area, overall rating using accessible star rating, optional comment.
- Anonymous submission messaging.
- Rate-limit messaging when the user has recently submitted.
- Success state thanking the user and explaining next steps.
- Link to general form from department-specific page.

Staff inbox:

- Auth-gated, `robots: noindex`.
- Filters by department and status.
- Feedback table/cards with rating, comment, date, status.
- Status update action.
- Access grants panel: grant/revoke staff access to departments.
- Share links panel for department feedback URLs.
- Permission-denied and empty states.

### 4.10 Authentication (`/login`, `/register`)

- Centered card layout with hospital branding.
- Login: email, password, remember me, forgot password link, demo credentials only in development.
- Register: name, email, phone, password with strength meter, confirm password, terms consent.
- Show/hide password controls with accessible labels.
- Inline validation errors.
- Loading state on submit.
- Success redirect to intended destination.

## 5. Cross-cutting UX requirements

- **Loading:** skeleton loaders for content; spinners only for button actions.
- **Empty states:** icon, heading, short explanation, and a primary action where relevant.
- **Error states:** clear message, retry button, and fallback contact information for critical services.
- **Form validation:** inline errors, `aria-invalid`, `aria-describedby`, and focus management on failure.
- **Optimistic updates:** for feedback status changes and appointment slot selection where safe.
- **URL state:** filters, pagination, and selected department should be shareable via query params.
- **Toasts:** success/error/info with concise descriptions.
- **Permission states:** clear messaging and next steps for unauthorized users.
- **Network resilience:** handle slow/failed API calls gracefully; never show a blank screen.

## 6. Accessibility requirements (non-negotiable)

- WCAG 2.2 Level AA and GIGW 3.0 compliance.
- Keyboard-only navigation for all flows, including the booking wizard and feedback rating.
- Focus management: move focus on route change, modal open, and step change; trap focus in modals.
- Screen-reader support: landmarks, headings, labels, live regions for toasts and dynamic content.
- Color contrast at least 4.5:1 for normal text and 3:1 for large text.
- Touch targets at least 44x44 CSS pixels.
- Reduced-motion support via `prefers-reduced-motion`.
- High-contrast support.
- Multilingual readiness: language selector, `lang` attribute, RTL layout for Urdu.
- No information conveyed by color alone; pair color with text or icons.
- Captions/transcripts for any media.
- Skip-to-content link.

## 7. Responsive design

- Mobile-first. Test at 320px, 768px, 1024px, and 1440px.
- Header collapses to mobile menu below `xl`.
- Grids: 1 column on mobile, 2 on small, 3 on large where appropriate.
- Tables become horizontally scrollable or card-based on mobile.
- No horizontal page scroll at 320px.
- Font sizes reduce slightly on small screens while remaining readable.

## 8. Content and copy guidelines

- Use realistic, service-oriented copy. No lorem ipsum.
- Use Indian English and respectful forms of address.
- Emergency copy must be unambiguous and prominent.
- Form labels and helper text should explain expected input (for example, "Enter full name as per Aadhaar").
- Error messages should state what went wrong and how to fix it.
- Keep paragraphs short; prefer lists and tables for structured information.

## 9. Component inventory to build or refine

- `Header`, `Footer`, `Hero`, `SectionHeader`
- `EmptyState`, `ErrorState`, `Skeleton`, `LoadingSpinner`
- `DoctorCard`, `DepartmentCard`, `NoticeCard`, `BloodGroupCard`
- `Stepper`, `RatingStars`, `StatusBadge`, `Pagination`
- `FormField` wrappers around `Input`, `Select`, `Textarea`
- `Modal`/`Dialog` with focus trap
- `EmergencyContactCard`, `AppointmentSummary`
- `LanguageSwitcher` (placeholder for Phase 3)

## 10. State management

- Server state: SWR with caching and revalidation.
- Form state: React Hook Form with Zod validation.
- UI state: local `useState` for component-specific concerns.
- Shared state: AuthContext, LanguageContext.
- Shareable UI state: URL query params for filters and pagination.
- Avoid prop drilling beyond 3 levels; use context or restructure.

## 11. Explicit anti-patterns to avoid

- Purple/indigo as the default accent.
- Excessive gradients, especially purple-to-blue hero gradients.
- `rounded-2xl` everywhere.
- Generic hero sections disconnected from hospital services.
- Lorem ipsum or placeholder copy.
- Oversized equal padding that destroys hierarchy.
- Uniform stock card grids with no information priority.
- Shadow-heavy cards.
- Components over 200 lines without splitting.
- Inline styles or arbitrary pixel values.
- Missing loading, empty, error, success, or permission states.
- Color as the only indicator of state.

## 12. Definition of done for UI work

- [ ] Component renders without console errors or warnings.
- [ ] All interactive elements are keyboard accessible and have visible focus.
- [ ] Screen reader announces structure and dynamic changes.
- [ ] Responsive at 320px, 768px, 1024px, and 1440px with no horizontal scroll.
- [ ] Loading, empty, error, success, and permission states implemented where applicable.
- [ ] Follows the project design system: spacing, colors, typography, radius.
- [ ] No accessibility violations from axe-core or eslint-plugin-jsx-a11y.
- [ ] Forms validate inline and announce errors.
- [ ] Critical user flows tested: book appointment, find doctor, check blood, file grievance, submit feedback.
- [ ] Copy is realistic and service-oriented.
- [ ] No AI-aesthetic patterns from section 11.

---

Use this outline as the brief for every UI change. When in doubt, prefer clarity, accessibility, and task completion over visual novelty.