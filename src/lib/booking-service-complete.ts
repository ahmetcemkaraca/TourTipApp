/**
 * Complete Booking Service
 * Handles all booking-related operations
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { Booking, BookingSchema, COLLECTIONS } from './firestore-collections';
import { completeTourService } from './tour-service-complete';

export class CompleteBookingService {
  private collectionName = COLLECTIONS.BOOKINGS;

  /**
   * Create new booking
   */
  async createBooking(bookingData: {
    userId: string;
    tourId: string;
    date: Date;
    numberOfPeople: number;
  }): Promise<Booking> {
    // Get tour details for price calculation
    const tour = await completeTourService.getTourById(bookingData.tourId);
    if (!tour) {
      throw new Error('Tour not found');
    }

    // Calculate total price
    const totalPrice = tour.price * bookingData.numberOfPeople;

    const now = Timestamp.now();
    const newBooking = {
      userId: bookingData.userId,
      tourId: bookingData.tourId,
      providerId: tour.providerId,
      date: Timestamp.fromDate(bookingData.date),
      numberOfPeople: bookingData.numberOfPeople,
      totalPrice,
      currency: tour.currency,
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, this.collectionName), newBooking);
    const created = await this.getBookingById(docRef.id);

    if (!created) {
      throw new Error('Failed to create booking');
    }

    return created;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<Booking | null> {
    const docRef = doc(db, this.collectionName, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      ...snapshot.data(),
      id: snapshot.id,
      date: snapshot.data().date?.toDate() || new Date(),
      createdAt: snapshot.data().createdAt?.toDate() || new Date(),
      updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
    } as Booking;
  }

  /**
   * Get user's bookings
   */
  async getUserBookings(userId: string, status?: string): Promise<Booking[]> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    const q = query(collection(db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Booking[];
  }

  /**
   * Get provider's bookings
   */
  async getProviderBookings(providerId: string, status?: string): Promise<Booking[]> {
    const constraints: QueryConstraint[] = [
      where('providerId', '==', providerId),
      orderBy('createdAt', 'desc')
    ];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    const q = query(collection(db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Booking[];
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    id: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
    cancellationReason?: string
  ): Promise<Booking> {
    const docRef = doc(db, this.collectionName, id);

    const updates: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (cancellationReason) {
      updates.cancellationReason = cancellationReason;
    }

    await updateDoc(docRef, updates);

    const updated = await this.getBookingById(id);
    if (!updated) {
      throw new Error('Failed to update booking');
    }

    return updated;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: 'pending' | 'paid' | 'refunded',
    paymentIntentId?: string
  ): Promise<Booking> {
    const docRef = doc(db, this.collectionName, id);

    const updates: any = {
      paymentStatus,
      updatedAt: Timestamp.now(),
    };

    if (paymentIntentId) {
      updates.paymentIntentId = paymentIntentId;
    }

    // If payment is successful, confirm the booking
    if (paymentStatus === 'paid') {
      updates.status = 'confirmed';
    }

    await updateDoc(docRef, updates);

    const updated = await this.getBookingById(id);
    if (!updated) {
      throw new Error('Failed to update payment status');
    }

    return updated;
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    return this.updateBookingStatus(id, 'cancelled', reason);
  }

  /**
   * Confirm booking (provider confirms)
   */
  async confirmBooking(id: string): Promise<Booking> {
    return this.updateBookingStatus(id, 'confirmed');
  }

  /**
   * Complete booking (after tour is done)
   */
  async completeBooking(id: string): Promise<Booking> {
    return this.updateBookingStatus(id, 'completed');
  }

  /**
   * Check availability for a tour on a specific date
   */
  async checkAvailability(tourId: string, date: Date): Promise<{
    available: boolean;
    bookedSpots: number;
    maxCapacity?: number;
  }> {
    const tour = await completeTourService.getTourById(tourId);
    if (!tour) {
      return { available: false, bookedSpots: 0 };
    }

    // Get all confirmed bookings for this tour on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await this.getUserBookings(tourId);
    const confirmedBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return (
        booking.status === 'confirmed' &&
        bookingDate >= startOfDay &&
        bookingDate <= endOfDay
      );
    });

    const bookedSpots = confirmedBookings.reduce(
      (sum, booking) => sum + booking.numberOfPeople,
      0
    );

    const available = tour.maxCapacity ? bookedSpots < tour.maxCapacity : true;

    return {
      available,
      bookedSpots,
      maxCapacity: tour.maxCapacity || undefined,
    };
  }
}

// Export singleton instance
export const completeBookingService = new CompleteBookingService();
