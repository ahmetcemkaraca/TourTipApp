import { getPerformance } from 'firebase/performance';
import { app } from '@/lib/firebase';

// Performance monitoring instance
let performanceInstance: any = null;

try {
  if (typeof window !== 'undefined') {
    performanceInstance = getPerformance(app);
  }
} catch (error) {
  console.warn('Firebase Performance Monitoring not available:', error);
}

export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  attributes?: Record<string, string>;
}

export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
  }>;
  recommendations: string[];
}

export interface FirestoreQueryOptimization {
  queryPath: string;
  indexesUsed: string[];
  documentsRead: number;
  executionTime: number;
  suggestions: string[];
}

export class PerformanceOptimizationService {
  private traces: Map<string, any> = new Map();
  private metrics: PerformanceMetrics[] = [];

  // Custom trace management
  startTrace(traceName: string, attributes?: Record<string, string>): void {
    try {
      if (!performanceInstance) return;

      const trace = performanceInstance.trace(traceName);
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          trace.putAttribute(key, value);
        });
      }
      trace.start();
      this.traces.set(traceName, trace);

      // Also track in custom metrics
      this.metrics.push({
        name: traceName,
        startTime: performance.now(),
        attributes
      });
    } catch (error) {
      console.warn('Failed to start trace:', error);
    }
  }

  stopTrace(traceName: string, additionalAttributes?: Record<string, string>): void {
    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        if (additionalAttributes) {
          Object.entries(additionalAttributes).forEach(([key, value]) => {
            trace.putAttribute(key, value);
          });
        }
        trace.stop();
        this.traces.delete(traceName);
      }

      // Update custom metrics
      const metric = this.metrics.find(m => m.name === traceName && !m.endTime);
      if (metric) {
        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;
      }
    } catch (error) {
      console.warn('Failed to stop trace:', error);
    }
  }

  // Core Web Vitals monitoring
  measureCoreWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.recordCustomMetric('lcp', lastEntry.startTime, {
        element: (lastEntry as any).element?.tagName || 'unknown'
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        this.recordCustomMetric('fid', entry.processingStart - entry.startTime, {
          eventType: entry.name
        });
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      this.recordCustomMetric('cls', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });

    // First Contentful Paint (FCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        this.recordCustomMetric('fcp', entry.startTime);
      });
    }).observe({ entryTypes: ['paint'] });
  }

  // Network monitoring
  monitorNetworkRequests(): void {
    if (typeof window === 'undefined') return;

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (entry.entryType === 'navigation') {
          this.recordCustomMetric('page_load_time', entry.loadEventEnd - entry.fetchStart, {
            url: entry.name,
            type: entry.type
          });
        }

        if (entry.entryType === 'resource') {
          const duration = entry.responseEnd - entry.fetchStart;
          
          // Flag slow resources
          if (duration > 1000) {
            this.recordCustomMetric('slow_resource', duration, {
              url: entry.name,
              type: entry.initiatorType,
              size: entry.transferSize?.toString() || '0'
            });
          }
        }
      });
    }).observe({ entryTypes: ['navigation', 'resource'] });
  }

  // Bundle analysis
  analyzeBundleSize(): BundleAnalysis {
    // This would typically be run during build time
    // Here we provide a simplified runtime analysis
    
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    let totalSize = 0;
    const chunks: any[] = [];
    const recommendations: string[] = [];

    // Analyze script sizes (simplified)
    scripts.forEach((script: any, index) => {
      const src = script.src;
      if (src && src.includes('/_next/static/')) {
        chunks.push({
          name: `chunk-${index}`,
          size: 0, // Would need actual size data
          modules: [src]
        });
      }
    });

    // Basic recommendations
    if (scripts.length > 10) {
      recommendations.push('Consider code splitting to reduce the number of script chunks');
    }

    if (styles.length > 5) {
      recommendations.push('Consider CSS optimization and critical CSS extraction');
    }

    return {
      totalSize,
      gzippedSize: Math.floor(totalSize * 0.3), // Estimated
      chunks,
      recommendations
    };
  }

  // Firestore query optimization
  async optimizeFirestoreQuery(
    queryPath: string,
    queryFn: () => Promise<any>
  ): Promise<FirestoreQueryOptimization> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const executionTime = performance.now() - startTime;
      
      // Analyze query performance
      const suggestions: string[] = [];
      
      if (executionTime > 1000) {
        suggestions.push('Query is slow (>1s). Consider adding composite indexes.');
      }
      
      if (executionTime > 500) {
        suggestions.push('Consider pagination for large result sets.');
      }

      return {
        queryPath,
        indexesUsed: [], // Would need Firestore monitoring
        documentsRead: Array.isArray(result) ? result.length : 1,
        executionTime,
        suggestions
      };
    } catch (error) {
      throw error;
    }
  }

  // Memory monitoring
  monitorMemoryUsage(): void {
    if (typeof window === 'undefined' || !(performance as any).memory) return;

    const memory = (performance as any).memory;
    
    setInterval(() => {
      this.recordCustomMetric('memory_used', memory.usedJSHeapSize, {
        total: memory.totalJSHeapSize.toString(),
        limit: memory.jsHeapSizeLimit.toString()
      });

      // Warn if memory usage is high
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 80) {
        console.warn('High memory usage detected:', usagePercent.toFixed(2) + '%');
      }
    }, 30000); // Check every 30 seconds
  }

  // Image optimization monitoring
  monitorImagePerformance(): void {
    if (typeof window === 'undefined') return;

    const images = document.querySelectorAll('img');
    
    images.forEach((img, index) => {
      img.onload = () => {
        const rect = img.getBoundingClientRect();
        const naturalSize = img.naturalWidth * img.naturalHeight;
        const displaySize = rect.width * rect.height;
        
        // Check if image is oversized
        if (naturalSize > displaySize * 2) {
          this.recordCustomMetric('oversized_image', naturalSize / displaySize, {
            src: img.src,
            index: index.toString()
          });
        }
      };
    });
  }

  // Custom metric recording
  private recordCustomMetric(
    name: string, 
    value: number, 
    attributes?: Record<string, string>
  ): void {
    try {
      // Record to Firebase Performance (if available)
      if (performanceInstance) {
        const trace = performanceInstance.trace(`custom_${name}`);
        if (attributes) {
          Object.entries(attributes).forEach(([key, val]) => {
            trace.putAttribute(key, val);
          });
        }
        trace.putMetric(name, value);
      }

      // Also store locally for analysis
      this.metrics.push({
        name,
        startTime: performance.now(),
        endTime: performance.now(),
        duration: value,
        attributes
      });
    } catch (error) {
      console.warn('Failed to record custom metric:', error);
    }
  }

  // Get performance report
  getPerformanceReport(): {
    metrics: PerformanceMetrics[];
    coreWebVitals: Record<string, number>;
    recommendations: string[];
  } {
    const coreWebVitals: Record<string, number> = {};
    const recommendations: string[] = [];

    // Extract Core Web Vitals
    this.metrics.forEach(metric => {
      if (['lcp', 'fid', 'cls', 'fcp'].includes(metric.name)) {
        coreWebVitals[metric.name] = metric.duration || 0;
      }
    });

    // Generate recommendations
    if (coreWebVitals.lcp > 2500) {
      recommendations.push('LCP is poor (>2.5s). Optimize largest content element.');
    }
    
    if (coreWebVitals.fid > 100) {
      recommendations.push('FID is poor (>100ms). Reduce JavaScript execution time.');
    }
    
    if (coreWebVitals.cls > 0.1) {
      recommendations.push('CLS is poor (>0.1). Avoid layout shifts.');
    }

    return {
      metrics: this.metrics,
      coreWebVitals,
      recommendations
    };
  }

  // Initialize all monitoring
  initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.measureCoreWebVitals();
    this.monitorNetworkRequests();
    this.monitorMemoryUsage();
    this.monitorImagePerformance();

    console.log('🚀 Performance monitoring initialized');
  }
}

// Export singleton instance
export const performanceOptimization = new PerformanceOptimizationService();
