import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Initialize Firebase Admin
admin.initializeApp();

// Import Stripe functions
import { createPaymentIntent, processRefund, stripeWebhook } from './stripe-functions';

// Export functions
export { createPaymentIntent, processRefund, stripeWebhook };

// Export AI functions
export * from './ai-functions';

// Export loyalty functions
export * from './loyalty-functions';

// Export marketplace functions  
export * from './marketplace-functions';

// Export CMS functions
export * from './cms-functions';

// Export SEO functions
export * from './seo-functions';

// Export Security functions
export * from './security-functions';

// Export Analytics functions
export * from './analytics-functions';

// Export Social functions
export * from './social-functions';

// Export Email functions
export * from './email-functions';

// Export Support functions
export * from './support-functions';

// Export Privacy functions
export * from './privacy-functions';

// Export Rate Limiting functions
export * from './rate-limiting-functions';

// Export Extensions functions
export * from './extensions-functions';

// Export API functions
export * from './api-functions';

// Export Firestore Triggers
export * from './firestore-triggers';
export * from './bigquery-functions';
export * from './admin-functions';

// Example HTTP function
export const helloWorld = onRequest((request: any, response: any) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// User management functions
export const onUserCreate = onDocumentCreated('users/{userId}', async (event: any) => {
  const user = event.data?.data();
  try {
    // Create user document in Firestore
    await admin.firestore().collection('users').doc(event.params.userId).set({
      id: event.params.userId,
      email: user?.email || '',
      fullName: user?.displayName || '',
      profilePicture: user?.photoURL || '',
      emailVerified: user?.emailVerified || false,
      preferences: {
        language: 'tr',
        currency: 'TRY',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
      membershipStatus: 'free',
      loyaltyPoints: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    functions.logger.info(`User document created for ${event.params.userId}`);
  } catch (error) {
    functions.logger.error('Error creating user document:', error);
  }
});

// User deletion cleanup
export const onUserDelete = onDocumentCreated('users/{userId}', async (event: any) => {
  // const user = event.data?.data();
  try {
    const batch = admin.firestore().batch();
    
    // Delete user document
    const userRef = admin.firestore().collection('users').doc(event.params.userId);
    batch.delete(userRef);
    
    // Delete user's cart items
    const cartQuery = await admin.firestore()
      .collection('cart')
      .where('userId', '==', event.params.userId)
      .get();
    
    cartQuery.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    
    // Cancel pending bookings
    const bookingsQuery = await admin.firestore()
      .collection('bookings')
      .where('userId', '==', event.params.userId)
      .where('bookingStatus', '==', 'pending')
      .get();
    
    bookingsQuery.docs.forEach((doc: any) => {
      batch.update(doc.ref, {
        bookingStatus: 'cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    
    await batch.commit();
    
    functions.logger.info(`User data cleaned up for ${event.params.userId}`);
  } catch (error) {
    functions.logger.error('Error cleaning up user data:', error);
  }
});

// Booking confirmation function
export const confirmBooking = onDocumentUpdated('bookings/{bookingId}', async (event: any) => {
  const change = { before: event.data?.before, after: event.data?.after };
  const context = { params: event.params };
    const newData = change.after.data();
    const previousData = change.before.data();
    
    // Check if booking status changed to confirmed
    if (newData.bookingStatus === 'confirmed' && previousData.bookingStatus !== 'confirmed') {
      try {
        // Send confirmation email/SMS
        // Update tour availability
        // Log the confirmation
        
        functions.logger.info(`Booking confirmed: ${context.params.bookingId}`);
        
        // You can add more business logic here like:
        // - Sending confirmation emails
        // - Updating tour capacity
        // - Creating notifications
        
      } catch (error) {
        functions.logger.error('Error processing booking confirmation:', error);
      }
    }
  });

// Clean expired cart items
export const cleanExpiredCartItems = onSchedule('every 1 hours', async (event: any) => {
    try {
      const now = admin.firestore.Timestamp.now();
      const expiredQuery = await admin.firestore()
        .collection('cart')
        .where('expiresAt', '<', now)
        .get();
      
      if (expiredQuery.empty) {
        functions.logger.info('No expired cart items found');
        return;
      }
      
      const batch = admin.firestore().batch();
      
      expiredQuery.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      functions.logger.info(`Cleaned ${expiredQuery.docs.length} expired cart items`);
    } catch (error) {
      functions.logger.error('Error cleaning expired cart items:', error);
    }
  });

// Analytics function for tracking events
export const trackAnalyticsEvent = onRequest(async (request: any, response: any) => {
  const data = request.body;
  const context = { auth: request.auth };
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { eventName, eventData } = data;
    
    if (!eventName) {
      throw new functions.https.HttpsError('invalid-argument', 'Event name is required');
    }

    // Store analytics event
    await admin.firestore().collection('analytics_events').add({
      eventName,
      eventData: eventData || {},
      userId: context.auth.uid,
      userAgent: request.headers['user-agent'] || '',
      ip: request.ip || '',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    response.json({ success: true });
  } catch (error) {
    functions.logger.error('Error tracking analytics event:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});

// Send notification function
export const sendNotification = onRequest(async (request: any, response: any) => {
  const data = request.body;
  const context = { auth: request.auth };
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, title, message, type, data: notificationData } = data;
    
    // Create notification document
    await admin.firestore().collection('notifications').add({
      userId,
      type: type || 'system',
      title,
      message,
      data: notificationData || {},
      status: 'pending',
      priority: 'normal',
      channels: ['in_app', 'push'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Here you could also send push notifications using FCM
    // const userDoc = await admin.firestore().collection('users').doc(userId).get();
    // if (userDoc.exists && userDoc.data()?.fcmToken) {
    //   await admin.messaging().send({
    //     token: userDoc.data()!.fcmToken,
    //     notification: { title, body: message },
    //     data: notificationData,
    //   });
    // }

    response.json({ success: true });
  } catch (error) {
    functions.logger.error('Error sending notification:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});