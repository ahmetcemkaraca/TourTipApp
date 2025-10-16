import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

// Support ticket functions
export const createSupportTicket = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { subject, description, category, priority } = request.data;

    if (!subject || !description || !category) {
      throw new HttpsError('invalid-argument', 'Missing required parameters');
    }

    try {
      // Create support ticket
      const ticketRef = await db.collection('supportTickets').add({
        userId: request.auth.uid,
        userEmail: request.auth.token.email,
        subject,
        description,
        category,
        priority: priority || 'medium',
        status: 'open',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true, ticketId: ticketRef.id };
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw new HttpsError('internal', 'Failed to create support ticket');
    }
  }
);

// Track support ticket creation
export const trackSupportTicket = onDocumentCreated(
  'supportTickets/{ticketId}',
  async (event: FirestoreEvent<any, any>) => {
    const ticketData = event.data?.data();
    
    if (!ticketData) return;

    try {
      // Update user support activity
      await db.collection('users').doc(ticketData.userId).update({
        supportTickets: FieldValue.increment(1),
        lastSupportTicket: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error tracking support ticket:', error);
    }
  }
);
