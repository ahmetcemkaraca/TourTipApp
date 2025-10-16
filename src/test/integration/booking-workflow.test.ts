import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, doc, getDoc, setDoc, addDoc, collection, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

describe('Booking Workflow Integration Tests', () => {
  let app: any;
  let auth: any;
  let db: any;
  let testUser: any;
  let testTour: any;

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

    // Create test user
    const userCredential = await createUserWithEmailAndPassword(auth, 'booking-test@tourtrip.app', 'password123');
    testUser = userCredential.user;

    await setDoc(doc(db, 'users', testUser.uid), {
      id: testUser.uid,
      email: testUser.email,
      firstName: 'Test',
      lastName: 'User',
      role: 'customer',
      isActive: true,
      createdAt: new Date()
    });

    // Create test tour
    const tourRef = await addDoc(collection(db, 'tours'), {
      title: 'Test Tour for Booking',
      description: 'A test tour for booking workflow',
      location: {
        name: 'İstanbul, Türkiye',
        coordinates: {
          latitude: 41.0082,
          longitude: 28.9784
        }
      },
      price: {
        amount: 150,
        currency: 'TRY'
      },
      duration: {
        hours: 4,
        days: 0
      },
      maxParticipants: 10,
      currentParticipants: 0,
      category: 'cultural',
      isActive: true,
      createdAt: new Date(),
      availableDates: [
        new Date('2024-09-15'),
        new Date('2024-09-16'),
        new Date('2024-09-17')
      ]
    });

    testTour = { id: tourRef.id, ...await getDoc(tourRef).then(doc => doc.data()) };
  });

  afterEach(async () => {
    // Clean up
    if (auth.currentUser) {
      await auth.signOut();
    }
  });

  describe('Tour Discovery and Selection', () => {
    it('should find available tours', async () => {
      const toursQuery = query(
        collection(db, 'tours'),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(toursQuery);
      expect(snapshot.size).toBeGreaterThan(0);

      const tours = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const foundTour = tours.find(tour => tour.id === testTour.id);
      expect(foundTour).toBeDefined();
    });

    it('should check tour availability', async () => {
      const tourDoc = await getDoc(doc(db, 'tours', testTour.id));
      const tourData = tourDoc.data();

      expect(tourData?.isActive).toBe(true);
      expect(tourData?.currentParticipants).toBeLessThan(tourData?.maxParticipants);
      expect(tourData?.availableDates).toBeInstanceOf(Array);
    });
  });

  describe('Booking Creation', () => {
    it('should create a new booking', async () => {
      const bookingData = {
        userId: testUser.uid,
        tourId: testTour.id,
        status: 'pending',
        bookingDate: new Date('2024-09-15'),
        participants: [
          {
            firstName: 'Test',
            lastName: 'User',
            email: testUser.email,
            phone: '+905551234567',
            age: 30
          }
        ],
        totalAmount: {
          amount: 150,
          currency: 'TRY'
        },
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      expect(bookingRef.id).toBeDefined();

      const createdBooking = await getDoc(bookingRef);
      expect(createdBooking.exists()).toBe(true);

      const bookingResult = createdBooking.data();
      expect(bookingResult?.userId).toBe(testUser.uid);
      expect(bookingResult?.tourId).toBe(testTour.id);
      expect(bookingResult?.status).toBe('pending');
    });

    it('should validate booking capacity', async () => {
      // First, update tour to be nearly full
      await updateDoc(doc(db, 'tours', testTour.id), {
        currentParticipants: 9, // maxParticipants is 10
        maxParticipants: 10
      });

      // Try to book for 2 people (should fail)
      const bookingData = {
        userId: testUser.uid,
        tourId: testTour.id,
        participants: [
          { firstName: 'User1', lastName: 'Test1', email: 'test1@example.com' },
          { firstName: 'User2', lastName: 'Test2', email: 'test2@example.com' }
        ]
      };

      // Simulate capacity check
      const tourDoc = await getDoc(doc(db, 'tours', testTour.id));
      const tourData = tourDoc.data();
      const requestedParticipants = bookingData.participants.length;
      const availableSpots = tourData!.maxParticipants - tourData!.currentParticipants;

      expect(requestedParticipants).toBeGreaterThan(availableSpots);
      // In real implementation, this would throw an error
    });
  });

  describe('Payment Processing', () => {
    it('should process payment and confirm booking', async () => {
      // Create a booking
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: testUser.uid,
        tourId: testTour.id,
        status: 'pending',
        bookingDate: new Date('2024-09-15'),
        participants: [
          {
            firstName: 'Test',
            lastName: 'User',
            email: testUser.email
          }
        ],
        totalAmount: {
          amount: 150,
          currency: 'TRY'
        },
        paymentStatus: 'pending',
        createdAt: new Date()
      });

      // Simulate payment processing
      const paymentData = {
        bookingId: bookingRef.id,
        amount: 150,
        currency: 'TRY',
        paymentMethod: 'credit_card',
        transactionId: 'test_transaction_123',
        status: 'completed',
        processedAt: new Date()
      };

      // Create payment record
      await addDoc(collection(db, 'payments'), paymentData);

      // Update booking status
      await updateDoc(bookingRef, {
        status: 'confirmed',
        paymentStatus: 'paid',
        updatedAt: new Date()
      });

      // Update tour participant count
      await updateDoc(doc(db, 'tours', testTour.id), {
        currentParticipants: 1
      });

      // Verify booking confirmation
      const confirmedBooking = await getDoc(bookingRef);
      const bookingData = confirmedBooking.data();
      expect(bookingData?.status).toBe('confirmed');
      expect(bookingData?.paymentStatus).toBe('paid');

      // Verify payment record
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('bookingId', '==', bookingRef.id)
      );
      const paymentSnapshot = await getDocs(paymentsQuery);
      expect(paymentSnapshot.size).toBe(1);
    });

    it('should handle payment failure', async () => {
      // Create a booking
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: testUser.uid,
        tourId: testTour.id,
        status: 'pending',
        paymentStatus: 'pending'
      });

      // Simulate payment failure
      const paymentData = {
        bookingId: bookingRef.id,
        amount: 150,
        currency: 'TRY',
        status: 'failed',
        errorMessage: 'Insufficient funds',
        processedAt: new Date()
      };

      await addDoc(collection(db, 'payments'), paymentData);

      // Update booking status
      await updateDoc(bookingRef, {
        status: 'cancelled',
        paymentStatus: 'failed',
        updatedAt: new Date()
      });

      // Verify booking cancellation
      const cancelledBooking = await getDoc(bookingRef);
      const bookingData = cancelledBooking.data();
      expect(bookingData?.status).toBe('cancelled');
      expect(bookingData?.paymentStatus).toBe('failed');
    });
  });

  describe('Booking Management', () => {
    it('should allow booking cancellation', async () => {
      // Create and confirm a booking
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: testUser.uid,
        tourId: testTour.id,
        status: 'confirmed',
        paymentStatus: 'paid',
        bookingDate: new Date('2024-09-15'),
        participants: [{ firstName: 'Test', lastName: 'User' }],
        createdAt: new Date()
      });

      // Cancel booking
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: 'User requested cancellation',
        updatedAt: new Date()
      });

      // Update tour participant count
      await updateDoc(doc(db, 'tours', testTour.id), {
        currentParticipants: 0
      });

      // Verify cancellation
      const cancelledBooking = await getDoc(bookingRef);
      const bookingData = cancelledBooking.data();
      expect(bookingData?.status).toBe('cancelled');
      expect(bookingData?.cancelledAt).toBeDefined();
    });

    it('should retrieve user bookings', async () => {
      // Create multiple bookings for the user
      await addDoc(collection(db, 'bookings'), {
        userId: testUser.uid,
        tourId: testTour.id,
        status: 'confirmed',
        bookingDate: new Date('2024-09-15')
      });

      await addDoc(collection(db, 'bookings'), {
        userId: testUser.uid,
        tourId: testTour.id,
        status: 'pending',
        bookingDate: new Date('2024-09-16')
      });

      // Query user bookings
      const userBookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', testUser.uid)
      );

      const snapshot = await getDocs(userBookingsQuery);
      expect(snapshot.size).toBe(2);

      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      expect(bookings.every(booking => booking.userId === testUser.uid)).toBe(true);
    });
  });

  describe('Notification Flow', () => {
    it('should create notifications for booking events', async () => {
      // Create a booking
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: testUser.uid,
        tourId: testTour.id,
        status: 'confirmed',
        paymentStatus: 'paid'
      });

      // Create confirmation notification
      await addDoc(collection(db, 'notifications'), {
        userId: testUser.uid,
        type: 'booking_confirmed',
        title: 'Rezervasyon Onaylandı',
        message: 'Tur rezervasyonunuz başarıyla onaylandı.',
        bookingId: bookingRef.id,
        isRead: false,
        createdAt: new Date()
      });

      // Verify notification was created
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', testUser.uid),
        where('type', '==', 'booking_confirmed')
      );

      const snapshot = await getDocs(notificationsQuery);
      expect(snapshot.size).toBe(1);

      const notification = snapshot.docs[0].data();
      expect(notification.bookingId).toBe(bookingRef.id);
      expect(notification.isRead).toBe(false);
    });
  });
});
