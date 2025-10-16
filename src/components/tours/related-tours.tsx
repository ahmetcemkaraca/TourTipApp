'use client';

import { useState, useEffect } from 'react';
import { TourCard } from './tour-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tourService } from '@/lib/firestore-service';
import { ServiceListing } from '@/lib/firestore-collections';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface RelatedToursProps {
  category?: string;
  currentTourId: string;
}

export function RelatedTours({ category, currentTourId }: RelatedToursProps) {
  const [tours, setTours] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleTours = 4; // Number of tours visible at once

  useEffect(() => {
    const loadRelatedTours = async () => {
      try {
        setLoading(true);
        
        let relatedTours: ServiceListing[] = [];
        
        // First try to get tours from the same category
        if (category) {
          relatedTours = await tourService.getToursByCategory(category, 12);
        }
        
        // If not enough tours from same category, get popular tours
        if (relatedTours.length < 8) {
          const popularTours = await tourService.getFeaturedTours(12);
          relatedTours = [...relatedTours, ...popularTours];
        }
        
        // Remove current tour and duplicates
        const uniqueTours = relatedTours
          .filter((tour, index, arr) => 
            tour.id !== currentTourId && 
            arr.findIndex(t => t.id === tour.id) === index
          )
          .slice(0, 8); // Limit to 8 tours
        
        setTours(uniqueTours);
      } catch (error) {
        console.error('Error loading related tours:', error);
        
        // Fallback to mock data if service fails
        // TODO: Load related tours from Firestore
        const tours: ServiceListing[] = [
          {
            id: 'mock-1',
            providerId: 'provider-1',
            title: 'İstanbul Boğaz Turu',
            description: 'Boğaz manzarası eşliğinde unutulmaz bir gezi.',
            category: category || 'şehir',
            images: ['/placeholder-tour.jpg'],
            price: { amount: 299, currency: 'TRY', priceType: 'per person' },
            duration: { value: 3, unit: 'hours' },
            capacity: { max: 20 },
            rating: 4.6,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'mock-2',
            providerId: 'provider-2',
            title: 'Pamukkale Gün Turu',
            description: 'Beyaz cennet Pamukkale\'yi keşfedin.',
            category: category || 'doğa',
            images: ['/placeholder-tour.jpg'],
            price: { amount: 449, currency: 'TRY', priceType: 'per person' },
            duration: { value: 8, unit: 'hours' },
            capacity: { max: 30 },
            rating: 4.8,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'mock-3',
            providerId: 'provider-3',
            title: 'Efes Antik Kenti',
            description: 'Antik dönemin izlerini takip edin.',
            category: category || 'kültür',
            images: ['/placeholder-tour.jpg'],
            price: { amount: 199, currency: 'TRY', priceType: 'per person' },
            duration: { value: 4, unit: 'hours' },
            capacity: { max: 25 },
            rating: 4.4,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'mock-4',
            providerId: 'provider-4',
            title: 'Bodrum Tekne Turu',
            description: 'Mavi yolculukta keyifli anlar.',
            category: category || 'deniz',
            images: ['/placeholder-tour.jpg'],
            price: { amount: 399, currency: 'TRY', priceType: 'per person' },
            duration: { value: 6, unit: 'hours' },
            capacity: { max: 15 },
            rating: 4.7,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'mock-5',
            providerId: 'provider-5',
            title: 'Antalya Şelale Turu',
            description: 'Doğanın büyüleyici güzelliği.',
            category: category || 'doğa',
            images: ['/placeholder-tour.jpg'],
            price: { amount: 149, currency: 'TRY', priceType: 'per person' },
            duration: { value: 5, unit: 'hours' },
            capacity: { max: 12 },
            rating: 4.3,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        
        // TODO: Load from Firestore
        setTours([]);
      } finally {
        setLoading(false);
      }
    };

    loadRelatedTours();
  }, [category, currentTourId]);

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + visibleTours >= tours.length ? 0 : prev + visibleTours
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, tours.length - visibleTours) : Math.max(0, prev - visibleTours)
    );
  };

  const canGoNext = currentIndex + visibleTours < tours.length;
  const canGoPrev = currentIndex > 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>İlgili Turlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[4/3] bg-muted rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tours.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {category ? `${category} Kategorisinden Diğer Turlar` : 'İlgili Turlar'}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              disabled={!canGoPrev}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              disabled={!canGoNext}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* View All Button */}
            <Button variant="ghost" size="sm" asChild>
              <a href={`/tours${category ? `?category=${category}` : ''}`}>
                Tümü
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-300 ease-in-out gap-6"
            style={{
              transform: `translateX(-${(currentIndex * 100) / visibleTours}%)`,
              width: `${(tours.length * 100) / visibleTours}%`
            }}
          >
            {tours.map((tour) => (
              <div 
                key={tour.id} 
                className="flex-shrink-0"
                style={{ width: `${100 / tours.length}%` }}
              >
                <TourCard tour={tour} viewMode="grid" />
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        {tours.length > visibleTours && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ 
              length: Math.ceil(tours.length / visibleTours) 
            }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * visibleTours)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(currentIndex / visibleTours) === index
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
