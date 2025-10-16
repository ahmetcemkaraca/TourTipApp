'use client';

import { useEffect } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { InstallPrompt, MiniInstallPrompt } from './install-prompt';
import { UpdateNotification } from './update-notification';

interface PWAProviderProps {
  children: React.ReactNode;
  showInstallPrompt?: boolean;
  showUpdateNotification?: boolean;
  showMiniInstallPrompt?: boolean;
  installPromptDelay?: number;
}

export function PWAProvider({
  children,
  showInstallPrompt = true,
  showUpdateNotification = true,
  showMiniInstallPrompt = true,
  installPromptDelay = 30000,
}: PWAProviderProps) {
  const {
    isInstallable,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    registration,
  } = usePWA();

  // Log PWA status
  useEffect(() => {
    console.log('[PWA] Status:', {
      isInstallable,
      isInstalled,
      isOnline,
      isUpdateAvailable,
      hasServiceWorker: !!registration,
    });
  }, [isInstallable, isInstalled, isOnline, isUpdateAvailable, registration]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      if (isOnline) {
        // Announce back online
        announceStatus('İnternet bağlantısı geri geldi');
      } else {
        // Announce offline
        announceStatus('Çevrimdışı mod aktif');
      }
    };

    handleOnlineStatusChange();
  }, [isOnline]);

  // Handle service worker updates
  useEffect(() => {
    if (registration) {
      const handleUpdateFound = () => {
        console.log('[PWA] Service Worker update found');
      };

      const handleUpdateReady = () => {
        console.log('[PWA] Service Worker update ready');
      };

      registration.addEventListener('updatefound', handleUpdateFound);

      if (registration.waiting) {
        handleUpdateReady();
      }

      return () => {
        registration.removeEventListener('updatefound', handleUpdateFound);
      };
    }
  }, [registration]);

  // Handle beforeunload to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Check for unsaved changes (this would be implemented based on your app's state)
      const hasUnsavedChanges = false; // Replace with actual check

      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'Kaydedilmemiş değişiklikler var. Sayfadan ayrılmak istediğinize emin misiniz?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Handle visibility change for background sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App became visible - check for updates and sync data
        console.log('[PWA] App became visible');

        // Check for service worker updates
        if (registration) {
          registration.update().catch(error => {
            console.error('[PWA] Update check failed:', error);
          });
        }

        // Sync offline data
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SYNC_OFFLINE_DATA',
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [registration]);

  return (
    <>
      {children}

      {/* PWA Components */}
      {showInstallPrompt && (
        <InstallPrompt delay={installPromptDelay} />
      )}

      {showMiniInstallPrompt && (
        <MiniInstallPrompt />
      )}

      {showUpdateNotification && (
        <UpdateNotification />
      )}

      {/* Offline indicator */}
      {!isOnline && (
        <OfflineIndicator />
      )}

      {/* PWA status for development */}
      {process.env.NODE_ENV === 'development' && (
        <PWAStatusIndicator />
      )}
    </>
  );
}

// Offline indicator component
function OfflineIndicator() {
  return (
    <div className="offline-indicator fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 text-sm font-medium z-40">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span>Çevrimdışı mod - Bazı özellikler sınırlı olabilir</span>
      </div>
    </div>
  );
}

// PWA status indicator for development
function PWAStatusIndicator() {
  const { isInstallable, isInstalled, isOnline, isUpdateAvailable } = usePWA();

  return (
    <div className="pwa-status-indicator fixed bottom-4 left-4 bg-black/80 text-white text-xs rounded-lg p-2 z-50 max-w-xs">
      <div className="font-medium mb-1">PWA Status (Dev)</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Yüklenebilir:</span>
          <span className={isInstallable ? 'text-green-400' : 'text-red-400'}>
            {isInstallable ? '✓' : '✗'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Yüklü:</span>
          <span className={isInstalled ? 'text-green-400' : 'text-red-400'}>
            {isInstalled ? '✓' : '✗'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Çevrimiçi:</span>
          <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
            {isOnline ? '✓' : '✗'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Güncelleme:</span>
          <span className={isUpdateAvailable ? 'text-yellow-400' : 'text-gray-400'}>
            {isUpdateAvailable ? '✓' : '−'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to announce status changes
function announceStatus(message: string) {
  // Create a temporary element for screen readers
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';

  announcement.textContent = message;
  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);

  console.log('[PWA]', message);
}

// PWA manifest link component (should be in document head)
export function PWAManifestLink() {
  useEffect(() => {
    // Ensure manifest link is in head
    const existingLink = document.querySelector('link[rel="manifest"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }

    // Add theme-color meta tag
    const existingThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!existingThemeColor) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#3B82F6';
      document.head.appendChild(meta);
    }

    // Add apple-touch-icon
    const existingAppleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!existingAppleIcon) {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = '/icons/icon-192x192.png';
      document.head.appendChild(link);
    }
  }, []);

  return null;
}

// Hook to check PWA readiness
export function usePWAAnalysis() {
  const pwa = usePWA();

  const analysis = {
    score: 0,
    maxScore: 100,
    checks: {
      hasManifest: !!document.querySelector('link[rel="manifest"]'),
      hasServiceWorker: !!pwa.registration,
      isInstallable: pwa.isInstallable,
      hasOfflineSupport: true, // Assume we have offline support
      hasPushSupport: 'serviceWorker' in navigator && 'PushManager' in window,
      hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      isOnline: pwa.isOnline,
      hasUpdateAvailable: pwa.isUpdateAvailable,
    },
  };

  // Calculate score
  let score = 0;
  if (analysis.checks.hasManifest) score += 15;
  if (analysis.checks.hasServiceWorker) score += 20;
  if (analysis.checks.isInstallable) score += 15;
  if (analysis.checks.hasOfflineSupport) score += 15;
  if (analysis.checks.hasPushSupport) score += 10;
  if (analysis.checks.hasBackgroundSync) score += 10;
  if (analysis.checks.isOnline) score += 10;
  if (!analysis.checks.hasUpdateAvailable) score += 5; // Bonus for being up to date

  analysis.score = score;

  return analysis;
}
