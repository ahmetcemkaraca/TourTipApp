import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeApp, getApps } from 'firebase/app';

// Mock Firebase modules
vi.mock('firebase/app');
vi.mock('firebase/firestore');
vi.mock('firebase/auth');
vi.mock('firebase/storage');
vi.mock('firebase/functions');
vi.mock('firebase/analytics');

describe('Firebase Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize Firebase app correctly', () => {
    // Mock getApps to return empty array (no apps initialized)
    vi.mocked(getApps).mockReturnValue([]);
    
    // Mock initializeApp
    const mockApp = { name: 'DEFAULT', options: {} };
    vi.mocked(initializeApp).mockReturnValue(mockApp as any);

    // Import the module that initializes Firebase
    require('@/lib/firebase');

    // Verify initializeApp was called
    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      authDomain: 'test-project.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: undefined,
      messagingSenderId: undefined,
      appId: undefined,
      measurementId: undefined
    });
  });

  it('should not reinitialize if app already exists', () => {
    // Mock getApps to return existing app
    const mockApp = { name: 'DEFAULT', options: {} };
    vi.mocked(getApps).mockReturnValue([mockApp as any]);

    // Import the module
    require('@/lib/firebase');

    // Verify initializeApp was not called again
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it('should handle missing environment variables gracefully', () => {
    // Temporarily remove env vars
    const originalApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    // Mock getApps to return empty array
    vi.mocked(getApps).mockReturnValue([]);

    // This should not throw an error
    expect(() => {
      require('@/lib/firebase');
    }).not.toThrow();

    // Restore env var
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = originalApiKey;
  });
});
