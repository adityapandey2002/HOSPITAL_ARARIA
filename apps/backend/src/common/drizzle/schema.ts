// Drizzle Schema - Citizen-Facing Tables
// Mirrors Prisma schema exactly for citizen-facing tables
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  primaryKey,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['PATIENT', 'DOCTOR', 'ADMIN', 'STAFF']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED']);
export const appointmentTypeEnum = pgEnum('appointment_type', ['OPD', 'TELECONSULTATION', 'EMERGENCY', 'FOLLOW_UP']);
export const bloodGroupEnum = pgEnum('blood_group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
export const bloodComponentTypeEnum = pgEnum('blood_component_type', ['WHOLE_BLOOD', 'PACKED_RED_CELLS', 'PLATELETS', 'PLASMA', 'CRYOPRECIPITATE']);
export const grievanceCategoryEnum = pgEnum('grievance_category', ['MEDICAL_NEGLIGENCE', 'STAFF_BEHAVIOR', 'INFRASTRUCTURE', 'BILLING', 'APPOINTMENT', 'MEDICINE_AVAILABILITY', 'CLEANLINESS', 'OTHER']);
export const grievanceStatusEnum = pgEnum('grievance_status', ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']);
export const noticeCategoryEnum = pgEnum('notice_category', ['GENERAL', 'RECRUITMENT', 'TENDER', 'PUBLIC_HEALTH', 'SCHEDULE_CHANGE', 'EMERGENCY']);
export const noticePriorityEnum = pgEnum('notice_priority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

// Tables
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).unique(),
  role: userRoleEnum('role').default('PATIENT').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  abhaId: varchar('abha_id', { length: 50 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  phoneIdx: index('users_phone_idx').on(table.phone),
  roleIdx: index('users_role_idx').on(table.role),
  abhaIdIdx: index('users_abha_id_idx').on(table.abhaId),
}));

export const doctors = pgTable('doctors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').unique().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  specialization: varchar('specialization', { length: 255 }).notNull(),
  qualification: varchar('qualification', { length: 500 }).notNull(),
  experience: integer('experience').notNull(),
  hprId: varchar('hpr_id', { length: 50 }).unique(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'restrict' }).notNull(),
  consultationFee: integer('consultation_fee').default(0).notNull(),
  rating: integer('rating').default(0).notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  languages: text('languages').array().default(sql`'{"English", "Hindi"}'`).notNull(),
  bio: text('bio'),
  imageUrl: varchar('image_url', { length: 500 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('doctors_user_id_idx').on(table.userId),
  departmentIdIdx: index('doctors_department_id_idx').on(table.departmentId),
  specializationIdx: index('doctors_specialization_idx').on(table.specialization),
  isActiveIdx: index('doctors_is_active_idx').on(table.isActive),
  hprIdIdx: index('doctors_hpr_id_idx').on(table.hprId),
}));

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 100 }),
  imageUrl: varchar('image_url', { length: 500 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('departments_name_idx').on(table.name),
  isActiveIdx: index('departments_is_active_idx').on(table.isActive),
}));

export const timeSlots = pgTable('time_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  doctorId: uuid('doctor_id').references(() => doctors.id, { onDelete: 'cascade' }).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar('start_time', { length: 5 }).notNull(), // HH:mm format
  endTime: varchar('end_time', { length: 5 }).notNull(), // HH:mm format
  isAvailable: boolean('is_available').default(true).notNull(),
  maxAppointments: integer('max_appointments').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  doctorDayTimeUnique: uniqueIndex('time_slots_doctor_day_time_unique').on(table.doctorId, table.dayOfWeek, table.startTime),
  doctorIdIdx: index('time_slots_doctor_id_idx').on(table.doctorId),
  dayOfWeekIdx: index('time_slots_day_of_week_idx').on(table.dayOfWeek),
}));

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  doctorId: uuid('doctor_id').references(() => doctors.id, { onDelete: 'restrict' }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'restrict' }).notNull(),
  appointmentDate: timestamp('appointment_date').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  status: appointmentStatusEnum('status').default('PENDING').notNull(),
  type: appointmentTypeEnum('type').default('OPD').notNull(),
  reason: text('reason'),
  notes: text('notes'),
  abhaId: varchar('abha_id', { length: 50 }),
  tokenNumber: integer('token_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  patientIdIdx: index('appointments_patient_id_idx').on(table.patientId),
  doctorIdIdx: index('appointments_doctor_id_idx').on(table.doctorId),
  departmentIdIdx: index('appointments_department_id_idx').on(table.departmentId),
  appointmentDateIdx: index('appointments_appointment_date_idx').on(table.appointmentDate),
  statusIdx: index('appointments_status_idx').on(table.status),
  abhaIdIdx: index('appointments_abha_id_idx').on(table.abhaId),
}));

export const bloodStock = pgTable('blood_stock', {
  id: uuid('id').primaryKey().defaultRandom(),
  bloodGroup: bloodGroupEnum('blood_group').notNull(),
  componentType: bloodComponentTypeEnum('component_type').notNull(),
  unitsAvailable: integer('units_available').default(0).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  bloodGroupComponentUnique: uniqueIndex('blood_stock_blood_group_component_unique').on(table.bloodGroup, table.componentType),
  bloodGroupIdx: index('blood_stock_blood_group_idx').on(table.bloodGroup),
  componentTypeIdx: index('blood_stock_component_type_idx').on(table.componentType),
}));

export const grievances = pgTable('grievances', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  category: grievanceCategoryEnum('category').notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  description: text('description').notNull(),
  status: grievanceStatusEnum('status').default('SUBMITTED').notNull(),
  cpgramsId: varchar('cpgrams_id', { length: 100 }).unique(),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('grievances_user_id_idx').on(table.userId),
  statusIdx: index('grievances_status_idx').on(table.status),
  categoryIdx: index('grievances_category_idx').on(table.category),
  assignedToIdx: index('grievances_assigned_to_idx').on(table.assignedTo),
  cpgramsIdIdx: index('grievances_cpgrams_id_idx').on(table.cpgramsId),
}));

export const notices = pgTable('notices', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  category: noticeCategoryEnum('category').default('GENERAL').notNull(),
  priority: noticePriorityEnum('priority').default('MEDIUM').notNull(),
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'),
  isPublished: boolean('is_published').default(false).notNull(),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  language: varchar('language', { length: 10 }).default('en').notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  isPublishedIdx: index('notices_is_published_idx').on(table.isPublished),
  publishedAtIdx: index('notices_published_at_idx').on(table.publishedAt),
  categoryIdx: index('notices_category_idx').on(table.category),
  languageIdx: index('notices_language_idx').on(table.language),
}));

// Type exports for TypeScript inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Doctor = typeof doctors.$inferSelect;
export type NewDoctor = typeof doctors.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type NewTimeSlot = typeof timeSlots.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type BloodStock = typeof bloodStock.$inferSelect;
export type NewBloodStock = typeof bloodStock.$inferInsert;
export type Grievance = typeof grievances.$inferSelect;
export type NewGrievance = typeof grievances.$inferInsert;
export type Notice = typeof notices.$inferSelect;
export type NewNotice = typeof notices.$inferInsert;