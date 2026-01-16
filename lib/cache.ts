/**
 * Simple in-memory cache with TTL
 * For light server-side caching of expensive but stable queries
 */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get or set cache entry with TTL
 * @param key - Cache key
 * @param ttlMs - Time-to-live in milliseconds
 * @param factory - Async function to generate value if not cached
 */
export async function getOrSet<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key) as CacheEntry<T> | undefined;

  if (existing && existing.expiresAt > now) {
    return existing.value;
  }

  const value = await factory();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

/**
 * Invalidate a specific cache key
 */
export function invalidate(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all keys matching a prefix
 */
export function invalidatePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear entire cache (for testing/emergencies)
 */
export function clearAll(): void {
  cache.clear();
}

/**
 * Get cache stats (for monitoring)
 */
export function getStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

// Cleanup expired entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt <= now) {
        cache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
