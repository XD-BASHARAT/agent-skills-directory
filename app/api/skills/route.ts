import { NextResponse } from "next/server"
import { getSkills } from "@/lib/db/queries"
import { withServerCache, invalidateCache } from "@/lib/server-cache"
import { apiRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { requireAdmin } from "@/lib/auth"
import { cacheInvalidationSchema } from "@/lib/validators/skills"

type SortBy = "stars_desc" | "name_asc" | "name_desc" | "recent" | "last_commit"

function normalizeSort(value: string | null): SortBy {
  const normalized = value?.toLowerCase()
  if (!normalized) return "recent"
  if (normalized === "name" || normalized === "name_asc" || normalized === "a-z" || normalized === "az") {
    return "name_asc"
  }
  if (normalized === "name_desc" || normalized === "z-a" || normalized === "za" || normalized === "z-aa") {
    return "name_desc"
  }
  if (normalized === "stars" || normalized === "stars_desc" || normalized === "most_star" || normalized === "most_stars") {
    return "stars_desc"
  }
  if (normalized === "recent" || normalized === "recently_added" || normalized === "newest") {
    return "recent"
  }
  if (normalized === "last_commit" || normalized === "commit" || normalized === "repo_updated") {
    return "last_commit"
  }
  return "recent"
}

function formatValidationIssues(
  issues: Array<{ path: Array<string | number | symbol>; message: string }>
) {
  return issues
    .map((issue) => {
      const path =
        issue.path.length > 0 ? issue.path.map((segment) => String(segment)).join(".") : "request"
      return `${path}: ${issue.message}`
    })
    .join(", ")
}

export async function GET(request: Request) {
  // Rate limiting
  const identifier = getClientIdentifier(request)
  const { success } = await apiRateLimit.limit(identifier)
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests", details: "Please try again later" },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const page = parseInt(searchParams.get("page") || "1", 10)
  // Support both perPage (preferred) and per_page (legacy) for backwards compatibility
  const perPage = parseInt(searchParams.get("perPage") || searchParams.get("per_page") || "30", 10)
  const status = searchParams.get("status")
  const sortBy = normalizeSort(searchParams.get("sort"))
  const category = searchParams.get("category")
  const categories = searchParams.get("categories")
  const categoryList = categories ? categories.split(",").map((s) => s.trim()).filter(Boolean) : undefined
  const idsParam = searchParams.get("ids")
  const ids = idsParam ? idsParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined
  const normalizedIds = ids?.length ? Array.from(new Set(ids)).sort() : undefined
  const normalizedCategoryList = categoryList?.length
    ? [...categoryList].sort()
    : undefined

  // Validate inputs
  if (!Number.isFinite(page) || page < 1 || page > 10000) {
    return NextResponse.json(
      { error: "Invalid page number", details: "Page must be between 1 and 10000" },
      { status: 400 }
    )
  }

  if (!Number.isFinite(perPage) || perPage < 1 || perPage > 100) {
    return NextResponse.json(
      { error: "Invalid perPage value", details: "perPage must be between 1 and 100" },
      { status: 400 }
    )
  }

  if (query.length > 200) {
    return NextResponse.json(
      { error: "Query too long", details: "Search query must be less than 200 characters" },
      { status: 400 }
    )
  }

  if (normalizedIds && normalizedIds.length > 500) {
    return NextResponse.json(
      { error: "Too many IDs", details: "ids must contain 500 or fewer items" },
      { status: 400 }
    )
  }

  try {
    const cacheKey = [
      "skills",
      query,
      page,
      perPage,
      status ?? "",
      sortBy,
      category ?? "",
      normalizedCategoryList?.join(",") ?? "",
      normalizedIds?.join(",") ?? "",
    ].join("|")

    const result = await withServerCache(cacheKey, 60_000, () =>
      getSkills({
        query,
        page,
        perPage,
        status: status || undefined,
        sortBy,
        category: category || undefined,
        categoryList: normalizedCategoryList,
        ids: normalizedIds,
      })
    )

    // Cache for 5 minutes, stale-while-revalidate for 1 hour, CDN cache for 1 hour
    const headers: HeadersInit = {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      "CDN-Cache-Control": "public, max-age=3600",
    }
    // Only include debug header in development
    if (process.env.NODE_ENV !== "production") {
      headers["X-Cache-Key"] = cacheKey
    }
    return NextResponse.json(result, { headers })
  } catch (error) {
    console.error("Failed to fetch skills:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    
    // Check for specific PostgreSQL errors
    if (message.includes("syntax error") || message.includes("tsquery")) {
      return NextResponse.json(
        { error: "Invalid search query", details: "Please try a different search term" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    )
  }
}

// Add POST method for cache invalidation (admin only)
export async function POST(request: Request) {
  // Auth check - only allow authenticated admin users
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const validation = cacheInvalidationSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request", details: formatValidationIssues(validation.error.issues) },
      { status: 400 }
    )
  }

  try {
    const { action, pattern } = validation.data
    
    if (action === "invalidate") {
      invalidateCache(pattern)
      return NextResponse.json({ success: true, message: "Cache invalidated" })
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Cache invalidation error:", error)
    return NextResponse.json({ error: "Failed to invalidate cache" }, { status: 500 })
  }
}
