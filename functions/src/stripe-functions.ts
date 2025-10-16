import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Create Payment Intent
export const createPaymentIntent = functions.https.onCall(async (data: any, context: any) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { paymentData, customerData } = data;

    // Validate required fields
    if (!paymentData || !customerData) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required payment or customer data');
    }

    // Create or retrieve Stripe customer
    let customer: Stripe.Customer;
    
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: customerData.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      
      // Update customer data if needed
      await stripe.customers.update(customer.id, {
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        metadata: customerData.metadata,
      });
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        metadata: {
          ...customerData.metadata,
          firebaseUid: context.auth.uid,
        },
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentData.amount,
      currency: paymentData.currency,
      customer: customer.id,
      description: paymentData.description,
      receipt_email: customerData.email,
      metadata: {
        ...paymentData.metadata,
        customerId: customer.id,
        firebaseUid: context.auth.uid,
      },
      automatic_payment_methods: paymentData.automatic_payment_methods,
      shipping: paymentData.shipping,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customer.id,
    };

  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to create payment intent');
  }
});

// Process Refund
export const processRefund = functions.https.onCall(async (data: any, context: any) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { paymentIntentId, amount, reason } = data;

    if (!paymentIntentId) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment intent ID is required');
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // If undefined, refunds the full amount
      reason: reason || 'requested_by_customer',
      metadata: {
        firebaseUid: context.auth.uid,
        refundedAt: new Date().toISOString(),
      },
    });

    return {
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
      reason: refund.reason,
    };

  } catch (error) {
    console.error('Error processing refund:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to process refund');
  }
});

// Stripe Webhook Handler
export const stripeWebhook = functions.https.onRequest(async (req: any, res: any) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = functions.config().stripe.webhook_secret;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).send('Webhook signature verification failed');
      return;
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;
        
      case 'invoice.payment_succeeded':
        // Handle subscription payments if needed
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).send('Webhook handler failed');
  }
});

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { metadata } = paymentIntent;
    const bookingIds = metadata.bookingIds?.split(',') || [];
    
    // Update payment record
    await updatePaymentRecord(paymentIntent.id, {
      status: 'succeeded',
      paymentMethod: {
        type: paymentIntent.payment_method_types[0] || 'card',
        // Additional payment method details can be retrieved if needed
      },
    });

    // Update booking statuses
    const batch = db.batch();
    
    for (const bookingId of bookingIds) {
      if (bookingId) {
        const bookingRef = db.collection('bookings').doc(bookingId);
        batch.update(bookingRef, {
          bookingStatus: 'confirmed',
          'paymentInfo.paymentStatus': 'completed',
          'paymentInfo.paymentId': paymentIntent.id,
          'paymentInfo.paidAt': admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
    
    await batch.commit();

    // Send confirmation email (if email service is configured)
    // await sendBookingConfirmationEmail(bookingIds);

    console.log(`Payment succeeded for intent: ${paymentIntent.id}`);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { metadata } = paymentIntent;
    const bookingIds = metadata.bookingIds?.split(',') || [];
    
    // Update payment record
    await updatePaymentRecord(paymentIntent.id, {
      status: 'failed',
      failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
    });

    // Update booking statuses
    const batch = db.batch();
    
    for (const bookingId of bookingIds) {
      if (bookingId) {
        const bookingRef = db.collection('bookings').doc(bookingId);
        batch.update(bookingRef, {
          bookingStatus: 'cancelled',
          'paymentInfo.paymentStatus': 'failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
    
    await batch.commit();

    console.log(`Payment failed for intent: ${paymentIntent.id}`);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle canceled payment
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { metadata } = paymentIntent;
    const bookingIds = metadata.bookingIds?.split(',') || [];
    
    // Update payment record
    await updatePaymentRecord(paymentIntent.id, {
      status: 'canceled',
    });

    // Update booking statuses
    const batch = db.batch();
    
    for (const bookingId of bookingIds) {
      if (bookingId) {
        const bookingRef = db.collection('bookings').doc(bookingId);
        batch.update(bookingRef, {
          bookingStatus: 'cancelled',
          'paymentInfo.paymentStatus': 'canceled',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
    
    await batch.commit();

    console.log(`Payment canceled for intent: ${paymentIntent.id}`);

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

// Handle charge dispute
async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    // Log dispute for manual review
    await db.collection('disputes').add({
      disputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      evidence: dispute.evidence,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify admin about dispute
    console.log(`Charge dispute created: ${dispute.id}`);

  } catch (error) {
    console.error('Error handling charge dispute:', error);
  }
}

// Helper function to update payment record
async function updatePaymentRecord(paymentIntentId: string, updates: any) {
  try {
    const paymentsRef = db.collection('payments');
    const query = await paymentsRef.where('stripePaymentIntentId', '==', paymentIntentId).limit(1).get();
    
    if (!query.empty) {
      const doc = query.docs[0];
      await doc.ref.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating payment record:', error);
  }
}
