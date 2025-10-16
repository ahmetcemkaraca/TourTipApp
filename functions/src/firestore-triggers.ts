/**
 * Firestore Triggers for TourTrip.app
 * Handles data validation, automatic calculations, notifications, and audit trails
 */

import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated, onDocumentWritten, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
// import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

const db = getFirestore();
// const auth = getAuth();
const messaging = getMessaging();

// Helper function to create audit log
async function createAuditLog(
  collection: string,
  documentId: string,
  action: 'created' | 'updated' | 'deleted',
  before?: any,
  after?: any,
  userId?: string
) {
  try {
    const auditLog = {
      collection,
      documentId,
      action,
      before: before || null,
      after: after || null,
      userId: userId || null,
      timestamp: FieldValue.serverTimestamp(),
      environment: (process as any).env.NODE_ENV || 'development',
    };

    await db.collection('auditLogs').add(auditLog);
    logger.info(`Audit log created for ${collection}/${documentId}`, { action, userId });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
}

// Helper function to send notification
async function sendNotification(
  userId: string,
  title: string,
  body: string,
  data?: { [key: string]: string },
  channels: ('push' | 'email' | 'sms')[] = ['push']
) {
  try {
    // Create notification document
    const notification = {
      userId,
      title,
      body,
      data: data || {},
      channels,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      readAt: null,
    };

    const notificationRef = await db.collection('notifications').add(notification);

    // Send push notification if requested
    if (channels.includes('push')) {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (userData?.fcmToken) {
        await messaging.send({
          token: userData.fcmToken,
          notification: { title, body },
          data: data || {},
        });

        logger.info(`Push notification sent to user ${userId}`);
      }
    }

    // Mark notification as sent
    await notificationRef.update({ status: 'sent', sentAt: FieldValue.serverTimestamp() });
  } catch (error) {
    logger.error('Failed to send notification:', error);
  }
}

// Helper function to calculate geohash
function calculateGeohash(latitude: number, longitude: number): string {
  // Simple geohash implementation (you might want to use a proper geohash library)
  const lat = latitude.toString().substring(0, 8);
  const lng = longitude.toString().substring(0, 8);
  return `${lat}_${lng}`;
}

// User Management Triggers
export const onUserCreated = onDocumentCreated('users/{userId}', async (event: FirestoreEvent<any, any>) => {
  const userId = event.params.userId;
  const userData = event.data?.data();

  try {
    // Create user profile document
    await db.collection('userProfiles').doc(userId).set({
      userId,
      fullName: userData?.fullName || '',
      email: userData?.email || '',
      profilePicture: userData?.profilePicture || '',
      preferences: userData?.preferences || {
        language: 'tr',
        currency: 'TRY',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
      stats: {
        toursBooked: 0,
        toursCompleted: 0,
        totalSpent: 0,
        reviewsWritten: 0,
        loyaltyPoints: 0,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Initialize user analytics
    await db.collection('userAnalytics').doc(userId).set({
      userId,
      registrationDate: FieldValue.serverTimestamp(),
      lastActivity: FieldValue.serverTimestamp(),
      sessionCount: 0,
      pageViews: 0,
      actions: [],
      devices: [],
      locations: [],
    });

    // Send welcome notification
    await sendNotification(
      userId,
      'TourTrip\'e Hoş Geldiniz! 🎉',
      'Hesabınız başarıyla oluşturuldu. Harika turları keşfetmeye başlayabilirsiniz!',
      { type: 'welcome' },
      ['push', 'email']
    );

    // Create audit log
    await createAuditLog('users', userId, 'created', null, userData);

    logger.info(`User ${userId} created successfully with profile and analytics`);
  } catch (error) {
    logger.error(`Failed to process user creation for ${userId}:`, error);
  }
});

export const onUserUpdated = onDocumentUpdated('users/{userId}', async (event: FirestoreEvent<any, any>) => {
  const userId = event.params.userId;
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();

  try {
    // Update user profile if relevant fields changed
    const profileFields = ['fullName', 'email', 'profilePicture', 'preferences'];
    const profileUpdate: any = {};
    let hasProfileChanges = false;

    profileFields.forEach(field => {
      if (before?.[field] !== after?.[field]) {
        profileUpdate[field] = after?.[field];
        hasProfileChanges = true;
      }
    });

    if (hasProfileChanges) {
      profileUpdate.updatedAt = FieldValue.serverTimestamp();
      await db.collection('userProfiles').doc(userId).update(profileUpdate);
    }

    // Track email verification
    if (!before?.emailVerified && after?.emailVerified) {
      await sendNotification(
        userId,
        'Email Adresiniz Doğrulandı ✅',
        'Email adresiniz başarıyla doğrulandı. Artık tüm özelliklerimizi kullanabilirsiniz!',
        { type: 'email_verified' }
      );
    }

    // Create audit log
    await createAuditLog('users', userId, 'updated', before, after);

    logger.info(`User ${userId} updated successfully`);
  } catch (error) {
    logger.error(`Failed to process user update for ${userId}:`, error);
  }
});

// Tour Management Triggers
export const onTourCreated = onDocumentCreated('tours/{tourId}', async (event: FirestoreEvent<any, any>) => {
  const tourId = event.params.tourId;
  const tourData = event.data?.data();

  try {
    // Calculate and add geohash for location-based queries
    if (tourData?.location?.coordinates) {
      const { latitude, longitude } = tourData.location.coordinates;
      const geohash = calculateGeohash(latitude, longitude);
      
      await event.data?.ref.update({
        geohash,
        searchableLocation: `${tourData.location.city} ${tourData.location.country}`.toLowerCase(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Initialize tour statistics
    await db.collection('tourStats').doc(tourId).set({
      tourId,
      bookingCount: 0,
      viewCount: 0,
      favoriteCount: 0,
      reviewCount: 0,
      averageRating: 0,
      totalRevenue: 0,
      monthlyBookings: {},
      popularDays: {},
      demographics: {
        ageGroups: {},
        countries: {},
        repeatCustomers: 0,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Index tour for search
    if (tourData) {
      await db.collection('searchIndex').doc(tourId).set({
        type: 'tour',
        title: tourData.title,
        description: tourData.description,
        category: tourData.category,
        location: tourData.location,
        price: tourData.price,
        keywords: [
          ...tourData.title.toLowerCase().split(' '),
          ...tourData.description.toLowerCase().split(' '),
          tourData.category.toLowerCase(),
          tourData.location.city.toLowerCase(),
          tourData.location.country.toLowerCase(),
          ...(tourData.tags || []).map((tag: string) => tag.toLowerCase()),
        ].filter(keyword => keyword.length > 2),
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // Notify tour operator
    if (tourData?.createdBy) {
      await sendNotification(
        tourData.createdBy,
        'Tur Başarıyla Oluşturuldu 🎯',
        `"${tourData.title}" turu başarıyla oluşturuldu ve yayına alındı.`,
        { type: 'tour_created', tourId }
      );
    }

    // Create audit log
    await createAuditLog('tours', tourId, 'created', null, tourData, tourData?.createdBy);

    logger.info(`Tour ${tourId} created and indexed successfully`);
  } catch (error) {
    logger.error(`Failed to process tour creation for ${tourId}:`, error);
  }
});

export const onTourUpdated = onDocumentUpdated('tours/{tourId}', async (event: FirestoreEvent<any, any>) => {
  const tourId = event.params.tourId;
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();

  try {
    // Update geohash if location changed
    if (before?.location?.coordinates !== after?.location?.coordinates && after?.location?.coordinates) {
      const { latitude, longitude } = after.location.coordinates;
      const geohash = calculateGeohash(latitude, longitude);
      
      await event.data?.after?.ref.update({
        geohash,
        searchableLocation: `${after.location.city} ${after.location.country}`.toLowerCase(),
      });
    }

    // Update search index
    if (after) {
      await db.collection('searchIndex').doc(tourId).update({
        title: after.title,
        description: after.description,
        category: after.category,
        location: after.location,
        price: after.price,
        keywords: [
          ...after.title.toLowerCase().split(' '),
          ...after.description.toLowerCase().split(' '),
          after.category.toLowerCase(),
          after.location.city.toLowerCase(),
          after.location.country.toLowerCase(),
          ...(after.tags || []).map((tag: string) => tag.toLowerCase()),
        ].filter(keyword => keyword.length > 2),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Notify about price changes
    if (before?.price !== after?.price) {
      // Get users who favorited this tour
      const favoritesQuery = await db
        .collection('favorites')
        .where('tourId', '==', tourId)
        .get();

      const notificationPromises = favoritesQuery.docs.map(async (doc: any) => {
        const userId = doc.data().userId;
        const priceChange = after?.price! > before?.price! ? 'artış' : 'indirim';
        
        return sendNotification(
          userId,
          `Fiyat ${priceChange.charAt(0).toUpperCase() + priceChange.slice(1)}! 💰`,
          `Favorilerinizde bulunan "${after?.title}" turunda fiyat ${priceChange}i oldu.`,
          { type: 'price_change', tourId, oldPrice: before?.price?.toString(), newPrice: after?.price?.toString() }
        );
      });

      await Promise.all(notificationPromises);
    }

    // Create audit log
    await createAuditLog('tours', tourId, 'updated', before, after, after?.updatedBy);

    logger.info(`Tour ${tourId} updated successfully`);
  } catch (error) {
    logger.error(`Failed to process tour update for ${tourId}:`, error);
  }
});

// Booking Management Triggers
export const onBookingCreated = onDocumentCreated('bookings/{bookingId}', async (event: FirestoreEvent<any, any>) => {
  const bookingId = event.params.bookingId;
  const bookingData = event.data?.data();

  try {
    // Update tour statistics
    if (bookingData?.tourId) {
      const tourStatsRef = db.collection('tourStats').doc(bookingData.tourId);
      await tourStatsRef.update({
        bookingCount: FieldValue.increment(1),
        totalRevenue: FieldValue.increment(bookingData.totalAmount || 0),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update monthly bookings
      const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM
      await tourStatsRef.update({
        [`monthlyBookings.${monthKey}`]: FieldValue.increment(1),
      });
    }

    // Update user statistics
    if (bookingData?.userId) {
      await db.collection('userProfiles').doc(bookingData.userId).update({
        'stats.toursBooked': FieldValue.increment(1),
        'stats.totalSpent': FieldValue.increment(bookingData.totalAmount || 0),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Send confirmation notification to user
    if (bookingData?.userId && bookingData?.tourId) {
      const tourDoc = await db.collection('tours').doc(bookingData.tourId).get();
      const tourData = tourDoc.data();

      await sendNotification(
        bookingData.userId,
        'Rezervasyon Alındı! 🎟️',
        `"${tourData?.title}" turu için rezervasyonunuz alındı. Rezervasyon numaranız: ${bookingId}`,
        { 
          type: 'booking_created', 
          bookingId, 
          tourId: bookingData.tourId,
          selectedDate: bookingData.selectedDate,
        },
        ['push', 'email']
      );
    }

    // Notify tour operator
    if (bookingData?.tourId) {
      const tourDoc = await db.collection('tours').doc(bookingData.tourId).get();
      const tourData = tourDoc.data();

      if (tourData?.createdBy) {
        await sendNotification(
          tourData.createdBy,
          'Yeni Rezervasyon! 📋',
          `"${tourData.title}" turunuz için yeni bir rezervasyon alındı.`,
          { type: 'new_booking', bookingId, tourId: bookingData.tourId }
        );
      }
    }

    // Create audit log
    await createAuditLog('bookings', bookingId, 'created', null, bookingData, bookingData?.userId);

    logger.info(`Booking ${bookingId} created and notifications sent`);
  } catch (error) {
    logger.error(`Failed to process booking creation for ${bookingId}:`, error);
  }
});

export const onBookingUpdated = onDocumentUpdated('bookings/{bookingId}', async (event: FirestoreEvent<any, any>) => {
  const bookingId = event.params.bookingId;
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();

  try {
    // Handle status changes
    if (before?.status !== after?.status) {
      let notificationTitle = '';
      let notificationBody = '';
      let notificationData: any = { type: 'booking_status_change', bookingId };

      switch (after?.status) {
        case 'confirmed':
          notificationTitle = 'Rezervasyon Onaylandı! ✅';
          notificationBody = 'Rezervasyonunuz onaylandı. İyi eğlenceler!';
          
          // Update user stats
          if (after?.userId) {
            await db.collection('userProfiles').doc(after.userId).update({
              'stats.toursCompleted': FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          break;

        case 'cancelled':
          notificationTitle = 'Rezervasyon İptal Edildi ❌';
          notificationBody = 'Rezervasyonunuz iptal edildi. İade işlemi başlatılacak.';
          
          // Reverse tour statistics
          if (after?.tourId) {
            await db.collection('tourStats').doc(after.tourId).update({
              bookingCount: FieldValue.increment(-1),
              totalRevenue: FieldValue.increment(-(after.totalAmount || 0)),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          
          // Reverse user statistics
          if (after?.userId) {
            await db.collection('userProfiles').doc(after.userId).update({
              'stats.toursBooked': FieldValue.increment(-1),
              'stats.totalSpent': FieldValue.increment(-(after.totalAmount || 0)),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          break;

        case 'completed':
          notificationTitle = 'Tur Tamamlandı! 🏆';
          notificationBody = 'Turunuz tamamlandı. Deneyiminizi değerlendirmeyi unutmayın!';
          notificationData.showReviewPrompt = true;
          break;
      }

      // Send notification to user
      if (after?.userId && notificationTitle) {
        await sendNotification(
          after.userId,
          notificationTitle,
          notificationBody,
          notificationData,
          ['push', 'email']
        );
      }
    }

    // Handle payment status changes
    if (before?.paymentStatus !== after?.paymentStatus) {
      if (after?.paymentStatus === 'completed' && after?.userId) {
        await sendNotification(
          after.userId,
          'Ödeme Alındı! 💳',
          'Ödemeniz başarıyla alındı. Rezervasyonunuz onay bekliyor.',
          { type: 'payment_completed', bookingId, paymentStatus: after.paymentStatus }
        );
      } else if (after?.paymentStatus === 'failed' && after?.userId) {
        await sendNotification(
          after.userId,
          'Ödeme Başarısız ⚠️',
          'Ödemeniz işlenemedi. Lütfen ödeme bilgilerinizi kontrol edin.',
          { type: 'payment_failed', bookingId, paymentStatus: after.paymentStatus }
        );
      }
    }

    // Create audit log
    await createAuditLog('bookings', bookingId, 'updated', before, after, after?.updatedBy);

    logger.info(`Booking ${bookingId} updated successfully`);
  } catch (error) {
    logger.error(`Failed to process booking update for ${bookingId}:`, error);
  }
});

// Review Management Triggers
export const onReviewCreated = onDocumentCreated('reviews/{reviewId}', async (event: FirestoreEvent<any, any>) => {
  const reviewId = event.params.reviewId;
  const reviewData = event.data?.data();

  try {
    // Update tour statistics
    if (reviewData?.tourId) {
      const tourRef = db.collection('tours').doc(reviewData.tourId);
      
      await db.runTransaction(async (transaction: any) => {
        const tourDoc = await transaction.get(tourRef);
        const tourData = tourDoc.data();
        
        const currentRating = tourData?.averageRating || 0;
        const currentCount = tourData?.reviewCount || 0;
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + reviewData.rating) / newCount;
        
        transaction.update(tourRef, {
          averageRating: newRating,
          reviewCount: newCount,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      // Update tour stats
      await db.collection('tourStats').doc(reviewData.tourId).update({
        reviewCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Update user statistics
    if (reviewData?.userId) {
      await db.collection('userProfiles').doc(reviewData.userId).update({
        'stats.reviewsWritten': FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Award loyalty points for writing a review
      await db.collection('userProfiles').doc(reviewData.userId).update({
        'stats.loyaltyPoints': FieldValue.increment(10), // 10 points for review
      });
    }

    // Notify tour operator about new review
    if (reviewData?.tourId) {
      const tourDoc = await db.collection('tours').doc(reviewData.tourId).get();
      const tourData = tourDoc.data();

      if (tourData?.createdBy) {
        const stars = '⭐'.repeat(reviewData.rating);
        await sendNotification(
          tourData.createdBy,
          `Yeni Değerlendirme! ${stars}`,
          `"${tourData.title}" turunuz için ${reviewData.rating} yıldızlı yeni bir değerlendirme aldınız.`,
          { type: 'new_review', reviewId, tourId: reviewData.tourId, rating: reviewData.rating.toString() }
        );
      }
    }

    // Create audit log
    await createAuditLog('reviews', reviewId, 'created', null, reviewData, reviewData?.userId);

    logger.info(`Review ${reviewId} created and tour statistics updated`);
  } catch (error) {
    logger.error(`Failed to process review creation for ${reviewId}:`, error);
  }
});

// Payment Triggers
export const onPaymentCreated = onDocumentCreated('payments/{paymentId}', async (event: FirestoreEvent<any, any>) => {
  const paymentId = event.params.paymentId;
  const paymentData = event.data?.data();

  try {
    // Update booking payment status
    if (paymentData?.bookingId) {
      await db.collection('bookings').doc(paymentData.bookingId).update({
        paymentStatus: paymentData.status,
        paymentId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Send payment confirmation
    if (paymentData?.userId && paymentData?.status === 'completed') {
      await sendNotification(
        paymentData.userId,
        'Ödeme Onaylandı! 💰',
        `${paymentData.amount} ${paymentData.currency} tutarındaki ödemeniz başarıyla işlendi.`,
        { 
          type: 'payment_confirmed', 
          paymentId, 
          amount: paymentData.amount?.toString(),
          currency: paymentData.currency,
        }
      );
    }

    // Create audit log
    await createAuditLog('payments', paymentId, 'created', null, paymentData, paymentData?.userId);

    logger.info(`Payment ${paymentId} processed successfully`);
  } catch (error) {
    logger.error(`Failed to process payment for ${paymentId}:`, error);
  }
});

// Favorite Management Triggers
export const onFavoriteCreated = onDocumentCreated('favorites/{favoriteId}', async (event: FirestoreEvent<any, any>) => {
  const favoriteData = event.data?.data();

  try {
    // Update tour favorite count
    if (favoriteData?.tourId) {
      await db.collection('tourStats').doc(favoriteData.tourId).update({
        favoriteCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    logger.info(`Favorite added for tour ${favoriteData?.tourId} by user ${favoriteData?.userId}`);
  } catch (error) {
    logger.error(`Failed to process favorite creation:`, error);
  }
});

export const onFavoriteDeleted = onDocumentDeleted('favorites/{favoriteId}', async (event: FirestoreEvent<any, any>) => {
  const favoriteData = event.data?.data();

  try {
    // Update tour favorite count
    if (favoriteData?.tourId) {
      await db.collection('tourStats').doc(favoriteData.tourId).update({
        favoriteCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    logger.info(`Favorite removed for tour ${favoriteData?.tourId} by user ${favoriteData?.userId}`);
  } catch (error) {
    logger.error(`Failed to process favorite deletion:`, error);
  }
});

// Security Audit Triggers
export const onSecurityEventCreated = onDocumentCreated('securityEvents/{eventId}', async (event: FirestoreEvent<any, any>) => {
  const eventId = event.params.eventId;
  const eventData = event.data?.data();

  try {
    // Create detailed audit log for security events
    await createAuditLog(
      'securityEvents',
      eventId,
      'created',
      null,
      eventData,
      eventData?.userId
    );

    // Alert administrators for high-severity security events
    if (eventData?.level === 'critical' || eventData?.level === 'high') {
      const adminQuery = await db.collection('users').where('role', '==', 'admin').get();
      
      const notificationPromises = adminQuery.docs.map((doc: any) => 
        sendNotification(
          doc.id,
          `Güvenlik Uyarısı! 🚨`,
          `${eventData.level.toUpperCase()} seviyede güvenlik olayı tespit edildi: ${eventData.type}`,
          { 
            type: 'security_alert', 
            eventId, 
            eventType: eventData.type,
            level: eventData.level,
            ipAddress: eventData.ipAddress,
          }
        )
      );

      await Promise.all(notificationPromises);
    }

    logger.info(`Security event ${eventId} processed and logged`);
  } catch (error) {
    logger.error(`Failed to process security event ${eventId}:`, error);
  }
});

// Data Validation Trigger (example for tours)
export const validateTourData = onDocumentWritten('tours/{tourId}', async (event: FirestoreEvent<any, any>) => {
  const tourId = event.params.tourId;
  const tourData = event.data?.after?.data();

  if (!tourData) return; // Document was deleted

  try {
    const validationErrors: string[] = [];

    // Validate required fields
    if (!tourData.title || tourData.title.length < 3) {
      validationErrors.push('Title must be at least 3 characters long');
    }

    if (!tourData.price || tourData.price <= 0) {
      validationErrors.push('Price must be greater than 0');
    }

    if (!tourData.location?.coordinates?.latitude || !tourData.location?.coordinates?.longitude) {
      validationErrors.push('Valid coordinates are required');
    }

    if (tourData.maxParticipants && tourData.maxParticipants < 1) {
      validationErrors.push('Maximum participants must be at least 1');
    }

    // If there are validation errors, log them and optionally disable the tour
    if (validationErrors.length > 0) {
      logger.warn(`Validation errors for tour ${tourId}:`, validationErrors);
      
      // Create validation log
      await db.collection('validationLogs').add({
        collection: 'tours',
        documentId: tourId,
        errors: validationErrors,
        timestamp: FieldValue.serverTimestamp(),
        severity: 'warning',
      });

      // Optionally mark tour as invalid
      if (validationErrors.length > 2) {
        await event.data?.after?.ref.update({
          status: 'invalid',
          validationErrors,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
  } catch (error) {
    logger.error(`Failed to validate tour ${tourId}:`, error);
  }
});

// Cleanup triggers for deleted documents
export const onTourDeleted = onDocumentDeleted('tours/{tourId}', async (event: FirestoreEvent<any, any>) => {
  const tourId = event.params.tourId;
  const tourData = event.data?.data();

  try {
    // Cleanup related documents
    const batch = db.batch();

    // Delete tour statistics
    const tourStatsRef = db.collection('tourStats').doc(tourId);
    batch.delete(tourStatsRef);

    // Delete from search index
    const searchIndexRef = db.collection('searchIndex').doc(tourId);
    batch.delete(searchIndexRef);

    // Delete favorites
    const favoritesQuery = await db.collection('favorites').where('tourId', '==', tourId).get();
    favoritesQuery.docs.forEach((doc: any) => batch.delete(doc.ref));

    // Cancel pending bookings
    const pendingBookingsQuery = await db
      .collection('bookings')
      .where('tourId', '==', tourId)
      .where('status', '==', 'pending')
      .get();

    pendingBookingsQuery.docs.forEach((doc: any) => {
      batch.update(doc.ref, {
        status: 'cancelled',
        cancellationReason: 'Tour deleted',
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    // Create audit log
    await createAuditLog('tours', tourId, 'deleted', tourData, null, tourData?.deletedBy);

    logger.info(`Tour ${tourId} deleted and cleanup completed`);
  } catch (error) {
    logger.error(`Failed to cleanup after tour deletion ${tourId}:`, error);
  }
});
