import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useErrorHandler } from '../use-error-handler'
import { FirebaseError } from 'firebase/app'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock gtag
vi.mock('@/lib/firebase-crashlytics', () => ({
  logError: vi.fn(),
}))

describe('useErrorHandler', () => {
  let mockToast: any

  beforeEach(() => {
    mockToast = vi.mocked(require('sonner').toast)
    vi.clearAllMocks()
  })

  it('should handle Firebase auth errors correctly', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const firebaseError = new FirebaseError('auth/user-not-found', 'User not found')

    await act(async () => {
      const error = await result.current.handleAsyncError(
        () => Promise.reject(firebaseError),
        'test context'
      )
    })

    expect(mockToast.error).toHaveBeenCalledWith(
      'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.',
      expect.any(Object)
    )
  })

  it('should handle network errors', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const networkError = new Error('Network Error')
    ;(networkError as any).code = 'unavailable'

    await act(async () => {
      const error = await result.current.handleAsyncError(
        () => Promise.reject(networkError),
        'network test'
      )
    })

    expect(mockToast.warning).toHaveBeenCalledWith(
      'İnternet bağlantınızda sorun var. Lütfen bağlantınızı kontrol edin.',
      expect.any(Object)
    )
  })

  it('should handle generic errors', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const genericError = new Error('Something went wrong')

    await act(async () => {
      const error = await result.current.handleAsyncError(
        () => Promise.reject(genericError),
        'generic test'
      )
    })

    expect(mockToast.warning).toHaveBeenCalledWith(
      'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.',
      expect.any(Object)
    )
  })

  it('should provide retry action for retryable errors', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const retryableError = new FirebaseError('auth/too-many-requests', 'Too many requests')

    let capturedError: any = null
    await act(async () => {
      capturedError = await result.current.handleAsyncError(
        () => Promise.reject(retryableError),
        'retry test'
      )
    })

    expect(capturedError?.action).toBe('retry')
    expect(mockToast.warning).toHaveBeenCalled()
  })

  it('should provide contact action for critical errors', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const criticalError = new FirebaseError('auth/user-disabled', 'User disabled')

    let capturedError: any = null
    await act(async () => {
      capturedError = await result.current.handleAsyncError(
        () => Promise.reject(criticalError),
        'critical test'
      )
    })

    expect(capturedError?.action).toBe('contact')
    expect(capturedError?.severity).toBe('high')
    expect(mockToast.error).toHaveBeenCalled()
  })

  it('should handle successful operations', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const mockSuccess = vi.fn().mockResolvedValue({ success: true })

    await act(async () => {
      const result = await result.current.handleAsyncError(mockSuccess, 'success test')
      expect(result).toEqual({ success: true })
    })

    // No error toast should be called
    expect(mockToast.error).not.toHaveBeenCalled()
    expect(mockToast.warning).not.toHaveBeenCalled()
  })

  it('should log errors to Firebase Crashlytics', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const mockCrashlytics = vi.mocked(require('@/lib/firebase-crashlytics').logError)
    const testError = new Error('Test error')

    await act(async () => {
      await result.current.handleAsyncError(
        () => Promise.reject(testError),
        'crashlytics test'
      )
    })

    expect(mockCrashlytics).toHaveBeenCalledWith(
      testError,
      expect.objectContaining({
        context: 'crashlytics test',
      })
    )
  })

  it('should handle different error severities correctly', async () => {
    const { result } = renderHook(() => useErrorHandler())

    // Test low severity error
    const lowSeverityError = new FirebaseError('auth/invalid-email', 'Invalid email')

    await act(async () => {
      await result.current.handleAsyncError(
        () => Promise.reject(lowSeverityError),
        'low severity test'
      )
    })

    expect(mockToast.warning).toHaveBeenCalled()

    // Reset mocks
    vi.clearAllMocks()

    // Test critical severity error
    const criticalError = new FirebaseError('auth/user-disabled', 'User disabled')

    await act(async () => {
      await result.current.handleAsyncError(
        () => Promise.reject(criticalError),
        'critical severity test'
      )
    })

    expect(mockToast.error).toHaveBeenCalled()
  })

  it('should provide appropriate user messages for different errors', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const testCases = [
      {
        error: new FirebaseError('auth/email-already-in-use', 'Email already in use'),
        expectedMessage: 'Bu e-posta adresi zaten kullanılıyor.',
      },
      {
        error: new FirebaseError('auth/weak-password', 'Weak password'),
        expectedMessage: 'Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.',
      },
      {
        error: new FirebaseError('auth/network-request-failed', 'Network request failed'),
        expectedMessage: 'İnternet bağlantınızda sorun var. Lütfen bağlantınızı kontrol edin.',
      },
    ]

    for (const testCase of testCases) {
      vi.clearAllMocks()

      await act(async () => {
        await result.current.handleAsyncError(
          () => Promise.reject(testCase.error),
          'message test'
        )
      })

      expect(mockToast.error).toHaveBeenCalledWith(
        testCase.expectedMessage,
        expect.any(Object)
      )
    }
  })
})
