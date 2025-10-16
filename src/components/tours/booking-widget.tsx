'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ServiceListing } from '@/lib/firestore-collections';
import { useAuth } from '@/lib/auth';
import { 
  Calendar, 
  Users, 
  Clock, 
  CreditCard,
  Shield,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BookingWidgetProps {
  tour: ServiceListing;
}

export function BookingWidget({ tour }: BookingWidgetProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total price
  const totalParticipants = adults + children;
  const basePrice = tour.price?.amount || 0;
  const totalPrice = basePrice * (tour.price?.priceType === 'per person' ? totalParticipants : 1);

  // Format price
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: tour.price?.currency || 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle booking
  const handleBooking = async () => {
    if (!user) {
      toast.error('Rezervasyon yapmak için giriş yapmalısınız.');
      return;
    }

    if (!selectedDate) {
      toast.error('Lütfen bir tarih seçin.');
      return;
    }

    if (totalParticipants === 0) {
      toast.error('En az 1 kişi seçmelisiniz.');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement actual booking logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast.success('Rezervasyon başarıyla oluşturuldu!');
      
      // TODO: Redirect to booking confirmation or payment page
    } catch (error) {
      toast.error('Rezervasyon oluşturulurken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if booking is available
  const isAvailable = tour.status === 'active' && 
    (!tour.capacity?.max || totalParticipants <= tour.capacity.max);

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Rezervasyon Yap</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(totalPrice)}
            </div>
            <div className="text-sm text-muted-foreground">
              {tour.price?.priceType === 'per person' && totalParticipants > 1 
                ? `${formatPrice(basePrice)} × ${totalParticipants} kişi`
                : 'toplam'
              }
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Selection */}
        <div>
          <Label htmlFor="date" className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            Tarih Seçin
          </Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Participant Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Katılımcılar
          </Label>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="adults" className="text-sm">Yetişkin</Label>
              <Select value={adults.toString()} onValueChange={(value) => setAdults(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} kişi
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="children" className="text-sm">Çocuk</Label>
              <Select value={children.toString()} onValueChange={(value) => setChildren(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} çocuk
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Capacity Check */}
          {tour.capacity?.max && (
            <div className="text-sm text-muted-foreground">
              Maksimum {tour.capacity.max} kişi
            </div>
          )}
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tur Fiyatı</span>
            <span>
              {tour.price?.priceType === 'per person' 
                ? `${formatPrice(basePrice)} × ${totalParticipants}`
                : formatPrice(basePrice)
              }
            </span>
          </div>
          
          {totalParticipants > 1 && tour.price?.priceType === 'per person' && (
            <div className="flex justify-between text-sm">
              <span>Ara Toplam</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Hizmet Bedeli</span>
            <span>Dahil</span>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold">
            <span>Toplam</span>
            <span className="text-primary">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {/* Booking Button */}
        <Button 
          onClick={handleBooking}
          disabled={!isAvailable || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Rezervasyon Yapılıyor...
            </>
          ) : !isAvailable ? (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              Müsait Değil
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Rezervasyon Yap
            </>
          )}
        </Button>

        {/* Booking Info */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-600" />
            <span>Ücretsiz iptal (24 saat öncesine kadar)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-600" />
            <span>Anında onay</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-green-600" />
            <span>Güvenli ödeme</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-green-600" />
            <span>Rezervasyon değişikliği mümkün</span>
          </div>
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Sorularınız mı var?
          </p>
          <Button variant="outline" size="sm" className="w-full">
            Bize Ulaşın
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
