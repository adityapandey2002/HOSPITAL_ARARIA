# Glossary Map

This repo has one product — the DH Araria hospital portal — split across npm workspaces. The domain contexts are the backend bounded contexts, not the workspaces, because those are where the vocabulary actually diverges. `apps/frontend` and `packages/ui` present a shared domain language and so share one `portal` glossary.

Read the glossary for each context you're working in. Skip contexts that don't touch your change.

## Contexts

### `appointments`

Glossary: `apps/backend/src/modules/appointments/GLOSSARY.md`
ADRs: `apps/backend/src/modules/appointments/docs/adr/`

Owns scheduling terms: Appointment, AppointmentType, AppointmentStatus, token number, time slot, consultation fee, no-show. Also the vocabulary shared with `doctors` and `departments`, since an appointment is always scoped to one doctor in one department.

### `grievances`

Glossary: `apps/backend/src/modules/grievances/GLOSSARY.md`
ADRs: `apps/backend/src/modules/grievances/docs/adr/`

Owns the citizen complaint lifecycle: Grievance, GrievanceCategory, GrievanceStatus, CPGRAMS id, assignment, resolution. A grievance may be filed anonymously, so `userId` is optional while `name`/`email`/`phone` are not.

### `blood-bank`

Glossary: `apps/backend/src/modules/blood-bank/GLOSSARY.md`
ADRs: `apps/backend/src/modules/blood-bank/docs/adr/`

Owns inventory terms: BloodStock, BloodGroup, BloodComponentType, units available, e-RaktKosh sync. Inventory is keyed by the pair (blood group, component type), not by individual unit.

### `notices`

Glossary: `apps/backend/src/modules/notices/GLOSSARY.md`
ADRs: `apps/backend/src/modules/notices/docs/adr/`

Owns publication terms: Notice, NoticeCategory, NoticePriority, publication, expiry, attachment, language. Notices are multilingual via the `language` field and the Bhashini integration.

### `abdm`

Glossary: `apps/backend/src/modules/abdm/GLOSSARY.md`
ADRs: `apps/backend/src/modules/abdm/docs/adr/`

Owns national health interoperability terms: ABHA id, AbhaProfile, CareContext, CareConsent, ConsentArtefact, FhirBundle, ABDM gateway, HI/HIU. This is the context where external-vocabulary drift is most likely — prefer the ABDM/ABDM-R4 spelling over an English paraphrase.

### `portal`

Glossary: `apps/frontend/GLOSSARY.md`
ADRs: `docs/adr/` (system-wide)

Owns cross-cutting portal terms shared across the UI packages: role (patient / doctor / admin / staff), navigation, OPD vs emergency, accessibility obligations, and the language switch. Not the place for scheduling or clinical terms — those belong to the backend contexts above.

## Not yet written

The per-context glossaries and ADR directories don't exist yet. `/domain-modeling` creates them when terms or decisions are actually resolved; don't create empty templates upfront.
