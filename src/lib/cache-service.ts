// Cache Management Service for TourTrip.app
import {
  CacheConfig,
  CacheStrategy,
  CacheStorageType,
  CacheEntry,
  CacheStats,
  CachePolicy,
  CacheInvalidation,
  InvalidationType,
  CachePriority,
  CacheSource,
  OfflineQueueItem,
  OfflineOperation,
  SyncOptions,
  ConflictResolution,
  CacheMetrics,
  CacheError,
  CacheErrorType
} from '@/types/cache';

export class CacheService {
  private static instance: CacheService;
  private config: CacheConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private policies: Map<string, CachePolicy> = new Map();
  private offlineQueue: OfflineQueueItem[] = [];
  private stats: CacheStats;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isOnline: boolean = navigator.onLine;

  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      enabled: true,
      defaultTTL: 300, // 5 minutes
      maxSize: 50, // 50MB
      strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
      storageType: CacheStorageType.INDEXED_DB,
      compression: true,
      encryption: false,
      syncOnReconnect: true,
      prefetchEnabled: true,
      backgroundSync: true,
      ...config
    };

    this.stats = {
      size: 0,
      entries: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      lastCleanup: Date.now(),
      memoryUsage: 0,
    };

    this.initialize();
  }

  static getInstance(config?: Partial<CacheConfig>): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  private async initialize(): Promise<void> {
    // Set up online/offline listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Load cached data from persistent storage
    await this.loadFromStorage();

    // Set up cleanup interval
    setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute

    // Set up background sync
    if (this.config.backgroundSync) {
      setInterval(() => {
        this.processOfflineQueue();
      }, 5000); // Every 5 seconds
    }

    console.log('Cache Service initialized');
  }

  // Core cache operations
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);

    if (!entry) {
      this.trackMiss(key, 'not_found');
      return null;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.trackMiss(key, 'expired');
      return null;
    }

    // Update access statistics
    entry.accessed = Date.now();
    entry.hits++;

    this.trackHit(key);
    return entry.data as T;
  }

  async set<T>(
    key: string, 
    data: T, 
    options?: Partial<CacheEntry>
  ): Promise<void> {
    if (!this.config.enabled) return;

    const now = Date.now();
    const ttl = options?.ttl || this.config.defaultTTL;
    const serializedData = JSON.stringify(data);
    const size = new Blob([serializedData]).size;

    // Check if we need to evict entries
    await this.ensureCapacity(size);

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      ttl: ttl * 1000, // Convert to milliseconds
      size,
      accessed: now,
      hits: 0,
      version: '1.0',
      ...options,
    };

    this.cache.set(key, entry);
    this.updateStats();

    // Persist to storage if configured
    if (this.config.storageType !== CacheStorageType.MEMORY) {
      await this.persistToStorage(key, entry);
    }

    // Notify listeners
    this.notifyListeners(key, data);
  }

  async remove(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.updateStats();

    // Remove from persistent storage
    if (this.config.storageType !== CacheStorageType.MEMORY) {
      await this.removeFromStorage(key);
    }

    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.entries = 0;
    this.stats.size = 0;

    // Clear persistent storage
    if (this.config.storageType !== CacheStorageType.MEMORY) {
      await this.clearStorage();
    }
  }

  // Policy management
  addPolicy(policy: CachePolicy): void {
    this.policies.set(policy.key, policy);
  }

  removePolicy(key: string): void {
    this.policies.delete(key);
  }

  updatePolicy(key: string, updates: Partial<CachePolicy>): void {
    const existing = this.policies.get(key);
    if (existing) {
      this.policies.set(key, { ...existing, ...updates });
    }
  }

  getPolicy(key: string): CachePolicy | null {
    // Find matching policy by pattern
    for (const [, policy] of this.policies) {
      if (this.matchesPattern(key, policy.pattern)) {
        return policy;
      }
    }
    return null;
  }

  // Cache invalidation
  async invalidate(options: CacheInvalidation): Promise<void> {
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache) {
      let shouldRemove = false;

      switch (options.type) {
        case InvalidationType.BY_KEY:
          shouldRemove = options.keys?.includes(key) || false;
          break;

        case InvalidationType.BY_PATTERN:
          shouldRemove = options.pattern ? this.matchesPattern(key, options.pattern) : false;
          break;

        case InvalidationType.BY_TAG:
          shouldRemove = options.tags?.some(tag => 
            entry.metadata?.tags?.includes(tag)
          ) || false;
          break;

        case InvalidationType.BY_AGE:
          const age = Date.now() - entry.timestamp;
          shouldRemove = options.maxAge ? age > options.maxAge : false;
          break;

        case InvalidationType.BY_CONDITION:
          shouldRemove = options.condition ? options.condition(entry) : false;
          break;

        case InvalidationType.ALL:
          shouldRemove = true;
          break;
      }

      if (shouldRemove) {
        keysToRemove.push(key);
      }
    }

    // Remove identified entries
    for (const key of keysToRemove) {
      await this.remove(key);
    }
  }

  async invalidateByTag(tags: string[]): Promise<void> {
    await this.invalidate({
      type: InvalidationType.BY_TAG,
      tags,
    });
  }

  async invalidatePattern(pattern: string | RegExp): Promise<void> {
    await this.invalidate({
      type: InvalidationType.BY_PATTERN,
      pattern,
    });
  }

  // Offline queue management
  enqueue(
    operation: OfflineOperation,
    data: any,
    options?: Partial<OfflineQueueItem>
  ): void {
    const item: OfflineQueueItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
      priority: CachePriority.MEDIUM,
      ...options,
    };

    this.offlineQueue.push(item);
    this.sortOfflineQueue();
  }

  private sortOfflineQueue(): void {
    const priorityOrder = {
      [CachePriority.CRITICAL]: 0,
      [CachePriority.HIGH]: 1,
      [CachePriority.MEDIUM]: 2,
      [CachePriority.LOW]: 3,
    };

    this.offlineQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp; // FIFO for same priority
    });
  }

  async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    const batchSize = 5; // Process 5 items at a time
    const batch = this.offlineQueue.splice(0, batchSize);

    for (const item of batch) {
      try {
        await this.processOfflineItem(item);
      } catch (error) {
        item.retries++;
        
        if (item.retries < item.maxRetries) {
          this.offlineQueue.push(item);
        } else {
          console.error('Failed to process offline item after max retries:', item, error);
        }
      }
    }

    this.sortOfflineQueue();
  }

  private async processOfflineItem(item: OfflineQueueItem): Promise<void> {
    // This would integrate with your data layer (Firestore, APIs, etc.)
    console.log('Processing offline item:', item);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // In a real implementation, you would:
    // 1. Send the queued operation to the server
    // 2. Handle any conflicts with server data
    // 3. Update local cache if successful
    // 4. Remove from queue if successful
  }

  // Storage operations
  private async loadFromStorage(): Promise<void> {
    if (this.config.storageType === CacheStorageType.MEMORY) return;

    try {
      const db = await this.getIndexedDB();
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result || [];
        for (const entry of entries) {
          // Filter out expired entries
          if (!this.isExpired(entry)) {
            this.cache.set(entry.key, entry);
          }
        }
        this.updateStats();
      };
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  private async persistToStorage(key: string, entry: CacheEntry): Promise<void> {
    if (this.config.storageType === CacheStorageType.MEMORY) return;

    try {
      const db = await this.getIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.put(entry);
    } catch (error) {
      console.error('Failed to persist cache entry:', error);
    }
  }

  private async removeFromStorage(key: string): Promise<void> {
    if (this.config.storageType === CacheStorageType.MEMORY) return;

    try {
      const db = await this.getIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.delete(key);
    } catch (error) {
      console.error('Failed to remove cache entry from storage:', error);
    }
  }

  private async clearStorage(): Promise<void> {
    if (this.config.storageType === CacheStorageType.MEMORY) return;

    try {
      const db = await this.getIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.clear();
    } catch (error) {
      console.error('Failed to clear cache storage:', error);
    }
  }

  private async getIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TourTripCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('accessed', 'accessed');
        }
      };
    });
  }

  // Utility methods
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > (entry.timestamp + entry.ttl);
  }

  private matchesPattern(key: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return key.includes(pattern);
    }
    return pattern.test(key);
  }

  private async ensureCapacity(newEntrySize: number): Promise<void> {
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;
    let currentSize = this.getCurrentSize();

    if (currentSize + newEntrySize <= maxSizeBytes) return;

    // Calculate how much space we need to free
    const spaceNeeded = (currentSize + newEntrySize) - maxSizeBytes;
    
    // Sort entries by access time (LRU eviction)
    const sortedEntries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.accessed - b.accessed);

    let freedSpace = 0;
    for (const [key, entry] of sortedEntries) {
      if (freedSpace >= spaceNeeded) break;
      
      this.cache.delete(key);
      freedSpace += entry.size;
      this.stats.evictions++;
      
      // Remove from storage
      if (this.config.storageType !== CacheStorageType.MEMORY) {
        await this.removeFromStorage(key);
      }
    }

    this.updateStats();
  }

  private getCurrentSize(): number {
    return Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  private updateStats(): void {
    this.stats.entries = this.cache.size;
    this.stats.size = this.getCurrentSize();
    this.stats.memoryUsage = this.stats.size;
  }

  private trackHit(key: string): void {
    // Update hit rate
    const totalRequests = this.stats.hitRate + this.stats.missRate + 1;
    this.stats.hitRate = (this.stats.hitRate + 1) / totalRequests;
    this.stats.missRate = this.stats.missRate / totalRequests;
  }

  private trackMiss(key: string, reason: string): void {
    // Update miss rate
    const totalRequests = this.stats.hitRate + this.stats.missRate + 1;
    this.stats.hitRate = this.stats.hitRate / totalRequests;
    this.stats.missRate = (this.stats.missRate + 1) / totalRequests;
  }

  // Event handling
  private handleOnline(): void {
    this.isOnline = true;
    
    if (this.config.syncOnReconnect) {
      this.processOfflineQueue();
    }
  }

  private handleOffline(): void {
    this.isOnline = false;
  }

  // Listener management
  subscribe(key: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  private notifyListeners(key: string, data: any): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in cache listener:', error);
        }
      });
    }
  }

  // Maintenance operations
  async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      await this.remove(key);
    }

    this.stats.lastCleanup = now;
  }

  async compress(): Promise<void> {
    // In a real implementation, this would compress cache data
    console.log('Cache compression not implemented yet');
  }

  // Configuration
  updateConfig(updates: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getMetrics(): CacheMetrics {
    return {
      requests: {
        total: Math.round((this.stats.hitRate + this.stats.missRate) * 1000),
        hits: Math.round(this.stats.hitRate * 1000),
        misses: Math.round(this.stats.missRate * 1000),
        errors: 0,
      },
      storage: {
        used: this.stats.size,
        available: (this.config.maxSize * 1024 * 1024) - this.stats.size,
        quota: this.config.maxSize * 1024 * 1024,
        efficiency: this.stats.size > 0 ? this.stats.hitRate : 0,
      },
      performance: {
        averageReadTime: 1, // Would track actual times
        averageWriteTime: 2,
        compressionRatio: 1,
        evictionRate: this.stats.evictions / Math.max(1, this.stats.entries),
      },
      offline: {
        queueSize: this.offlineQueue.length,
        syncErrors: 0,
        lastSync: Date.now(),
        conflictCount: 0,
      },
    };
  }

  // Debug methods
  inspect(): { cache: CacheEntry[]; policies: CachePolicy[]; queue: OfflineQueueItem[] } {
    return {
      cache: Array.from(this.cache.values()),
      policies: Array.from(this.policies.values()),
      queue: [...this.offlineQueue],
    };
  }

  // Static utility methods
  static generateKey(...parts: (string | number | boolean)[]): string {
    return parts.map(part => String(part)).join(':');
  }

  static hashKey(key: string): string {
    let hash = 0;
    if (key.length === 0) return hash.toString();
    
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}

export default CacheService;
