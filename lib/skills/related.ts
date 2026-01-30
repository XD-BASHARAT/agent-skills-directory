import * as React from "react"
import { eq, and, ne, desc } from "drizzle-orm"

import { db } from "@/lib/db"
import { skills, type Skill } from "@/lib/db/schema"

type ScoredSkill = Skill & { score: number }

const WEIGHTS = {
  topicMatch: 15,
  sameOwner: 10,
  popularityBase: 0.001,
  nameSimilarity: 8,
} as const

function parseTopics(topicsJson: string | null): string[] {
  if (!topicsJson) return []
  try {
    const parsed = JSON.parse(topicsJson)
    return Array.isArray(parsed) ? parsed.map((t: string) => t.toLowerCase()) : []
  } catch {
    return []
  }
}

function countTopicOverlap(topics1: string[], topics2: string[]): number {
  if (topics1.length === 0 || topics2.length === 0) return 0
  const set1 = new Set(topics1)
  return topics2.filter((t) => set1.has(t)).length
}

function extractNameWords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2)
}

function countNameWordOverlap(name1: string, name2: string): number {
  const words1 = new Set(extractNameWords(name1))
  const words2 = extractNameWords(name2)
  return words2.filter((w) => words1.has(w)).length
}

function calculateScore(source: Skill, candidate: Skill): number {
  let score = 0

  const sourceTopics = parseTopics(source.topics)
  const candidateTopics = parseTopics(candidate.topics)
  score += countTopicOverlap(sourceTopics, candidateTopics) * WEIGHTS.topicMatch

  if (source.owner.toLowerCase() === candidate.owner.toLowerCase()) {
    score += WEIGHTS.sameOwner
  }

  score += (candidate.stars ?? 0) * WEIGHTS.popularityBase
  score += countNameWordOverlap(source.name, candidate.name) * WEIGHTS.nameSimilarity

  return score
}

type RelatedSkillsMeta = {
  sourceId: string
  candidatesScored: number
  topicsUsed: number
}

type RelatedSkillsResult = {
  related: Skill[]
  meta: RelatedSkillsMeta
}

async function computeRelatedSkills(
  skillId: string,
  limit = 6,
): Promise<RelatedSkillsResult | null> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 20)

  const [skill, candidates] = await Promise.all([
    db.query.skills.findFirst({
      where: eq(skills.id, skillId),
    }),
    db.query.skills.findMany({
      where: and(ne(skills.id, skillId), eq(skills.status, "approved")),
      orderBy: [desc(skills.stars)],
      limit: 100,
    }),
  ])

  if (!skill) {
    return null
  }
  const sourceTopics = parseTopics(skill.topics)

  const scored: ScoredSkill[] = candidates.map((candidate) => ({
    ...candidate,
    score: calculateScore(skill, candidate),
  }))

  scored.sort((a, b) => b.score - a.score)
  const topRelated = scored.filter((s) => s.score > 0).slice(0, safeLimit)

  const related = topRelated.map((item) => {
    const { score: _, ...rest } = item
    void _
    return rest
  })

  return {
    related,
    meta: {
      sourceId: skill.id,
      candidatesScored: candidates.length,
      topicsUsed: sourceTopics.length,
    },
  }
}

const getRelatedSkills = React.cache(computeRelatedSkills)

export { getRelatedSkills, computeRelatedSkills, type RelatedSkillsResult }
