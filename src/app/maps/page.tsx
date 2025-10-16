'use client';

// Map demo page for testing Google Maps integration
import React, { useState } from 'react';
import MapComponent from '@/components/maps/MapComponent';
import LocationPicker from '@/components/maps/LocationPicker';
import TourMapView from '@/components/maps/TourMapView';
import { Coordinates, MapMarker } from '@/types/location';
import { ServiceListing } from '@/lib/firestore-collections';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Search } from 'lucide-react';

// Note: This is a demo page - real tour data would come from Firestore

export default function MapsPage() {
  const [selectedLocation, setSelectedLocation] = useState<{
    coordinates: Coordinates;
    address: string;
  } | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [markers, setMarkers] = useState<MapMarker[]>([
    {
      id: 'sultanahmet',
      position: { latitude: 41.0058, longitude: 28.9784 },
      title: 'Sultanahmet',
      type: 'poi',
      color: '#ef4444'
    },
    {
      id: 'galata',
      position: { latitude: 41.0256, longitude: 28.9744 },
      title: 'Galata Kulesi',
      type: 'poi',
      color: '#10b981'
    }
  ]);

  const handleMarkerClick = (marker: MapMarker) => {
    console.log('Clicked marker:', marker);
  };

  const handleMapClick = (coordinates: Coordinates) => {
    console.log('Clicked coordinates:', coordinates);
    
    // Add a temporary marker
    const newMarker: MapMarker = {
      id: `temp-${Date.now()}`,
      position: coordinates,
      title: 'Tıklanan Konum',
      type: 'meeting_point',
      color: '#3b82f6'
    };
    
    setMarkers(prev => [...prev, newMarker]);
  };

  const handleLocationSelect = (location: {
    coordinates: Coordinates;
    address: string;
  }) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
    
    // Add marker for selected location
    const newMarker: MapMarker = {
      id: `selected-${Date.now()}`,
      position: location.coordinates,
      title: 'Seçilen Konum',
      type: 'meeting_point',
      color: '#8b5cf6'
    };
    
    setMarkers(prev => [...prev, newMarker]);
  };

  const clearMarkers = () => {
    setMarkers([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Harita Entegrasyonu Demo</h1>
        <p className="text-gray-600">
          Google Maps API, Places API ve Firestore geo queries test sayfası
        </p>
      </div>

      <Tabs defaultValue="basic-map" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic-map">Temel Harita</TabsTrigger>
          <TabsTrigger value="location-picker">Konum Seçici</TabsTrigger>
          <TabsTrigger value="tour-map">Tur Haritası</TabsTrigger>
        </TabsList>

        {/* Basic Map Tab */}
        <TabsContent value="basic-map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Temel Harita Kullanımı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowLocationPicker(true)}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Konum Seç
                  </Button>
                  <Button
                    onClick={clearMarkers}
                    variant="outline"
                  >
                    İşaretleri Temizle
                  </Button>
                </div>

                {selectedLocation && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">Seçilen Konum:</p>
                    <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                    <p className="text-xs text-gray-500">
                      {selectedLocation.coordinates.latitude.toFixed(6)}, 
                      {selectedLocation.coordinates.longitude.toFixed(6)}
                    </p>
                  </div>
                )}

                <MapComponent
                  center={{ latitude: 41.0082, longitude: 28.9784 }}
                  zoom={12}
                  markers={markers}
                  onMapClick={handleMapClick}
                  onMarkerClick={handleMarkerClick}
                  showCurrentLocation={true}
                  showSearch={true}
                  height="500px"
                  className="rounded-lg border"
                />

                <div className="text-sm text-gray-600">
                  <p>• Haritaya tıklayarak yeni işaret ekleyebilirsiniz</p>
                  <p>• Mevcut işaretlere tıklayarak detayları görebilirsiniz</p>
                  <p>• Arama kutusunu kullanarak konum arayabilirsiniz</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Picker Tab */}
        <TabsContent value="location-picker" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Konum Seçici Bileşeni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => setShowLocationPicker(true)}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Konum Seçici Aç
                </Button>

                {selectedLocation && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Seçilen Konum</h4>
                    <p className="text-sm text-green-700">{selectedLocation.address}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Koordinatlar: {selectedLocation.coordinates.latitude.toFixed(6)}, 
                      {selectedLocation.coordinates.longitude.toFixed(6)}
                    </p>
                  </div>
                )}

                {!selectedLocation && (
                  <div className="text-center p-8 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Henüz konum seçilmedi</p>
                    <p className="text-sm">Konum seçici açarak bir konum seçin</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {showLocationPicker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="w-full max-w-4xl h-3/4 m-4">
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  onCancel={() => setShowLocationPicker(false)}
                  title="Tur Konumu Seç"
                  placeholder="Tur lokasyonu ara..."
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tour Map Tab */}
        <TabsContent value="tour-map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Tur Harita Görünümü
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <TourMapView
                  tours={[]}
                  onTourSelect={(tour) => console.log('Selected tour:', tour)}
                  onLocationChange={(coordinates, radius) => 
                    console.log('Location changed:', coordinates, radius)
                  }
                  center={{ latitude: 41.0082, longitude: 28.9784 }}
                  radius={25}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
