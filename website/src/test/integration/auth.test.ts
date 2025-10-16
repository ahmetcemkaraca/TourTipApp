import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupEmulator, cleanupEmulator } from '../emulator-setup';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser
} from 'firebase/auth';

describe('Firebase Auth Integration Tests', () => {
  beforeAll(async () => {
    await setupEmulator();
  });

  afterAll(async () => {
    await cleanupEmulator();
  });

  it('should create a new user with email and password', async () => {
    const auth = getAuth();
    const email = 'test@example.com';
    const password = 'testpassword123';

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    expect(userCredential.user).toBeDefined();
    expect(userCredential.user.email).toBe(email);
    expect(userCredential.user.uid).toBeDefined();
  });

  it('should sign in with email and password', async () => {
    const auth = getAuth();
    const email = 'test@example.com';
    const password = 'testpassword123';

    // First create a user
    await createUserWithEmailAndPassword(auth, email, password);
    
    // Sign out first
    await signOut(auth);
    
    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    expect(userCredential.user).toBeDefined();
    expect(userCredential.user.email).toBe(email);
  });

  it('should update user profile', async () => {
    const auth = getAuth();
    const email = 'profile-test@example.com';
    const password = 'testpassword123';

    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, {
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg'
    });

    expect(user.displayName).toBe('Test User');
    expect(user.photoURL).toBe('https://example.com/photo.jpg');
  });

  it('should sign out user', async () => {
    const auth = getAuth();
    const email = 'signout-test@example.com';
    const password = 'testpassword123';

    // Create and sign in user
    await createUserWithEmailAndPassword(auth, email, password);
    expect(auth.currentUser).toBeDefined();

    // Sign out
    await signOut(auth);
    expect(auth.currentUser).toBeNull();
  });

  it('should delete user account', async () => {
    const auth = getAuth();
    const email = 'delete-test@example.com';
    const password = 'testpassword123';

    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const uid = user.uid;

    // Delete user
    await deleteUser(user);
    
    // Verify user is deleted by trying to sign in
    try {
      await signInWithEmailAndPassword(auth, email, password);
      expect.fail('User should not exist after deletion');
    } catch (error: any) {
      expect(error.code).toBe('auth/user-not-found');
    }
  });
});
