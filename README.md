# District Hospital Araria - Digital Healthcare Portal

A modern, accessible, and scalable digital healthcare portal for District Hospital Araria, Bihar. Built following the Government of India's GIGW 3.0 guidelines, ABDM integration standards, and MeitY Open Source Policy.

## 🏥 Overview

This portal serves as a comprehensive digital healthcare platform providing:
- **Online Appointment Booking** - Book, reschedule, and manage appointments with specialist doctors
- **Doctor Directory** - Browse 50+ specialists across 15+ departments with qualifications and ratings
- **Blood Bank Inventory** - Real-time blood availability integrated with e-RaktKosh
- **Grievance Redressal** - File complaints with CPGRAMS integration for transparent tracking
- **Department Feedback** - Anonymous, rate-limited feedback per department, with a staff inbox and per-department access grants
- **Notices & Announcements** - Official circulars, recruitment, tenders, and health advisories
- **Multilingual Support** - 22 Indian languages via Bhashini AI (Phase 3)
- **ABDM Integration** - ABHA-based health records and consent management (Phase 3)

## 🏗️ Architecture

### Monorepo Structure
```
dh-araria/
├── apps/
│   ├── frontend/          # Next.js 16 + React 18 + TypeScript
│   └── backend/           # NestJS 10 + TypeScript + PostgreSQL
├── packages/
│   ├── shared/            # Shared types, constants, utilities
│   └── ui/                # Reusable UI components (Tailwind + lucide-react)
├── package.json           # Root workspace configuration
└── README.md
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16, React 18, TypeScript | SSR, SEO, Accessibility |
| **Styling** | Tailwind CSS, lucide-react | Responsive, accessible components |
| **State** | React Hook Form, Zod, SWR | Form validation, data fetching |
| **Backend** | NestJS 10, TypeScript | Modular REST API, run as a long-lived server locally and as a serverless function on Vercel |
| **Database** | Supabase PostgreSQL + Drizzle ORM + MikroORM | Managed Postgres; type-safe access under a strict 11 + 5 table-ownership split |
| **Deployment** | Vercel (Next.js project + Node function) | Frontend and API in the `bom1` region |
| **Auth** | JWT + Passport.js | Secure authentication |
| **Docs** | Swagger/OpenAPI | API documentation |
| **Testing** | Jest, React Testing Library | Unit & integration tests |

### Deployment

The portal ships to **Vercel**, with **Supabase** PostgreSQL behind it:

- `apps/frontend` is a Vercel project using the Next.js framework preset.
- `apps/backend` is a Vercel project whose only route, `api/index.js`, is a Node
  function. It loads the **compiled** Nest app from `dist/`, so the serverless
  and long-running shapes share the same wiring in `src/bootstrap.ts`.
- `DATABASE_URL` points at the Supabase transaction pooler; migrations use the
  direct connection in `DATABASE_MIGRATION_URL`.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the operator runbook.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm 10+ (or pnpm/yarn)

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd dh-araria
npm install

# Set up environment variables
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# Configure database in apps/backend/.env
# DATABASE_URL="postgresql://user:pass@localhost:5432/dh_araria"

# Generate and apply the database schema
cd apps/backend
npm run db:generate   # only after changing src/common/drizzle/schema.ts
npm run db:migrate

# (Optional) Seed demo data — never against production
npm run db:seed

# Start development servers
cd ../..
npm run dev
```

For a real first account instead of demo data, `npm run bootstrap:admin` creates
one `ADMIN` (Hospital Manager) from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. It is the
production replacement for `db:seed`; see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **API Docs**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/v1/health/live

## 📦 Available Scripts

### Root Level
```bash
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run build            # Build all packages, then both apps
npm run lint             # Lint all packages
npm run test             # Test all packages
npm run bootstrap:admin  # Create the first ADMIN account from env vars
npm run audit:ci         # Production dependency audit gate
```

### Backend Specific
```bash
npm run db:generate      # Generate a Drizzle SQL migration
npm run db:migrate       # Apply Drizzle + MikroORM schema
npm run db:studio        # Open Drizzle Studio
npm run db:seed          # Seed demo data (refuses to run in production)
npm run schema:check     # Verify the 11 + 5 table-ownership boundary (offline)
npm run start:dev        # Start with hot reload
npm run start:prod       # Run the compiled server (node dist/main)
```

### Frontend Specific
```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run type-check       # TypeScript check
```

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
# One origin locally; a comma-separated allowlist on Vercel
FRONTEND_URL=http://localhost:3000

# Application traffic (Supabase transaction pooler, port 6543 in deployment)
DATABASE_URL=postgresql://user:pass@localhost:5432/dh_araria
# DDL only — drizzle-kit and db:migrate. Unset locally so it falls back to
# DATABASE_URL.
# DATABASE_MIGRATION_URL=postgresql://user:pass@db.<ref>.supabase.co:5432/postgres

# Both ORMs share the database; keep the sum below max_connections.
# On Vercel, set each explicitly to 1 (see docs/DEPLOYMENT.md).
DRIZZLE_POOL_SIZE=20
MIKRO_POOL_SIZE=20
MIKRO_POOL_MIN=0

JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# First ADMIN for `npm run bootstrap:admin` (password: 12+ chars)
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=
ADMIN_PHONE=

# Phase 3 Integrations (optional for MVP)
ABDM_CLIENT_ID=
ABDM_CLIENT_SECRET=
BHASHINI_API_KEY=
EPRAAMAN_CLIENT_ID=
CPGRAMS_API_KEY=
ERAKTKOSH_API_KEY=
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Backend tests
cd apps/backend
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage report

# Frontend tests
cd apps/frontend
npm run test           # Unit tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

## 📚 API Documentation

The backend provides comprehensive Swagger documentation at `/api/docs` with:
- Authentication endpoints
- User management
- Doctor & department directories
- Appointment booking
- Blood bank inventory
- Grievance management
- Department feedback (public submit, scoped staff inbox)
- Notices & announcements
- Client error reporting (public telemetry)
- Health check endpoints

Swagger UI is disabled when `NODE_ENV=production`; the same routes are listed in
[docs/API.md](docs/API.md).

## Department Feedback

Citizens submit feedback from a public link without an account; hospital staff
read it in a scoped inbox.

| Route | Audience | Purpose |
|-------|----------|---------|
| `/feedback` | Public | The general form; the department is chosen from the active list |
| `/feedback/[departmentId]` | Public | The same form with one department preselected — a stable URL for printed notices |
| `/feedback/inbox` | Staff, signed in | Filters, stats, acknowledge/resolve, access grants. `noindex`; redirects to `/login?redirect=/feedback/inbox` |

Visibility has two layers:

1. **Role** — `ADMIN` is the Hospital Manager: every department, every response,
   and the access-grant panel.
2. **Grant** — every other signed-in user sees only the departments recorded for
   them in `feedback_viewers`. No grant means an empty inbox, not an error.

Feedback is anonymous by default, throttled to 5 submissions per minute per IP,
carries a hidden honeypot field, and its contact fields are never logged.

## ♿ Accessibility (GIGW 3.0 / WCAG 2.2 AA)

- Semantic HTML5 with ARIA attributes
- Keyboard navigation support
- Focus management and visible focus indicators
- Color contrast ratios (4.5:1 minimum)
- Screen reader compatibility (NVDA, JAWS)
- Skip to main content links
- Reduced motion support
- High contrast mode support
- Responsive text scaling up to 200%

## 🔒 Security

- JWT-based authentication with refresh tokens
- bcrypt password hashing (cost factor 12)
- Rate limiting (100 req/min general, 10 req/min auth, 5 req/min public feedback)
- Helmet.js security headers
- CORS configuration driven by the `FRONTEND_URL` origin allowlist
- Input validation with class-validator DTOs and Joi configuration validation
- SQL injection prevention via parameterized Drizzle/MikroORM queries
- 5xx responses redacted to `Internal server error` in production
- The `JWT_SECRET` placeholder from `.env.example` is rejected when `NODE_ENV=production`
- Production dependency audit gate (`npm run audit:ci`) with time-boxed, documented exceptions
- CERT-In-oriented audit trail and a 180-day retention target (the purge still needs an external scheduler)

## 🏛️ Compliance Standards

- **GIGW 3.0** - Government of India Website Guidelines
- **WCAG 2.2 AA** - Web Content Accessibility Guidelines
- **MeitY Open Source Policy** - No vendor lock-in
- **ABDM** - Ayushman Bharat Digital Mission M2/M3 data model (gateway transport is Phase 3)
- **CERT-In** - Audit trail and retention controls; log shipping and incident reporting are operator processes
- **STQC CQW** - Certification ready

## 📁 Project Phases

### Phase 1: MVP (Current) ✅
- [x] Next.js frontend with Tailwind CSS
- [x] NestJS backend with PostgreSQL/Drizzle/MikroORM
- [x] Authentication (JWT, registration, login)
- [x] Doctor directory with search/filter
- [x] Appointment booking flow
- [x] Blood bank inventory display
- [x] Grievance submission form
- [x] Notices & announcements
- [x] Contact page with map
- [x] Department feedback form with a per-department staff inbox
- [x] Accessibility-oriented UI components
- [x] API documentation (Swagger, development only)

### Phase 2: Compliance Hardening 🔄
- [ ] WCAG 2.2 AA audit & fixes
- [ ] Log drain to a 180-day retention store
- [ ] External scheduler for the audit-retention purge
- [ ] Confirm platform time synchronisation
- [ ] Content Management Policy (CMAP)
- [ ] Content Archival Policy (CAP)
- [ ] Security hardening

### Phase 3: DPI Integrations 📋
- [ ] Bhashini AI multilingual support (22 languages)
- [ ] e-Pramaan SSO integration
- [ ] CPGRAMS API integration
- [ ] e-RaktKosh real-time sync
- [ ] ABDM Milestone 1 (ABHA creation)
- [ ] ABDM Milestone 2 (HIP - bundle storage and audit exist; gateway transport pending)
- [ ] ABDM Milestone 3 (HIU - consent records exist; gateway transport pending)

### Phase 4: Production Deployment 📋
- [ ] CERT-In WASA audit
- [ ] STQC CQW certification
- [ ] Vercel + Supabase production deployment (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))
- [ ] Supabase restore drill, recorded with a measured restore time
- [ ] OpenForge source code publication
- [ ] WIM training & handover

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- TypeScript: strict mode on the frontend, strict null checks and `noImplicitAny` on the backend
- ESLint + Prettier configured
- Conventional commits
- 80%+ test coverage target
- Accessibility-first development

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

As per MeitY Open Source Policy, this code is intended for publication on OpenForge for government reuse.

## 🙏 Acknowledgments

- **Government of Bihar** - Department of Health
- **National Health Authority** - ABDM Framework
- **MeitY** - GIGW 3.0 Guidelines & Open Source Policy
- **CERT-In** - Cybersecurity Framework
- **STQC** - Quality Certification Standards
- **Open Source Community** - Libraries & tools used

## 📞 Support

- **Email**: dh.araria@bihar.gov.in
- **Phone**: +91-6453-222123
- **Emergency**: 108 / 102
- **Issues**: GitHub Issues

---

**District Hospital Araria** - *सेवा परमो धर्मः | Service is Supreme Duty*