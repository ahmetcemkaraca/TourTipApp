'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { enableNetwork, disableNetwork, connectFirestoreEmulator } from 'firebase/firestore';

interface CacheEntry<T = any> {
  id: string;
  data: T;
  timestamp: Date;
  expiresAt?: Date;
  version: number;
}

interface CacheConfig {
  collectionName: string;
  ttl?: number; // Time to live in milliseconds
  maxEntries?: number;
  enableOffline?: boolean;
}

interface OfflineQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: Date;
  retryCount: number;
}

export function useOfflineCache<T = any>(config: CacheConfig) {
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);

  // Initialize cache from localStorage
  useEffect(() => {
    const loadCache = () => {
      try {
        const stored = localStorage.getItem(`cache_${config.collectionName}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const cacheMap = new Map<string, CacheEntry<T>>();
          Object.entries(parsed).forEach(([key, value]: [string, any]) => {
            cacheMap.set(key, {
              ...value,
              timestamp: new Date(value.timestamp),
              expiresAt: value.expiresAt ? new Date(value.expiresAt) : undefined,
            });
          });
          setCache(cacheMap);
        }
      } catch (error) {
        console.warn('Error loading cache:', error);
      }
    };

    loadCache();
  }, [config.collectionName]);

  // Save cache to localStorage
  useEffect(() => {
    const saveCache = () => {
      try {
        const cacheObject = Object.fromEntries(cache);
        localStorage.setItem(`cache_${config.collectionName}`, JSON.stringify(cacheObject));
      } catch (error) {
        console.warn('Error saving cache:', error);
      }
    };

    if (cache.size > 0) {
      saveCache();
    }
  }, [cache, config.collectionName]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Clean expired cache entries
  useEffect(() => {
    const cleanExpired = () => {
      const now = new Date();
      setCache(prev => {
        const newCache = new Map(prev);
        for (const [key, entry] of newCache) {
          if (entry.expiresAt && entry.expiresAt < now) {
            newCache.delete(key);
          }
        }
        return newCache;
      });
    };

    const interval = setInterval(cleanExpired, 60000); // Clean every minute
    return () => clearInterval(interval);
  }, []);

  // Enable/disable network based on config
  useEffect(() => {
    if (config.enableOffline && !isOnline) {
      disableNetwork(db).catch(error => {
        console.warn('Error disabling network:', error);
      });
    } else if (isOnline) {
      enableNetwork(db).catch(error => {
        console.warn('Error enabling network:', error);
      });
    }
  }, [config.enableOffline, isOnline]);

  // Get data from cache or Firestore
  const getData = useCallback(async (
    id: string,
    constraints?: QueryConstraint[]
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = cache.get(id);
      if (cached && (!cached.expiresAt || cached.expiresAt > new Date())) {
        setIsLoading(false);
        return cached.data;
      }

      // Fetch from Firestore
      let queryRef = collection(db, config.collectionName);

      if (constraints) {
        queryRef = query(queryRef, ...constraints);
      }

      if (id !== 'all') {
        queryRef = doc(db, config.collectionName, id);
        const docSnap = await getDocs(query(queryRef as any));
        if (!docSnap.empty) {
          const data = { id, ...docSnap.docs[0].data() } as T;

          // Cache the result
          setCache(prev => prev.set(id, {
            id,
            data,
            timestamp: new Date(),
            expiresAt: config.ttl ? new Date(Date.now() + config.ttl) : undefined,
            version: 1,
          }));

          setIsLoading(false);
          return data;
        }
      } else {
        const snapshot = await getDocs(queryRef);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];

        // Cache all results
        const newCache = new Map(cache);
        data.forEach(item => {
          if (typeof item === 'object' && item !== null && 'id' in item) {
            newCache.set((item as any).id, {
              id: (item as any).id,
              data: item,
              timestamp: new Date(),
              expiresAt: config.ttl ? new Date(Date.now() + config.ttl) : undefined,
              version: 1,
            });
          }
        });
        setCache(newCache);

        setIsLoading(false);
        return data as any;
      }

      setIsLoading(false);
      return null;
    } catch (error) {
      console.error('Error getting data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');

      // Return cached data if available
      const cached = cache.get(id);
      if (cached) {
        setIsLoading(false);
        return cached.data;
      }

      setIsLoading(false);
      throw error;
    }
  }, [cache, config.collectionName, config.ttl]);

  // Set data (create/update)
  const setData = useCallback(async (
    id: string,
    data: Partial<T>,
    options?: { offlineFirst?: boolean }
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const docRef = doc(db, config.collectionName, id);

      if (!isOnline || options?.offlineFirst) {
        // Queue for offline sync
        const queueItem: OfflineQueueItem = {
          id: Date.now().toString(),
          operation: cache.has(id) ? 'update' : 'create',
          collection: config.collectionName,
          data: { id, ...data },
          timestamp: new Date(),
          retryCount: 0,
        };

        setOfflineQueue(prev => [...prev, queueItem]);

        // Update cache immediately
        setCache(prev => prev.set(id, {
          id,
          data: { id, ...data } as T,
          timestamp: new Date(),
          expiresAt: config.ttl ? new Date(Date.now() + config.ttl) : undefined,
          version: (prev.get(id)?.version || 0) + 1,
        }));
      } else {
        // Update Firestore directly
        if (cache.has(id)) {
          await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now(),
          });
        } else {
          await setDoc(docRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }

        // Update cache
        setCache(prev => prev.set(id, {
          id,
          data: { id, ...data } as T,
          timestamp: new Date(),
          expiresAt: config.ttl ? new Date(Date.now() + config.ttl) : undefined,
          version: (prev.get(id)?.version || 0) + 1,
        }));
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error setting data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
      throw error;
    }
  }, [cache, config.collectionName, config.ttl, isOnline]);

  // Delete data
  const deleteData = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isOnline) {
        // Queue for offline sync
        const queueItem: OfflineQueueItem = {
          id: Date.now().toString(),
          operation: 'delete',
          collection: config.collectionName,
          data: { id },
          timestamp: new Date(),
          retryCount: 0,
        };

        setOfflineQueue(prev => [...prev, queueItem]);
      } else {
        // Delete from Firestore
        await deleteDoc(doc(db, config.collectionName, id));
      }

      // Remove from cache
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(id);
        return newCache;
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error deleting data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
      throw error;
    }
  }, [config.collectionName, isOnline]);

  // Sync offline queue when back online
  const syncOfflineQueue = useCallback(async () => {
    if (!isOnline || offlineQueue.length === 0) return;

    setIsLoading(true);

    for (const item of offlineQueue) {
      try {
        const docRef = doc(db, item.collection, item.data.id);

        switch (item.operation) {
          case 'create':
            await setDoc(docRef, {
              ...item.data,
              createdAt: Timestamp.fromDate(item.timestamp),
              updatedAt: Timestamp.now(),
            });
            break;
          case 'update':
            await updateDoc(docRef, {
              ...item.data,
              updatedAt: Timestamp.now(),
            });
            break;
          case 'delete':
            await deleteDoc(docRef);
            break;
        }

        // Remove from queue
        setOfflineQueue(prev => prev.filter(q => q.id !== item.id));
      } catch (error) {
        console.error('Error syncing offline item:', error);

        // Increment retry count
        setOfflineQueue(prev =>
          prev.map(q =>
            q.id === item.id
              ? { ...q, retryCount: q.retryCount + 1 }
              : q
          )
        );
      }
    }

    setIsLoading(false);
  }, [isOnline, offlineQueue]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache(new Map());
    localStorage.removeItem(`cache_${config.collectionName}`);
  }, [config.collectionName]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const entries = Array.from(cache.values());
    const expired = entries.filter(entry => entry.expiresAt && entry.expiresAt < new Date()).length;

    return {
      totalEntries: cache.size,
      expiredEntries: expired,
      activeEntries: cache.size - expired,
      offlineQueueLength: offlineQueue.length,
    };
  }, [cache, offlineQueue]);

  // Listen for real-time updates (when online)
  const subscribeToUpdates = useCallback((
    constraints?: QueryConstraint[],
    callback?: (data: T[]) => void
  ) => {
    if (!isOnline) return () => {};

    let queryRef = collection(db, config.collectionName);

    if (constraints) {
      queryRef = query(queryRef, ...constraints);
    }

    return onSnapshot(queryRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];

      // Update cache
      const newCache = new Map(cache);
      data.forEach(item => {
        if (typeof item === 'object' && item !== null && 'id' in item) {
          newCache.set((item as any).id, {
            id: (item as any).id,
            data: item,
            timestamp: new Date(),
            expiresAt: config.ttl ? new Date(Date.now() + config.ttl) : undefined,
            version: (newCache.get((item as any).id)?.version || 0) + 1,
          });
        }
      });
      setCache(newCache);

      callback?.(data);
    });
  }, [cache, config.collectionName, config.ttl, isOnline]);

  return {
    // Data operations
    getData,
    setData,
    deleteData,

    // Cache management
    clearCache,
    getCacheStats,

    // Real-time
    subscribeToUpdates,

    // State
    isLoading,
    error,
    isOnline,
    cacheSize: cache.size,
    offlineQueueLength: offlineQueue.length,

    // Offline sync
    syncOfflineQueue,
  };
}

// CDN cache utility
export function useCDNCache() {
  const [cacheHits, setCacheHits] = useState(0);
  const [cacheMisses, setCacheMisses] = useState(0);

  const getCachedUrl = useCallback((originalUrl: string, ttl?: number) => {
    if (!originalUrl) return originalUrl;

    const url = new URL(originalUrl);

    // Add cache-busting parameter if needed
    if (ttl) {
      const cacheTime = Math.floor(Date.now() / (ttl * 1000));
      url.searchParams.set('_cache', cacheTime.toString());
    }

    return url.toString();
  }, []);

  const preloadImage = useCallback((src: string) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setCacheHits(prev => prev + 1);
        resolve(src);
      };
      img.onerror = () => {
        setCacheMisses(prev => prev + 1);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }, []);

  const preloadResources = useCallback(async (resources: string[]) => {
    const promises = resources.map(resource => {
      if (resource.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return preloadImage(resource);
      } else {
        return fetch(resource, { cache: 'force-cache' });
      }
    });

    try {
      await Promise.all(promises);
      console.log('Resources preloaded successfully');
    } catch (error) {
      console.warn('Some resources failed to preload:', error);
    }
  }, [preloadImage]);

  const getCacheStats = useCallback(() => ({
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: cacheHits + cacheMisses > 0 ? (cacheHits / (cacheHits + cacheMisses)) * 100 : 0,
  }), [cacheHits, cacheMisses]);

  return {
    getCachedUrl,
    preloadImage,
    preloadResources,
    getCacheStats,
  };
}

// Service Worker cache management
export function useServiceWorkerCache() {
  const [isSupported, setIsSupported] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'caches' in window) {
      setIsSupported(true);
      updateCacheSize();
    }
  }, []);

  const updateCacheSize = async () => {
    if (!isSupported) return;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          try {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
            }
          } catch (error) {
            // Skip invalid cache entries
          }
        }
      }

      setCacheSize(totalSize);
    } catch (error) {
      console.warn('Error calculating cache size:', error);
    }
  };

  const clearAllCaches = async () => {
    if (!isSupported) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      setCacheSize(0);
      console.log('All caches cleared');

      // Notify service worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_CLEARED',
        });
      }
    } catch (error) {
      console.error('Error clearing caches:', error);
      throw error;
    }
  };

  const preloadCriticalResources = async () => {
    if (!isSupported) return;

    try {
      const cache = await caches.open('tourtrip-critical-v1.0.0');
      const criticalResources = [
        '/',
        '/manifest.json',
        '/offline.html',
        '/icons/icon-192x192.png',
      ];

      await cache.addAll(criticalResources);
      console.log('Critical resources cached');
      updateCacheSize();
    } catch (error) {
      console.error('Error preloading critical resources:', error);
    }
  };

  const formatCacheSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    isSupported,
    cacheSize,
    clearAllCaches,
    preloadCriticalResources,
    formatCacheSize: (bytes: number) => formatCacheSize(bytes),
    updateCacheSize,
  };
}
