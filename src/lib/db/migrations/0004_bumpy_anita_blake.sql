ALTER TABLE "repositories" ADD COLUMN "syncing_at" timestamp;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "last_scanned_at" timestamp;