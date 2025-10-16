// Firestore utilities and data models
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  DocumentData,
  QueryConstraint,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Data Models
export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  preferences: {
    language: string;
    currency: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  category: string;
  price: {
    amount: number;
    currency: string;
  };
  duration: {
    value: number;
    unit: string;
  };
  location: {
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  images: string[];
  rating: number;
  reviewCount: number;
  providerId: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  userId: string;
  tourId: string;
  providerId: string;
  bookingDate: Date;
  participants: {
    adults: number;
    children: number;
  };
  totalPrice: {
    amount: number;
    currency: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Generic Firestore Operations
export class FirestoreService {
  // Get a single document
  static async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Get multiple documents with optional filters
  static async getDocuments<T>(
    collectionName: string, 
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Add a new document
  static async addDocument<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
    try {
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, collectionName), docData);
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  // Update a document
  static async updateDocument<T>(
    collectionName: string, 
    docId: string, 
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete a document
  static async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Real-time listener for a collection
  static subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = []
  ) {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(data);
    });
  }
}

// Tour-specific operations
export class TourService {
  static async getTours(filters?: {
    category?: string;
    city?: string;
    maxPrice?: number;
    limit?: number;
  }): Promise<Tour[]> {
    const constraints: QueryConstraint[] = [
      where('status', '==', 'active'),
      orderBy('rating', 'desc')
    ];

    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    if (filters?.city) {
      constraints.push(where('location.city', '==', filters.city));
    }

    if (filters?.maxPrice) {
      constraints.push(where('price.amount', '<=', filters.maxPrice));
    }

    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }

    return FirestoreService.getDocuments<Tour>('tours', constraints);
  }

  static async getTourById(id: string): Promise<Tour | null> {
    return FirestoreService.getDocument<Tour>('tours', id);
  }

  static async searchTours(searchTerm: string): Promise<Tour[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation - consider using Algolia for production
    const constraints = [
      where('status', '==', 'active'),
      where('title', '>=', searchTerm),
      where('title', '<=', searchTerm + '\uf8ff'),
      orderBy('title'),
      limit(20)
    ];

    return FirestoreService.getDocuments<Tour>('tours', constraints);
  }
}

// Booking-specific operations
export class BookingService {
  static async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return FirestoreService.addDocument<Booking>('bookings', bookingData);
  }

  static async getUserBookings(userId: string): Promise<Booking[]> {
    const constraints = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ];

    return FirestoreService.getDocuments<Booking>('bookings', constraints);
  }

  static async getBookingById(id: string): Promise<Booking | null> {
    return FirestoreService.getDocument<Booking>('bookings', id);
  }

  static async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
    return FirestoreService.updateDocument<Booking>('bookings', bookingId, { status });
  }
}
