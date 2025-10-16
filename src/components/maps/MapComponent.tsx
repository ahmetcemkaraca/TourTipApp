'use client';

// Interactive map component for TourTrip.app using Google Maps
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { mapsService } from '@/lib/maps-service';
import { Coordinates, MapOptions, MapMarker, PlaceDetails } from '@/types/location';
import { Loader, AlertCircle, MapPin, Navigation } from 'lucide-react';

interface MapComponentProps {
  center?: Coordinates;
  zoom?: number;
  markers?: MapMarker[];
  options?: Partial<MapOptions>;
  onMapClick?: (coordinates: Coordinates) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  onPlaceSelect?: (place: PlaceDetails) => void;
  showCurrentLocation?: boolean;
  showSearch?: boolean;
  className?: string;
  height?: string;
}

export default function MapComponent({
  center = { latitude: 41.0082, longitude: 28.9784 }, // Istanbul default
  zoom = 10,
  markers = [],
  options = {},
  onMapClick,
  onMarkerClick,
  onPlaceSelect,
  showCurrentLocation = true,
  showSearch = false,
  className = '',
  height = '400px'
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Initialize the map
   */
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const mapOptions: MapOptions = {
        center,
        zoom,
        gestureHandling: 'auto',
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        ...options
      };

      const map = await mapsService.createMap(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      // Add click listener
      if (onMapClick) {
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            onMapClick({
              latitude: event.latLng.lat(),
              longitude: event.latLng.lng()
            });
          }
        });
      }

      // Initialize search box if enabled
      if (showSearch) {
        await initializeSearchBox(map);
      }

      // Get current location if enabled
      if (showCurrentLocation) {
        await getCurrentLocation();
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError(err instanceof Error ? err.message : 'Harita yüklenemedi');
      setIsLoading(false);
    }
  }, [center, zoom, options, onMapClick, showCurrentLocation, showSearch]);

  /**
   * Initialize search box
   */
  const initializeSearchBox = async (map: google.maps.Map) => {
    try {
      await mapsService.initialize();
      const input = document.getElementById('map-search-input') as HTMLInputElement;
      
      if (input) {
        const searchBox = new google.maps.places.SearchBox(input);
        searchBoxRef.current = searchBox;

        // Bias search results to current map viewport
        map.addListener('bounds_changed', () => {
          searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
        });

        // Handle place selection
        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          
          if (places && places.length > 0) {
            const place = places[0];
            
            if (place.geometry?.location) {
              const location = {
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
              };

              // Center map on selected place
              map.setCenter(location);
              map.setZoom(15);

              // Trigger callback if provided
              if (onPlaceSelect) {
                onPlaceSelect({
                  placeId: place.place_id || '',
                  name: place.name || '',
                  coordinates: location,
                  address: place.formatted_address || '',
                  types: place.types || []
                });
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize search box:', error);
    }
  };

  /**
   * Get user's current location
   */
  const getCurrentLocation = async () => {
    try {
      const location = await mapsService.getCurrentLocation();
      setCurrentLocation(location);
      
      if (mapInstanceRef.current) {
        // Add current location marker
        const marker = new google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map: mapInstanceRef.current,
          title: 'Mevcut Konumunuz',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="#ffffff" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="#ffffff"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
          }
        });
        
        currentLocationMarkerRef.current = marker;
      }
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  /**
   * Update markers on the map
   */
  const updateMarkers = useCallback(async () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    if (markers.length > 0) {
      try {
        const newMarkers = await mapsService.addMarkers(mapInstanceRef.current, markers);
        
        // Add click listeners
        newMarkers.forEach((marker, index) => {
          marker.addListener('click', () => {
            if (onMarkerClick) {
              onMarkerClick(markers[index]);
            }
          });
        });
        
        markersRef.current = newMarkers;
      } catch (error) {
        console.error('Failed to add markers:', error);
      }
    }
  }, [markers, onMarkerClick]);

  /**
   * Center map on current location
   */
  const centerOnCurrentLocation = () => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude
      });
      mapInstanceRef.current.setZoom(15);
    }
  };

  // Initialize map on mount
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Update markers when markers prop changes
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
      }
    };
  }, []);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-2" />
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-center">
            <Loader className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-gray-600">Harita yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Search box */}
      {showSearch && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="map-search-input"
                type="text"
                placeholder="Konum ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {showCurrentLocation && currentLocation && (
              <button
                onClick={centerOnCurrentLocation}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Mevcut konumuma git"
              >
                <Navigation className="h-4 w-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: height }}
      />

      {/* Map controls */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="flex flex-col gap-2">
          {showCurrentLocation && (
            <button
              onClick={getCurrentLocation}
              className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="Konumu yenile"
            >
              <Navigation className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
