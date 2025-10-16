'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ServiceListing } from '@/lib/firestore-collections';
import { BookingData } from './booking-flow';
import { 
  Calendar, 
  Users, 
  Clock, 
  MapPin,
  Shield,
  Plus,
  CreditCard,
  Check
} from 'lucide-react';

interface BookingSummaryProps {
  tour: ServiceListing;
  data: BookingData;
}

export function BookingSummary({ tour, data }: BookingSummaryProps) {
  // Format price
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: data.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    return new Date(dateString).toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate costs
  const basePrice = tour.price?.amount || 0;
  const totalParticipants = data.adults + data.children;
  const participantCost = tour.price?.priceType === 'per person' ? basePrice * totalParticipants : basePrice;
  const addOnsCost = data.addOns.reduce((sum, addOn) => sum + (addOn.price * addOn.quantity), 0);
  const insuranceCost = data.insurance?.premium || 0;
  const subtotal = participantCost + addOnsCost + insuranceCost;
  const taxRate = 0.08; // 8% tax
  const taxes = subtotal * taxRate;
  const totalCost = subtotal + taxes;

  const mainImage = tour.images?.[0] || '/placeholder-tour.jpg';

  return (
    <div className="sticky top-8">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Rezervasyon Özeti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tour Info */}
          <div>
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-3">
              <Image
                src={mainImage}
                alt={tour.title}
                fill
                className="object-cover"
              />
            </div>
            
            <h3 className="font-semibold line-clamp-2 mb-2">{tour.title}</h3>
            
            {tour.location?.address && (
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="line-clamp-1">{tour.location.address}</span>
              </div>
            )}

            {tour.rating && (
              <div className="flex items-center text-sm">
                <span className="font-medium">{tour.rating.toFixed(1)}</span>
                <span className="text-muted-foreground ml-1">
                  ({Math.floor(Math.random() * 500) + 50} değerlendirme)
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Booking Details */}
          <div className="space-y-3">
            {/* Date & Time */}
            {data.selectedDate && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="text-sm">
                  <div className="font-medium">
                    {formatDate(data.selectedDate)}
                  </div>
                  {data.timeSlot && (
                    <div className="text-muted-foreground">
                      Saat: {data.timeSlot}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Participants */}
            {totalParticipants > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">{totalParticipants} kişi</span>
                  <span className="text-muted-foreground ml-1">
                    ({data.adults} yetişkin{data.children > 0 && `, ${data.children} çocuk`})
                  </span>
                </div>
              </div>
            )}

            {/* Duration */}
            {tour.duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {tour.duration.value} {tour.duration.unit === 'hours' ? 'saat' : 'gün'}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Pricing Breakdown */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Fiyat Detayı</h4>
            
            {/* Base Price */}
            <div className="flex justify-between text-sm">
              <span>
                Tur fiyatı
                {tour.price?.priceType === 'per person' && ` (${totalParticipants} kişi)`}
              </span>
              <span>{formatPrice(participantCost)}</span>
            </div>

            {/* Add-ons */}
            {data.addOns.length > 0 && (
              <>
                {data.addOns.map((addOn) => (
                  <div key={addOn.id} className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      {addOn.name} {addOn.quantity > 1 && `(×${addOn.quantity})`}
                    </span>
                    <span>{formatPrice(addOn.price * addOn.quantity)}</span>
                  </div>
                ))}
              </>
            )}

            {/* Insurance */}
            {data.insurance && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Sigorta
                </span>
                <span>{formatPrice(data.insurance.premium)}</span>
              </div>
            )}

            <Separator />

            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span>Ara Toplam</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {/* Taxes */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Vergiler (%8)</span>
              <span>{formatPrice(taxes)}</span>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between font-semibold">
              <span>Toplam</span>
              <span className="text-primary text-lg">{formatPrice(totalCost)}</span>
            </div>
          </div>

          <Separator />

          {/* Booking Guarantees */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Güvenceler</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                <span>Anında onay</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                <span>24 saat ücretsiz iptal</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                <span>Güvenli ödeme</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                <span>Müşteri destek hattı</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {data.contactInfo.firstName && (
            <>
              <Separator />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">İletişim</h4>
                <div className="text-sm text-muted-foreground">
                  <div>{data.contactInfo.firstName} {data.contactInfo.lastName}</div>
                  {data.contactInfo.email && <div>{data.contactInfo.email}</div>}
                  {data.contactInfo.phone && <div>{data.contactInfo.phone}</div>}
                </div>
              </div>
            </>
          )}

          {/* Payment Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Ödeme Bilgisi</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Güvenli SSL şifreli ödeme</p>
              <p>• Kredi kartı ve banka kartı kabul edilir</p>
              <p>• 3D Secure doğrulaması</p>
              <p>• Ödeme sonrası anında onay</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
