// Global setup for Playwright tests
import { chromium, FullConfig } from '@playwright/test'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, addDoc } from 'firebase/firestore'

async function globalSetup(config: FullConfig) {
  console.log('Setting up test environment...')

  // Initialize Firebase for e2e tests
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  const app = initializeApp(firebaseConfig, 'e2e-test')
  const auth = getAuth(app)
  const db = getFirestore(app)

  // Create test user
  try {
    await signInWithEmailAndPassword(auth, 'test@example.com', 'testpassword123')
    console.log('Test user authenticated')
  } catch (error) {
    console.log('Test user already exists or authentication failed:', error)
  }

  // Seed test data
  try {
    const testTour = {
      id: 'e2e-test-tour',
      name: 'E2E Test Tour',
      description: 'This is a test tour for e2e testing',
      price: 100,
      duration: 2,
      location: 'Istanbul',
      category: 'cultural',
      images: ['/images/test-tour.jpg'],
      rating: 4.5,
      totalReviews: 10,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await addDoc(collection(db, 'tours'), testTour)
    console.log('Test data seeded')
  } catch (error) {
    console.log('Error seeding test data:', error)
  }

  console.log('Test environment setup complete')
}

export default globalSetup
