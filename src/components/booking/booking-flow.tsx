'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Breadcrumb, breadcrumbs } from '@/components/layout/breadcrumb';
import { BookingStep1 } from './booking-step1';
import { BookingStep2 } from './booking-step2';
import { BookingStep3 } from './booking-step3';
import { BookingStep4 } from './booking-step4';
import { BookingSummary } from './booking-summary';
import { ServiceListing } from '@/lib/firestore-collections';
import { useAuth } from '@/lib/auth';
import { bookingService } from '@/lib/firestore-service';
import { 
  Calendar, 
  Users, 
  User, 
  CreditCard, 
  Check,
  ArrowLeft,
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export interface BookingData {
  // Step 1: Date & Participants
  selectedDate: string;
  timeSlot?: string;
  adults: number;
  children: number;
  
  // Step 2: Participant Details
  participants: {
    type: 'adult' | 'child';
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    passportNumber?: string;
    specialRequests?: string;
  }[];
  
  // Step 3: Contact Information
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  
  // Step 4: Additional Services
  addOns: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  insurance?: {
    type: string;
    coverage: number;
    premium: number;
  };
  specialRequests: string;
  
  // Pricing
  basePrice: number;
  totalPrice: number;
  currency: string;
}

interface BookingFlowProps {
  tour: ServiceListing;
  initialParams: {
    date: string;
    adults: number;
    children: number;
  };
}

export function BookingFlow({ tour, initialParams }: BookingFlowProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    selectedDate: initialParams.date,
    adults: initialParams.adults,
    children: initialParams.children,
    participants: [],
    contactInfo: {
      firstName: user?.displayName?.split(' ')[0] || '',
      lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
      email: user?.email || '',
      phone: '',
    },
    addOns: [],
    specialRequests: '',
    basePrice: tour.price?.amount || 0,
    totalPrice: 0,
    currency: tour.price?.currency || 'TRY',
  });

  const steps = [
    {
      id: 1,
      title: 'Tarih & Katılımcılar',
      icon: Calendar,
      description: 'Tur tarihi ve katılımcı sayısını seçin',
    },
    {
      id: 2,
      title: 'Katılımcı Bilgileri',
      icon: Users,
      description: 'Katılımcıların detay bilgilerini girin',
    },
    {
      id: 3,
      title: 'İletişim Bilgileri',
      icon: User,
      description: 'İletişim ve acil durum bilgilerini girin',
    },
    {
      id: 4,
      title: 'Ek Hizmetler',
      icon: Shield,
      description: 'Ek hizmetler ve sigorta seçenekleri',
    },
    {
      id: 5,
      title: 'Ödeme',
      icon: CreditCard,
      description: 'Ödeme bilgileri ve rezervasyon onayı',
    },
  ];

  // Calculate total price
  useEffect(() => {
    const basePrice = tour.price?.amount || 0;
    const totalParticipants = bookingData.adults + bookingData.children;
    const participantCost = tour.price?.priceType === 'per person' ? basePrice * totalParticipants : basePrice;
    
    const addOnsCost = bookingData.addOns.reduce((sum, addOn) => sum + (addOn.price * addOn.quantity), 0);
    const insuranceCost = bookingData.insurance?.premium || 0;
    
    const totalPrice = participantCost + addOnsCost + insuranceCost;
    
    setBookingData(prev => ({
      ...prev,
      totalPrice,
    }));
  }, [bookingData.adults, bookingData.children, bookingData.addOns, bookingData.insurance, tour.price]);

  // Handle step data update
  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(bookingData.selectedDate && (bookingData.adults + bookingData.children) > 0);
      case 2:
        return bookingData.participants.length === (bookingData.adults + bookingData.children) &&
               bookingData.participants.every(p => p.firstName && p.lastName);
      case 3:
        return !!(bookingData.contactInfo.firstName && 
                 bookingData.contactInfo.lastName && 
                 bookingData.contactInfo.email && 
                 bookingData.contactInfo.phone);
      case 4:
        return true; // This step is optional
      default:
        return true;
    }
  };

  // Navigate to next step
  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast.error('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit booking
  const submitBooking = async () => {
    if (!validateStep(4)) {
      toast.error('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setIsLoading(true);

    try {
      // Create booking object
      const booking = {
        userId: user!.uid,
        serviceId: tour.id,
        providerId: tour.providerId,
        bookingDate: bookingData.selectedDate,
        startTime: bookingData.timeSlot,
        participants: {
          adults: bookingData.adults,
          children: bookingData.children,
        },
        contactInfo: {
          name: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`,
          email: bookingData.contactInfo.email,
          phone: bookingData.contactInfo.phone,
        },
        specialRequests: bookingData.specialRequests,
        price: {
          basePrice: bookingData.basePrice,
          taxes: 0,
          fees: 0,
          discounts: 0,
          totalPrice: bookingData.totalPrice,
          currency: bookingData.currency,
        },
        paymentStatus: 'pending' as const,
        bookingStatus: 'pending' as const,
        addOns: bookingData.addOns.map(addOn => ({
          addOnId: addOn.id,
          name: addOn.name,
          price: addOn.price,
          quantity: addOn.quantity,
        })),
        insuranceInfo: bookingData.insurance ? {
          policyId: `INS-${Date.now()}`,
          premium: bookingData.insurance.premium,
          coverage: bookingData.insurance.coverage.toString(),
        } : undefined,
      };

      // Use booking service with validation
      const bookingId = await bookingService.createBookingWithValidation(booking);
      
      toast.success('Rezervasyon başarıyla oluşturuldu!');
      
      // Redirect to payment or confirmation page
      router.push(`/booking/confirmation/${bookingId}`);
      
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Rezervasyon oluşturulurken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format price
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: bookingData.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const currentStepInfo = steps[currentStep - 1];
  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[
            { label: 'Turlar', href: '/tours' },
            { label: tour.title, href: `/tours/${tour.id}` },
            { label: 'Rezervasyon', current: true },
          ]} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <currentStepInfo.icon className="h-5 w-5" />
                      {currentStepInfo.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentStepInfo.description}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {currentStep} / {steps.length}
                  </Badge>
                </div>
                
                <Progress value={progressPercentage} className="w-full" />
                
                {/* Step Indicators */}
                <div className="flex justify-between mt-4">
                  {steps.map((step) => {
                    const Icon = step.icon;
                    const isCompleted = currentStep > step.id;
                    const isCurrent = currentStep === step.id;
                    
                    return (
                      <div key={step.id} className="flex flex-col items-center text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                          isCompleted 
                            ? 'bg-primary text-primary-foreground'
                            : isCurrent 
                            ? 'bg-primary/20 text-primary border-2 border-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        <span className={`text-xs hidden sm:block ${
                          isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                        }`}>
                          {step.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardHeader>
            </Card>

            {/* Step Content */}
            <Card>
              <CardContent className="p-6">
                {currentStep === 1 && (
                  <BookingStep1
                    tour={tour}
                    data={bookingData}
                    onUpdate={updateBookingData}
                  />
                )}
                {currentStep === 2 && (
                  <BookingStep2
                    data={bookingData}
                    onUpdate={updateBookingData}
                  />
                )}
                {currentStep === 3 && (
                  <BookingStep3
                    data={bookingData}
                    onUpdate={updateBookingData}
                  />
                )}
                {currentStep === 4 && (
                  <BookingStep4
                    tour={tour}
                    data={bookingData}
                    onUpdate={updateBookingData}
                  />
                )}
                {currentStep === 5 && (
                  <div className="text-center py-8">
                    <h3 className="text-2xl font-bold mb-4">Rezervasyonu Tamamla</h3>
                    <p className="text-muted-foreground mb-6">
                      Ödeme sayfasına yönlendirileceksiniz.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                      <Clock className="h-4 w-4" />
                      <span>Bu sayfa 10 dakika sonra zaman aşımına uğrayacak</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Geri
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="flex items-center gap-2"
                >
                  İleri
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={submitBooking}
                  disabled={isLoading || !validateStep(4)}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Ödemeye Geç ({formatPrice(bookingData.totalPrice)})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <BookingSummary tour={tour} data={bookingData} />
          </div>
        </div>
      </div>
    </div>
  );
}
