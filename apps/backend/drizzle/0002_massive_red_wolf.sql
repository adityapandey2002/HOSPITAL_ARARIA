DO $$ BEGIN
 CREATE TYPE "public"."FeedbackServiceArea" AS ENUM('OPD', 'EMERGENCY', 'PHARMACY', 'LABORATORY', 'RADIOLOGY', 'BILLING', 'ADMISSION', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."FeedbackStatus" AS ENUM('NEW', 'ACKNOWLEDGED', 'RESOLVED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"departmentId" text NOT NULL,
	"serviceArea" "FeedbackServiceArea" DEFAULT 'OPD' NOT NULL,
	"rating" integer NOT NULL,
	"cleanliness" integer,
	"staffBehaviour" integer,
	"waitTime" integer,
	"comment" text,
	"name" text,
	"phone" text,
	"email" text,
	"status" "FeedbackStatus" DEFAULT 'NEW' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback_viewers" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"departmentId" text NOT NULL,
	"grantedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback" ADD CONSTRAINT "feedback_departmentId_departments_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback_viewers" ADD CONSTRAINT "feedback_viewers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback_viewers" ADD CONSTRAINT "feedback_viewers_departmentId_departments_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback_viewers" ADD CONSTRAINT "feedback_viewers_grantedBy_users_id_fk" FOREIGN KEY ("grantedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_departmentId_idx" ON "feedback" USING btree ("departmentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_status_idx" ON "feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_serviceArea_idx" ON "feedback" USING btree ("serviceArea");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_createdAt_idx" ON "feedback" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "feedback_viewers_userId_departmentId_key" ON "feedback_viewers" USING btree ("userId","departmentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_viewers_userId_idx" ON "feedback_viewers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_viewers_departmentId_idx" ON "feedback_viewers" USING btree ("departmentId");