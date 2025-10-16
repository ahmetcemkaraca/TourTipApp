import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/emulator-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000
  },
  define: {
    'process.env.FIREBASE_AUTH_EMULATOR_HOST': '"127.0.0.1:9099"',
    'process.env.FIRESTORE_EMULATOR_HOST': '"127.0.0.1:8080"',
    'process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST': '"127.0.0.1:5001"',
    'process.env.FIREBASE_STORAGE_EMULATOR_HOST': '"127.0.0.1:9199"'
  }
});