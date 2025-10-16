import { loadStripe, Stripe } from '@stripe/stripe-js';

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('Stripe publishable key is missing');
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

// Payment status types
export type PaymentStatus = 
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

// Payment method types supported
export type PaymentMethodType = 'card' | 'ideal' | 'sepa_debit' | 'sofort' | 'bancontact';

// Currency types supported
export type Currency = 'try' | 'usd' | 'eur' | 'gbp';

// Payment intent creation data
export interface PaymentIntentData {
  amount: number; // Amount in smallest currency unit (e.g., cents for USD, kuruş for TRY)
  currency: Currency;
  metadata?: Record<string, string>;
  description?: string;
  receipt_email?: string;
  shipping?: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      postal_code: string;
      country: string;
    };
  };
  automatic_payment_methods?: {
    enabled: boolean;
  };
}

// Customer data
export interface StripeCustomerData {
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    country: string;
  };
  metadata?: Record<string, string>;
}

// Payment confirmation data
export interface PaymentConfirmationData {
  payment_method?: {
    card: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    };
    billing_details?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        postal_code?: string;
        country?: string;
      };
    };
  };
  return_url?: string;
}

// Refund data
export interface RefundData {
  payment_intent: string;
  amount?: number; // If not provided, refunds the full amount
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

// Helper function to format amount for Stripe (convert to smallest currency unit)
export const formatAmountForStripe = (amount: number, currency: Currency): number => {
  // Most currencies use 2 decimal places, but some (like JPY) use 0
  const multipliers: Record<Currency, number> = {
    try: 100, // Turkish Lira uses kuruş (1/100)
    usd: 100, // US Dollar uses cents (1/100)
    eur: 100, // Euro uses cents (1/100)
    gbp: 100, // British Pound uses pence (1/100)
  };

  return Math.round(amount * (multipliers[currency] || 100));
};

// Helper function to format amount from Stripe (convert from smallest currency unit)
export const formatAmountFromStripe = (amount: number, currency: Currency): number => {
  const divisors: Record<Currency, number> = {
    try: 100,
    usd: 100,
    eur: 100,
    gbp: 100,
  };

  return amount / (divisors[currency] || 100);
};

// Helper function to format currency display
export const formatCurrency = (amount: number, currency: Currency, locale: string = 'tr-TR'): string => {
  const localeMap: Record<Currency, string> = {
    try: 'tr-TR',
    usd: 'en-US',
    eur: 'de-DE',
    gbp: 'en-GB',
  };

  return new Intl.NumberFormat(localeMap[currency] || locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Validation helpers
export const validateCard = (cardNumber: string): boolean => {
  // Basic Luhn algorithm implementation
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

export const validateExpiry = (month: number, year: number): boolean => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  if (month < 1 || month > 12) return false;
  
  return true;
};

export const validateCVC = (cvc: string, cardType?: string): boolean => {
  const digits = cvc.replace(/\D/g, '');
  
  // American Express uses 4 digits, others use 3
  if (cardType === 'amex') {
    return digits.length === 4;
  }
  
  return digits.length === 3;
};

// Card type detection
export const getCardType = (cardNumber: string): string => {
  const number = cardNumber.replace(/\D/g, '');
  
  // Visa
  if (/^4/.test(number)) return 'visa';
  
  // Mastercard
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
  
  // American Express
  if (/^3[47]/.test(number)) return 'amex';
  
  // Discover
  if (/^6/.test(number)) return 'discover';
  
  // Troy (Turkish local card)
  if (/^9792/.test(number)) return 'troy';
  
  return 'unknown';
};

// Error handling
export class StripeError extends Error {
  public code: string;
  public type: string;
  public param?: string;

  constructor(message: string, code: string, type: string, param?: string) {
    super(message);
    this.name = 'StripeError';
    this.code = code;
    this.type = type;
    this.param = param;
  }
}

// Convert Stripe errors to user-friendly Turkish messages
export const getStripeErrorMessage = (error: any): string => {
  const errorMessages: Record<string, string> = {
    // Card errors
    'card_declined': 'Kartınız reddedildi. Lütfen farklı bir kart deneyin.',
    'expired_card': 'Kartınızın süresi dolmuş. Lütfen farklı bir kart deneyin.',
    'incorrect_cvc': 'Güvenlik kodu (CVC) hatalı.',
    'incorrect_number': 'Kart numarası hatalı.',
    'invalid_expiry_month': 'Son kullanma ayı geçersiz.',
    'invalid_expiry_year': 'Son kullanma yılı geçersiz.',
    'invalid_number': 'Kart numarası geçersiz.',
    'processing_error': 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.',
    'insufficient_funds': 'Kartınızda yeterli bakiye bulunmuyor.',
    
    // Authentication errors
    'authentication_required': 'Kartınız 3D Secure doğrulaması gerektiriyor.',
    
    // API errors
    'api_connection_error': 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
    'api_error': 'Ödeme hizmeti geçici olarak kullanılamıyor.',
    'rate_limit_error': 'Çok fazla deneme yapıldı. Lütfen biraz bekleyin.',
    'validation_error': 'Girilen bilgiler geçersiz.',
    
    // Generic
    'generic_decline': 'Kartınız reddedildi. Detaylar için bankanızla iletişime geçin.',
  };

  const code = error?.code || error?.decline_code;
  return errorMessages[code] || 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.';
};
