'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AppError, ErrorSeverity, ErrorCategory } from '@/types/error';
import ErrorService from '@/lib/error-service';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<any>;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  resetKeys?: Array<unknown>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastRetry: Date | null;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastRetry: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = ErrorService.createError(
      error,
      ErrorCategory.SYSTEM,
      ErrorSeverity.HIGH,
      {
        component: 'ErrorBoundary',
        function: 'componentDidCatch',
        route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      }
    );

    this.setState({
      error: appError,
      errorInfo,
    });

    // Report error
    ErrorService.reportError(appError);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => key !== prevProps.resetKeys![index]);
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
      lastRetry: new Date(),
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetErrorBoundary}
          retryAction={this.handleRetry}
          reloadAction={this.handleReload}
          goHomeAction={this.handleGoHome}
          retryCount={this.state.retryCount}
          lastRetry={this.state.lastRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
