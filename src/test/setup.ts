import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import React from 'react'

// Mock environment variables
Object.defineProperty((global as any).window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
(global as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
(global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock fetch for tests
(global as any).fetch = vi.fn()

// Firebase test configuration
const firebaseConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test.firebaseapp.com',
  projectId: 'tourtrip-test',
  storageBucket: 'tourtrip-test.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:test',
}

// Initialize Firebase for testing
let app: any
let auth: any
let db: any
let storage: any
let functions: any

beforeAll(async () => {
  // Initialize Firebase app for testing
  app = initializeApp(firebaseConfig, 'test')

  // Initialize services
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
  functions = getFunctions(app)

  // Connect to emulators
  try {
    await connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    await connectFirestoreEmulator(db, '127.0.0.1', 8080)
    await connectStorageEmulator(storage, '127.0.0.1', 9199)
    await connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  } catch (error) {
    console.warn('Firebase emulators not available:', error)
  }

  // Set up global test utilities
  ;(global as any).firebaseApp = app
  ;(global as any).firebaseAuth = auth
  ;(global as any).firebaseDb = db
  ;(global as any).firebaseStorage = storage
  ;(global as any).firebaseFunctions = functions
})

afterEach(() => {
  cleanup()

  // Reset all mocks
  vi.clearAllMocks()
  vi.resetAllMocks()

  // Clear localStorage
  localStorage.clear()
  sessionStorage.clear()

  // Reset fetch mock
  ;((global as any).fetch as any).mockClear()
})

afterAll(async () => {
  // Clean up Firebase app
  if (app) {
    await app.delete()
  }
})

// Custom test utilities
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  ...overrides,
})

export const createMockTour = (overrides = {}) => ({
  id: 'test-tour-id',
  name: 'Test Tour',
  description: 'A test tour description',
  price: 100,
  duration: 2,
  location: 'Istanbul',
  category: 'cultural',
  images: ['test-image.jpg'],
  rating: 4.5,
  totalReviews: 10,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockBooking = (overrides = {}) => ({
  id: 'test-booking-id',
  userId: 'test-user-id',
  tourId: 'test-tour-id',
  totalAmount: 100,
  status: 'confirmed',
  participants: 2,
  bookingDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Test data factories
export const TestData = {
  user: createMockUser,
  tour: createMockTour,
  booking: createMockBooking,
}

// Mock implementations for common dependencies
export const mockAuth = {
  currentUser: createMockUser(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}

export const mockFirestore = vi.fn(() => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
}))

// Custom matchers - commented out due to type issues
// (global as any).expect.extend({
//   toBeVisible(received: any) {
//     const pass = received && !received.hidden && received.style.display !== 'none'
//     return {
//       message: () => `expected element to ${pass ? 'not ' : ''}be visible`,
//       pass,
//     }
//   },

//   toHaveFocus(received: any) {
//     const pass = received === document.activeElement
//     return {
//       message: () => `expected element to ${pass ? 'not ' : ''}have focus`,
//       pass,
//     }
//   },
// })

// Declare custom matchers for TypeScript
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeVisible(): T
    toHaveFocus(): T
  }
}

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<any>) => {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  const duration = end - start

  console.log(`Performance: ${fn.name} took ${duration.toFixed(2)}ms`)

  return {
    result,
    duration,
    start,
    end,
  }
}

// Accessibility testing utilities
export const checkAccessibility = (element: HTMLElement) => {
  const issues: string[] = []

  // Check for alt text on images
  const images = element.querySelectorAll('img')
  images.forEach((img, index) => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push(`Image ${index + 1} is missing alt text`)
    }
  })

  // Check for labels on form inputs
  const inputs = element.querySelectorAll('input, select, textarea')
  inputs.forEach((input, index) => {
    const label = element.querySelector(`label[for="${input.id}"]`)
    if (!label && !input.getAttribute('aria-label')) {
      issues.push(`Input ${index + 1} is missing a label`)
    }
  })

  // Check for heading hierarchy
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const headingLevels: number[] = []
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1))
    headingLevels.push(level)
  })

  // Check for proper heading hierarchy (should not skip levels)
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] > headingLevels[i - 1] + 1) {
      issues.push(`Heading hierarchy violation: ${headingLevels[i - 1]} to ${headingLevels[i]}`)
    }
  }

  return issues
}

// Firebase Functions testing utilities
export const mockFirebaseFunction = (functionName: string, returnValue: any) => {
  const mockFunction = vi.fn().mockResolvedValue({ data: returnValue })
  ;(global as any)[`mock${functionName}`] = mockFunction
  return mockFunction
}

export const createTestWrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'test-wrapper' }, children)
}

// Test utilities are already exported above