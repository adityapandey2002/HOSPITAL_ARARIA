CREATE TABLE "slideshow_images" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"alt" text,
	"caption" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "slideshow_images_sortOrder_idx" ON "slideshow_images" USING btree ("sortOrder");--> statement-breakpoint
CREATE INDEX "slideshow_images_isActive_idx" ON "slideshow_images" USING btree ("isActive");