/**
 * Categories Module
 * Unified exports for category-related functionality
 */

export { CATEGORY_CONFIG, type CategoryConfig } from "./config"

export {
  CATEGORIES,
  type CategoryDefinition,
  type CategoryId,
  type CategorySlug,
  getCategoryById,
  getCategoryBySlug,
  getCategoriesSorted,
  getAllCategoryIds,
  getAllCategorySlugs,
  toDatabaseCategory,
} from "./registry"

export {
  mapSkillToCategories,
  mapSkillToCategoryMatches,
  evaluateKeywordConfidence,
  parseTopics,
  type CategoryMatch,
  type ConfidenceLevel,
  type KeywordResult,
} from "./matcher"

export {
  assignCategoriesWithAI,
  assignCategoriesForSkill,
  type SkillForCategorization,
  type CategoryAssignment,
  type AssignOptions,
} from "./ai-assigner"

export {
  assignCategoriesAIOnly,
  clearCategoryCache,
  getCacheStats,
  type SkillInput,
  type AIOnlyResult,
  type AIOnlyOptions,
  assignCategoriesHybrid,
  type HybridResult,
  type HybridOptions,
} from "./ai-only-assigner"

export {
  validateApiKey,
  checkRateLimit,
  getRateLimitStatus,
  withRetry,
} from "./shared-utils"
