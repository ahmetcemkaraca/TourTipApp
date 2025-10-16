'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from './payment-form';
import { OrderSummary } from './order-summary';
import { CustomerInfoForm } from './customer-info-form';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { useAuth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { paymentService } from '@/lib/payment-service';
import { cartService } from '@/lib/cart-service';
import { Shield, Lock, CreditCard, User, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type CheckoutStep = 'customer-info' | 'payment' | 'confirmation';

export function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { cartItems, cartTotals, clearCart } = useCart();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('customer-info');
  const [customerData, setCustomerData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      postal_code: '',
      country: 'TR',
    },
  });
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Check if coming from cart with selected items
  const selectedItemIds = searchParams.get('items')?.split(',') || [];
  const selectedCartItems = selectedItemIds.length > 0 
    ? cartItems.filter(item => selectedItemIds.includes(item.id))
    : cartItems;

  // Redirect if no items to checkout
  useEffect(() => {
    if (selectedCartItems.length === 0) {
      toast.error('Sepetinizde ürün bulunmuyor.');
      router.push('/cart');
    }
  }, [selectedCartItems, router]);

  // Reserve cart items when checkout starts
  useEffect(() => {
    if (user && selectedCartItems.length > 0) {
      cartService.reserveCartItems(user.uid, 15); // 15 minute reservation
    }
  }, [user, selectedCartItems]);

  const steps = [
    {
      id: 'customer-info',
      title: 'Müşteri Bilgileri',
      icon: User,
      description: 'İletişim ve adres bilgilerinizi girin',
    },
    {
      id: 'payment',
      title: 'Ödeme',
      icon: CreditCard,
      description: 'Ödeme bilgilerinizi girin',
    },
    {
      id: 'confirmation',
      title: 'Onay',
      icon: CheckCircle,
      description: 'Rezervasyonunuz onaylandı',
    },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const handleCustomerInfoSubmit = async (data: typeof customerData) => {
    try {
      setIsProcessing(true);
      setCustomerData(data);

      // Validate cart availability before proceeding
      const validation = await cartService.validateCartAvailability(selectedCartItems);
      if (!validation.valid) {
        toast.error('Sepetinizdeki bazı ürünler artık mevcut değil.');
        return;
      }

      // Create payment intent
      const result = await paymentService.createPaymentIntent(
        selectedCartItems,
        data,
        [] // Booking IDs will be created during payment confirmation
      );

      setPaymentIntentId(result.paymentIntentId);
      setClientSecret(result.clientSecret);
      setCurrentStep('payment');

    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Ödeme hazırlanırken hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setIsProcessing(true);

      // Clear the cart
      await clearCart();
      
      setPaymentCompleted(true);
      setCurrentStep('confirmation');
      
      toast.success('Ödemeniz başarılı! Rezervasyonunuz onaylandı.');

    } catch (error) {
      console.error('Error completing checkout:', error);
      toast.error('Rezervasyon tamamlanırken hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    toast.error(error.message || 'Ödeme işlemi başarısız oldu.');
    
    // Release reserved cart items
    if (user) {
      cartService.releaseReservedItems(user.uid);
    }
  };

  const handleBackToCart = () => {
    // Release reserved items when going back
    if (user) {
      cartService.releaseReservedItems(user.uid);
    }
    router.push('/cart');
  };

  if (selectedCartItems.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Sepetim', href: '/cart' },
            { label: 'Ödeme', current: true },
          ]} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 
                    ${isActive ? 'bg-primary border-primary text-primary-foreground' : ''}
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'border-muted-foreground text-muted-foreground' : ''}
                  `}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 text-left">
                    <p className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-px bg-muted mx-4" />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 'customer-info' && (
              <CustomerInfoForm
                initialData={customerData}
                onSubmit={handleCustomerInfoSubmit}
                isLoading={isProcessing}
                onBack={handleBackToCart}
              />
            )}

            {currentStep === 'payment' && clientSecret && (
              <Elements 
                stripe={getStripe()} 
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: 'hsl(var(--primary))',
                    },
                  },
                }}
              >
                <PaymentForm
                  clientSecret={clientSecret}
                  customerData={customerData}
                  cartItems={selectedCartItems}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  isProcessing={isProcessing}
                  onBack={() => setCurrentStep('customer-info')}
                />
              </Elements>
            )}

            {currentStep === 'confirmation' && (
              <ConfirmationStep
                paymentIntentId={paymentIntentId}
                customerData={customerData}
                cartItems={selectedCartItems}
              />
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary cartItems={selectedCartItems} />
            
            {/* Security Badges */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Güvenlik
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-green-500" />
                  <span>256-bit SSL şifreli ödeme</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>PCI DSS uyumlu</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  <span>3D Secure destekli</span>
                </div>
                <p className="text-xs">
                  Kart bilgileriniz güvenli bir şekilde Stripe tarafından işlenir.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConfirmationStepProps {
  paymentIntentId: string | null;
  customerData: any;
  cartItems: any[];
}

function ConfirmationStep({ paymentIntentId, customerData, cartItems }: ConfirmationStepProps) {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Rezervasyonunuz Onaylandı!</h2>
        <p className="text-muted-foreground mb-6">
          Ödemeniz başarıyla alındı ve rezervasyonunuz onaylandı. 
          Onay e-postası {customerData.email} adresine gönderildi.
        </p>

        <div className="space-y-3 mb-6">
          <div className="text-sm">
            <span className="font-medium">Ödeme ID: </span>
            <code className="bg-muted px-2 py-1 rounded text-xs">
              {paymentIntentId?.slice(-8)}
            </code>
          </div>
          <div className="text-sm">
            <span className="font-medium">Rezervasyon Sayısı: </span>
            {cartItems.length} tur
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push('/dashboard/bookings')}>
            Rezervasyonlarım
          </Button>
          <Button onClick={() => router.push('/tours')}>
            Yeni Tur Keşfet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
