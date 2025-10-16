// Firebase Crashlytics Integration
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: any = null;
let crashlytics: any = null;
let analytics: any = null;
let performance: any = null;

export function initializeFirebaseServices() {
  if (typeof window === 'undefined') return;

  try {
    // Initialize Firebase App
    if (!app) {
      app = initializeApp(firebaseConfig);
    }

    // Initialize Analytics
    if (!analytics && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }

    // Initialize Performance Monitoring
    if (!performance) {
      performance = getPerformance(app);
    }

    // Initialize Crashlytics (lazy load)
    if (!crashlytics) {
      import('firebase/crashlytics').then(({ getCrashlytics }) => {
        crashlytics = getCrashlytics(app);

        // Configure Crashlytics
        crashlytics.setCrashlyticsCollectionEnabled(process.env.NODE_ENV === 'production');

        // Set user properties
        setUserProperties();

        console.log('[Firebase] Crashlytics initialized');
      }).catch(error => {
        console.warn('[Firebase] Crashlytics initialization failed:', error);
      });
    }

  } catch (error) {
    console.error('[Firebase] Services initialization failed:', error);
  }
}

// Set user properties for Crashlytics
function setUserProperties() {
  if (!crashlytics || typeof window === 'undefined') return;

  try {
    // Set custom user properties
    crashlytics.setCustomKey('user_agent', navigator.userAgent);
    crashlytics.setCustomKey('url', window.location.href);
    crashlytics.setCustomKey('viewport', `${window.innerWidth}x${window.innerHeight}`);
    crashlytics.setCustomKey('timestamp', new Date().toISOString());

    // Set user ID if available
    const userId = localStorage.getItem('user-id');
    if (userId) {
      crashlytics.setUserId(userId);
    }

    // Set custom keys for app version and environment
    crashlytics.setCustomKey('app_version', process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0');
    crashlytics.setCustomKey('environment', process.env.NODE_ENV || 'development');

  } catch (error) {
    console.warn('[Firebase] Failed to set user properties:', error);
  }
}

// Error logging utility
export function logError(error: Error, context?: Record<string, any>) {
  if (!crashlytics || typeof window === 'undefined') {
    console.error('Error logging failed - Crashlytics not available:', error);
    return;
  }

  try {
    // Set context information
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        crashlytics.setCustomKey(key, String(value));
      });
    }

    // Log the error
    crashlytics.recordError(error);

    console.log('[Firebase] Error logged to Crashlytics:', error.message);

  } catch (logError) {
    console.error('[Firebase] Error logging failed:', logError);
  }
}

// Performance monitoring utility
export function logPerformanceMetric(name: string, value: number, attributes?: Record<string, string>) {
  if (!performance || typeof window === 'undefined') return;

  try {
    // Create a custom trace
    const trace = performance.trace(name);
    trace.putMetric(name, value);

    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        trace.putAttribute(key, value);
      });
    }

    trace.stop();

    console.log(`[Firebase] Performance metric logged: ${name} = ${value}`);

  } catch (error) {
    console.warn('[Firebase] Performance logging failed:', error);
  }
}

// User interaction tracking
export function logUserAction(action: string, details?: Record<string, any>) {
  if (!analytics || typeof window === 'undefined') return;

  try {
    // Log custom event
    if ((window as any).gtag) {
      (window as any).gtag('event', action, {
        custom_parameters: details || {},
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[Firebase] User action logged: ${action}`);

  } catch (error) {
    console.warn('[Firebase] User action logging failed:', error);
  }
}

// Page view tracking
export function logPageView(pageName: string, pageData?: Record<string, any>) {
  if (!analytics || typeof window === 'undefined') return;

  try {
    if ((window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, {
        page_title: pageName,
        page_location: window.location.href,
        custom_map: pageData || {},
      });
    }

    console.log(`[Firebase] Page view logged: ${pageName}`);

  } catch (error) {
    console.warn('[Firebase] Page view logging failed:', error);
  }
}

// Network request monitoring
export function monitorNetworkRequest(url: string, method: string, startTime: number) {
  return {
    end: (statusCode?: number, error?: Error) => {
      const duration = Date.now() - startTime;

      if (error) {
        logError(error, {
          request_url: url,
          request_method: method,
          request_duration: duration,
          error_type: 'network_error',
        });
      } else {
        logPerformanceMetric('network_request', duration, {
          url,
          method,
          status_code: statusCode?.toString() || 'unknown',
        });
      }
    },
  };
}

// Memory usage monitoring
export function logMemoryUsage() {
  if (typeof window === 'undefined' || !performance) return;

  try {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

      logPerformanceMetric('memory_usage', usedMB, {
        total_heap: totalMB.toString(),
        heap_limit: limitMB.toString(),
        usage_percentage: ((usedMB / limitMB) * 100).toFixed(2),
      });

      console.log(`[Firebase] Memory usage: ${usedMB}MB / ${limitMB}MB`);
    }
  } catch (error) {
    console.warn('[Firebase] Memory monitoring failed:', error);
  }
}

// Web vitals monitoring
export function logWebVitals(metric: any) {
  if (!analytics || typeof window === 'undefined') return;

  try {
    const { name, value, id } = metric;

    logPerformanceMetric(`web_vitals_${name.toLowerCase()}`, value, {
      metric_id: id,
      timestamp: new Date().toISOString(),
    });

    console.log(`[Firebase] Web vital logged: ${name} = ${value}`);

  } catch (error) {
    console.warn('[Firebase] Web vitals logging failed:', error);
  }
}

// Session tracking
let sessionStartTime: number | null = null;

export function startSession() {
  if (typeof window === 'undefined') return;

  sessionStartTime = Date.now();

  logUserAction('session_start', {
    referrer: document.referrer,
    user_agent: navigator.userAgent,
    screen_resolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

export function endSession() {
  if (typeof window === 'undefined' || !sessionStartTime) return;

  const sessionDuration = Date.now() - sessionStartTime;

  logUserAction('session_end', {
    duration_seconds: Math.floor(sessionDuration / 1000),
    duration_minutes: Math.floor(sessionDuration / 60000),
  });

  sessionStartTime = null;
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeFirebaseServices();

  // Start session
  startSession();

  // End session on page unload
  window.addEventListener('beforeunload', endSession);

  // Log memory usage periodically
  setInterval(logMemoryUsage, 30000); // Every 30 seconds
}

// Export services for direct access
export { crashlytics, analytics, performance };
