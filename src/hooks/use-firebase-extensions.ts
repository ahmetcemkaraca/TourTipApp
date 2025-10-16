import { useState, useCallback } from 'react';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { useErrorHandling } from './use-error-handling';
import { useAuth } from './use-auth'; // Assuming useAuth hook exists

/**
 * Hook for interacting with Firebase Extensions through Cloud Functions
 */
export const useFirebaseExtensions = () => {
  const { handleError } = useErrorHandling();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const functions = getFunctions();

  // Stripe Payments
  const processStripePayment = useCallback(async (
    priceId: string, 
    quantity: number = 1, 
    metadata: Record<string, any> = {}
  ) => {
    if (!currentUser) {
      handleError(new Error('User not authenticated'), { code: 'AUTH_REQUIRED', category: 'extensions' });
      return null;
    }

    setLoading(true);
    try {
      const processPayment = httpsCallable(functions, 'processStripePayment');
      const result = await processPayment({
        userId: currentUser.uid,
        priceId,
        quantity,
        metadata,
      });

      return result.data;
    } catch (error) {
      handleError(error, { code: 'STRIPE_PAYMENT_ERROR', category: 'extensions' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, functions, handleError]);

  // Email Templates
  const sendTemplatedEmail = useCallback(async (
    to: string | string[],
    templateId: string,
    templateData: Record<string, any>,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) => {
    if (!currentUser) {
      handleError(new Error('User not authenticated'), { code: 'AUTH_REQUIRED', category: 'extensions' });
      return null;
    }

    setLoading(true);
    try {
      const sendEmail = httpsCallable(functions, 'sendTemplatedEmail');
      const result = await sendEmail({
        to,
        templateId,
        templateData,
        priority,
      });

      return result.data;
    } catch (error) {
      handleError(error, { code: 'EMAIL_SEND_ERROR', category: 'extensions' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, functions, handleError]);

  // Search Index Updates
  const updateSearchIndex = useCallback(async (
    collection: string,
    documentId: string,
    data: Record<string, any>,
    operation: 'upsert' | 'delete' = 'upsert'
  ) => {
    if (!currentUser) {
      handleError(new Error('User not authenticated'), { code: 'AUTH_REQUIRED', category: 'extensions' });
      return null;
    }

    setLoading(true);
    try {
      const updateIndex = httpsCallable(functions, 'updateSearchIndex');
      const result = await updateIndex({
        collection,
        documentId,
        data,
        operation,
      });

      return result.data;
    } catch (error) {
      handleError(error, { code: 'SEARCH_INDEX_ERROR', category: 'extensions' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, functions, handleError]);

  // Image Processing
  const processImage = useCallback(async (
    imagePath: string,
    sizes?: string,
    format: 'webp' | 'jpeg' | 'png' = 'webp',
    quality: number = 80
  ) => {
    if (!currentUser) {
      handleError(new Error('User not authenticated'), { code: 'AUTH_REQUIRED', category: 'extensions' });
      return null;
    }

    setLoading(true);
    try {
      const processImg = httpsCallable(functions, 'processImage');
      const result = await processImg({
        imagePath,
        sizes,
        format,
        quality,
      });

      return result.data;
    } catch (error) {
      handleError(error, { code: 'IMAGE_PROCESSING_ERROR', category: 'extensions' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, functions, handleError]);

  // Translation Service
  const translateContent = useCallback(async (
    collection: string,
    documentId: string,
    field: string,
    targetLanguages?: string[]
  ) => {
    if (!currentUser) {
      handleError(new Error('User not authenticated'), { code: 'AUTH_REQUIRED', category: 'extensions' });
      return null;
    }

    setLoading(true);
    try {
      const translate = httpsCallable(functions, 'translateContent');
      const result = await translate({
        collection,
        documentId,
        field,
        targetLanguages,
      });

      return result.data;
    } catch (error) {
      handleError(error, { code: 'TRANSLATION_ERROR', category: 'extensions' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, functions, handleError]);

  // URL Shortener
  const shortenUrl = useCallback(async (
    url: string,
    customAlias?: string,
    expiresAt?: Date
  ) => {
    if (!currentUser) {
      handleError(new Error('User not authenticated'), { code: 'AUTH_REQUIRED', category: 'extensions' });
      return null;
    }

    setLoading(true);
    try {
      const shorten = httpsCallable(functions, 'shortenUrl');
      const result = await shorten({
        url,
        customAlias,
        expiresAt: expiresAt?.toISOString(),
      });

      return result.data;
    } catch (error) {
      handleError(error, { code: 'URL_SHORTEN_ERROR', category: 'extensions' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, functions, handleError]);

  // SMS Notifications
  const sendSMS = useCallback(async (
    to: string,
    message: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) => {
    if (!currentUser) {
      handleError(new Error('User not authenticated'), { code: 'AUTH_REQUIRED', category: 'extensions' });
      return null;
    }

    setLoading(true);
    try {
      const sendSms = httpsCallable(functions, 'sendSMS');
      const result = await sendSms({
        to,
        message,
        priority,
      });

      return result.data;
    } catch (error) {
      handleError(error, { code: 'SMS_SEND_ERROR', category: 'extensions' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, functions, handleError]);

  // Health Check
  const checkExtensionsHealth = useCallback(async () => {
    if (!currentUser) {
      handleError(new Error('User not authenticated'), { code: 'AUTH_REQUIRED', category: 'extensions' });
      return null;
    }

    setLoading(true);
    try {
      const healthCheck = httpsCallable(functions, 'checkExtensionsHealth');
      const result = await healthCheck();

      return result.data;
    } catch (error) {
      handleError(error, { code: 'HEALTH_CHECK_ERROR', category: 'extensions' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, functions, handleError]);

  return {
    loading,
    processStripePayment,
    sendTemplatedEmail,
    updateSearchIndex,
    processImage,
    translateContent,
    shortenUrl,
    sendSMS,
    checkExtensionsHealth,
  };
};
