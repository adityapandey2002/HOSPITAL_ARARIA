CREATE TABLE "complaint_viewers" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"departmentId" text NOT NULL,
	"grantedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "complaint_viewers" ADD CONSTRAINT "complaint_viewers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaint_viewers" ADD CONSTRAINT "complaint_viewers_departmentId_departments_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaint_viewers" ADD CONSTRAINT "complaint_viewers_grantedBy_users_id_fk" FOREIGN KEY ("grantedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "complaint_viewers_userId_departmentId_key" ON "complaint_viewers" USING btree ("userId","departmentId");--> statement-breakpoint
CREATE INDEX "complaint_viewers_userId_idx" ON "complaint_viewers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "complaint_viewers_departmentId_idx" ON "complaint_viewers" USING btree ("departmentId");