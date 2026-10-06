# Changelog

All notable changes to the District Hospital Araria Digital Healthcare Portal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with monorepo architecture
- Next.js 14 frontend with Tailwind CSS
- NestJS 10 backend with PostgreSQL
- Shared types and utilities package
- Reusable UI component library
- Authentication module (JWT, registration, login)
- Doctor directory with search and filtering
- Appointment booking flow
- Blood bank inventory display
- Grievance submission form
- Notices and announcements
- Contact page with map
- Accessibility compliant UI components
- API documentation (Swagger/OpenAPI)
- Docker configuration for deployment
- Comprehensive test setup (Jest)
- CI/CD ready configuration

### Changed
- **Data access split three ways over one PostgreSQL engine.** Prisma (Auth,
  Users, Health) is retained and now the sole owner of DDL; Drizzle ORM handles
  the citizen-facing modules; MikroORM handles clinical/ABDM so a FHIR bundle,
  its consent artefact and its audit rows commit in one Unit of Work. See
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Primary keys moved from `cuid()` to `uuid()` so all three clients can mint
  compatible identifiers; Drizzle and MikroORM use `crypto.randomUUID()`.
- `AuditLog.correlationId` added to tie audit rows from one request together.
- CERT-In audit logging now happens inside the business Unit of Work
  (`AuditLogService.logWith(em, …)`) rather than in entity lifecycle hooks, so
  an audited write can no longer commit without its audit row.
- Blood bank inventory console reads from `/api/v1/blood-bank` instead of
  generated mock data.
- `BloodGroup`/`BloodComponentType` store Prisma-safe identifiers
  (`A_POSITIVE`); `BLOOD_GROUP_LABELS`/`BLOOD_COMPONENT_LABELS` supply the
  display strings (`A+`).
- Health endpoint reports Prisma **and** Drizzle reachability plus live Drizzle
  pool statistics.
- Connection budgets added to `docker-compose.yml`
  (`max_connections=200`, pool size env vars for all three clients).

### Fixed
- Frontend JSX syntax errors (`<lowercase[index].Icon />` is not valid JSX) in
  `BloodBank.tsx`, `Notices.tsx`, `NoticesList.tsx`; replaced with capitalized
  locals.
- `@dh-araria/ui` `Button` never declared `variant`/`size`/`loading`, so every
  consumer passing them failed type-checking; added a proper `ButtonProps`.
- `Alert`, `Badge`, `Card` were missing their `forwardRef` import and used
  untyped variant maps, so the UI package did not compile.
- Dynamic Tailwind classes (`bg-${color}-100`) in the notices category grid are
  invisible to Tailwind's scanner and render unstyled in production; replaced
  with explicit per-variant style maps.
- `next/link` was missing in `ContactPage.tsx`; `register` page called
  `registerUser` with the wrong signature; `lucide-react` icons `Scalpel` and
  `Tooth` do not exist.
- Frontend Jest ran ts-jest with `jsx: "preserve"`, so every `.tsx` test failed
  to parse; added `tsconfig.jest.json`.
- `packages/ui` tsconfig resolved `@dh-araria/shared` to source outside its
  `rootDir`, breaking its build.

### Removed
- `typeorm` / `@nestjs/typeorm`, which were declared but never used.
- `drizzle-kit`: Prisma owns migrations, so a second DDL tool could only fork
  the schema. Replaced with `npm run prisma:validate` and a read-only
  `npm run mikro:schema:update` drift check.

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## [1.0.0] - 2024-10-06

### Added
- **Frontend (Next.js 14)**
  - Home page with hero, features, departments, doctors, blood bank, notices
  - Services page with department listings and emergency services
  - Doctors page with search, filter, and sort functionality
  - Appointments page with multi-step booking flow
  - Blood Bank page with real-time inventory table
  - Grievances page with complaint submission form
  - Notices page with filtering and category browsing
  - Contact page with form and emergency contacts
  - Login/Register pages with validation
  - Responsive design with Tailwind CSS
  - Accessibility features (WCAG 2.2 AA, GIGW 3.0)
  - Internationalization support (22 languages via Bhashini - Phase 3)

- **Backend (NestJS 10)**
  - Modular architecture with feature modules
  - Authentication (JWT, bcrypt, Passport.js)
  - User management (CRUD, roles, profiles)
  - Doctor management (CRUD, time slots, HPR integration ready)
  - Department management (CRUD)
  - Appointment management (booking, status updates, cancellation)
  - Blood bank inventory (CRUD, summary views)
  - Grievance management (submission, tracking, CPGRAMS ready)
  - Notices management (CRUD, publishing, categories)
  - Health check endpoints (liveness, readiness)
  - Rate limiting and security headers
  - Swagger API documentation
  - Prisma ORM with PostgreSQL

- **Shared Package**
  - TypeScript types for all entities
  - Constants for hospital info, departments, enums
  - Utility functions (formatting, validation, helpers)
  - FHIR R4 types for ABDM integration

- **UI Package**
  - Button, Input, Textarea, Select components
  - Card, Badge, Alert, Modal components
  - Avatar, Table components
  - Custom hooks (localStorage, debounce, media queries)
  - Utility functions (cn, formatting, color helpers)

- **DevOps & Infrastructure**
  - Docker multi-stage builds
  - Docker Compose for local development
  - Nginx reverse proxy configuration
  - PostgreSQL initialization scripts
  - GitHub Actions ready CI/CD
  - ESLint, Prettier, TypeScript configurations
  - Jest testing setup for both frontend and backend

### Compliance
- GIGW 3.0 guidelines adherence
- WCAG 2.2 Level AA accessibility
- MeitY Open Source Policy compliance
- CERT-In logging readiness (180-day retention)
- ABDM integration architecture (Phase 3 ready)
- STQC CQW certification preparation

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2024-10-06 | Initial MVP release with core functionality |

---

## Upcoming Releases

### [1.1.0] - Phase 2: Compliance Hardening (Planned)
- WCAG 2.2 AA audit completion
- ELK stack for log aggregation
- NTP synchronization implementation
- Content Management Policy (CMAP)
- Content Archival Policy (CAP)
- Security hardening and penetration testing

### [1.2.0] - Phase 3: DPI Integrations (Planned)
- Bhashini AI multilingual support (22 languages)
- e-Pramaan SSO integration
- CPGRAMS API integration
- e-RaktKosh real-time sync
- ABDM Milestone 1 (ABHA creation)
- ABDM Milestone 2 (HIP - FHIR bundles)
- ABDM Milestone 3 (HIU - Consent management)

### [2.0.0] - Phase 4: Production Deployment (Planned)
- CERT-In WASA audit completion
- STQC CQW certification
- MeghRaj cloud deployment
- Active-Active HA across NDCs
- OpenForge source code publication
- WIM training and handover documentation