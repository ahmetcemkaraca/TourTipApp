'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to Firebase Crashlytics (if available)
    if (typeof window !== 'undefined' && (window as any).firebase?.crashlytics) {
      const crashlytics = (window as any).firebase.crashlytics();
      crashlytics.recordError(error, {
        component: 'ErrorBoundary',
        stackTrace: errorInfo.componentStack,
      });
    }

    // Log to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true,
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Copy error details to clipboard
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Hata detayları panoya kopyalandı. Lütfen destek ekibimize iletin.');
      })
      .catch(() => {
        alert('Hata raporunu oluşturmak için lütfen sayfayı yenileyin.');
      });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                Bir Hata Oluştu
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Üzgünüz, beklenmedik bir hata oluştu. Lütfen sayfayı yeniden yüklemeyi deneyin.
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-left bg-muted p-4 rounded-lg">
                    <summary className="cursor-pointer font-medium">
                      Hata Detayları (Geliştirme Modu)
                    </summary>
                    <pre className="mt-2 text-sm overflow-auto">
                      {this.state.error.message}
                      {this.state.error.stack && (
                        <>
                          {'\n\nStack Trace:'}
                          {this.state.error.stack}
                        </>
                      )}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Tekrar Dene
                </Button>

                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Ana Sayfaya Dön
                </Button>

                <Button variant="outline" onClick={this.handleReportError} className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Hata Bildir
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Sorun devam ederse, lütfen{' '}
                  <a href="/contact" className="text-primary hover:underline">
                    destek ekibimizle
                  </a>
                  {' '}iletişime geçin.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error handling in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Error handled by hook:', error, errorInfo);

    // Log to Firebase Crashlytics
    if (typeof window !== 'undefined' && (window as any).firebase?.crashlytics) {
      const crashlytics = (window as any).firebase.crashlytics();
      crashlytics.recordError(error, {
        component: 'useErrorHandler',
        stackTrace: errorInfo?.componentStack,
      });
    }

    // Log to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }

    // Show user-friendly error message
    if (typeof window !== 'undefined') {
      // You could use a toast notification here
      console.warn('An error occurred. Please try again.');
    }
  };
}

// Async error boundary for handling promise rejections
export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('error', this.handleGlobalError);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);

    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    this.setState({
      hasError: true,
      error,
      errorInfo: null,
    });

    this.props.onError?.(error, { componentStack: '' });
  };

  handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error:', event.error);

    this.setState({
      hasError: true,
      error: event.error,
      errorInfo: null,
    });

    this.props.onError?.(event.error, { componentStack: event.filename + ':' + event.lineno });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl text-orange-600">
                Bağlantı Hatası
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Ağ bağlantınızda bir sorun var. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sayfayı Yenile
                </Button>

                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  <Home className="h-4 w-4 mr-2" />
                  Ana Sayfa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error fallback component
export function ErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <h3 className="text-lg font-semibold text-red-800">
          Bir Hata Oluştu
        </h3>
      </div>

      <p className="text-red-700 mb-4">
        {error.message || 'Beklenmedik bir hata oluştu.'}
      </p>

      <div className="flex gap-3">
        <Button onClick={resetErrorBoundary} size="sm">
          Tekrar Dene
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Sayfayı Yenile
        </Button>
      </div>
    </div>
  );
}
