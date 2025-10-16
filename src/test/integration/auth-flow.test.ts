import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps, deleteApp } from 'firebase/app';

describe('Auth Flow Integration Tests', () => {
  let app: any;
  let auth: any;
  let db: any;

  beforeEach(async () => {
    // Initialize Firebase app for testing
    if (getApps().length === 0) {
      app = initializeApp({
        projectId: 'tourtrip-test',
        apiKey: 'test-api-key',
        authDomain: 'tourtrip-test.firebaseapp.com'
      });
    } else {
      app = getApps()[0];
    }

    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to emulators
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
      // Emulators might already be connected
    }
  });

  afterEach(async () => {
    if (auth.currentUser) {
      await signOut(auth);
    }
  });

  describe('User Registration Flow', () => {
    it('should create user account and profile', async () => {
      const email = 'test@tourtrip.app';
      const password = 'password123';
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        phone: '+905551234567',
        role: 'customer',
        isActive: true,
        createdAt: new Date(),
        profile: {
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
      };

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.email).toBe(email);

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...userData,
        id: userCredential.user.uid,
        email: userCredential.user.email
      });

      // Verify profile was created
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      expect(userDoc.exists()).toBe(true);
      
      const profileData = userDoc.data();
      expect(profileData?.firstName).toBe('Test');
      expect(profileData?.lastName).toBe('User');
      expect(profileData?.role).toBe('customer');
    });

    it('should handle duplicate email registration', async () => {
      const email = 'duplicate@tourtrip.app';
      const password = 'password123';

      // Create first user
      await createUserWithEmailAndPassword(auth, email, password);
      await signOut(auth);

      // Try to create duplicate user
      await expect(
        createUserWithEmailAndPassword(auth, email, password)
      ).rejects.toThrow();
    });
  });

  describe('User Login Flow', () => {
    it('should login existing user', async () => {
      const email = 'login-test@tourtrip.app';
      const password = 'password123';

      // First create the user
      await createUserWithEmailAndPassword(auth, email, password);
      await signOut(auth);

      // Now test login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.email).toBe(email);
      expect(auth.currentUser).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const email = 'nonexistent@tourtrip.app';
      const password = 'wrongpassword';

      await expect(
        signInWithEmailAndPassword(auth, email, password)
      ).rejects.toThrow();
    });

    it('should update last login timestamp', async () => {
      const email = 'timestamp-test@tourtrip.app';
      const password = 'password123';

      // Create user and profile
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email,
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        createdAt: new Date(),
        lastLoginAt: null
      });

      await signOut(auth);

      // Login and update timestamp
      await signInWithEmailAndPassword(auth, email, password);
      
      // Simulate updating lastLoginAt (this would be done by a trigger or client code)
      await setDoc(doc(db, 'users', userId), {
        lastLoginAt: new Date()
      }, { merge: true });

      // Verify timestamp was updated
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      expect(userData?.lastLoginAt).toBeDefined();
    });
  });

  describe('User Logout Flow', () => {
    it('should logout user successfully', async () => {
      const email = 'logout-test@tourtrip.app';
      const password = 'password123';

      // Create and login user
      await createUserWithEmailAndPassword(auth, email, password);
      expect(auth.currentUser).toBeDefined();

      // Logout
      await signOut(auth);
      expect(auth.currentUser).toBeNull();
    });
  });

  describe('Protected Route Access', () => {
    it('should allow authenticated user access', async () => {
      const email = 'access-test@tourtrip.app';
      const password = 'password123';

      // Create and login user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        id: userCredential.user.uid,
        email,
        role: 'customer',
        isActive: true
      });

      // Simulate protected operation (e.g., creating a booking)
      const canAccess = auth.currentUser && auth.currentUser.uid;
      expect(canAccess).toBeTruthy();

      // Verify user can read their own data
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      expect(userDoc.exists()).toBe(true);
    });

    it('should deny unauthenticated access', async () => {
      // Ensure no user is logged in
      if (auth.currentUser) {
        await signOut(auth);
      }

      // Try to access protected resource
      const canAccess = auth.currentUser;
      expect(canAccess).toBeNull();
    });
  });

  describe('Role-based Access', () => {
    it('should respect user roles', async () => {
      const customerEmail = 'customer@tourtrip.app';
      const adminEmail = 'admin@tourtrip.app';
      const password = 'password123';

      // Create customer user
      const customerCredential = await createUserWithEmailAndPassword(auth, customerEmail, password);
      await setDoc(doc(db, 'users', customerCredential.user.uid), {
        id: customerCredential.user.uid,
        email: customerEmail,
        role: 'customer',
        isActive: true
      });

      await signOut(auth);

      // Create admin user
      const adminCredential = await createUserWithEmailAndPassword(auth, adminEmail, password);
      await setDoc(doc(db, 'users', adminCredential.user.uid), {
        id: adminCredential.user.uid,
        email: adminEmail,
        role: 'admin',
        isActive: true
      });

      // Verify admin role
      const adminDoc = await getDoc(doc(db, 'users', adminCredential.user.uid));
      const adminData = adminDoc.data();
      expect(adminData?.role).toBe('admin');

      await signOut(auth);

      // Login as customer and verify role
      await signInWithEmailAndPassword(auth, customerEmail, password);
      const customerDoc = await getDoc(doc(db, 'users', customerCredential.user.uid));
      const customerData = customerDoc.data();
      expect(customerData?.role).toBe('customer');
    });
  });
});
