// Cache Strategy Implementation
// Handles CDN caching, Firebase Hosting cache headers, and browser caching

interface CacheStrategy {
  type: 'cdn' | 'browser' | 'service-worker' | 'memory';
  ttl: number;
  headers?: Record<string, string>;
  conditions?: {
    userAgent?: string;
    path?: string;
    method?: string;
  };
}

interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  headers?: Record<string, string>;
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private maxMemoryEntries = 100;

  // Memory cache methods
  set(key: string, value: any, ttl = 300000): void { // 5 minutes default
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      // Remove oldest entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(this.maxMemoryEntries * 0.2));

      toRemove.forEach(([key]) => {
        this.memoryCache.delete(key);
      });
    }

    this.memoryCache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear(): void {
    this.memoryCache.clear();
  }

  size(): number {
    return this.memoryCache.size;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// CDN Cache Headers Utility
export class CDNCacheHeaders {
  static getStaticAssetHeaders(): Record<string, string> {
    return {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'max-age=31536000',
      'Cloudflare-Cache-Control': 'max-age=31536000',
      'Vercel-Cache-Control': 'max-age=31536000',
      'Surrogate-Control': 'max-age=31536000',
      'ETag': this.generateETag(),
    };
  }

  static getDynamicContentHeaders(ttl = 300): Record<string, string> {
    return {
      'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl * 2}`,
      'CDN-Cache-Control': `max-age=${ttl}`,
      'Vary': 'Accept-Encoding, User-Agent',
    };
  }

  static getAPIResponseHeaders(ttl = 60): Record<string, string> {
    return {
      'Cache-Control': `private, max-age=${ttl}`,
      'Vary': 'Authorization, Accept-Encoding',
    };
  }

  static getNoCacheHeaders(): Record<string, string> {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }

  static getStaleWhileRevalidateHeaders(ttl = 300, stale = 600): Record<string, string> {
    return {
      'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${stale}`,
      'CDN-Cache-Control': `max-age=${ttl}, stale-while-revalidate=${stale}`,
    };
  }

  private static generateETag(): string {
    return `"${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}"`;
  }
}

// Firebase Hosting Cache Configuration
export class FirebaseHostingCache {
  static getRewrites(): any[] {
    return [
      {
        source: '/api/**',
        function: 'api',
        headers: CDNCacheHeaders.getAPIResponseHeaders(),
      },
      {
        source: '/_next/static/**',
        headers: CDNCacheHeaders.getStaticAssetHeaders(),
      },
      {
        source: '/images/**',
        headers: CDNCacheHeaders.getDynamicContentHeaders(3600), // 1 hour
      },
      {
        source: '/manifest.json',
        headers: CDNCacheHeaders.getStaticAssetHeaders(),
      },
    ];
  }

  static getHeaders(): any[] {
    return [
      {
        source: '**/*.@(js|css)',
        headers: [CDNCacheHeaders.getStaticAssetHeaders()],
      },
      {
        source: '**/*.@(png|jpg|jpeg|gif|webp|svg|ico)',
        headers: [CDNCacheHeaders.getDynamicContentHeaders(86400)], // 24 hours
      },
      {
        source: '/api/**',
        headers: [CDNCacheHeaders.getAPIResponseHeaders()],
      },
      {
        source: '/((?!api).*)',
        headers: [CDNCacheHeaders.getStaleWhileRevalidateHeaders()],
      },
    ];
  }
}

// Browser Cache Strategy
export class BrowserCacheStrategy {
  private strategies: CacheStrategy[] = [
    {
      type: 'browser',
      ttl: 31536000000, // 1 year for static assets
      headers: CDNCacheHeaders.getStaticAssetHeaders(),
      conditions: {
        path: '/_next/static/**',
      },
    },
    {
      type: 'browser',
      ttl: 3600000, // 1 hour for images
      headers: CDNCacheHeaders.getDynamicContentHeaders(3600),
      conditions: {
        path: '/images/**',
      },
    },
    {
      type: 'browser',
      ttl: 300000, // 5 minutes for API responses
      headers: CDNCacheHeaders.getAPIResponseHeaders(300),
      conditions: {
        path: '/api/**',
      },
    },
    {
      type: 'browser',
      ttl: 0, // No cache for dynamic pages
      headers: CDNCacheHeaders.getNoCacheHeaders(),
      conditions: {
        path: '/((?!_next/static|images|api).*)',
      },
    },
  ];

  getStrategyForRequest(request: Request): CacheStrategy | null {
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || '';

    for (const strategy of this.strategies) {
      if (this.matchesConditions(strategy, url, userAgent, request.method)) {
        return strategy;
      }
    }

    return null;
  }

  private matchesConditions(
    strategy: CacheStrategy,
    url: URL,
    userAgent: string,
    method: string
  ): boolean {
    const conditions = strategy.conditions;
    if (!conditions) return true;

    if (conditions.path) {
      const pathPattern = new RegExp(conditions.path.replace(/\*\*/g, '.*'));
      if (!pathPattern.test(url.pathname)) return false;
    }

    if (conditions.userAgent) {
      if (!userAgent.includes(conditions.userAgent)) return false;
    }

    if (conditions.method) {
      if (method !== conditions.method) return false;
    }

    return true;
  }

  applyCacheHeaders(request: Request, response: Response): Response {
    const strategy = this.getStrategyForRequest(request);

    if (!strategy || !strategy.headers) {
      return response;
    }

    const newHeaders = new Headers(response.headers);

    Object.entries(strategy.headers).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
}

// Cache Analytics
export class CacheAnalytics {
  private static hits = 0;
  private static misses = 0;
  private static requests = 0;

  static recordHit(): void {
    this.hits++;
    this.requests++;
  }

  static recordMiss(): void {
    this.misses++;
    this.requests++;
  }

  static getStats() {
    return {
      totalRequests: this.requests,
      cacheHits: this.hits,
      cacheMisses: this.misses,
      hitRate: this.requests > 0 ? (this.hits / this.requests) * 100 : 0,
      missRate: this.requests > 0 ? (this.misses / this.requests) * 100 : 0,
    };
  }

  static reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.requests = 0;
  }

  static logStats(): void {
    const stats = this.getStats();
    console.log('[Cache Analytics]', stats);
  }
}

// Cache Warming Utility
export class CacheWarmer {
  static async warmStaticAssets(assets: string[]): Promise<void> {
    const promises = assets.map(async (asset) => {
      try {
        const response = await fetch(asset, {
          cache: 'force-cache',
          headers: CDNCacheHeaders.getStaticAssetHeaders(),
        });

        if (response.ok) {
          CacheAnalytics.recordHit();
        } else {
          CacheAnalytics.recordMiss();
        }
      } catch (error) {
        console.warn(`Failed to warm cache for ${asset}:`, error);
        CacheAnalytics.recordMiss();
      }
    });

    await Promise.allSettled(promises);
    CacheAnalytics.logStats();
  }

  static async warmAPICache(endpoints: string[]): Promise<void> {
    const promises = endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint, {
          cache: 'force-cache',
          headers: CDNCacheHeaders.getAPIResponseHeaders(),
        });

        if (response.ok) {
          CacheAnalytics.recordHit();
        } else {
          CacheAnalytics.recordMiss();
        }
      } catch (error) {
        console.warn(`Failed to warm cache for ${endpoint}:`, error);
        CacheAnalytics.recordMiss();
      }
    });

    await Promise.allSettled(promises);
    CacheAnalytics.logStats();
  }
}

// Prefetch Strategy
export class PrefetchStrategy {
  private static prefetched = new Set<string>();

  static async prefetchResource(url: string, priority: 'high' | 'low' = 'low'): Promise<void> {
    if (this.prefetched.has(url)) return;

    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;

      if (priority === 'high') {
        link.setAttribute('fetchpriority', 'high');
      }

      document.head.appendChild(link);
      this.prefetched.add(url);

      console.log(`Prefetched: ${url}`);
    } catch (error) {
      console.warn(`Failed to prefetch ${url}:`, error);
    }
  }

  static async prefetchRoute(route: string): Promise<void> {
    // Prefetch route data
    const routeUrl = `/api/route-data?path=${encodeURIComponent(route)}`;
    await this.prefetchResource(routeUrl, 'high');
  }

  static async prefetchCriticalResources(): Promise<void> {
    const criticalResources = [
      '/api/user/profile',
      '/api/tours/featured',
      '/_next/static/css/main.css',
      '/_next/static/js/main.js',
    ];

    await Promise.allSettled(
      criticalResources.map(resource =>
        this.prefetchResource(resource, 'high')
      )
    );
  }
}

// Cache Invalidation Strategy
export class CacheInvalidation {
  static async invalidatePattern(pattern: string): Promise<void> {
    // Invalidate service worker cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'INVALIDATE_CACHE',
        pattern,
      });
    }

    // Invalidate browser cache by adding cache-busting parameter
    const links = document.querySelectorAll(`link[href*="${pattern}"]`);
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        link.setAttribute('href', href + '?v=' + Date.now());
      }
    });

    console.log(`Invalidated cache for pattern: ${pattern}`);
  }

  static async invalidateAll(): Promise<void> {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Clear memory cache
    cacheManager.clear();

    // Invalidate service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'INVALIDATE_ALL_CACHE',
      });
    }

    console.log('All caches invalidated');
  }

  static async invalidateByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.invalidatePattern(tag);
    }
  }
}

// Export utilities
export {
  CacheStrategy,
  CacheEntry,
  BrowserCacheStrategy,
  FirebaseHostingCache,
  CacheAnalytics,
  CacheWarmer,
  PrefetchStrategy,
  CacheInvalidation,
};
