'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceListing } from '@/lib/firestore-collections';
import { BookingData } from './booking-flow';
import { Calendar, Clock, Users, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BookingStep1Props {
  tour: ServiceListing;
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
}

export function BookingStep1({ tour, data, onUpdate }: BookingStep1Props) {
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  // Available time slots (mock data - in real app, fetch from Firestore)
  const timeSlots = [
    { id: '09:00', label: '09:00', available: true, spots: 12 },
    { id: '11:00', label: '11:00', available: true, spots: 8 },
    { id: '14:00', label: '14:00', available: false, spots: 0 },
    { id: '16:00', label: '16:00', available: true, spots: 15 },
  ];

  // Calculate total participants
  const totalParticipants = data.adults + data.children;
  const maxCapacity = tour.capacity?.max || 20;

  // Handle date change
  const handleDateChange = (date: string) => {
    onUpdate({ 
      selectedDate: date, 
      timeSlot: undefined // Reset time slot when date changes
    });
    setAvailabilityChecked(false);
  };

  // Handle participant count change
  const handleParticipantChange = (type: 'adults' | 'children', value: number) => {
    onUpdate({ [type]: value });
    setAvailabilityChecked(false);
  };

  // Check availability
  const checkAvailability = async () => {
    if (!data.selectedDate) {
      toast.error('Lütfen bir tarih seçin.');
      return;
    }

    setCheckingAvailability(true);

    try {
      // Mock API call - in real app, check Firestore for availability
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAvailabilityChecked(true);
      toast.success('Müsaitlik kontrolü tamamlandı!');
    } catch (error) {
      toast.error('Müsaitlik kontrolü yapılırken hata oluştu.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: string) => {
    onUpdate({ timeSlot });
  };

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0];

  // Calculate price
  const basePrice = tour.price?.amount || 0;
  const totalPrice = tour.price?.priceType === 'per person' ? basePrice * totalParticipants : basePrice;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: tour.price?.currency || 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Tour Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{tour.title}</h3>
              <p className="text-sm text-muted-foreground">
                {tour.duration && `${tour.duration.value} ${tour.duration.unit === 'hours' ? 'saat' : 'gün'}`}
                {tour.capacity?.max && ` • Max ${tour.capacity.max} kişi`}
              </p>
              <div className="text-lg font-bold text-primary mt-1">
                {formatPrice(basePrice)}
                {tour.price?.priceType === 'per person' && ' / kişi'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Selection */}
      <div>
        <Label htmlFor="date" className="text-base font-semibold flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5" />
          Tur Tarihi Seçin
        </Label>
        <Input
          id="date"
          type="date"
          value={data.selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          min={today}
          className="text-lg p-3"
        />
        {data.selectedDate && (
          <p className="text-sm text-muted-foreground mt-2">
            Seçilen tarih: {new Date(data.selectedDate).toLocaleDateString('tr-TR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
      </div>

      {/* Participant Selection */}
      <div>
        <Label className="text-base font-semibold flex items-center gap-2 mb-3">
          <Users className="h-5 w-5" />
          Katılımcı Sayısı
        </Label>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="adults" className="text-sm mb-2 block">
              Yetişkin (12+ yaş)
            </Label>
            <Select 
              value={data.adults.toString()} 
              onValueChange={(value) => handleParticipantChange('adults', Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: Math.min(maxCapacity, 10) }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'kişi' : 'kişi'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="children" className="text-sm mb-2 block">
              Çocuk (2-11 yaş)
            </Label>
            <Select 
              value={data.children.toString()} 
              onValueChange={(value) => handleParticipantChange('children', Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: Math.min(maxCapacity - data.adults, 6) }, (_, i) => i).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'çocuk' : 'çocuk'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Capacity Warning */}
        {totalParticipants > maxCapacity && (
          <div className="flex items-center gap-2 mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              Maksimum katılımcı sayısını ({maxCapacity}) aştınız.
            </span>
          </div>
        )}

        {/* Price Summary */}
        {totalParticipants > 0 && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">
                {totalParticipants} katılımcı için toplam:
              </span>
              <span className="font-semibold text-primary">
                {formatPrice(totalPrice)}
              </span>
            </div>
            {tour.price?.priceType === 'per person' && totalParticipants > 1 && (
              <div className="text-xs text-muted-foreground mt-1">
                {formatPrice(basePrice)} × {totalParticipants} kişi
              </div>
            )}
          </div>
        )}
      </div>

      {/* Availability Check */}
      {data.selectedDate && totalParticipants > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">
              Müsaitlik Kontrolü
            </Label>
            {!availabilityChecked && (
              <Button 
                onClick={checkAvailability}
                disabled={checkingAvailability}
                variant="outline"
                size="sm"
              >
                {checkingAvailability ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Kontrol Ediliyor...
                  </>
                ) : (
                  'Müsaitliği Kontrol Et'
                )}
              </Button>
            )}
          </div>

          {availabilityChecked && (
            <div>
              <Label className="text-sm flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4" />
                Saat Seçin
              </Label>
              
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => slot.available && handleTimeSlotSelect(slot.id)}
                    disabled={!slot.available}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      data.timeSlot === slot.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : slot.available
                        ? 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50'
                        : 'border-muted-foreground/10 bg-muted/30 text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{slot.label}</span>
                      {data.timeSlot === slot.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="text-xs mt-1">
                      {slot.available ? (
                        <span className="text-green-600">
                          {slot.spots} yer mevcut
                        </span>
                      ) : (
                        <span className="text-red-600">
                          Dolu
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Important Notes */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-amber-800">Önemli Notlar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700 space-y-1">
          <p>• Rezervasyon sonrası 24 saat içinde ücretsiz iptal hakkınız bulunmaktadır.</p>
          <p>• Çocuklar için kimlik belgesi gereklidir.</p>
          <p>• Hava şartlarına bağlı olarak tur ertelenebilir.</p>
          <p>• Güvenlik talimatlarına uyulması zorunludur.</p>
        </CardContent>
      </Card>
    </div>
  );
}
