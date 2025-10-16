// Firebase configuration and initialization
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const isEmulatorConnected = {
    auth: false,
    firestore: false,
    storage: false,
    functions: false
  };

  // Connect Auth emulator
  if (!isEmulatorConnected.auth) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      isEmulatorConnected.auth = true;
    } catch (error) {
      console.warn('Auth emulator connection failed:', error);
    }
  }

  // Connect Firestore emulator
  if (!isEmulatorConnected.firestore) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      isEmulatorConnected.firestore = true;
    } catch (error) {
      console.warn('Firestore emulator connection failed:', error);
    }
  }

  // Connect Storage emulator
  if (!isEmulatorConnected.storage) {
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
      isEmulatorConnected.storage = true;
    } catch (error) {
      console.warn('Storage emulator connection failed:', error);
    }
  }

  // Connect Functions emulator
  if (!isEmulatorConnected.functions) {
    try {
      connectFunctionsEmulator(functions, 'localhost', 5001);
      isEmulatorConnected.functions = true;
    } catch (error) {
      console.warn('Functions emulator connection failed:', error);
    }
  }
}

// Initialize Analytics (only in browser environment)
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics, app };
export default app;
