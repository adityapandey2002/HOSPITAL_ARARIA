# DH Araria Hospital Portal - Deployment Guide

## Overview

This guide covers deploying the DH Araria Hospital Portal to various environments, from local development to production on MeghRaj Cloud.

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Storage | 20 GB | 50 GB |
| OS | Ubuntu 22.04 LTS / RHEL 9 | Ubuntu 22.04 LTS |

### Software Dependencies

- Docker 24+
- Docker Compose 2+
- kubectl 1.28+ (for Kubernetes)
- Helm 3+ (for Kubernetes)
- PostgreSQL 15 client tools
- Redis 7 client tools

---

## Local Development Deployment

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-org/dh-araria.git
cd dh-araria

# 2. Configure environment
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# 3. Edit .env files with your settings
# Required: DATABASE_URL, JWT_SECRET, FRONTEND_URL

# 4. Start services
docker-compose up -d

# 5. Initialize database
cd apps/backend
npm run db:generate
npm run db:push
npm run db:seed

# 6. Access applications
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api/v1
# API Docs: http://localhost:3001/api/docs
```

### Environment Variables

#### Root (.env)
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=dh_araria
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-dev-secret-min-32-chars
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Backend (apps/backend/.env)
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dh_araria?schema=public
JWT_SECRET=your-dev-secret-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
LOG_LEVEL=debug
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Frontend (apps/frontend/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes (development)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed

# Reset database (development only)
npm run db:push --force-reset
```

---

## Staging Deployment

### Infrastructure

- **Kubernetes**: 3-node cluster (1 control plane, 2 workers)
- **PostgreSQL**: Primary + 1 replica (Patroni)
- **Redis**: Sentinel HA (3 nodes)
- **Ingress**: NGINX Ingress Controller
- **Certificates**: cert-manager + Let's Encrypt

### Deployment Steps

```bash
# 1. Build and push images
docker build -t your-registry/dh-araria-backend:staging ./apps/backend
docker build -t your-registry/dh-araria-frontend:staging ./apps/frontend
docker push your-registry/dh-araria-backend:staging
docker push your-registry/dh-araria-frontend:staging

# 2. Deploy to Kubernetes
kubectl apply -f k8s/staging/namespace.yaml
kubectl apply -f k8s/staging/configmap.yaml
kubectl apply -f k8s/staging/secrets.yaml
kubectl apply -f k8s/staging/postgres.yaml
kubectl apply -f k8s/staging/redis.yaml
kubectl apply -f k8s/staging/backend.yaml
kubectl apply -f k8s/staging/frontend.yaml
kubectl apply -f k8s/staging/ingress.yaml

# 3. Run migrations
kubectl exec -it deployment/backend -n staging -- npm run db:migrate

# 4. Verify deployment
kubectl get pods -n staging
kubectl logs -f deployment/backend -n staging
```

### Staging Configuration

```yaml
# k8s/staging/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dh-araria-config
  namespace: staging
data:
  NODE_ENV: "staging"
  FRONTEND_URL: "https://staging.dhararia.bihar.gov.in"
  LOG_LEVEL: "info"
  RATE_LIMIT_TTL: "60000"
  RATE_LIMIT_LIMIT: "100"
```

```yaml
# k8s/staging/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: dh-araria-secrets
  namespace: staging
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@postgres:5432/dh_araria"
  JWT_SECRET: "staging-secret-min-32-chars"
  REDIS_PASSWORD: "redis-password"
```

---

## Production Deployment (MeghRaj Cloud)

### MeghRaj Cloud Requirements

- **CSP Empanelment**: Use MeghRaj empanelled CSP
- **Data Localization**: All data within Indian borders
- **NDC Zones**: Active-Active across Delhi & Pune
- **Security**: WAF, Anti-DDoS, IAM integration
- **Compliance**: CERT-In, STQC ready

### Architecture

```
MeghRaj Cloud (Government of India)
├── NDC Delhi (Primary)
│   ├── Kubernetes Cluster (3 masters, 5 workers)
│   ├── PostgreSQL Patroni Cluster (3 nodes)
│   ├── Redis Sentinel (3 nodes)
│   └── NGINX Ingress + WAF
├── NDC Pune (Disaster Recovery)
│   ├── Kubernetes Cluster (3 masters, 3 workers)
│   ├── PostgreSQL Replica (Streaming)
│   ├── Redis Replica (Sentinel)
│   └── NGINX Ingress
└── Global Load Balancer (Citrix/F5)
    ├── SSL Termination
    ├── DDoS Protection
    └── Geo-routing
```

### Pre-Deployment Checklist

- [ ] CERT-In empanelled auditor engaged
- [ ] WASA audit completed
- [ ] Safe-To-Host certificate obtained
- [ ] STQC CQC certification initiated
- [ ] CMAP & CAP documents approved
- [ ] WIM appointed and trained
- [ ] MeghRaj CSP contract signed
- [ ] NDC zone allocation confirmed
- [ ] SSL certificates procured (gov.in domain)
- [ ] Domain configured (dhararia.bihar.gov.in)
- [ ] NTP servers configured (time.nic.in, time.nplindia.org)
- [ ] ELK stack deployed for 180-day logs
- [ ] Monitoring/alerting configured
- [ ] Backup strategy tested
- [ ] DR failover tested

### Deployment Process

#### 1. Infrastructure Provisioning (Terraform)

```bash
cd infra/terraform/meghraj

# Initialize
terraform init

# Plan
terraform plan -var-file=production.tfvars

# Apply
terraform apply -var-file=production.tfvars
```

#### 2. Kubernetes Setup

```bash
# Configure kubectl for MeghRaj clusters
kubectl config use-context meghraj-delhi-primary
kubectl config use-context meghraj-pune-dr

# Install operators
helm repo add postgresql-operator https://charts.postgresql-operator.io
helm install postgresql-operator postgresql-operator/postgresql-operator -n operators

helm repo add redis-operator https://charts.redis-operator.io
helm install redis-operator redis-operator/redis-operator -n operators

# Install monitoring
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring
```

#### 3. Database Deployment (PostgreSQL with Dual-ORM Support)

```bash
# Primary cluster (Delhi) - Patroni HA Cluster for PostgreSQL 15+
kubectl apply -f k8s/production/postgres-primary.yaml

# Verify Patroni cluster
kubectl exec -it postgresql-0 -n production -- patronictl list

# Verify JSONB support for FHIR R4 bundles
kubectl exec -it postgresql-0 -n production -- psql -U postgres -d dh_araria -c "SELECT jsonb_typeof('{}'::jsonb);"
```

#### 4. Redis Deployment

```bash
kubectl apply -f k8s/production/redis.yaml

# Verify Sentinel
kubectl exec -it redis-0 -n production -- redis-cli info sentinel
```

#### 5. Application Deployment

```bash
# Backend
kubectl apply -f k8s/production/backend.yaml

# Frontend
kubectl apply -f k8s/production/frontend.yaml

# Ingress with SSL
kubectl apply -f k8s/production/ingress.yaml
```

#### 6. Run Migrations

Prisma owns **all** schema changes — Drizzle and MikroORM are query layers over
the tables Prisma creates, and their own migration commands are intentionally not
exposed. There is therefore exactly one migration step.

```bash
# Wait for backend pods to be ready
kubectl wait --for=condition=available deployment/backend -n production --timeout=300s

# Apply pending migrations (idempotent; safe to re-run)
kubectl exec -it deployment/backend -n production -- npm run db:migrate:prod

# Seed production data (first time only)
kubectl exec -it deployment/backend -n production -- npm run db:seed
```

> Running a `drizzle-kit push` or a MikroORM migration in production would fork
> the schema. Neither tool is installed, and neither migration command is present
> in `package.json`.

#### Verification

```bash
# Every table exists (both query layers share one physical schema)
kubectl exec -it deployment/backend -n production -- psql -U postgres -d dh_araria -c "\dt"

# JSONB column for FHIR R4
kubectl exec -it deployment/backend -n production -- psql -U postgres -d dh_araria -c "\d fhir_bundles" | grep fhirJson

# Read-only drift check: exits 0 in sync, 1 on drift, 2 if the DB is unreachable.
# Safe to run post-deploy; it never writes DDL.
kubectl exec -it deployment/backend -n production -- npm run mikro:schema:update

# Health endpoint reports Prisma + Drizzle reachability and pool stats
kubectl exec -it deployment/backend -n production -- \
  curl -s localhost:3001/api/v1/health | jq '.database'
```

Expected `database` block:

```json
{
  "status": "up",
  "prisma": "up",
  "drizzle": "up",
  "drizzlePool": { "total": 0, "idle": 0, "waiting": 0 }
}
```

#### 7. Verify Production

```bash
# Check all pods
kubectl get pods -n production -o wide

# Check services
kubectl get svc -n production

# Check ingress
kubectl get ingress -n production

# Test endpoints
curl -I https://dhararia.bihar.gov.in/health/live
curl -I https://dhararia.bihar.gov.in/api/docs
```

### Production Configuration

```yaml
# k8s/production/backend.yaml (key excerpts)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: backend
  template:
    spec:
      containers:
      - name: backend
        image: your-registry/dh-araria-backend:v1.0.0
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        envFrom:
        - configMapRef:
            name: dh-araria-config
        - secretRef:
            name: dh-araria-secrets
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: production
spec:
  selector:
    app: backend
  ports:
  - port: 3001
    targetPort: 3001
```

### SSL/TLS Configuration

```yaml
# k8s/production/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dh-araria-ingress
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/hsts: "true"
    nginx.ingress.kubernetes.io/hsts-max-age: "31536000"
    nginx.ingress.kubernetes.io/hsts-include-subdomains: "true"
spec:
  tls:
  - hosts:
    - dhararia.bihar.gov.in
    - www.dhararia.bihar.gov.in
    secretName: dh-araria-tls
  rules:
  - host: dhararia.bihar.gov.in
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3001
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
```

---

## Post-Deployment

### Health Checks

```bash
# Automated health check script
#!/bin/bash
# health-check.sh

ENDPOINTS=(
  "https://dhararia.bihar.gov.in/health/live"
  "https://dhararia.bihar.gov.in/health/ready"
  "https://dhararia.bihar.gov.in/api/docs"
)

for endpoint in "${ENDPOINTS[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
  if [ "$response" -ne 200 ]; then
    echo "FAIL: $endpoint returned $response"
    exit 1
  fi
  echo "OK: $endpoint"
done

echo "All health checks passed"
```

### Monitoring Setup

```bash
# Deploy Prometheus alerts
kubectl apply -f k8s/production/prometheus-alerts.yaml

# Key alerts:
# - High error rate (>5%)
# - High latency (p99 > 1s)
# - Pod restarts
# - Disk usage > 80%
# - Memory usage > 85%
# - Database connections > 80%
# - Certificate expiry < 30 days
```

### Backup Verification

```bash
# Daily backup verification
#!/bin/bash
# verify-backup.sh

BACKUP_DATE=$(date -d "yesterday" +%Y%m%d)
BACKUP_FILE="s3://dh-araria-backups/postgres-$BACKUP_DATE.dump"

# Download and test restore to staging
aws s3 cp "$BACKUP_FILE" /tmp/backup.dump
pg_restore --clean --if-exists --no-owner --dbname=dh_araria_staging /tmp/backup.dump

if [ $? -eq 0 ]; then
  echo "Backup verification successful"
else
  echo "BACKUP VERIFICATION FAILED"
  # Alert on-call
fi
```

---

## Rollback Procedure

### Application Rollback

```bash
# Quick rollback to previous version
kubectl rollout undo deployment/backend -n production
kubectl rollout undo deployment/frontend -n production

# Verify rollback
kubectl rollout status deployment/backend -n production
kubectl rollout status deployment/frontend -n production
```

### Database Rollback

```bash
# Point-in-time recovery (if needed)
# 1. Stop application
kubectl scale deployment backend --replicas=0 -n production

# 2. Restore from backup
pg_restore --clean --if-exists --no-owner --dbname=dh_araria /path/to/backup.dump

# 3. Start application
kubectl scale deployment backend --replicas=5 -n production
```

### DR Failover

```bash
# Manual DR failover (if automatic fails)
# 1. Promote DR PostgreSQL
kubectl exec -it postgresql-0 -n production-dr -- patronictl failover --candidate postgresql-1

# 2. Update DNS/Load Balancer
# Point to DR NDC IP

# 3. Scale up DR Kubernetes
kubectl scale deployment backend --replicas=5 -n production-dr

# 4. Verify
curl -I https://dhararia.bihar.gov.in/health/live
```

---

## Security Hardening (Production)

### Network Policies

```yaml
# k8s/production/network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
  namespace: production
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

### Pod Security Standards

```yaml
# Restricted PSP for production
apiVersion: policy/v1beta1
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
  fsGroup:
    rule: 'RunAsAny'
```

---

## Maintenance Windows

### Scheduled Maintenance

| Activity | Frequency | Window | Duration |
|----------|-----------|--------|----------|
| Security patches | Monthly | 2nd Saturday 02:00-04:00 IST | 2 hours |
| Database maintenance | Weekly | Sunday 03:00-04:00 IST | 1 hour |
| Certificate renewal | Quarterly | Automated | - |
| DR failover test | Monthly | 1st Sunday 02:00-04:00 IST | 2 hours |
| Full backup verification | Daily | 03:00 IST | 30 min |

### Emergency Maintenance

- **Trigger**: Critical security vulnerability (CVSS ≥ 9.0)
- **Approval**: CISO + Project Director
- **Communication**: 2-hour advance notice to stakeholders
- **Rollback**: Immediate if issues detected

---

## Troubleshooting

### Common Issues

| Issue | Diagnosis | Resolution |
|-------|-----------|------------|
| Backend pods CrashLoopBackOff | Check logs: `kubectl logs -l app=backend` | Fix config/env, restart |
| Database connection refused | Check PostgreSQL status, network policies | Verify service, credentials |
| High memory usage | Check heap dumps, memory leaks | Increase limits, fix leaks |
| SSL certificate errors | Check cert-manager logs | Renew cert, check DNS |
| Rate limiting too aggressive | Check nginx config, headers | Adjust limits |

### Debug Commands

```bash
# View backend logs
kubectl logs -f deployment/backend -n production --tail=100

# Exec into backend pod
kubectl exec -it deployment/backend-xxx -n production -- sh

# Check database connectivity
kubectl exec -it deployment/backend-xxx -n production -- nc -zv postgresql 5432

# View events
kubectl get events -n production --sort-by='.lastTimestamp'

# Describe pod for details
kubectl describe pod backend-xxx -n production
```

---

## Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| DevOps Lead | devops@dhararia.gov.in | Primary |
| Database Admin | dba@dhararia.gov.in | Secondary |
| Security Officer | security@dhararia.gov.in | Tertiary |
| Project Director | director@dhararia.gov.in | Executive |

---

*Document Version: 1.0*  
*Last Updated: 2024-10-06*  
*Classification: Internal - Government Use*