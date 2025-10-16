'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  loading: boolean;
  progress?: number;
  message?: string;
  error?: Error | null;
  startTime?: number;
  duration?: number;
}

export interface LoadingOptions {
  minDuration?: number; // Minimum loading time in ms
  showProgress?: boolean;
  message?: string;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface UseLoadingResult {
  // State
  loading: boolean;
  progress: number | undefined;
  message: string | undefined;
  error: Error | null;
  duration: number | undefined;
  
  // Actions
  startLoading: (options?: LoadingOptions) => void;
  stopLoading: () => void;
  setProgress: (progress: number) => void;
  setMessage: (message: string) => void;
  setError: (error: Error | null) => void;
  
  // Async wrapper
  withLoading: <T>(
    asyncFn: () => Promise<T>,
    options?: LoadingOptions
  ) => Promise<T>;
  
  // Reset
  reset: () => void;
}

export function useLoading(initialOptions?: LoadingOptions): UseLoadingResult {
  const [state, setState] = useState<LoadingState>({
    loading: false,
    progress: undefined,
    message: undefined,
    error: null,
    startTime: undefined,
    duration: undefined,
  });

  const optionsRef = useRef<LoadingOptions | undefined>(initialOptions);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update options ref when props change
  useEffect(() => {
    optionsRef.current = initialOptions;
  }, [initialOptions]);

  const startLoading = useCallback((options?: LoadingOptions) => {
    const mergedOptions = { ...optionsRef.current, ...options };
    
    setState(prev => ({
      ...prev,
      loading: true,
      progress: mergedOptions.showProgress ? 0 : undefined,
      message: mergedOptions.message,
      error: null,
      startTime: Date.now(),
      duration: undefined,
    }));

    mergedOptions.onStart?.();
  }, []);

  const stopLoading = useCallback(() => {
    setState(prev => {
      const duration = prev.startTime ? Date.now() - prev.startTime : undefined;
      return {
        ...prev,
        loading: false,
        progress: prev.progress !== undefined ? 100 : undefined,
        duration,
      };
    });

    optionsRef.current?.onComplete?.();
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
    }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message,
    }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false,
    }));

    if (error) {
      optionsRef.current?.onError?.(error);
    }
  }, []);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: LoadingOptions
  ): Promise<T> => {
    const mergedOptions = { ...optionsRef.current, ...options };
    
    startLoading(mergedOptions);
    
    try {
      const result = await asyncFn();
      
      // Ensure minimum duration if specified
      if (mergedOptions.minDuration) {
        const elapsed = Date.now() - (state.startTime || Date.now());
        if (elapsed < mergedOptions.minDuration) {
          await new Promise(resolve => 
            setTimeout(resolve, mergedOptions.minDuration! - elapsed)
          );
        }
      }
      
      stopLoading();
      return result;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  }, [startLoading, stopLoading, setError, state.startTime]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setState({
      loading: false,
      progress: undefined,
      message: undefined,
      error: null,
      startTime: undefined,
      duration: undefined,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    loading: state.loading,
    progress: state.progress,
    message: state.message,
    error: state.error,
    duration: state.duration,
    startLoading,
    stopLoading,
    setProgress,
    setMessage,
    setError,
    withLoading,
    reset,
  };
}

// Specialized hook for async operations
export function useAsyncLoading() {
  const loading = useLoading();

  const execute = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: LoadingOptions & {
      successMessage?: string;
      errorMessage?: string;
    }
  ): Promise<{ data?: T; error?: Error }> => {
    try {
      const data = await loading.withLoading(asyncFn, options);
      
      if (options?.successMessage) {
        loading.setMessage(options.successMessage);
      }
      
      return { data };
    } catch (error) {
      const errorMessage = options?.errorMessage || (error as Error).message;
      loading.setMessage(errorMessage);
      return { error: error as Error };
    }
  }, [loading]);

  return {
    ...loading,
    execute,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoading() {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: LoadingState }>({});

  const startLoading = useCallback((key: string, options?: LoadingOptions) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        loading: true,
        progress: options?.showProgress ? 0 : undefined,
        message: options?.message,
        error: null,
        startTime: Date.now(),
      },
    }));

    options?.onStart?.();
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const currentState = prev[key];
      if (!currentState) return prev;

      const duration = currentState.startTime ? Date.now() - currentState.startTime : undefined;

      return {
        ...prev,
        [key]: {
          ...currentState,
          loading: false,
          progress: currentState.progress !== undefined ? 100 : undefined,
          duration,
        },
      };
    });
  }, []);

  const setProgress = useCallback((key: string, progress: number) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        progress: Math.max(0, Math.min(100, progress)),
      },
    }));
  }, []);

  const setMessage = useCallback((key: string, message: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        message,
      },
    }));
  }, []);

  const setError = useCallback((key: string, error: Error | null) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        error,
        loading: false,
      },
    }));
  }, []);

  const getLoadingState = useCallback((key: string): LoadingState => {
    return loadingStates[key] || {
      loading: false,
      progress: undefined,
      message: undefined,
      error: null,
    };
  }, [loadingStates]);

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(state => state.loading);
  }, [loadingStates]);

  const getLoadingKeys = useCallback((): string[] => {
    return Object.keys(loadingStates).filter(key => loadingStates[key].loading);
  }, [loadingStates]);

  const clearState = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
  }, []);

  const clearAllStates = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    loadingStates,
    startLoading,
    stopLoading,
    setProgress,
    setMessage,
    setError,
    getLoadingState,
    isAnyLoading,
    getLoadingKeys,
    clearState,
    clearAllStates,
  };
}

// Hook for sequential loading steps
export function useStepLoading(steps: string[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const loading = useLoading({ showProgress: true });

  const nextStep = useCallback(() => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      loading.setProgress(((currentStep + 1) / steps.length) * 100);
      loading.setMessage(steps[currentStep + 1]);
    } else {
      loading.stopLoading();
    }
  }, [currentStep, steps, loading]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      loading.setProgress((stepIndex / steps.length) * 100);
      loading.setMessage(steps[stepIndex]);
    }
  }, [steps, loading]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    loading.reset();
  }, [loading]);

  const start = useCallback(() => {
    reset();
    loading.startLoading({
      showProgress: true,
      message: steps[0],
    });
  }, [reset, loading, steps]);

  return {
    ...loading,
    currentStep,
    currentStepName: steps[currentStep],
    totalSteps: steps.length,
    completedSteps: Array.from(completedSteps),
    isStepCompleted: (stepIndex: number) => completedSteps.has(stepIndex),
    nextStep,
    goToStep,
    start,
    reset,
  };
}

// Hook for timeout-based loading
export function useTimeoutLoading(timeoutMs: number = 30000) {
  const loading = useLoading();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startWithTimeout = useCallback((options?: LoadingOptions) => {
    loading.startLoading(options);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      loading.setError(new Error('İşlem zaman aşımına uğradı'));
    }, timeoutMs);
  }, [loading, timeoutMs]);

  const stopWithClearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    loading.stopLoading();
  }, [loading]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...loading,
    startLoading: startWithTimeout,
    stopLoading: stopWithClearTimeout,
  };
}

export default useLoading;
