import { env } from "@/lib/env"
import { batchFetchSkills, batchFetchRepoMetadata } from "./github-graphql"
import { parseSkillMd, normalizeAllowedTools } from "./parser"
import { toCanonicalId, createDeduplicationSet, isValidSkillPath } from "./canonical"
import { batchUpsertSkills, getExistingSkillIds } from "@/lib/db/queries"
import { slugify } from "@/lib/utils"
import type { NewSkill } from "@/lib/db/schema"

const GITHUB_API = "https://api.github.com"

const GRAPHQL_BATCH_SIZE = 100
const DISCOVERY_CONCURRENCY = 3
const CONTENT_FETCH_CONCURRENCY = 5

export type ParallelSyncOptions = {
  onProgress?: (msg: string) => void
  maxResults?: number
  minStars?: number
  skipExisting?: boolean
  streamingUpsert?: boolean
}

export type ParallelSyncResult = {
  discovered: number
  filtered: number
  indexed: number
  errors: number
  duration: number
}

function getHeaders(): HeadersInit {
  return {
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "User-Agent": "Skills-Directory",
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function parallelCodeSearch(
  queries: string[],
  options: { maxResultsPerQuery?: number; onProgress?: (msg: string) => void }
): Promise<Array<{ owner: string; repo: string; path: string; sha: string }>> {
  const { maxResultsPerQuery = 500, onProgress } = options
  const dedup = createDeduplicationSet()
  const results: Array<{ owner: string; repo: string; path: string; sha: string }> = []

  const chunks: string[][] = []
  for (let i = 0; i < queries.length; i += DISCOVERY_CONCURRENCY) {
    chunks.push(queries.slice(i, i + DISCOVERY_CONCURRENCY))
  }

  for (const chunk of chunks) {
    onProgress?.(`🔍 Running ${chunk.length} queries in parallel...`)

    const chunkResults = await Promise.all(
      chunk.map(async (query) => {
        const queryResults: Array<{ owner: string; repo: string; path: string; sha: string }> = []
        let page = 1

        while (page <= 10 && queryResults.length < maxResultsPerQuery) {
          try {
            const url = `${GITHUB_API}/search/code?q=${encodeURIComponent(query)}&page=${page}&per_page=100`
            const res = await fetch(url, { headers: getHeaders() })

            if (res.status === 403) {
              const resetTime = res.headers.get("x-ratelimit-reset")
              if (resetTime) {
                const waitMs = Math.max(0, parseInt(resetTime) * 1000 - Date.now() + 2000)
                await sleep(Math.min(waitMs, 65000))
                continue
              }
              break
            }

            if (!res.ok) break

            const data = await res.json()

            for (const item of data.items ?? []) {
              if (!isValidSkillPath(item.path)) continue
              const [owner, repo] = item.repository.full_name.split("/")
              queryResults.push({ owner, repo, path: item.path, sha: item.sha })
            }

            if ((data.items?.length ?? 0) < 100) break
            page++

            await sleep(1500)
          } catch {
            break
          }
        }

        return queryResults
      })
    )

    for (const queryResult of chunkResults) {
      for (const item of queryResult) {
        if (!dedup.has(item.owner, item.repo, item.path)) {
          dedup.add(item.owner, item.repo, item.path)
          results.push(item)
        }
      }
    }

    onProgress?.(`   Total unique: ${results.length}`)

    await sleep(2000)
  }

  return results
}

async function parallelContentFetch(
  items: Array<{ owner: string; repo: string; path: string }>,
  options: { onProgress?: (msg: string) => void }
): Promise<Map<string, Awaited<ReturnType<typeof batchFetchSkills>> extends Map<string, infer V> ? V : never>> {
  const { onProgress } = options
  const results = new Map<string, Awaited<ReturnType<typeof batchFetchSkills>> extends Map<string, infer V> ? V : never>()

  const batches: Array<Array<{ owner: string; repo: string; path: string }>> = []
  for (let i = 0; i < items.length; i += GRAPHQL_BATCH_SIZE) {
    batches.push(items.slice(i, i + GRAPHQL_BATCH_SIZE))
  }

  onProgress?.(`📡 Fetching ${items.length} skills in ${batches.length} batches (${CONTENT_FETCH_CONCURRENCY} concurrent)`)

  for (let i = 0; i < batches.length; i += CONTENT_FETCH_CONCURRENCY) {
    const chunk = batches.slice(i, i + CONTENT_FETCH_CONCURRENCY)

    const chunkResults = await Promise.all(
      chunk.map((batch) => batchFetchSkills(batch))
    )

    for (const batchResult of chunkResults) {
      for (const [key, value] of batchResult) {
        results.set(key, value)
      }
    }

    onProgress?.(`   Fetched ${Math.min((i + CONTENT_FETCH_CONCURRENCY) * GRAPHQL_BATCH_SIZE, items.length)}/${items.length}`)

    if (i + CONTENT_FETCH_CONCURRENCY < batches.length) {
      await sleep(200)
    }
  }

  return results
}

async function streamingUpsert(
  skills: NewSkill[],
  batchSize: number = 50,
  onProgress?: (msg: string) => void
): Promise<number> {
  let upserted = 0

  for (let i = 0; i < skills.length; i += batchSize) {
    const batch = skills.slice(i, i + batchSize)
    await batchUpsertSkills(batch)
    upserted += batch.length
    onProgress?.(`   Upserted ${upserted}/${skills.length}`)
  }

  return upserted
}

export async function parallelSync(options: ParallelSyncOptions = {}): Promise<ParallelSyncResult> {
  const {
    onProgress,
    maxResults = 5000,
    minStars = 10,
    skipExisting = true,
    streamingUpsert: useStreaming = true,
  } = options

  const startTime = Date.now()
  const result: ParallelSyncResult = {
    discovered: 0,
    filtered: 0,
    indexed: 0,
    errors: 0,
    duration: 0,
  }

  const discoveryQueries = [
    "filename:SKILL.md size:>100",
    "path:SKILL.md size:>100",
    "path:.claude filename:SKILL.md size:>100",
    "path:.kiro filename:SKILL.md size:>100",
    "path:skills filename:SKILL.md size:>100",
    "path:.cursor filename:SKILL.md size:>100",
    "path:.windsurf filename:SKILL.md size:>100",
    "path:.cline filename:SKILL.md size:>100",
  ]

  onProgress?.("\n=== Phase 1: Parallel Discovery ===")
  const discovered = await parallelCodeSearch(discoveryQueries, {
    maxResultsPerQuery: Math.ceil(maxResults / discoveryQueries.length),
    onProgress,
  })
  result.discovered = discovered.length
  onProgress?.(`✅ Discovered ${discovered.length} unique skills`)

  if (discovered.length === 0) {
    result.duration = Date.now() - startTime
    return result
  }

  let toProcess = discovered
  if (skipExisting) {
    onProgress?.("\n=== Phase 2: Filter Existing ===")
    const candidateIds = discovered.map((d) => toCanonicalId(d.owner, d.repo, d.path))
    const existingIds = await getExistingSkillIds(candidateIds)
    toProcess = discovered.filter((d) => {
      const id = toCanonicalId(d.owner, d.repo, d.path)
      return !existingIds.has(id)
    })
    onProgress?.(`   New skills: ${toProcess.length} (${discovered.length - toProcess.length} already exist)`)
  }

  if (toProcess.length === 0) {
    result.duration = Date.now() - startTime
    return result
  }

  onProgress?.("\n=== Phase 3: Fetch Repo Metadata ===")
  const uniqueRepos = new Map<string, { owner: string; repo: string }>()
  for (const item of toProcess) {
    const key = `${item.owner}/${item.repo}`.toLowerCase()
    if (!uniqueRepos.has(key)) {
      uniqueRepos.set(key, { owner: item.owner, repo: item.repo })
    }
  }

  const repoMetadata = await batchFetchRepoMetadata([...uniqueRepos.values()])
  onProgress?.(`   Fetched metadata for ${repoMetadata.size} repos`)

  onProgress?.("\n=== Phase 4: Filter by Stars ===")
  const qualified = toProcess.filter((item) => {
    const repoKey = `${item.owner}/${item.repo}`
    const meta = repoMetadata.get(repoKey)
    if (!meta) return false
    if (meta.stars < minStars) return false
    if (meta.isArchived) return false
    return true
  })
  result.filtered = qualified.length
  onProgress?.(`   Qualified: ${qualified.length} (min ${minStars} stars)`)

  if (qualified.length === 0) {
    result.duration = Date.now() - startTime
    return result
  }

  onProgress?.("\n=== Phase 5: Parallel Content Fetch ===")
  const skillDataMap = await parallelContentFetch(qualified, { onProgress })

  onProgress?.("\n=== Phase 6: Parse & Prepare ===")
  const skillsToUpsert: NewSkill[] = []

  for (const item of qualified) {
    const lookupKey = `${item.owner}/${item.repo}/${item.path}`
    const data = skillDataMap.get(lookupKey)

    if (!data || !data.content) {
      result.errors++
      continue
    }

    const parsed = parseSkillMd(data.content)
    if (!parsed.success) {
      result.errors++
      continue
    }

    const canonicalId = toCanonicalId(item.owner, item.repo, item.path)

    skillsToUpsert.push({
      id: canonicalId,
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description,
      owner: item.owner.toLowerCase(),
      repo: item.repo.toLowerCase(),
      path: item.path,
      url: `https://github.com/${item.owner}/${item.repo}/blob/HEAD/${item.path}`,
      rawUrl: `https://raw.githubusercontent.com/${item.owner}/${item.repo}/HEAD/${item.path}`,
      compatibility: parsed.data.compatibility ?? null,
      allowedTools: normalizeAllowedTools(parsed.data["allowed-tools"])
        ? JSON.stringify(normalizeAllowedTools(parsed.data["allowed-tools"]))
        : null,
      stars: data.stars,
      forks: data.forks,
      avatarUrl: data.avatarUrl,
      topics: JSON.stringify(data.topics),
      isArchived: data.isArchived,
      isVerifiedOrg: null,
      blobSha: data.sha,
      lastSeenAt: new Date(),
      repoUpdatedAt: data.pushedAt ? new Date(data.pushedAt) : null,
      fileUpdatedAt: data.fileCommittedAt ? new Date(data.fileCommittedAt) : null,
      status: "pending",
    })
  }

  onProgress?.(`   Prepared ${skillsToUpsert.length} skills`)

  onProgress?.("\n=== Phase 7: Database Upsert ===")
  if (useStreaming) {
    result.indexed = await streamingUpsert(skillsToUpsert, 100, onProgress)
  } else {
    await batchUpsertSkills(skillsToUpsert)
    result.indexed = skillsToUpsert.length
  }

  result.duration = Date.now() - startTime
  onProgress?.(`\n🎉 Sync complete in ${(result.duration / 1000).toFixed(1)}s`)
  onProgress?.(`   Discovered: ${result.discovered}`)
  onProgress?.(`   Qualified: ${result.filtered}`)
  onProgress?.(`   Indexed: ${result.indexed}`)
  onProgress?.(`   Errors: ${result.errors}`)

  return result
}

/**
 * Estimate time to sync N skills
 */
export function estimateSyncTime(skillCount: number): {
  discovery: number
  metadata: number
  content: number
  upsert: number
  total: number
  formatted: string
} {
  // Discovery: ~2s per page, 100 items/page, parallel factor 3
  const discoveryPages = Math.ceil(skillCount / 100)
  const discoveryTime = (discoveryPages * 2000) / DISCOVERY_CONCURRENCY

  // Metadata: 100 repos/batch, 100ms/batch
  const metadataBatches = Math.ceil(skillCount / GRAPHQL_BATCH_SIZE)
  const metadataTime = (metadataBatches * 100) / CONTENT_FETCH_CONCURRENCY

  // Content: 100 items/batch, 100ms/batch, parallel factor 5
  const contentBatches = Math.ceil(skillCount / GRAPHQL_BATCH_SIZE)
  const contentTime = (contentBatches * 100) / CONTENT_FETCH_CONCURRENCY

  // Upsert: 100 items/batch, ~50ms/batch
  const upsertBatches = Math.ceil(skillCount / 100)
  const upsertTime = upsertBatches * 50

  const total = discoveryTime + metadataTime + contentTime + upsertTime

  const minutes = Math.floor(total / 60000)
  const seconds = Math.floor((total % 60000) / 1000)

  return {
    discovery: discoveryTime,
    metadata: metadataTime,
    content: contentTime,
    upsert: upsertTime,
    total,
    formatted: minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`,
  }
}
