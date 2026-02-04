import type { GitHubSearchResponse, LegacySkill } from "@/types"
import { env } from "@/lib/env"

const GITHUB_API_BASE = "https://api.github.com"

function getGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Skills-Directory",
  }

  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`
  }

  return headers
}

export async function searchSkills(
  query: string = "",
  page: number = 1,
  perPage: number = 30
): Promise<{ skills: LegacySkill[]; total: number }> {
  const searchQuery = `filename:SKILL.md path:skills language:Markdown "---" "name:" "description:" ${query}`

  const response = await fetch(
    `${GITHUB_API_BASE}/search/code?q=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}`,
    {
      headers: getGitHubHeaders(),
      next: { revalidate: 300 },
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    console.error("GitHub API error:", response.status, errorBody)
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const data: GitHubSearchResponse = await response.json()

  const skills = await Promise.all(
    (data.items ?? []).map(async (item) => {
      const [owner, repo] = item.repository.full_name.split("/")
      const rawUrl = `https://raw.githubusercontent.com/${item.repository.full_name}/HEAD/${item.path}`

      try {
        const parsed = await fetchAndParseSkill(rawUrl)
        return {
          ...parsed,
          owner,
          repo,
          path: item.path,
          url: item.html_url,
          rawUrl,
          stars: item.repository.stargazers_count,
          forks: item.repository.forks_count,
          updatedAt: item.repository.updated_at,
          avatarUrl: item.repository.owner?.avatar_url,
        }
      } catch {
        const skillName = item.path.split("/").slice(-2, -1)[0] || "unknown"
        return {
          name: skillName,
          description: "Failed to parse skill",
          owner,
          repo,
          path: item.path,
          url: item.html_url,
          rawUrl,
        }
      }
    })
  )

  return {
    skills: skills.filter((s) => s.name && s.description),
    total: data.total_count,
  }
}

export async function fetchAndParseSkill(
  rawUrl: string
): Promise<Pick<LegacySkill, "name" | "description" | "compatibility" | "metadata" | "allowedTools">> {
  const response = await fetch(rawUrl, { next: { revalidate: 3600 } })

  if (!response.ok) {
    throw new Error(`Failed to fetch skill: ${response.status}`)
  }

  const content = await response.text()
  return parseSkillMd(content)
}

export type RepoInfo = {
  stars: number
  forks: number
  updatedAt: string
  avatarUrl: string
  openIssues: number
  topics: string[]
}

export async function fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo | null> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}`,
      {
        headers: getGitHubHeaders(),
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    return {
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      updatedAt: data.pushed_at || data.updated_at,
      avatarUrl: data.owner?.avatar_url || "",
      openIssues: data.open_issues_count || 0,
      topics: data.topics || [],
    }
  } catch {
    return null
  }
}

export function parseSkillMd(content: string): Pick<LegacySkill, "name" | "description" | "compatibility" | "metadata" | "allowedTools"> {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)

  if (!frontmatterMatch) {
    throw new Error("No frontmatter found")
  }

  const frontmatter = frontmatterMatch[1]

  const getName = (text: string): string => {
    const match = text.match(/^name:\s*["']?([^"'\n]+)["']?\s*$/m)
    return match?.[1]?.trim() || ""
  }

  const getDescription = (text: string): string => {
    const match = text.match(/^description:\s*["']?([\s\S]*?)["']?\s*(?=\n\w|$)/m)
    if (match) {
      return match[1]
        .replace(/\n\s+/g, " ")
        .trim()
        .replace(/["']$/, "")
    }
    return ""
  }

  const getCompatibility = (text: string): string | undefined => {
    const match = text.match(/^compatibility:\s*["']?([^"'\n]+)["']?\s*$/m)
    return match?.[1]?.trim()
  }

  const getAllowedTools = (text: string): string[] | undefined => {
    const match = text.match(/^allowed-tools:\s*["']?([^"'\n]+)["']?\s*$/m)
    if (match) {
      return match[1].trim().split(/\s+/)
    }
    return undefined
  }

  return {
    name: getName(frontmatter),
    description: getDescription(frontmatter),
    compatibility: getCompatibility(frontmatter),
    allowedTools: getAllowedTools(frontmatter),
  }
}
