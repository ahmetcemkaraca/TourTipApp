'use client';

import { useCallback } from 'react';
import { FirebaseError } from 'firebase/app';
import { toast } from 'sonner';

// Error types
export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  action?: 'retry' | 'reload' | 'contact' | 'login';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Firebase error codes and user-friendly messages
const FIREBASE_ERROR_MESSAGES: Record<string, AppError> = {
  // Authentication errors
  'auth/user-not-found': {
    code: 'auth/user-not-found',
    message: 'User not found',
    userMessage: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.',
    action: 'contact',
    severity: 'medium',
  },
  'auth/wrong-password': {
    code: 'auth/wrong-password',
    message: 'Wrong password',
    userMessage: 'Şifre yanlış. Lütfen tekrar deneyin.',
    action: 'retry',
    severity: 'low',
  },
  'auth/email-already-in-use': {
    code: 'auth/email-already-in-use',
    message: 'Email already in use',
    userMessage: 'Bu e-posta adresi zaten kullanılıyor.',
    action: 'contact',
    severity: 'medium',
  },
  'auth/weak-password': {
    code: 'auth/weak-password',
    message: 'Weak password',
    userMessage: 'Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.',
    action: 'retry',
    severity: 'low',
  },
  'auth/invalid-email': {
    code: 'auth/invalid-email',
    message: 'Invalid email',
    userMessage: 'Geçersiz e-posta adresi formatı.',
    action: 'retry',
    severity: 'low',
  },
  'auth/user-disabled': {
    code: 'auth/user-disabled',
    message: 'User disabled',
    userMessage: 'Hesabınız devre dışı bırakılmış. Lütfen destek ile iletişime geçin.',
    action: 'contact',
    severity: 'high',
  },
  'auth/too-many-requests': {
    code: 'auth/too-many-requests',
    message: 'Too many requests',
    userMessage: 'Çok fazla giriş denemesi yapıldı. Lütfen biraz bekleyin.',
    action: 'retry',
    severity: 'medium',
  },

  // Firestore errors
  'permission-denied': {
    code: 'permission-denied',
    message: 'Permission denied',
    userMessage: 'Bu işlem için yetkiniz yok.',
    action: 'login',
    severity: 'medium',
  },
  'not-found': {
    code: 'not-found',
    message: 'Document not found',
    userMessage: 'Aradığınız içerik bulunamadı.',
    action: 'reload',
    severity: 'low',
  },
  'already-exists': {
    code: 'already-exists',
    message: 'Document already exists',
    userMessage: 'Bu işlem zaten gerçekleştirilmiş.',
    action: 'reload',
    severity: 'low',
  },
  'resource-exhausted': {
    code: 'resource-exhausted',
    message: 'Resource exhausted',
    userMessage: 'Hizmet şu anda yoğun. Lütfen daha sonra tekrar deneyin.',
    action: 'retry',
    severity: 'medium',
  },
  'failed-precondition': {
    code: 'failed-precondition',
    message: 'Failed precondition',
    userMessage: 'İşlem gerçekleştirilemedi. Lütfen koşulları kontrol edin.',
    action: 'retry',
    severity: 'medium',
  },
  'aborted': {
    code: 'aborted',
    message: 'Operation aborted',
    userMessage: 'İşlem iptal edildi. Lütfen tekrar deneyin.',
    action: 'retry',
    severity: 'low',
  },
  'out-of-range': {
    code: 'out-of-range',
    message: 'Out of range',
    userMessage: 'Geçersiz değer aralığı.',
    action: 'retry',
    severity: 'low',
  },
  'unimplemented': {
    code: 'unimplemented',
    message: 'Unimplemented',
    userMessage: 'Bu özellik henüz kullanılabilir değil.',
    action: 'contact',
    severity: 'low',
  },

  // Network errors
  'unavailable': {
    code: 'unavailable',
    message: 'Service unavailable',
    userMessage: 'Hizmet şu anda kullanılamıyor. İnternet bağlantınızı kontrol edin.',
    action: 'retry',
    severity: 'medium',
  },
  'deadline-exceeded': {
    code: 'deadline-exceeded',
    message: 'Deadline exceeded',
    userMessage: 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.',
    action: 'retry',
    severity: 'low',
  },

  // Storage errors
  'storage/unauthorized': {
    code: 'storage/unauthorized',
    message: 'Storage unauthorized',
    userMessage: 'Dosya yükleme yetkiniz yok.',
    action: 'login',
    severity: 'medium',
  },
  'storage/canceled': {
    code: 'storage/canceled',
    message: 'Storage canceled',
    userMessage: 'Dosya yükleme iptal edildi.',
    action: 'retry',
    severity: 'low',
  },
  'storage/quota-exceeded': {
    code: 'storage/quota-exceeded',
    message: 'Storage quota exceeded',
    userMessage: 'Depolama kotası aşıldı.',
    action: 'contact',
    severity: 'high',
  },
  'storage/invalid-format': {
    code: 'storage/invalid-format',
    message: 'Storage invalid format',
    userMessage: 'Geçersiz dosya formatı.',
    action: 'retry',
    severity: 'low',
  },
};

// Network error detection
function isNetworkError(error: any): boolean {
  return (
    !navigator.onLine ||
    error?.code === 'unavailable' ||
    error?.message?.includes('network') ||
    error?.message?.includes('connection') ||
    error?.name === 'NetworkError'
  );
}

// Firebase error parser
function parseFirebaseError(error: any): AppError {
  let errorCode = '';

  if (error instanceof FirebaseError) {
    errorCode = error.code;
  } else if (error?.code) {
    errorCode = error.code;
  } else if (error?.message) {
    // Try to extract error code from message
    const codeMatch = error.message.match(/\((\w+\/\w+)\)/);
    if (codeMatch) {
      errorCode = codeMatch[1];
    }
  }

  // Check for known Firebase errors
  if (FIREBASE_ERROR_MESSAGES[errorCode]) {
    return FIREBASE_ERROR_MESSAGES[errorCode];
  }

  // Check for network errors
  if (isNetworkError(error)) {
    return {
      code: 'network-error',
      message: 'Network error',
      userMessage: 'İnternet bağlantınızda sorun var. Lütfen bağlantınızı kontrol edin.',
      action: 'retry',
      severity: 'medium',
    };
  }

  // Generic error
  return {
    code: 'unknown-error',
    message: error?.message || 'Unknown error',
    userMessage: 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.',
    action: 'retry',
    severity: 'medium',
  };
}

// Main error handler hook
export function useErrorHandler() {
  const handleError = useCallback((error: any, context?: string) => {
    const appError = parseFirebaseError(error);

    // Log error for debugging
    console.error(`Error in ${context || 'unknown context'}:`, {
      originalError: error,
      parsedError: appError,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Log to Firebase Crashlytics if available
    if (typeof window !== 'undefined' && (window as any).firebase?.crashlytics) {
      const crashlytics = (window as any).firebase.crashlytics();
      crashlytics.recordError(error, {
        context: context || 'unknown',
        userMessage: appError.userMessage,
        severity: appError.severity,
      });
    }

    // Show user-friendly message
    showErrorToast(appError);

    // Log to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: appError.message,
        fatal: appError.severity === 'critical',
      });
    }

    return appError;
  }, []);

  const handleAsyncError = useCallback(async (asyncFn: () => Promise<any>, context?: string) => {
    try {
      return await asyncFn();
    } catch (error) {
      return handleError(error, context);
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
}

// Toast notification for errors
function showErrorToast(error: AppError) {
  const toastOptions = {
    duration: error.severity === 'critical' ? 10000 : 5000,
  };

  switch (error.severity) {
    case 'critical':
      toast.error(error.userMessage, {
        ...toastOptions,
        action: {
          label: 'Destek',
          onClick: () => window.location.href = '/contact',
        },
      });
      break;

    case 'high':
      toast.error(error.userMessage, toastOptions);
      break;

    case 'medium':
      toast.warning(error.userMessage, toastOptions);
      break;

    case 'low':
    default:
      toast(error.userMessage, toastOptions);
      break;
  }
}

// Retry utility
export function useRetry() {
  const retry = useCallback(async (
    fn: () => Promise<any>,
    maxRetries: number = 3,
    delay: number = 1000
  ) => {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry for certain errors
        const appError = parseFirebaseError(error);
        if (appError.severity === 'critical' ||
            appError.action === 'contact' ||
            appError.action === 'login') {
          throw error;
        }

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }, []);

  return { retry };
}

// Error recovery utilities
export function useErrorRecovery() {
  const recoverFromAuthError = useCallback(() => {
    // Clear auth state and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      window.location.href = '/auth/login';
    }
  }, []);

  const recoverFromNetworkError = useCallback(() => {
    // Show offline message or retry
    if (!navigator.onLine) {
      toast.info('İnternet bağlantısı bekleniyor...');
    } else {
      toast.info('Yeniden bağlanılıyor...');
      window.location.reload();
    }
  }, []);

  const recoverFromGenericError = useCallback(() => {
    // Generic recovery - just reload the page
    window.location.reload();
  }, []);

  return {
    recoverFromAuthError,
    recoverFromNetworkError,
    recoverFromGenericError,
  };
}

// Error reporting utility
export function useErrorReporting() {
  const reportError = useCallback(async (error: AppError, additionalInfo?: any) => {
    const errorReport = {
      ...error,
      additionalInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    try {
      // Send to error reporting service
      console.log('Error report:', errorReport);

      // You could send this to your error reporting service
      // await fetch('/api/error-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });

      toast.success('Hata raporu gönderildi');
    } catch (reportError) {
      console.error('Error reporting failed:', reportError);
      toast.error('Hata raporu gönderilemedi');
    }
  }, []);

  return { reportError };
}

// Loading error handler
export function useLoadingError() {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const handleLoadingError = useCallback((key: string, error: any) => {
    setLoading(key, false);

    const appError = parseFirebaseError(error);
    showErrorToast(appError);

    return appError;
  }, []);

  const withLoading = useCallback(async (
    key: string,
    asyncFn: () => Promise<any>
  ) => {
    try {
      setLoading(key, true);
      const result = await asyncFn();
      setLoading(key, false);
      return result;
    } catch (error) {
      return handleLoadingError(key, error);
    }
  }, [setLoading, handleLoadingError]);

  return {
    loadingStates,
    setLoading,
    handleLoadingError,
    withLoading,
  };
}
