#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Firebase Emulator Setup Script
 * Configures and starts Firebase emulators for testing
 */

const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5001,
  hosting: 5000,
  storage: 9199,
  pubsub: 8085,
  eventarc: 9299
};

const EMULATOR_HOST = '127.0.0.1';

function log(message) {
  console.log(`[Emulator Setup] ${message}`);
}

function error(message) {
  console.error(`[Emulator Setup ERROR] ${message}`);
}

function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    log('Firebase CLI is installed');
    return true;
  } catch (err) {
    error('Firebase CLI is not installed. Please install it first: npm install -g firebase-tools');
    return false;
  }
}

function createEmulatorConfig() {
  const firebaseConfig = {
    emulators: {
      auth: {
        port: EMULATOR_PORTS.auth,
        host: EMULATOR_HOST
      },
      firestore: {
        port: EMULATOR_PORTS.firestore,
        host: EMULATOR_HOST
      },
      functions: {
        port: EMULATOR_PORTS.functions,
        host: EMULATOR_HOST
      },
      hosting: {
        port: EMULATOR_PORTS.hosting,
        host: EMULATOR_HOST
      },
      storage: {
        port: EMULATOR_PORTS.storage,
        host: EMULATOR_HOST
      },
      pubsub: {
        port: EMULATOR_PORTS.pubsub,
        host: EMULATOR_HOST
      },
      eventarc: {
        port: EMULATOR_PORTS.eventarc,
        host: EMULATOR_HOST
      },
      ui: {
        enabled: true,
        port: 4000,
        host: EMULATOR_HOST
      },
      singleProjectMode: true
    }
  };

  const configPath = path.join(process.cwd(), 'firebase.json');
  
  if (fs.existsSync(configPath)) {
    const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const updatedConfig = { ...existingConfig, ...firebaseConfig };
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    log('Updated firebase.json with emulator configuration');
  } else {
    fs.writeFileSync(configPath, JSON.stringify(firebaseConfig, null, 2));
    log('Created firebase.json with emulator configuration');
  }
}

function createSeedData() {
  const seedDataDir = path.join(process.cwd(), 'scripts', 'seed-data');
  
  if (!fs.existsSync(seedDataDir)) {
    fs.mkdirSync(seedDataDir, { recursive: true });
  }

  // Create seed data for Firestore
  const firestoreSeedData = {
    users: {
      'test-user-1': {
        uid: 'test-user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user',
        preferences: {
          language: 'tr',
          currency: 'TRY',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        }
      }
    },
    tours: {
      'test-tour-1': {
        id: 'test-tour-1',
        title: 'Test Tour',
        description: 'A test tour for development',
        price: 100,
        currency: 'TRY',
        duration: 4,
        maxParticipants: 20,
        category: 'cultural',
        location: {
          name: 'Istanbul',
          coordinates: {
            latitude: 41.0082,
            longitude: 28.9784
          }
        },
        images: [],
        rating: 4.5,
        reviewCount: 10,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    bookings: {
      'test-booking-1': {
        id: 'test-booking-1',
        userId: 'test-user-1',
        tourId: 'test-tour-1',
        participants: 2,
        totalPrice: 200,
        currency: 'TRY',
        status: 'confirmed',
        bookingDate: new Date().toISOString(),
        tourDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  };

  fs.writeFileSync(
    path.join(seedDataDir, 'firestore-seed.json'),
    JSON.stringify(firestoreSeedData, null, 2)
  );

  // Create seed data for Auth
  const authSeedData = {
    users: [
      {
        localId: 'test-user-1',
        email: 'test@example.com',
        emailVerified: true,
        displayName: 'Test User',
        photoUrl: null,
        passwordHash: 'test-hash',
        salt: 'test-salt',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        providerUserInfo: []
      }
    ]
  };

  fs.writeFileSync(
    path.join(seedDataDir, 'auth-seed.json'),
    JSON.stringify(authSeedData, null, 2)
  );

  log('Created seed data files');
}

function createTestScripts() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const testScripts = {
      'emulator:start': 'firebase emulators:start --import=./scripts/seed-data --export-on-exit=./scripts/seed-data',
      'emulator:start:debug': 'firebase emulators:start --import=./scripts/seed-data --export-on-exit=./scripts/seed-data --debug',
      'emulator:start:only': 'firebase emulators:start --only firestore,auth,functions,storage',
      'emulator:export': 'firebase emulators:export ./scripts/seed-data',
      'emulator:import': 'firebase emulators:import ./scripts/seed-data',
      'emulator:clean': 'rm -rf ./scripts/seed-data/*.json',
      'test:emulator': 'npm run emulator:start & sleep 10 && npm test && pkill -f firebase',
      'test:integration': 'npm run emulator:start & sleep 10 && npm run test:integration:run && pkill -f firebase',
      'test:integration:run': 'vitest run --config vitest.integration.config.ts'
    };

    packageJson.scripts = { ...packageJson.scripts, ...testScripts };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log('Added emulator test scripts to package.json');
  }
}

function createEmulatorTestConfig() {
  const vitestIntegrationConfig = {
    test: {
      environment: 'node',
      setupFiles: ['./src/test/emulator-setup.ts'],
      testTimeout: 30000,
      hookTimeout: 30000,
      teardownTimeout: 30000
    },
    define: {
      'process.env.FIREBASE_AUTH_EMULATOR_HOST': `"${EMULATOR_HOST}:${EMULATOR_PORTS.auth}"`,
      'process.env.FIRESTORE_EMULATOR_HOST': `"${EMULATOR_HOST}:${EMULATOR_PORTS.firestore}"`,
      'process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST': `"${EMULATOR_HOST}:${EMULATOR_PORTS.functions}"`,
      'process.env.FIREBASE_STORAGE_EMULATOR_HOST': `"${EMULATOR_HOST}:${EMULATOR_PORTS.storage}"`
    }
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'vitest.integration.config.ts'),
    `import { defineConfig } from 'vitest/config';

export default defineConfig(${JSON.stringify(vitestIntegrationConfig, null, 2)});`
  );

  log('Created vitest integration test configuration');
}

function createEmulatorSetupFile() {
  const emulatorSetupContent = `import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5001,
  storage: 9199
};

const EMULATOR_HOST = '127.0.0.1';

let testEnv: RulesTestEnvironment;

export async function setupEmulator() {
  try {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
        host: \`\${EMULATOR_HOST}:\${EMULATOR_PORTS.firestore}\`,
        ssl: false
      },
      storage: {
        rules: fs.readFileSync('storage.rules', 'utf8'),
        host: \`\${EMULATOR_HOST}:\${EMULATOR_PORTS.storage}\`,
        ssl: false
      }
    });

    // Connect to emulators
    const db = getFirestore();
    const auth = getAuth();
    const storage = getStorage();
    const functions = getFunctions();

    if (process.env.NODE_ENV === 'test') {
      connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORTS.firestore);
      connectAuthEmulator(auth, \`http://\${EMULATOR_HOST}:\${EMULATOR_PORTS.auth}\`);
      connectStorageEmulator(storage, EMULATOR_HOST, EMULATOR_PORTS.storage);
      connectFunctionsEmulator(functions, EMULATOR_HOST, EMULATOR_PORTS.functions);
    }

    return testEnv;
  } catch (error) {
    console.error('Failed to setup emulator:', error);
    throw error;
  }
}

export async function cleanupEmulator() {
  if (testEnv) {
    await testEnv.cleanup();
  }
}

export { testEnv };
`;

  const setupDir = path.join(process.cwd(), 'src', 'test');
  if (!fs.existsSync(setupDir)) {
    fs.mkdirSync(setupDir, { recursive: true });
  }

  fs.writeFileSync(path.join(setupDir, 'emulator-setup.ts'), emulatorSetupContent);
  log('Created emulator setup file');
}

function createGitIgnoreEntries() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const emulatorEntries = [
    '# Firebase Emulator',
    'scripts/seed-data/*.json',
    'firebase-debug.log',
    'firebase-debug.*.log',
    'ui-debug.log',
    '.firebase/',
    'firebase-export-*'
  ];

  if (fs.existsSync(gitignorePath)) {
    const existingContent = fs.readFileSync(gitignorePath, 'utf8');
    const newContent = existingContent + '\n' + emulatorEntries.join('\n');
    fs.writeFileSync(gitignorePath, newContent);
  } else {
    fs.writeFileSync(gitignorePath, emulatorEntries.join('\n'));
  }

  log('Updated .gitignore with emulator entries');
}

function main() {
  log('Starting Firebase Emulator setup...');

  if (!checkFirebaseCLI()) {
    process.exit(1);
  }

  createEmulatorConfig();
  createSeedData();
  createTestScripts();
  createEmulatorTestConfig();
  createEmulatorSetupFile();
  createGitIgnoreEntries();

  log('Firebase Emulator setup completed successfully!');
  log('Run "npm run emulator:start" to start the emulators');
  log('Run "npm run test:emulator" to run tests with emulators');
}

if (require.main === module) {
  main();
}

module.exports = {
  createEmulatorConfig,
  createSeedData,
  createTestScripts,
  createEmulatorTestConfig,
  createEmulatorSetupFile,
  createGitIgnoreEntries
};
