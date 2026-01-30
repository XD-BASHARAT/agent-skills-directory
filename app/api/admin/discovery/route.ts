import { NextResponse } from "next/server"
import { inngest } from "@/lib/inngest/client"
import { getRecentSyncJobs, getLastDiscoveryDate } from "@/lib/db/queries"
import { requireAdmin } from "@/lib/auth"

/**
 * POST /api/admin/discovery
 * Trigger manual skill discovery from GitHub
 * 
 * Body:
 * - resetWatermark?: boolean - Reset to discover from SKILLS_LAUNCH_DATE
 */
export async function POST(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { resetWatermark } = body as { resetWatermark?: boolean }

    await inngest.send({
      name: "discovery/trigger",
      data: { resetWatermark },
    })

    return NextResponse.json({
      success: true,
      message: resetWatermark
        ? "Discovery triggered with watermark reset"
        : "Discovery triggered",
    })
  } catch (error) {
    console.error("Failed to trigger discovery:", error)
    return NextResponse.json({ error: "Failed to trigger discovery" }, { status: 500 })
  }
}

/**
 * GET /api/admin/discovery
 * Get discovery status and recent jobs
 */
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [jobs, lastDiscovery] = await Promise.all([
      getRecentSyncJobs(10),
      getLastDiscoveryDate(),
    ])

    const discoveryJobs = jobs.filter((j) => j.type === "discovery")

    return NextResponse.json({
      lastDiscoveryDate: lastDiscovery?.toISOString() ?? null,
      recentJobs: discoveryJobs,
    })
  } catch (error) {
    console.error("Failed to get discovery status:", error)
    return NextResponse.json({ error: "Failed to get discovery status" }, { status: 500 })
  }
}
