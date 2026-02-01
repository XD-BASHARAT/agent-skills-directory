#!/usr/bin/env bun
import { config } from "dotenv"
import postgres from "postgres"

config({ path: ".env.local" })

const sql = postgres(process.env.DATABASE_URL!, {
  max: 1,
})

async function applyMigration() {
  console.log("🔄 Applying security scan migration...")

  try {
    // Check if columns already exist
    const checkResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'skills' 
      AND column_name IN ('security_scan', 'security_scanned_at')
    `

    if (checkResult.length === 2) {
      console.log("✅ Columns already exist, skipping migration")
      await sql.end()
      return
    }

    // Add security_scan column
    if (!checkResult.find(r => r.column_name === 'security_scan')) {
      console.log("   Adding security_scan column...")
      await sql`ALTER TABLE "skills" ADD COLUMN "security_scan" text`
      console.log("   ✓ security_scan added")
    }

    // Add security_scanned_at column
    if (!checkResult.find(r => r.column_name === 'security_scanned_at')) {
      console.log("   Adding security_scanned_at column...")
      await sql`ALTER TABLE "skills" ADD COLUMN "security_scanned_at" timestamp with time zone`
      console.log("   ✓ security_scanned_at added")
    }

    // Add index
    console.log("   Creating index...")
    await sql`
      CREATE INDEX IF NOT EXISTS "skills_security_scanned_at_idx" 
      ON "skills" ("security_scanned_at")
    `
    console.log("   ✓ Index created")

    console.log("✅ Migration completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  } finally {
    await sql.end()
  }
}

applyMigration()
