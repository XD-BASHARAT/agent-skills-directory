import { indexSingleSkill } from "./indexer"
import { batchUpsertSkills, batchLinkSkillsToCategories, getSkillById } from "@/lib/db/queries"
import { mapSkillToCategories, parseTopics } from "@/lib/categories"
import { toCanonicalId } from "./canonical"
import { discoverAllSkillFilesInRepo, batchFetchSkills } from "./github-graphql"
import { batchFetchOwnersVerification } from "./github-rest"
import { parseSkillMd, normalizeAllowedTools } from "./parser"
import { scanSkillContent, scanAllowedTools } from "./security-scanner"
import { slugify } from "@/lib/utils"
import type { NewSkill } from "@/lib/db/schema"

/** @deprecated Use processSubmission inngest function instead */
export async function syncSingleSkill(
  owner: string,
  repo: string,
  path: string,
  submittedBy?: string
): Promise<{ success: true; skillId: string } | { success: false; error: string }> {
  try {
    const skill = await indexSingleSkill(owner, repo, path)

    const skillWithSubmission: NewSkill = {
      ...skill,
      submittedBy: submittedBy ?? null,
      status: "pending",
    }

    await batchUpsertSkills([skillWithSubmission])

    const topics = parseTopics(skill.topics)
    const categoryIds = mapSkillToCategories(skill.name, skill.description, topics)
    await batchLinkSkillsToCategories([{ skillId: skill.id, categoryIds }])

    return { success: true, skillId: skill.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function syncIfChanged(
  owner: string,
  repo: string,
  path: string
): Promise<{ changed: boolean; skill?: NewSkill }> {
  const canonicalId = toCanonicalId(owner, repo, path)
  const existing = await getSkillById(canonicalId)
  const newSkill = await indexSingleSkill(owner, repo, path)

  if (existing && existing.blobSha === newSkill.blobSha) {
    return { changed: false }
  }

  await batchUpsertSkills([newSkill])

  const topics = parseTopics(newSkill.topics)
  const categoryIds = mapSkillToCategories(newSkill.name, newSkill.description, topics)
  await batchLinkSkillsToCategories([{ skillId: canonicalId, categoryIds }])

  return { changed: true, skill: newSkill }
}

export type SyncRepoResult = {
  success: boolean
  owner: string
  repo: string
  total: number
  synced: number
  failed: number
  skills: Array<{ id: string; name: string; path: string }>
  errors: Array<{ path: string; error: string }>
}

export async function syncRepoSkills(
  owner: string,
  repo: string,
  options?: {
    submittedBy?: string
    status?: "pending" | "approved"
  }
): Promise<SyncRepoResult> {
  const result: SyncRepoResult = {
    success: false,
    owner,
    repo,
    total: 0,
    synced: 0,
    failed: 0,
    skills: [],
    errors: [],
  }

  try {
    // Step 1: Discover all SKILL.md files in the repo
    const skillPaths = await discoverAllSkillFilesInRepo(owner, repo)
    result.total = skillPaths.length

    if (skillPaths.length === 0) {
      result.success = true
      return result
    }

    // Step 2: Batch fetch all skill contents and owner verification
    const skillItems = skillPaths.map(path => ({ owner, repo, path }))
    const [skillDataMap, ownerVerificationMap] = await Promise.all([
      batchFetchSkills(skillItems),
      batchFetchOwnersVerification([owner]),
    ])

    // Step 3: Process and upsert each skill
    const skillsToUpsert: NewSkill[] = []
    const categoryLinks: Array<{ skillId: string; categoryIds: string[] }> = []

    for (const path of skillPaths) {
      const lookupKey = `${owner}/${repo}/${path}`
      const data = skillDataMap.get(lookupKey)

      if (!data || !data.content) {
        result.failed++
        result.errors.push({ path, error: "Failed to fetch content" })
        continue
      }

      const parsed = parseSkillMd(data.content)
      if (!parsed.success) {
        result.failed++
        result.errors.push({ path, error: parsed.error || "Parse failed" })
        continue
      }

      const canonicalId = toCanonicalId(owner, repo, path)

      // Security scan
      const securityScan = scanSkillContent(data.content)
      const toolsThreats = scanAllowedTools(parsed.data["allowed-tools"])
      if (toolsThreats.length > 0) {
        securityScan.threats.push(...toolsThreats)
        securityScan.riskScore = Math.min(securityScan.riskScore + toolsThreats.length * 10, 100)
        securityScan.safe = securityScan.riskScore < 50
      }

      const skill: NewSkill = {
        id: canonicalId,
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
        description: parsed.data.description,
        owner: owner.toLowerCase(),
        repo: repo.toLowerCase(),
        path,
        url: `https://github.com/${owner}/${repo}/blob/HEAD/${path}`,
        rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`,
        compatibility: parsed.data.compatibility ?? null,
        allowedTools: normalizeAllowedTools(parsed.data["allowed-tools"])
          ? JSON.stringify(normalizeAllowedTools(parsed.data["allowed-tools"]))
          : null,
        stars: data.stars,
        forks: data.forks,
        avatarUrl: data.avatarUrl,
        topics: JSON.stringify(data.topics),
        isArchived: data.isArchived,
        isVerifiedOrg: ownerVerificationMap.get(owner.toLowerCase()) ?? false,
        blobSha: data.sha,
        lastSeenAt: new Date(),
        repoUpdatedAt: data.pushedAt ? new Date(data.pushedAt) : null,
        fileUpdatedAt: data.fileCommittedAt ? new Date(data.fileCommittedAt) : null,
        submittedBy: options?.submittedBy ?? null,
        status: options?.status ?? (data.stars >= 50 ? "approved" : "pending"),
        securityScan: JSON.stringify(securityScan),
        securityScannedAt: new Date(),
      }

      skillsToUpsert.push(skill)
      result.skills.push({ id: canonicalId, name: parsed.data.name, path })

      // Prepare category links
      const topics = parseTopics(JSON.stringify(data.topics))
      const categoryIds = mapSkillToCategories(parsed.data.name, parsed.data.description, topics)
      if (categoryIds.length > 0) {
        categoryLinks.push({ skillId: canonicalId, categoryIds })
      }
    }

    // Step 4: Batch upsert all skills
    if (skillsToUpsert.length > 0) {
      await batchUpsertSkills(skillsToUpsert)
      result.synced = skillsToUpsert.length
    }

    // Step 5: Link skills to categories
    if (categoryLinks.length > 0) {
      await batchLinkSkillsToCategories(categoryLinks)
    }

    result.success = true
    return result
  } catch (error) {
    result.errors.push({ 
      path: "*", 
      error: error instanceof Error ? error.message : String(error) 
    })
    return result
  }
}
