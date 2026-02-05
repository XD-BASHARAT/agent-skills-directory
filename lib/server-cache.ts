type CacheEntry<T> = {
  value: T
  expiresAt: number
  createdAt: number
}

const MAX_ENTRIES = 500
const cache = new Map<string, CacheEntry<unknown>>()

// Cache statistics for monitoring
const cacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
}

function enforceLimit() {
  while (cache.size > MAX_ENTRIES) {
    // Remove oldest entries first (LRU-like behavior)
    const oldestKey = cache.keys().next().value
    if (!oldestKey) {
      break
    }
    cache.delete(oldestKey)
    cacheStats.evictions++
  }
}

export async function withServerCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const now = Date.now()
  const existing = cache.get(key)

  if (existing && existing.expiresAt > now) {
    cacheStats.hits++
    // Refresh LRU order on hit
    cache.delete(key)
    cache.set(key, existing)
    return existing.value as T
  }

  cacheStats.misses++

  if (existing) {
    cache.delete(key)
  }

  try {
    const value = await fn()
    cache.set(key, { 
      value, 
      expiresAt: now + ttlMs,
      createdAt: now 
    })
    enforceLimit()
    return value
  } catch (error) {
    cache.delete(key)
    throw error
  }
}

// Cache invalidation helper
export function invalidateCache(pattern?: string) {
  if (!pattern) {
    cache.clear()
    return
  }
  
  const regex = new RegExp(pattern)
  for (const [key] of cache) {
    if (regex.test(key)) {
      cache.delete(key)
    }
  }
}

// Get cache statistics (for monitoring)
export function getCacheStats() {
  return {
    ...cacheStats,
    size: cache.size,
    maxSize: MAX_ENTRIES,
    hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0,
  }
}
