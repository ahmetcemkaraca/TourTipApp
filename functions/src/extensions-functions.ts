/**
 * Firebase Extensions Integration Functions for TourTrip.app
 * Provides integration with Firebase Extensions for payments, email, search, etc.
 */

import { HttpsError, CallableRequest, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const db = getFirestore();

/**
 * Stripe Payment Processing Integration
 */
export const processStripePayment = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest) => {
    const { userId, priceId, quantity = 1, metadata = {} } = request.data;

    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (request.auth.uid !== userId) {
      throw new HttpsError('permission-denied', 'User can only process their own payments');
    }

    try {
      // Create checkout session for Stripe extension
      const checkoutSessionData = {
        price: priceId,
        quantity,
        success_url: `${(process as any).env.NEXT_PUBLIC_SITE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${(process as any).env.NEXT_PUBLIC_SITE_URL}/booking/cancel`,
        mode: 'payment',
        customer_email: request.auth.token.email,
        metadata: {
          userId,
          ...metadata,
        },
        automatic_tax: { enabled: true },
        tax_id_collection: { enabled: true },
      };

      // Add to checkout_sessions collection for Stripe extension to process
      const sessionRef = await db.collection('checkout_sessions').add(checkoutSessionData);
      
      logger.info('Stripe checkout session created', { 
        sessionId: sessionRef.id, 
        userId, 
        priceId 
      });

      return { 
        sessionId: sessionRef.id,
        success: true 
      };
    } catch (error) {
      logger.error('Stripe payment processing failed', { error, userId, priceId });
      throw new HttpsError('internal', 'Payment processing failed');
    }
  }
);

/**
 * Email Template Processing Integration
 */
export const sendTemplatedEmail = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest) => {
    const { to, templateId, templateData, priority = 'normal' } = request.data;

    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      // Get email template
      const templateDoc = await db.collection('emailTemplates').doc(templateId).get();
      
      if (!templateDoc.exists) {
        throw new HttpsError('not-found', 'Email template not found');
      }

      const template = templateDoc.data();

      // Process template with data
      let subject = template?.subject || '';
      let html = template?.html || '';
      let text = template?.text || '';

      // Simple template variable replacement
      Object.entries(templateData).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(placeholder, String(value));
        html = html.replace(placeholder, String(value));
        text = text.replace(placeholder, String(value));
      });

      // Add to mail collection for email extension to process
      const mailData = {
        to: Array.isArray(to) ? to : [to],
        message: {
          subject,
          html,
          text,
        },
        template: {
          name: templateId,
          data: templateData,
        },
        priority,
        userId: request.auth.uid,
        createdAt: FieldValue.serverTimestamp(),
      };

      const mailRef = await db.collection('mail').add(mailData);
      
      logger.info('Templated email queued', { 
        mailId: mailRef.id, 
        templateId, 
        to, 
        userId: request.auth.uid 
      });

      return { 
        mailId: mailRef.id,
        success: true 
      };
    } catch (error) {
      logger.error('Email sending failed', { error, templateId, to });
      throw new HttpsError('internal', 'Email sending failed');
    }
  }
);

/**
 * Search Index Update Integration (for Algolia extension)
 */
export const updateSearchIndex = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest) => {
    const { collection, documentId, data, operation = 'upsert' } = request.data;

    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const allowedCollections = ['tours', 'restaurants', 'shops', 'posts'];
      
      if (!allowedCollections.includes(collection)) {
        throw new HttpsError('invalid-argument', 'Collection not allowed for search indexing');
      }

      // Update Firestore document to trigger Algolia extension
      const docRef = db.collection(collection).doc(documentId);
      
      if (operation === 'delete') {
        await docRef.delete();
      } else {
        await docRef.set({
          ...data,
          searchable: true,
          lastIndexed: FieldValue.serverTimestamp(),
          indexedBy: request.auth.uid,
        }, { merge: true });
      }
      
      logger.info('Search index update triggered', { 
        collection, 
        documentId, 
        operation, 
        userId: request.auth.uid 
      });

      return { 
        success: true,
        operation,
        collection,
        documentId 
      };
    } catch (error) {
      logger.error('Search index update failed', { error, collection, documentId });
      throw new HttpsError('internal', 'Search index update failed');
    }
  }
);

/**
 * Image Processing Integration
 */
export const processImage = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest) => {
    const { imagePath, sizes, format = 'webp', quality = 80 } = request.data;

    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const bucket = getStorage().bucket();
      const file = bucket.file(imagePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new HttpsError('not-found', 'Image file not found');
      }

      // Trigger image processing by updating metadata
      // The resize images extension will process this automatically
      await file.setMetadata({
        metadata: {
          resize: 'true',
          sizes: sizes || (process as any).env.IMAGE_RESIZE_SIZES || '200x200,400x400,800x800',
          format,
          quality: String(quality),
          processedBy: request.auth.uid,
          processedAt: new Date().toISOString(),
        }
      });
      
      logger.info('Image processing triggered', { 
        imagePath, 
        sizes, 
        format, 
        quality, 
        userId: request.auth.uid 
      });

      return { 
        success: true,
        imagePath,
        processing: true 
      };
    } catch (error) {
      logger.error('Image processing failed', { error, imagePath });
      throw new HttpsError('internal', 'Image processing failed');
    }
  }
);

/**
 * Translation Service Integration
 */
export const translateContent = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest) => {
    const { collection, documentId, field, targetLanguages } = request.data;

    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const allowedCollections = ['tours', 'restaurants', 'shops', 'posts', 'faqArticles'];
      
      if (!allowedCollections.includes(collection)) {
        throw new HttpsError('invalid-argument', 'Collection not allowed for translation');
      }

      // Update document to trigger translation extension
      const docRef = db.collection(collection).doc(documentId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new HttpsError('not-found', 'Document not found');
      }

      // Add translation request metadata
      await docRef.update({
        [`${field}_translate`]: true,
        translation_config: {
          targetLanguages: targetLanguages || ['en', 'tr', 'de', 'fr', 'es'],
          requestedBy: request.auth.uid,
          requestedAt: FieldValue.serverTimestamp(),
        }
      });
      
      logger.info('Translation triggered', { 
        collection, 
        documentId, 
        field, 
        targetLanguages, 
        userId: request.auth.uid 
      });

      return { 
        success: true,
        collection,
        documentId,
        field,
        translating: true 
      };
    } catch (error) {
      logger.error('Translation failed', { error, collection, documentId });
      throw new HttpsError('internal', 'Translation failed');
    }
  }
);

/**
 * URL Shortener Integration
 */
export const shortenUrl = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest) => {
    const { url, customAlias, expiresAt } = request.data;

    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      // Validate URL
      try {
        new URL(url);
      } catch {
        throw new HttpsError('invalid-argument', 'Invalid URL format');
      }

      // Add to shortenedUrls collection for extension to process
      const shortUrlData = {
        url,
        customAlias: customAlias || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: request.auth.uid,
        createdAt: FieldValue.serverTimestamp(),
        clicks: 0,
        active: true,
      };

      const shortUrlRef = await db.collection('shortenedUrls').add(shortUrlData);
      
      logger.info('URL shortening requested', { 
        shortUrlId: shortUrlRef.id, 
        originalUrl: url, 
        userId: request.auth.uid 
      });

      return { 
        shortUrlId: shortUrlRef.id,
        success: true 
      };
    } catch (error) {
      logger.error('URL shortening failed', { error, url });
      throw new HttpsError('internal', 'URL shortening failed');
    }
  }
);

/**
 * SMS Notification Integration
 */
export const sendSMS = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest) => {
    const { to, message, priority = 'normal' } = request.data;

    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(to)) {
        throw new HttpsError('invalid-argument', 'Invalid phone number format');
      }

      // Add to SMS collection for extension to process
      const smsData = {
        to,
        body: message,
        priority,
        userId: request.auth.uid,
        createdAt: FieldValue.serverTimestamp(),
        status: 'pending',
      };

      const smsRef = await db.collection('sms').add(smsData);
      
      logger.info('SMS queued', { 
        smsId: smsRef.id, 
        to, 
        userId: request.auth.uid 
      });

      return { 
        smsId: smsRef.id,
        success: true 
      };
    } catch (error) {
      logger.error('SMS sending failed', { error, to });
      throw new HttpsError('internal', 'SMS sending failed');
    }
  }
);

/**
 * Extension Health Check
 */
export const checkExtensionsHealth = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const healthStatus = {
        stripe: (process as any).env.ENABLE_STRIPE_PAYMENTS === 'true',
        email: (process as any).env.ENABLE_EMAIL_EXTENSIONS === 'true',
        search: (process as any).env.ENABLE_SEARCH_INDEX === 'true',
        translation: (process as any).env.ENABLE_TRANSLATION === 'true',
        sms: (process as any).env.ENABLE_SMS_NOTIFICATIONS === 'true',
        urlShortener: (process as any).env.ENABLE_URL_SHORTENER === 'true',
        imageResize: (process as any).env.ENABLE_IMAGE_RESIZE === 'true',
        auditLogs: (process as any).env.ENABLE_AUDIT_LOGS === 'true',
        bigqueryExport: (process as any).env.ENABLE_BIGQUERY_EXPORT === 'true',
        timestamp: FieldValue.serverTimestamp(),
      };

      logger.info('Extensions health check', { 
        healthStatus, 
        userId: request.auth.uid 
      });

      return healthStatus;
    } catch (error) {
      logger.error('Health check failed', { error });
      throw new HttpsError('internal', 'Health check failed');
    }
  }
);
