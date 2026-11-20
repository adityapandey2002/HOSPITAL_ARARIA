CREATE TYPE "public"."BloodRequestStatus" AS ENUM('PENDING', 'APPROVED', 'FULFILLED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "blood_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"patientName" text NOT NULL,
	"requesterName" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"bloodGroup" "BloodGroup" NOT NULL,
	"componentType" "BloodComponentType" NOT NULL,
	"units" integer NOT NULL,
	"neededBy" timestamp NOT NULL,
	"hospital" text,
	"reason" text,
	"status" "BloodRequestStatus" DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"createdBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blood_requests_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "blood_requests" ADD CONSTRAINT "blood_requests_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blood_requests_status_idx" ON "blood_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blood_requests_createdAt_idx" ON "blood_requests" USING btree ("createdAt");