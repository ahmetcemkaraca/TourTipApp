import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheService } from '@/lib/cache-service';
import type { CacheStrategy } from '@/types/cache';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Memory Cache', () => {
    it('should store and retrieve data from memory cache', async () => {
      const testData = { id: 1, name: 'Test' };
      const cacheKey = 'test-key';

      await cacheService.set(cacheKey, testData, 'CacheFirst');
      const result = await cacheService.get(cacheKey);

      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle TTL expiration', async () => {
      const testData = { id: 1, name: 'Test' };
      const cacheKey = 'test-key';

      await cacheService.set(cacheKey, testData, 'CacheFirst', { ttl: 100 });
      
      // Should be available immediately
      let result = await cacheService.get(cacheKey);
      expect(result).toEqual(testData);

      // Mock time passage
      vi.advanceTimersByTime(150);

      // Should be expired
      result = await cacheService.get(cacheKey);
      expect(result).toBeNull();
    });
  });

  describe('LocalStorage Cache', () => {
    it('should fallback to localStorage when memory cache misses', async () => {
      const testData = { id: 1, name: 'Test' };
      const cacheKey = 'test-key';

      // Set data in localStorage directly
      localStorageMock.setItem.mockImplementation((key, value) => {
        if (key === `cache_${cacheKey}`) {
          localStorageMock.getItem.mockReturnValue(value);
        }
      });

      localStorageMock.setItem(
        `cache_${cacheKey}`,
        JSON.stringify({
          data: testData,
          timestamp: Date.now(),
          ttl: 60000
        })
      );

      const result = await cacheService.get(cacheKey);
      expect(result).toEqual(testData);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(`cache_${cacheKey}`);
    });

    it('should handle localStorage errors gracefully', async () => {
      const testData = { id: 1, name: 'Test' };
      const cacheKey = 'test-key';

      // Mock localStorage error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      await expect(
        cacheService.set(cacheKey, testData, 'CacheFirst')
      ).resolves.not.toThrow();
    });
  });

  describe('Cache Strategies', () => {
    it('should implement CacheFirst strategy', async () => {
      const testData = { id: 1, name: 'Test' };
      const cacheKey = 'test-key';
      const fetchFn = vi.fn().mockResolvedValue(testData);

      const result = await cacheService.getWithStrategy(
        cacheKey,
        fetchFn,
        'CacheFirst'
      );

      expect(result).toEqual(testData);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const cachedResult = await cacheService.getWithStrategy(
        cacheKey,
        fetchFn,
        'CacheFirst'
      );

      expect(cachedResult).toEqual(testData);
      expect(fetchFn).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should implement NetworkFirst strategy', async () => {
      const testData = { id: 1, name: 'Test' };
      const updatedData = { id: 1, name: 'Updated' };
      const cacheKey = 'test-key';
      const fetchFn = vi.fn()
        .mockResolvedValueOnce(testData)
        .mockResolvedValueOnce(updatedData);

      // First call
      const result1 = await cacheService.getWithStrategy(
        cacheKey,
        fetchFn,
        'NetworkFirst'
      );

      expect(result1).toEqual(testData);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Second call should try network first
      const result2 = await cacheService.getWithStrategy(
        cacheKey,
        fetchFn,
        'NetworkFirst'
      );

      expect(result2).toEqual(updatedData);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('should implement StaleWhileRevalidate strategy', async () => {
      const testData = { id: 1, name: 'Test' };
      const updatedData = { id: 1, name: 'Updated' };
      const cacheKey = 'test-key';
      const fetchFn = vi.fn()
        .mockResolvedValueOnce(testData)
        .mockResolvedValueOnce(updatedData);

      // First call
      const result1 = await cacheService.getWithStrategy(
        cacheKey,
        fetchFn,
        'StaleWhileRevalidate'
      );

      expect(result1).toEqual(testData);

      // Second call should return cached data immediately
      const result2 = await cacheService.getWithStrategy(
        cacheKey,
        fetchFn,
        'StaleWhileRevalidate'
      );

      expect(result2).toEqual(testData); // Stale data returned immediately
    });
  });

  describe('Cache Management', () => {
    it('should clear specific cache entries', async () => {
      const testData = { id: 1, name: 'Test' };
      const cacheKey = 'test-key';

      await cacheService.set(cacheKey, testData, 'CacheFirst');
      await cacheService.delete(cacheKey);

      const result = await cacheService.get(cacheKey);
      expect(result).toBeNull();
    });

    it('should clear all cache entries', async () => {
      const testData1 = { id: 1, name: 'Test1' };
      const testData2 = { id: 2, name: 'Test2' };

      await cacheService.set('key1', testData1, 'CacheFirst');
      await cacheService.set('key2', testData2, 'CacheFirst');

      await cacheService.clear();

      const result1 = await cacheService.get('key1');
      const result2 = await cacheService.get('key2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should provide cache statistics', () => {
      const stats = cacheService.getStats();

      expect(stats).toHaveProperty('memoryEntries');
      expect(stats).toHaveProperty('memorySize');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(typeof stats.memoryEntries).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });
  });
});
