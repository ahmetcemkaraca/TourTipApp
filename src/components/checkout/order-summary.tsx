'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CartItem } from '@/lib/firestore-collections';
import { Calendar, Users, Clock, MapPin, Shield, Tag } from 'lucide-react';

interface OrderSummaryProps {
  cartItems: CartItem[];
}

export function OrderSummary({ cartItems }: OrderSummaryProps) {
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.pricing.basePrice, 0);
  const addOnsTotal = cartItems.reduce((sum, item) => sum + item.pricing.addOnsTotal, 0);
  const insuranceTotal = cartItems.reduce((sum, item) => sum + item.pricing.insuranceTotal, 0);
  const taxTotal = cartItems.reduce((sum, item) => sum + item.pricing.taxAmount, 0);
  const discountTotal = cartItems.reduce((sum, item) => sum + item.pricing.discountAmount, 0);
  const grandTotal = cartItems.reduce((sum, item) => sum + item.pricing.totalPrice, 0);
  
  const currency = cartItems[0]?.pricing.currency || 'TRY';

  // Format price
  const formatPrice = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="sticky top-8 space-y-4">
      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sipariş Özeti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartItems.map((item, index) => (
            <OrderItem
              key={item.id}
              item={item}
              formatPrice={formatPrice}
              formatDate={formatDate}
              showSeparator={index < cartItems.length - 1}
            />
          ))}
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ödeme Detayları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Ara Toplam ({cartItems.length} ürün)</span>
            <span>{formatPrice(subtotal, currency)}</span>
          </div>
          
          {addOnsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Ek Hizmetler</span>
              <span>{formatPrice(addOnsTotal, currency)}</span>
            </div>
          )}
          
          {insuranceTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Seyahat Sigortası</span>
              <span>{formatPrice(insuranceTotal, currency)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Vergiler ve Ücretler</span>
            <span>{formatPrice(taxTotal, currency)}</span>
          </div>
          
          {discountTotal > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>İndirim</span>
              <span>-{formatPrice(discountTotal, currency)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between font-semibold text-lg">
            <span>Toplam</span>
            <span className="text-primary">
              {formatPrice(grandTotal, currency)}
            </span>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Fiyatlar tüm vergiler dahildir</p>
            <p>• Ödeme sonrası anında rezervasyon onayı</p>
            <p>• 24 saat ücretsiz iptal hakkı</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Güvenli Ödeme</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 256-bit SSL şifrelemesi</li>
            <li>• 3D Secure teknolojisi</li>
            <li>• PCI DSS sertifikalı</li>
            <li>• Stripe güvencesi</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

interface OrderItemProps {
  item: CartItem;
  formatPrice: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
  showSeparator: boolean;
}

function OrderItem({ item, formatPrice, formatDate, showSeparator }: OrderItemProps) {
  const totalParticipants = item.participants.adults + item.participants.children;

  return (
    <div>
      <div className="flex gap-3">
        {/* Tour Image */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src="/placeholder-tour.jpg" // TODO: Get actual tour image
            alt="Tour"
            fill
            className="object-cover"
          />
          {item.status === 'reserved' && (
            <div className="absolute inset-0 bg-amber-500/80 flex items-center justify-center">
              <span className="text-xs font-medium text-white">Rezerve</span>
            </div>
          )}
        </div>

        {/* Tour Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2 mb-1">
            Tur Başlığı {/* TODO: Get actual tour title */}
          </h4>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(item.selectedDate)}</span>
              {item.timeSlot && (
                <>
                  <Clock className="h-3 w-3 ml-1" />
                  <span>{item.timeSlot}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                {totalParticipants} kişi
                {item.participants.children > 0 && (
                  <span className="text-muted-foreground">
                    ({item.participants.adults} yetişkin, {item.participants.children} çocuk)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Add-ons */}
          {item.addOns.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {item.addOns.slice(0, 2).map((addOn, index) => (
                  <Badge key={index} variant="outline" className="text-xs py-0">
                    {addOn.name}
                    {addOn.quantity > 1 && ` (×${addOn.quantity})`}
                  </Badge>
                ))}
                {item.addOns.length > 2 && (
                  <Badge variant="outline" className="text-xs py-0">
                    +{item.addOns.length - 2} daha
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Insurance */}
          {item.insurance && (
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Sigorta Dahil
              </Badge>
            </div>
          )}

          {/* Price */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">
              {totalParticipants} kişi için
            </span>
            <span className="font-semibold text-sm text-primary">
              {formatPrice(item.pricing.totalPrice, item.pricing.currency)}
            </span>
          </div>
        </div>
      </div>
      
      {showSeparator && <Separator className="mt-4" />}
    </div>
  );
}
