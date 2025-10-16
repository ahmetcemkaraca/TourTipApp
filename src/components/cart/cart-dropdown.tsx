'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from './cart-provider';
import { CartItem } from '@/lib/firestore-collections';
import { Trash2, Calendar, Users, Clock, MapPin } from 'lucide-react';

interface CartDropdownProps {
  onClose: () => void;
}

export function CartDropdown({ onClose }: CartDropdownProps) {
  const { cartItems, removeFromCart } = useCart();

  // Format price
  const formatPrice = (amount: number, currency: string) => {
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
    });
  };

  // Handle remove item
  const handleRemoveItem = async (cartItemId: string) => {
    await removeFromCart(cartItemId);
  };

  return (
    <ScrollArea className="max-h-80">
      <div className="space-y-3 p-2">
        {cartItems.map((item) => (
          <CartItemCard 
            key={item.id} 
            item={item} 
            onRemove={handleRemoveItem}
            formatPrice={formatPrice}
            formatDate={formatDate}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onRemove: (cartItemId: string) => void;
  formatPrice: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
}

function CartItemCard({ item, onRemove, formatPrice, formatDate }: CartItemCardProps) {
  const totalParticipants = item.participants.adults + item.participants.children;

  return (
    <div className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Tour Image */}
      <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
        <Image
          src="/placeholder-tour.jpg" // TODO: Get actual tour image from service
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
        <h4 className="font-medium text-sm line-clamp-1 mb-1">
          Tur Başlığı {/* TODO: Get actual tour title from service */}
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

          {/* Add-ons */}
          {item.addOns.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.addOns.slice(0, 2).map((addOn, index) => (
                <Badge key={index} variant="outline" className="text-xs py-0">
                  {addOn.name}
                </Badge>
              ))}
              {item.addOns.length > 2 && (
                <Badge variant="outline" className="text-xs py-0">
                  +{item.addOns.length - 2} daha
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold text-sm text-primary">
            {formatPrice(item.pricing.totalPrice, item.pricing.currency)}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Expiry warning */}
        {item.expiresAt && new Date(item.expiresAt).getTime() - Date.now() < 2 * 60 * 60 * 1000 && (
          <div className="mt-1">
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
              {getTimeUntilExpiry(item.expiresAt)} kaldı
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to calculate time until expiry
function getTimeUntilExpiry(expiresAt: Date): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return 'Süresi doldu';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}s ${minutes}dk`;
  } else {
    return `${minutes}dk`;
  }
}
