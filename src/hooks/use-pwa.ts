'use client';

import { useState, useEffect } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  deferredPrompt: any;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA(): PWAState & {
  install: () => Promise<void>;
  update: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
} {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                }
              });
            }
          });

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
              setIsUpdateAvailable(true);
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      console.log('[PWA] Install prompt available');
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] Back online');
      setIsOnline(true);

      // Sync offline data when back online
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_OFFLINE_DATA',
        });
      }
    };

    const handleOffline = () => {
      console.log('[PWA] Gone offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install');
        setIsInstalled(true);
      } else {
        console.log('[PWA] User dismissed install');
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      throw error;
    }
  };

  const update = async (): Promise<void> => {
    if (!registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      // Skip waiting for the new service worker
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Reload the page to activate the new service worker
      window.location.reload();
    } catch (error) {
      console.error('[PWA] Update failed:', error);
      throw error;
    }
  };

  const checkForUpdates = async (): Promise<void> => {
    if (!registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await registration.update();
      console.log('[PWA] Checked for updates');
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
      throw error;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    registration,
    deferredPrompt,
    install,
    update,
    checkForUpdates,
  };
}

// Hook for managing offline cache
export function useOfflineCache() {
  const [cacheSize, setCacheSize] = useState(0);
  const [isCaching, setIsCaching] = useState(false);

  useEffect(() => {
    calculateCacheSize();
  }, []);

  const calculateCacheSize = async () => {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          try {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
            }
          } catch (error) {
            // Skip invalid cache entries
          }
        }
      }

      setCacheSize(totalSize);
    } catch (error) {
      console.error('Error calculating cache size:', error);
    }
  };

  const clearCache = async () => {
    if (!('caches' in window)) return;

    try {
      setIsCaching(true);
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );

      setCacheSize(0);
      console.log('[PWA] Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsCaching(false);
    }
  };

  const preloadCriticalResources = async () => {
    if (!('caches' in window)) return;

    try {
      setIsCaching(true);
      const cache = await caches.open('tourtrip-critical-v1.0.0');

      const criticalResources = [
        '/',
        '/manifest.json',
        '/offline.html',
        '/icons/icon-192x192.png',
      ];

      await cache.addAll(criticalResources);
      console.log('[PWA] Critical resources preloaded');
    } catch (error) {
      console.error('Error preloading resources:', error);
    } finally {
      setIsCaching(false);
    }
  };

  return {
    cacheSize,
    isCaching,
    clearCache,
    preloadCriticalResources,
    formatCacheSize: (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
  };
}

// Hook for managing push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
      setSubscription(sub);
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  };

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      const reg = await navigator.serviceWorker.ready;

      // Request permission first
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push notifications
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      });

      setSubscription(sub);
      setIsSubscribed(true);

      console.log('[PWA] Push subscription successful');
      return sub;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      setIsSubscribed(false);
      console.log('[PWA] Push unsubscribed');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    subscribe,
    unsubscribe,
  };
}

// Utility function for VAPID key conversion
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Hook for managing background sync
export function useBackgroundSync() {
  const [isSupported, setIsSupported] = useState(false);
  const [syncQueue, setSyncQueue] = useState<string[]>([]);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      setIsSupported(true);
    }
  }, []);

  const registerSync = async (tag: string) => {
    if (!isSupported) {
      throw new Error('Background sync not supported');
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register(tag);
      setSyncQueue(prev => [...prev, tag]);
      console.log('[PWA] Background sync registered:', tag);
    } catch (error) {
      console.error('Error registering background sync:', error);
      throw error;
    }
  };

  const unregisterSync = async (tag: string) => {
    if (!isSupported) return;
    
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.unregister(tag);
      setSyncQueue(prev => prev.filter(t => t !== tag));
      console.log('[PWA] Background sync unregistered:', tag);
    } catch (error) {
      console.error('Error unregistering background sync:', error);
    }
  };

  return {
    isSupported,
    syncQueue,
    registerSync,
    unregisterSync,
  };
}