# Feedback Glossary

Context: `feedback` — the public department-feedback form and the staff inbox.
Backend module: `apps/backend/src/modules/feedback/`. Tables: `feedback` and
`feedback_viewers`, both Drizzle-owned (`docs/adr/0002-feedback-table-ownership.md`).

### Feedback

One citizen's rating of one department visit, submitted without an account. A
row is a signal, not a conversation: there is no reply thread, no attachment and
no outbound notification. `Feedback` is the table and the TypeScript type; the
UI heading is "Share your feedback".

### Service area

The part of the visit being rated: `OPD`, `EMERGENCY`, `PHARMACY`, `LABORATORY`,
`RADIOLOGY`, `BILLING`, `ADMISSION` or `OTHER`. Defaults to `OPD`.

Not the department. A department says **where** (for example, Medicine); a
service area says **which stage** of the visit (for example, the pharmacy
counter inside it).

### Rating

The required overall score, an integer from 1 to 5. Enforced by DTO validation
and by a database check constraint (`feedback_rating_check`).

### Criterion rating

An optional 1–5 score for one of three criteria: `cleanliness`,
`staffBehaviour`, `waitTime`. `null` means the citizen skipped the question, not
zero; averages ignore nulls.

### Status

The inbox workflow marker: `NEW` (default on submission), `ACKNOWLEDGED`,
`RESOLVED`. Any transition is allowed; there is no enforced state machine and no
reason field. Distinct from `GrievanceStatus` and `ContactMessageStatus`, which
have their own value sets.

### Scope

The departments an authenticated user may read. `ADMIN` has unrestricted scope;
every other role has exactly the departments in `feedback_viewers`, which may be
none. Scope is a read boundary, not a role: a `DOCTOR` with no grant sees an
empty inbox rather than an error.

### Department grant

A row in `feedback_viewers` giving one user access to one department. Unique on
`(userId, departmentId)`; `grantedBy` records the admin who created it. Only
staff accounts (`DOCTOR`, `STAFF`, `ADMIN`) may receive one; a `PATIENT` account
is rejected.

### HM (Hospital Manager)

The hospital's name for the `ADMIN` role in this context. The HM sees every
department without a grant and is the only role that can create or revoke
grants. There is no separate `HM` role in the database.

### Public feedback link

`/feedback/<departmentId>` is the stable URL for one department's form, so it
can be printed on a notice or sent to a patient. `/feedback` lists the active
departments. There is no per-submission link and no share button; "link" always
means the department form.

### Honeypot

The hidden `website` field on the submission form. A human never sees or fills
it; `@IsEmpty()` rejects any request where it has a value. It is not a column and
is never stored.

### Anonymous by default

`name`, `phone` and `email` are optional. When omitted, the row cannot be
attributed to a person. When supplied, they are visible to every user with scope
for that department, not only to the HM.

## Feedback is not a grievance

| | Feedback | Grievance |
|---|---|---|
| Purpose | Measure service quality | Seek redress for a specific harm |
| Identity | Anonymous by default | `userId` optional, but name/email/phone are required |
| Routing | One department, read by grantees | Assigned to staff; optionally forwarded to CPGRAMS |
| Lifecycle | `NEW` → `ACKNOWLEDGED` → `RESOLVED` | `SUBMITTED` → `UNDER_REVIEW` → `IN_PROGRESS` → `RESOLVED` / `CLOSED` / `REJECTED` |
| Reply channel | None | Resolution text |
| Table | `feedback` | `grievances` |

A citizen who wants an answer should file a grievance; the feedback form is not
routed into that workflow.
