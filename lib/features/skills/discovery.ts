import { env } from "@/lib/env"
import { createDeduplicationSet, isValidSkillPath } from "./canonical"

const GITHUB_API = "https://api.github.com"

const DISCOVERY_QUERIES = [
  "filename:SKILL.md size:>100",                    // General - catches most (min 100 bytes)
  "path:SKILL.md size:>100",                        // Root level only
  "path:.claude filename:SKILL.md size:>100",       // Claude skills directory
  "path:.kiro filename:SKILL.md size:>100",         // Kiro skills directory  
  "path:skills filename:SKILL.md size:>100",        // Common skills/ directory
  "path:.cursor filename:SKILL.md size:>100",       // Cursor skills
  "path:.windsurf filename:SKILL.md size:>100",     // Windsurf skills
  "path:.cline filename:SKILL.md size:>100",        // Cline skills
] as const

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Skills-Directory",
  }
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`
  }
  return headers
}

export type DiscoveredSkill = {
  owner: string
  repo: string
  path: string
  sha: string
}

export type DiscoveryOptions = {
  onProgress?: (msg: string) => void
  startDate?: Date
  endDate?: Date
  maxResults?: number
}

export const SKILLS_LAUNCH_DATE = new Date("2025-10-01")

type SearchResponse = {
  total_count: number
  incomplete_results: boolean
  items: Array<{
    sha: string
    path: string
    repository: { full_name: string }
  }>
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

async function searchCodeWithRetry(
  query: string,
  page: number,
  perPage: number,
  maxRetries = 3
): Promise<SearchResponse> {
  const url = `${GITHUB_API}/search/code?q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, { headers: getHeaders() })

    if (res.status === 403) {
      const resetTime = res.headers.get("x-ratelimit-reset")
      if (resetTime) {
        const waitMs = Math.max(0, parseInt(resetTime) * 1000 - Date.now() + 2000)
        await sleep(Math.min(waitMs, 65000))
        continue
      }
      throw new Error("Rate limited")
    }

    if (res.status === 422) {
      return { total_count: 0, incomplete_results: false, items: [] }
    }

    if (res.status >= 500 && attempt < maxRetries) {
      await sleep(Math.pow(2, attempt + 1) * 1000)
      continue
    }

    if (!res.ok) {
      throw new Error(`GitHub search error: ${res.status}`)
    }

    return res.json()
  }

  throw new Error("Max retries exceeded")
}

async function searchAllPages(
  baseQuery: string,
  dedup: ReturnType<typeof createDeduplicationSet>,
  results: DiscoveredSkill[],
  options: DiscoveryOptions
): Promise<void> {
  const { onProgress, maxResults = Infinity } = options

  // Note: GitHub Code Search does NOT support date filtering
  // Date filtering is applied later during indexing by checking repo pushedAt
  const query = baseQuery

  await sleep(2200)

  // Sort by indexed to get recently updated files first
  const firstPage = await searchCodeWithRetry(query, 1, 100)
  const totalCount = firstPage.total_count

  onProgress?.(`📊 Total results in GitHub: ${totalCount}`)

  if (totalCount === 0) {
    return
  }

  for (const item of firstPage.items) {
    if (results.length >= maxResults) break
    if (!isValidSkillPath(item.path)) continue

    const [owner, repo] = item.repository.full_name.split("/")
    if (dedup.has(owner, repo, item.path)) continue

    dedup.add(owner, repo, item.path)
    results.push({ owner, repo, path: item.path, sha: item.sha })
  }

  onProgress?.(`   Page 1: ${results.length} skills`)

  if (firstPage.items.length < 100 || results.length >= maxResults) {
    return
  }

  // Continue pagination (max 10 pages = 1000 results from Code Search)
  for (let page = 2; page <= 10; page++) {
    if (results.length >= maxResults) break

    await sleep(2200)
    const pageData = await searchCodeWithRetry(query, page, 100)

    for (const item of pageData.items) {
      if (results.length >= maxResults) break
      if (!isValidSkillPath(item.path)) continue

      const [owner, repo] = item.repository.full_name.split("/")
      if (dedup.has(owner, repo, item.path)) continue

      dedup.add(owner, repo, item.path)
      results.push({ owner, repo, path: item.path, sha: item.sha })
    }

    onProgress?.(`   Page ${page}: ${results.length} skills`)

    if (pageData.items.length < 100) break
  }
}

export async function discoverSkillFiles(
  options: DiscoveryOptions = {}
): Promise<DiscoveredSkill[]> {
  const {
    onProgress,
    maxResults = 2000, // Higher limit with multi-query
  } = options

  const results: DiscoveredSkill[] = []
  const dedup = createDeduplicationSet()

  onProgress?.(`🔍 Discovering SKILL.md files (Multi-Query Strategy)`)
  onProgress?.(`   Max results: ${maxResults.toLocaleString()}`)
  onProgress?.(`   Queries: ${DISCOVERY_QUERIES.length}`)
  onProgress?.(`   Note: Date filtering applied during indexing phase`)

  // Run each query and deduplicate results
  for (const baseQuery of DISCOVERY_QUERIES) {
    if (results.length >= maxResults) break
    
    onProgress?.(`\n📡 Query: ${baseQuery}`)
    
    const remainingSlots = maxResults - results.length
    await searchAllPages(baseQuery, dedup, results, { 
      ...options, 
      maxResults: Math.min(remainingSlots, 1000) // Code Search limit per query
    })
    
    onProgress?.(`   Total so far: ${results.length}`)
  }

  onProgress?.(`\n🎉 Discovery complete: ${results.length.toLocaleString()} unique SKILL.md files`)

  return results
}

export async function discoverSkillsSince(
  since: Date,
  options: Omit<DiscoveryOptions, "startDate"> = {}
): Promise<DiscoveredSkill[]> {
  const overlapDays = 2
  const startWithOverlap = new Date(since)
  startWithOverlap.setDate(startWithOverlap.getDate() - overlapDays)

  options.onProgress?.(`📅 Incremental discovery since ${formatDate(since)} (with ${overlapDays}d overlap)`)
  options.onProgress?.(`   Note: Date filtering applied during indexing phase`)

  return discoverSkillFiles({
    ...options,
    startDate: startWithOverlap,
    endDate: new Date(),
  })
}

const KNOWN_SKILL_REGISTRIES = [
  { owner: "moltbot", repo: "skills" },
  { owner: "VoltAgent", repo: "awesome-moltbot-skills" }, // 565+ skills
  { owner: "VoltAgent", repo: "awesome-clawdbot-skills" }, // 565+ skills (mirror)
  { owner: "anthropics", repo: "courses" },
  { owner: "sickn33", repo: "antigravity-awesome-skills" },
  { owner: "jeremylongshore", repo: "claude-code-plugins-plus-skills" },
  { owner: "aiskillstore", repo: "marketplace" },
  { owner: "majiayu000", repo: "claude-skill-registry" },
  { owner: "microck", repo: "ordinary-claude-skills" },
  { owner: "oaustegard", repo: "claude-skills" },
] as const

const SKILL_TOPICS = [
  "claude-skill",
  "claude-skills", 
  "claude-code-skill",
  "agent-skill",
  "ai-skill",
  "codex-skill",
] as const

export async function discoverFromRegistries(
  options: Pick<DiscoveryOptions, "onProgress" | "maxResults"> = {}
): Promise<DiscoveredSkill[]> {
  const { onProgress, maxResults = 500 } = options
  const results: DiscoveredSkill[] = []
  const dedup = createDeduplicationSet()

  onProgress?.(`📦 Discovering from ${KNOWN_SKILL_REGISTRIES.length} known registries`)

  for (const registry of KNOWN_SKILL_REGISTRIES) {
    if (results.length >= maxResults) break

    onProgress?.(`   Scanning ${registry.owner}/${registry.repo}...`)

    try {
      // Use GitHub Trees API to list all files recursively
      const url = `${GITHUB_API}/repos/${registry.owner}/${registry.repo}/git/trees/HEAD?recursive=1`
      const res = await fetch(url, { headers: getHeaders() })

      if (!res.ok) {
        onProgress?.(`   ⚠️ Failed to fetch ${registry.owner}/${registry.repo}: ${res.status}`)
        continue
      }

      const data = await res.json() as { tree: Array<{ path: string; sha: string; type: string }> }

      for (const item of data.tree) {
        if (results.length >= maxResults) break
        if (item.type !== "blob") continue
        if (!isValidSkillPath(item.path)) continue

        if (dedup.has(registry.owner, registry.repo, item.path)) continue

        dedup.add(registry.owner, registry.repo, item.path)
        results.push({
          owner: registry.owner,
          repo: registry.repo,
          path: item.path,
          sha: item.sha,
        })
      }

      onProgress?.(`   Found ${results.length} skills so far`)

      // Rate limit between repos
      await sleep(1000)
    } catch (error) {
      onProgress?.(`   ⚠️ Error scanning ${registry.owner}/${registry.repo}: ${error}`)
    }
  }

  onProgress?.(`\n📦 Registry discovery complete: ${results.length} skills`)

  return results
}

export async function discoverFromTopics(
  options: Pick<DiscoveryOptions, "onProgress" | "maxResults"> = {}
): Promise<DiscoveredSkill[]> {
  const { onProgress, maxResults = 500 } = options
  const results: DiscoveredSkill[] = []
  const dedup = createDeduplicationSet()
  const processedRepos = new Set<string>()

  onProgress?.(`🏷️ Discovering from ${SKILL_TOPICS.length} skill topics`)

  for (const topic of SKILL_TOPICS) {
    if (results.length >= maxResults) break

    onProgress?.(`   Topic: ${topic}`)

    try {
      // Search repos with this topic
      const searchUrl = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(`${topic} in:topics stars:>3`)}&per_page=100&sort=stars&order=desc`
      const searchRes = await fetch(searchUrl, { headers: getHeaders() })

      if (!searchRes.ok) {
        onProgress?.(`   ⚠️ Search failed: ${searchRes.status}`)
        await sleep(2000)
        continue
      }

      const searchData = await searchRes.json() as { 
        items: Array<{ 
          full_name: string
          owner: { login: string }
          name: string
          fork: boolean
          archived: boolean
        }> 
      }

      onProgress?.(`   Found ${searchData.items?.length ?? 0} repos`)

      // For each repo, check for SKILL.md files
      for (const repo of searchData.items ?? []) {
        if (results.length >= maxResults) break
        if (repo.fork || repo.archived) continue

        const repoKey = repo.full_name.toLowerCase()
        if (processedRepos.has(repoKey)) continue
        processedRepos.add(repoKey)

        // Check for SKILL.md in repo root or common locations
        const pathsToCheck = [
          "SKILL.md",
          ".claude/SKILL.md",
          ".kiro/SKILL.md",
          "skills/SKILL.md",
        ]

        for (const path of pathsToCheck) {
          try {
            const contentUrl = `${GITHUB_API}/repos/${repo.full_name}/contents/${path}`
            const contentRes = await fetch(contentUrl, { headers: getHeaders() })

            if (contentRes.ok) {
              const contentData = await contentRes.json() as { sha: string }
              
              if (!dedup.has(repo.owner.login, repo.name, path)) {
                dedup.add(repo.owner.login, repo.name, path)
                results.push({
                  owner: repo.owner.login,
                  repo: repo.name,
                  path,
                  sha: contentData.sha,
                })
                onProgress?.(`   ✓ ${repo.full_name}/${path}`)
                break // Found one, move to next repo
              }
            }
          } catch {
            // File doesn't exist, continue
          }
        }

        // Rate limit
        await sleep(200)
      }

      // Rate limit between topics
      await sleep(2000)
    } catch (error) {
      onProgress?.(`   ⚠️ Error searching topic ${topic}: ${error}`)
    }
  }

  onProgress?.(`\n🏷️ Topic discovery complete: ${results.length} skills`)

  return results
}

export async function discoverAllSkills(
  options: DiscoveryOptions = {}
): Promise<DiscoveredSkill[]> {
  const { onProgress, maxResults = 5000 } = options
  const allResults: DiscoveredSkill[] = []
  const dedup = createDeduplicationSet()

  // Phase 1: Code Search (multi-query)
  onProgress?.(`\n=== Phase 1: GitHub Code Search ===`)
  const codeSearchResults = await discoverSkillFiles({
    ...options,
    maxResults: Math.min(maxResults, 2000),
  })

  for (const item of codeSearchResults) {
    if (!dedup.has(item.owner, item.repo, item.path)) {
      dedup.add(item.owner, item.repo, item.path)
      allResults.push(item)
    }
  }

  // Phase 2: Known Registries
  if (allResults.length < maxResults) {
    onProgress?.(`\n=== Phase 2: Known Registries ===`)
    const registryResults = await discoverFromRegistries({
      onProgress,
      maxResults: maxResults - allResults.length,
    })

    for (const item of registryResults) {
      if (!dedup.has(item.owner, item.repo, item.path)) {
        dedup.add(item.owner, item.repo, item.path)
        allResults.push(item)
      }
    }
  }

  // Phase 3: Topic-based discovery
  if (allResults.length < maxResults) {
    onProgress?.(`\n=== Phase 3: Topic-based Discovery ===`)
    const topicResults = await discoverFromTopics({
      onProgress,
      maxResults: maxResults - allResults.length,
    })

    for (const item of topicResults) {
      if (!dedup.has(item.owner, item.repo, item.path)) {
        dedup.add(item.owner, item.repo, item.path)
        allResults.push(item)
      }
    }
  }

  onProgress?.(`\n🎉 Total discovered: ${allResults.length} unique skills`)

  return allResults
}
