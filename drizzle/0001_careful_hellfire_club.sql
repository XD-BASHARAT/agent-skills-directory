ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "security_scan" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "security_scanned_at" timestamp with time zone;
