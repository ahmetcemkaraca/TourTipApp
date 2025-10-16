'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceListing } from '@/lib/firestore-collections';
import { useAuth } from '@/lib/auth';
import { 
  MapPin, 
  Clock, 
  Star, 
  Users, 
  Heart, 
  Share2,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface TourCardProps {
  tour: ServiceListing;
  viewMode?: 'grid' | 'list';
  showProvider?: boolean;
}

export function TourCard({ tour, viewMode = 'grid', showProvider = false }: TourCardProps) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Handle favorite toggle
  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Favorilere eklemek için giriş yapmalısınız.');
      return;
    }

    try {
      setIsFavorited(!isFavorited);
      // TODO: Implement favorite functionality with Firestore
      toast.success(
        isFavorited ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi'
      );
    } catch (error) {
      setIsFavorited(isFavorited);
      toast.error('Bir hata oluştu.');
    }
  };

  // Handle share
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/tours/${tour.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: tour.title,
          text: tour.description,
          url: url,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link kopyalandı!');
      } catch (error) {
        toast.error('Link kopyalanamadı.');
      }
    }
  };

  // Format price
  const formatPrice = (price: { amount: number; currency: string } | undefined) => {
    if (!price) return 'Fiyat bilgisi yok';
    
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: price.currency,
      minimumFractionDigits: 0,
    }).format(price.amount);
  };

  // Format duration
  const formatDuration = (duration: { value: number; unit: string } | undefined) => {
    if (!duration) return null;
    
    const unitMap = {
      hours: 'saat',
      days: 'gün',
      minutes: 'dakika',
    };
    
    return `${duration.value} ${unitMap[duration.unit as keyof typeof unitMap] || duration.unit}`;
  };

  // Get main image
  const mainImage = tour.images?.[0] || '/placeholder-tour.jpg';

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 group">
        <Link href={`/tours/${tour.id}`}>
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="relative md:w-80 h-48 md:h-auto">
              <Image
                src={imageError ? '/placeholder-tour.jpg' : mainImage}
                alt={tour.title}
                fill
                className="object-cover rounded-l-lg"
                onError={() => setImageError(true)}
              />
              
              {/* Favorite & Share buttons */}
              <div className="absolute top-3 right-3 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-white/90 hover:bg-white"
                  onClick={handleFavorite}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-white/90 hover:bg-white"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Status badges */}
              <div className="absolute top-3 left-3">
                {tour.status === 'active' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Aktif
                  </Badge>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                    {tour.title}
                  </h3>
                  {tour.location?.address && (
                    <div className="flex items-center text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{tour.location.address}</span>
                    </div>
                  )}
                </div>
                
                {/* Rating */}
                {tour.rating && (
                  <div className="flex items-center bg-primary/10 px-2 py-1 rounded">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{tour.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                {tour.description}
              </p>

              {/* Tour details */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                {formatDuration(tour.duration) && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDuration(tour.duration)}
                  </div>
                )}
                
                {tour.capacity && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Max {tour.capacity.max} kişi
                  </div>
                )}

                {tour.category && (
                  <Badge variant="outline">{tour.category}</Badge>
                )}
              </div>

              {/* Price and CTA */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(tour.price)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tour.price?.priceType === 'per person' ? 'kişi başı' : 'toplam'}
                  </div>
                </div>
                
                <Button>
                  Detayları Gör
                </Button>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group card-hover">
      <Link href={`/tours/${tour.id}`}>
        {/* Image */}
        <div className="relative aspect-[4/3]">
          <Image
            src={imageError ? '/placeholder-tour.jpg' : mainImage}
            alt={tour.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
          
          {/* Favorite & Share buttons */}
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-white/90 hover:bg-white"
              onClick={handleFavorite}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-white/90 hover:bg-white"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Category badge */}
          {tour.category && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-black/70 text-white">
                {tour.category}
              </Badge>
            </div>
          )}

          {/* Rating */}
          {tour.rating && (
            <div className="absolute bottom-3 left-3 flex items-center bg-white/90 px-2 py-1 rounded">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="font-medium text-sm">{tour.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {tour.title}
            </h3>
            {tour.location?.address && (
              <div className="flex items-center text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm line-clamp-1">{tour.location.address}</span>
              </div>
            )}
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {tour.description}
          </p>

          {/* Tour details */}
          <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
            {formatDuration(tour.duration) && (
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(tour.duration)}
              </div>
            )}
            
            {tour.capacity && (
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                Max {tour.capacity.max}
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="p-4 pt-0">
          <div className="w-full flex justify-between items-center">
            <div>
              <div className="text-lg font-bold text-primary">
                {formatPrice(tour.price)}
              </div>
              <div className="text-xs text-muted-foreground">
                {tour.price?.priceType === 'per person' ? 'kişi başı' : 'toplam'}
              </div>
            </div>
            
            <Button size="sm" className="group-hover:bg-primary/90">
              Detay
            </Button>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
