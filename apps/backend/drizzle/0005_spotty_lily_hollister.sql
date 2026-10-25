CREATE TYPE "public"."ComplaintStatus" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "departmentIds" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "likedMost" text;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "suggestion" text;--> statement-breakpoint
ALTER TABLE "grievances" ADD COLUMN "departmentId" text;--> statement-breakpoint
ALTER TABLE "grievances" ADD COLUMN "complaintStatus" "ComplaintStatus" DEFAULT 'SUBMITTED' NOT NULL;--> statement-breakpoint
ALTER TABLE "grievances" ADD COLUMN "imageUrl" text;--> statement-breakpoint
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_departmentId_departments_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grievances_departmentId_idx" ON "grievances" USING btree ("departmentId");--> statement-breakpoint
CREATE INDEX "grievances_complaintStatus_idx" ON "grievances" USING btree ("complaintStatus");