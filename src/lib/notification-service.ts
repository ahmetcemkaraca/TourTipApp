import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { doc, addDoc, collection, updateDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, app } from './firebase';
import { NotificationSchema } from './firestore-collections';

export interface NotificationData {
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'promotion' | 'system' | 'reminder';
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  channels?: ('in_app' | 'email' | 'sms' | 'push')[];
  actionUrl?: string;
  scheduledFor?: Date;
}

export interface PushNotificationOptions {
  badge?: string;
  icon?: string;
  image?: string;
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class NotificationService {
  private messaging: any = null;
  private token: string | null = null;
  private listeners: Map<string, (payload: MessagePayload) => void> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMessaging();
    }
  }

  private async initializeMessaging() {
    try {
      this.messaging = getMessaging(app);
      await this.requestPermission();
    } catch (error) {
      console.error('Error initializing messaging:', error);
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermission(): Promise<string | null> {
    if (!this.messaging) return null;

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        
        this.token = token;
        return token;
      } else {
        console.warn('Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('Error getting notification permission:', error);
      return null;
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Subscribe to foreground messages
   */
  onMessage(callback: (payload: MessagePayload) => void): () => void {
    if (!this.messaging) {
      return () => {};
    }

    const unsubscribe = onMessage(this.messaging, callback);
    const listenerId = Date.now().toString();
    this.listeners.set(listenerId, callback);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Show browser notification
   */
  async showNotification(
    title: string,
    body: string,
    options: PushNotificationOptions = {}
  ): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        image: options.image,
        tag: options.tag,
        renotify: options.renotify,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
        vibrate: options.vibrate,
        actions: options.actions,
      });

      // Auto close after 5 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return new Promise((resolve) => {
        notification.onclose = () => resolve();
        notification.onclick = () => {
          window.focus();
          notification.close();
          resolve();
        };
      });
    }
  }

  /**
   * Create notification in Firestore
   */
  async createNotification(
    userId: string,
    notificationData: NotificationData
  ): Promise<string> {
    try {
      const notification = {
        userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        status: 'unread' as const,
        priority: notificationData.priority || 'normal',
        channels: notificationData.channels || ['in_app'],
        actionUrl: notificationData.actionUrl,
        scheduledFor: notificationData.scheduledFor || null,
        sentAt: null,
        readAt: null,
        expiresAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: 'read',
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('status', '==', 'unread')
      );

      const snapshot = await getDocs(q);
      const batch = [];

      snapshot.docs.forEach((doc) => {
        batch.push(
          updateDoc(doc.ref, {
            status: 'read',
            readAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      });

      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: 'archived',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get user's notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<any> {
    try {
      // TODO: Implement getting user preferences from Firestore
      return {
        email: true,
        push: true,
        sms: false,
        inApp: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
        },
        categories: {
          booking: true,
          payment: true,
          promotion: false,
          system: true,
          reminder: true,
        },
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: any
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        notificationPreferences: preferences,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(
    userId: string,
    bookingData: {
      bookingId: string;
      serviceName: string;
      date: string;
      amount: number;
      currency: string;
    }
  ): Promise<void> {
    const notification: NotificationData = {
      title: 'Rezervasyon Onaylandı! 🎉',
      message: `${bookingData.serviceName} rezervasyonunuz onaylandı. Tur tarihi: ${bookingData.date}`,
      type: 'booking',
      priority: 'high',
      channels: ['in_app', 'push', 'email'],
      actionUrl: `/dashboard/bookings/${bookingData.bookingId}`,
      data: {
        bookingId: bookingData.bookingId,
        serviceName: bookingData.serviceName,
        amount: bookingData.amount,
        currency: bookingData.currency,
      },
    };

    await this.createNotification(userId, notification);
  }

  /**
   * Send payment confirmation notification
   */
  async sendPaymentConfirmation(
    userId: string,
    paymentData: {
      paymentId: string;
      amount: number;
      currency: string;
      serviceName: string;
    }
  ): Promise<void> {
    const notification: NotificationData = {
      title: 'Ödeme Başarılı! ✅',
      message: `${paymentData.amount} ${paymentData.currency} ödemeniz başarıyla alındı.`,
      type: 'payment',
      priority: 'high',
      channels: ['in_app', 'push', 'email'],
      actionUrl: `/dashboard/payments/${paymentData.paymentId}`,
      data: paymentData,
    };

    await this.createNotification(userId, notification);
  }

  /**
   * Send tour reminder notification
   */
  async sendTourReminder(
    userId: string,
    tourData: {
      bookingId: string;
      serviceName: string;
      date: string;
      time: string;
      location: string;
    }
  ): Promise<void> {
    const notification: NotificationData = {
      title: 'Tur Hatırlatması! ⏰',
      message: `${tourData.serviceName} turunuz yarın ${tourData.time}'da başlıyor.`,
      type: 'reminder',
      priority: 'high',
      channels: ['in_app', 'push'],
      actionUrl: `/dashboard/bookings/${tourData.bookingId}`,
      data: tourData,
    };

    await this.createNotification(userId, notification);
  }

  /**
   * Send promotional notification
   */
  async sendPromotion(
    userId: string,
    promoData: {
      title: string;
      description: string;
      discount: number;
      validUntil: string;
      promoCode?: string;
    }
  ): Promise<void> {
    const notification: NotificationData = {
      title: promoData.title,
      message: promoData.description,
      type: 'promotion',
      priority: 'normal',
      channels: ['in_app', 'push'],
      actionUrl: '/tours',
      data: promoData,
    };

    await this.createNotification(userId, notification);
  }

  /**
   * Send system notification
   */
  async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<void> {
    const notification: NotificationData = {
      title,
      message,
      type: 'system',
      priority,
      channels: ['in_app'],
    };

    await this.createNotification(userId, notification);
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    userIds: string[],
    notificationData: NotificationData
  ): Promise<string[]> {
    const promises = userIds.map(userId =>
      this.createNotification(userId, notificationData)
    );

    return Promise.all(promises);
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(
    userId: string,
    notificationData: NotificationData,
    scheduledFor: Date
  ): Promise<string> {
    return this.createNotification(userId, {
      ...notificationData,
      scheduledFor,
    });
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    await this.deleteNotification(notificationId);
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Utility functions for common notification types
export const NotificationTemplates = {
  bookingConfirmation: (serviceName: string, date: string) => ({
    title: 'Rezervasyon Onaylandı! 🎉',
    message: `${serviceName} rezervasyonunuz onaylandı. Tur tarihi: ${date}`,
  }),

  paymentSuccess: (amount: number, currency: string) => ({
    title: 'Ödeme Başarılı! ✅',
    message: `${amount} ${currency} ödemeniz başarıyla alındı.`,
  }),

  tourReminder: (serviceName: string, hours: number) => ({
    title: 'Tur Hatırlatması! ⏰',
    message: `${serviceName} turunuz ${hours} saat sonra başlıyor.`,
  }),

  reviewRequest: (serviceName: string) => ({
    title: 'Deneyiminizi Paylaşın! ⭐',
    message: `${serviceName} turu hakkında değerlendirme yapın.`,
  }),

  priceAlert: (serviceName: string, newPrice: number, currency: string) => ({
    title: 'Fiyat Düştü! 💰',
    message: `${serviceName} turu artık ${newPrice} ${currency}`,
  }),

  cancellation: (serviceName: string, refundAmount?: number) => ({
    title: 'Rezervasyon İptal Edildi',
    message: refundAmount 
      ? `${serviceName} rezervasyonunuz iptal edildi. ${refundAmount} TL iade edilecek.`
      : `${serviceName} rezervasyonunuz iptal edildi.`,
  }),

  weatherAlert: (serviceName: string, condition: string) => ({
    title: 'Hava Durumu Uyarısı! 🌦️',
    message: `${serviceName} turu için ${condition} bekleniyor.`,
  }),

  lastMinuteDeal: (serviceName: string, discount: number) => ({
    title: 'Son Dakika Fırsatı! ⚡',
    message: `${serviceName} turunda %${discount} indirim!`,
  }),
};

// Initialize notification service
if (typeof window !== 'undefined') {
  // Setup service worker for background notifications
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('SW registration successful:', registration);
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  }
}
