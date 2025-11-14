/**
 * Complete Stripe Payment Service
 * Handles all payment operations with Stripe
 */

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

export interface PaymentIntentData {
  amount: number;
  currency: string;
  bookingId: string;
  tourId: string;
  userId: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

export class StripePaymentService {
  private stripe: Stripe | null = null;

  async initialize(): Promise<void> {
    this.stripe = await getStripe();
    if (!this.stripe) {
      throw new Error('Failed to initialize Stripe');
    }
  }

  /**
   * Create payment intent on backend
   */
  async createPaymentIntent(data: PaymentIntentData): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    const response = await fetch('/api/payment/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }

    return response.json();
  }

  /**
   * Confirm payment with card element
   */
  async confirmPayment(
    clientSecret: string,
    elements: StripeElements,
    returnUrl: string
  ): Promise<PaymentResult> {
    if (!this.stripe) {
      await this.initialize();
    }

    if (!this.stripe) {
      return {
        success: false,
        error: 'Stripe not initialized',
      };
    }

    const { error, paymentIntent } = await this.stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
      };
    }

    return {
      success: false,
      error: 'Payment not completed',
    };
  }

  /**
   * Process full payment flow
   */
  async processPayment(
    data: PaymentIntentData,
    elements: StripeElements,
    returnUrl: string
  ): Promise<PaymentResult> {
    try {
      // Step 1: Create payment intent
      const { clientSecret, paymentIntentId } = await this.createPaymentIntent(data);

      // Step 2: Confirm payment
      const result = await this.confirmPayment(clientSecret, elements, returnUrl);

      if (result.success) {
        // Step 3: Notify backend about successful payment
        await this.notifyPaymentSuccess(paymentIntentId, data.bookingId);
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }
  }

  /**
   * Notify backend about successful payment
   */
  async notifyPaymentSuccess(paymentIntentId: string, bookingId: string): Promise<void> {
    await fetch('/api/payment/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        bookingId,
      }),
    });
  }

  /**
   * Request refund
   */
  async requestRefund(paymentIntentId: string, bookingId: string, reason?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/payment/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          bookingId,
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Refund failed',
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Refund failed',
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentIntentId: string): Promise<{
    status: string;
    amount: number;
    currency: string;
  } | null> {
    try {
      const response = await fetch(`/api/payment/status?paymentIntentId=${paymentIntentId}`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      return null;
    }
  }

  /**
   * Format amount for Stripe (converts to cents)
   */
  formatAmount(amount: number, currency: string = 'TRY'): number {
    // Most currencies use 2 decimal places
    // Some currencies like JPY don't have decimal places
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND'];

    if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
      return Math.round(amount);
    }

    return Math.round(amount * 100);
  }

  /**
   * Format amount from Stripe (converts from cents)
   */
  unformatAmount(amount: number, currency: string = 'TRY'): number {
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND'];

    if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
      return amount;
    }

    return amount / 100;
  }
}

// Export singleton instance
export const stripePaymentService = new StripePaymentService();

// Export for use in components
export { getStripe };
