import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const start = Date.now()
    
    // Test database connection
    await db.execute(sql`SELECT 1`)
    
    const latency = Date.now() - start
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check failed:", error)

    const response: {
      status: "unhealthy"
      database: "disconnected"
      error: string
      timestamp: string
      details?: string
    } = {
      status: "unhealthy",
      database: "disconnected",
      error: "Service unavailable",
      timestamp: new Date().toISOString(),
    }

    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      response.details = error.message
    }

    return NextResponse.json(response, { status: 503 })
  }
}
