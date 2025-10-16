'use client';

import { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Shield, AlertTriangle, ChevronLeft } from 'lucide-react';
import { CartItem } from '@/lib/firestore-collections';
import { getStripeErrorMessage } from '@/lib/stripe';
import { toast } from 'sonner';

interface PaymentFormProps {
  clientSecret: string;
  customerData: any;
  cartItems: CartItem[];
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: any) => void;
  isProcessing: boolean;
  onBack: () => void;
}

export function PaymentForm({
  clientSecret,
  customerData,
  cartItems,
  onSuccess,
  onError,
  isProcessing,
  onBack,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  // Calculate total amount
  const totalAmount = cartItems.reduce((sum, item) => sum + item.pricing.totalPrice, 0);
  const currency = cartItems[0]?.pricing.currency || 'TRY';

  // Format price
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Ödeme sistemi henüz hazır değil. Lütfen bekleyin.');
      return;
    }

    if (!paymentElementReady) {
      setError('Ödeme formu henüz hazır değil. Lütfen bekleyin.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Confirm payment
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          payment_method_data: {
            billing_details: {
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone,
              address: {
                line1: customerData.address.line1,
                line2: customerData.address.line2,
                city: customerData.address.city,
                postal_code: customerData.address.postal_code,
                country: customerData.address.country,
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw confirmError;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else if (paymentIntent) {
        // Handle other statuses like requires_action
        setError('Ödeme doğrulaması gerekiyor. Lütfen bankanızın talimatlarını takip edin.');
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = getStripeErrorMessage(err);
      setError(errorMessage);
      onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Ödeme Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Fatura Adresi</p>
              <p className="font-medium">{customerData.name}</p>
              <p className="text-sm">{customerData.email}</p>
              <p className="text-sm">{customerData.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Adres</p>
              <p className="text-sm">
                {customerData.address.line1}
                {customerData.address.line2 && `, ${customerData.address.line2}`}
              </p>
              <p className="text-sm">
                {customerData.address.city} {customerData.address.postal_code}
              </p>
              <p className="text-sm">{customerData.address.country}</p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Payment Element */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ödeme Yöntemi
                </label>
                <div className="border rounded-lg p-4">
                  <PaymentElement
                    id="payment-element"
                    onReady={() => setPaymentElementReady(true)}
                    options={{
                      layout: 'tabs',
                      defaultValues: {
                        billingDetails: {
                          name: customerData.name,
                          email: customerData.email,
                          phone: customerData.phone,
                          address: {
                            line1: customerData.address.line1,
                            line2: customerData.address.line2,
                            city: customerData.address.city,
                            postal_code: customerData.address.postal_code,
                            country: customerData.address.country,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Toplam Tutar:</span>
                <span className="font-bold text-lg text-primary">
                  {formatPrice(totalAmount, currency)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {cartItems.length} tur için toplam ödeme
              </p>
            </div>

            {/* Security Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Güvenli Ödeme</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Kartınız 256-bit SSL şifrelemesi ve 3D Secure teknolojisi ile korunmaktadır.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading || isProcessing}
                className="flex-1"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Geri
              </Button>
              
              <Button
                type="submit"
                disabled={!stripe || !paymentElementReady || isLoading || isProcessing}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    {formatPrice(totalAmount, currency)} Öde
                  </>
                )}
              </Button>
            </div>

            {/* Terms and Conditions */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Ödeme butonuna tıklayarak{' '}
                <a href="/terms" className="text-primary hover:underline">
                  Kullanım Şartları
                </a>{' '}
                ve{' '}
                <a href="/privacy" className="text-primary hover:underline">
                  Gizlilik Politikası
                </a>nı kabul etmiş olursunuz.
              </p>
              <p>
                İptal durumunda{' '}
                <a href="/cancellation" className="text-primary hover:underline">
                  İptal ve İade Koşulları
                </a>{' '}
                geçerlidir.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Supported Payment Methods */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Kabul Edilen Kartlar:</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                Visa
              </Badge>
              <Badge variant="outline" className="text-xs">
                Mastercard
              </Badge>
              <Badge variant="outline" className="text-xs">
                Troy
              </Badge>
              <Badge variant="outline" className="text-xs">
                American Express
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
