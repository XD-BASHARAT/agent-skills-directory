import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

import { type CategoryId } from "./registry"
import { mapSkillToCategories } from "./matcher"
import { CATEGORY_CONFIG } from "./config"
import {
  type SkillInput,
  validateApiKey,
  sanitizeCategories,
  buildBatchPrompt,
  withRetry,
  checkRateLimit,
  recordApiRequest,
} from "./shared-utils"

export type { SkillInput as SkillForCategorization }

export type CategoryAssignment = {
  skillId: string
  categoryIds: CategoryId[]
  source: "ai" | "keyword"
}

const CategoryAssignmentSchema = z.object({
  assignments: z.array(
    z.object({
      skillId: z.string(),
      categories: z.array(z.string()).min(1).max(3),
    })
  ),
})

function keywordFallback(skill: SkillInput): CategoryId[] {
  return mapSkillToCategories(
    skill.name,
    skill.description ?? "",
    skill.topics ?? null
  )
}

export type AssignOptions = {
  model?: string
  temperature?: number
  maxBatchSize?: number
  skipRateLimit?: boolean
}

export async function assignCategoriesWithAI(
  skills: SkillInput[],
  opts: AssignOptions = {}
): Promise<CategoryAssignment[]> {
  validateApiKey()

  const {
    model = CATEGORY_CONFIG.MODELS.PRO,
    temperature = 0.1,
    maxBatchSize = CATEGORY_CONFIG.PRO_BATCH_SIZE,
    skipRateLimit = false,
  } = opts

  const results: CategoryAssignment[] = []

  for (let i = 0; i < skills.length; i += maxBatchSize) {
    const chunk = skills.slice(i, i + maxBatchSize)

    if (!skipRateLimit) {
      checkRateLimit()
    }

    try {
      const { object } = await withRetry(
        async () => {
          const result = await generateObject({
            model: google(model),
            schema: CategoryAssignmentSchema,
            temperature,
            prompt: buildBatchPrompt(chunk),
          })
          return result
        },
        {
          onRetry: (attempt, error) => {
            console.warn(
              `[ai-assigner] Retry attempt ${attempt} for batch starting at index ${i}:`,
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
        const aiCats = sanitizeCategories(aiCatsRaw)

        if (aiCats.length > 0) {
          results.push({
            skillId: skill.id,
            categoryIds: aiCats,
            source: "ai",
          })
        } else {
          results.push({
            skillId: skill.id,
            categoryIds: keywordFallback(skill),
            source: "keyword",
          })
        }
      }
    } catch (error) {
      console.error("[ai-assigner] Batch failed after retries, using keyword fallback:", error)

      for (const skill of chunk) {
        results.push({
          skillId: skill.id,
          categoryIds: keywordFallback(skill),
          source: "keyword",
        })
      }
    }
  }

  return results
}

/**
 * Assign categories for a single skill (convenience wrapper)
 */
export async function assignCategoriesForSkill(
  skill: SkillInput,
  opts?: AssignOptions
): Promise<CategoryAssignment> {
  const [result] = await assignCategoriesWithAI([skill], opts)
  return result
}
