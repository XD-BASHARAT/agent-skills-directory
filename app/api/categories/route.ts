import { NextResponse } from "next/server"
import { getCategories } from "@/lib/db/queries"
import { withServerCache } from "@/lib/server-cache"

export async function GET() {
  try {
    const categories = await withServerCache("categories", 300_000, getCategories)

    return NextResponse.json({ categories }, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=3600",
      },
    })
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}
