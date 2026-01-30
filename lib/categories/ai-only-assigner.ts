import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

import { type CategoryId } from "./registry"
import { CATEGORY_CONFIG } from "./config"
import {
  type SkillInput,
  validateApiKey,
  sanitizeCategories,
  buildBatchPrompt,
  createCacheKey,
  withRetry,
  checkRateLimit,
  recordApiRequest,
} from "./shared-utils"

export type { SkillInput }

export type AIOnlyResult = {
  skillId: string
  categoryIds: CategoryId[]
  source: "ai" | "cache"
}

const AIResponseSchema = z.object({
  assignments: z.array(
    z.object({
      skillId: z.string(),
      categories: z.array(z.string()).min(1).max(3),
    })
  ),
})

const inMemoryCache = new Map<string, CategoryId[]>()

export type AIOnlyOptions = {
  model?: string
  temperature?: number
  maxBatchSize?: number
  useCache?: boolean
  skipRateLimit?: boolean
}

export async function assignCategoriesAIOnly(
  skills: SkillInput[],
  opts: AIOnlyOptions = {}
): Promise<AIOnlyResult[]> {
  validateApiKey()

  const {
    model = process.env.GEMINI_MODEL ?? CATEGORY_CONFIG.MODELS.DEFAULT,
    temperature = 0.2,
    maxBatchSize = CATEGORY_CONFIG.MAX_BATCH_SIZE,
    useCache = true,
    skipRateLimit = false,
  } = opts

  const results: AIOnlyResult[] = []
  const needsAI: SkillInput[] = []

  for (const skill of skills) {
    if (useCache) {
      const cacheKey = createCacheKey(skill)
      const cached = inMemoryCache.get(cacheKey)
      if (cached && cached.length > 0) {
        results.push({
          skillId: skill.id,
          categoryIds: cached,
          source: "cache",
        })
        continue
      }
    }
    needsAI.push(skill)
  }

  if (needsAI.length === 0) {
    return results
  }

  for (let i = 0; i < needsAI.length; i += maxBatchSize) {
    const chunk = needsAI.slice(i, i + maxBatchSize)

    if (!skipRateLimit) {
      checkRateLimit()
    }

    try {
      const { object } = await withRetry(
        async () => {
          const result = await generateObject({
            model: google(model),
            schema: AIResponseSchema,
            temperature,
            prompt: buildBatchPrompt(chunk),
          })
          return result
        },
        {
          onRetry: (attempt, error) => {
            console.warn(
              `[ai-only-assigner] Retry attempt ${attempt} for batch starting at index ${i}:`,
              error.message
            )
          },
        }
      )

      recordApiRequest()

      const byId = new Map(
        object.assignments.map((a) => [a.skillId, a.categories])
      )

      for (const skill of chunk) {
        const aiCatsRaw = byId.get(skill.id) ?? []
        const categoryIds = sanitizeCategories(aiCatsRaw)

        results.push({
          skillId: skill.id,
          categoryIds,
          source: "ai",
        })

        if (useCache && categoryIds.length > 0) {
          inMemoryCache.set(createCacheKey(skill), categoryIds)
        }
      }
    } catch (error) {
      console.error("[ai-only-assigner] AI batch failed after retries:", error)

      for (const skill of chunk) {
        results.push({
          skillId: skill.id,
          categoryIds: [],
          source: "ai",
        })
      }
    }
  }

  return results
}

export function clearCategoryCache(): void {
  inMemoryCache.clear()
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: inMemoryCache.size,
    keys: Array.from(inMemoryCache.keys()).slice(0, 10),
  }
}

export {
  assignCategoriesAIOnly as assignCategoriesHybrid,
  type AIOnlyResult as HybridResult,
  type AIOnlyOptions as HybridOptions,
}
