import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

// Privacy and data protection functions
export const requestDataDeletion = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { reason, confirmation } = request.data;

    if (!reason || !confirmation) {
      throw new HttpsError('invalid-argument', 'Missing required parameters');
    }

    try {
      // Create data deletion request
      await db.collection('dataDeletionRequests').add({
        userId: request.auth.uid,
        userEmail: request.auth.token.email,
        reason,
        confirmation,
        status: 'pending',
        requestedAt: FieldValue.serverTimestamp(),
        processedAt: null,
      });

      return { success: true, message: 'Data deletion request submitted' };
    } catch (error) {
      console.error('Error creating data deletion request:', error);
      throw new HttpsError('internal', 'Failed to create data deletion request');
    }
  }
);

// Track privacy requests
export const trackPrivacyRequest = onDocumentCreated(
  'dataDeletionRequests/{requestId}',
  async (event: FirestoreEvent<any, any>) => {
    const requestData = event.data?.data();
    
    if (!requestData) return;

    try {
      // Log privacy request
      await db.collection('privacyLogs').add({
        userId: requestData.userId,
        action: 'data_deletion_request',
        timestamp: FieldValue.serverTimestamp(),
        status: 'pending',
      });
    } catch (error) {
      console.error('Error tracking privacy request:', error);
    }
  }
);
