'use client';

// Shop card component for marketplace
import React from 'react';
import { Shop } from '@/lib/firestore-collections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  Truck, 
  Package,
  Shield,
  Gift
} from 'lucide-react';

interface ShopCardProps {
  shop: Shop;
  onViewProducts?: (shop: Shop) => void;
  onVisitShop?: (shop: Shop) => void;
  distance?: number; // in kilometers
  className?: string;
}

export default function ShopCard({
  shop,
  onViewProducts,
  onVisitShop,
  distance,
  className = ''
}: ShopCardProps) {
  const formatDeliveryTime = (time: number) => {
    return `${time} dk`;
  };

  const formatDeliveryFee = (fee: number) => {
    if (fee === 0) return 'Ücretsiz';
    return `${fee.toFixed(2)} TL`;
  };

  const isOpen = () => {
    // Simple check for current time vs opening hours
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todaySchedule = shop.openingHours[dayNames[currentDay] as keyof typeof shop.openingHours];
    
    if (!todaySchedule || todaySchedule.closed) {
      return false;
    }
    
    return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
  };

  const shopIsOpen = isOpen();

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {/* Shop Image */}
      <div className="relative h-48 bg-gray-200">
        {shop.images[0] ? (
          <img
            src={shop.images[0]}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={shopIsOpen ? 'default' : 'secondary'}>
            {shopIsOpen ? 'Açık' : 'Kapalı'}
          </Badge>
        </div>

        {/* Distance badge */}
        {distance && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-white">
              {distance.toFixed(1)} km
            </Badge>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-blue-500 text-white">
            {getCategoryLabel(shop.category)}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {shop.name}
            </CardTitle>
            
            {/* Subcategory */}
            {shop.subcategory && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {shop.subcategory}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {shop.description}
        </p>

        {/* Rating and reviews */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{shop.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">
              ({shop.reviewCount} değerlendirme)
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{shop.address}</span>
        </div>

        {/* Delivery info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{formatDeliveryTime(shop.estimatedDeliveryTime)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Truck className="h-4 w-4 text-gray-500" />
              <span>{formatDeliveryFee(shop.deliveryFee)}</span>
            </div>
          </div>

          {shop.minimumOrder > 0 && (
            <div className="text-xs text-gray-500">
              Min. {shop.minimumOrder} TL
            </div>
          )}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1">
          {shop.features.slice(0, 4).map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {getFeatureLabel(feature)}
            </Badge>
          ))}
          {shop.features.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{shop.features.length - 4}
            </Badge>
          )}
        </div>

        {/* Returns policy */}
        {shop.returnsPolicy && (
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{shop.returnsPolicy}</span>
          </div>
        )}

        {/* Contact info */}
        {shop.phoneNumber && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{shop.phoneNumber}</span>
          </div>
        )}

        {/* Website */}
        {shop.website && (
          <div className="text-sm">
            <a 
              href={shop.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Web sitesini ziyaret et
            </a>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewProducts?.(shop)}
          >
            Ürünleri Gör
          </Button>
          
          <Button
            className="flex-1"
            disabled={!shopIsOpen}
            onClick={() => onVisitShop?.(shop)}
          >
            {shopIsOpen ? 'Mağazayı Ziyaret Et' : 'Kapalı'}
          </Button>
        </div>

        {/* Opening hours (when closed) */}
        {!shopIsOpen && (
          <div className="text-xs text-gray-500 border-t pt-2">
            {getNextOpeningTime(shop.openingHours)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function getCategoryLabel(category: string): string {
  const categoryLabels: Record<string, string> = {
    'grocery': 'Market',
    'pharmacy': 'Eczane',
    'electronics': 'Elektronik',
    'clothing': 'Giyim',
    'home_garden': 'Ev & Bahçe',
    'books': 'Kitap',
    'sports': 'Spor',
    'beauty': 'Güzellik',
    'toys': 'Oyuncak',
    'automotive': 'Otomotiv',
    'gifts': 'Hediye',
    'other': 'Diğer'
  };
  
  return categoryLabels[category] || category;
}

function getFeatureLabel(feature: string): string {
  const featureLabels: Record<string, string> = {
    'delivery': 'Teslimat',
    'pickup': 'Teslim Al',
    'returns': 'İade',
    'gift_wrapping': 'Hediye Paketi',
    'installation': 'Kurulum',
    'warranty': 'Garanti',
    'bulk_orders': 'Toplu Sipariş',
    'same_day_delivery': 'Aynı Gün Teslimat'
  };
  
  return featureLabels[feature] || feature;
}

function getNextOpeningTime(openingHours: any): string {
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Check remaining days of the week
  for (let i = 1; i <= 7; i++) {
    const checkDay = (now.getDay() + i) % 7;
    const daySchedule = openingHours[dayNames[checkDay]];
    
    if (daySchedule && !daySchedule.closed) {
      const dayName = getDayName(checkDay);
      return `${dayName} ${daySchedule.open} saatinde açılacak`;
    }
  }
  
  return 'Açılış saati belirsiz';
}

function getDayName(day: number): string {
  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return dayNames[day];
}
