import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { AccessibilityProvider } from '@/components/accessibility/a11y-provider'
import { PWAProvider } from '@/components/pwa/pwa-provider'
import { Toaster } from '@/components/ui/sonner'

// Custom render function that includes all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AccessibilityProvider>
        <PWAProvider>
          {children}
          <Toaster />
        </PWAProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock router for Next.js components
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  locale: 'tr',
  locales: ['tr', 'en', 'de'],
  defaultLocale: 'tr',
}

// Mock search params for Next.js 13+ app router
export const mockSearchParams = new URLSearchParams()

// Firebase mock utilities
export const mockFirebaseUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  phoneNumber: '+901234567890',
  metadata: {
    creationTime: '2023-01-01T00:00:00.000Z',
    lastSignInTime: '2023-12-01T00:00:00.000Z',
  },
  providerData: [
    {
      providerId: 'password',
      uid: 'test@example.com',
      displayName: 'Test User',
      email: 'test@example.com',
      phoneNumber: null,
      photoURL: null,
    },
  ],
}

export const mockFirebaseDoc = (data: any) => ({
  id: 'test-doc-id',
  data: () => data,
  exists: () => true,
  ref: {
    id: 'test-doc-id',
    path: 'test-collection/test-doc-id',
  },
  metadata: {
    fromCache: false,
    hasPendingWrites: false,
  },
})

export const mockFirebaseQuerySnapshot = (docs: any[]) => ({
  docs: docs.map(mockFirebaseDoc),
  size: docs.length,
  empty: docs.length === 0,
  forEach: (callback: (doc: any) => void) => docs.forEach(callback),
  docChanges: () => [],
  metadata: {
    fromCache: false,
    hasPendingWrites: false,
  },
})

// Mock implementations for Firebase SDK
export const mockFirebaseAuth = () => ({
  currentUser: mockFirebaseUser,
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: mockFirebaseUser,
  }),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: mockFirebaseUser,
  }),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn().mockImplementation((callback) => {
    callback(mockFirebaseUser)
    return vi.fn() // unsubscribe function
  }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  confirmPasswordReset: vi.fn().mockResolvedValue(undefined),
})

export const mockFirebaseFirestore = () => ({
  collection: vi.fn().mockReturnValue({
    doc: vi.fn().mockReturnThis(),
    add: vi.fn().mockResolvedValue({ id: 'test-doc-id' }),
    get: vi.fn().mockResolvedValue(mockFirebaseQuerySnapshot([])),
    onSnapshot: vi.fn().mockImplementation((callback) => {
      callback(mockFirebaseQuerySnapshot([]))
      return vi.fn() // unsubscribe function
    }),
  }),
  doc: vi.fn().mockReturnValue({
    id: 'test-doc-id',
    get: vi.fn().mockResolvedValue(mockFirebaseDoc({})),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    onSnapshot: vi.fn().mockImplementation((callback) => {
      callback(mockFirebaseDoc({}))
      return vi.fn() // unsubscribe function
    }),
  }),
  query: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  startAfter: vi.fn().mockReturnThis(),
  getDocs: vi.fn().mockResolvedValue(mockFirebaseQuerySnapshot([])),
  runTransaction: vi.fn().mockImplementation(async (updateFunction) => {
    return updateFunction({
      get: vi.fn().mockResolvedValue(mockFirebaseDoc({})),
      set: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    })
  }),
})

// Mock implementations for Firebase Storage
export const mockFirebaseStorage = () => ({
  ref: vi.fn().mockReturnValue({
    child: vi.fn().mockReturnThis(),
    put: vi.fn().mockResolvedValue({
      ref: { name: 'test-file.jpg' },
      metadata: { name: 'test-file.jpg', size: 1024 },
    }),
    getDownloadURL: vi.fn().mockResolvedValue('https://example.com/test-file.jpg'),
    delete: vi.fn().mockResolvedValue(undefined),
  }),
  refFromURL: vi.fn().mockReturnValue({
    name: 'test-file.jpg',
    getDownloadURL: vi.fn().mockResolvedValue('https://example.com/test-file.jpg'),
  }),
})

// Mock implementations for Firebase Functions
export const mockFirebaseFunctions = () => ({
  httpsCallable: vi.fn().mockReturnValue(
    vi.fn().mockResolvedValue({ data: { success: true } })
  ),
  httpsCallableFromURL: vi.fn().mockReturnValue(
    vi.fn().mockResolvedValue({ data: { success: true } })
  ),
})

// Mock implementations for Firebase Analytics
export const mockFirebaseAnalytics = () => ({
  logEvent: vi.fn(),
  setUserProperties: vi.fn(),
  setUserId: vi.fn(),
  setCurrentScreen: vi.fn(),
  setAnalyticsCollectionEnabled: vi.fn(),
})

// Mock implementations for Firebase Performance
export const mockFirebasePerformance = () => ({
  trace: vi.fn().mockReturnValue({
    start: vi.fn(),
    stop: vi.fn(),
    putAttribute: vi.fn(),
    putMetric: vi.fn(),
    getAttribute: vi.fn(),
    getMetric: vi.fn(),
  }),
  instrumentationEnabled: vi.fn(),
  dataCollectionEnabled: vi.fn(),
})

// Test helpers for common scenarios
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

export const waitForMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const createMockEvent = (type: string, options: any = {}) => {
  return {
    type,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: {
      value: options.value || '',
      checked: options.checked || false,
      name: options.name || '',
      ...options.target,
    },
    currentTarget: {
      value: options.value || '',
      checked: options.checked || false,
      name: options.name || '',
      ...options.currentTarget,
    },
    ...options,
  }
}

export const createMockFormEvent = (values: Record<string, any>) => {
  return createMockEvent('submit', {
    preventDefault: vi.fn(),
    target: {
      elements: Object.keys(values).reduce((acc, key) => {
        acc[key] = { value: values[key] }
        return acc
      }, {} as any),
    },
  })
}

// Custom test matchers
export const toHaveBeenCalledWithMatch = (mock: any, expected: any) => {
  const calls = mock.mock.calls
  const match = calls.some((call: any[]) =>
    call.some((arg: any) => JSON.stringify(arg) === JSON.stringify(expected))
  )

  return {
    message: () => `expected mock to have been called with matching object`,
    pass: match,
  }
}

// Performance testing utilities
export const measureRenderTime = async (component: ReactElement) => {
  const start = performance.now()
  customRender(component)
  const end = performance.now()

  return {
    renderTime: end - start,
    component,
  }
}

// Memory leak detection
export const detectMemoryLeaks = (component: ReactElement) => {
  const startMemory = (performance as any).memory?.usedJSHeapSize
  customRender(component)

  // Force garbage collection if available
  if ((window as any).gc) {
    ;(window as any).gc()
  }

  const endMemory = (performance as any).memory?.usedJSHeapSize
  const memoryIncrease = endMemory - startMemory

  return {
    memoryIncrease,
    startMemory,
    endMemory,
    hasLeak: memoryIncrease > 1024 * 1024, // 1MB threshold
  }
}

// Export custom render
export { customRender as render }

// Re-export everything from testing library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'