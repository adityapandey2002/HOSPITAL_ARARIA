# District Hospital Araria - Digital Healthcare Portal

A modern, accessible, and scalable digital healthcare portal for District Hospital Araria, Bihar. Built following the Government of India's GIGW 3.0 guidelines, ABDM integration standards, and MeitY Open Source Policy.

## 🏥 Overview

This portal serves as a comprehensive digital healthcare platform providing:
- **Online Appointment Booking** - Book, reschedule, and manage appointments with specialist doctors
- **Doctor Directory** - Browse 50+ specialists across 15+ departments with qualifications and ratings
- **Blood Bank Inventory** - Real-time blood availability integrated with e-RaktKosh
- **Grievance Redressal** - File complaints with CPGRAMS integration for transparent tracking
- **Notices & Announcements** - Official circulars, recruitment, tenders, and health advisories
- **Multilingual Support** - 22 Indian languages via Bhashini AI (Phase 3)
- **ABDM Integration** - ABHA-based health records and consent management (Phase 3)

## 🏗️ Architecture

### Monorepo Structure
```
dh-araria/
├── apps/
│   ├── frontend/          # Next.js 14 + React 18 + TypeScript
│   └── backend/           # NestJS 10 + TypeScript + PostgreSQL
├── packages/
│   ├── shared/            # Shared types, constants, utilities
│   └── ui/                # Reusable UI components (Tailwind + Radix)
├── package.json           # Root workspace configuration
└── README.md
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript | SSR, SEO, Accessibility |
| **Styling** | Tailwind CSS, Radix UI | Responsive, accessible components |
| **State** | React Hook Form, Zod, SWR | Form validation, data fetching |
| **Backend** | NestJS 10, TypeScript | Microservices-ready API |
| **Database** | PostgreSQL + Prisma ORM | Type-safe database access |
| **Auth** | JWT + Passport.js | Secure authentication |
| **Docs** | Swagger/OpenAPI | API documentation |
| **Testing** | Jest, React Testing Library | Unit & integration tests |

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

# Generate Prisma client and push schema
cd apps/backend
npm run db:generate
npm run db:push

# (Optional) Seed database
npm run db:seed

# Start development servers
cd ../..
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **API Docs**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health/live

## 📦 Available Scripts

### Root Level
```bash
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run build            # Build all packages
npm run lint             # Lint all packages
npm run test             # Test all packages
```

### Backend Specific
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database
npm run start:dev        # Start with hot reload
npm run start:prod       # Production build
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
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://user:pass@localhost:5432/dh_araria

JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

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
- Notices & announcements
- Health check endpoints

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
- Rate limiting (100 req/min general, 10 req/min auth)
- Helmet.js security headers
- CORS configuration
- Input validation with Zod/class-validator
- SQL injection prevention via Prisma ORM
- CERT-In compliant logging (180-day retention ready)

## 🏛️ Compliance Standards

- **GIGW 3.0** - Government of India Website Guidelines
- **WCAG 2.2 AA** - Web Content Accessibility Guidelines
- **MeitY Open Source Policy** - No vendor lock-in
- **ABDM** - Ayushman Bharat Digital Mission ready
- **CERT-In** - Cybersecurity directives compliant
- **STQC CQW** - Certification ready

## 📁 Project Phases

### Phase 1: MVP (Current) ✅
- [x] Next.js frontend with Tailwind CSS
- [x] NestJS backend with PostgreSQL/Prisma
- [x] Authentication (JWT, registration, login)
- [x] Doctor directory with search/filter
- [x] Appointment booking flow
- [x] Blood bank inventory display
- [x] Grievance submission form
- [x] Notices & announcements
- [x] Contact page with map
- [x] Accessibility compliant UI components
- [x] API documentation (Swagger)

### Phase 2: Compliance Hardening 🔄
- [ ] WCAG 2.2 AA audit & fixes
- [ ] ELK stack for 180-day log retention
- [ ] NTP synchronization
- [ ] Content Management Policy (CMAP)
- [ ] Content Archival Policy (CAP)
- [ ] Security hardening

### Phase 3: DPI Integrations 📋
- [ ] Bhashini AI multilingual support (22 languages)
- [ ] e-Pramaan SSO integration
- [ ] CPGRAMS API integration
- [ ] e-RaktKosh real-time sync
- [ ] ABDM Milestone 1 (ABHA creation)
- [ ] ABDM Milestone 2 (HIP - FHIR bundles)
- [ ] ABDM Milestone 3 (HIU - Consent management)

### Phase 4: Production Deployment 📋
- [ ] CERT-In WASA audit
- [ ] STQC CQW certification
- [ ] MeghRaj cloud deployment
- [ ] Active-Active HA across NDCs
- [ ] OpenForge source code publication
- [ ] WIM training & handover

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- TypeScript strict mode enabled
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