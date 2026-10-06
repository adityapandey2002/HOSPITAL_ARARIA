# DH Araria Hospital Portal - Architecture Documentation

## Overview

This document describes the architecture of the District Hospital Araria Digital Healthcare Portal, a modern, accessible, and scalable digital healthcare platform built following Government of India standards.

## System Context

```mermaid
C4Context
    title System Context Diagram - DH Araria Hospital Portal

    Person(patient, "Patient/Citizen", "Books appointments, views doctors, checks blood availability, files grievances")
    Person(doctor, "Doctor/Staff", "Manages appointments, views schedules, updates profiles")
    Person(admin, "Administrator", "Manages users, departments, notices, blood bank, system configuration")
    
    System(hospitalPortal, "DH Araria Hospital Portal", "Next.js + NestJS monorepo providing web-based healthcare services")
    
    System_Ext(abdm, "ABDM Gateway", "Ayushman Bharat Digital Mission - Health ID, FHIR, Consent")
    System_Ext(epramaan, "e-Pramaan", "National Single Sign-On (SSO) via Meri Pehchaan")
    System_Ext(bhashini, "Bhashini", "AI-powered multilingual translation (22 Indian languages)")
    System_Ext(cpgrams, "CPGRAMS", "Centralized Public Grievance Redressal and Monitoring System")
    System_Ext(eraktkosh, "e-RaktKosh", "National Blood Bank Management System")
    System_Ext(meghraj, "MeghRaj Cloud", "Government of India sovereign cloud infrastructure")
    
    Rel(patient, hospitalPortal, "Uses", "HTTPS")
    Rel(doctor, hospitalPortal, "Uses", "HTTPS")
    Rel(admin, hospitalPortal, "Administers", "HTTPS")
    
    Rel(hospitalPortal, abdm, "Integrates with", "REST/HTTPS")
    Rel(hospitalPortal, epramaan, "Authenticates via", "OAuth 2.0")
    Rel(hospitalPortal, bhashini, "Translates via", "REST/HTTPS")
    Rel(hospitalPortal, cpgrams, "Forwards grievances to", "REST/HTTPS")
    Rel(hospitalPortal, eraktkosh, "Syncs blood inventory with", "REST/HTTPS")
    Rel(hospitalPortal, meghraj, "Deploys on", "Kubernetes/IaaS")
```

## Container Diagram

```mermaid
C4Container
    title Container Diagram - DH Araria Hospital Portal
    
    Container(frontend, "Frontend", "Next.js 14, React 18, TypeScript, Tailwind CSS", "Provides responsive, accessible web UI with SSR")
    Container(backend, "Backend API", "NestJS 10, TypeScript, Dual-ORM (Drizzle + MikroORM)", "RESTful API with authentication, business logic, integrations")
    ContainerDb(db, "Database", "PostgreSQL 15", "Stores users, doctors, appointments, blood stock, grievances, notices; JSONB for FHIR R4")
    Container(cache, "Cache", "Redis 7", "Session storage, rate limiting, caching")
    Container(proxy, "Reverse Proxy", "Nginx", "SSL termination, load balancing, rate limiting, static assets")
    
    Container_Ext(abdm, "ABDM Gateway", "National Health Stack APIs")
    Container_Ext(epramaan, "e-Pramaan SSO", "OAuth 2.0 Identity Provider")
    Container_Ext(bhashini, "Bhashini API", "Translation & Speech Services")
    Container_Ext(cpgrams, "CPGRAMS API", "Grievance Management")
    Container_Ext(eraktkosh, "e-RaktKosh API", "Blood Bank Inventory")
    
    Rel(frontend, backend, "API Calls", "HTTPS/REST")
    Rel(backend, db, "Reads/Writes", "PostgreSQL Protocol")
    Rel(backend, cache, "Reads/Writes", "Redis Protocol")
    Rel(frontend, proxy, "Serves via", "HTTPS")
    Rel(backend, proxy, "Proxied via", "HTTPS")
    
    Rel(backend, abdm, "Integrates", "REST/HTTPS")
    Rel(backend, epramaan, "Authenticates", "OAuth 2.0")
    Rel(backend, bhashini, "Translates", "REST/HTTPS")
    Rel(backend, cpgrams, "Submits", "REST/HTTPS")
    Rel(backend, eraktkosh, "Syncs", "REST/HTTPS")
```

## Component Diagram - Backend

```mermaid
C4Component
    title Component Diagram - Backend API (NestJS)
    
    Component(auth, "Auth Module", "NestJS Module", "JWT authentication, registration, login, token refresh")
    Component(users, "Users Module", "NestJS Module", "User management, profiles, roles")
    Component(doctors, "Doctors Module", "NestJS Module", "Doctor directory, time slots, HPR sync")
    Component(departments, "Departments Module", "NestJS Module", "Department management")
    Component(appointments, "Appointments Module", "NestJS Module", "Booking, status management, token generation")
    Component(bloodBank, "Blood Bank Module", "NestJS Module", "Inventory CRUD, e-RaktKosh sync")
    Component(grievances, "Grievances Module", "NestJS Module", "Submission, tracking, CPGRAMS integration")
    Component(notices, "Notices Module", "NestJS Module", "CRUD, publishing, categories")
    Component(health, "Health Module", "NestJS Module", "Liveness/readiness probes")
    Component(common, "Common Module", "NestJS Module", "PrismaService, DrizzleModule, MikroModule, AuditModule, Guards, Filters")
    Component(abdm, "ABDM Module", "NestJS Module", "M2 HIP / M3 HIU, consent gating, audit trail")

    ComponentDb(prisma, "Prisma", "ORM", "Auth, Users, Health; owns DDL")
    ComponentDb(drizzle, "Drizzle", "ORM", "Citizen-facing modules, SQL-first")
    ComponentDb(mikro, "MikroORM", "ORM", "Clinical/ABDM, Unit of Work")
    ComponentDb(postgres, "PostgreSQL", "Database", "Single engine; JSONB for FHIR R4")
    ComponentDb(cache, "Redis Client", "Cache", "Sessions, rate limiting")

    Rel(auth, prisma, "Uses")
    Rel(users, prisma, "Uses")
    Rel(health, prisma, "Uses")
    Rel(doctors, drizzle, "Uses")
    Rel(departments, drizzle, "Uses")
    Rel(appointments, drizzle, "Uses")
    Rel(bloodBank, drizzle, "Uses")
    Rel(grievances, drizzle, "Uses")
    Rel(notices, drizzle, "Uses")
    Rel(abdm, mikro, "Uses")
    Rel(abdm, common, "Uses AuditLogService")

    Rel(prisma, postgres, "Reads/writes")
    Rel(drizzle, postgres, "Reads/writes")
    Rel(mikro, postgres, "Reads/writes")

    Rel(auth, cache, "Uses for rate limiting")
    Rel(appointments, cache, "Uses for locking")
```

## Database and ORM Architecture

### Primary Database: PostgreSQL 15+

We use PostgreSQL as our single database engine for the entire project. For standard relational data (users, roles, basic appointments), we use standard tables. For the deeply nested, unstructured FHIR R4 medical records mandated by the Ayushman Bharat Digital Mission (ABDM), we utilize PostgreSQL's native `JSONB` columns instead of introducing a separate NoSQL database. This keeps the cloud infrastructure simple and reduces long-term maintenance.

#### JSONB for FHIR R4 Bundles

The `FhirBundle` entity uses a `JSONB` column to store complete FHIR R4 bundles:

```prisma
// prisma/schema.prisma — source of truth for all DDL
model FhirBundle {
  id              String   @id @default(uuid())
  bundleId        String   @unique
  resourceType    String   @default("Bundle")
  bundleType      String
  patientId       String
  careContextId   String?
  fhirJson        Json     // JSONB column for the full FHIR R4 bundle
  encryptedData   String?
  encryptionKey   String?
  status          String   @default("PENDING")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([bundleId])
  @@index([patientId])
  @@index([careContextId])
  @@index([status])
  @@map("fhir_bundles")
}
```

This approach provides:
- **Schema Flexibility**: FHIR R4 resources have complex, variable structures that map naturally to JSONB
- **Query Performance**: PostgreSQL's GIN indexes on JSONB enable fast querying of FHIR elements
- **ACID Compliance**: Full transactional support for health data operations
- **Simplified Infrastructure**: No separate MongoDB/NoSQL cluster needed

### Data Access Strategy

PostgreSQL is the **single** database engine. Three clients talk to it, each
with its own connection pool:

| Client | Owns | Rationale |
|--------|------|-----------|
| **Prisma** (`PrismaService`) | Auth, Users, Health | Retained for identity/session logic; also the **only** tool allowed to emit DDL |
| **Drizzle ORM** | Citizen-facing modules (departments, notices, blood bank, grievances, doctors, appointments) | SQL-first, near-zero abstraction overhead for high-traffic public endpoints |
| **MikroORM** | Clinical / ABDM (ABDM M2 HIP, M3 HIU) | Strict Unit of Work so a FHIR bundle, its consent artefact and its audit rows commit atomically |

#### One schema, three clients: how drift is prevented

`prisma/schema.prisma` is the single source of truth for **DDL**. Drizzle and
MikroORM are *query* layers over tables Prisma created. Concretely:

- `prisma/schema.prisma` → the only file `npm run db:migrate` acts on.
- `src/common/drizzle/schema.ts` mirrors the *physical* schema (Prisma field
  names, `@@map` table names, Prisma's enum type names like `BloodGroup`).
- `src/modules/abdm/entities/*.entity.ts` mirror the clinical tables.
- `drizzle-kit` is not a dependency at all, and MikroORM migration commands are
  **deliberately not** exposed as npm scripts. Running either would fork the
  schema away from `schema.prisma`.
- `npm run mikro:schema:update` is a read-only drift check: it introspects the
  live database and prints the DDL the entities expect, writing nothing.
  `npm run prisma:validate` checks the schema file itself. `npm run schema:check`
  runs both.

Primary keys are `String @default(uuid())`. Prisma generates the value in its
query engine, so Drizzle and MikroORM mint their own with Node's built-in
`crypto.randomUUID()` via `src/common/drizzle/id.ts`.

#### Drizzle ORM (Citizen-Facing Services)

`DrizzleModule` publishes the raw Drizzle instance under the `DRIZZLE` token and
owns the pool lifecycle:

```typescript
// apps/backend/src/common/drizzle/drizzle.module.ts
import { Global, Module } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    DrizzleService,                                    // owns the pg.Pool
    { provide: DRIZZLE, useFactory: (s) => s.db, inject: [DrizzleService] },
  ],
  exports: [DrizzleService, DRIZZLE],
})
export class DrizzleModule {}
```

The pool is built in `DrizzleService`'s **constructor** (not `onModuleInit`) so
the `DRIZZLE` factory always sees a ready handle:

```typescript
// apps/backend/src/common/drizzle/drizzle.service.ts
@Injectable()
export class DrizzleService implements OnModuleDestroy {
  readonly pool: Pool;
  readonly db: DrizzleDb;

  constructor(config: ConfigService) {
    this.pool = new Pool({ /* host/port/creds from validated config */ });
    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() { await this.pool.end(); }
}
```

Consuming it:

```typescript
// apps/backend/src/modules/notices/notices.service.ts
@Injectable()
export class NoticesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findPublished(pagination: PaginationDto, language?: string) {
    return this.db
      .select()
      .from(notices)
      .where(
        and(
          eq(notices.isPublished, true),
          or(isNull(notices.expiresAt), gte(notices.expiresAt, new Date())),
        ),
      )
      .orderBy(desc(notices.publishedAt))
      .limit(pagination.limit ?? 10);
  }
}
```

**Key Benefits**:
- **Zero Abstraction Overhead**: Near-raw SQL performance
- **Type-Safe SQL**: Full TypeScript inference from the schema
- **Lightweight**: ~10KB bundle size
- **Connection Pooling**: Native `pg` pool integration

#### MikroORM (Clinical & ABDM Services)

**Used for**: ABDM M2 (HIP — FHIR bundle generation), ABDM M3 (HIU — consent
management), clinical records, and the CERT-In audit trail.

```typescript
// apps/backend/src/common/mikro/mikro.module.ts
import { Global, Module, Provider } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { createMikroOrmConfig } from './mikro.config';

export const MIKRO_ORM = 'MIKRO_ORM';
export const ENTITY_MANAGER = 'ENTITY_MANAGER';

const mikroOrmProvider: Provider = {
  provide: MIKRO_ORM,
  useFactory: async () => MikroORM.init(createMikroOrmConfig()),
};

@Global()
@Module({
  providers: [
    mikroOrmProvider,
    { provide: ENTITY_MANAGER, useFactory: (orm) => orm.em.fork(), inject: [MIKRO_ORM] },
  ],
  exports: [MIKRO_ORM, ENTITY_MANAGER],
})
export class MikroModule {}
```

Services inject `ENTITY_MANAGER` and wrap writes in `em.transactional(...)` so
the clinical change and its audit rows land together:

```typescript
// apps/backend/src/modules/abdm/abdm.service.ts
@Injectable()
export class AbdmService {
  constructor(
    @Inject(ENTITY_MANAGER) private readonly em: EntityManager,
    private readonly audit: AuditLogService,
  ) {}

  async recordBundle(input: RecordBundleInput): Promise<FhirBundle> {
    return this.em.transactional(async (em) => {
      const bundle = em.create(FhirBundle, { /* … */ } as any);
      await em.persistAndFlush(bundle);

      await this.audit.logWith(em, {
        action: 'FHIR_BUNDLE_CREATE',
        resource: 'FhirBundle',
        resourceId: bundle.id,
        details: { bundleId: bundle.bundleId, entryCount: /* … */ },
      });

      return bundle;
    });
  }
}
```

Audit rows are written through `AuditLogService.logWith(em, …)`, which uses the
*same* EntityManager as the business change — that is what makes the audit trail
impossible to bypass, and it is why the audit write is transactional rather than
a best-effort side effect.

**Key Benefits**:
- **Unit of Work**: Guarantees atomic transactions for complex health data operations
- **Identity Map**: Prevents duplicate entities in memory
- **Change Tracking**: Only modified fields are persisted
- **Transaction Boundaries**: Explicit transaction control for ABDM flows

### ORM Selection Guide for Developers

| Module / Service | Client | Reason |
|------------------|--------|--------|
| Auth, Users, Health | Prisma | Identity/session logic; owns the schema |
| Homepage / Landing Page | Drizzle | High traffic, simple queries |
| Doctor Directory, Departments | Drizzle | Read-heavy, public access |
| Basic Appointment Booking | Drizzle | High concurrency, simple CRUD |
| Grievance Submission | Drizzle | Public-facing, moderate traffic |
| Blood Bank Inventory | Drizzle | Real-time polling, simple reads |
| Notices / Announcements | Drizzle | Read-heavy, public |
| **ABDM M2 (HIP)** | **MikroORM** | **FHIR bundles, Fidelius encryption, atomic transactions** |
| **ABDM M3 (HIU)** | **MikroORM** | **Consent management, audit trails** |
| **Clinical Records** | **MikroORM** | **Complex transactions, audit logging** |
| **Audit Logging** | **MikroORM** | **Append-only trail inside the same Unit of Work** |

### Shared Database Connection & Pool Budget

All three clients hit the same PostgreSQL instance with separate pools, so their
sizes must sum below the server's `max_connections`:

| Client | Default pool | Env var |
|--------|--------------|---------|
| Prisma | 10 | `DB_POOL_SIZE` |
| Drizzle | 20 | `DRIZZLE_POOL_SIZE` |
| MikroORM | 20 | `MIKRO_POOL_SIZE` |
| **Total** | **50** | (headroom to 200 for migrations and `psql`) |

```yaml
# docker-compose.yml (shared postgres)
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-dh_araria}
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "${DB_PORT:-5432}:5432"
    command:
      - postgres
      - -c
      - max_connections=200
      - -c
      - log_min_duration_statement=500
```

`GET /api/v1/health` reports Prisma and Drizzle reachability plus live Drizzle
pool stats, so a saturated pool surfaces as an unhealthy pod rather than a
stream of 500s.

---

## Data Model (ER Diagram)

```mermaid
erDiagram
    USER ||--o{ APPOINTMENT : "patient"
    USER ||--o{ APPOINTMENT : "doctor"
    USER ||--o{ GRIEVANCE : "files"
    USER ||--o{ NOTICE : "authors"
    DOCTOR ||--o{ APPOINTMENT : "has"
    DOCTOR }|--|| USER : "extends"
    DOCTOR }|--|| DEPARTMENT : "belongs to"
    DEPARTMENT ||--o{ DOCTOR : "has"
    DEPARTMENT ||--o{ APPOINTMENT : "has"
    DOCTOR ||--o{ TIME_SLOT : "has"
    BLOOD_STOCK }|--|| BLOOD_GROUP : "typed"
    BLOOD_STOCK }|--|| COMPONENT_TYPE : "typed"
    GRIEVANCE }|--|| USER : "assigned to"
    NOTICE }|--|| USER : "authored"
    
    USER {
        string id PK
        string email UK
        string password
        string name
        string phone UK
        enum role
        boolean isActive
        string abhaId UK
        datetime createdAt
        datetime updatedAt
    }
    
    DOCTOR {
        string id PK
        string userId FK UK
        string name
        string specialization
        string qualification
        int experience
        string hprId UK
        string departmentId FK
        float consultationFee
        string[] languages
        string bio
        string imageUrl
        boolean isActive
    }
    
    DEPARTMENT {
        string id PK
        string name UK
        string description
        string icon
        string imageUrl
        boolean isActive
    }
    
    APPOINTMENT {
        string id PK
        string patientId FK
        string doctorId FK
        string departmentId FK
        datetime appointmentDate
        string startTime
        string endTime
        enum status
        enum type
        string reason
        string notes
        string abhaId
        int tokenNumber
    }
    
    BLOOD_STOCK {
        string id PK
        enum bloodGroup
        enum componentType
        int unitsAvailable
        datetime lastUpdated
    }
    
    GRIEVANCE {
        string id PK
        string userId FK
        string name
        string email
        string phone
        enum category
        string subject
        string description
        enum status
        string cpgramsId UK
        string assignedTo FK
        string resolution
    }
    
    NOTICE {
        string id PK
        string title
        string content
        enum category
        enum priority
        datetime publishedAt
        datetime expiresAt
        boolean isPublished
        string attachmentUrl
        string language
        string authorId FK
    }
```

## Deployment Architecture

```mermaid
C4Deployment
    title Deployment Diagram - MeghRaj Cloud Production
    
    Node(meghraj, "MeghRaj National Cloud", "Government of India Sovereign Cloud") {
        Node(ndc1, "NDC Delhi (Primary)", "Tier-III Data Center") {
            Container(k8s1, "Kubernetes Cluster", "K8s 1.28+")
            Container(pg1, "PostgreSQL Primary", "Patroni HA Cluster")
            Container(redis1, "Redis Primary", "Sentinel HA")
        }
        Node(ndc2, "NDC Pune (DR)", "Tier-III Data Center") {
            Container(k8s2, "Kubernetes Cluster", "K8s 1.28+")
            Container(pg2, "PostgreSQL Replica", "Streaming Replication")
            Container(redis2, "Redis Replica", "Sentinel HA")
        }
        Node(lb, "Global Load Balancer", "Citrix/F5") {
            Component(waf, "WAF", "Web Application Firewall")
            Component(ddos, "Anti-DDoS", "DDoS Protection")
        }
    }
    
    Node(ext, "External Systems") {
        Component(abdm, "ABDM Gateway")
        Component(epramaan, "e-Pramaan SSO")
        Component(bhashini, "Bhashini API")
        Component(cpgrams, "CPGRAMS")
        Component(eraktkosh, "e-RaktKosh")
    }
    
    Rel(lb, k8s1, "Routes to")
    Rel(lb, k8s2, "Failover to")
    Rel(k8s1, pg1, "Reads/Writes")
    Rel(k8s2, pg2, "Reads/Writes")
    Rel(pg1, pg2, "Replicates")
    Rel(k8s1, redis1, "Reads/Writes")
    Rel(k8s2, redis2, "Reads/Writes")
    Rel(redis1, redis2, "Replicates")
    
    Rel(k8s1, ext, "Integrates with")
    Rel(k8s2, ext, "Integrates with")
```

## Security Architecture

### Defense in Depth

1. **Network Layer**
   - MeghRaj perimeter firewall
   - WAF with OWASP CRS rules
   - Anti-DDoS protection
   - Network segmentation (DMZ, App, DB tiers)

2. **Transport Layer**
   - TLS 1.3 everywhere
   - HSTS with preload
   - Certificate pinning for external APIs

3. **Application Layer**
   - Helmet.js security headers
   - CORS policy (whitelist only)
   - Rate limiting (100 req/min general, 10 req/min auth)
   - Input validation (Zod/class-validator)
   - SQL injection prevention (Prisma ORM)
   - XSS prevention (React auto-escaping)

4. **Data Layer**
   - Encryption at rest (AES-256)
   - Encryption in transit (TLS 1.3)
   - PII/PHI field-level encryption
   - Database audit logging

5. **Identity & Access**
   - JWT with RS256 signing
   - Short-lived access tokens (15 min)
   - Refresh token rotation
   - Role-based access control (RBAC)
   - e-Pramaan SSO integration (Phase 3)

### CERT-In Compliance

- 180-day log retention (ELK stack)
- 6-hour incident reporting capability
- NTP synchronization (time.nic.in, time.nplindia.org)
- Vulnerability management (monthly scans)
- Secure configuration baselines

## Accessibility Architecture

### WCAG 2.2 AA / GIGW 3.0 Compliance

1. **Perceivable**
   - Semantic HTML5 structure
   - Text alternatives for all non-text content
   - 4.5:1 contrast ratio (3:1 for large text)
   - Responsive text up to 200% zoom
   - No content loss at 320px width

2. **Operable**
   - Full keyboard navigation
   - Focus indicators (2px solid, 3:1 contrast)
   - No keyboard traps
   - Skip to main content link
   - No seizure-inducing content

3. **Understandable**
   - Consistent navigation
   - Clear form labels and instructions
   - Error identification and suggestions
   - Language declaration (lang attribute)

4. **Robust**
   - Valid HTML5
   - ARIA roles/attributes where needed
   - Compatible with NVDA, JAWS
   - Graceful degradation

### Implementation Stack
- **Radix UI Primitives** - Accessible component foundations
- **Tailwind CSS** - Utility-first with accessibility utilities
- **axe-core** - Automated testing in CI
- **Manual testing** - NVDA/JAWS + keyboard-only

## Integration Architecture

### Phase 1: MVP (Current)
- Standalone PostgreSQL database
- Internal JWT authentication
- Local file storage
- Mock external integrations

### Phase 2: Compliance Hardening
- ELK Stack for centralized logging
- NTP synchronization
- Content Management Policy (CMAP)
- Content Archival Policy (CAP)
- Security audit preparation

### Phase 3: DPI Integrations

| Integration | Protocol | Purpose | Status |
|-------------|----------|---------|--------|
| **Bhashini** | REST/HTTPS | 22-language translation, ASR/TTS | Planned |
| **e-Pramaan** | OAuth 2.0 | Citizen SSO via Meri Pehchaan | Planned |
| **CPGRAMS** | REST/HTTPS | Grievance forwarding & tracking | Planned |
| **e-RaktKosh** | REST/HTTPS | Real-time blood inventory sync | Planned |
| **ABDM M1** | REST/HTTPS | ABHA creation, verification | Planned |
| **ABDM M2** | FHIR R4 + Fidelius | HIP - Generate encrypted health records | Planned |
| **ABDM M3** | FHIR R4 + Fidelius | HIU - Request/consume health records | Planned |

### ABDM Technical Details

```
ABDM Integration Flow (M2 - HIP):
1. PHR App requests records via ABDM Gateway
2. Gateway sends webhook to /api/abdm/on-discover
3. Backend acknowledges with HTTP 202
4. Backend discovers matching care contexts
5. Backend encrypts FHIR Bundle via Fidelius (ECDH + AES-GCM)
6. Backend pushes to ABDM Gateway callback URL
7. Gateway delivers to requesting PHR App

FHIR Bundle Requirements:
- Profile: ABDM FHIR R4
- Terminology: SNOMED CT, LOINC, ICD-10
- Encryption: Fidelius (ECDH P-256 + AES-256-GCM)
- Consent: Time-bound with auto-expiry
```

## Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load (FCP)** | < 1.5s | Lighthouse/Real User Monitoring |
| **Page Load (LCP)** | < 2.5s | Lighthouse/Real User Monitoring |
| **API Response (p95)** | < 500ms | APM/Load Testing |
| **API Response (p99)** | < 1s | APM/Load Testing |
| **Availability** | 99.9% | Uptime Monitoring |
| **Concurrent Users** | 10,000+ | Load Testing |
| **Database Connections** | Pool of 100 | Connection Pool Monitoring |

## Monitoring & Observability

### Metrics (Prometheus/Grafana)
- HTTP request rate, latency, errors
- Database query performance
- Cache hit ratios
- Queue depths
- Business metrics (appointments, grievances)

### Logging (ELK Stack)
- Structured JSON logging (Pino)
- 180-day retention
- Correlation IDs for request tracing
- Audit logs for sensitive operations

### Tracing (Jaeger/OpenTelemetry)
- Distributed tracing across services
- External API call tracking
- Database query spans

### Alerting
- PagerDuty/Slack/Email notifications
- SLA-based alerting
- Runbook-linked alerts

## Disaster Recovery

### RPO/RTO Targets
- **RPO**: 5 minutes (PostgreSQL streaming replication)
- **RTO**: 30 minutes (Active-Active Kubernetes)

### Backup Strategy
- **Continuous**: WAL archiving to object storage
- **Daily**: Logical backups (pg_dump) at 02:00 IST
- **Weekly**: Full cluster backup verification
- **Monthly**: DR failover test

### Failover Process
1. Health check detects primary NDC failure
2. Global LB redirects traffic to DR NDC
3. PostgreSQL replica promoted to primary
4. Redis sentinel promotes replica
5. Kubernetes pods rescheduled
6. DNS/Load balancer update (automated)

## Development Standards

### Code Quality Gates
- TypeScript strict mode
- ESLint (no errors, warnings allowed)
- Prettier formatting
- 80% unit test coverage
- 100% critical path coverage
- axe-core accessibility tests in CI

### Git Workflow
- Trunk-based development
- Feature flags for incomplete work
- Conventional commits
- PR reviews required
- Automated CI checks

### Release Process
- Semantic versioning
- Automated changelog
- Staging deployment
- Production deployment with rollback
- Post-deployment smoke tests

---

*Document Version: 1.0*  
*Last Updated: 2024-10-06*  
*Classification: Internal - Government Use*
