import "server-only"

import { and, gte, ne, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { skills } from "@/lib/db/schema"
import { withServerCache } from "@/lib/server-cache"

type StatsResult = {
  total: number
  updatedToday: number
}

async function getStats(): Promise<StatsResult> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cacheKey = `stats:${today.toISOString().slice(0, 10)}`
  return withServerCache(cacheKey, 60_000, async () => {
    // Count distinct owner/slug combinations (same as getSkills)
    const [totalResult, todayResult] = await Promise.all([
      db
        .select({ 
          count: sql<number>`count(distinct ${sql`${skills.owner} || '/' || ${skills.slug}`})` 
        })
        .from(skills)
        .where(ne(skills.status, "rejected")),
      db
        .select({ 
          count: sql<number>`count(distinct ${sql`${skills.owner} || '/' || ${skills.slug}`})` 
        })
        .from(skills)
        .where(
          and(
            ne(skills.status, "rejected"),
            gte(skills.indexedAt, today)
          )
        ),
    ])

    return {
      total: Number(totalResult[0]?.count ?? 0),
      updatedToday: Number(todayResult[0]?.count ?? 0),
    }
  })
}

export { getStats, type StatsResult }
