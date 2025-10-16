import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

// Rate limiting functions
export const checkRateLimit = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { action, identifier } = request.data;

    if (!action || !identifier) {
      throw new HttpsError('invalid-argument', 'Missing required parameters');
    }

    try {
      const userId = request.auth.uid;
      const now = new Date();
      const windowStart = new Date(now.getTime() - 60000); // 1 minute window

      // Check recent requests
      const recentRequests = await db
        .collection('rateLimitLogs')
        .where('userId', '==', userId)
        .where('action', '==', action)
        .where('timestamp', '>=', windowStart)
        .get();

      const maxRequests = 10; // Max 10 requests per minute per action

      if (recentRequests.size >= maxRequests) {
        throw new HttpsError('resource-exhausted', 'Rate limit exceeded');
      }

      // Log this request
      await db.collection('rateLimitLogs').add({
        userId,
        action,
        identifier,
        timestamp: FieldValue.serverTimestamp(),
        ip: request.rawRequest.ip,
      });

      return { success: true, remaining: maxRequests - recentRequests.size - 1 };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error('Error checking rate limit:', error);
      throw new HttpsError('internal', 'Failed to check rate limit');
    }
  }
);

// Track rate limit violations
export const trackRateLimitViolation = onDocumentCreated(
  'rateLimitLogs/{logId}',
  async (event: FirestoreEvent<any, any>) => {
    const logData = event.data?.data();
    
    if (!logData) return;

    try {
      // Update user rate limit stats
      await db.collection('users').doc(logData.userId).update({
        rateLimitRequests: FieldValue.increment(1),
        lastRateLimitRequest: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error tracking rate limit violation:', error);
    }
  }
);
