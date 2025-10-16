import { 
  PaymentIntentData, 
  StripeCustomerData, 
  RefundData, 
  formatAmountForStripe,
  formatAmountFromStripe,
  Currency 
} from './stripe';
import { CartItem, Booking } from './firestore-collections';
import { FirestoreService } from './firestore-service';
import { addDoc, collection, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import { db } from './firebase';

// Payment record schema
export interface PaymentRecord {
  id: string;
  bookingId: string;
  userId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  paymentMethod?: {
    type: string;
    last4?: string;
    brand?: string;
    country?: string;
  };
  refunds?: {
    id: string;
    amount: number;
    reason: string;
    status: string;
    createdAt: Date;
  }[];
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentService {
  private paymentsCollection = 'payments';

  /**
   * Creates a payment intent for cart items
   */
  async createPaymentIntent(
    cartItems: CartItem[],
    customerData: StripeCustomerData,
    bookingIds: string[]
  ): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: Currency;
  }> {
    try {
      // Calculate total amount
      const totalAmount = cartItems.reduce((sum, item) => sum + item.pricing.totalPrice, 0);
      const currency = cartItems[0]?.pricing.currency.toLowerCase() as Currency || 'try';

      // Prepare payment intent data
      const paymentData: PaymentIntentData = {
        amount: formatAmountForStripe(totalAmount, currency),
        currency,
        description: `TourTrip rezervasyon - ${cartItems.length} tur`,
        receipt_email: customerData.email,
        metadata: {
          userId: cartItems[0]?.userId || '',
          bookingIds: bookingIds.join(','),
          cartItemIds: cartItems.map(item => item.id).join(','),
          totalItems: cartItems.length.toString(),
          originalAmount: totalAmount.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // Call Cloud Function to create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentData,
          customerData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment intent creation failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Store payment record in Firestore
      await this.createPaymentRecord({
        bookingId: bookingIds[0], // Primary booking ID
        userId: cartItems[0]?.userId || '',
        stripePaymentIntentId: result.paymentIntentId,
        amount: totalAmount,
        currency,
        status: 'pending',
        metadata: {
          bookingIds,
          cartItemIds: cartItems.map(item => item.id),
          customerEmail: customerData.email,
        },
      });

      return {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        amount: totalAmount,
        currency,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirms a payment and updates booking status
   */
  async confirmPayment(
    paymentIntentId: string,
    bookingIds: string[]
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        // Update payment record
        const paymentRecord = await this.getPaymentByIntentId(paymentIntentId);
        if (paymentRecord) {
          const paymentRef = doc(db, this.paymentsCollection, paymentRecord.id);
          transaction.update(paymentRef, {
            status: 'succeeded',
            updatedAt: serverTimestamp(),
          });
        }

        // Update booking statuses
        for (const bookingId of bookingIds) {
          const bookingRef = doc(db, 'bookings', bookingId);
          transaction.update(bookingRef, {
            bookingStatus: 'confirmed',
            'paymentInfo.paymentStatus': 'completed',
            'paymentInfo.paymentId': paymentIntentId,
            'paymentInfo.paidAt': serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Handles payment failure
   */
  async handlePaymentFailure(
    paymentIntentId: string,
    failureReason: string,
    bookingIds: string[]
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        // Update payment record
        const paymentRecord = await this.getPaymentByIntentId(paymentIntentId);
        if (paymentRecord) {
          const paymentRef = doc(db, this.paymentsCollection, paymentRecord.id);
          transaction.update(paymentRef, {
            status: 'failed',
            failureReason,
            updatedAt: serverTimestamp(),
          });
        }

        // Update booking statuses
        for (const bookingId of bookingIds) {
          const bookingRef = doc(db, 'bookings', bookingId);
          transaction.update(bookingRef, {
            bookingStatus: 'cancelled',
            'paymentInfo.paymentStatus': 'failed',
            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  }

  /**
   * Processes a refund
   */
  async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason: string = 'requested_by_customer'
  ): Promise<void> {
    try {
      const paymentRecord = await this.getPaymentByIntentId(paymentIntentId);
      if (!paymentRecord) {
        throw new Error('Payment record not found');
      }

      // Calculate refund amount
      const refundAmount = amount || paymentRecord.amount;
      
      // Call Cloud Function to process refund
      const response = await fetch('/api/process-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          amount: formatAmountForStripe(refundAmount, paymentRecord.currency),
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error(`Refund processing failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update payment record with refund information
      await this.updatePaymentRecord(paymentRecord.id, {
        status: refundAmount === paymentRecord.amount ? 'refunded' : 'succeeded',
        refunds: [
          ...(paymentRecord.refunds || []),
          {
            id: result.refundId,
            amount: refundAmount,
            reason,
            status: 'succeeded',
            createdAt: new Date(),
          },
        ],
        updatedAt: new Date(),
      });

    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Gets payment status by payment intent ID
   */
  async getPaymentStatus(paymentIntentId: string): Promise<PaymentRecord | null> {
    try {
      return await this.getPaymentByIntentId(paymentIntentId);
    } catch (error) {
      console.error('Error getting payment status:', error);
      return null;
    }
  }

  /**
   * Gets user's payment history
   */
  async getUserPaymentHistory(userId: string): Promise<PaymentRecord[]> {
    try {
      const paymentsRef = collection(db, this.paymentsCollection);
      const { data } = await new FirestoreService(this.paymentsCollection, {} as any).list({
        filters: [{ field: 'userId', operator: '==', value: userId }],
        orderField: 'createdAt',
        orderDirection: 'desc',
      });

      return data as PaymentRecord[];
    } catch (error) {
      console.error('Error getting user payment history:', error);
      return [];
    }
  }

  /**
   * Validates payment amount against cart total
   */
  validatePaymentAmount(cartItems: CartItem[], paymentAmount: number): boolean {
    const cartTotal = cartItems.reduce((sum, item) => sum + item.pricing.totalPrice, 0);
    const tolerance = 0.01; // Allow 1 cent tolerance for rounding
    
    return Math.abs(cartTotal - paymentAmount) <= tolerance;
  }

  /**
   * Creates a payment record in Firestore
   */
  private async createPaymentRecord(data: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const paymentRef = await addDoc(collection(db, this.paymentsCollection), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return paymentRef.id;
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  }

  /**
   * Updates a payment record
   */
  private async updatePaymentRecord(
    paymentId: string, 
    updates: Partial<Omit<PaymentRecord, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const paymentRef = doc(db, this.paymentsCollection, paymentId);
      await new FirestoreService(this.paymentsCollection, {} as any).update(paymentId, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating payment record:', error);
      throw error;
    }
  }

  /**
   * Gets payment record by Stripe payment intent ID
   */
  private async getPaymentByIntentId(paymentIntentId: string): Promise<PaymentRecord | null> {
    try {
      const { data } = await new FirestoreService(this.paymentsCollection, {} as any).list({
        filters: [{ field: 'stripePaymentIntentId', operator: '==', value: paymentIntentId }],
        limit: 1,
      });

      return data.length > 0 ? data[0] as PaymentRecord : null;
    } catch (error) {
      console.error('Error getting payment by intent ID:', error);
      return null;
    }
  }
}

// Export service instance
export const paymentService = new PaymentService();
