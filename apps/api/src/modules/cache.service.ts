interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private maxEntries: number;
  private hits = 0;
  private misses = 0;

  constructor(maxEntries = 5000) {
    this.maxEntries = maxEntries;

    // Background cleanup of expired entries every 2 minutes
    setInterval(() => {
      this.cleanExpired();
    }, 120_000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.hits++;
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds = 300): void {
    // If full, evict oldest entry
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total).toFixed(3) : "0.000",
    };
  }
}

export const memoryCache = new MemoryCacheService(10_000);

