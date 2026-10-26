CREATE TABLE "complaint_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"complaintId" text NOT NULL,
	"fromStatus" "ComplaintStatus",
	"toStatus" "ComplaintStatus" NOT NULL,
	"resolution" text,
	"changedBy" text,
	"changedByName" text NOT NULL,
	"changedByRole" "UserRole",
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "complaint_status_history" ADD CONSTRAINT "complaint_status_history_complaintId_grievances_id_fk" FOREIGN KEY ("complaintId") REFERENCES "public"."grievances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaint_status_history" ADD CONSTRAINT "complaint_status_history_changedBy_users_id_fk" FOREIGN KEY ("changedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "complaint_status_history_complaintId_idx" ON "complaint_status_history" USING btree ("complaintId");--> statement-breakpoint
CREATE INDEX "complaint_status_history_createdAt_idx" ON "complaint_status_history" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "complaint_status_history_changedBy_idx" ON "complaint_status_history" USING btree ("changedBy");