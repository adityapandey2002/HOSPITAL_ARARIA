ALTER TABLE "grievances" ALTER COLUMN "complaintStatus" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "grievances" ALTER COLUMN "complaintStatus" DROP NOT NULL;