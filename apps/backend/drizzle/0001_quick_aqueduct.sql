DO $$ BEGIN
 CREATE TYPE "public"."ContactMessageStatus" AS ENUM('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" "ContactMessageStatus" DEFAULT 'NEW' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_messages_email_idx" ON "contact_messages" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_messages_status_idx" ON "contact_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_messages_createdAt_idx" ON "contact_messages" USING btree ("createdAt");