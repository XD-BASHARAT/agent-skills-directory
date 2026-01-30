import { NextResponse } from "next/server"
import { getStats } from "@/lib/stats"

export async function GET() {
  try {
    const { total, updatedToday } = await getStats()

    return NextResponse.json(
      { total, updatedToday },
      {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        },
      }
    )
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return NextResponse.json(
      { total: 0, updatedToday: 0 },
      { status: 500 }
    )
  }
}
