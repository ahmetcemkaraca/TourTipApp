import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

// Email sending functions
export const sendEmail = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { to, subject, template, data } = request.data;

    if (!to || !subject || !template) {
      throw new HttpsError('invalid-argument', 'Missing required parameters');
    }

    try {
      // Log email request
      await db.collection('emailLogs').add({
        from: request.auth.token.email,
        to,
        subject,
        template,
        data: data || {},
        timestamp: FieldValue.serverTimestamp(),
        status: 'pending',
        userId: request.auth.uid,
      });

      return { success: true, message: 'Email queued for sending' };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new HttpsError('internal', 'Failed to send email');
    }
  }
);

// Track email delivery
export const trackEmailDelivery = onDocumentCreated(
  'emailLogs/{emailId}',
  async (event: FirestoreEvent<any, any>) => {
    const emailData = event.data?.data();
    
    if (!emailData) return;

    try {
      // Update user email activity
      await db.collection('users').doc(emailData.userId).update({
        emailsSent: FieldValue.increment(1),
        lastEmailSent: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error tracking email delivery:', error);
    }
  }
);
