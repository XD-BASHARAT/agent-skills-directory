import { NextResponse } from "next/server"
import { desc, eq, sql, and } from "drizzle-orm"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { skills } from "@/lib/db/schema"

const getSkillsSchema = z.object({
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  status: z.enum(["all", "pending", "approved", "rejected"]).default("all"),
})

async function ensureAdmin() {
  try {
    await requireAdmin()
  } catch {
    throw new Error("Unauthorized")
  }
}

export async function GET(request: Request) {
  try {
    await ensureAdmin()
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const validation = getSkillsSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status") || "all",
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validation.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { page, limit, status } = validation.data
    const offset = (page - 1) * limit

    // Build where conditions
    const conditions: Array<ReturnType<typeof eq>> = []
    if (status && status !== "all") {
      conditions.push(eq(skills.status, status))
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get skills and total count in parallel
    const [skillsList, countResult] = await Promise.all([
      db
        .select()
        .from(skills)
        .where(whereClause)
        .orderBy(desc(skills.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(skills)
        .where(whereClause),
    ])

    const total = Number(countResult[0]?.total ?? 0)

    return NextResponse.json({
      success: true,
      skills: skillsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Failed to get skills:", error)
    return NextResponse.json(
      {
        error: "Failed to get skills",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
