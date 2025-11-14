/**
 * Complete Tour Service
 * Handles all tour-related operations with Firebase
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  Timestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Tour, TourSchema, COLLECTIONS } from './firestore-collections';

export class CompleteTourService {
  private collectionName = COLLECTIONS.TOURS;

  /**
   * Get all tours with optional filters
   */
  async getTours(filters?: {
    category?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    limitCount?: number;
  }): Promise<Tour[]> {
    const constraints: QueryConstraint[] = [];

    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }
    if (filters?.city) {
      constraints.push(where('location.city', '==', filters.city));
    }
    if (filters?.isActive !== undefined) {
      constraints.push(where('isActive', '==', filters.isActive));
    }
    if (filters?.minPrice) {
      constraints.push(where('price', '>=', filters.minPrice));
    }
    if (filters?.maxPrice) {
      constraints.push(where('price', '<=', filters.maxPrice));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (filters?.limitCount) {
      constraints.push(limit(filters.limitCount));
    }

    const q = query(collection(db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Tour[];
  }

  /**
   * Get tour by ID
   */
  async getTourById(id: string): Promise<Tour | null> {
    const docRef = doc(db, this.collectionName, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      ...snapshot.data(),
      id: snapshot.id,
      createdAt: snapshot.data().createdAt?.toDate() || new Date(),
      updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
    } as Tour;
  }

  /**
   * Search tours by title or description
   */
  async searchTours(searchQuery: string): Promise<Tour[]> {
    const allTours = await this.getTours({ isActive: true });

    const searchLower = searchQuery.toLowerCase();
    return allTours.filter(tour =>
      tour.title.toLowerCase().includes(searchLower) ||
      tour.description.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Get tours by provider ID
   */
  async getToursByProvider(providerId: string): Promise<Tour[]> {
    const q = query(
      collection(db, this.collectionName),
      where('providerId', '==', providerId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Tour[];
  }

  /**
   * Create new tour
   */
  async createTour(tourData: Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tour> {
    const now = Timestamp.now();
    const newTour = {
      ...tourData,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, this.collectionName), newTour);
    const created = await this.getTourById(docRef.id);

    if (!created) {
      throw new Error('Failed to create tour');
    }

    return created;
  }

  /**
   * Update tour
   */
  async updateTour(id: string, updates: Partial<Omit<Tour, 'id' | 'createdAt'>>): Promise<Tour> {
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    const updated = await this.getTourById(id);
    if (!updated) {
      throw new Error('Failed to update tour');
    }

    return updated;
  }

  /**
   * Delete tour (soft delete by setting isActive to false)
   */
  async deleteTour(id: string): Promise<void> {
    await this.updateTour(id, { isActive: false });
  }

  /**
   * Get featured/popular tours
   */
  async getFeaturedTours(limitCount: number = 6): Promise<Tour[]> {
    return this.getTours({ isActive: true, limitCount });
  }

  /**
   * Get tours by category
   */
  async getToursByCategory(category: string, limitCount?: number): Promise<Tour[]> {
    return this.getTours({ category, isActive: true, limitCount });
  }

  /**
   * Get tours by city
   */
  async getToursByCity(city: string, limitCount?: number): Promise<Tour[]> {
    return this.getTours({ city, isActive: true, limitCount });
  }
}

// Export singleton instance
export const completeTourService = new CompleteTourService();
