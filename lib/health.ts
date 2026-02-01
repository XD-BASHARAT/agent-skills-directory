import "server-only"

import { sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { withServerCache } from "@/lib/server-cache"

type HealthStatus = {
  status: "healthy" | "unhealthy"
  latencyMs?: number
}

async function getHealthStatus(): Promise<HealthStatus> {
  return withServerCache("health:db", 30_000, async () => {
    const start = Date.now()

    try {
      await db.execute(sql`SELECT 1`)
      return { status: "healthy", latencyMs: Date.now() - start }
    } catch (error) {
      console.error("Health status check failed:", error)
      return { status: "unhealthy" }
    }
  })
}

export { getHealthStatus, type HealthStatus }
