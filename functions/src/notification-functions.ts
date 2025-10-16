import { onDocumentCreated, onDocumentUpdated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { HttpsError, onCall, CallableRequest } from 'firebase-functions/v2/https';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

const db = getFirestore();
const messaging = getMessaging();

/**
 * Send FCM notification when a new notification document is created
 */
export const sendPushNotification = onDocumentCreated(
  'notifications/{notificationId}',
  async (event: FirestoreEvent<any, any>) => {
    const notification = event.data?.data();
    if (!notification) return;

    const { userId, title, message, data, channels, priority } = notification;

    // Check if push notification is enabled
    if (!channels?.includes('push')) {
      logger.info('Push notification not enabled for this notification');
      return;
    }

    try {
      // Get user's FCM tokens
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData?.fcmTokens || userData.fcmTokens.length === 0) {
        logger.warn(`No FCM tokens found for user ${userId}`);
        return;
      }

      // Check user's notification preferences
      const preferences = userData.notificationPreferences || {};
      if (!preferences.push) {
        logger.info(`Push notifications disabled for user ${userId}`);
        return;
      }

      // Check quiet hours
      if (isQuietHours(preferences.quietHours)) {
        logger.info('Skipping notification due to quiet hours');
        return;
      }

      // Prepare FCM message
      const fcmMessage = {
        tokens: userData.fcmTokens,
        notification: {
          title,
          body: message,
        },
        data: {
          notificationId: event.params.notificationId,
          type: notification.type,
          actionUrl: notification.actionUrl || '',
          ...data,
        },
        android: {
          priority: (priority === 'urgent' ? 'high' : 'normal') as 'high' | 'normal',
          notification: {
            channelId: 'tourtrip_notifications',
            priority: (priority === 'urgent' ? 'high' : 'default') as 'high' | 'default',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body: message,
              },
              badge: await getUnreadNotificationCount(userId),
              sound: 'default',
            },
          },
        },
        webpush: {
          notification: {
            title,
            body: message,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: notification.type,
            renotify: priority === 'urgent',
            requireInteraction: priority === 'urgent',
          },
          fcmOptions: {
            link: notification.actionUrl || '/',
          },
        },
      };

      // Send notification
      const response = await messaging.sendEachForMulticast(fcmMessage);
      
      // Update notification status
      await db.collection('notifications').doc(event.params.notificationId).update({
        sentAt: new Date(),
        fcmResponse: {
          successCount: response.successCount,
          failureCount: response.failureCount,
          responses: response.responses.map((r: any) => ({
            success: r.success,
            error: r.error?.code || null,
          })),
        },
        updatedAt: new Date(),
      });

      // Clean up invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success && (
          resp.error?.code === 'messaging/invalid-registration-token' ||
          resp.error?.code === 'messaging/registration-token-not-registered'
        )) {
          invalidTokens.push(userData.fcmTokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        await cleanupInvalidTokens(userId, invalidTokens);
      }

      logger.info(`Notification sent to ${response.successCount} devices`);
    } catch (error) {
      logger.error('Error sending push notification:', error);
      
      // Update notification with error status
      await db.collection('notifications').doc(event.params.notificationId).update({
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      });
    }
  }
);

/**
 * Handle booking status changes and send notifications
 */
export const onBookingStatusChange = onDocumentUpdated(
  'bookings/{bookingId}',
  async (event: FirestoreEvent<any, any>) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    if (!before || !after || before.bookingStatus === after.bookingStatus) {
      return;
    }

    const { userId, serviceId, bookingStatus, bookingDate, participants, totalPrice, currency } = after;

    try {
      // Get service details
      const serviceDoc = await db.collection('services').doc(serviceId).get();
      const service = serviceDoc.data();
      
      if (!service) {
        logger.error(`Service not found: ${serviceId}`);
        return;
      }

      let notificationData: any = {
        userId,
        type: 'booking',
        priority: 'high',
        channels: ['in_app', 'push'],
        actionUrl: `/dashboard/bookings/${event.params.bookingId}`,
        data: {
          bookingId: event.params.bookingId,
          serviceName: service.title,
          bookingDate,
          participants,
          totalPrice,
          currency,
        },
      };

      switch (bookingStatus) {
        case 'confirmed':
          notificationData = {
            ...notificationData,
            title: 'Rezervasyon Onaylandı! 🎉',
            message: `${service.title} rezervasyonunuz onaylandı. Tur tarihi: ${new Date(bookingDate.toDate()).toLocaleDateString('tr-TR')}`,
            channels: ['in_app', 'push', 'email'],
          };
          break;

        case 'cancelled':
          notificationData = {
            ...notificationData,
            title: 'Rezervasyon İptal Edildi',
            message: `${service.title} rezervasyonunuz iptal edildi.`,
            priority: 'normal',
          };
          break;

        case 'completed':
          notificationData = {
            ...notificationData,
            title: 'Tur Tamamlandı! ⭐',
            message: `${service.title} turu tamamlandı. Deneyiminizi değerlendirmek ister misiniz?`,
            priority: 'normal',
            actionUrl: `/tours/${serviceId}/review`,
          };
          break;

        default:
          return;
      }

      // Create notification
      await db.collection('notifications').add({
        ...notificationData,
        status: 'unread',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    } catch (error) {
      logger.error('Error handling booking status change:', error);
    }
  }
);

/**
 * Send tour reminders
 */
export const sendTourReminders = onSchedule('every 1 hours', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(0, 0, 0, 0);

  try {
    // Get bookings for tomorrow
    const bookingsSnapshot = await db.collection('bookings')
      .where('bookingStatus', '==', 'confirmed')
      .where('bookingDate', '>=', tomorrow)
      .where('bookingDate', '<', dayAfterTomorrow)
      .get();

    const reminderPromises = bookingsSnapshot.docs.map(async (bookingDoc: any) => {
      const booking = bookingDoc.data();
      const { userId, serviceId, bookingDate } = booking;

      // Check if reminder already sent
      const existingReminder = await db.collection('notifications')
        .where('userId', '==', userId)
        .where('data.bookingId', '==', bookingDoc.id)
        .where('type', '==', 'reminder')
        .limit(1)
        .get();

      if (!existingReminder.empty) {
        return; // Reminder already sent
      }

      // Get service details
      const serviceDoc = await db.collection('services').doc(serviceId).get();
      const service = serviceDoc.data();

      if (!service) return;

      // Create reminder notification
      await db.collection('notifications').add({
        userId,
        type: 'reminder',
        title: 'Tur Hatırlatması! ⏰',
        message: `${service.title} turunuz yarın ${bookingDate.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}'da başlıyor.`,
        priority: 'high',
        channels: ['in_app', 'push'],
        actionUrl: `/dashboard/bookings/${bookingDoc.id}`,
        data: {
          bookingId: bookingDoc.id,
          serviceName: service.title,
          bookingDate: bookingDate.toDate().toISOString(),
        },
        status: 'unread',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    await Promise.all(reminderPromises);
    logger.info(`Sent ${reminderPromises.length} tour reminders`);
  } catch (error) {
    logger.error('Error sending tour reminders:', error);
  }
});

/**
 * Handle payment status changes
 */
export const onPaymentStatusChange = onDocumentUpdated(
  'payments/{paymentId}',
  async (event: FirestoreEvent<any, any>) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    if (!before || !after || before.status === after.status) {
      return;
    }

    const { userId, bookingId, amount, currency, status } = after;

    try {
      // Get booking details
      const bookingDoc = await db.collection('bookings').doc(bookingId).get();
      const booking = bookingDoc.data();
      
      if (!booking) return;

      // Get service details
      const serviceDoc = await db.collection('services').doc(booking.serviceId).get();
      const service = serviceDoc.data();
      
      if (!service) return;

      let notificationData: any = {
        userId,
        type: 'payment',
        priority: 'high',
        channels: ['in_app', 'push'],
        data: {
          paymentId: event.params.paymentId,
          bookingId,
          amount,
          currency,
          serviceName: service.title,
        },
      };

      switch (status) {
        case 'completed':
          notificationData = {
            ...notificationData,
            title: 'Ödeme Başarılı! ✅',
            message: `${amount} ${currency} ödemeniz başarıyla alındı.`,
            channels: ['in_app', 'push', 'email'],
            actionUrl: `/dashboard/payments/${event.params.paymentId}`,
          };
          break;

        case 'failed':
          notificationData = {
            ...notificationData,
            title: 'Ödeme Başarısız ❌',
            message: 'Ödemeniz gerçekleştirilemedi. Lütfen tekrar deneyin.',
            actionUrl: `/checkout/${bookingId}`,
          };
          break;

        case 'refunded':
          notificationData = {
            ...notificationData,
            title: 'İade Tamamlandı 💰',
            message: `${amount} ${currency} iadesi hesabınıza yansıtıldı.`,
            priority: 'normal',
          };
          break;

        default:
          return;
      }

      // Create notification
      await db.collection('notifications').add({
        ...notificationData,
        status: 'unread',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    } catch (error) {
      logger.error('Error handling payment status change:', error);
    }
  }
);

/**
 * Callable function to register FCM token
 */
export const registerFCMToken = onCall(async (request: CallableRequest) => {
  const { token } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!token) {
    throw new HttpsError('invalid-argument', 'FCM token is required');
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const currentTokens = userData?.fcmTokens || [];

    // Add token if not already present
    if (!currentTokens.includes(token)) {
      await userRef.update({
        fcmTokens: [...currentTokens, token],
        lastTokenUpdate: new Date(),
        updatedAt: new Date(),
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Error registering FCM token:', error);
    throw new HttpsError('internal', 'Failed to register FCM token');
  }
});

/**
 * Callable function to unregister FCM token
 */
export const unregisterFCMToken = onCall(async (request: CallableRequest) => {
  const { token } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!token) {
    throw new HttpsError('invalid-argument', 'FCM token is required');
  }

  try {
    await cleanupInvalidTokens(userId, [token]);
    return { success: true };
  } catch (error) {
    logger.error('Error unregistering FCM token:', error);
    throw new HttpsError('internal', 'Failed to unregister FCM token');
  }
});

/**
 * Helper functions
 */
async function getUnreadNotificationCount(userId: string): Promise<number> {
  const snapshot = await db.collection('notifications')
    .where('userId', '==', userId)
    .where('status', '==', 'unread')
    .count()
    .get();
  
  return snapshot.data().count;
}

async function cleanupInvalidTokens(userId: string, tokensToRemove: string[]): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  
  if (userDoc.exists) {
    const userData = userDoc.data();
    const currentTokens = userData?.fcmTokens || [];
    const validTokens = currentTokens.filter((token: string) => !tokensToRemove.includes(token));
    
    await userRef.update({
      fcmTokens: validTokens,
      updatedAt: new Date(),
    });
  }
}

function isQuietHours(quietHours: any): boolean {
  if (!quietHours?.enabled) return false;

  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const [startHour, startMinute] = quietHours.start.split(':').map(Number);
  const [endHour, endMinute] = quietHours.end.split(':').map(Number);
  
  const startTime = startHour * 100 + startMinute;
  const endTime = endHour * 100 + endMinute;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
}
