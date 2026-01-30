/**
 * Vercel AI SDK integration with Google Gemini
 * Single skill classification with structured output
 */

import { generateText } from "ai"

import { CATEGORIES } from "@/lib/categories/registry"
import { CATEGORY_CONFIG } from "@/lib/categories/config"
import {
  validateApiKey,
  sanitizePromptInput,
  withRetry,
  checkRateLimit,
  recordApiRequest,
} from "@/lib/categories/shared-utils"

const CATEGORY_PROMPT = CATEGORIES.map(
  (category) => `- ${category.slug}: ${category.name} — ${category.description}`
).join("\n")

export type GeminiCategoryClassification = {
  categories: string[]
  confidence: number
  raw: string
}

export type ClassifyParams = {
  name: string
  description: string
  topics?: string[]
  skipRateLimit?: boolean
}

export async function classifySkillWithGemini(
  params: ClassifyParams
): Promise<GeminiCategoryClassification> {
  validateApiKey()

  if (!params.skipRateLimit) {
    checkRateLimit()
  }

  const sanitizedName = sanitizePromptInput(params.name, 200)
  const sanitizedDesc = sanitizePromptInput(
    params.description,
    CATEGORY_CONFIG.MAX_DESCRIPTION_LENGTH
  )
  const topics = params.topics?.filter(Boolean).join(", ") ?? "none"

  const prompt = `
You are an expert skill classifier that maps AI coding skills into a fixed set of categories.
Return a JSON object with the following shape:
{
  "categories": ["slug", ...],   // at least one slug from the list below (use canonical slugs)
  "confidence": 0.0             // value between 0 and 1 describing how confident you are
}

Skills:
- Name: "${sanitizedName}"
- Description: """${sanitizedDesc}"""
- Topics: ${topics}

Available categories:
${CATEGORY_PROMPT}

Rules:
1. Only use the slugs provided above.
2. If you are not confident enough to assign any category, return an empty "categories" array but still return a confidence value.
3. Respond with only valid JSON (no surrounding markdown or commentary).
4. Stop after providing the JSON object.
`

  try {
    const response = await withRetry(
      async () => {
        const result = await generateText({
          model: "vercel:google/gemini-2.5-pro",
          prompt,
          temperature: 0.2,
          maxOutputTokens: 400,
        })
        return result
      },
      {
        onRetry: (attempt, error) => {
          console.warn(
            `[vercel-gemini] Retry attempt ${attempt}:`,
            error.message
          )
        },
      }
    )

    recordApiRequest()

    const raw = response.toString().trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return { categories: [], confidence: 0, raw }
    }

    const parsed = JSON.parse(jsonMatch[0])
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.filter((item: unknown) => typeof item === "string")
      : []
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0

    return { categories, confidence, raw }
  } catch (error) {
    console.error("[vercel-gemini] Classification failed:", error)
    return { categories: [], confidence: 0, raw: "" }
  }
}
