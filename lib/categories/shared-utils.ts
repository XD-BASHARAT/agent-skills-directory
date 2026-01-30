/**
 * Shared Utilities for Category Assignment
 * Common functions used by both AI and hybrid assigners
 */

import { getCategoriesSorted, getAllCategoryIds, type CategoryId } from "./registry"
import { CATEGORY_CONFIG } from "./config"

const allowedCategoryIds = new Set<string>(getAllCategoryIds())

export type SkillInput = {
  id: string
  name: string
  description: string | null
  topics?: string[] | null
}

export function validateApiKey(): void {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is not configured. " +
      "Please set it in your environment variables."
    )
  }
}

export function sanitizePromptInput(text: string, maxLength: number): string {
  return text
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, maxLength)
}

export function sanitizeCategories(raw: string[]): CategoryId[] {
  const unique = Array.from(new Set(raw.map((s) => s.trim().toLowerCase())))
  const filtered = unique.filter((id) => allowedCategoryIds.has(id)) as CategoryId[]
  return filtered.slice(0, CATEGORY_CONFIG.MAX_CATEGORIES_PER_SKILL)
}

export function buildCategoryListPrompt(): string {
  return getCategoriesSorted()
    .map((c) => `- ${c.id}: ${c.name} — ${c.description}`)
    .join("\n")
}

export function formatSkillForPrompt(skill: SkillInput): string {
  const desc = sanitizePromptInput(
    skill.description ?? "",
    CATEGORY_CONFIG.MAX_DESCRIPTION_LENGTH
  )
  const topics = (skill.topics ?? [])
    .slice(0, CATEGORY_CONFIG.MAX_TOPICS_COUNT)
    .join(", ")

  return [
    `skillId: ${skill.id}`,
    `name: ${sanitizePromptInput(skill.name, 200)}`,
    `description: ${desc}`,
    `topics: ${topics}`,
  ].join("\n")
}

export function buildBatchPrompt(skills: SkillInput[]): string {
  const categoriesDesc = buildCategoryListPrompt()
  const items = skills.map(formatSkillForPrompt).join("\n\n---\n\n")

  return `You are a strict classification engine for developer tools and AI agent skills.

Task: Assign 1-3 best matching categories for each skill, using ONLY the provided category IDs.

CATEGORIES (id: name — description):
${categoriesDesc}

RULES:
1. Output must be valid JSON matching the provided schema.
2. For each skill: choose 1-3 category IDs (unique) from the list above.
3. Prefer the most specific and relevant categories.
4. If a skill clearly belongs to one category, assign only that one.
5. If a skill spans multiple domains, assign up to 3 categories.
6. Never invent category IDs - use only the exact IDs from the list.
7. Consider the skill name, description, and topics when making decisions.

SKILLS TO CATEGORIZE:
${items}`.trim()
}

export function createCacheKey(skill: SkillInput): string {
  const name = (skill.name ?? "").toLowerCase().trim()
  const desc = (skill.description ?? "").toLowerCase().trim().slice(0, 300)
  const topics = (skill.topics ?? [])
    .map((t) => t.toLowerCase().trim())
    .sort()
    .join(",")
  return `${name}|${desc}|${topics}`
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number
    baseDelayMs?: number
    maxDelayMs?: number
    onRetry?: (attempt: number, error: Error) => void
  }
): Promise<T> {
  const {
    maxAttempts = CATEGORY_CONFIG.RETRY.MAX_ATTEMPTS,
    baseDelayMs = CATEGORY_CONFIG.RETRY.BASE_DELAY_MS,
    maxDelayMs = CATEGORY_CONFIG.RETRY.MAX_DELAY_MS,
    onRetry,
  } = options ?? {}

  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxAttempts) {
        break
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs)
      onRetry?.(attempt, lastError)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

class SimpleRateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    this.requests = this.requests.filter((t) => now - t < this.windowMs)
    return this.requests.length < this.maxRequests
  }

  recordRequest(): void {
    this.requests.push(Date.now())
  }

  getRemainingRequests(): number {
    const now = Date.now()
    this.requests = this.requests.filter((t) => now - t < this.windowMs)
    return Math.max(0, this.maxRequests - this.requests.length)
  }
}

const rateLimiter = new SimpleRateLimiter(
  CATEGORY_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_DAY,
  CATEGORY_CONFIG.RATE_LIMIT.WINDOW_MS
)

export function checkRateLimit(): void {
  if (!rateLimiter.canMakeRequest()) {
    const remaining = rateLimiter.getRemainingRequests()
    throw new Error(
      `Rate limit exceeded for Gemini API. ` +
      `Remaining requests: ${remaining}. ` +
      `Please wait before making more requests.`
    )
  }
}

export function recordApiRequest(): void {
  rateLimiter.recordRequest()
}

export function getRateLimitStatus(): { remaining: number; limit: number } {
  return {
    remaining: rateLimiter.getRemainingRequests(),
    limit: CATEGORY_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_DAY,
  }
}
