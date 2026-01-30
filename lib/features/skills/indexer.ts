import { searchSkillFiles } from "./github"
import { discoverSkillFiles, discoverSkillsSince } from "./discovery"
import { parseSkillMd, normalizeAllowedTools } from "./parser"
import { batchFetchSkills, batchFetchRepoMetadata } from "@/lib/features/skills/github-graphql"
import { batchFetchOwnersVerification } from "@/lib/features/skills/github-rest"
import { 
  toSkillIdentity, 
  validateSkillName, 
  validateDescription,
  isLikelyAgentSkill,
  deduplicateSkills 
} from "./canonical"
import type { NewSkill } from "@/lib/db/schema"
import { slugify } from "@/lib/utils"

export type IndexResult = {
  total: number
  indexed: number
  failed: number
  skipped: number
  lowStars: number
  duplicates: number
  invalidSpec: number
  notAgentSkill: number
  skills: NewSkill[]
  errors: Array<{ id: string; error: string; type: ErrorType }>
}

export type ErrorType = 
  | "not_found"
  | "empty_content"
  | "parse_failed"
  | "invalid_name"
  | "invalid_description"
  | "not_agent_skill"
  | "duplicate"

export type IndexOptions = {
  onProgress?: (msg: string) => void
  skipArchived?: boolean
  minStars?: number
  concurrency?: number // Note: Now handled by batch size mostly
  /** For incremental: repos pushed after this date */
  since?: Date
  /** Max results to return */
  limit?: number
  /** Use adaptive discovery (bypasses 1000 limit) */
  useAdaptiveDiscovery?: boolean
}

/**
 * Index tất cả SKILL.md files từ GitHub bằng GraphQL Batching
 * 
 * Process:
 * 1. Discover SKILL.md files (adaptive sharding or basic REST)
 * 2. Deduplicate using canonical IDs
 * 3. Batch fetch repo metadata via GraphQL (filter by stars early)
 * 4. Batch fetch content via GraphQL for qualified repos
 * 5. Validate according to Agent Skills Spec
 * 6. Return normalized skills for database upsert
 */
export async function indexSkills(options: IndexOptions = {}): Promise<IndexResult> {
  const { 
    onProgress, 
    skipArchived = true, 
    minStars = 50, 
    since, 
    limit = 20000,
    useAdaptiveDiscovery = false, // Use basic REST by default (more reliable)
  } = options

  const result: IndexResult = {
    total: 0,
    indexed: 0,
    failed: 0,
    skipped: 0,
    lowStars: 0,
    duplicates: 0,
    invalidSpec: 0,
    notAgentSkill: 0,
    skills: [],
    errors: [],
  }

  // Step 1: Discover SKILL.md files
  onProgress?.(`🔍 Step 1: Discovering SKILL.md files...`)
  
  let searchResults: Array<{ owner: string; repo: string; path: string; sha?: string }>
  
  if (useAdaptiveDiscovery) {
    onProgress?.(`   Using adaptive discovery (bypasses 1000 limit)`)
    if (since) {
      searchResults = await discoverSkillsSince(since, { onProgress, maxResults: limit })
    } else {
      searchResults = await discoverSkillFiles({ onProgress, maxResults: limit })
    }
  } else {
    onProgress?.(`   Using basic REST search (max 1000 results)`)
    const basicResults = await searchSkillFiles({ onProgress, since, minStars, limit: Math.min(limit, 1000) })
    searchResults = basicResults
  }
  
  // Step 2: Deduplicate using canonical IDs
  onProgress?.(`🔄 Step 2: Deduplicating results...`)
  const uniqueResults = deduplicateSkills(searchResults)
  result.duplicates = searchResults.length - uniqueResults.length
  result.total = uniqueResults.length
  
  if (result.duplicates > 0) {
    onProgress?.(`   Removed ${result.duplicates} duplicates`)
  }
  onProgress?.(`   ${uniqueResults.length} unique skills to process`)

  // Step 3: 2-phase fetch - metadata first, then content for qualified repos
  onProgress?.("📡 Step 3: Fetching repo metadata via GraphQL (2-phase)...")
  
  // Get unique repos for metadata fetch
  const uniqueRepos = new Map<string, { owner: string; repo: string }>()
  for (const item of uniqueResults) {
    const key = `${item.owner}/${item.repo}`.toLowerCase()
    if (!uniqueRepos.has(key)) {
      uniqueRepos.set(key, { owner: item.owner, repo: item.repo })
    }
  }
  
  onProgress?.(`   Fetching metadata for ${uniqueRepos.size} unique repos...`)
  const repoMetadata = await batchFetchRepoMetadata([...uniqueRepos.values()])
  
  // Filter by stars/archived BEFORE fetching content (saves GraphQL quota)
  const qualifiedItems: Array<{ owner: string; repo: string; path: string; canonicalId: string }> = []
  
  for (const item of uniqueResults) {
    const identity = toSkillIdentity(item.owner, item.repo, item.path)
    const repoKey = `${item.owner}/${item.repo}`
    const metadata = repoMetadata.get(repoKey)
    
    if (!metadata) {
      result.failed++
      result.errors.push({ 
        id: identity.canonicalId, 
        error: "Repo not found",
        type: "not_found"
      })
      continue
    }
    
    if (metadata.stars < minStars) {
      result.lowStars++
      continue
    }
    
    if (skipArchived && metadata.isArchived) {
      result.skipped++
      continue
    }
    
    if (since && metadata.pushedAt) {
      const pushedDate = new Date(metadata.pushedAt)
      if (pushedDate < since) {
        result.skipped++
        continue
      }
    }
    
    qualifiedItems.push({
      owner: item.owner,
      repo: item.repo,
      path: item.path,
      canonicalId: identity.canonicalId,
    })
  }
  
  onProgress?.(`   Qualified after filtering: ${qualifiedItems.length} skills`)
  onProgress?.(`   Low stars (<${minStars}): ${result.lowStars}`)
  onProgress?.(`   Skipped (archived/date): ${result.skipped}`)
  
  if (qualifiedItems.length === 0) {
    onProgress?.("⚠️ No skills qualified for content fetch")
    return result
  }
  
  // Phase 2: Fetch content only for qualified items
  onProgress?.(`📄 Step 4: Fetching content for ${qualifiedItems.length} qualified skills...`)
  const skillDataMap = await batchFetchSkills(
    qualifiedItems.map(i => ({ owner: i.owner, repo: i.repo, path: i.path }))
  )
  
  // Phase 3: Fetch organization verification status
  onProgress?.(`🔐 Step 4.5: Checking GitHub organization verification status...`)
  const ownersList = [...new Set(qualifiedItems.map(i => i.owner))]
  const ownerVerificationMap = await batchFetchOwnersVerification(ownersList)
  onProgress?.(`   Checked ${ownersList.length} unique owners`)

  // Step 5: Process and validate results
  onProgress?.("✅ Step 5: Validating and processing skills...")
  
  for (const item of qualifiedItems) {
    const identity = toSkillIdentity(item.owner, item.repo, item.path)
    const lookupKey = `${item.owner}/${item.repo}/${item.path}`
    const data = skillDataMap.get(lookupKey)

    if (!data) {
      result.failed++
      result.errors.push({ 
        id: identity.canonicalId, 
        error: "Not found in GraphQL batch",
        type: "not_found"
      })
      continue
    }

    // Parse content
    if (!data.content) {
      result.failed++
      result.errors.push({ 
        id: identity.canonicalId, 
        error: "Empty content",
        type: "empty_content"
      })
      continue
    }

    const parsed = parseSkillMd(data.content)
    if (!parsed.success) {
      result.failed++
      result.errors.push({ 
        id: identity.canonicalId, 
        error: parsed.error || "Parse failed",
        type: "parse_failed"
      })
      continue
    }

    // Validate name according to Agent Skills Spec
    const nameValidation = validateSkillName(parsed.data.name)
    if (!nameValidation.valid) {
      result.invalidSpec++
      result.errors.push({ 
        id: identity.canonicalId, 
        error: `Invalid name: ${nameValidation.error}`,
        type: "invalid_name"
      })
      // Still continue - don't block, just warn
    }

    // Validate description
    const descValidation = validateDescription(parsed.data.description)
    if (!descValidation.valid) {
      result.invalidSpec++
      result.errors.push({ 
        id: identity.canonicalId, 
        error: `Invalid description: ${descValidation.error}`,
        type: "invalid_description"
      })
      // Still continue - don't block, just warn
    }

    // Check if this is likely a real Agent Skill (not placeholder/test)
    if (!isLikelyAgentSkill(parsed.data.name, parsed.data.description)) {
      result.notAgentSkill++
      result.errors.push({ 
        id: identity.canonicalId, 
        error: "Not a valid Agent Skill (placeholder or test)",
        type: "not_agent_skill"
      })
      continue // Skip - don't include in results
    }

    // Map to DB with canonical ID
    const skill: NewSkill = {
      id: identity.canonicalId,  // Use canonical ID as primary key
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description,
      owner: identity.owner,     // Normalized (lowercase)
      repo: identity.repo,       // Normalized (lowercase)
      path: identity.path,       // Original case
      url: `https://github.com/${identity.owner}/${identity.repo}/blob/HEAD/${identity.path}`,
      rawUrl: `https://raw.githubusercontent.com/${identity.owner}/${identity.repo}/HEAD/${identity.path}`,
      compatibility: parsed.data.compatibility ?? null,
      allowedTools: normalizeAllowedTools(parsed.data["allowed-tools"])
        ? JSON.stringify(normalizeAllowedTools(parsed.data["allowed-tools"]))
        : null,
      stars: data.stars,
      forks: data.forks,
      avatarUrl: data.avatarUrl,
      topics: JSON.stringify(data.topics),
      isArchived: data.isArchived,
      isVerifiedOrg: ownerVerificationMap.get(identity.owner.toLowerCase()) ?? false,
      blobSha: data.sha,
      lastSeenAt: new Date(),
      repoUpdatedAt: data.pushedAt ? new Date(data.pushedAt) : null,
      fileUpdatedAt: data.fileCommittedAt ? new Date(data.fileCommittedAt) : null,
      status: "pending",
    }

    result.skills.push(skill)
    result.indexed++
  }

  onProgress?.(`\n📊 Summary:`)
  onProgress?.(`   Total unique: ${result.total}`)
  onProgress?.(`   Indexed: ${result.indexed}`)
  onProgress?.(`   Low stars (<${minStars}): ${result.lowStars}`)
  onProgress?.(`   Skipped (archived/date): ${result.skipped}`)
  onProgress?.(`   Failed: ${result.failed}`)
  onProgress?.(`   Invalid spec (warnings): ${result.invalidSpec}`)
  onProgress?.(`   Not Agent Skill: ${result.notAgentSkill}`)
  onProgress?.(`   Duplicates removed: ${result.duplicates}`)

  return result
}

/**
 * Index một skill đơn lẻ (cho submissions)
 * 
 * Uses canonical ID for consistent database keys
 */
export async function indexSingleSkill(
  owner: string,
  repo: string,
  path: string
): Promise<NewSkill> {
  const identity = toSkillIdentity(owner, repo, path)
  
  const [result, ownerVerificationMap] = await Promise.all([
    batchFetchSkills([{ owner, repo, path }]),
    batchFetchOwnersVerification([owner]),
  ])
  const data = result.get(`${owner}/${repo}/${path}`)

  if (!data || !data.content) {
    throw new Error("Failed to fetch skill content")
  }

  const parsed = parseSkillMd(data.content)
  if (!parsed.success) {
    throw new Error(parsed.error)
  }

  // Validate according to Agent Skills Spec (warnings only)
  const nameValidation = validateSkillName(parsed.data.name)
  if (!nameValidation.valid) {
    console.warn(`[indexSingleSkill] ${identity.canonicalId}: ${nameValidation.error}`)
  }

  return {
    id: identity.canonicalId,  // Use canonical ID
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description,
    owner: identity.owner,     // Normalized
    repo: identity.repo,       // Normalized
    path: identity.path,
    url: `https://github.com/${identity.owner}/${identity.repo}/blob/HEAD/${identity.path}`,
    rawUrl: `https://raw.githubusercontent.com/${identity.owner}/${identity.repo}/HEAD/${identity.path}`,
    stars: data.stars,
    forks: data.forks,
    avatarUrl: data.avatarUrl,
    topics: JSON.stringify(data.topics),
    isArchived: data.isArchived,
    isVerifiedOrg: ownerVerificationMap.get(identity.owner.toLowerCase()) ?? false,
    blobSha: data.sha,
    lastSeenAt: new Date(),
    repoUpdatedAt: data.pushedAt ? new Date(data.pushedAt) : null,
    fileUpdatedAt: data.fileCommittedAt ? new Date(data.fileCommittedAt) : null,
    status: "pending",
  }
}
