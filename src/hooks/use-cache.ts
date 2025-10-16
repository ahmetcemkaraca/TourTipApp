'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CacheStrategy,
  CacheStorageType,
  UseCacheResult,
  UseFirestoreCacheResult,
  UseCacheManagerResult,
  UseOfflineQueueResult,
  CacheConfig,
  CacheStats,
  CachePolicy,
  CacheInvalidation,
  OfflineOperation,
  OfflineQueueItem,
  CacheMetrics
} from '@/types/cache';
import CacheService from '@/lib/cache-service';
import { doc, getDoc, onSnapshot, enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Main cache hook
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    strategy?: CacheStrategy;
    ttl?: number;
    enabled?: boolean;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  }
): UseCacheResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cached, setCached] = useState(false);
  const [stale, setStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const cacheService = CacheService.getInstance();
  const fetcherRef = useRef(fetcher);
  const optionsRef = useRef(options);

  // Update refs when props change
  useEffect(() => {
    fetcherRef.current = fetcher;
    optionsRef.current = options;
  }, [fetcher, options]);

  const fetchData = useCallback(async (useCache: boolean = true): Promise<T | null> => {
    if (optionsRef.current?.enabled === false) return null;

    setLoading(true);
    setError(null);

    try {
      // Try cache first if enabled
      if (useCache) {
        const cachedData = await cacheService.get<T>(key);
        if (cachedData !== null) {
          setData(cachedData);
          setCached(true);
          setStale(false);
          setLastUpdated(Date.now());
          setLoading(false);
          return cachedData;
        }
      }

      // Fetch fresh data
      const freshData = await fetcherRef.current();
      
      // Cache the result
      await cacheService.set(key, freshData, {
        ttl: optionsRef.current?.ttl,
      });

      setData(freshData);
      setCached(false);
      setStale(false);
      setLastUpdated(Date.now());
      setLoading(false);

      return freshData;
    } catch (err) {
      setError(err as Error);
      setLoading(false);

      // Try to serve stale data on error
      const staleData = await cacheService.get<T>(key);
      if (staleData !== null) {
        setData(staleData);
        setCached(true);
        setStale(true);
        return staleData;
      }

      return null;
    }
  }, [key, cacheService]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle revalidation on focus
  useEffect(() => {
    if (!optionsRef.current?.revalidateOnFocus) return;

    const handleFocus = () => {
      fetchData(false); // Force fresh fetch
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData]);

  // Handle revalidation on reconnect
  useEffect(() => {
    if (!optionsRef.current?.revalidateOnReconnect) return;

    const handleOnline = () => {
      fetchData(false); // Force fresh fetch
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(false), [fetchData]);

  const invalidate = useCallback(async () => {
    await cacheService.remove(key);
    setCached(false);
    setStale(false);
  }, [key, cacheService]);

  const update = useCallback(async (newData: T) => {
    await cacheService.set(key, newData);
    setData(newData);
    setCached(true);
    setStale(false);
    setLastUpdated(Date.now());
  }, [key, cacheService]);

  const remove = useCallback(async () => {
    await cacheService.remove(key);
    setData(null);
    setCached(false);
    setStale(false);
    setLastUpdated(null);
  }, [key, cacheService]);

  return {
    data,
    loading,
    error,
    cached,
    stale,
    lastUpdated,
    refetch,
    invalidate,
    update,
    remove,
  };
}

// Firestore specific cache hook
export function useFirestoreCache<T>(
  collection: string,
  documentId?: string,
  options?: {
    realtime?: boolean;
    offline?: boolean;
  }
): UseFirestoreCacheResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!documentId) return;

    setLoading(true);
    setError(null);

    const docRef = doc(db, collection, documentId);

    if (options?.realtime) {
      // Real-time listener
      const unsubscribe = onSnapshot(
        docRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (snapshot.exists()) {
            setData(snapshot.data() as T);
            setFromCache(snapshot.metadata.fromCache);
            setHasPendingWrites(snapshot.metadata.hasPendingWrites);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          setError(err as Error);
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } else {
      // One-time fetch
      getDoc(docRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setData(snapshot.data() as T);
            setFromCache(snapshot.metadata.fromCache);
            setHasPendingWrites(snapshot.metadata.hasPendingWrites);
          } else {
            setData(null);
          }
          setLoading(false);
        })
        .catch((err) => {
          setError(err as Error);
          setLoading(false);
        });
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [collection, documentId, options?.realtime]);

  const refresh = useCallback(async () => {
    if (!documentId) return;

    setLoading(true);
    try {
      const docRef = doc(db, collection, documentId);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        setData(snapshot.data() as T);
        setFromCache(snapshot.metadata.fromCache);
        setHasPendingWrites(snapshot.metadata.hasPendingWrites);
      } else {
        setData(null);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [collection, documentId]);

  const sync = useCallback(async () => {
    try {
      await enableNetwork(db);
      await refresh();
    } catch (err) {
      setError(err as Error);
    }
  }, [refresh]);

  const clearCache = useCallback(async () => {
    // This would clear Firestore offline cache
    console.log('Firestore cache clear not implemented');
  }, []);

  const enableOffline = useCallback(async () => {
    try {
      await disableNetwork(db);
      setOffline(true);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const disableOfflineMode = useCallback(async () => {
    try {
      await enableNetwork(db);
      setOffline(false);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  return {
    data,
    loading,
    error,
    offline,
    hasPendingWrites,
    fromCache,
    refresh,
    sync,
    clearCache,
    enableOffline,
    disableOffline: disableOfflineMode,
  };
}

// Cache manager hook
export function useCacheManager(): UseCacheManagerResult {
  const [stats, setStats] = useState<CacheStats>({
    size: 0,
    entries: 0,
    hitRate: 0,
    missRate: 0,
    evictions: 0,
    lastCleanup: 0,
    memoryUsage: 0,
  });
  const [policies, setPolicies] = useState<CachePolicy[]>([]);

  const cacheService = CacheService.getInstance();

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      setStats(cacheService.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [cacheService]);

  const set = useCallback(async <T>(key: string, data: T, options?: any) => {
    await cacheService.set(key, data, options);
    setStats(cacheService.getStats());
  }, [cacheService]);

  const get = useCallback(async <T>(key: string): Promise<T | null> => {
    const result = await cacheService.get<T>(key);
    setStats(cacheService.getStats());
    return result;
  }, [cacheService]);

  const remove = useCallback(async (key: string) => {
    await cacheService.remove(key);
    setStats(cacheService.getStats());
  }, [cacheService]);

  const clear = useCallback(async () => {
    await cacheService.clear();
    setStats(cacheService.getStats());
  }, [cacheService]);

  const addPolicy = useCallback((policy: CachePolicy) => {
    cacheService.addPolicy(policy);
    setPolicies(prev => [...prev, policy]);
  }, [cacheService]);

  const removePolicy = useCallback((key: string) => {
    cacheService.removePolicy(key);
    setPolicies(prev => prev.filter(p => p.key !== key));
  }, [cacheService]);

  const updatePolicy = useCallback((key: string, updates: Partial<CachePolicy>) => {
    cacheService.updatePolicy(key, updates);
    setPolicies(prev => prev.map(p => p.key === key ? { ...p, ...updates } : p));
  }, [cacheService]);

  const invalidate = useCallback(async (options: CacheInvalidation) => {
    await cacheService.invalidate(options);
    setStats(cacheService.getStats());
  }, [cacheService]);

  const invalidateByTag = useCallback(async (tags: string[]) => {
    await cacheService.invalidateByTag(tags);
    setStats(cacheService.getStats());
  }, [cacheService]);

  const invalidatePattern = useCallback(async (pattern: string | RegExp) => {
    await cacheService.invalidatePattern(pattern);
    setStats(cacheService.getStats());
  }, [cacheService]);

  const cleanup = useCallback(async () => {
    await cacheService.cleanup();
    setStats(cacheService.getStats());
  }, [cacheService]);

  const compress = useCallback(async () => {
    await cacheService.compress();
    setStats(cacheService.getStats());
  }, [cacheService]);

  const backup = useCallback(async () => {
    // This would create a backup
    const inspection = cacheService.inspect();
    return {
      id: `backup_${Date.now()}`,
      timestamp: Date.now(),
      version: '1.0',
      size: stats.size,
      entries: Object.fromEntries(inspection.cache.map(entry => [entry.key, entry])),
      metadata: {
        created_at: new Date(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        source: 'manual' as const,
      },
    };
  }, [cacheService, stats.size]);

  const restore = useCallback(async (backupData: any) => {
    await cacheService.clear();
    
    for (const [key, entry] of Object.entries(backupData.entries)) {
      await cacheService.set(key, (entry as any).data, entry as any);
    }
    
    setStats(cacheService.getStats());
  }, [cacheService]);

  const updateConfig = useCallback((config: Partial<CacheConfig>) => {
    cacheService.updateConfig(config);
  }, [cacheService]);

  const getConfig = useCallback(() => {
    return cacheService.getConfig();
  }, [cacheService]);

  return {
    stats,
    policies,
    set,
    get,
    remove,
    clear,
    addPolicy,
    removePolicy,
    updatePolicy,
    invalidate,
    invalidateByTag,
    invalidatePattern,
    cleanup,
    compress,
    backup,
    restore,
    updateConfig,
    getConfig,
  };
}

// Offline queue hook
export function useOfflineQueue(): UseOfflineQueueResult {
  const [items, setItems] = useState<OfflineQueueItem[]>([]);
  const [processing, setProcessing] = useState(false);

  const cacheService = CacheService.getInstance();

  // Update items from cache service
  useEffect(() => {
    const updateItems = () => {
      const inspection = cacheService.inspect();
      setItems(inspection.queue);
    };

    updateItems();
    const interval = setInterval(updateItems, 1000); // Every second

    return () => clearInterval(interval);
  }, [cacheService]);

  const enqueue = useCallback((
    operation: OfflineOperation,
    data: any,
    options?: Partial<OfflineQueueItem>
  ) => {
    cacheService.enqueue(operation, data, options);
  }, [cacheService]);

  const dequeue = useCallback((): OfflineQueueItem | null => {
    // This would dequeue from the service
    return items.length > 0 ? items[0] : null;
  }, [items]);

  const peek = useCallback((): OfflineQueueItem | null => {
    return items.length > 0 ? items[0] : null;
  }, [items]);

  const clear = useCallback(() => {
    // This would clear the queue in the service
    console.log('Clear queue not implemented');
  }, []);

  const process = useCallback(async () => {
    setProcessing(true);
    try {
      await cacheService.processOfflineQueue();
    } finally {
      setProcessing(false);
    }
  }, [cacheService]);

  const processItem = useCallback(async (id: string): Promise<boolean> => {
    // This would process a specific item
    console.log('Process specific item not implemented:', id);
    return false;
  }, []);

  const retry = useCallback(async (id: string): Promise<boolean> => {
    // This would retry a specific item
    console.log('Retry specific item not implemented:', id);
    return false;
  }, []);

  const isPending = useCallback((id: string): boolean => {
    return items.some(item => item.id === id);
  }, [items]);

  const getStatus = useCallback(() => {
    const pending = items.filter(item => item.retries < item.maxRetries).length;
    const failed = items.filter(item => item.retries >= item.maxRetries).length;
    
    return {
      pending,
      failed,
      completed: 0, // Would track completed items
    };
  }, [items]);

  return {
    items,
    size: items.length,
    processing,
    enqueue,
    dequeue,
    peek,
    clear,
    process,
    processItem,
    retry,
    isPending,
    getStatus,
  };
}

// Specialized hooks
export function useCachedQuery<T>(
  queryKey: string,
  query: () => Promise<T>,
  options?: { ttl?: number; staleTime?: number }
) {
  const cacheKey = `query:${queryKey}`;
  
  return useCache(cacheKey, query, {
    ttl: options?.ttl || 300, // 5 minutes default
    strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
  });
}

export function useCachedFirestoreDoc<T>(collection: string, docId: string) {
  return useFirestoreCache<T>(collection, docId, {
    realtime: true,
    offline: true,
  });
}

export function useCacheMetrics(): { metrics: CacheMetrics; refresh: () => void } {
  const [metrics, setMetrics] = useState<CacheMetrics>({
    requests: { total: 0, hits: 0, misses: 0, errors: 0 },
    storage: { used: 0, available: 0, quota: 0, efficiency: 0 },
    performance: { averageReadTime: 0, averageWriteTime: 0, compressionRatio: 0, evictionRate: 0 },
    offline: { queueSize: 0, syncErrors: 0, lastSync: 0, conflictCount: 0 },
  });

  const cacheService = CacheService.getInstance();

  const refresh = useCallback(() => {
    setMetrics(cacheService.getMetrics());
  }, [cacheService]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { metrics, refresh };
}

export default useCache;
