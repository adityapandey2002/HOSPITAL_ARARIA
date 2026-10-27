/**
 * Drizzle schema — the 13 application tables owned by Drizzle.
 *
 * This file is the DDL source of truth for these tables: `drizzle-kit generate`
 * diffs it against the database and writes SQL into `drizzle/`. The other five
 * tables (`abha_profiles`, `care_contexts`, `fhir_bundles`, `consent_artefacts`,
 * `audit_logs`) are owned by MikroORM and must never appear here.
 * See docs/adr/0001-dual-orm-table-ownership.md and
 * docs/adr/0002-feedback-table-ownership.md.
 *
 * Conventions:
 *  - Table names are snake_case; column names are camelCase.
 *  - PostgreSQL enum type names are used verbatim (`UserRole`, `BloodGroup`, …)
 *    and the values match `packages/shared` exactly.
 *  - IDs are generated in the application with `newId()` (see `./id`), because
 *    `drizzle-kit` emits no database-side default for them.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums (type names are part of the database contract)
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum('UserRole', ['PATIENT', 'DOCTOR', 'ADMIN', 'STAFF']);

export const appointmentStatusEnum = pgEnum('AppointmentStatus', [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
  'RESCHEDULED',
]);

export const appointmentTypeEnum = pgEnum('AppointmentType', [
  'OPD',
  'TELECONSULTATION',
  'EMERGENCY',
  'FOLLOW_UP',
]);

export const bloodGroupEnum = pgEnum('BloodGroup', [
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
]);

export const bloodComponentTypeEnum = pgEnum('BloodComponentType', [
  'WHOLE_BLOOD',
  'PACKED_RED_CELLS',
  'PLATELETS',
  'PLASMA',
  'CRYOPRECIPITATE',
]);

export const grievanceCategoryEnum = pgEnum('GrievanceCategory', [
  'MEDICAL_NEGLIGENCE',
  'STAFF_BEHAVIOR',
  'INFRASTRUCTURE',
  'BILLING',
  'APPOINTMENT',
  'MEDICINE_AVAILABILITY',
  'CLEANLINESS',
  'OTHER',
]);

export const grievanceStatusEnum = pgEnum('GrievanceStatus', [
  'SUBMITTED',
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
]);

export const noticeCategoryEnum = pgEnum('NoticeCategory', [
  'GENERAL',
  'RECRUITMENT',
  'TENDER',
  'PUBLIC_HEALTH',
  'SCHEDULE_CHANGE',
  'EMERGENCY',
]);

export const noticePriorityEnum = pgEnum('NoticePriority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const contactMessageStatusEnum = pgEnum('ContactMessageStatus', [
  'NEW',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
]);

export const feedbackServiceAreaEnum = pgEnum('FeedbackServiceArea', [
  'OPD',
  'EMERGENCY',
  'PHARMACY',
  'LABORATORY',
  'RADIOLOGY',
  'BILLING',
  'ADMISSION',
  'OTHER',
]);

export const feedbackStatusEnum = pgEnum('FeedbackStatus', ['NEW', 'ACKNOWLEDGED', 'RESOLVED']);

export const complaintStatusEnum = pgEnum('ComplaintStatus', [
  'SUBMITTED',
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    name: text('name').notNull(),
    phone: text('phone').unique(),
    role: userRoleEnum('role').notNull().default('PATIENT'),
    isActive: boolean('isActive').notNull().default(true),
    abhaId: text('abhaId').unique(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index('users_email_idx').on(t.email),
    phoneIdx: index('users_phone_idx').on(t.phone),
    roleIdx: index('users_role_idx').on(t.role),
    abhaIdIdx: index('users_abhaId_idx').on(t.abhaId),
  })
);

export const departments = pgTable(
  'departments',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description').notNull(),
    icon: text('icon'),
    imageUrl: text('imageUrl'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    nameIdx: index('departments_name_idx').on(t.name),
    isActiveIdx: index('departments_isActive_idx').on(t.isActive),
  })
);

export const doctors = pgTable(
  'doctors',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    specialization: text('specialization').notNull(),
    qualification: text('qualification').notNull(),
    experience: integer('experience').notNull(),
    hprId: text('hprId').unique(),
    departmentId: text('departmentId')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict' }),
    consultationFee: real('consultationFee').notNull().default(0),
    rating: real('rating').notNull().default(0),
    reviewCount: integer('reviewCount').notNull().default(0),
    languages: text('languages')
      .array()
      .notNull()
      .default(sql`'{"English","Hindi"}'::text[]`),
    bio: text('bio'),
    imageUrl: text('imageUrl'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('doctors_userId_idx').on(t.userId),
    departmentIdIdx: index('doctors_departmentId_idx').on(t.departmentId),
    specializationIdx: index('doctors_specialization_idx').on(t.specialization),
    isActiveIdx: index('doctors_isActive_idx').on(t.isActive),
    hprIdIdx: index('doctors_hprId_idx').on(t.hprId),
  })
);

export const timeSlots = pgTable(
  'time_slots',
  {
    id: text('id').primaryKey(),
    doctorId: text('doctorId')
      .notNull()
      .references(() => doctors.id, { onDelete: 'cascade' }),
    /** 0–6 (Sunday–Saturday). */
    dayOfWeek: integer('dayOfWeek').notNull(),
    /** `HH:mm`. */
    startTime: text('startTime').notNull(),
    /** `HH:mm`. */
    endTime: text('endTime').notNull(),
    isAvailable: boolean('isAvailable').notNull().default(true),
    maxAppointments: integer('maxAppointments').notNull().default(1),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    doctorDayTimeUnique: uniqueIndex('time_slots_doctorId_dayOfWeek_startTime_key').on(
      t.doctorId,
      t.dayOfWeek,
      t.startTime
    ),
    doctorIdIdx: index('time_slots_doctorId_idx').on(t.doctorId),
    dayOfWeekIdx: index('time_slots_dayOfWeek_idx').on(t.dayOfWeek),
  })
);

export const appointments = pgTable(
  'appointments',
  {
    id: text('id').primaryKey(),
    patientId: text('patientId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    doctorId: text('doctorId')
      .notNull()
      .references(() => doctors.id, { onDelete: 'restrict' }),
    departmentId: text('departmentId')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict' }),
    appointmentDate: timestamp('appointmentDate', { mode: 'date' }).notNull(),
    /** `HH:mm`. */
    startTime: text('startTime').notNull(),
    /** `HH:mm`. */
    endTime: text('endTime').notNull(),
    status: appointmentStatusEnum('status').notNull().default('PENDING'),
    type: appointmentTypeEnum('type').notNull().default('OPD'),
    reason: text('reason'),
    notes: text('notes'),
    abhaId: text('abhaId'),
    tokenNumber: integer('tokenNumber'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    patientIdIdx: index('appointments_patientId_idx').on(t.patientId),
    doctorIdIdx: index('appointments_doctorId_idx').on(t.doctorId),
    departmentIdIdx: index('appointments_departmentId_idx').on(t.departmentId),
    appointmentDateIdx: index('appointments_appointmentDate_idx').on(t.appointmentDate),
    statusIdx: index('appointments_status_idx').on(t.status),
    abhaIdIdx: index('appointments_abhaId_idx').on(t.abhaId),
  })
);

export const bloodStock = pgTable(
  'blood_stock',
  {
    id: text('id').primaryKey(),
    bloodGroup: bloodGroupEnum('bloodGroup').notNull(),
    componentType: bloodComponentTypeEnum('componentType').notNull(),
    unitsAvailable: integer('unitsAvailable').notNull().default(0),
    lastUpdated: timestamp('lastUpdated', { mode: 'date' }).notNull().defaultNow(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    groupComponentUnique: uniqueIndex('blood_stock_bloodGroup_componentType_key').on(
      t.bloodGroup,
      t.componentType
    ),
    bloodGroupIdx: index('blood_stock_bloodGroup_idx').on(t.bloodGroup),
    componentTypeIdx: index('blood_stock_componentType_idx').on(t.componentType),
  })
);

export const grievances = pgTable(
  'grievances',
  {
    id: text('id').primaryKey(),
    userId: text('userId').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    departmentId: text('departmentId').references(() => departments.id, { onDelete: 'set null' }),
    category: grievanceCategoryEnum('category').notNull(),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    status: grievanceStatusEnum('status').notNull().default('SUBMITTED'),
    /** Set only for complaints submitted via the simple complaint form. */
    complaintStatus: complaintStatusEnum('complaintStatus'),
    imageUrl: text('imageUrl'),
    cpgramsId: text('cpgramsId').unique(),
    assignedTo: text('assignedTo').references(() => users.id, { onDelete: 'set null' }),
    resolution: text('resolution'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('grievances_userId_idx').on(t.userId),
    statusIdx: index('grievances_status_idx').on(t.status),
    categoryIdx: index('grievances_category_idx').on(t.category),
    departmentIdIdx: index('grievances_departmentId_idx').on(t.departmentId),
    complaintStatusIdx: index('grievances_complaintStatus_idx').on(t.complaintStatus),
    assignedToIdx: index('grievances_assignedTo_idx').on(t.assignedTo),
    cpgramsIdIdx: index('grievances_cpgramsId_idx').on(t.cpgramsId),
  })
);

export const notices = pgTable(
  'notices',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    category: noticeCategoryEnum('category').notNull().default('GENERAL'),
    priority: noticePriorityEnum('priority').notNull().default('MEDIUM'),
    publishedAt: timestamp('publishedAt', { mode: 'date' }),
    expiresAt: timestamp('expiresAt', { mode: 'date' }),
    isPublished: boolean('isPublished').notNull().default(false),
    attachmentUrl: text('attachmentUrl'),
    language: text('language').notNull().default('en'),
    authorId: text('authorId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    isPublishedIdx: index('notices_isPublished_idx').on(t.isPublished),
    publishedAtIdx: index('notices_publishedAt_idx').on(t.publishedAt),
    categoryIdx: index('notices_category_idx').on(t.category),
    languageIdx: index('notices_language_idx').on(t.language),
  })
);

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    status: contactMessageStatusEnum('status').notNull().default('NEW'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index('contact_messages_email_idx').on(t.email),
    statusIdx: index('contact_messages_status_idx').on(t.status),
    createdAtIdx: index('contact_messages_createdAt_idx').on(t.createdAt),
  })
);

/**
 * Citizen feedback about one department visit.
 *
 * Submitted without authentication from the public link. Contact fields are
 * optional; the response is anonymous unless the citizen chooses to leave them.
 * Reads are restricted to HM (ADMIN) and to users granted access to the
 * department (see `feedbackViewers`).
 */
export const feedback = pgTable(
  'feedback',
  {
    id: text('id').primaryKey(),
    departmentId: text('departmentId')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict' }),
    /** Multiple departments visited (citizen may select more than one). */
    departmentIds: text('departmentIds')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    serviceArea: feedbackServiceAreaEnum('serviceArea').notNull().default('OPD'),
    /** Overall rating, 1 (very poor) to 5 (excellent). */
    rating: integer('rating').notNull(),
    /** Optional criterion ratings, 1–5. */
    cleanliness: integer('cleanliness'),
    staffBehaviour: integer('staffBehaviour'),
    waitTime: integer('waitTime'),
    /** What the citizen liked most about their visit. */
    likedMost: text('likedMost'),
    /** What the citizen wants to suggest. */
    suggestion: text('suggestion'),
    comment: text('comment'),
    name: text('name'),
    phone: text('phone'),
    email: text('email'),
    status: feedbackStatusEnum('status').notNull().default('NEW'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    ratingCheck: check('feedback_rating_check', sql`${t.rating} between 1 and 5`),
    cleanlinessCheck: check(
      'feedback_cleanliness_check',
      sql`${t.cleanliness} is null or ${t.cleanliness} between 1 and 5`
    ),
    staffBehaviourCheck: check(
      'feedback_staff_behaviour_check',
      sql`${t.staffBehaviour} is null or ${t.staffBehaviour} between 1 and 5`
    ),
    waitTimeCheck: check(
      'feedback_wait_time_check',
      sql`${t.waitTime} is null or ${t.waitTime} between 1 and 5`
    ),
    departmentIdIdx: index('feedback_departmentId_idx').on(t.departmentId),
    statusIdx: index('feedback_status_idx').on(t.status),
    serviceAreaIdx: index('feedback_serviceArea_idx').on(t.serviceArea),
    createdAtIdx: index('feedback_createdAt_idx').on(t.createdAt),
  })
);

/**
 * Per-department read access for department heads and nodal officers.
 *
 * ADMIN bypasses this table and sees every department. A user may hold grants
 * for several departments; the pair (userId, departmentId) is unique.
 */
export const feedbackViewers = pgTable(
  'feedback_viewers',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    departmentId: text('departmentId')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    grantedBy: text('grantedBy').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userDepartmentUnique: uniqueIndex('feedback_viewers_userId_departmentId_key').on(
      t.userId,
      t.departmentId
    ),
    userIdIdx: index('feedback_viewers_userId_idx').on(t.userId),
    departmentIdIdx: index('feedback_viewers_departmentId_idx').on(t.departmentId),
  })
);

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type DepartmentRow = typeof departments.$inferSelect;
export type NewDepartmentRow = typeof departments.$inferInsert;
export type DoctorRow = typeof doctors.$inferSelect;
export type NewDoctorRow = typeof doctors.$inferInsert;
export type TimeSlotRow = typeof timeSlots.$inferSelect;
export type NewTimeSlotRow = typeof timeSlots.$inferInsert;
export type AppointmentRow = typeof appointments.$inferSelect;
export type NewAppointmentRow = typeof appointments.$inferInsert;
export type BloodStockRow = typeof bloodStock.$inferSelect;
export type NewBloodStockRow = typeof bloodStock.$inferInsert;
export type GrievanceRow = typeof grievances.$inferSelect;
export type NewGrievanceRow = typeof grievances.$inferInsert;
export type NoticeRow = typeof notices.$inferSelect;
export type NewNoticeRow = typeof notices.$inferInsert;
export type ContactMessageRow = typeof contactMessages.$inferSelect;
export type NewContactMessageRow = typeof contactMessages.$inferInsert;
export type FeedbackRow = typeof feedback.$inferSelect;
export type NewFeedbackRow = typeof feedback.$inferInsert;
export type FeedbackViewerRow = typeof feedbackViewers.$inferSelect;
export type NewFeedbackViewerRow = typeof feedbackViewers.$inferInsert;

/**
 * Per-department complaint access for staff and nodal officers.
 *
 * ADMIN bypasses this table and sees every complaint. A staff member may hold
 * grants for several departments; the pair (userId, departmentId) is unique.
 */
export const complaintViewers = pgTable(
  'complaint_viewers',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    departmentId: text('departmentId')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    grantedBy: text('grantedBy').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userDepartmentUnique: uniqueIndex('complaint_viewers_userId_departmentId_key').on(
      t.userId,
      t.departmentId
    ),
    userIdIdx: index('complaint_viewers_userId_idx').on(t.userId),
    departmentIdIdx: index('complaint_viewers_departmentId_idx').on(t.departmentId),
  })
);

export type ComplaintViewerRow = typeof complaintViewers.$inferSelect;
export type NewComplaintViewerRow = typeof complaintViewers.$inferInsert;

/**
 * Append-only history of complaint status changes.
 *
 * Every transition carries the actor's name as a snapshot (`changedByName`)
 * rather than relying on a join, so the trail still reads correctly after a
 * staff account is renamed or deleted. `changedBy` remains the live link for
 * audit queries; citizens who submit anonymously have no user row and appear
 * only by the name they typed.
 */
export const complaintStatusHistory = pgTable(
  'complaint_status_history',
  {
    id: text('id').primaryKey(),
    complaintId: text('complaintId')
      .notNull()
      .references(() => grievances.id, { onDelete: 'cascade' }),
    /** Null for the first entry, which records the submission itself. */
    fromStatus: complaintStatusEnum('fromStatus'),
    toStatus: complaintStatusEnum('toStatus').notNull(),
    /** Resolution note attached to this transition, when one was given. */
    resolution: text('resolution'),
    changedBy: text('changedBy').references(() => users.id, { onDelete: 'set null' }),
    /** Snapshot of the actor's display name at the time of the change. */
    changedByName: text('changedByName').notNull(),
    /** ADMIN or STAFF for internal changes; null for a citizen submission. */
    changedByRole: userRoleEnum('changedByRole'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    complaintIdIdx: index('complaint_status_history_complaintId_idx').on(t.complaintId),
    createdAtIdx: index('complaint_status_history_createdAt_idx').on(t.createdAt),
    changedByIdx: index('complaint_status_history_changedBy_idx').on(t.changedBy),
  })
);

export type ComplaintStatusHistoryRow = typeof complaintStatusHistory.$inferSelect;
export type NewComplaintStatusHistoryRow = typeof complaintStatusHistory.$inferInsert;

/**
 * Homepage slideshow images managed by admins. `url` may be an uploaded asset
 * path or an external image link. `sortOrder` controls display order; `isActive`
 * toggles visibility without deleting.
 */
export const slideshowImages = pgTable(
  'slideshow_images',
  {
    id: text('id').primaryKey(),
    url: text('url').notNull(),
    alt: text('alt'),
    caption: text('caption'),
    sortOrder: integer('sortOrder').notNull().default(0),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    sortOrderIdx: index('slideshow_images_sortOrder_idx').on(t.sortOrder),
    isActiveIdx: index('slideshow_images_isActive_idx').on(t.isActive),
  })
);

export type SlideshowImageRow = typeof slideshowImages.$inferSelect;
export type NewSlideshowImageRow = typeof slideshowImages.$inferInsert;

/**
 * Hospital-wide quality initiatives (NQAS, KAYAKALP, MUSQAN) launched by
 * admins. `type` is one of the supported initiative kinds.
 */
export const qualityEvents = pgTable(
  'quality_events',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    startDate: timestamp('startDate', { mode: 'date' }).notNull().defaultNow(),
    endDate: timestamp('endDate', { mode: 'date' }),
    isActive: boolean('isActive').notNull().default(true),
    isArchived: boolean('isArchived').notNull().default(false),
    createdBy: text('createdBy').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    typeIdx: index('quality_events_type_idx').on(t.type),
    isActiveIdx: index('quality_events_isActive_idx').on(t.isActive),
  })
);

export type QualityEventRow = typeof qualityEvents.$inferSelect;
export type NewQualityEventRow = typeof qualityEvents.$inferInsert;

/**
 * Per-department tasks generated when an event is launched. In-charges mark
 * `isCompleted`; `completedBy`/`completedAt` record who and when.
 */
export const qualityEventTasks = pgTable(
  'quality_event_tasks',
  {
    id: text('id').primaryKey(),
    eventId: text('eventId')
      .notNull()
      .references(() => qualityEvents.id, { onDelete: 'cascade' }),
    departmentId: text('departmentId')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    isCompleted: boolean('isCompleted').notNull().default(false),
    completedBy: text('completedBy').references(() => users.id, { onDelete: 'set null' }),
    completedAt: timestamp('completedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    eventIdx: index('quality_event_tasks_eventId_idx').on(t.eventId),
    departmentIdx: index('quality_event_tasks_departmentId_idx').on(t.departmentId),
    completedIdx: index('quality_event_tasks_isCompleted_idx').on(t.isCompleted),
  })
);

export type QualityEventTaskRow = typeof qualityEventTasks.$inferSelect;
export type NewQualityEventTaskRow = typeof qualityEventTasks.$inferInsert;
