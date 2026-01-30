/**
 * Category Assignment Configuration
 * Centralized config for AI categorization settings
 */

export const CATEGORY_CONFIG = {
  SYNC_WINDOW_MS: 55 * 60 * 1000,
  MAX_BATCH_SIZE: 50,
  PRO_BATCH_SIZE: 20,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TOPICS_COUNT: 10,
  MAX_CATEGORIES_PER_SKILL: 3,

  MODELS: {
    DEFAULT: "gemini-2.5-flash-lite",
    PRO: "gemini-2.5-pro-preview-06-05",
  },

  RATE_LIMIT: {
    MAX_REQUESTS_PER_DAY: 1000,
    WINDOW_MS: 24 * 60 * 60 * 1000,
  },

  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY_MS: 1000,
    MAX_DELAY_MS: 10000,
  },
} as const

export type CategoryConfig = typeof CATEGORY_CONFIG
