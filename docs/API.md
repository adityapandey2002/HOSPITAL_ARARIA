# DH Araria Hospital Portal - API Documentation

## Base Information

- **Base URL (Development)**: `http://localhost:3001/api/v1`
- **Base URL (Production)**: `<backend-origin>/api/v1` — the Vercel project's origin, configured in the frontend as `NEXT_PUBLIC_API_URL`
- **API Version**: v1
- **Protocol**: HTTPS only (Production)
- **Authentication**: Bearer Token (JWT)
- **Rate Limits**: 100 req/min (general), 10 req/min (auth endpoints), 5 req/min (public feedback and contact), 20 req/min (client error reports)
- **Content-Type**: `application/json`

## Authentication

### JWT Token Structure

Tokens are signed with HS256 using the shared `JWT_SECRET` (minimum 32
characters), and carry the issuer `dh-araria` and audience `dh-araria-users`.

```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: {
  "sub": "user-id",
  "email": "user@example.com",
  "role": "PATIENT|DOCTOR|ADMIN|STAFF",
  "iat": 1234567890,
  "exp": 1234568790,
  "iss": "dh-araria",
  "aud": "dh-araria-users"
}
```

### Token Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login with email/password |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/logout` | POST | Logout (blacklist refresh token) |
| `/auth/me` | GET | Get current user profile |
| `/auth/change-password` | POST | Change password |
| `/auth/forgot-password` | POST | Request password reset |
| `/auth/reset-password` | POST | Reset password with token |

### Using Tokens

```http
Authorization: Bearer <access_token>
```

---

## Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-10-06T10:30:00.000Z",
    "path": "/api/v1/endpoint",
    "method": "POST"
  }
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (client error reports) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable Entity (validation failed) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Pagination

All list endpoints support pagination:

### Request Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Page number |
| `limit` | integer | 10 | 100 | Items per page |
| `sortBy` | string | createdAt | - | Sort field |
| `sortOrder` | string | desc | - | asc/desc |

### Response Format

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## API Endpoints

### 🔐 Authentication

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+919876543210"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+919876543210",
      "role": "PATIENT",
      "createdAt": "2024-10-06T10:30:00.000Z"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

#### Get Profile
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

#### Change Password
```http
POST /api/v1/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

---

### 👥 Users (Admin/Staff Only)

#### List Users
```http
GET /api/v1/users?page=1&limit=10&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <token>
Roles: ADMIN, STAFF
```

#### Get User by ID
```http
GET /api/v1/users/:id
Authorization: Bearer <token>
Roles: ADMIN, STAFF
```

#### Update User
```http
PUT /api/v1/users/:id
Authorization: Bearer <token>
Roles: ADMIN
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+919876543210",
  "role": "STAFF",
  "isActive": true
}
```

#### Delete User
```http
DELETE /api/v1/users/:id
Authorization: Bearer <token>
Roles: ADMIN
```

---

### 👨‍⚕️ Doctors

#### List Doctors (Public)
```http
GET /api/v1/doctors?page=1&limit=10&departmentId=uuid&search=cardio&isActive=true
```

**Query Parameters:**
- `departmentId` - Filter by department
- `search` - Search in name, specialization, qualification
- `isActive` - Filter active/inactive

**Response:**
```json
{
  "success": true,
  "data": [{
    "id": "uuid",
    "name": "Dr. Rajesh Kumar",
    "specialization": "Cardiology",
    "qualification": "MD, DM (Cardiology)",
    "experience": 15,
    "department": { "id": "uuid", "name": "Cardiology" },
    "consultationFee": 500,
    "rating": 4.9,
    "reviewCount": 245,
    "languages": ["English", "Hindi", "Maithili"],
    "availableSlots": [...],
    "isActive": true
  }],
  "meta": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
}
```

#### Get Doctor by ID
```http
GET /api/v1/doctors/:id
```

#### Get Available Slots
```http
GET /api/v1/doctors/:id/slots?date=2024-10-15
```

**Response:**
```json
{
  "success": true,
  "data": [{
    "id": "uuid",
    "dayOfWeek": 1,
    "startTime": "10:00",
    "endTime": "13:00",
    "isAvailable": true,
    "maxAppointments": 20
  }]
}
```

#### Create Doctor (Admin)
```http
POST /api/v1/doctors
Authorization: Bearer <token>
Roles: ADMIN
Content-Type: application/json

{
  "userId": "uuid",
  "name": "Dr. New Doctor",
  "specialization": "Neurology",
  "qualification": "MD, DM (Neurology)",
  "experience": 10,
  "hprId": "HPR-12345678",
  "departmentId": "uuid",
  "consultationFee": 600,
  "languages": ["English", "Hindi"],
  "bio": "Neurology specialist...",
  "imageUrl": "https://..."
}
```

---

### 🏥 Departments

#### List Departments (Public)
```http
GET /api/v1/departments
```

**Response:**
```json
{
  "success": true,
  "data": [{
    "id": "uuid",
    "name": "Cardiology",
    "description": "Heart and cardiovascular care",
    "icon": "heart",
    "imageUrl": "https://...",
    "isActive": true,
    "doctorCount": 5,
    "doctors": [...]
  }]
}
```

#### Get Department by ID
```http
GET /api/v1/departments/:id
```

---

### 📅 Appointments

#### Book Appointment (Public)
```http
POST /api/v1/appointments
Content-Type: application/json

{
  "departmentId": "uuid",
  "doctorId": "uuid",
  "appointmentDate": "2024-10-15",
  "startTime": "10:00",
  "type": "OPD",
  "reason": "Chest pain consultation",
  "notes": "Previous ECG attached",
  "abhaId": "12-3456-7890-1234"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "departmentId": "uuid",
    "appointmentDate": "2024-10-15T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "10:20",
    "status": "PENDING",
    "type": "OPD",
    "tokenNumber": 15,
    "createdAt": "2024-10-06T10:30:00.000Z"
  }
}
```

#### Get My Appointments
```http
GET /api/v1/appointments/my?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Appointment by ID
```http
GET /api/v1/appointments/:id
Authorization: Bearer <token>
```

#### Cancel Appointment
```http
DELETE /api/v1/appointments/:id
Authorization: Bearer <token>
```

#### Update Appointment Status (Admin/Staff/Doctor)
```http
PUT /api/v1/appointments/:id/status
Authorization: Bearer <token>
Roles: ADMIN, STAFF, DOCTOR
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

**Status Values:** `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`, `RESCHEDULED`

#### Get Doctor Appointments
```http
GET /api/v1/appointments/doctor/:doctorId?page=1&limit=10&date=2024-10-15
Authorization: Bearer <token>
Roles: ADMIN, STAFF, DOCTOR
```

---

### 🩸 Blood Bank

#### Get Blood Stock (Public)
```http
GET /api/v1/blood-bank?page=1&limit=50
```

#### Get Stock Summary (Public)
```http
GET /api/v1/blood-bank/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "A+": { "WHOLE_BLOOD": 45, "PACKED_RED_CELLS": 30, "PLATELETS": 15, "PLASMA": 20 },
    "O-": { "WHOLE_BLOOD": 15, "PACKED_RED_CELLS": 10 }
  }
}
```

#### Get Blood Groups (Public)
```http
GET /api/v1/blood-bank/blood-groups
```

#### Get Component Types (Public)
```http
GET /api/v1/blood-bank/component-types
```

#### Update Stock (Admin/Staff)
```http
POST /api/v1/blood-bank/stock
Authorization: Bearer <token>
Roles: ADMIN, STAFF
Content-Type: application/json

{
  "bloodGroup": "A+",
  "componentType": "WHOLE_BLOOD",
  "units": 10
}
```

#### Set Stock (Admin/Staff)
```http
PUT /api/v1/blood-bank/stock
Authorization: Bearer <token>
Roles: ADMIN, STAFF
Content-Type: application/json

{
  "bloodGroup": "O-",
  "componentType": "PLATELETS",
  "units": 50
}
```

**Blood Groups:** `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`

**Component Types:** `WHOLE_BLOOD`, `PACKED_RED_CELLS`, `PLATELETS`, `PLASMA`, `CRYOPRECIPITATE`

---

### 📝 Grievances

#### Submit Grievance (Public)
```http
POST /api/v1/grievances
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "category": "MEDICAL_NEGLIGENCE",
  "subject": "Delayed treatment in emergency",
  "description": "Detailed description of the issue..."
}
```

**Categories:** `MEDICAL_NEGLIGENCE`, `STAFF_BEHAVIOR`, `INFRASTRUCTURE`, `BILLING`, `APPOINTMENT`, `MEDICINE_AVAILABILITY`, `CLEANLINESS`, `OTHER`

#### Get My Grievances
```http
GET /api/v1/grievances/my?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Grievance by ID
```http
GET /api/v1/grievances/:id
Authorization: Bearer <token>
```

#### Update Grievance
```http
PUT /api/v1/grievances/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Updated subject",
  "description": "Updated description"
}
```

#### Update Status (Admin/Staff)
```http
PUT /api/v1/grievances/:id/status
Authorization: Bearer <token>
Roles: ADMIN, STAFF
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "resolution": "Assigned to department head for review"
}
```

**Statuses:** `SUBMITTED`, `UNDER_REVIEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED`

#### Assign Grievance (Admin/Staff)
```http
PUT /api/v1/grievances/:id/assign
Authorization: Bearer <token>
Roles: ADMIN, STAFF
Content-Type: application/json

{
  "assigneeId": "uuid"
}
```

#### List All Grievances (Admin/Staff)
```http
GET /api/v1/grievances?page=1&limit=10&status=SUBMITTED&category=MEDICAL_NEGLIGENCE
Authorization: Bearer <token>
Roles: ADMIN, STAFF
```

#### Get Categories (Public)
```http
GET /api/v1/grievances/categories
```

#### Get Statuses (Public)
```http
GET /api/v1/grievances/statuses
```

---

### Feedback

Public, anonymous submission with a scoped staff inbox. It is stored in two
Drizzle-owned tables, `feedback` and `feedback_viewers`
(`docs/adr/0002-feedback-table-ownership.md`).

#### Visibility and scope

| Actor | Sees |
|-------|------|
| Anonymous caller | `POST /feedback` only |
| `ADMIN` (the Hospital Manager) | Every department, every response, and all access grants |
| Any other signed-in user | Only the departments granted in `feedback_viewers`; no grant means an empty inbox, not an error |

Scope is enforced in `FeedbackService`, not in the controller: every read passes
through `accessibleDepartmentIds()` / `requireDepartmentAccess()`, so a new
route cannot widen it. Only `ADMIN` may manage grants.

Two failure modes are deliberately distinct:

| Status | Meaning |
|--------|---------|
| `403` | The feedback row exists but its department is not in your scope, or the route requires `ADMIN` |
| `404` | The row, user or department does not exist. Existence is checked before scope, so the two errors stay distinct. |

#### Submit feedback (Public)

```http
POST /api/v1/feedback
Content-Type: application/json
```

**Throttle:** 5 requests per minute per client IP. On Vercel this is per citizen,
because `trust proxy` is set to `1` on serverless.

```json
{
  "departmentId": "3f1c1a5e-...",
  "serviceArea": "OPD",
  "rating": 4,
  "cleanliness": 5,
  "staffBehaviour": 4,
  "waitTime": 2,
  "comment": "Short wait at registration, long queue for tests.",
  "name": "Optional Name",
  "phone": "+91 98765 43210",
  "email": "optional@example.com"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `departmentId` | uuid | yes | Must exist and be active; otherwise `404 Department not found` |
| `serviceArea` | enum | yes | `OPD`, `EMERGENCY`, `PHARMACY`, `LABORATORY`, `RADIOLOGY`, `BILLING`, `ADMISSION`, `OTHER` |
| `rating` | integer | yes | 1–5 (overall) |
| `cleanliness` | integer | no | 1–5 |
| `staffBehaviour` | integer | no | 1–5 |
| `waitTime` | integer | no | 1–5 |
| `comment` | string | no | at most 2000 characters |
| `name` | string | no | at most 120 characters; feedback is anonymous by default |
| `phone` | string | no | 7–20 characters of digits, spaces, `+`, `-`, `(`, `)` |
| `email` | string | no | valid e-mail, at most 254 characters |
| `website` | string | must be empty | Honeypot: hidden in the form, rejected if it has any value |

`status`, `id` and the timestamps are server-owned and absent from the DTO.
Unknown fields are rejected (`forbidNonWhitelisted`), so a caller cannot smuggle
a workflow state through the public endpoint.

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "departmentId": "uuid",
    "departmentName": "General Medicine",
    "serviceArea": "OPD",
    "rating": 4,
    "cleanliness": 5,
    "staffBehaviour": 4,
    "waitTime": 2,
    "comment": "Short wait at registration, long queue for tests.",
    "name": "Optional Name",
    "phone": "+91 98765 43210",
    "email": "optional@example.com",
    "status": "NEW",
    "createdAt": "2026-10-24T10:30:00.000Z",
    "updatedAt": "2026-10-24T10:30:00.000Z"
  }
}
```

#### Departments in scope

```http
GET /api/v1/feedback/scope
Authorization: Bearer <token>
```

`all` is `true` for `ADMIN`. For everyone else, `departments` lists the active
departments they hold a grant for — the same source the inbox uses, so an empty
scope and an empty list can never disagree.

```json
{
  "success": true,
  "data": {
    "all": false,
    "departments": [{ "id": "uuid", "name": "General Medicine" }]
  }
}
```

#### List feedback

```http
GET /api/v1/feedback?page=1&limit=10&status=NEW&serviceArea=OPD
Authorization: Bearer <token>
```

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `page` | integer | 1 | 1 or greater |
| `limit` | integer | 10 | 1–100 |
| `sortBy` | string | `createdAt` | `createdAt`, `rating`, `status` or `serviceArea`; any other value falls back to `createdAt` |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `departmentId` | uuid | — | Narrows within scope; a department outside your scope returns an empty page, not `403` |
| `status` | enum | — | `NEW`, `ACKNOWLEDGED`, `RESOLVED` |
| `serviceArea` | enum | — | the eight service areas above |
| `from` | ISO 8601 | — | Inclusive lower bound on `createdAt` |
| `to` | ISO 8601 | — | Inclusive upper bound; a date-only value covers the whole day |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "departmentId": "uuid",
      "departmentName": "General Medicine",
      "serviceArea": "OPD",
      "rating": 4,
      "cleanliness": 5,
      "staffBehaviour": 4,
      "waitTime": 2,
      "comment": "…",
      "name": null,
      "phone": null,
      "email": null,
      "status": "NEW",
      "createdAt": "2026-10-24T10:30:00.000Z",
      "updatedAt": "2026-10-24T10:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

#### Feedback statistics

```http
GET /api/v1/feedback/stats?departmentId=uuid
Authorization: Bearer <token>
```

`departmentId` is optional and narrows within scope. Averages are rounded to one
decimal; a criterion nobody rated comes back as `null`.

```json
{
  "success": true,
  "data": {
    "total": 42,
    "averageRating": 3.8,
    "averageCleanliness": 4.1,
    "averageStaffBehaviour": 4,
    "averageWaitTime": 2.9,
    "byStatus": { "NEW": 12, "ACKNOWLEDGED": 8, "RESOLVED": 22 },
    "ratingDistribution": { "1": 2, "2": 5, "3": 10, "4": 15, "5": 10 },
    "byDepartment": [
      { "departmentId": "uuid", "departmentName": "General Medicine", "total": 20, "averageRating": 4 }
    ]
  }
}
```

#### Update feedback status

```http
PATCH /api/v1/feedback/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "ACKNOWLEDGED"
}
```

The inbox presents the workflow as `NEW → ACKNOWLEDGED → RESOLVED`. The endpoint
sets the value it is given; it does not reject a backward transition.

- `403` — the row exists in a department you cannot read.
- `404` — no feedback with that id.

#### List access grants (Admin only)

```http
GET /api/v1/feedback/access
Authorization: Bearer <token>
Roles: ADMIN
```

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "Dr A. Verma",
      "userEmail": "a.verma@dhararia.gov.in",
      "departmentId": "uuid",
      "departmentName": "General Medicine",
      "grantedBy": "uuid",
      "createdAt": "2026-10-24T10:00:00.000Z"
    }
  ]
}
```

#### Grant access (Admin only)

```http
POST /api/v1/feedback/access
Authorization: Bearer <token>
Roles: ADMIN
Content-Type: application/json

{
  "userId": "uuid",
  "departmentIds": ["uuid", "uuid"]
}
```

A user may hold grants for several departments. The pair
(`userId`, `departmentId`) is unique, so re-granting is a no-op and the response
is the **current** set of grants for that user/department combination, not just
the rows this call inserted.

- `201` — grants created (or already present).
- `404` — the user or one of the departments does not exist.
- `403` — the caller is not `ADMIN`. The check runs in the guard **and** again in
  the service.

#### Revoke access (Admin only)

```http
DELETE /api/v1/feedback/access/:id
Authorization: Bearer <token>
Roles: ADMIN
```

```json
{ "success": true, "data": { "deleted": true } }
```

`404` if the grant id does not exist.

---

### 📢 Notices

#### List Published Notices (Public)
```http
GET /api/v1/notices/published?page=1&limit=10&language=en
```

#### Get Notice by ID (Public)
```http
GET /api/v1/notices/:id
```

#### List All Notices (Admin/Staff)
```http
GET /api/v1/notices?page=1&limit=10&category=RECRUITMENT&isPublished=true
Authorization: Bearer <token>
Roles: ADMIN, STAFF
```

#### Create Notice (Admin/Staff)
```http
POST /api/v1/notices
Authorization: Bearer <token>
Roles: ADMIN, STAFF
Content-Type: application/json

{
  "title": "Free Health Camp",
  "content": "Details about the camp...",
  "category": "PUBLIC_HEALTH",
  "priority": "HIGH",
  "publishedAt": "2024-10-06T10:00:00.000Z",
  "expiresAt": "2024-10-15T23:59:59.000Z",
  "isPublished": true,
  "language": "en",
  "attachmentUrl": "https://..."
}
```

**Categories:** `GENERAL`, `RECRUITMENT`, `TENDER`, `PUBLIC_HEALTH`, `SCHEDULE_CHANGE`, `EMERGENCY`

**Priorities:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

#### Update Notice (Admin/Staff)
```http
PUT /api/v1/notices/:id
Authorization: Bearer <token>
Roles: ADMIN, STAFF
Content-Type: application/json

{
  "title": "Updated Title",
  "isPublished": false
}
```

#### Delete Notice (Admin/Staff)
```http
DELETE /api/v1/notices/:id
Authorization: Bearer <token>
Roles: ADMIN, STAFF
```

#### Get Categories (Public)
```http
GET /api/v1/notices/categories
```

#### Get Priorities (Public)
```http
GET /api/v1/notices/priorities
```

---

### 🏥 Health Checks

#### Liveness Probe
```http
GET /api/v1/health/live
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-10-06T10:30:00.000Z"
}
```

#### Readiness Probe
```http
GET /api/v1/health/ready
```

#### Full Health Check
```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "drizzle": "up",
      "mikro": "up",
      "drizzlePool": { "total": 1, "idle": 1, "waiting": 0 }
    }
  },
  "error": {},
  "details": { "database": { "...": "same object" } }
}
```

`GET /api/v1/health/live` is a dependency-free liveness probe that returns
`{ "status": "ok", "timestamp": "..." }`.

---

### Client Error Reporting

The frontend error boundaries (`apps/frontend/src/app/error.tsx` and
`app/global-error.tsx`) report here through `src/lib/telemetry.ts`. Reporting is
best-effort: a failed report never masks the original error.

```http
POST /api/v1/client-errors
Content-Type: application/json
```

Public. **Throttle:** 20 requests per minute per client IP.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `message` | string | yes | 1–500 characters |
| `stack` | string | no | at most 4000 characters; only the first ten frames are logged |
| `digest` | string | no | at most 200 characters (the Next.js error digest) |
| `path` | string | no | at most 500 characters; query string and fragment are stripped |
| `userAgent` | string | no | at most 500 characters |
| `occurredAt` | ISO 8601 | no | defaults to the server's receipt time |

```json
{
  "message": "Cannot read properties of undefined (reading 'map')",
  "stack": "TypeError: …",
  "digest": "1234567890",
  "path": "/feedback/inbox",
  "userAgent": "Mozilla/5.0 …",
  "occurredAt": "2026-10-24T10:30:00.000Z"
}
```

**Response (202):**

```json
{ "success": true, "data": { "received": true } }
```

The server writes exactly one structured log line and stores nothing:

```json
{
  "event": "client_error",
  "message": "…",
  "digest": "…",
  "path": "/feedback/inbox",
  "userAgent": "…",
  "occurredAt": "…",
  "stack": "first ten frames only"
}
```

The payload is deliberately small and PII-free: no cookies, no e-mail, no request
body. `path` is cut at the first `?` or `#`, because a query string can carry a
phone number.

---

## Webhooks (Phase 3 - ABDM)

### Inbound callbacks

The ABDM gateway callbacks (`on-discover`, `on-request`, `on-notify`,
`on-consent`) are **not implemented yet**. They require an ABDM sandbox
enrolment, the gateway's signing certificate and a verified request-signature
scheme, none of which exist in this repository. Do not expose placeholder
routes: an unverified callback that writes clinical data would be worse than a
404.

### Available ABDM routes

```http
GET  /api/v1/abdm/bundles/:id          # Fetch one stored FHIR bundle (staff only)
POST /api/v1/abdm/consents/:id/revoke  # Revoke a consent artefact (staff only)
```

Both are guarded by JWT authentication and write to the audit trail.

---

## Rate Limiting Headers

Responses include rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699267200
Retry-After: 60 (when limited)
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
const API_BASE = 'http://localhost:3001/api/v1';

class DhArariaApi {
  private token: string | null = null;

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      this.token = data.data.accessToken;
      localStorage.setItem('token', this.token);
    }
    return data;
  }

  async getDoctors(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/doctors?${query}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return res.json();
  }

  async bookAppointment(appointmentData: any) {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(appointmentData)
    });
    return res.json();
  }
}
```

### cURL Examples

```bash
# Login (local seed data only — never present in production)
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@dhararia.gov.in","password":"Demo@123"}'

# Get doctors (with token)
curl -X GET "http://localhost:3001/api/v1/doctors?departmentId=uuid&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Book appointment
curl -X POST http://localhost:3001/api/v1/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"doctorId":"uuid","appointmentDate":"2024-10-15","startTime":"10:00","type":"OPD","reason":"Consultation"}'

# Submit feedback (public, anonymous)
curl -X POST http://localhost:3001/api/v1/feedback \
  -H "Content-Type: application/json" \
  -d '{"departmentId":"uuid","serviceArea":"OPD","rating":4}'

# Read the scoped feedback inbox
curl -X GET "http://localhost:3001/api/v1/feedback?page=1&limit=10&status=NEW" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Versioning & Deprecation

- **Version in URL**: `/api/v1/`
- **Deprecation Notice**: 6 months via `Sunset` header
- **Breaking Changes**: New major version (`/api/v2/`)

---

*Generated from the Swagger/OpenAPI spec at `/api/docs` (served when `NODE_ENV` is not `production`).*