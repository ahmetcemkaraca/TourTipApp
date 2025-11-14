import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  runTransaction,
  QuerySnapshot,
  DocumentSnapshot,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { z } from 'zod';

// Generic CRUD service for Firestore collections
export class FirestoreService<T extends { id: string }> {
  private collectionName: string;
  private schema: z.ZodSchema<T>;

  constructor(collectionName: string, schema: z.ZodSchema<T>) {
    this.collectionName = collectionName;
    this.schema = schema;
  }

  // Create a new document
  async create(data: Omit<T, 'id'>, id?: string): Promise<string> {
    try {
      const collectionRef = collection(db, this.collectionName);
      
      if (id) {
        const docRef = doc(collectionRef, id);
        await setDoc(docRef, {
          ...data,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return id;
      } else {
        const docRef = await addDoc(collectionRef, {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Update the document with its ID
        await updateDoc(docRef, { id: docRef.id });
        return docRef.id;
      }
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Read a single document by ID
  async read(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as T;
        return this.schema.parse(data);
      }
      
      return null;
    } catch (error) {
      console.error(`Error reading document ${id} from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Update a document
  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(`Error updating document ${id} in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Delete a document
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${id} from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // List documents with optional filters and pagination
  async list(options: {
    filters?: { field: string; operator: any; value: any }[];
    orderField?: string;
    orderDirection?: 'asc' | 'desc';
    limitCount?: number;
    startAfterId?: string;
  } = {}): Promise<{ data: T[]; lastDoc?: DocumentSnapshot }> {
    try {
      const collectionRef = collection(db, this.collectionName);
      const constraints: QueryConstraint[] = [];

      // Add filters
      if (options.filters) {
        options.filters.forEach(filter => {
          constraints.push(where(filter.field, filter.operator, filter.value));
        });
      }

      // Add ordering
      if (options.orderField) {
        constraints.push(orderBy(options.orderField, options.orderDirection || 'asc'));
      }

      // Add pagination
      if (options.startAfterId) {
        const startAfterDoc = await getDoc(doc(db, this.collectionName, options.startAfterId));
        if (startAfterDoc.exists()) {
          constraints.push(startAfter(startAfterDoc));
        }
      }

      // Add limit
      if (options.limitCount) {
        constraints.push(limit(options.limitCount));
      }

      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const data: T[] = [];
      querySnapshot.forEach((doc) => {
        const docData = { id: doc.id, ...doc.data() } as T;
        try {
          const validatedData = this.schema.parse(docData);
          data.push(validatedData);
        } catch (validationError) {
          console.warn(`Invalid data for document ${doc.id}:`, validationError);
        }
      });

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      return { data, lastDoc };
    } catch (error) {
      console.error(`Error listing documents from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Real-time listener for a single document
  onDocumentChange(id: string, callback: (data: T | null) => void): Unsubscribe {
    const docRef = doc(db, this.collectionName, id);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        try {
          const data = { id: doc.id, ...doc.data() } as T;
          const validatedData = this.schema.parse(data);
          callback(validatedData);
        } catch (validationError) {
          console.warn(`Invalid data for document ${id}:`, validationError);
          callback(null);
        }
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Error in document listener for ${id}:`, error);
    });
  }

  // Real-time listener for a collection query
  onCollectionChange(
    options: {
      filters?: { field: string; operator: any; value: any }[];
      orderField?: string;
      orderDirection?: 'asc' | 'desc';
      limitCount?: number;
    } = {},
    callback: (data: T[]) => void
  ): Unsubscribe {
    const collectionRef = collection(db, this.collectionName);
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (options.filters) {
      options.filters.forEach(filter => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });
    }

    // Add ordering
    if (options.orderField) {
      constraints.push(orderBy(options.orderField, options.orderDirection || 'asc'));
    }

    // Add limit
    if (options.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(collectionRef, ...constraints);
    
    return onSnapshot(q, (querySnapshot) => {
      const data: T[] = [];
      querySnapshot.forEach((doc) => {
        const docData = { id: doc.id, ...doc.data() } as T;
        try {
          const validatedData = this.schema.parse(docData);
          data.push(validatedData);
        } catch (validationError) {
          console.warn(`Invalid data for document ${doc.id}:`, validationError);
        }
      });
      callback(data);
    }, (error) => {
      console.error(`Error in collection listener:`, error);
    });
  }

  // Batch operations
  async batchWrite(operations: {
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: Partial<T>;
  }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const collectionRef = collection(db, this.collectionName);

      operations.forEach((operation) => {
        switch (operation.type) {
          case 'create':
            if (operation.data) {
              const docRef = operation.id 
                ? doc(collectionRef, operation.id)
                : doc(collectionRef);
              batch.set(docRef, {
                ...operation.data,
                id: docRef.id,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
            break;
          case 'update':
            if (operation.id && operation.data) {
              const docRef = doc(collectionRef, operation.id);
              batch.update(docRef, {
                ...operation.data,
                updatedAt: new Date(),
              });
            }
            break;
          case 'delete':
            if (operation.id) {
              const docRef = doc(collectionRef, operation.id);
              batch.delete(docRef);
            }
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      console.error(`Error in batch operation for ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Transaction operations
  async runTransaction<R>(
    updateFunction: (transaction: any) => Promise<R>
  ): Promise<R> {
    try {
      return await runTransaction(db, updateFunction);
    } catch (error) {
      console.error(`Error in transaction for ${this.collectionName}:`, error);
      throw error;
    }
  }
}

// Export service instances for each collection
import {
  UserSchema,
  ServiceProviderSchema,
  TourSchema,
  BookingSchema,
  type User,
  type ServiceProvider,
  type Tour,
  type Booking
} from './firestore-collections';

// MVP Services
export const userService = new FirestoreService<User>('users', UserSchema);
export const serviceProviderService = new FirestoreService<ServiceProvider>('providers', ServiceProviderSchema);
export const tourService = new FirestoreService<Tour>('tours', TourSchema);
export const bookingService = new FirestoreService<Booking>('bookings', BookingSchema);

// Legacy alias for backward compatibility
export const serviceListingService = tourService;

// Custom service methods for specific business logic
export class TourService extends FirestoreService<Tour> {
  constructor() {
    super('tours', TourSchema);
  }

  // Search tours with full-text search (simplified version)
  async searchTours(query: string, filters: {
    category?: string;
    location?: string;
    maxPrice?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<ServiceListing[]> {
    const queryFilters = [];

    if (filters.category) {
      queryFilters.push({ field: 'category', operator: '==', value: filters.category });
    }

    if (filters.location) {
      queryFilters.push({ field: 'location.city', operator: '==', value: filters.location });
    }

    if (filters.maxPrice) {
      queryFilters.push({ field: 'price.amount', operator: '<=', value: filters.maxPrice });
    }

    // For date range, we'll add more complex logic later
    queryFilters.push({ field: 'status', operator: '==', value: 'active' });

    const result = await this.list({
      filters: queryFilters,
      orderField: 'rating',
      orderDirection: 'desc',
      limitCount: 50,
    });

    // Simple text search on title and description (for production, use Algolia or similar)
    if (query) {
      const searchLower = query.toLowerCase();
      return result.data.filter(tour => 
        tour.title.toLowerCase().includes(searchLower) ||
        tour.description.toLowerCase().includes(searchLower)
      );
    }

    return result.data;
  }

  // Get featured tours
  async getFeaturedTours(limit: number = 10): Promise<ServiceListing[]> {
    const result = await this.list({
      filters: [
        { field: 'status', operator: '==', value: 'active' }
      ],
      orderField: 'rating',
      orderDirection: 'desc',
      limitCount: limit,
    });

    return result.data;
  }

  // Get tours by category
  async getToursByCategory(category: string, limit: number = 20): Promise<ServiceListing[]> {
    const result = await this.list({
      filters: [
        { field: 'category', operator: '==', value: category },
        { field: 'status', operator: '==', value: 'active' }
      ],
      orderField: 'rating',
      orderDirection: 'desc',
      limitCount: limit,
    });

    return result.data;
  }
}

export const tourService = new TourService();

// Custom booking service with business logic
export class BookingService extends FirestoreService<Booking> {
  constructor() {
    super('bookings', BookingSchema);
  }

  // Create booking with availability check
  async createBookingWithValidation(bookingData: Omit<Booking, 'id'>): Promise<string> {
    return this.runTransaction(async (transaction) => {
      // Check tour availability
      const tourRef = doc(db, 'tours', bookingData.serviceId);
      const tourDoc = await transaction.get(tourRef);
      
      if (!tourDoc.exists()) {
        throw new Error('Tour not found');
      }

      const tour = tourDoc.data() as ServiceListing;
      
      // Check capacity (simplified - in production, check specific date availability)
      const totalParticipants = (bookingData.participants?.adults || 0) + 
                               (bookingData.participants?.children || 0);
      
      if (tour.capacity?.max && totalParticipants > tour.capacity.max) {
        throw new Error('Tour capacity exceeded');
      }

      // Create booking
      const bookingRef = doc(collection(db, 'bookings'));
      const bookingWithId = {
        ...bookingData,
        id: bookingRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      transaction.set(bookingRef, bookingWithId);

      return bookingRef.id;
    });
  }

  // Get user bookings
  async getUserBookings(userId: string): Promise<Booking[]> {
    const result = await this.list({
      filters: [
        { field: 'userId', operator: '==', value: userId }
      ],
      orderField: 'bookingDate',
      orderDirection: 'desc',
    });

    return result.data;
  }

  // Get provider bookings
  async getProviderBookings(providerId: string): Promise<Booking[]> {
    const result = await this.list({
      filters: [
        { field: 'providerId', operator: '==', value: providerId }
      ],
      orderField: 'bookingDate',
      orderDirection: 'desc',
    });

    return result.data;
  }
}

export const bookingServiceInstance = new BookingService();
