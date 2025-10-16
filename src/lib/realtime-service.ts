import { 
  doc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  QueryConstraint,
  DocumentData,
  Query,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export type RealtimeListener<T> = (data: T[]) => void;
export type RealtimeErrorHandler = (error: Error) => void;

export interface RealtimeSubscription {
  unsubscribe: Unsubscribe;
  path: string;
}

export class RealtimeService {
  private subscriptions = new Map<string, RealtimeSubscription>();

  /**
   * Listen to document changes in real-time
   */
  subscribeToDocument<T extends DocumentData>(
    collectionName: string,
    documentId: string,
    onData: (data: T | null) => void,
    onError?: RealtimeErrorHandler
  ): string {
    const subscriptionId = `doc_${collectionName}_${documentId}`;
    
    // Unsubscribe from existing subscription if any
    this.unsubscribe(subscriptionId);

    const docRef = doc(db, collectionName, documentId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          onData(null);
        }
      },
      (error) => {
        console.error(`Realtime error for document ${collectionName}/${documentId}:`, error);
        onError?.(error);
      }
    );

    this.subscriptions.set(subscriptionId, {
      unsubscribe,
      path: `${collectionName}/${documentId}`
    });

    return subscriptionId;
  }

  /**
   * Listen to collection changes in real-time
   */
  subscribeToCollection<T extends DocumentData>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
    onData: RealtimeListener<T>,
    onError?: RealtimeErrorHandler
  ): string {
    const subscriptionId = `col_${collectionName}_${Date.now()}`;
    
    // Unsubscribe from existing subscription if any
    this.unsubscribe(subscriptionId);

    const q = query(collection(db, collectionName), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        onData(data);
      },
      (error) => {
        console.error(`Realtime error for collection ${collectionName}:`, error);
        onError?.(error);
      }
    );

    this.subscriptions.set(subscriptionId, {
      unsubscribe,
      path: collectionName
    });

    return subscriptionId;
  }

  /**
   * Listen to user's notifications in real-time
   */
  subscribeToUserNotifications(
    userId: string,
    onData: RealtimeListener<any>,
    onError?: RealtimeErrorHandler
  ): string {
    return this.subscribeToCollection(
      'notifications',
      [
        where('userId', '==', userId),
        where('status', '!=', 'archived'),
        orderBy('status'),
        orderBy('createdAt', 'desc'),
        limit(50)
      ],
      onData,
      onError
    );
  }

  /**
   * Listen to user's bookings in real-time
   */
  subscribeToUserBookings(
    userId: string,
    onData: RealtimeListener<any>,
    onError?: RealtimeErrorHandler
  ): string {
    return this.subscribeToCollection(
      'bookings',
      [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      ],
      onData,
      onError
    );
  }

  /**
   * Listen to provider's bookings in real-time
   */
  subscribeToProviderBookings(
    providerId: string,
    onData: RealtimeListener<any>,
    onError?: RealtimeErrorHandler
  ): string {
    return this.subscribeToCollection(
      'bookings',
      [
        where('providerId', '==', providerId),
        orderBy('createdAt', 'desc'),
        limit(50)
      ],
      onData,
      onError
    );
  }

  /**
   * Listen to cart changes in real-time
   */
  subscribeToCart(
    cartId: string,
    onData: (cart: any | null) => void,
    onError?: RealtimeErrorHandler
  ): string {
    return this.subscribeToDocument('carts', cartId, onData, onError);
  }

  /**
   * Listen to service reviews in real-time
   */
  subscribeToServiceReviews(
    serviceId: string,
    onData: RealtimeListener<any>,
    onError?: RealtimeErrorHandler
  ): string {
    return this.subscribeToCollection(
      'reviews',
      [
        where('targetId', '==', serviceId),
        where('targetType', '==', 'service'),
        where('moderationStatus', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(20)
      ],
      onData,
      onError
    );
  }

  /**
   * Listen to admin notifications in real-time
   */
  subscribeToAdminNotifications(
    onData: RealtimeListener<any>,
    onError?: RealtimeErrorHandler
  ): string {
    return this.subscribeToCollection(
      'adminNotifications',
      [
        where('status', '==', 'unread'),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(20)
      ],
      onData,
      onError
    );
  }

  /**
   * Listen to system status in real-time
   */
  subscribeToSystemStatus(
    onData: (status: any | null) => void,
    onError?: RealtimeErrorHandler
  ): string {
    return this.subscribeToDocument('system', 'status', onData, onError);
  }

  /**
   * Listen to chat messages in real-time
   */
  subscribeToChatMessages(
    chatId: string,
    onData: RealtimeListener<any>,
    onError?: RealtimeErrorHandler
  ): string {
    return this.subscribeToCollection(
      `chats/${chatId}/messages`,
      [
        orderBy('createdAt', 'asc'),
        limit(100)
      ],
      onData,
      onError
    );
  }

  /**
   * Listen to online users in real-time
   */
  subscribeToOnlineUsers(
    onData: RealtimeListener<any>,
    onError?: RealtimeErrorHandler
  ): string {
    return this.subscribeToCollection(
      'userPresence',
      [
        where('status', '==', 'online'),
        orderBy('lastSeen', 'desc'),
        limit(100)
      ],
      onData,
      onError
    );
  }

  /**
   * Listen to live tour updates (for active tours)
   */
  subscribeToLiveTourUpdates(
    tourId: string,
    onData: RealtimeListener<any>,
    onError?: RealtimeErrorHandler
  ): string {
    return this.subscribeToCollection(
      `tours/${tourId}/liveUpdates`,
      [
        orderBy('timestamp', 'desc'),
        limit(20)
      ],
      onData,
      onError
    );
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get subscription info
   */
  getSubscriptionInfo(): Array<{ id: string; path: string }> {
    return Array.from(this.subscriptions.entries()).map(([id, sub]) => ({
      id,
      path: sub.path
    }));
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

// React Hook for using realtime service
export function useRealtimeSubscription() {
  return realtimeService;
}

// Utility function for creating subscription with cleanup
export function createRealtimeSubscription<T>(
  subscribeFunction: () => string,
  dependency: any[] = []
): { subscriptionId: string | null; cleanup: () => void } {
  let subscriptionId: string | null = null;

  const cleanup = () => {
    if (subscriptionId) {
      realtimeService.unsubscribe(subscriptionId);
      subscriptionId = null;
    }
  };

  // Subscribe
  subscriptionId = subscribeFunction();

  return { subscriptionId, cleanup };
}

// Connection status monitoring
export class ConnectionMonitor {
  private listeners: Array<(isConnected: boolean) => void> = [];
  private isConnected = true;

  constructor() {
    // Monitor network connectivity
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setConnectionStatus(true));
      window.addEventListener('offline', () => this.setConnectionStatus(false));
      
      // Initial status
      this.isConnected = navigator.onLine;
    }
  }

  private setConnectionStatus(connected: boolean) {
    if (this.isConnected !== connected) {
      this.isConnected = connected;
      this.listeners.forEach(listener => listener(connected));
    }
  }

  onConnectionChange(listener: (isConnected: boolean) => void) {
    this.listeners.push(listener);
    
    // Return cleanup function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const connectionMonitor = new ConnectionMonitor();
