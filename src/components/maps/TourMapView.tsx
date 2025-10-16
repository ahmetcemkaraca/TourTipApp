'use client';

// Tour map view component with markers and search functionality
import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from './MapComponent';
import { geolocationService } from '@/lib/geolocation-service';
import { Coordinates, MapMarker } from '@/types/location';
import { ServiceListing } from '@/lib/firestore-collections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  TrendingUp,
  Filter,
  List,
  Map as MapIcon,
  Search,
  Loader2
} from 'lucide-react';

interface TourMapViewProps {
  tours: ServiceListing[];
  onTourSelect?: (tour: ServiceListing) => void;
  onLocationChange?: (coordinates: Coordinates, radius: number) => void;
  center?: Coordinates;
  radius?: number; // in kilometers
  className?: string;
}

export default function TourMapView({
  tours = [],
  onTourSelect,
  onLocationChange,
  center = { latitude: 41.0082, longitude: 28.9784 }, // Istanbul default
  radius = 50,
  className = ''
}: TourMapViewProps) {
  const [selectedTour, setSelectedTour] = useState<ServiceListing | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [mapCenter, setMapCenter] = useState<Coordinates>(center);
  const [searchRadius, setSearchRadius] = useState(radius);
  const [isLoading, setIsLoading] = useState(false);
  const [nearbyTours, setNearbyTours] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Convert tours to map markers
   */
  const tourMarkers: MapMarker[] = tours.map(tour => ({
    id: tour.id,
    position: tour.location.coordinates,
    title: tour.title,
    type: 'tour',
    data: tour,
    icon: getTourMarkerIcon(tour.category),
    color: getTourMarkerColor(tour.pricing.basePrice)
  }));

  /**
   * Get marker icon based on tour category
   */
  function getTourMarkerIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'adventure': '🏔️',
      'cultural': '🏛️',
      'culinary': '🍽️',
      'nature': '🌿',
      'historical': '🏺',
      'entertainment': '🎭'
    };
    
    const emoji = iconMap[category] || '📍';
    
    // Convert emoji to data URL for Google Maps
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" font-size="14">${emoji}</text>
      </svg>
    `)}`;
  }

  /**
   * Get marker color based on price range
   */
  function getTourMarkerColor(price: number): string {
    if (price < 100) return '#10b981'; // green - budget
    if (price < 300) return '#f59e0b'; // yellow - mid-range
    return '#ef4444'; // red - premium
  }

  /**
   * Handle map click to search nearby tours
   */
  const handleMapClick = useCallback(async (coordinates: Coordinates) => {
    setMapCenter(coordinates);
    
    if (onLocationChange) {
      onLocationChange(coordinates, searchRadius);
    }

    await searchNearbyTours(coordinates, searchRadius);
  }, [searchRadius, onLocationChange]);

  /**
   * Handle marker click to show tour details
   */
  const handleMarkerClick = useCallback((marker: MapMarker) => {
    const tour = marker.data as ServiceListing;
    setSelectedTour(tour);
    
    if (onTourSelect) {
      onTourSelect(tour);
    }
  }, [onTourSelect]);

  /**
   * Search for nearby tours
   */
  const searchNearbyTours = async (coordinates: Coordinates, radiusKm: number) => {
    setIsLoading(true);
    
    try {
      const nearby = await geolocationService.findNearbyTours(
        coordinates,
        radiusKm,
        {
          limit: 50
        }
      );
      
      setNearbyTours(nearby);
    } catch (error) {
      console.error('Failed to search nearby tours:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get current location and search nearby
   */
  const handleCurrentLocation = async () => {
    setIsLoading(true);
    
    try {
      const location = await navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          setMapCenter(coords);
          await searchNearbyTours(coords, searchRadius);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Failed to get current location:', error);
      setIsLoading(false);
    }
  };

  /**
   * Format price for display
   */
  const formatPrice = (price: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  /**
   * Format duration for display
   */
  const formatDuration = (duration: { value: number; unit: string }) => {
    const unitLabels = {
      hours: 'saat',
      days: 'gün',
      weeks: 'hafta'
    };
    
    return `${duration.value} ${unitLabels[duration.unit as keyof typeof unitLabels]}`;
  };

  // Load nearby tours on component mount
  useEffect(() => {
    searchNearbyTours(mapCenter, searchRadius);
  }, []);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Tur Haritası
          </h2>
          <Badge variant="secondary">
            {tours.length} tur bulundu
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Search radius selector */}
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>

          {/* Current location button */}
          <Button
            onClick={handleCurrentLocation}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            Konumum
          </Button>

          {/* View mode toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <Button
              onClick={() => setViewMode('map')}
              size="sm"
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              className="rounded-r-none"
            >
              <MapIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setViewMode('list')}
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter button */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
            variant="outline"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Tümü</option>
                <option value="adventure">Macera</option>
                <option value="cultural">Kültürel</option>
                <option value="culinary">Yemek</option>
                <option value="nature">Doğa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiyat Aralığı
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Tümü</option>
                <option value="0-100">0-100 TL</option>
                <option value="100-300">100-300 TL</option>
                <option value="300+">300+ TL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Süre
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Tümü</option>
                <option value="1-4">1-4 saat</option>
                <option value="4-8">4-8 saat</option>
                <option value="1+">1+ gün</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Değerlendirme
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Tümü</option>
                <option value="4+">4+ yıldız</option>
                <option value="3+">3+ yıldız</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex">
        {/* Map view */}
        {viewMode === 'map' && (
          <div className="flex-1 relative">
            <MapComponent
              center={mapCenter}
              zoom={10}
              markers={tourMarkers}
              onMapClick={handleMapClick}
              onMarkerClick={handleMarkerClick}
              showCurrentLocation={true}
              showSearch={true}
              height="100%"
            />

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span>Turlar aranıyor...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-4">
              {tours.map((tour) => (
                <Card 
                  key={tour.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedTour(tour);
                    if (onTourSelect) onTourSelect(tour);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{tour.title}</CardTitle>
                      <Badge variant="secondary">{tour.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {tour.shortDescription}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {tour.location.city}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(tour.duration)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {tour.pricing.groupSize.max} kişi
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {tour.rating.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({tour.reviewCount} değerlendirme)
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {formatPrice(tour.pricing.basePrice, tour.pricing.currency)}
                          </div>
                          <div className="text-xs text-gray-500">
                            kişi başı
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tour details sidebar */}
        {selectedTour && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tur Detayları</h3>
                <Button
                  onClick={() => setSelectedTour(null)}
                  size="sm"
                  variant="ghost"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                {/* Tour image */}
                {selectedTour.images[0] && (
                  <img
                    src={selectedTour.images[0]}
                    alt={selectedTour.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                {/* Tour title and rating */}
                <div>
                  <h4 className="text-xl font-bold mb-2">{selectedTour.title}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{selectedTour.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-500">
                      ({selectedTour.reviewCount} değerlendirme)
                    </span>
                  </div>
                  <Badge>{selectedTour.category}</Badge>
                </div>

                {/* Description */}
                <div>
                  <h5 className="font-medium mb-2">Açıklama</h5>
                  <p className="text-sm text-gray-600">
                    {selectedTour.description}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Süre:</span>
                    <span>{formatDuration(selectedTour.duration)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Grup büyüklüğü:</span>
                    <span>
                      {selectedTour.pricing.groupSize.min}-{selectedTour.pricing.groupSize.max} kişi
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Konum:</span>
                    <span>{selectedTour.location.city}, {selectedTour.location.country}</span>
                  </div>
                </div>

                {/* Price and booking */}
                <div className="border-t pt-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(selectedTour.pricing.basePrice, selectedTour.pricing.currency)}
                    </div>
                    <div className="text-sm text-gray-500">kişi başı</div>
                  </div>
                  
                  <Button className="w-full" size="lg">
                    Rezervasyon Yap
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
