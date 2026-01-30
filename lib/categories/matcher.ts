/**
 * Category Matcher Engine
 * Maps skills to categories based on keyword matching
 * Uses the centralized category registry
 */

import { CATEGORIES, type CategoryId } from "./registry"

export type CategoryMatch = {
  categoryId: CategoryId
  score: number
}

type KeywordEntry = {
  keyword: string
  isPriority: boolean
  requiresPhraseMatch: boolean
}

type CategoryIndex = {
  id: CategoryId
  keywords: KeywordEntry[]
  negativeKeywords: KeywordEntry[]
}

type TextIndex = {
  text: string
  words: Set<string>
}

const WORD_SPLIT_REGEX = /[^a-z0-9]+/gi
const FIELD_WEIGHT = {
  name: { priority: 9, normal: 6 },
  topics: { priority: 7, normal: 4 },
  description: { priority: 5, normal: 2 },
} as const
const NEGATIVE_MULTIPLIER = 1.25
const MIN_SCORE = 7
const MIN_DESCRIPTION_SCORE = 8
const TOP_SCORE_MIN = 7

function buildTextIndex(value: string): TextIndex {
  const text = value.toLowerCase()
  const words = new Set(text.split(WORD_SPLIT_REGEX).filter(Boolean))
  return { text, words }
}

function keywordRequiresPhraseMatch(keyword: string): boolean {
  return /[^a-z0-9]/i.test(keyword)
}

function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().trim()
}

function buildKeywordEntry(keyword: string, prioritySet: Set<string>): KeywordEntry {
  const normalized = normalizeKeyword(keyword)
  return {
    keyword: normalized,
    isPriority: prioritySet.has(normalized),
    requiresPhraseMatch: keywordRequiresPhraseMatch(normalized),
  }
}

const CATEGORY_INDEX: CategoryIndex[] = CATEGORIES.map((category) => {
  const prioritySet = new Set(
    category.priorityKeywords.map((keyword) => normalizeKeyword(keyword))
  )
  return {
    id: category.id as CategoryId,
    keywords: category.keywords.map((keyword) => buildKeywordEntry(keyword, prioritySet)),
    negativeKeywords: category.negativeKeywords.map((keyword) =>
      buildKeywordEntry(keyword, prioritySet)
    ),
  }
})

function matchesKeyword(index: TextIndex, entry: KeywordEntry): boolean {
  if (entry.requiresPhraseMatch) {
    return index.text.includes(entry.keyword)
  }

  if (index.words.has(entry.keyword)) {
    return true
  }

  if (entry.keyword.length <= 3) {
    return false
  }

  const plural =
    entry.keyword.endsWith("s") && entry.keyword.length > 3
      ? entry.keyword.slice(0, -1)
      : `${entry.keyword}s`

  return index.words.has(plural)
}

function specificityBonus(keyword: string): number {
  if (keyword.length >= 10) return 2
  if (keyword.length >= 7) return 1
  return 0
}

function pickBestFieldMatch(
  matchInName: boolean,
  matchInTopics: boolean,
  matchInDescription: boolean
): "name" | "topics" | "description" | null {
  if (matchInName) return "name"
  if (matchInTopics) return "topics"
  if (matchInDescription) return "description"
  return null
}

function fieldWeight(field: "name" | "topics" | "description", isPriority: boolean): number {
  return isPriority ? FIELD_WEIGHT[field].priority : FIELD_WEIGHT[field].normal
}

function findBestFieldMatch(
  nameIndex: TextIndex,
  topicsIndex: TextIndex | null,
  descriptionIndex: TextIndex,
  hasTopics: boolean,
  keyword: KeywordEntry
): "name" | "topics" | "description" | null {
  const matchInName = matchesKeyword(nameIndex, keyword)
  const matchInTopics = hasTopics && topicsIndex ? matchesKeyword(topicsIndex, keyword) : false
  const matchInDescription = matchesKeyword(descriptionIndex, keyword)

  return pickBestFieldMatch(matchInName, matchInTopics, matchInDescription)
}

function scoreKeywordMatch(field: "name" | "topics" | "description", keyword: KeywordEntry): number {
  const phraseBonus = keyword.requiresPhraseMatch ? 1 : 0
  const boost = specificityBonus(keyword.keyword)
  const weight = fieldWeight(field, keyword.isPriority)
  return weight + phraseBonus + boost
}

/**
 * Map a skill to categories with scores (for confidence detection)
 * Returns sorted matches with scores
 */
export function mapSkillToCategoryMatches(
  name: string,
  description: string,
  topics?: string[] | null
): CategoryMatch[] {
  const nameIndex = buildTextIndex(name)
  const descriptionIndex = buildTextIndex(description)
  const topicsText = topics?.join(" ") ?? ""
  const hasTopics = topicsText.length > 0
  const topicsIndex = hasTopics ? buildTextIndex(topicsText) : null

  const matches: CategoryMatch[] = []

  for (const category of CATEGORY_INDEX) {
    let score = 0
    let positiveHits = 0
    let priorityHits = 0
    let nameHits = 0
    let topicHits = 0

    for (const keyword of category.keywords) {
      const bestField = findBestFieldMatch(
        nameIndex,
        topicsIndex,
        descriptionIndex,
        hasTopics,
        keyword
      )

      if (!bestField) {
        continue
      }

      positiveHits += 1
      if (keyword.isPriority) {
        priorityHits += 1
      }

      if (bestField === "name") {
        nameHits += 1
      } else if (bestField === "topics") {
        topicHits += 1
      }

      score += scoreKeywordMatch(bestField, keyword)
    }

    let negativeScore = 0
    for (const keyword of category.negativeKeywords) {
      const bestField = findBestFieldMatch(
        nameIndex,
        topicsIndex,
        descriptionIndex,
        hasTopics,
        keyword
      )

      if (!bestField) {
        continue
      }
      negativeScore += scoreKeywordMatch(bestField, keyword) * NEGATIVE_MULTIPLIER
    }

    score -= negativeScore

    if (score <= 0 || positiveHits === 0) {
      continue
    }

    if (score < MIN_SCORE) {
      continue
    }

    const onlyDescription = nameHits === 0 && topicHits === 0
    if (onlyDescription) {
      if (priorityHits === 0 && positiveHits < 2) {
        continue
      }
      if (score < MIN_DESCRIPTION_SCORE) {
        continue
      }
    }

    const hasPriority = priorityHits > 0
    const hasMultiple = positiveHits >= 2
    const hasNameSignal = nameHits > 0

    if (!hasPriority && !hasMultiple && !hasNameSignal) {
      continue
    }

    matches.push({ categoryId: category.id, score })
  }

  return matches.sort((a, b) => b.score - a.score)
}

export type ConfidenceLevel = "high" | "medium" | "low"

export type KeywordResult = {
  categoryIds: CategoryId[]
  confidence: ConfidenceLevel
  topScore: number
  secondScore: number
}

/**
 * Evaluate keyword matching confidence
 * High confidence = no need for AI
 * Low confidence = should use AI
 */
export function evaluateKeywordConfidence(matches: CategoryMatch[]): KeywordResult {
  if (matches.length === 0) {
    return { categoryIds: [], confidence: "low", topScore: 0, secondScore: 0 }
  }

  const topScore = matches[0]?.score ?? 0
  const secondScore = matches[1]?.score ?? 0
  const gap = topScore - secondScore

  let confidence: ConfidenceLevel
  let categoryIds: CategoryId[]

  if (topScore >= 12 && gap >= 6) {
    confidence = "high"
    categoryIds = secondScore >= 4
      ? matches.slice(0, 2).map((m) => m.categoryId)
      : [matches[0].categoryId]
  } else if (topScore >= 9 && gap >= 3) {
    confidence = "high"
    categoryIds = matches.slice(0, 2).filter((m) => m.score >= 4).map((m) => m.categoryId)
  } else if (topScore >= 7) {
    confidence = "medium"
    categoryIds = matches.slice(0, 3).filter((m) => m.score >= 3).map((m) => m.categoryId)
  } else {
    confidence = "low"
    categoryIds = matches.length > 0 ? [matches[0].categoryId] : []
  }

  return { categoryIds, confidence, topScore, secondScore }
}

/**
 * Map a skill to categories based on name, description, and topics
 * Returns an array of category IDs sorted by relevance
 */
export function mapSkillToCategories(
  name: string,
  description: string,
  topics?: string[] | null
): CategoryId[] {
  const matches = mapSkillToCategoryMatches(name, description, topics)

  if (matches.length === 0) {
    return []
  }

  const topScore = matches[0]?.score ?? 0
  if (topScore < TOP_SCORE_MIN) {
    return []
  }

  const secondScore = matches[1]?.score ?? 0
  const significantGap = topScore >= 12 && topScore - secondScore >= 6
  if (significantGap) {
    return [matches[0].categoryId]
  }

  const cutoff = Math.max(4, Math.round(topScore * 0.6))
  const filtered = matches.filter((m) => m.score >= cutoff)

  if (filtered.length === 0) {
    return [matches[0].categoryId]
  }

  return filtered.slice(0, 3).map((m) => m.categoryId)
}

/**
 * Parse topics from JSON string or return array as-is
 */
export function parseTopics(topics: string | string[] | null | undefined): string[] | null {
  if (!topics) return null
  if (Array.isArray(topics)) return topics
  try {
    return JSON.parse(topics)
  } catch {
    return null
  }
}
