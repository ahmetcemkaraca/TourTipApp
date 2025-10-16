import { useState, useCallback, useEffect, useRef } from 'react';
import { monitoringService } from '@/lib/monitoring-service';
import { 
  Metric, 
  PerformanceMetric, 
  SystemHealth, 
  Alert, 
  LogEntry, 
  RealTimeMetrics,
  MetricType,
  AlertLevel,
  AlertStatus 
} from '@/types/monitoring';
import { useErrorHandling } from './use-error-handling';

/**
 * Hook for monitoring and observability features
 */
export const useMonitoring = () => {
  const { handleError } = useErrorHandling();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Subscription cleanup
  const subscriptionsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup all subscriptions on unmount
      subscriptionsRef.current.forEach(cleanup => cleanup());
    };
  }, []);

  // --- Metrics ---
  const recordMetric = useCallback(async (
    name: string, 
    value: number, 
    type: MetricType = 'gauge', 
    labels?: { [key: string]: string }, 
    unit?: string
  ) => {
    try {
      await monitoringService.recordMetric(name, value, type, labels, unit);
    } catch (error) {
      handleError(error, { code: 'RECORD_METRIC_ERROR', category: 'monitoring' });
    }
  }, [handleError]);

  const fetchMetrics = useCallback(async (
    metricName?: string, 
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h', 
    labels?: { [key: string]: string }
  ) => {
    setLoading(true);
    try {
      const fetchedMetrics = await monitoringService.getMetrics(metricName, timeRange, labels);
      setMetrics(fetchedMetrics);
      return fetchedMetrics;
    } catch (error) {
      handleError(error, { code: 'FETCH_METRICS_ERROR', category: 'monitoring' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // --- Performance ---
  const recordPerformanceMetric = useCallback(async (
    metricName: string, 
    value: number, 
    metadata?: any
  ) => {
    try {
      await monitoringService.recordPerformanceMetric(metricName, value, metadata);
    } catch (error) {
      handleError(error, { code: 'RECORD_PERFORMANCE_ERROR', category: 'monitoring' });
    }
  }, [handleError]);

  // Convenience methods for common performance metrics
  const recordPageLoad = useCallback(async (url: string, loadTime: number, userId?: string) => {
    await recordPerformanceMetric('page_load_time', loadTime, { url, userId });
  }, [recordPerformanceMetric]);

  const recordAPICall = useCallback(async (endpoint: string, responseTime: number, status: number) => {
    await recordPerformanceMetric('api_response_time', responseTime, { endpoint, status });
  }, [recordPerformanceMetric]);

  const recordUserAction = useCallback(async (action: string, duration: number, userId?: string) => {
    await recordPerformanceMetric('user_action_time', duration, { action, userId });
  }, [recordPerformanceMetric]);

  // --- System Health ---
  const updateSystemHealth = useCallback(async (
    service: string, 
    status: 'healthy' | 'degraded' | 'down', 
    responseTime?: number, 
    errorRate?: number, 
    details?: any
  ) => {
    try {
      await monitoringService.updateSystemHealth(service, status, responseTime, errorRate, details);
    } catch (error) {
      handleError(error, { code: 'UPDATE_HEALTH_ERROR', category: 'monitoring' });
    }
  }, [handleError]);

  const fetchSystemHealth = useCallback(async () => {
    setLoading(true);
    try {
      const health = await monitoringService.getSystemHealth();
      setSystemHealth(health);
      return health;
    } catch (error) {
      handleError(error, { code: 'FETCH_HEALTH_ERROR', category: 'monitoring' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const subscribeToSystemHealth = useCallback(() => {
    const unsubscribe = monitoringService.subscribeToSystemHealth((health) => {
      setSystemHealth(health);
    });
    subscriptionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // --- Alerts ---
  const createAlert = useCallback(async (
    title: string, 
    description: string, 
    level: AlertLevel, 
    service: string, 
    metricName?: string, 
    currentValue?: number, 
    threshold?: number
  ) => {
    try {
      const alert = await monitoringService.createAlert(title, description, level, service, metricName, currentValue, threshold);
      setAlerts(prev => [alert, ...prev]);
      return alert;
    } catch (error) {
      handleError(error, { code: 'CREATE_ALERT_ERROR', category: 'monitoring' });
      return null;
    }
  }, [handleError]);

  const resolveAlert = useCallback(async (alertId: string, assignedTo?: string) => {
    try {
      await monitoringService.resolveAlert(alertId, assignedTo);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'normal' as AlertStatus, resolvedAt: new Date() as any, assignedTo }
          : alert
      ));
    } catch (error) {
      handleError(error, { code: 'RESOLVE_ALERT_ERROR', category: 'monitoring' });
    }
  }, [handleError]);

  const fetchAlerts = useCallback(async (
    status?: AlertStatus, 
    level?: AlertLevel, 
    timeRange: '1h' | '6h' | '24h' | '7d' = '24h'
  ) => {
    setLoading(true);
    try {
      const fetchedAlerts = await monitoringService.getAlerts(status, level, timeRange);
      setAlerts(fetchedAlerts);
      return fetchedAlerts;
    } catch (error) {
      handleError(error, { code: 'FETCH_ALERTS_ERROR', category: 'monitoring' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const subscribeToAlerts = useCallback((status?: AlertStatus) => {
    const unsubscribe = monitoringService.subscribeToAlerts((alerts) => {
      setAlerts(alerts);
    }, status);
    subscriptionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // --- Logging ---
  const logEntry = useCallback(async (
    level: LogEntry['level'], 
    message: string, 
    service: string, 
    metadata?: any, 
    stackTrace?: string
  ) => {
    try {
      await monitoringService.logEntry(level, message, service, metadata, stackTrace);
    } catch (error) {
      handleError(error, { code: 'LOG_ENTRY_ERROR', category: 'monitoring' });
    }
  }, [handleError]);

  // Convenience logging methods
  const logInfo = useCallback(async (message: string, service: string, metadata?: any) => {
    await logEntry('info', message, service, metadata);
  }, [logEntry]);

  const logWarning = useCallback(async (message: string, service: string, metadata?: any) => {
    await logEntry('warn', message, service, metadata);
  }, [logEntry]);

  const logError = useCallback(async (message: string, service: string, error?: Error, metadata?: any) => {
    await logEntry('error', message, service, metadata, error?.stack);
  }, [logEntry]);

  // --- Real-time Monitoring ---
  const subscribeToRealTimeMetrics = useCallback(() => {
    const unsubscribe = monitoringService.subscribeToRealTimeMetrics((metrics) => {
      setRealTimeMetrics(metrics);
    });
    subscriptionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // --- Business Metrics Helpers ---
  const trackUserRegistration = useCallback(async () => {
    await recordMetric('user_registrations', 1, 'counter');
  }, [recordMetric]);

  const trackBookingCreated = useCallback(async (amount: number, currency: string = 'TRY') => {
    await recordMetric('bookings_total', 1, 'counter');
    await recordMetric('booking_amount', amount, 'gauge', { currency });
  }, [recordMetric]);

  const trackTourView = useCallback(async (tourId: string, category?: string) => {
    await recordMetric('tour_views', 1, 'counter', { tourId, category });
  }, [recordMetric]);

  const trackSearchQuery = useCallback(async (query: string, resultsCount: number) => {
    await recordMetric('search_queries', 1, 'counter');
    await recordMetric('search_results', resultsCount, 'gauge', { query });
  }, [recordMetric]);

  const trackPaymentProcessed = useCallback(async (amount: number, method: string, success: boolean) => {
    await recordMetric('payments_total', 1, 'counter', { method, status: success ? 'success' : 'failed' });
    if (success) {
      await recordMetric('payment_amount', amount, 'gauge', { method });
    }
  }, [recordMetric]);

  // --- Health Check Helpers ---
  const healthCheckAPI = useCallback(async (endpoint: string) => {
    const start = performance.now();
    try {
      const response = await fetch(endpoint, { method: 'HEAD' });
      const responseTime = performance.now() - start;
      const status = response.ok ? 'healthy' : 'degraded';
      await updateSystemHealth('api', status, responseTime);
      return { status, responseTime };
    } catch (error) {
      const responseTime = performance.now() - start;
      await updateSystemHealth('api', 'down', responseTime);
      return { status: 'down', responseTime, error };
    }
  }, [updateSystemHealth]);

  const healthCheckDatabase = useCallback(async () => {
    const start = performance.now();
    try {
      // This would typically be a simple database query
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      const responseTime = performance.now() - start;
      await updateSystemHealth('database', 'healthy', responseTime);
      return { status: 'healthy', responseTime };
    } catch (error) {
      const responseTime = performance.now() - start;
      await updateSystemHealth('database', 'down', responseTime);
      return { status: 'down', responseTime, error };
    }
  }, [updateSystemHealth]);

  return {
    loading,
    metrics,
    systemHealth,
    alerts,
    realTimeMetrics,
    logs,
    
    // Metrics
    recordMetric,
    fetchMetrics,
    
    // Performance
    recordPerformanceMetric,
    recordPageLoad,
    recordAPICall,
    recordUserAction,
    
    // System Health
    updateSystemHealth,
    fetchSystemHealth,
    subscribeToSystemHealth,
    
    // Alerts
    createAlert,
    resolveAlert,
    fetchAlerts,
    subscribeToAlerts,
    
    // Logging
    logEntry,
    logInfo,
    logWarning,
    logError,
    
    // Real-time
    subscribeToRealTimeMetrics,
    
    // Business Metrics
    trackUserRegistration,
    trackBookingCreated,
    trackTourView,
    trackSearchQuery,
    trackPaymentProcessed,
    
    // Health Checks
    healthCheckAPI,
    healthCheckDatabase,
  };
};
