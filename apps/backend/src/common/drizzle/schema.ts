/**
 * Drizzle schema — citizen-facing tables.
 *
 * IMPORTANT: `prisma/schema.prisma` is the single source of truth for DDL.
 * This file mirrors the *physical* PostgreSQL schema that Prisma migrations
 * create, so Drizzle can query those tables without owning any migrations of
 * its own (`npm run db:migrate` remains Prisma's job).
 *
 * Rules that keep the two in sync (see docs/ARCHITECTURE.md):
 *  - Table names come from Prisma `@@map(...)` → snake_case.
 *  - Column names come from Prisma field names → camelCase.
 *  - Prisma `String`  → `text`, `Int` → `integer`, `Float` → `real`,
 *    `Boolean` → `boolean`, `DateTime` → `timestamp`, `Json` → `jsonb`,
 *    `String[]` → `text[]`.
 *  - Prisma enum type names are used verbatim (`UserRole`, `BloodGroup`, …) so
 *    both clients bind to the same PostgreSQL enum type.
 *  - `@default(cuid())` has no database default, so IDs are generated in the
 *    application with cuid2 (see `createId`).
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
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
// Enums (type names must match Prisma exactly)
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
  }),
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
  }),
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
  }),
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
      t.startTime,
    ),
    doctorIdIdx: index('time_slots_doctorId_idx').on(t.doctorId),
    dayOfWeekIdx: index('time_slots_dayOfWeek_idx').on(t.dayOfWeek),
  }),
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
  }),
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
      t.componentType,
    ),
    bloodGroupIdx: index('blood_stock_bloodGroup_idx').on(t.bloodGroup),
    componentTypeIdx: index('blood_stock_componentType_idx').on(t.componentType),
  }),
);

export const grievances = pgTable(
  'grievances',
  {
    id: text('id').primaryKey(),
    userId: text('userId').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    category: grievanceCategoryEnum('category').notNull(),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    status: grievanceStatusEnum('status').notNull().default('SUBMITTED'),
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
    assignedToIdx: index('grievances_assignedTo_idx').on(t.assignedTo),
    cpgramsIdIdx: index('grievances_cpgramsId_idx').on(t.cpgramsId),
  }),
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
  }),
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