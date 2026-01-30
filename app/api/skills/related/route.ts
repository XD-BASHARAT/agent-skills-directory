import { NextRequest, NextResponse } from "next/server"

import { computeRelatedSkills, type RelatedSkillsResult } from "@/lib/skills/related"

/**
 * Scoring-based Related Skills API
 * 
 * Scores are calculated based on:
 * - Topics overlap (highest weight)
 * - Same owner (bonus)
 * - Popularity (stars)
 * - Name similarity
 */

const CACHE_TTL_MS = 60_000
const CACHE_MAX_ENTRIES = 500
const cacheStore = new Map<string, { value: RelatedSkillsResult; expiresAt: number }>()

function getCache(key: string): RelatedSkillsResult | null {
  const entry = cacheStore.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key)
    return null
  }
  cacheStore.delete(key)
  cacheStore.set(key, entry)
  return entry.value
}

function setCache(key: string, value: RelatedSkillsResult) {
  if (cacheStore.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cacheStore.keys().next().value
    if (oldestKey) cacheStore.delete(oldestKey)
  }
  cacheStore.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const skillId = searchParams.get("skillId")
  const limitParam = searchParams.get("limit")
  const limit = Math.min(Math.max(parseInt(limitParam ?? "6", 10), 1), 20)
  const cacheKey = skillId ? `${skillId}:${limit}` : null

  if (!skillId) {
    return NextResponse.json(
      { error: "skillId is required" },
      { status: 400 }
    )
  }

  try {
    const cached = cacheKey ? getCache(cacheKey) : null
    if (cached) {
      return NextResponse.json(
        {
          related: cached.related,
          meta: {
            ...cached.meta,
            cacheKey,
            cacheStatus: "hit",
          },
        },
        {
          headers: {
            "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
          },
        }
      )
    }

    const result = await computeRelatedSkills(skillId, limit)

    if (!result) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      )
    }

    if (cacheKey) {
      setCache(cacheKey, result)
    }

    return NextResponse.json(
      {
        related: result.related,
        meta: {
          ...result.meta,
          cacheKey,
          cacheStatus: "miss",
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    )
  } catch (error) {
    console.error("Failed to get related skills:", error)
    return NextResponse.json(
      { error: "Failed to fetch related skills" },
      { status: 500 }
    )
  }
}
