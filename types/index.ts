// Re-export database types
export type { Skill, Category, SyncJob } from "@/lib/db/schema"

// Skill list item (subset of fields for listing)
export type SkillListItem = Pick<
  import("@/lib/db/schema").Skill,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "owner"
  | "repo"
  | "path"
  | "url"
  | "avatarUrl"
  | "stars"
  | "isVerifiedOrg"
  | "status"
  | "fileUpdatedAt"
  | "repoUpdatedAt"
  | "indexedAt"
  | "securityScan"
> & {
  updatedAtLabel?: string | null
}

// Extend Skill type with additional fields
export type CategorySummary = Omit<
  import("@/lib/db/schema").Category,
  "createdAt"
> & { createdAt?: Date | null }

export type SkillWithCategories = import("@/lib/db/schema").Skill & {
  categories?: CategorySummary[]
  category?: CategorySummary | null
}

// Re-export category types
export type { CategoryDefinition, CategoryId, CategorySlug } from "@/lib/categories"

// Legacy type for GitHub API (still used by github.ts)
export type LegacySkill = {
  name: string
  description: string
  compatibility?: string
  metadata?: Record<string, string>
  allowedTools?: string[]
  owner: string
  repo: string
  path: string
  url: string
  rawUrl: string
  stars?: number
  forks?: number
  updatedAt?: string
  avatarUrl?: string
}

export type SkillSearchResult = {
  skills: LegacySkill[]
  total: number
  page: number
  perPage: number
  totalPages?: number
}

export type GitHubSearchItem = {
  name: string
  path: string
  sha: string
  repository: {
    full_name: string
    html_url: string
    stargazers_count?: number
    forks_count?: number
    updated_at?: string
    owner?: {
      avatar_url?: string
    }
  }
  html_url: string
  url: string
}

export type GitHubSearchResponse = {
  total_count: number
  incomplete_results: boolean
  items: GitHubSearchItem[]
}
