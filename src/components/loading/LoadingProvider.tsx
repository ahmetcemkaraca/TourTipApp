'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import LoadingOverlay from './LoadingOverlay';

interface LoadingState {
  [key: string]: {
    loading: boolean;
    message?: string;
    progress?: number;
    variant?: 'spinner' | 'progress' | 'dots' | 'pulse';
  };
}

interface LoadingContextType {
  // Global loading state
  isLoading: (key?: string) => boolean;
  isAnyLoading: () => boolean;
  
  // Loading actions
  showLoading: (key: string, options?: {
    message?: string;
    progress?: number;
    variant?: 'spinner' | 'progress' | 'dots' | 'pulse';
  }) => void;
  hideLoading: (key: string) => void;
  hideAllLoading: () => void;
  
  // Progress actions
  updateProgress: (key: string, progress: number) => void;
  updateMessage: (key: string, message: string) => void;
  
  // Async wrapper
  withLoading: <T>(
    key: string,
    asyncFn: () => Promise<T>,
    options?: {
      message?: string;
      successMessage?: string;
      errorMessage?: string;
      showProgress?: boolean;
    }
  ) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
  globalOverlay?: boolean;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({
  children,
  globalOverlay = false,
}) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const isLoading = useCallback((key?: string): boolean => {
    if (key) {
      return loadingStates[key]?.loading || false;
    }
    return Object.values(loadingStates).some(state => state.loading);
  }, [loadingStates]);

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(state => state.loading);
  }, [loadingStates]);

  const showLoading = useCallback((key: string, options?: {
    message?: string;
    progress?: number;
    variant?: 'spinner' | 'progress' | 'dots' | 'pulse';
  }) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        loading: true,
        message: options?.message,
        progress: options?.progress,
        variant: options?.variant || 'spinner',
      },
    }));
  }, []);

  const hideLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
  }, []);

  const hideAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  const updateProgress = useCallback((key: string, progress: number) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        progress: Math.max(0, Math.min(100, progress)),
      },
    }));
  }, []);

  const updateMessage = useCallback((key: string, message: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        message,
      },
    }));
  }, []);

  const withLoading = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>,
    options?: {
      message?: string;
      successMessage?: string;
      errorMessage?: string;
      showProgress?: boolean;
    }
  ): Promise<T> => {
    showLoading(key, {
      message: options?.message || 'Yükleniyor...',
      variant: options?.showProgress ? 'progress' : 'spinner',
      progress: options?.showProgress ? 0 : undefined,
    });

    try {
      // Simulate progress if enabled
      if (options?.showProgress) {
        updateProgress(key, 30);
        await new Promise(resolve => setTimeout(resolve, 100));
        updateProgress(key, 60);
      }

      const result = await asyncFn();

      if (options?.showProgress) {
        updateProgress(key, 100);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (options?.successMessage) {
        updateMessage(key, options.successMessage);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      hideLoading(key);
      return result;
    } catch (error) {
      if (options?.errorMessage) {
        updateMessage(key, options.errorMessage);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      hideLoading(key);
      throw error;
    }
  }, [showLoading, hideLoading, updateProgress, updateMessage]);

  const contextValue: LoadingContextType = {
    isLoading,
    isAnyLoading,
    showLoading,
    hideLoading,
    hideAllLoading,
    updateProgress,
    updateMessage,
    withLoading,
  };

  // Get global loading state for overlay
  const globalLoadingState = loadingStates['global'];
  const showGlobalOverlay = globalOverlay && globalLoadingState?.loading;

  return (
    <LoadingContext.Provider value={contextValue}>
      <div className="relative">
        {children}
        
        {showGlobalOverlay && (
          <LoadingOverlay
            loading={true}
            message={globalLoadingState.message}
            progress={globalLoadingState.progress}
            variant={globalLoadingState.variant}
            className="fixed inset-0 z-[9999]"
            overlayClassName="bg-white/90 dark:bg-gray-900/90"
          >
            <div />
          </LoadingOverlay>
        )}
      </div>
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
};

// Higher-order component for loading wrapper
export function withLoadingProvider<P extends object>(
  Component: React.ComponentType<P>,
  options?: { globalOverlay?: boolean }
) {
  return function WrappedComponent(props: P) {
    return (
      <LoadingProvider globalOverlay={options?.globalOverlay}>
        <Component {...props} />
      </LoadingProvider>
    );
  };
}

// Hook for simplified loading management
export function useSimpleLoading(key: string = 'default') {
  const { 
    isLoading, 
    showLoading, 
    hideLoading, 
    updateProgress, 
    updateMessage,
    withLoading 
  } = useLoadingContext();

  const loading = isLoading(key);

  const start = useCallback((options?: {
    message?: string;
    variant?: 'spinner' | 'progress' | 'dots' | 'pulse';
  }) => {
    showLoading(key, options);
  }, [key, showLoading]);

  const stop = useCallback(() => {
    hideLoading(key);
  }, [key, hideLoading]);

  const setProgress = useCallback((progress: number) => {
    updateProgress(key, progress);
  }, [key, updateProgress]);

  const setMessage = useCallback((message: string) => {
    updateMessage(key, message);
  }, [key, updateMessage]);

  const execute = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      message?: string;
      successMessage?: string;
      errorMessage?: string;
      showProgress?: boolean;
    }
  ): Promise<T> => {
    return withLoading(key, asyncFn, options);
  }, [key, withLoading]);

  return {
    loading,
    start,
    stop,
    setProgress,
    setMessage,
    execute,
  };
}

// Loading boundary component for error handling
interface LoadingBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingKey?: string;
}

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
  children,
  fallback,
  loadingKey = 'boundary',
}) => {
  const { isLoading } = useLoadingContext();
  const loading = isLoading(loadingKey);

  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <LoadingOverlay loading={true} className="relative">
          <div className="w-full h-32" />
        </LoadingOverlay>
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingProvider;
