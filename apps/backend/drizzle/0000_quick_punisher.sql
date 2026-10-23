DO $$ BEGIN
 CREATE TYPE "public"."AppointmentStatus" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."AppointmentType" AS ENUM('OPD', 'TELECONSULTATION', 'EMERGENCY', 'FOLLOW_UP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."BloodComponentType" AS ENUM('WHOLE_BLOOD', 'PACKED_RED_CELLS', 'PLATELETS', 'PLASMA', 'CRYOPRECIPITATE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."BloodGroup" AS ENUM('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."GrievanceCategory" AS ENUM('MEDICAL_NEGLIGENCE', 'STAFF_BEHAVIOR', 'INFRASTRUCTURE', 'BILLING', 'APPOINTMENT', 'MEDICINE_AVAILABILITY', 'CLEANLINESS', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."GrievanceStatus" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."NoticeCategory" AS ENUM('GENERAL', 'RECRUITMENT', 'TENDER', 'PUBLIC_HEALTH', 'SCHEDULE_CHANGE', 'EMERGENCY');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."NoticePriority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."UserRole" AS ENUM('PATIENT', 'DOCTOR', 'ADMIN', 'STAFF');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"patientId" text NOT NULL,
	"doctorId" text NOT NULL,
	"departmentId" text NOT NULL,
	"appointmentDate" timestamp NOT NULL,
	"startTime" text NOT NULL,
	"endTime" text NOT NULL,
	"status" "AppointmentStatus" DEFAULT 'PENDING' NOT NULL,
	"type" "AppointmentType" DEFAULT 'OPD' NOT NULL,
	"reason" text,
	"notes" text,
	"abhaId" text,
	"tokenNumber" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blood_stock" (
	"id" text PRIMARY KEY NOT NULL,
	"bloodGroup" "BloodGroup" NOT NULL,
	"componentType" "BloodComponentType" NOT NULL,
	"unitsAvailable" integer DEFAULT 0 NOT NULL,
	"lastUpdated" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text,
	"imageUrl" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "doctors" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"specialization" text NOT NULL,
	"qualification" text NOT NULL,
	"experience" integer NOT NULL,
	"hprId" text,
	"departmentId" text NOT NULL,
	"consultationFee" real DEFAULT 0 NOT NULL,
	"rating" real DEFAULT 0 NOT NULL,
	"reviewCount" integer DEFAULT 0 NOT NULL,
	"languages" text[] DEFAULT '{"English","Hindi"}'::text[] NOT NULL,
	"bio" text,
	"imageUrl" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "doctors_userId_unique" UNIQUE("userId"),
	CONSTRAINT "doctors_hprId_unique" UNIQUE("hprId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grievances" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"category" "GrievanceCategory" NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" "GrievanceStatus" DEFAULT 'SUBMITTED' NOT NULL,
	"cpgramsId" text,
	"assignedTo" text,
	"resolution" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "grievances_cpgramsId_unique" UNIQUE("cpgramsId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notices" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" "NoticeCategory" DEFAULT 'GENERAL' NOT NULL,
	"priority" "NoticePriority" DEFAULT 'MEDIUM' NOT NULL,
	"publishedAt" timestamp,
	"expiresAt" timestamp,
	"isPublished" boolean DEFAULT false NOT NULL,
	"attachmentUrl" text,
	"language" text DEFAULT 'en' NOT NULL,
	"authorId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "time_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"doctorId" text NOT NULL,
	"dayOfWeek" integer NOT NULL,
	"startTime" text NOT NULL,
	"endTime" text NOT NULL,
	"isAvailable" boolean DEFAULT true NOT NULL,
	"maxAppointments" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"role" "UserRole" DEFAULT 'PATIENT' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"abhaId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_abhaId_unique" UNIQUE("abhaId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_users_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_doctors_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appointments" ADD CONSTRAINT "appointments_departmentId_departments_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "doctors" ADD CONSTRAINT "doctors_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "doctors" ADD CONSTRAINT "doctors_departmentId_departments_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grievances" ADD CONSTRAINT "grievances_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grievances" ADD CONSTRAINT "grievances_assignedTo_users_id_fk" FOREIGN KEY ("assignedTo") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notices" ADD CONSTRAINT "notices_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_doctorId_doctors_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_patientId_idx" ON "appointments" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_doctorId_idx" ON "appointments" USING btree ("doctorId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_departmentId_idx" ON "appointments" USING btree ("departmentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_appointmentDate_idx" ON "appointments" USING btree ("appointmentDate");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_abhaId_idx" ON "appointments" USING btree ("abhaId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "blood_stock_bloodGroup_componentType_key" ON "blood_stock" USING btree ("bloodGroup","componentType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blood_stock_bloodGroup_idx" ON "blood_stock" USING btree ("bloodGroup");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blood_stock_componentType_idx" ON "blood_stock" USING btree ("componentType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "departments_name_idx" ON "departments" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "departments_isActive_idx" ON "departments" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctors_userId_idx" ON "doctors" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctors_departmentId_idx" ON "doctors" USING btree ("departmentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctors_specialization_idx" ON "doctors" USING btree ("specialization");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctors_isActive_idx" ON "doctors" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctors_hprId_idx" ON "doctors" USING btree ("hprId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "grievances_userId_idx" ON "grievances" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "grievances_status_idx" ON "grievances" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "grievances_category_idx" ON "grievances" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "grievances_assignedTo_idx" ON "grievances" USING btree ("assignedTo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "grievances_cpgramsId_idx" ON "grievances" USING btree ("cpgramsId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notices_isPublished_idx" ON "notices" USING btree ("isPublished");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notices_publishedAt_idx" ON "notices" USING btree ("publishedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notices_category_idx" ON "notices" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notices_language_idx" ON "notices" USING btree ("language");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "time_slots_doctorId_dayOfWeek_startTime_key" ON "time_slots" USING btree ("doctorId","dayOfWeek","startTime");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_slots_doctorId_idx" ON "time_slots" USING btree ("doctorId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_slots_dayOfWeek_idx" ON "time_slots" USING btree ("dayOfWeek");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_abhaId_idx" ON "users" USING btree ("abhaId");