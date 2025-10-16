import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupEmulator, cleanupEmulator, testEnv } from './emulator-setup';

describe('Firestore Security Rules', () => {
  beforeAll(async () => {
    await setupEmulator();
  });

  afterAll(async () => {
    await cleanupEmulator();
  });

  describe('Users Collection', () => {
    it('should allow users to read their own data', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceDoc = alice.firestore().doc('users/alice');
      
      await aliceDoc.set({
        uid: 'alice',
        email: 'alice@example.com',
        displayName: 'Alice',
        role: 'user'
      });

      await expect(aliceDoc.get()).resolves.toBeDefined();
    });

    it('should allow users to update their own data', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceDoc = alice.firestore().doc('users/alice');
      
      await aliceDoc.set({
        uid: 'alice',
        email: 'alice@example.com',
        displayName: 'Alice',
        role: 'user'
      });

      await expect(aliceDoc.update({
        displayName: 'Alice Updated'
      })).resolves.toBeDefined();
    });

    it('should deny users from reading other users data', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const bob = testEnv.authenticatedContext('bob');
      
      // Alice creates her document
      await alice.firestore().doc('users/alice').set({
        uid: 'alice',
        email: 'alice@example.com',
        displayName: 'Alice',
        role: 'user'
      });

      // Bob tries to read Alice's document
      await expect(bob.firestore().doc('users/alice').get()).rejects.toThrow();
    });

    it('should allow admins to read all user data', async () => {
      const admin = testEnv.authenticatedContext('admin', { role: 'admin' });
      const alice = testEnv.authenticatedContext('alice');
      
      // Alice creates her document
      await alice.firestore().doc('users/alice').set({
        uid: 'alice',
        email: 'alice@example.com',
        displayName: 'Alice',
        role: 'user'
      });

      // Admin should be able to read Alice's document
      await expect(admin.firestore().doc('users/alice').get()).resolves.toBeDefined();
    });
  });

  describe('Tours Collection', () => {
    it('should allow anyone to read active tours', async () => {
      const unauthenticated = testEnv.unauthenticatedContext();
      const tourDoc = unauthenticated.firestore().doc('tours/tour1');
      
      await tourDoc.set({
        id: 'tour1',
        title: 'Test Tour',
        description: 'A test tour',
        price: 100,
        currency: 'TRY',
        isActive: true,
        providerId: 'provider1'
      });

      await expect(tourDoc.get()).resolves.toBeDefined();
    });

    it('should deny reading inactive tours for non-providers', async () => {
      const unauthenticated = testEnv.unauthenticatedContext();
      const tourDoc = unauthenticated.firestore().doc('tours/tour1');
      
      await tourDoc.set({
        id: 'tour1',
        title: 'Test Tour',
        description: 'A test tour',
        price: 100,
        currency: 'TRY',
        isActive: false,
        providerId: 'provider1'
      });

      await expect(tourDoc.get()).rejects.toThrow();
    });

    it('should allow providers to read their own tours', async () => {
      const provider = testEnv.authenticatedContext('provider1');
      const tourDoc = provider.firestore().doc('tours/tour1');
      
      await tourDoc.set({
        id: 'tour1',
        title: 'Test Tour',
        description: 'A test tour',
        price: 100,
        currency: 'TRY',
        isActive: false,
        providerId: 'provider1'
      });

      await expect(tourDoc.get()).resolves.toBeDefined();
    });

    it('should allow providers to create tours', async () => {
      const provider = testEnv.authenticatedContext('provider1');
      const tourDoc = provider.firestore().doc('tours/tour1');
      
      await expect(tourDoc.set({
        id: 'tour1',
        title: 'Test Tour',
        description: 'A test tour',
        price: 100,
        currency: 'TRY',
        isActive: true,
        providerId: 'provider1'
      })).resolves.toBeDefined();
    });

    it('should deny non-providers from creating tours', async () => {
      const user = testEnv.authenticatedContext('user1');
      const tourDoc = user.firestore().doc('tours/tour1');
      
      await expect(tourDoc.set({
        id: 'tour1',
        title: 'Test Tour',
        description: 'A test tour',
        price: 100,
        currency: 'TRY',
        isActive: true,
        providerId: 'provider1'
      })).rejects.toThrow();
    });
  });

  describe('Bookings Collection', () => {
    it('should allow users to create their own bookings', async () => {
      const user = testEnv.authenticatedContext('user1');
      const bookingDoc = user.firestore().doc('bookings/booking1');
      
      await expect(bookingDoc.set({
        id: 'booking1',
        userId: 'user1',
        tourId: 'tour1',
        participants: 2,
        totalPrice: 200,
        currency: 'TRY',
        status: 'pending',
        createdAt: new Date().toISOString()
      })).resolves.toBeDefined();
    });

    it('should allow users to read their own bookings', async () => {
      const user = testEnv.authenticatedContext('user1');
      const bookingDoc = user.firestore().doc('bookings/booking1');
      
      await bookingDoc.set({
        id: 'booking1',
        userId: 'user1',
        tourId: 'tour1',
        participants: 2,
        totalPrice: 200,
        currency: 'TRY',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });

      await expect(bookingDoc.get()).resolves.toBeDefined();
    });

    it('should deny users from reading other users bookings', async () => {
      const user1 = testEnv.authenticatedContext('user1');
      const user2 = testEnv.authenticatedContext('user2');
      
      // User1 creates a booking
      await user1.firestore().doc('bookings/booking1').set({
        id: 'booking1',
        userId: 'user1',
        tourId: 'tour1',
        participants: 2,
        totalPrice: 200,
        currency: 'TRY',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });

      // User2 tries to read User1's booking
      await expect(user2.firestore().doc('bookings/booking1').get()).rejects.toThrow();
    });

    it('should allow providers to read bookings for their tours', async () => {
      const provider = testEnv.authenticatedContext('provider1');
      const user = testEnv.authenticatedContext('user1');
      
      // User creates a booking for provider's tour
      await user.firestore().doc('bookings/booking1').set({
        id: 'booking1',
        userId: 'user1',
        tourId: 'tour1',
        participants: 2,
        totalPrice: 200,
        currency: 'TRY',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });

      // Provider should be able to read the booking
      await expect(provider.firestore().doc('bookings/booking1').get()).resolves.toBeDefined();
    });
  });

  describe('Reviews Collection', () => {
    it('should allow users to create reviews', async () => {
      const user = testEnv.authenticatedContext('user1');
      const reviewDoc = user.firestore().doc('reviews/review1');
      
      await expect(reviewDoc.set({
        id: 'review1',
        userId: 'user1',
        tourId: 'tour1',
        rating: 5,
        comment: 'Great tour!',
        createdAt: new Date().toISOString()
      })).resolves.toBeDefined();
    });

    it('should allow anyone to read reviews', async () => {
      const unauthenticated = testEnv.unauthenticatedContext();
      const user = testEnv.authenticatedContext('user1');
      
      // User creates a review
      await user.firestore().doc('reviews/review1').set({
        id: 'review1',
        userId: 'user1',
        tourId: 'tour1',
        rating: 5,
        comment: 'Great tour!',
        createdAt: new Date().toISOString()
      });

      // Unauthenticated user should be able to read the review
      await expect(unauthenticated.firestore().doc('reviews/review1').get()).resolves.toBeDefined();
    });

    it('should allow users to update their own reviews', async () => {
      const user = testEnv.authenticatedContext('user1');
      const reviewDoc = user.firestore().doc('reviews/review1');
      
      await reviewDoc.set({
        id: 'review1',
        userId: 'user1',
        tourId: 'tour1',
        rating: 5,
        comment: 'Great tour!',
        createdAt: new Date().toISOString()
      });

      await expect(reviewDoc.update({
        comment: 'Updated comment'
      })).resolves.toBeDefined();
    });

    it('should deny users from updating other users reviews', async () => {
      const user1 = testEnv.authenticatedContext('user1');
      const user2 = testEnv.authenticatedContext('user2');
      
      // User1 creates a review
      await user1.firestore().doc('reviews/review1').set({
        id: 'review1',
        userId: 'user1',
        tourId: 'tour1',
        rating: 5,
        comment: 'Great tour!',
        createdAt: new Date().toISOString()
      });

      // User2 tries to update User1's review
      await expect(user2.firestore().doc('reviews/review1').update({
        comment: 'Malicious comment'
      })).rejects.toThrow();
    });
  });
});
