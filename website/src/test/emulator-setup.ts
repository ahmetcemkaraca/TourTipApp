import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import fs from 'fs';

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
        host: `${EMULATOR_HOST}:${EMULATOR_PORTS.firestore}`,
        ssl: false
      },
      storage: {
        rules: fs.readFileSync('storage.rules', 'utf8'),
        host: `${EMULATOR_HOST}:${EMULATOR_PORTS.storage}`,
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
      connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`);
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