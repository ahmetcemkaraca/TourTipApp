import { useState, useEffect, useCallback } from 'react';
import { performanceOptimization, PerformanceMetrics } from '@/lib/performance-optimization';

interface PerformanceState {
  metrics: PerformanceMetrics[];
  coreWebVitals: Record<string, number>;
  isMonitoring: boolean;
  recommendations: string[];
}

interface PerformanceHook {
  performance: PerformanceState;
  startTrace: (name: string, attributes?: Record<string, string>) => void;
  stopTrace: (name: string, additionalAttributes?: Record<string, string>) => void;
  getReport: () => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  measureOperation: <T>(name: string, operation: () => Promise<T> | T) => Promise<T>;
}

export const usePerformance = (): PerformanceHook => {
  const [performance, setPerformance] = useState<PerformanceState>({
    metrics: [],
    coreWebVitals: {},
    isMonitoring: false,
    recommendations: []
  });

  const startTrace = useCallback((name: string, attributes?: Record<string, string>) => {
    performanceOptimization.startTrace(name, attributes);
  }, []);

  const stopTrace = useCallback((name: string, additionalAttributes?: Record<string, string>) => {
    performanceOptimization.stopTrace(name, additionalAttributes);
  }, []);

  const getReport = useCallback(() => {
    const report = performanceOptimization.getPerformanceReport();
    setPerformance(prev => ({
      ...prev,
      metrics: report.metrics,
      coreWebVitals: report.coreWebVitals,
      recommendations: report.recommendations
    }));
  }, []);

  const startMonitoring = useCallback(() => {
    performanceOptimization.initializePerformanceMonitoring();
    setPerformance(prev => ({ ...prev, isMonitoring: true }));
  }, []);

  const stopMonitoring = useCallback(() => {
    setPerformance(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  const measureOperation = useCallback(async <T>(
    name: string, 
    operation: () => Promise<T> | T
  ): Promise<T> => {
    startTrace(name);
    try {
      const result = await operation();
      stopTrace(name, { status: 'success' });
      return result;
    } catch (error) {
      stopTrace(name, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'unknown' 
      });
      throw error;
    }
  }, [startTrace, stopTrace]);

  // Auto-update report periodically
  useEffect(() => {
    if (performance.isMonitoring) {
      const interval = setInterval(getReport, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [performance.isMonitoring, getReport]);

  // Initialize monitoring on mount if in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      startMonitoring();
    }
  }, [startMonitoring]);

  return {
    performance,
    startTrace,
    stopTrace,
    getReport,
    startMonitoring,
    stopMonitoring,
    measureOperation
  };
};
