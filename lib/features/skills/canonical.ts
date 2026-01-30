export type SkillIdentity = {
  owner: string      // Lowercase, trimmed
  repo: string       // Lowercase, trimmed
  path: string       // Original case, normalized slashes
  canonicalId: string // Unique identifier: owner/repo/path
}

export function validateSkillName(name: string): { valid: boolean; error?: string; strict: boolean } {
  if (!name || name.length === 0) {
    return { valid: false, error: "Name is required", strict: false }
  }
  
  if (name.length > 64) {
    return { valid: false, error: "Name must be max 64 characters", strict: false }
  }
  
  const isStrictValid = /^[a-z0-9-]+$/.test(name) && 
    !name.startsWith("-") && 
    !name.endsWith("-") && 
    !name.includes("--")
  
  if (!isStrictValid) {
    return { 
      valid: true, 
      error: "Name doesn't follow strict Agent Skills Spec (will be normalized)", 
      strict: false 
    }
  }
  
  return { valid: true, strict: true }
}

export function normalizeSkillName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")           // spaces to hyphens
    .replace(/[^a-z0-9-]/g, "")     // remove invalid chars
    .replace(/-+/g, "-")            // multiple hyphens to single
    .replace(/^-+|-+$/g, "")        // trim hyphens
    .slice(0, 64)                   // max 64 chars
}

export function normalizeOwner(owner: string): string {
  return owner.toLowerCase().trim()
}

export function normalizeRepo(repo: string): string {
  return repo.toLowerCase().trim()
}

export function normalizePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .trim()
}

export function toSkillIdentity(owner: string, repo: string, path: string): SkillIdentity {
  const normalizedOwner = normalizeOwner(owner)
  const normalizedRepo = normalizeRepo(repo)
  const normalizedPath = normalizePath(path)
  
  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
    path: normalizedPath,
    canonicalId: `${normalizedOwner}/${normalizedRepo}/${normalizedPath}`,
  }
}

export function toCanonicalId(owner: string, repo: string, path: string): string {
  return toSkillIdentity(owner, repo, path).canonicalId
}

export function parseCanonicalId(id: string): SkillIdentity | null {
  const parts = id.split("/")
  if (parts.length < 3) return null
  
  const owner = parts[0]
  const repo = parts[1]
  const path = parts.slice(2).join("/")
  
  return toSkillIdentity(owner, repo, path)
}

export function isValidSkillPath(path: string): boolean {
  const normalized = normalizePath(path)
  const filename = normalized.split("/").pop() ?? ""
  return filename === "SKILL.md"
}

export function getSkillDirectory(path: string): string {
  const normalized = normalizePath(path)
  const lastSlash = normalized.lastIndexOf("/")
  return lastSlash > 0 ? normalized.substring(0, lastSlash) : ""
}

export function validateDescription(description: string): { valid: boolean; error?: string } {
  if (!description || description.length === 0) {
    return { valid: false, error: "Description is required" }
  }
  
  if (description.length > 1024) {
    return { valid: false, error: "Description must be max 1024 characters" }
  }
  
  const minMeaningfulLength = 10
  if (description.trim().length < minMeaningfulLength) {
    return { valid: false, error: `Description too short (min ${minMeaningfulLength} chars)` }
  }
  
  return { valid: true }
}

/**
 * Check if a SKILL.md is likely a real Agent Skill
 * (not just a random file named SKILL.md)
 * 
 * Heuristics:
 * - Has valid frontmatter with name and description
 * - Name looks like a skill name (not random text)
 * - Description is meaningful
 */
export function isLikelyAgentSkill(name: string, description: string): boolean {
  // Name validation
  const nameValidation = validateSkillName(name)
  if (!nameValidation.valid) return false
  
  // Description validation
  const descValidation = validateDescription(description)
  if (!descValidation.valid) return false
  
  // Additional heuristics
  const suspiciousPatterns = [
    /^test$/i,
    /^example$/i,
    /^sample$/i,
    /^demo$/i,
    /^todo$/i,
    /^placeholder$/i,
    /^untitled$/i,
  ]
  
  if (suspiciousPatterns.some(p => p.test(name.trim()))) {
    return false
  }
  
  return true
}

/**
 * Create source key for database unique constraint
 * This is used for ON CONFLICT matching
 */
export function toSourceKey(owner: string, repo: string, path: string): string {
  return toCanonicalId(owner, repo, path)
}

/**
 * Deduplicate skill items by canonical ID
 * Returns unique items, keeping the first occurrence
 */
export function deduplicateSkills<T extends { owner: string; repo: string; path: string }>(
  items: T[]
): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  
  for (const item of items) {
    const id = toCanonicalId(item.owner, item.repo, item.path)
    if (!seen.has(id)) {
      seen.add(id)
      result.push(item)
    }
  }
  
  return result
}

/**
 * Create a deduplication set for efficient lookups
 */
export function createDeduplicationSet(): {
  has: (owner: string, repo: string, path: string) => boolean
  add: (owner: string, repo: string, path: string) => void
  size: () => number
} {
  const set = new Set<string>()
  
  return {
    has: (owner, repo, path) => set.has(toCanonicalId(owner, repo, path)),
    add: (owner, repo, path) => set.add(toCanonicalId(owner, repo, path)),
    size: () => set.size,
  }
}
