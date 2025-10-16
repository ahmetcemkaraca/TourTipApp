import { getPerformance, trace, connectPerformanceEmulator } from 'firebase/performance';
import { logEvent } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';

// Performance monitoring configuration
const PERFORMANCE_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING === 'true',
  enableCustomTraces: process.env.NEXT_PUBLIC_CUSTOM_TRACES === 'true',
  enableNetworkMonitoring: process.env.NEXT_PUBLIC_NETWORK_MONITORING === 'true',
  enableUserExperienceTracking: process.env.NEXT_PUBLIC_UX_TRACKING === 'true',
  sampleRate: parseFloat(process.env.PERFORMANCE_SAMPLE_RATE || '1.0'),
  thresholds: {
    slowPageLoad: 3000, // ms
    slowApiCall: 2000, // ms
    poorLCP: 2500, // ms
    poorFID: 100, // ms
    poorCLS: 0.1, // score
  },
};

class PerformanceMonitoringService {
  private performance: any = null;
  private activeTraces: Map<string, any> = new Map();
  private performanceObserver?: PerformanceObserver;
  private navigationStartTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && PERFORMANCE_CONFIG.enabled) {
      this.initializePerformance();
      this.setupPerformanceObserver();
      this.trackNavigationTiming();
    }
  }

  private initializePerformance() {
    try {
      this.performance = getPerformance();
      
      // Connect to emulator in development
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
        connectPerformanceEmulator(this.performance, 'localhost', 9099);
      }

      this.navigationStartTime = performance.now();
      console.log('Firebase Performance monitoring initialized');
    } catch (error) {
      console.warn('Failed to initialize Firebase Performance:', error);
    }
  }

  private setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Observer for Core Web Vitals
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      // Observe different entry types
      this.performanceObserver.observe({
        entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift']
      });
    } catch (error) {
      console.warn('Performance Observer setup failed:', error);
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        this.trackNavigationMetrics(entry as PerformanceNavigationTiming);
        break;
      case 'resource':
        this.trackResourceMetrics(entry as PerformanceResourceTiming);
        break;
      case 'paint':
        this.trackPaintMetrics(entry);
        break;
      case 'largest-contentful-paint':
        this.trackLCP(entry);
        break;
      case 'first-input':
        this.trackFID(entry);
        break;
      case 'layout-shift':
        this.trackCLS(entry);
        break;
    }
  }

  // Core Web Vitals tracking
  private trackLCP(entry: PerformanceEntry) {
    const lcp = entry.startTime;
    
    // Log to Firebase Analytics
    if (analytics) {
      logEvent(analytics, 'lcp_measured', {
        value: Math.round(lcp),
        is_poor: lcp > PERFORMANCE_CONFIG.thresholds.poorLCP,
        page: window.location.pathname,
      });
    }

    // Create custom trace for poor LCP
    if (lcp > PERFORMANCE_CONFIG.thresholds.poorLCP) {
      this.createCustomTrace('poor_lcp', {
        lcp_value: lcp.toString(),
        page: window.location.pathname,
      });
    }

    console.log(`LCP: ${lcp.toFixed(2)}ms`);
  }

  private trackFID(entry: any) {
    const fid = entry.processingStart - entry.startTime;
    
    if (analytics) {
      logEvent(analytics, 'fid_measured', {
        value: Math.round(fid),
        is_poor: fid > PERFORMANCE_CONFIG.thresholds.poorFID,
        page: window.location.pathname,
      });
    }

    if (fid > PERFORMANCE_CONFIG.thresholds.poorFID) {
      this.createCustomTrace('poor_fid', {
        fid_value: fid.toString(),
        page: window.location.pathname,
      });
    }

    console.log(`FID: ${fid.toFixed(2)}ms`);
  }

  private trackCLS(entry: any) {
    const cls = entry.value;
    
    if (analytics) {
      logEvent(analytics, 'cls_measured', {
        value: Math.round(cls * 1000), // Convert to integer for Analytics
        is_poor: cls > PERFORMANCE_CONFIG.thresholds.poorCLS,
        page: window.location.pathname,
      });
    }

    if (cls > PERFORMANCE_CONFIG.thresholds.poorCLS) {
      this.createCustomTrace('poor_cls', {
        cls_value: cls.toString(),
        page: window.location.pathname,
      });
    }

    console.log(`CLS: ${cls.toFixed(3)}`);
  }

  private trackNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domParsing: entry.domInteractive - entry.responseEnd,
      domReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      windowLoad: entry.loadEventEnd - entry.loadEventStart,
      totalLoad: entry.loadEventEnd - entry.navigationStart,
    };

    // Log navigation metrics
    if (analytics) {
      logEvent(analytics, 'navigation_timing', {
        ttfb: Math.round(metrics.ttfb),
        total_load: Math.round(metrics.totalLoad),
        dom_ready: Math.round(metrics.domReady),
        page: window.location.pathname,
      });
    }

    // Create trace for slow page loads
    if (metrics.totalLoad > PERFORMANCE_CONFIG.thresholds.slowPageLoad) {
      this.createCustomTrace('slow_page_load', {
        load_time: metrics.totalLoad.toString(),
        page: window.location.pathname,
      });
    }

    console.log('Navigation metrics:', metrics);
  }

  private trackResourceMetrics(entry: PerformanceResourceTiming) {
    // Skip tracking for certain resource types
    const skipTypes = ['xmlhttprequest', 'fetch'];
    if (skipTypes.includes(entry.initiatorType)) return;

    const duration = entry.responseEnd - entry.startTime;
    const size = entry.transferSize || 0;

    // Track slow resources
    if (duration > 1000) { // Resources taking more than 1s
      if (analytics) {
        logEvent(analytics, 'slow_resource', {
          resource_url: entry.name,
          duration: Math.round(duration),
          size: Math.round(size),
          type: entry.initiatorType,
        });
      }
    }
  }

  private trackPaintMetrics(entry: PerformanceEntry) {
    if (analytics) {
      logEvent(analytics, 'paint_timing', {
        paint_type: entry.name,
        value: Math.round(entry.startTime),
        page: window.location.pathname,
      });
    }

    console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
  }

  private trackNavigationTiming() {
    // Wait for page load to complete
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackNavigationMetrics(navigation);
        }
      }, 0);
    });
  }

  // Custom trace methods
  createCustomTrace(traceName: string, attributes: { [key: string]: string } = {}) {
    if (!this.performance || !PERFORMANCE_CONFIG.enableCustomTraces) return null;

    try {
      const customTrace = trace(this.performance, traceName);
      
      // Add custom attributes
      Object.entries(attributes).forEach(([key, value]) => {
        customTrace.putAttribute(key, value);
      });

      customTrace.start();
      this.activeTraces.set(traceName, customTrace);
      
      return customTrace;
    } catch (error) {
      console.warn(`Failed to create trace ${traceName}:`, error);
      return null;
    }
  }

  startTrace(traceName: string, attributes: { [key: string]: string } = {}) {
    return this.createCustomTrace(traceName, attributes);
  }

  stopTrace(traceName: string, additionalAttributes: { [key: string]: string } = {}) {
    const activeTrace = this.activeTraces.get(traceName);
    if (!activeTrace) return;

    try {
      // Add additional attributes before stopping
      Object.entries(additionalAttributes).forEach(([key, value]) => {
        activeTrace.putAttribute(key, value);
      });

      activeTrace.stop();
      this.activeTraces.delete(traceName);
    } catch (error) {
      console.warn(`Failed to stop trace ${traceName}:`, error);
    }
  }

  // Network monitoring
  async trackNetworkRequest(
    url: string,
    method: string = 'GET',
    options: RequestInit = {}
  ) {
    if (!PERFORMANCE_CONFIG.enableNetworkMonitoring) {
      return fetch(url, options);
    }

    const startTime = performance.now();
    const traceName = `network_${method.toLowerCase()}_${this.sanitizeUrl(url)}`;
    
    const networkTrace = this.createCustomTrace(traceName, {
      method,
      url: this.sanitizeUrl(url),
    });

    try {
      const response = await fetch(url, options);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Add response attributes
      if (networkTrace) {
        networkTrace.putAttribute('status_code', response.status.toString());
        networkTrace.putAttribute('success', response.ok.toString());
        networkTrace.putAttribute('duration_ms', Math.round(duration).toString());
      }

      // Log to Analytics for slow API calls
      if (duration > PERFORMANCE_CONFIG.thresholds.slowApiCall && analytics) {
        logEvent(analytics, 'slow_api_call', {
          url: this.sanitizeUrl(url),
          method,
          duration: Math.round(duration),
          status_code: response.status,
        });
      }

      this.stopTrace(traceName);
      return response;
    } catch (error) {
      if (networkTrace) {
        networkTrace.putAttribute('error', 'true');
        networkTrace.putAttribute('error_message', (error as Error).message);
      }
      
      this.stopTrace(traceName);
      throw error;
    }
  }

  // User Experience tracking
  trackUserInteraction(interactionType: string, element?: string, duration?: number) {
    if (!PERFORMANCE_CONFIG.enableUserExperienceTracking) return;

    if (analytics) {
      logEvent(analytics, 'user_interaction', {
        interaction_type: interactionType,
        element: element || 'unknown',
        duration: duration ? Math.round(duration) : 0,
        page: window.location.pathname,
      });
    }

    // Create trace for slow interactions
    if (duration && duration > 100) {
      this.createCustomTrace('slow_interaction', {
        interaction_type: interactionType,
        element: element || 'unknown',
        duration_ms: Math.round(duration).toString(),
      });
    }
  }

  // Page-specific tracking
  trackPageLoad(pageName: string, additionalData: { [key: string]: any } = {}) {
    const loadTime = performance.now() - this.navigationStartTime;
    
    if (analytics) {
      logEvent(analytics, 'page_load_complete', {
        page_name: pageName,
        load_time: Math.round(loadTime),
        ...additionalData,
      });
    }

    // Create trace for the page load
    this.createCustomTrace(`page_load_${pageName}`, {
      load_time_ms: Math.round(loadTime).toString(),
      page: window.location.pathname,
      ...Object.fromEntries(
        Object.entries(additionalData).map(([k, v]) => [k, String(v)])
      ),
    });
  }

  // Component-specific tracking
  trackComponentRender(componentName: string, renderTime: number) {
    if (analytics) {
      logEvent(analytics, 'component_render', {
        component_name: componentName,
        render_time: Math.round(renderTime),
        page: window.location.pathname,
      });
    }

    // Track slow component renders
    if (renderTime > 100) {
      this.createCustomTrace('slow_component_render', {
        component: componentName,
        render_time_ms: Math.round(renderTime).toString(),
      });
    }
  }

  // Route change tracking
  trackRouteChange(from: string, to: string, duration: number) {
    if (analytics) {
      logEvent(analytics, 'route_change', {
        from_page: from,
        to_page: to,
        duration: Math.round(duration),
      });
    }

    this.createCustomTrace('route_change', {
      from_page: from,
      to_page: to,
      duration_ms: Math.round(duration).toString(),
    });
  }

  // Memory usage tracking
  trackMemoryUsage() {
    if (!('memory' in performance)) return;

    const memory = (performance as any).memory;
    
    if (analytics) {
      logEvent(analytics, 'memory_usage', {
        used_heap: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total_heap: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        heap_limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
      });
    }

    // Alert on high memory usage
    const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    if (usagePercentage > 80) {
      this.createCustomTrace('high_memory_usage', {
        usage_percentage: Math.round(usagePercentage).toString(),
        used_mb: Math.round(memory.usedJSHeapSize / 1024 / 1024).toString(),
      });
    }
  }

  // Performance budget tracking
  checkPerformanceBudget() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const budget = {
      totalLoad: 3000, // 3 seconds
      ttfb: 600, // 600ms
      domReady: 2000, // 2 seconds
    };

    const actual = {
      totalLoad: navigation.loadEventEnd - navigation.navigationStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    };

    const violations = Object.entries(budget).filter(
      ([key, limit]) => actual[key as keyof typeof actual] > limit
    );

    if (violations.length > 0 && analytics) {
      logEvent(analytics, 'performance_budget_violation', {
        violations: violations.map(([key]) => key).join(','),
        page: window.location.pathname,
      });
    }
  }

  // Utility methods
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.pathname}${urlObj.search ? '?[query]' : ''}`;
    } catch {
      return url.substring(0, 100); // Truncate if not a valid URL
    }
  }

  // Public method to manually trigger performance monitoring
  measurePerformance(name: string, fn: () => void | Promise<void>) {
    const startTime = performance.now();
    const trace = this.createCustomTrace(`manual_${name}`);

    const finish = () => {
      const duration = performance.now() - startTime;
      if (trace) {
        trace.putAttribute('duration_ms', Math.round(duration).toString());
      }
      this.stopTrace(`manual_${name}`);
    };

    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(finish);
      } else {
        finish();
        return result;
      }
    } catch (error) {
      if (trace) {
        trace.putAttribute('error', 'true');
      }
      finish();
      throw error;
    }
  }

  // Get current performance metrics
  getCurrentMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const memory = 'memory' in performance ? (performance as any).memory : null;

    return {
      navigation: navigation ? {
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        ttfb: navigation.responseStart - navigation.requestStart,
      } : null,
      paint: paint.reduce((acc, entry) => {
        acc[entry.name] = entry.startTime;
        return acc;
      }, {} as { [key: string]: number }),
      memory: memory ? {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      } : null,
    };
  }
}

// Create singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// Export helper functions
export const trackPageLoad = (pageName: string, additionalData?: { [key: string]: any }) => 
  performanceMonitoring.trackPageLoad(pageName, additionalData);

export const trackUserInteraction = (type: string, element?: string, duration?: number) =>
  performanceMonitoring.trackUserInteraction(type, element, duration);

export const trackComponentRender = (componentName: string, renderTime: number) =>
  performanceMonitoring.trackComponentRender(componentName, renderTime);

export const trackNetworkRequest = (url: string, method?: string, options?: RequestInit) =>
  performanceMonitoring.trackNetworkRequest(url, method, options);

export const measurePerformance = (name: string, fn: () => void | Promise<void>) =>
  performanceMonitoring.measurePerformance(name, fn);

export const startTrace = (name: string, attributes?: { [key: string]: string }) =>
  performanceMonitoring.startTrace(name, attributes);

export const stopTrace = (name: string, additionalAttributes?: { [key: string]: string }) =>
  performanceMonitoring.stopTrace(name, additionalAttributes);
