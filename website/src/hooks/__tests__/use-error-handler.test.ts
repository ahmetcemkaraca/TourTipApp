import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../use-error-handler';

// Mock Firebase Crashlytics
const mockCrashlytics = {
  recordError: vi.fn(),
  log: vi.fn()
};

vi.mock('@/lib/firebase-crashlytics', () => ({
  getCrashlytics: () => mockCrashlytics
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle errors and log to Crashlytics', () => {
    const { result } = renderHook(() => useErrorHandler());

    const error = new Error('Test error');
    const errorInfo = {
      componentStack: 'Test component stack'
    };

    act(() => {
      result.current.handleError(error, errorInfo);
    });

    expect(mockCrashlytics.recordError).toHaveBeenCalledWith(error, {
      componentStack: 'Test component stack'
    });
  });

  it('should handle errors without errorInfo', () => {
    const { result } = renderHook(() => useErrorHandler());

    const error = new Error('Test error');

    act(() => {
      result.current.handleError(error);
    });

    expect(mockCrashlytics.recordError).toHaveBeenCalledWith(error, {});
  });

  it('should handle async errors', async () => {
    const { result } = renderHook(() => useErrorHandler());

    const asyncError = new Error('Async error');

    await act(async () => {
      try {
        throw asyncError;
      } catch (error) {
        result.current.handleAsyncError(error as Error);
      }
    });

    expect(mockCrashlytics.recordError).toHaveBeenCalledWith(asyncError, {
      type: 'async'
    });
  });

  it('should log custom messages', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.logMessage('Test message', { level: 'info' });
    });

    expect(mockCrashlytics.log).toHaveBeenCalledWith('Test message');
  });

  it('should handle network errors specifically', () => {
    const { result } = renderHook(() => useErrorHandler());

    const networkError = new Error('Network request failed');
    networkError.name = 'NetworkError';

    act(() => {
      result.current.handleError(networkError);
    });

    expect(mockCrashlytics.recordError).toHaveBeenCalledWith(networkError, {
      errorType: 'network'
    });
  });

  it('should handle validation errors specifically', () => {
    const { result } = renderHook(() => useErrorHandler());

    const validationError = new Error('Validation failed');
    validationError.name = 'ValidationError';

    act(() => {
      result.current.handleError(validationError);
    });

    expect(mockCrashlytics.recordError).toHaveBeenCalledWith(validationError, {
      errorType: 'validation'
    });
  });

  it('should provide user-friendly error messages', () => {
    const { result } = renderHook(() => useErrorHandler());

    const error = new Error('Firebase: Error (auth/user-not-found).');
    const userMessage = result.current.getUserFriendlyMessage(error);

    expect(userMessage).toBe('Kullanıcı bulunamadı. Lütfen e-posta adresinizi kontrol edin.');
  });

  it('should handle unknown errors with generic message', () => {
    const { result } = renderHook(() => useErrorHandler());

    const error = new Error('Unknown error');
    const userMessage = result.current.getUserFriendlyMessage(error);

    expect(userMessage).toBe('Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
  });

  it('should track error frequency', () => {
    const { result } = renderHook(() => useErrorHandler());

    const error = new Error('Frequent error');

    // Simulate multiple occurrences of the same error
    act(() => {
      result.current.handleError(error);
      result.current.handleError(error);
      result.current.handleError(error);
    });

    expect(mockCrashlytics.recordError).toHaveBeenCalledTimes(3);
  });
});
