import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

// Social media integration functions
export const shareToSocialMedia = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { platform, content, tourId } = request.data;

    if (!platform || !content || !tourId) {
      throw new HttpsError('invalid-argument', 'Missing required parameters');
    }

    try {
      // Log social media share
      await db.collection('socialShares').add({
        userId: request.auth.uid,
        platform,
        content,
        tourId,
        timestamp: FieldValue.serverTimestamp(),
        status: 'pending',
      });

      return { success: true, message: 'Share initiated' };
    } catch (error) {
      console.error('Error sharing to social media:', error);
      throw new HttpsError('internal', 'Failed to share to social media');
    }
  }
);

// Track social media engagement
export const trackSocialEngagement = onDocumentCreated(
  'socialShares/{shareId}',
  async (event: FirestoreEvent<any, any>) => {
    const shareData = event.data?.data();
    
    if (!shareData) return;

    try {
      // Update tour engagement metrics
      await db.collection('tours').doc(shareData.tourId).update({
        socialShares: FieldValue.increment(1),
        lastSocialShare: FieldValue.serverTimestamp(),
      });

      // Update user social activity
      await db.collection('users').doc(shareData.userId).update({
        socialShares: FieldValue.increment(1),
        lastSocialActivity: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error tracking social engagement:', error);
    }
  }
);
