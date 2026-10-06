# DH Araria Hospital Portal - API Documentation

## Base Information

- **Base URL (Development)**: `http://localhost:3001/api/v1`
- **Base URL (Production)**: `https://dhararia.bihar.gov.in/api/v1`
- **API Version**: v1
- **Protocol**: HTTPS only (Production)
- **Authentication**: Bearer Token (JWT)
- **Rate Limits**: 100 req/min (general), 10 req/min (auth endpoints)
- **Content-Type**: `application/json`

## Authentication

### JWT Token Structure

```
Header: { "alg": "RS256", "typ": "JWT" }
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
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "disk": { "status": "up" }
  },
  "details": { ... }
}
```

---

## Webhooks (Phase 3 - ABDM)

### ABDM Webhook Endpoints

```http
POST /api/v1/abdm/on-discover
POST /api/v1/abdm/on-request
POST /api/v1/abdm/on-notify
POST /api/v1/abdm/on-consent
```

These endpoints will be implemented in Phase 3 for ABDM integration.

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
# Login
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
```

---

## Versioning & Deprecation

- **Version in URL**: `/api/v1/`
- **Deprecation Notice**: 6 months via `Sunset` header
- **Breaking Changes**: New major version (`/api/v2/`)

---

*Generated from Swagger/OpenAPI spec available at `/api/docs`*