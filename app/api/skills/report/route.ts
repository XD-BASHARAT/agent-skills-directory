import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

import { db, skillReports } from "@/lib/db"
import { reportRateLimit, getClientIdentifier } from "@/lib/rate-limit"

const REPORT_REASONS = [
  "spam",
  "malicious",
  "copyright",
  "inappropriate",
  "broken",
  "other",
] as const

export async function POST(request: Request) {
  try {
    // Rate limit: 5 reports per hour per IP
    const identifier = getClientIdentifier(request)
    const { success, remaining } = await reportRateLimit.limit(identifier)
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many reports. Please try again later." },
        { 
          status: 429,
          headers: { "X-RateLimit-Remaining": remaining.toString() }
        }
      )
    }

    const body = await request.json()
    const { skillId, reason, description, reporterEmail } = body

    if (!skillId || typeof skillId !== "string") {
      return NextResponse.json(
        { error: "Skill ID is required" },
        { status: 400 }
      )
    }

    if (!reason || !REPORT_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "Valid reason is required" },
        { status: 400 }
      )
    }

    await db.insert(skillReports).values({
      id: nanoid(),
      skillId,
      reason,
      description: description || null,
      reporterEmail: reporterEmail || null,
      status: "pending",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to submit report:", error)
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    )
  }
}
