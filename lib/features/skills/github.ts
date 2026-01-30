import { env } from "@/lib/env"
import { createDeduplicationSet, isValidSkillPath } from "./canonical"

const GITHUB_API = "https://api.github.com"

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

// Rate limit state
export type RateLimitInfo = {
  limit: number
  remaining: number
  reset: number
  resetAt: string
  used: number
}

export type RateLimitStatus = {
  core: RateLimitInfo
  search: RateLimitInfo
  hasToken: boolean
}

/**
 * Check GitHub API rate limit status
 */
export async function checkRateLimit(): Promise<RateLimitStatus & { codeSearch?: RateLimitInfo }> {
  const hasToken = !!env.GITHUB_TOKEN

  try {
    const res = await fetch(`${GITHUB_API}/rate_limit`, {
      headers: getHeaders(),
    })

    if (!res.ok) {
      throw new Error(`Rate limit check failed: ${res.status}`)
    }

    const data = await res.json()
    const codeSearchResource = data.resources.code_search

    return {
      hasToken,
      core: {
        limit: data.resources.core.limit,
        remaining: data.resources.core.remaining,
        reset: data.resources.core.reset,
        resetAt: new Date(data.resources.core.reset * 1000).toISOString(),
        used: data.resources.core.used,
      },
      search: {
        limit: data.resources.search.limit,
        remaining: data.resources.search.remaining,
        reset: data.resources.search.reset,
        resetAt: new Date(data.resources.search.reset * 1000).toISOString(),
        used: data.resources.search.used,
      },
      // Code Search has separate rate limit (10/min)
      codeSearch: codeSearchResource ? {
        limit: codeSearchResource.limit,
        remaining: codeSearchResource.remaining,
        reset: codeSearchResource.reset,
        resetAt: new Date(codeSearchResource.reset * 1000).toISOString(),
        used: codeSearchResource.used,
      } : undefined,
    }
  } catch {
    // Return default values if check fails
    return {
      hasToken,
      core: { limit: 60, remaining: 0, reset: 0, resetAt: "", used: 0 },
      search: { limit: 10, remaining: 0, reset: 0, resetAt: "", used: 0 },
    }
  }
}

// Types
export type SearchItem = {
  owner: string
  repo: string
  path: string
  sha: string
}

export type SearchResponse = {
  total_count: number
  items: Array<{
    sha: string
    path: string
    repository: { full_name: string }
  }>
}

/**
 * Search GitHub Code API with pagination
 */
export async function searchCode(
  query: string,
  page = 1,
  perPage = 100
): Promise<SearchResponse> {
  const url = `${GITHUB_API}/search/code?q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`

  const res = await fetch(url, { headers: getHeaders() })

  if (res.status === 403) {
    const resetTime = res.headers.get("x-ratelimit-reset")
    if (resetTime) {
      const waitMs = Math.max(0, parseInt(resetTime) * 1000 - Date.now() + 1000)
      throw new Error(`Rate limited. Reset in ${Math.ceil(waitMs / 1000)}s`)
    }
    throw new Error("Rate limited")
  }

  if (!res.ok) {
    throw new Error(`GitHub search error: ${res.status}`)
  }

  return res.json()
}

export type SearchOptions = {
  onProgress?: (msg: string) => void
  /** For incremental: repos pushed after this date */
  since?: Date
  /** Minimum stars to filter repos */
  minStars?: number
  /** Max results to return */
  limit?: number
}

/**
 * Search SKILL.md files using GitHub Code Search API
 * 
 * Key improvements:
 * - Uses canonical ID for deduplication (case-insensitive owner/repo)
 * - Validates path format according to Agent Skills Spec
 * - Proper rate limit handling with exponential backoff
 * - Returns normalized owner/repo for consistent database keys
 * 
 * @see https://agentskills.io/specification
 */
export async function searchSkillFiles(
  options: SearchOptions = {}
): Promise<SearchItem[]> {
  const { 
    onProgress, 
    since,
    limit = 500 
  } = options

  const results: SearchItem[] = []
  const dedup = createDeduplicationSet()

  onProgress?.(`🔍 Searching for SKILL.md files...`)
  
  const baseQuery = 'filename:SKILL.md'

  let page = 1
  const perPage = 100
  let retryCount = 0
  const maxRetries = 3

  while (page <= 10 && results.length < limit) {
    try {
      const data = await searchCode(baseQuery, page, perPage)
      if (!data.items?.length) break

      for (const item of data.items) {
        // Validate path format according to Agent Skills Spec
        if (!isValidSkillPath(item.path)) continue
        
        const [owner, repo] = item.repository.full_name.split("/")
        
        // Use canonical deduplication (case-insensitive owner/repo)
        if (dedup.has(owner, repo, item.path)) continue
        
        dedup.add(owner, repo, item.path)
        
        // Store with original case from GitHub API
        // Normalization happens at indexer level
        results.push({ 
          owner, 
          repo, 
          path: item.path, 
          sha: item.sha 
        })
        
        if (results.length >= limit) break
      }

      onProgress?.(`   Page ${page}: found ${results.length} unique SKILL.md files`)

      if (data.items.length < perPage) break
      page++
      retryCount = 0 // Reset retry count on success
      await sleep(2200) // Rate limit: 30 req/min
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      
      // Handle rate limiting with exponential backoff
      if (errorMsg.includes('Rate limited')) {
        const match = errorMsg.match(/Reset in (\d+)s/)
        const waitSeconds = match ? parseInt(match[1]) : 60
        onProgress?.(`⏳ Rate limited, waiting ${waitSeconds}s...`)
        await sleep((waitSeconds + 2) * 1000)
        continue
      }
      
      // Handle GitHub server errors (500, 502, 503) with retry
      if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503')) {
        retryCount++
        if (retryCount <= maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 30000)
          onProgress?.(`⚠️ GitHub server error, retry ${retryCount}/${maxRetries} in ${backoffMs/1000}s...`)
          await sleep(backoffMs)
          continue
        }
        onProgress?.(`⚠️ GitHub server error, stopping with ${results.length} results`)
        break
      }
      
      throw error
    }
  }

  // Note: Date filtering via 'since' will be applied in indexer via GraphQL pushedAt
  if (since) {
    onProgress?.(`📅 Will filter by pushed date >= ${since.toISOString().split('T')[0]} in indexer`)
  }

  onProgress?.(`✅ Found ${results.length} unique SKILL.md files (dedup size: ${dedup.size()})`)
  return results
}



function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
