// Cache Management Types for TourTrip.app
export interface CacheConfig {
  enabled: boolean;
  defaultTTL: number; // seconds
  maxSize: number; // MB
  strategy: CacheStrategy;
  storageType: CacheStorageType;
  compression: boolean;
  encryption: boolean;
  syncOnReconnect: boolean;
  prefetchEnabled: boolean;
  backgroundSync: boolean;
}

export enum CacheStrategy {
  CACHE_FIRST = 'cache_first',
  NETWORK_FIRST = 'network_first',
  CACHE_ONLY = 'cache_only',
  NETWORK_ONLY = 'network_only',
  STALE_WHILE_REVALIDATE = 'stale_while_revalidate'
}

export enum CacheStorageType {
  MEMORY = 'memory',
  LOCAL_STORAGE = 'local_storage',
  SESSION_STORAGE = 'session_storage',
  INDEXED_DB = 'indexed_db',
  FIRESTORE_OFFLINE = 'firestore_offline'
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
  accessed: number;
  hits: number;
  etag?: string;
  version: string;
  metadata?: CacheMetadata;
}

export interface CacheMetadata {
  collection?: string;
  document?: string;
  query?: string;
  userId?: string;
  tags?: string[];
  dependencies?: string[];
  priority?: CachePriority;
  source?: CacheSource;
}

export enum CachePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum CacheSource {
  FIRESTORE = 'firestore',
  API = 'api',
  STORAGE = 'storage',
  USER_DATA = 'user_data',
  STATIC_CONTENT = 'static_content',
  COMPUTED = 'computed'
}

export interface CacheStats {
  size: number; // bytes
  entries: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  lastCleanup: number;
  memoryUsage: number;
  storageQuota?: number;
  storageUsed?: number;
}

export interface CachePolicy {
  key: string;
  pattern: string | RegExp;
  strategy: CacheStrategy;
  ttl: number;
  maxSize?: number;
  priority: CachePriority;
  tags?: string[];
  conditions?: CacheCondition[];
}

export interface CacheCondition {
  type: 'user_role' | 'device_type' | 'network_type' | 'time_of_day' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface CacheInvalidation {
  type: InvalidationType;
  pattern?: string | RegExp;
  tags?: string[];
  keys?: string[];
  maxAge?: number;
  condition?: (entry: CacheEntry) => boolean;
}

export enum InvalidationType {
  BY_KEY = 'by_key',
  BY_PATTERN = 'by_pattern',
  BY_TAG = 'by_tag',
  BY_AGE = 'by_age',
  BY_SIZE = 'by_size',
  BY_CONDITION = 'by_condition',
  ALL = 'all'
}

export interface SyncOptions {
  immediate: boolean;
  onReconnect: boolean;
  backgroundSync: boolean;
  conflictResolution: ConflictResolution;
  retryAttempts: number;
  retryDelay: number;
}

export enum ConflictResolution {
  SERVER_WINS = 'server_wins',
  CLIENT_WINS = 'client_wins',
  LAST_WRITE_WINS = 'last_write_wins',
  MERGE = 'merge',
  MANUAL = 'manual'
}

export interface OfflineQueueItem {
  id: string;
  operation: OfflineOperation;
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
  dependencies?: string[];
  priority: CachePriority;
}

export enum OfflineOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  BATCH = 'batch'
}

export interface CacheBackup {
  id: string;
  timestamp: number;
  version: string;
  size: number;
  entries: { [key: string]: CacheEntry };
  metadata: {
    created_at: Date;
    expires_at: Date;
    source: 'manual' | 'automatic';
    compression_ratio?: number;
  };
}

// Firestore specific cache types
export interface FirestoreCache {
  enableOffline: boolean;
  cacheSizeBytes: number;
  experimentalForceLongPolling: boolean;
  ignoreUndefinedProperties: boolean;
  merge: boolean;
  persistenceEnabled: boolean;
  synchronizeTabs: boolean;
}

export interface FirestoreCacheEntry {
  collection: string;
  document?: string;
  query?: FirestoreQuery;
  data: any;
  lastUpdated: number;
  localChanges: boolean;
  serverTimestamp?: number;
}

export interface FirestoreQuery {
  filters: FirestoreFilter[];
  orderBy?: FirestoreOrderBy[];
  limit?: number;
  startAfter?: any;
  endBefore?: any;
}

export interface FirestoreFilter {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'not-in' | 'array-contains-any';
  value: any;
}

export interface FirestoreOrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

// HTTP Cache types
export interface HTTPCacheHeaders {
  'cache-control'?: string;
  'expires'?: string;
  'etag'?: string;
  'last-modified'?: string;
  'if-none-match'?: string;
  'if-modified-since'?: string;
}

export interface HTTPCacheOptions {
  strategy: CacheStrategy;
  ttl: number;
  revalidate: boolean;
  staleWhileRevalidate: boolean;
  headers: HTTPCacheHeaders;
}

// Service Worker Cache types
export interface ServiceWorkerCache {
  name: string;
  version: string;
  strategy: CacheStrategy;
  urlPatterns: (string | RegExp)[];
  options: ServiceWorkerCacheOptions;
}

export interface ServiceWorkerCacheOptions {
  cacheName: string;
  expiration?: {
    maxEntries?: number;
    maxAgeSeconds?: number;
    purgeOnQuotaError?: boolean;
  };
  cacheKeyWillBeUsed?: (request: Request) => Promise<string>;
  cachedResponseWillBeUsed?: (response: Response) => Promise<Response>;
  requestWillBeFetched?: (request: Request) => Promise<Request>;
  fetchDidSucceed?: (response: Response) => Promise<Response>;
  fetchDidFail?: (error: Error) => Promise<void>;
}

// Cache Hook interfaces
export interface UseCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  cached: boolean;
  stale: boolean;
  lastUpdated: number | null;
  
  // Actions
  refetch: () => Promise<T | null>;
  invalidate: () => void;
  update: (data: T) => void;
  remove: () => void;
}

export interface UseFirestoreCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  offline: boolean;
  hasPendingWrites: boolean;
  fromCache: boolean;
  
  // Actions
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
  clearCache: () => void;
  enableOffline: () => void;
  disableOffline: () => void;
}

export interface UseCacheManagerResult {
  stats: CacheStats;
  policies: CachePolicy[];
  
  // Cache management
  set: <T>(key: string, data: T, options?: Partial<CacheEntry>) => Promise<void>;
  get: <T>(key: string) => Promise<T | null>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  
  // Policy management
  addPolicy: (policy: CachePolicy) => void;
  removePolicy: (key: string) => void;
  updatePolicy: (key: string, updates: Partial<CachePolicy>) => void;
  
  // Invalidation
  invalidate: (options: CacheInvalidation) => Promise<void>;
  invalidateByTag: (tags: string[]) => Promise<void>;
  invalidatePattern: (pattern: string | RegExp) => Promise<void>;
  
  // Maintenance
  cleanup: () => Promise<void>;
  compress: () => Promise<void>;
  backup: () => Promise<CacheBackup>;
  restore: (backup: CacheBackup) => Promise<void>;
  
  // Configuration
  updateConfig: (config: Partial<CacheConfig>) => void;
  getConfig: () => CacheConfig;
}

export interface UseOfflineQueueResult {
  items: OfflineQueueItem[];
  size: number;
  processing: boolean;
  
  // Queue management
  enqueue: (operation: OfflineOperation, data: any, options?: Partial<OfflineQueueItem>) => void;
  dequeue: () => OfflineQueueItem | null;
  peek: () => OfflineQueueItem | null;
  clear: () => void;
  
  // Processing
  process: () => Promise<void>;
  processItem: (id: string) => Promise<boolean>;
  retry: (id: string) => Promise<boolean>;
  
  // Status
  isPending: (id: string) => boolean;
  getStatus: () => { pending: number; failed: number; completed: number };
}

// Performance monitoring
export interface CachePerformance {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  cacheEfficiency: number;
  storageUsage: number;
  networkSavings: number;
  timeSpent: {
    reading: number;
    writing: number;
    eviction: number;
    compression: number;
  };
}

export interface CacheMetrics {
  requests: {
    total: number;
    hits: number;
    misses: number;
    errors: number;
  };
  storage: {
    used: number;
    available: number;
    quota: number;
    efficiency: number;
  };
  performance: {
    averageReadTime: number;
    averageWriteTime: number;
    compressionRatio: number;
    evictionRate: number;
  };
  offline: {
    queueSize: number;
    syncErrors: number;
    lastSync: number;
    conflictCount: number;
  };
}

// Error types
export interface CacheError {
  type: CacheErrorType;
  message: string;
  key?: string;
  operation?: string;
  details?: any;
}

export enum CacheErrorType {
  STORAGE_QUOTA_EXCEEDED = 'storage_quota_exceeded',
  INVALID_KEY = 'invalid_key',
  SERIALIZATION_ERROR = 'serialization_error',
  NETWORK_ERROR = 'network_error',
  PERMISSION_DENIED = 'permission_denied',
  CACHE_CORRUPTION = 'cache_corruption',
  SYNC_CONFLICT = 'sync_conflict'
}

// Cache decorators/annotations
export interface CacheDecorator {
  key?: string | ((args: any[]) => string);
  ttl?: number;
  strategy?: CacheStrategy;
  tags?: string[];
  condition?: (args: any[]) => boolean;
  serialize?: (data: any) => string;
  deserialize?: (data: string) => any;
}

// Configuration validation
export interface CacheConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

// Cache event types
export interface CacheEvent {
  type: CacheEventType;
  key: string;
  data?: any;
  timestamp: number;
  metadata?: any;
}

export enum CacheEventType {
  HIT = 'hit',
  MISS = 'miss',
  SET = 'set',
  DELETE = 'delete',
  EVICT = 'evict',
  EXPIRE = 'expire',
  SYNC = 'sync',
  ERROR = 'error'
}

// Analytics integration
export interface CacheAnalytics {
  trackHit: (key: string, responseTime: number) => void;
  trackMiss: (key: string, reason: string) => void;
  trackEviction: (key: string, reason: string) => void;
  trackError: (error: CacheError) => void;
  trackPerformance: (metrics: CachePerformance) => void;
}

// Background sync
export interface BackgroundSyncOptions {
  enabled: boolean;
  interval: number; // milliseconds
  onlyWhenCharging: boolean;
  requireWifi: boolean;
  maxRetries: number;
  batchSize: number;
}

export interface BackgroundSyncJob {
  id: string;
  type: 'sync' | 'cleanup' | 'backup' | 'prefetch';
  priority: 'low' | 'normal' | 'high';
  data: any;
  createdAt: number;
  scheduledFor?: number;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
}
