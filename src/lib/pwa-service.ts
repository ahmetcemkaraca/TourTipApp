// PWA Service for TourTrip.app
export interface InstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAInstallationStatus {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  supportsPWA: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface PWANotificationPermission {
  permission: NotificationPermission;
  supported: boolean;
}

export interface SyncQueueItem {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class PWAService {
  private static instance: PWAService;
  private installPromptEvent: InstallPromptEvent | null = null;
  private syncQueue: SyncQueueItem[] = [];
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  private constructor() {
    this.initializeEventListeners();
  }

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  // Initialize PWA event listeners
  private initializeEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e as InstallPromptEvent;
      this.dispatchEvent('pwa-install-available');
    });

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      this.installPromptEvent = null;
      this.dispatchEvent('pwa-installed');
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.handleOnlineEvent();
    });

    window.addEventListener('offline', () => {
      this.handleOfflineEvent();
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          this.dispatchEvent('pwa-update-available');
        }
      });
    }
  }

  // Check PWA installation status
  getInstallationStatus(): PWAInstallationStatus {
    const canInstall = !!this.installPromptEvent;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    const isInstalled = isStandalone || 
                       document.referrer.includes('android-app://') ||
                       window.matchMedia('(display-mode: standalone)').matches;
    
    const supportsPWA = 'serviceWorker' in navigator && 'PushManager' in window;
    
    // Detect platform
    let platform: 'ios' | 'android' | 'desktop' | 'unknown' = 'unknown';
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      platform = 'ios';
    } else if (/android/.test(userAgent)) {
      platform = 'android';
    } else if (!/mobi/.test(userAgent)) {
      platform = 'desktop';
    }

    return {
      canInstall,
      isInstalled,
      isStandalone,
      supportsPWA,
      platform
    };
  }

  // Prompt user to install PWA
  async promptInstall(): Promise<boolean> {
    if (!this.installPromptEvent) {
      throw new Error('Install prompt not available');
    }

    try {
      await this.installPromptEvent.prompt();
      const choiceResult = await this.installPromptEvent.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        this.installPromptEvent = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  }

  // Get network status
  getNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    return {
      isOnline: navigator.onLine,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false
    };
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<PWANotificationPermission> {
    const supported = 'Notification' in window;
    
    if (!supported) {
      return { permission: 'default', supported: false };
    }

    let permission = Notification.permission;
    
    if (permission === 'default') {
      try {
        permission = await Notification.requestPermission();
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }

    return { permission, supported };
  }

  // Show notification
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    const { permission, supported } = await this.requestNotificationPermission();
    
    if (!supported || permission !== 'granted') {
      throw new Error('Notifications not supported or permission denied');
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        badge: '/icons/badge-72x72.png',
        icon: '/icons/icon-192x192.png',
        vibrate: [200, 100, 200],
        ...options
      });
    } else {
      new Notification(title, options);
    }
  }

  // Register for push notifications
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    const { permission } = await this.requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  // Add item to sync queue for offline operations
  addToSyncQueue(action: string, data: any): string {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const item: SyncQueueItem = {
      id,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.maxRetries
    };

    this.syncQueue.push(item);
    this.saveSyncQueue();
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }

    return id;
  }

  // Process sync queue
  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;

    const itemsToProcess = [...this.syncQueue];
    
    for (const item of itemsToProcess) {
      try {
        await this.processSyncItem(item);
        this.removeSyncItem(item.id);
      } catch (error) {
        console.error('Error processing sync item:', error);
        item.retryCount++;
        
        if (item.retryCount >= item.maxRetries) {
          console.error('Max retries reached for sync item:', item);
          this.removeSyncItem(item.id);
        } else {
          // Exponential backoff
          setTimeout(() => {
            this.processSyncQueue();
          }, this.retryDelay * Math.pow(2, item.retryCount));
        }
      }
    }

    this.saveSyncQueue();
  }

  // Process individual sync item
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.action) {
      case 'booking':
        await this.syncBooking(item.data);
        break;
      case 'review':
        await this.syncReview(item.data);
        break;
      case 'profile_update':
        await this.syncProfileUpdate(item.data);
        break;
      case 'favorite':
        await this.syncFavorite(item.data);
        break;
      default:
        console.warn('Unknown sync action:', item.action);
    }
  }

  // Sync methods for different actions
  private async syncBooking(data: any): Promise<void> {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to sync booking');
    }
  }

  private async syncReview(data: any): Promise<void> {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to sync review');
    }
  }

  private async syncProfileUpdate(data: any): Promise<void> {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to sync profile update');
    }
  }

  private async syncFavorite(data: any): Promise<void> {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to sync favorite');
    }
  }

  // Handle online event
  private handleOnlineEvent(): void {
    this.dispatchEvent('pwa-online');
    this.loadSyncQueue();
    this.processSyncQueue();
  }

  // Handle offline event
  private handleOfflineEvent(): void {
    this.dispatchEvent('pwa-offline');
  }

  // Save sync queue to localStorage
  private saveSyncQueue(): void {
    try {
      localStorage.setItem('pwa-sync-queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  // Load sync queue from localStorage
  private loadSyncQueue(): void {
    try {
      const saved = localStorage.getItem('pwa-sync-queue');
      if (saved) {
        this.syncQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  // Remove item from sync queue
  private removeSyncItem(id: string): void {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
  }

  // Get sync queue status
  getSyncQueueStatus(): { pending: number; failed: number } {
    const pending = this.syncQueue.filter(item => item.retryCount < item.maxRetries).length;
    const failed = this.syncQueue.filter(item => item.retryCount >= item.maxRetries).length;
    
    return { pending, failed };
  }

  // Clear failed sync items
  clearFailedSyncItems(): void {
    this.syncQueue = this.syncQueue.filter(item => item.retryCount < item.maxRetries);
    this.saveSyncQueue();
  }

  // Update service worker
  async updateServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    }
  }

  // Check for app updates
  async checkForUpdates(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      
      return registration.waiting !== null;
    }
    return false;
  }

  // Apply pending updates
  async applyUpdate(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }

  // Get app version
  getAppVersion(): string {
    return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  }

  // Track PWA usage
  trackPWAUsage(event: string, data?: any): void {
    // Track PWA specific events
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        event_category: 'PWA',
        event_label: this.getInstallationStatus().isStandalone ? 'Standalone' : 'Browser',
        ...data
      });
    }
  }

  // Share content using Web Share API
  async shareContent(shareData: ShareData): Promise<boolean> {
    if (!navigator.share) {
      // Fallback to clipboard or other sharing methods
      return this.fallbackShare(shareData);
    }

    try {
      await navigator.share(shareData);
      this.trackPWAUsage('share_success');
      return true;
    } catch (error) {
      console.error('Error sharing content:', error);
      this.trackPWAUsage('share_failed');
      return false;
    }
  }

  // Fallback share method
  private async fallbackShare(shareData: ShareData): Promise<boolean> {
    try {
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      await navigator.clipboard.writeText(shareText);
      this.showNotification('Link kopyalandı', {
        body: 'Paylaşım bağlantısı panoya kopyalandı',
        icon: '/icons/icon-192x192.png'
      });
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  // Dispatch custom events
  private dispatchEvent(eventName: string, detail?: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }

  // Register background sync
  async registerBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
    }
  }

  // Get storage usage
  async getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (used / quota) * 100 : 0;
      
      return { used, quota, percentage };
    }
    
    return { used: 0, quota: 0, percentage: 0 };
  }

  // Clear app cache
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }
}

// Export singleton instance
export const pwaService = PWAService.getInstance();
