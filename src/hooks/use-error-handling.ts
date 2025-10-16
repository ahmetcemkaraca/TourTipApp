'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AppError, 
  ErrorSeverity, 
  ErrorCategory,
  ErrorContext,
  ErrorReporting,
  ErrorMetrics,
  UseErrorHandlingResult,
  UseErrorBoundaryResult,
  UseNetworkErrorResult,
  NetworkError
} from '@/types/error';
import ErrorService from '@/lib/error-service';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export function useErrorHandling(): UseErrorHandlingResult {
  const { user } = useAuth();
  const { toast } = useToast();
  const [errors, setErrors] = useState<AppError[]>([]);
  const [config, setConfig] = useState<ErrorReporting>(ErrorService.getConfig());
  const sessionIdRef = useRef<string | null>(null);

  // Generate session ID
  useEffect(() => {
    sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Report error
  const reportError = useCallback(async (
    error: Error | AppError,
    context?: Partial<ErrorContext>
  ) => {
    try {
      let appError: AppError;

      if ('id' in error) {
        appError = error as AppError;
      } else {
        appError = ErrorService.createError(
          error as Error,
          ErrorCategory.SYSTEM,
          ErrorSeverity.MEDIUM,
          context
        );
      }

      // Add to local state
      setErrors(prev => [...prev, appError]);

      // Report to service
      await ErrorService.reportError(
        appError,
        user?.uid,
        sessionIdRef.current || undefined
      );

      // Show toast for user-facing errors
      if (appError.severity === ErrorSeverity.HIGH || appError.severity === ErrorSeverity.CRITICAL) {
        toast.error(appError.userMessage);
      }

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }, [user?.uid, toast]);

  // Clear specific error
  const clearError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Retry error with automatic retry logic
  const retryError = useCallback(async (errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error || !error.retryable) {
      return;
    }

    try {
      // Clear the error optimistically
      clearError(errorId);
      
      toast.info('Tekrar deneniyor...');
      
      // In a real implementation, this would retry the original operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('İşlem başarıyla tekrarlandı');
    } catch (retryError) {
      // Report retry failure
      await reportError(
        retryError as Error,
        {
          function: 'retry_error',
          user_action: 'retry',
        }
      );
    }
  }, [errors, clearError, reportError, toast]);

  // Reset error boundary
  const resetErrorBoundary = useCallback(() => {
    clearAllErrors();
  }, [clearAllErrors]);

  // Set error reporting config
  const setErrorReporting = useCallback((newConfig: Partial<ErrorReporting>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    ErrorService.updateConfig(updatedConfig);
  }, [config]);

  // Get error metrics
  const getErrorMetrics = useCallback(async (): Promise<ErrorMetrics> => {
    try {
      return await ErrorService.getErrorMetrics();
    } catch (error) {
      console.error('Failed to get error metrics:', error);
      return {
        total_errors: 0,
        error_rate: 0,
        most_common_errors: [],
        errors_by_category: {},
        errors_by_severity: {},
        resolution_time_avg: 0,
        user_affected_count: 0,
        retry_success_rate: 0,
      };
    }
  }, []);

  // Computed values
  const hasErrors = errors.length > 0;
  const criticalErrors = errors.filter(error => error.severity === ErrorSeverity.CRITICAL);

  return {
    errors,
    hasErrors,
    criticalErrors,
    reportError,
    clearError,
    clearAllErrors,
    retryError,
    resetErrorBoundary,
    setErrorReporting,
    getErrorMetrics,
  };
}

export function useErrorBoundary(): UseErrorBoundaryResult {
  const [error, setError] = useState<AppError | null>(null);
  const { reportError } = useErrorHandling();

  const captureError = useCallback((error: Error, errorInfo?: any) => {
    const appError = ErrorService.createError(
      error,
      ErrorCategory.SYSTEM,
      ErrorSeverity.HIGH,
      {
        component: 'ErrorBoundary',
        function: 'captureError',
      }
    );

    setError(appError);
    reportError(appError);
  }, [reportError]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    hasError: error !== null,
    resetError,
    captureError,
  };
}

export function useNetworkError(): UseNetworkErrorResult {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState<NetworkError | null>(null);
  const [failedRequests, setFailedRequests] = useState<NetworkError[]>([]);
  const { reportError } = useErrorHandling();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      const offlineError = ErrorService.createNetworkError(
        0,
        'offline',
        'GET',
        false
      );
      setNetworkError(offlineError);
      reportError(offlineError);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [reportError]);

  // Retry failed requests when back online
  const retryFailedRequests = useCallback(async () => {
    if (!isOnline || failedRequests.length === 0) {
      return;
    }

    const retryPromises = failedRequests.map(async (request) => {
      try {
        // In a real implementation, this would retry the actual request
        console.log('Retrying request:', request.endpoint);
        return true;
      } catch (error) {
        return false;
      }
    });

    const results = await Promise.allSettled(retryPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

    if (successCount > 0) {
      setFailedRequests(prev => prev.slice(successCount));
    }
  }, [isOnline, failedRequests]);

  // Auto-retry when coming back online
  useEffect(() => {
    if (isOnline && failedRequests.length > 0) {
      retryFailedRequests();
    }
  }, [isOnline, failedRequests.length, retryFailedRequests]);

  const getFailedRequests = useCallback(() => {
    return failedRequests;
  }, [failedRequests]);

  return {
    isOnline,
    networkError,
    retryFailedRequests,
    getFailedRequests,
  };
}

// Hook for specific error types
export function useAsyncError() {
  const { reportError } = useErrorHandling();

  return useCallback((error: Error | AppError) => {
    reportError(error, {
      function: 'async_operation',
      user_action: 'async_error',
    });
  }, [reportError]);
}

// Hook for form validation errors
export function useFormErrors() {
  const [fieldErrors, setFieldErrors] = useState<{ [field: string]: string[] }>({});
  const { reportError } = useErrorHandling();

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), message],
    }));

    // Report validation error
    const validationError = ErrorService.createValidationError(
      field,
      null,
      message
    );
    reportError(validationError);
  }, [reportError]);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasFieldError = useCallback((field: string) => {
    return !!(fieldErrors[field] && fieldErrors[field].length > 0);
  }, [fieldErrors]);

  const getFieldError = useCallback((field: string) => {
    return fieldErrors[field]?.[0] || null;
  }, [fieldErrors]);

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    hasFieldError,
    getFieldError,
  };
}

// Hook for retry logic with exponential backoff
export function useRetry() {
  const { reportError } = useErrorHandling();

  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          // Report final failure
          reportError(lastError, {
            function: 'retry_operation',
            user_action: 'final_retry_failure',
          });
          break;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }, [reportError]);

  return { retryWithBackoff };
}

// Hook for error analytics
export function useErrorAnalytics() {
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const { getErrorMetrics } = useErrorHandling();

  const loadMetrics = useCallback(async (timeRange: string = '24h') => {
    setLoading(true);
    try {
      const data = await getErrorMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load error metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [getErrorMetrics]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    loading,
    loadMetrics,
  };
}

export default useErrorHandling;
