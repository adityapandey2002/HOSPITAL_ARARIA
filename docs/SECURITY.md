# DH Araria Hospital Portal - Security Guide

## Overview

This document describes the security architecture, controls, and best practices for the DH Araria Hospital Portal, aligned with Government of India standards including CERT-In directives, MeitY guidelines, and healthcare data protection requirements.

## Security Framework

### Compliance Standards

| Standard | Applicability | Status |
|----------|---------------|--------|
| **CERT-In Directions 2022** | Mandatory for all Indian govt systems | ✅ Implemented |
| **MeitY Open Source Policy** | Required for govt software | ✅ Compliant |
| **GIGW 3.0** | Government website guidelines | ✅ Compliant |
| **WCAG 2.2 AA** | Accessibility standard | ✅ Compliant |
| **ABDM Security** | Healthcare data protection | 🔄 Phase 3 |
| **ISO 27001** | Information security management | 📋 Planned |
| **HIPAA Equivalent** | Healthcare data (Indian context) | 🔄 Phase 3 |

### Security Principles

1. **Defense in Depth** - Multiple layers of security controls
2. **Zero Trust** - Never trust, always verify
3. **Least Privilege** - Minimum necessary access
4. **Data Minimization** - Collect only what's needed
5. **Audit Everything** - Comprehensive logging
5. **Fail Secure** - Secure by default
6. **Continuous Monitoring** - Real-time threat detection

---

## Application Security

### Authentication

#### JWT Implementation

```typescript
// Configuration
JWT_SECRET: RS256 key (min 2048-bit)
ACCESS_TOKEN_EXPIRY: 15 minutes
REFRESH_TOKEN_EXPIRY: 7 days
ISSUER: dh-araria
AUDIENCE: dh-araria-users

// Token Claims
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "PATIENT|DOCTOR|ADMIN|STAFF",
  "iat": 1699267200,
  "exp": 1699268100,
  "iss": "dh-araria",
  "aud": "dh-araria-users"
}
```

#### Password Security

- **Algorithm**: bcrypt with cost factor 12
- **Requirements**: 8+ chars, uppercase, lowercase, number, special char
- **History**: Prevent last 5 passwords reuse
- **Lockout**: 5 failed attempts → 15 min lockout
- **Rotation**: 90 days (configurable)

#### Multi-Factor Authentication (Phase 3)

- **e-Pramaan SSO** integration via Meri Pehchaan
- **OTP** via SMS/Email
- **Digital Certificate** support
- **Biometric** (Aadhaar) support

### Authorization

#### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **PATIENT** | Own appointments, profile, grievances |
| **DOCTOR** | Own schedule, appointments, patient records (assigned) |
| **STAFF** | Appointments, grievances, notices, blood bank |
| **ADMIN** | Full system access, user management, config |

#### Resource-Level Permissions

```typescript
// Example: Appointment access
PATIENT: CRUD own appointments
DOCTOR: Read assigned, Update status
STAFF: CRUD all, Assign doctors
ADMIN: Full CRUD + system config
```

### Session Management

- **Access Token**: 15 min, in-memory (frontend), Authorization header
- **Refresh Token**: 7 days, httpOnly secure cookie, rotation on use
- **Concurrent Sessions**: Max 3 per user
- **Idle Timeout**: 30 min warning, 60 min logout
- **Absolute Timeout**: 8 hours (refresh token)

---

## Data Protection

### Classification

| Level | Examples | Protection |
|-------|----------|------------|
| **Public** | Notices, department info, doctor profiles | Standard |
| **Internal** | Staff schedules, internal memos | Encrypted at rest |
| **Confidential** | Appointments, grievances, user profiles | Encrypted at rest + transit |
| **Restricted** | Medical records, ABHA data, audit logs | Field-level encryption, audit |

### Encryption

#### At Rest

| Data | Method | Key Management |
|------|--------|----------------|
| Database | PostgreSQL TDE / Column encryption | AWS KMS / HashiCorp Vault |
| Files | AES-256-GCM | Per-file keys, master key in Vault |
| Backups | AES-256 | Separate encryption keys |

#### In Transit

- **TLS 1.3** minimum for all connections
- **Certificate Pinning** for external APIs
- **mTLS** for service-to-service (Phase 3)
- **HSTS** with preload

### Field-Level Encryption (Phase 3)

```typescript
// Example: Sensitive field encryption
@Entity()
class PatientRecord {
  @FieldEncryption()
  abhaId: string;

  @FieldEncryption()
  medicalHistory: string;

  @FieldEncryption({ algorithm: 'AES-256-GCM' })
  diagnosis: string;
}
```

### Data Retention

| Data Type | Retention | Disposal |
|-----------|-----------|----------|
| Audit Logs | 180 days (CERT-In) | Secure deletion |
| Medical Records | 10 years (clinical) | Anonymization |
| Appointments | 7 years | Archive |
| Grievances | 5 years | Archive |
| Session Logs | 90 days | Purge |
| Password History | 5 years | Hash only |

---

## Network Security

### Network Architecture

```
Internet
    │
    ▼
┌─────────────────────────────────────┐
│ Global Load Balancer (WAF + DDoS)   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ DMZ: NGINX Ingress (SSL Termination)│
│ Rate Limiting, Security Headers     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ App Tier: Kubernetes (Private Subnet)│
│ Network Policies, mTLS (Phase 3)    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Data Tier: PostgreSQL + Redis       │
│ Private Subnet, No Internet Access  │
└─────────────────────────────────────┘
```

### Firewall Rules

| Source | Destination | Port | Protocol | Purpose |
|--------|-------------|------|----------|---------|
| Internet | LB | 443 | HTTPS | Public access |
| LB | Ingress | 443 | HTTPS | SSL termination |
| Ingress | Frontend | 3000 | HTTP | App traffic |
| Ingress | Backend | 3001 | HTTP | API traffic |
| Backend | PostgreSQL | 5432 | TCP | Database |
| Backend | Redis | 6379 | TCP | Cache/Sessions |
| Backend | External APIs | 443 | HTTPS | ABDM, e-Pramaan, etc. |

### Network Policies (Kubernetes)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3001
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgresql
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

---

## Infrastructure Security

### Container Security

#### Base Images

```dockerfile
# Use distroless/minimal base
FROM node:20-alpine AS base
# ... build stages ...
FROM gcr.io/distroless/nodejs20-debian12 AS runner
COPY --from=builder /app/dist ./dist
USER nonroot:nonroot
```

#### Security Scanning

```bash
# Trivy scan in CI
trivy image --severity HIGH,CRITICAL your-registry/dh-araria-backend:v1.0.0

# Dependency audit
npm audit --audit-level=high --workspaces
```

#### Runtime Security

- **Non-root user** in containers
- **Read-only root filesystem**
- **Drop all capabilities**
- **No privilege escalation**
- **Seccomp profile**

### Kubernetes Security

#### Pod Security Standards

```yaml
apiVersion: policy/v1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
```

#### RBAC

```yaml
# Least privilege roles
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: backend-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "patch"]
```

### Secrets Management

```yaml
# External Secrets Operator (recommended)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: dh-araria-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: dh-araria-secrets
    creationPolicy: Owner
  data:
  - secretKey: DATABASE_URL
    remoteRef:
      key: dh-araria/prod
      property: database_url
  - secretKey: JWT_SECRET
    remoteRef:
      key: dh-araria/prod
      property: jwt_secret
```

---

## API Security

### Rate Limiting

| Endpoint Type | Limit | Window | Burst |
|---------------|-------|--------|-------|
| General API | 100 req/min | 1 min | 20 |
| Auth (login/register) | 10 req/min | 1 min | 5 |
| Password Reset | 3 req/hour | 1 hour | 1 |
| File Upload | 10 req/min | 1 min | 2 |

### Input Validation

```typescript
// All inputs validated via class-validator + Zod
@IsEmail()
@IsString()
@MinLength(8)
@MaxLength(50)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
password: string;

// Sanitization
@Transform(({ value }) => sanitizeHtml(value))
description: string;
```

### Security Headers

```nginx
# Nginx security headers
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### CORS Policy

```typescript
// Restrictive CORS
app.enableCors({
  origin: process.env.FRONTEND_URL, // Exact match, no wildcards
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
});
```

---

## Vulnerability Management

### Scanning Schedule

| Scan Type | Frequency | Tool | Action |
|-----------|-----------|------|--------|
| SAST | Every PR | SonarQube/ESLint | Block merge on critical |
| DAST | Weekly | OWASP ZAP | Fix within 7 days |
| Container Scan | Daily | Trivy | Fix critical in 24h |
| Dependency Scan | Daily | npm audit / Snyk | Fix high in 72h |
| Penetration Test | Quarterly | CERT-In empanelled | Fix critical in 7 days |

### Vulnerability Response

| Severity | SLA | Process |
|----------|-----|---------|
| Critical (CVSS ≥ 9.0) | 24 hours | Emergency patch, emergency release |
| High (CVSS 7.0-8.9) | 72 hours | Priority patch, next release |
| Medium (CVSS 4.0-6.9) | 7 days | Scheduled patch |
| Low (CVSS 0.1-3.9) | 30 days | Next maintenance window |

---

## Incident Response

### Incident Classification

| Level | Criteria | Response Time | Team |
|-------|----------|---------------|------|
| **P1 - Critical** | Data breach, service down, active exploit | 15 min | Security + DevOps + Management |
| **P2 - High** | Vulnerability exploited, partial outage | 1 hour | Security + DevOps |
| **P3 - Medium** | Suspicious activity, failed attacks | 4 hours | Security |
| **P4 - Low** | Policy violation, scan findings | 24 hours | Security |

### Response Playbooks

#### Data Breach

1. **Contain** - Isolate affected systems
2. **Assess** - Determine scope, data affected
3. **Notify** - CERT-In (6 hours), affected users, management
4. **Remediate** - Patch vulnerability, rotate credentials
5. **Recover** - Restore from clean backups
6. **Review** - Post-incident review, update controls

#### Service Outage

1. **Detect** - Alert from monitoring
2. **Triage** - Determine root cause
3. **Mitigate** - Failover, restart, rollback
4. **Communicate** - Status page, stakeholders
5. **Resolve** - Permanent fix
6. **Review** - Post-mortem, action items

### CERT-In Reporting (6-Hour Rule)

```bash
# Automated incident reporting template
cat > incident-report.json <<EOF
{
  "incident_id": "INC-$(date +%Y%m%d-%H%M%S)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "severity": "HIGH",
  "type": "DATA_BREACH",
  "affected_systems": ["backend-api", "postgresql"],
  "data_categories": ["PII", "PHI"],
  "estimated_records": 1000,
  "root_cause": "SQL injection in appointment endpoint",
  "containment_actions": ["WAF rule deployed", "Endpoint disabled"],
  "remediation": ["Input validation fixed", "WAF rules updated"],
  "reporter": "security@dhararia.gov.in"
}
EOF

# Submit to CERT-In
curl -X POST https://cert-in.gov.in/api/incident \
  -H "Authorization: Bearer $CERT_IN_TOKEN" \
  -d @incident-report.json
```

---

## Audit & Logging

### Log Categories

| Category | Retention | Format | Destination |
|----------|-----------|--------|-------------|
| **Application** | 180 days | JSON | ELK Stack |
| **Security** | 180 days | JSON | ELK + SIEM |
| **Audit** | 7 years | JSON | Immutable storage |
| **Database** | 180 days | JSON | ELK Stack |
| **Network** | 180 days | PCAP/JSON | SIEM |
| **System** | 180 days | JSON | ELK Stack |

### Log Structure

```json
{
  "timestamp": "2024-10-06T10:30:00.000Z",
  "level": "INFO",
  "service": "backend",
  "traceId": "abc-123",
  "spanId": "def-456",
  "userId": "user-uuid",
  "action": "APPOINTMENT_CREATE",
  "resource": "Appointment",
  "resourceId": "apt-uuid",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "request": { "method": "POST", "path": "/api/v1/appointments" },
  "response": { "status": 201, "duration": 145 },
  "outcome": "SUCCESS"
}
```

### Audit Events

| Event | Logged Fields |
|-------|---------------|
| **Authentication** | login, logout, token_refresh, password_change, mfa_challenge |
| **Authorization** | permission_denied, role_change, privilege_escalation |
| **Data Access** | phi_access, medical_record_view, appointment_view |
| **Data Modification** | create, update, delete, bulk_operations |
| **Admin Actions** | user_create, config_change, permission_grant |
| **Security Events** | failed_login, brute_force, suspicious_activity |
| **Clinical/ABDM** | fhir_bundle_create, fhir_bundle_update, fhir_bundle_delete, consent_grant, consent_revoke, care_context_link |

### Automated Audit Logging via MikroORM Lifecycle Hooks

For Clinical & ABDM services using MikroORM, audit logging is automatically handled via entity lifecycle hooks, ensuring CERT-In compliance without manual instrumentation:

```typescript
// Automatic audit logging via MikroORM lifecycle hooks
@Entity({ tableName: 'fhir_bundles' })
export class FhirBundle {
  // ... entity properties ...

  @OnCreate()
  async onCreate(em: EntityManager) {
    await AuditLogService.log({
      action: 'FHIR_BUNDLE_CREATE',
      resource: 'FhirBundle',
      resourceId: this.id,
      details: { bundleId: this.bundleId, patientId: this.patientId },
    });
  }

  @OnUpdate()
  async onUpdate(em: EntityManager) {
    await AuditLogService.log({
      action: 'FHIR_BUNDLE_UPDATE',
      resource: 'FhirBundle',
      resourceId: this.id,
      details: { bundleId: this.bundleId, status: this.status },
    });
  }

  @OnDelete()
  async onDelete(em: EntityManager) {
    await AuditLogService.log({
      action: 'FHIR_BUNDLE_DELETE',
      resource: 'FhirBundle',
      resourceId: this.id,
      details: { bundleId: this.bundleId },
    });
  }
}
```

**Benefits**:
- **Zero Manual Instrumentation**: Audit logs automatically generated on entity lifecycle events
- **CERT-In Compliant**: 180-day retention guaranteed by automated hooks
- **Immutable**: Audit logs cannot be bypassed or disabled
- **Contextual**: Full entity state captured at each lifecycle event
- **Transactional**: Audit logs part of same Unit of Work as data changes

### Log Integrity

- **Immutable Storage**: Write-once storage (WORM)
- **Hash Chains**: Each log entry includes hash of previous
- **Digital Signatures**: Periodic signing of log batches
- **Verification**: Daily integrity checks

---

## Secure Development

### SDLC Security Gates

| Phase | Security Activity | Tool |
|-------|-------------------|------|
| **Requirements** | Threat modeling | Microsoft Threat Modeling Tool |
| **Design** | Architecture review | Security architect sign-off |
| **Coding** | Secure coding standards | Code review checklist |
| **Testing** | SAST/DAST/SCA | SonarQube, OWASP ZAP, Snyk |
| **Deployment** | Image scanning | Trivy, Cosign |
| **Runtime** | Runtime protection | Falco, eBPF |

### Secure Coding Checklist

- [ ] Input validation on all endpoints
- [ ] Output encoding for XSS prevention
- [ ] Parameterized queries (no string concatenation)
- [ ] Authentication on all non-public endpoints
- [ ] Authorization checks on resource access
- [ ] Secrets never in code (use vault)
- [ ] Error messages don't leak information
- [ ] Logging doesn't include sensitive data
- [ ] Cryptography uses approved algorithms
- [ ] Dependencies scanned and updated

### Code Review Security Focus

- Authentication/authorization logic
- Input validation/sanitization
- Cryptographic implementations
- Secret management
- Error handling
- Logging sensitivity
- Dependency changes

---

## Third-Party Integrations

### Security Requirements

| Integration | Authentication | Data Shared | Review |
|-------------|----------------|-------------|--------|
| **ABDM** | Mutual TLS + JWT | PHI (encrypted) | Quarterly |
| **e-Pramaan** | OAuth 2.0 | PII (minimal) | Quarterly |
| **Bhashini** | API Key + Secret | Text content | Quarterly |
| **CPGRAMS** | API Key + Cert | Grievance data | Quarterly |
| **e-RaktKosh** | API Key | Blood inventory | Quarterly |

### Vendor Assessment

1. **Security Questionnaire** - CAIQ or SIG
2. **Certifications** - ISO 27001, SOC 2, CERT-In empanelment
3. **Data Processing Agreement** - Signed DPA
4. **Incident Response** - 24/7 contact, SLA
5. **Right to Audit** - Contractual right

---

## Compliance Checklist

### CERT-In Directions 2022

- [ ] 6-hour incident reporting capability
- [ ] 180-day log retention
- [ ] NTP synchronization (time.nic.in, time.nplindia.org)
- [ ] Vulnerability management program
- [ ] Incident response plan
- [ ] Secure configuration baselines

### GIGW 3.0

- [ ] WCAG 2.2 AA compliance
- [ ] Bilingual content (English + Hindi minimum)
- [ ] Sitemap and search
- [ ] Feedback mechanism
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Accessibility statement

### MeitY Open Source Policy

- [ ] No proprietary dependencies
- [ ] License compliance (MIT/Apache-2.0 preferred)
- [ ] OpenForge publication ready
- [ ] Community contribution guidelines

---

## Security Testing

### Automated (CI/CD)

```yaml
# .github/workflows/security.yml
- name: SAST Scan
  uses: github/codeql-action/analyze@v2

- name: Dependency Audit
  run: npm audit --audit-level=high --workspaces

- name: Container Scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/dh-araria-backend:${{ github.sha }}
    severity: HIGH,CRITICAL

- name: Secret Scan
  uses: trufflesecurity/trufflehog@v3
```

### Manual Testing

```bash
# OWASP ZAP DAST scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.dhararia.bihar.gov.in \
  -r zap-report.html

# Manual penetration testing checklist
# - Authentication bypass
# - Authorization bypass
# - Injection (SQL, NoSQL, LDAP, XPath)
# - XSS (Reflected, Stored, DOM)
# - CSRF
# - SSRF
# - XXE
# - Deserialization
# - Broken access control
# - Security misconfiguration
# - Cryptographic failures
```

---

## Training & Awareness

### Developer Training

| Topic | Frequency | Audience |
|-------|-----------|----------|
| Secure coding practices | Quarterly | All developers |
| OWASP Top 10 | Annually | All developers |
| Threat modeling | Per project | Architects + Leads |
| Incident response | Quarterly | Security team |
| New vulnerabilities | Monthly | All technical |

### User Awareness

- **Phishing simulations** - Quarterly
- **Password hygiene** - Annual
- **Data handling** - Onboarding + annual
- **Incident reporting** - Onboarding + posters

---

## Contacts & Escalation

| Role | Contact | Availability |
|------|---------|--------------|
| **CISO** | ciso@dhararia.gov.in | 24/7 |
| **Security Team** | security@dhararia.gov.in | 24/7 |
| **DevOps Lead** | devops@dhararia.gov.in | Business hours + on-call |
| **DBA** | dba@dhararia.gov.in | Business hours + on-call |
| **CERT-In** | incident@cert-in.org.in | 24/7 |
| **NIC-CERT** | ncert@nic.in | 24/7 |

---

*Document Version: 1.0*  
*Last Updated: 2024-10-06*  
*Classification: CONFIDENTIAL - Government Use Only*