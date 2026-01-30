import { Redis } from "@upstash/redis"

// Singleton Redis client
// Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env
export const redis = Redis.fromEnv()

// Helper for typed get operations
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key)
  } catch (error) {
    console.error(`Redis get error for key ${key}:`, error)
    return null
  }
}

// Helper for set with TTL (in seconds)
export async function setInCache<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  try {
    if (ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds })
    } else {
      await redis.set(key, value)
    }
  } catch (error) {
    console.error(`Redis set error for key ${key}:`, error)
  }
}

// Helper for delete
export async function deleteFromCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error(`Redis delete error for key ${key}:`, error)
  }
}

// Cache keys constants
export const CACHE_KEYS = {
  // Skills
  skill: (owner: string, name: string) => `skill:${owner}:${name}`,
  skillsList: (page: number, limit: number) => `skills:list:${page}:${limit}`,
  featuredSkills: "skills:featured",
  
  // Categories
  categories: "categories:all",
  categorySkills: (slug: string) => `category:${slug}:skills`,
  
  // Stats
  stats: "stats:global",
  
  // Rate limiting prefixes
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
} as const

// TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  DAY: 86400,          // 24 hours
} as const
