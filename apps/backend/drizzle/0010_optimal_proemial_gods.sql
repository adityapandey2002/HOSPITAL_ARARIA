CREATE TABLE "quality_event_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"eventId" text NOT NULL,
	"departmentId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"completedBy" text,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"startDate" timestamp DEFAULT now() NOT NULL,
	"endDate" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"createdBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quality_event_tasks" ADD CONSTRAINT "quality_event_tasks_eventId_quality_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."quality_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_event_tasks" ADD CONSTRAINT "quality_event_tasks_departmentId_departments_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_event_tasks" ADD CONSTRAINT "quality_event_tasks_completedBy_users_id_fk" FOREIGN KEY ("completedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quality_event_tasks_eventId_idx" ON "quality_event_tasks" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "quality_event_tasks_departmentId_idx" ON "quality_event_tasks" USING btree ("departmentId");--> statement-breakpoint
CREATE INDEX "quality_event_tasks_isCompleted_idx" ON "quality_event_tasks" USING btree ("isCompleted");--> statement-breakpoint
CREATE INDEX "quality_events_type_idx" ON "quality_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "quality_events_isActive_idx" ON "quality_events" USING btree ("isActive");