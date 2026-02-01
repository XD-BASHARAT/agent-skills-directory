-- Add security scan fields to skills table
ALTER TABLE "skills" ADD COLUMN "security_scan" text;
ALTER TABLE "skills" ADD COLUMN "security_scanned_at" timestamp with time zone;

-- Add index for security scanned at
CREATE INDEX IF NOT EXISTS "skills_security_scanned_at_idx" ON "skills" ("security_scanned_at");
