'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { QueryConstraint } from 'firebase/firestore';
import { realtimeService, RealtimeListener, RealtimeErrorHandler, connectionMonitor } from '@/lib/realtime-service';
import { useAuth } from '@/lib/auth';

export interface UseRealtimeOptions {
  enabled?: boolean;
  onError?: RealtimeErrorHandler;
}

export function useRealtimeDocument<T>(
  collectionName: string,
  documentId: string | null,
  options: UseRealtimeOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  const { enabled = true, onError } = options;

  useEffect(() => {
    if (!enabled || !documentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handleData = (newData: T | null) => {
      setData(newData);
      setLoading(false);
    };

    const handleError = (err: Error) => {
      setError(err);
      setLoading(false);
      onError?.(err);
    };

    subscriptionRef.current = realtimeService.subscribeToDocument(
      collectionName,
      documentId,
      handleData,
      handleError
    );

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [collectionName, documentId, enabled, onError]);

  return { data, loading, error };
}

export function useRealtimeCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  options: UseRealtimeOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  const { enabled = true, onError } = options;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handleData: RealtimeListener<T> = (newData) => {
      setData(newData);
      setLoading(false);
    };

    const handleError = (err: Error) => {
      setError(err);
      setLoading(false);
      onError?.(err);
    };

    subscriptionRef.current = realtimeService.subscribeToCollection(
      collectionName,
      constraints,
      handleData,
      handleError
    );

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [collectionName, JSON.stringify(constraints), enabled, onError]);

  return { data, loading, error };
}

export function useUserNotifications(options: UseRealtimeOptions = {}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<string | null>(null);

  const { enabled = true, onError } = options;

  useEffect(() => {
    if (!enabled || !user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handleData: RealtimeListener<any> = (newData) => {
      setNotifications(newData);
      setUnreadCount(newData.filter(n => n.status === 'unread').length);
      setLoading(false);
    };

    const handleError = (err: Error) => {
      setError(err);
      setLoading(false);
      onError?.(err);
    };

    subscriptionRef.current = realtimeService.subscribeToUserNotifications(
      user.uid,
      handleData,
      handleError
    );

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.uid, enabled, onError]);

  return { notifications, unreadCount, loading, error };
}

export function useUserBookings(options: UseRealtimeOptions = {}) {
  const { user } = useAuth();
  
  return useRealtimeCollection(
    'bookings',
    user?.uid ? [
      // Constraints will be added by the realtime service
    ] : [],
    { ...options, enabled: options.enabled !== false && !!user?.uid }
  );
}

export function useCart(cartId: string | null, options: UseRealtimeOptions = {}) {
  return useRealtimeDocument(
    'carts',
    cartId,
    options
  );
}

export function useServiceReviews(serviceId: string | null, options: UseRealtimeOptions = {}) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  const { enabled = true, onError } = options;

  useEffect(() => {
    if (!enabled || !serviceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handleData: RealtimeListener<any> = (newData) => {
      setReviews(newData);
      setLoading(false);
    };

    const handleError = (err: Error) => {
      setError(err);
      setLoading(false);
      onError?.(err);
    };

    subscriptionRef.current = realtimeService.subscribeToServiceReviews(
      serviceId,
      handleData,
      handleError
    );

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [serviceId, enabled, onError]);

  return { reviews, loading, error };
}

export function useChatMessages(chatId: string | null, options: UseRealtimeOptions = {}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  const { enabled = true, onError } = options;

  useEffect(() => {
    if (!enabled || !chatId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handleData: RealtimeListener<any> = (newData) => {
      setMessages(newData);
      setLoading(false);
    };

    const handleError = (err: Error) => {
      setError(err);
      setLoading(false);
      onError?.(err);
    };

    subscriptionRef.current = realtimeService.subscribeToChatMessages(
      chatId,
      handleData,
      handleError
    );

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [chatId, enabled, onError]);

  return { messages, loading, error };
}

export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    setIsConnected(connectionMonitor.getConnectionStatus());
    
    const cleanup = connectionMonitor.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    return cleanup;
  }, []);

  return isConnected;
}

export function useOnlineUsers(options: UseRealtimeOptions = {}) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  const { enabled = true, onError } = options;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handleData: RealtimeListener<any> = (newData) => {
      setUsers(newData);
      setLoading(false);
    };

    const handleError = (err: Error) => {
      setError(err);
      setLoading(false);
      onError?.(err);
    };

    subscriptionRef.current = realtimeService.subscribeToOnlineUsers(
      handleData,
      handleError
    );

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [enabled, onError]);

  return { users, loading, error };
}

export function useLiveTourUpdates(tourId: string | null, options: UseRealtimeOptions = {}) {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  const { enabled = true, onError } = options;

  useEffect(() => {
    if (!enabled || !tourId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handleData: RealtimeListener<any> = (newData) => {
      setUpdates(newData);
      setLoading(false);
    };

    const handleError = (err: Error) => {
      setError(err);
      setLoading(false);
      onError?.(err);
    };

    subscriptionRef.current = realtimeService.subscribeToLiveTourUpdates(
      tourId,
      handleData,
      handleError
    );

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [tourId, enabled, onError]);

  return { updates, loading, error };
}

// Custom hook for provider bookings
export function useProviderBookings(providerId: string | null, options: UseRealtimeOptions = {}) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  const { enabled = true, onError } = options;

  useEffect(() => {
    if (!enabled || !providerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handleData: RealtimeListener<any> = (newData) => {
      setBookings(newData);
      setLoading(false);
    };

    const handleError = (err: Error) => {
      setError(err);
      setLoading(false);
      onError?.(err);
    };

    subscriptionRef.current = realtimeService.subscribeToProviderBookings(
      providerId,
      handleData,
      handleError
    );

    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [providerId, enabled, onError]);

  return { bookings, loading, error };
}

// Hook for managing realtime subscriptions lifecycle
export function useRealtimeCleanup() {
  useEffect(() => {
    return () => {
      // Cleanup all subscriptions when component unmounts
      realtimeService.unsubscribeAll();
    };
  }, []);
}

// Hook for debugging realtime subscriptions
export function useRealtimeDebug() {
  const [subscriptions, setSubscriptions] = useState<Array<{ id: string; path: string }>>([]);
  const [count, setCount] = useState(0);

  const updateInfo = useCallback(() => {
    setSubscriptions(realtimeService.getSubscriptionInfo());
    setCount(realtimeService.getActiveSubscriptionsCount());
  }, []);

  useEffect(() => {
    const interval = setInterval(updateInfo, 1000);
    return () => clearInterval(interval);
  }, [updateInfo]);

  return { subscriptions, count, updateInfo };
}
