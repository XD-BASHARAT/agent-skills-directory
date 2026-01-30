// Canonical ID utilities
export {
  toSkillIdentity,
  toCanonicalId,
  parseCanonicalId,
  toSourceKey,
  normalizeOwner,
  normalizeRepo,
  normalizePath,
  isValidSkillPath,
  getSkillDirectory,
  validateSkillName,
  validateDescription,
  deduplicateSkills,
  createDeduplicationSet,
  type SkillIdentity,
} from "./canonical"

// GitHub API
export {
  searchSkillFiles,
  searchCode,
  checkRateLimit,
  type SearchItem,
  type SearchOptions,
  type SearchResponse,
  type RateLimitInfo,
  type RateLimitStatus,
} from "./github"

// GraphQL API
export {
  batchFetchSkills,
  batchFetchRepoMetadata,
  shardedCodeSearch,
  type SkillFullData,
  type RepoMetadata,
} from "./github-graphql"

// Indexer
export {
  indexSkills,
  indexSingleSkill,
  type IndexResult,
  type IndexOptions,
  type ErrorType,
} from "./indexer"

// Discovery (adaptive date sharding)
export {
  discoverSkillFiles,
  discoverSkillsSince,
  type DiscoveredSkill,
  type DiscoveryOptions,
} from "./discovery"

// Sync
export {
  syncSingleSkill,
  syncIfChanged,
} from "./sync"

// Parser
export {
  parseSkillMd,
  normalizeAllowedTools,
  normalizeTags,
  type ParsedSkill,
  type ParseResult,
} from "./parser"

// Category Mapper (re-export from centralized module)
export {
  mapSkillToCategories,
  parseTopics,
} from "@/lib/categories"
