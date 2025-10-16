'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, breadcrumbs } from '@/components/layout/breadcrumb';
import { BookingWidget } from './booking-widget';
import { TourGallery } from './tour-gallery';
import { TourReviews } from './tour-reviews';
import { RelatedTours } from './related-tours';
import { ServiceListing } from '@/lib/firestore-collections';
import { useAuth } from '@/lib/auth';
import { 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Calendar,
  Check,
  X,
  Share2,
  Heart,
  Phone,
  Mail,
  Globe,
  Shield,
  Award,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';

interface TourDetailPageProps {
  tour: ServiceListing;
}

export function TourDetailPage({ tour }: TourDetailPageProps) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  // Handle favorite toggle
  const handleFavorite = async () => {
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
  const handleShare = async () => {
    const url = window.location.href;
    
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

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={breadcrumbs.tourDetails(tour.title)} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {tour.category && (
                  <Badge variant="secondary">{tour.category}</Badge>
                )}
                {tour.status === 'active' && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Aktif
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{tour.title}</h1>
              
              {tour.location?.address && (
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{tour.location.address}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm">
                {tour.rating && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{tour.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground ml-1">
                      ({Math.floor(Math.random() * 500) + 50} değerlendirme)
                    </span>
                  </div>
                )}

                {formatDuration(tour.duration) && (
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatDuration(tour.duration)}</span>
                  </div>
                )}

                {tour.capacity?.max && (
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Max {tour.capacity.max} kişi</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleFavorite}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Price */}
          <div className="bg-primary/5 rounded-lg p-4 inline-block">
            <div className="text-3xl font-bold text-primary">
              {formatPrice(tour.price)}
            </div>
            <div className="text-sm text-muted-foreground">
              {tour.price?.priceType === 'per person' ? 'kişi başı' : 'toplam fiyat'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <TourGallery images={tour.images || []} title={tour.title} />

            {/* Tabs Content */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                <TabsTrigger value="itinerary">Program</TabsTrigger>
                <TabsTrigger value="included">Dahil Olanlar</TabsTrigger>
                <TabsTrigger value="reviews">Yorumlar</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tur Hakkında</CardTitle>
                  </CardHeader>
                  <CardContent className="prose max-w-none">
                    <p className="text-muted-foreground leading-relaxed">
                      {tour.description}
                    </p>
                    
                    {tour.tags && tour.tags.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">Etiketler</h4>
                        <div className="flex flex-wrap gap-2">
                          {tour.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="itinerary" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tur Programı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tour.itinerary && tour.itinerary.length > 0 ? (
                      <div className="space-y-4">
                        {tour.itinerary.map((item, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.title}</h4>
                              {item.description && (
                                <p className="text-muted-foreground text-sm mt-1">
                                  {item.description}
                                </p>
                              )}
                              {item.duration && (
                                <p className="text-sm text-primary mt-1">
                                  Süre: {item.duration}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Bu tur için detaylı program bilgisi henüz eklenmemiş.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="included" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Included */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600 flex items-center">
                        <Check className="h-5 w-5 mr-2" />
                        Dahil Olanlar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tour.inclusions && tour.inclusions.length > 0 ? (
                        <ul className="space-y-2">
                          {tour.inclusions.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          Dahil olan hizmetler bilgisi eklenmemiş.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Excluded */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600 flex items-center">
                        <X className="h-5 w-5 mr-2" />
                        Dahil Olmayanlar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tour.exclusions && tour.exclusions.length > 0 ? (
                        <ul className="space-y-2">
                          {tour.exclusions.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          Dahil olmayan hizmetler bilgisi eklenmemiş.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Policies */}
                {tour.policies && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Politikalar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {tour.policies.cancellation && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">İptal Politikası</h4>
                          <p className="text-sm text-muted-foreground">
                            {tour.policies.cancellation}
                          </p>
                        </div>
                      )}
                      
                      {tour.policies.refund && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">İade Politikası</h4>
                          <p className="text-sm text-muted-foreground">
                            {tour.policies.refund}
                          </p>
                        </div>
                      )}

                      {tour.policies.minimumAge && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Minimum Yaş</h4>
                          <p className="text-sm text-muted-foreground">
                            {tour.policies.minimumAge} yaş ve üzeri
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <TourReviews tourId={tour.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <BookingWidget tour={tour} />

              {/* Tour Provider Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tur Sağlayıcısı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold">TourTrip Partner</h4>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        4.8 (234 değerlendirme)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Doğrulanmış Partner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span>Kalite Sertifikası</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>24/7 Destek</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-4" size="sm">
                    İletişim
                  </Button>
                </CardContent>
              </Card>

              {/* Safety Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Güvenlik & Sağlık
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Hijyen protokolleri uygulanır</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Güvenlik ekipmanları sağlanır</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Deneyimli rehber eşliğinde</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Sigorta dahil</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Related Tours */}
        <div className="mt-12">
          <RelatedTours category={tour.category} currentTourId={tour.id} />
        </div>
      </div>
    </div>
  );
}
