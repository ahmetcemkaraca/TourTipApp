'use client';

// Restaurant card component for marketplace
import React from 'react';
import { Restaurant } from '@/lib/firestore-collections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  Truck, 
  DollarSign,
  Users,
  Utensils
} from 'lucide-react';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onViewMenu?: (restaurant: Restaurant) => void;
  onOrderNow?: (restaurant: Restaurant) => void;
  distance?: number; // in kilometers
  className?: string;
}

export default function RestaurantCard({
  restaurant,
  onViewMenu,
  onOrderNow,
  distance,
  className = ''
}: RestaurantCardProps) {
  const formatPrice = (priceRange: number) => {
    return '$'.repeat(priceRange);
  };

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
    const todaySchedule = restaurant.openingHours[dayNames[currentDay] as keyof typeof restaurant.openingHours];
    
    if (!todaySchedule || todaySchedule.closed) {
      return false;
    }
    
    return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
  };

  const restaurantIsOpen = isOpen();

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {/* Restaurant Image */}
      <div className="relative h-48 bg-gray-200">
        {restaurant.images[0] ? (
          <img
            src={restaurant.images[0]}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Utensils className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={restaurantIsOpen ? 'default' : 'secondary'}>
            {restaurantIsOpen ? 'Açık' : 'Kapalı'}
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

        {/* Featured badge */}
        {restaurant.featured && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-orange-500 text-white">
              Öne Çıkan
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {restaurant.name}
            </CardTitle>
            
            {/* Cuisine types */}
            <div className="flex flex-wrap gap-1 mt-1">
              {restaurant.cuisine.slice(0, 3).map((cuisine, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {cuisine}
                </Badge>
              ))}
              {restaurant.cuisine.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{restaurant.cuisine.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* Price range */}
          <div className="flex items-center gap-1 text-green-600">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">{formatPrice(restaurant.priceRange)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {restaurant.description}
        </p>

        {/* Rating and reviews */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{restaurant.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">
              ({restaurant.reviewCount} değerlendirme)
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{restaurant.address}</span>
        </div>

        {/* Delivery info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{formatDeliveryTime(restaurant.estimatedDeliveryTime)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Truck className="h-4 w-4 text-gray-500" />
              <span>{formatDeliveryFee(restaurant.deliveryFee)}</span>
            </div>
          </div>

          {restaurant.minimumOrder > 0 && (
            <div className="text-xs text-gray-500">
              Min. {restaurant.minimumOrder} TL
            </div>
          )}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1">
          {restaurant.features.slice(0, 4).map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {getFeatureLabel(feature)}
            </Badge>
          ))}
          {restaurant.features.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{restaurant.features.length - 4}
            </Badge>
          )}
        </div>

        {/* Contact info */}
        {restaurant.phoneNumber && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{restaurant.phoneNumber}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewMenu?.(restaurant)}
          >
            Menüyü Gör
          </Button>
          
          <Button
            className="flex-1"
            disabled={!restaurantIsOpen}
            onClick={() => onOrderNow?.(restaurant)}
          >
            {restaurantIsOpen ? 'Sipariş Ver' : 'Kapalı'}
          </Button>
        </div>

        {/* Opening hours (expandable) */}
        {!restaurantIsOpen && (
          <div className="text-xs text-gray-500 border-t pt-2">
            {getNextOpeningTime(restaurant.openingHours)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function getFeatureLabel(feature: string): string {
  const featureLabels: Record<string, string> = {
    'delivery': 'Teslimat',
    'takeout': 'Paket',
    'dine_in': 'Oturma',
    'reservations': 'Rezervasyon',
    'parking': 'Otopark',
    'wifi': 'WiFi',
    'outdoor_seating': 'Dış Mekan',
    'kid_friendly': 'Çocuk Dostu',
    'pet_friendly': 'Evcil Hayvan',
    'wheelchair_accessible': 'Erişilebilir',
    'live_music': 'Canlı Müzik',
    'bar': 'Bar',
    'catering': 'Catering'
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
