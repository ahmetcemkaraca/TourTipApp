'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Layers, 
  Crosshair, 
  Route,
  Star,
  Clock,
  Phone,
  Globe,
  Car,
  Walking,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

// Google Maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (lat: number, lng: number) => void;
  showSearch?: boolean;
  showDirections?: boolean;
  height?: string;
  className?: string;
}

interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  description?: string;
  type: 'tour' | 'restaurant' | 'hotel' | 'attraction' | 'transport' | 'user';
  rating?: number;
  price?: number;
  image?: string;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  price_level?: number;
  photos?: any[];
  opening_hours?: any;
  formatted_phone_number?: string;
  website?: string;
  types: string[];
}

// Default center (Istanbul)
const DEFAULT_CENTER = { lat: 41.0082, lng: 28.9784 };

export function GoogleMap({
  center = DEFAULT_CENTER,
  zoom = 12,
  markers = [],
  onMarkerClick,
  onMapClick,
  showSearch = true,
  showDirections = false,
  height = '400px',
  className = '',
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const searchBoxRef = useRef<any>(null);
  const directionsService = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry,directions`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsLoaded(true);
      };
      
      script.onerror = () => {
        toast.error('Google Maps yüklenemedi');
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map when loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstance.current) {
      initializeMap();
    }
  }, [isLoaded]);

  // Update markers when props change
  useEffect(() => {
    if (mapInstance.current && isLoaded) {
      updateMarkers();
    }
  }, [markers, isLoaded]);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeId: mapType,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }],
        },
      ],
      controls: true,
      streetViewControl: true,
      fullscreenControl: true,
      mapTypeControl: true,
    });

    mapInstance.current = map;

    // Initialize services
    if (showDirections) {
      directionsService.current = new window.google.maps.DirectionsService();
      directionsRenderer.current = new window.google.maps.DirectionsRenderer({
        draggable: true,
        panel: document.getElementById('directions-panel'),
      });
      directionsRenderer.current.setMap(map);
    }

    // Setup click handler
    if (onMapClick) {
      map.addListener('click', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        onMapClick(lat, lng);
      });
    }

    // Setup search box
    if (showSearch) {
      const searchInput = document.getElementById('map-search-input') as HTMLInputElement;
      if (searchInput) {
        const searchBox = new window.google.maps.places.SearchBox(searchInput);
        searchBoxRef.current = searchBox;

        map.addListener('bounds_changed', () => {
          searchBox.setBounds(map.getBounds());
        });

        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (places.length === 0) return;

          setSearchResults(places);
          
          // Focus on first result
          if (places[0]) {
            map.setCenter(places[0].geometry.location);
            map.setZoom(15);
          }
        });
      }
    }

    // Get user location
    getUserLocation();
  };

  const updateMarkers = () => {
    if (!mapInstance.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map: mapInstance.current,
        title: markerData.title,
        icon: getMarkerIcon(markerData.type),
        animation: window.google.maps.Animation.DROP,
      });

      // Info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(markerData),
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance.current, marker);
        onMarkerClick?.(markerData);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => {
        bounds.extend(marker.position);
      });
      mapInstance.current.fitBounds(bounds);
    }
  };

  const getMarkerIcon = (type: string) => {
    const iconMap = {
      tour: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="white" stroke-width="2"/>
            <path d="M16 8L18.5 13H23L19.5 16.5L21 22L16 19L11 22L12.5 16.5L9 13H13.5L16 8Z" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
      },
      restaurant: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#F97316" stroke="white" stroke-width="2"/>
            <path d="M12 8V14H14V8H16V14H18V8H20V16C20 17.1 19.1 18 18 18H14C12.9 18 12 17.1 12 16V8Z" fill="white"/>
            <rect x="14" y="20" width="4" height="4" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
      },
      hotel: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#8B5CF6" stroke="white" stroke-width="2"/>
            <rect x="10" y="12" width="12" height="8" fill="white"/>
            <rect x="12" y="14" width="3" height="2" fill="#8B5CF6"/>
            <rect x="17" y="14" width="3" height="2" fill="#8B5CF6"/>
            <rect x="14" y="18" width="4" height="2" fill="#8B5CF6"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
      },
      attraction: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#10B981" stroke="white" stroke-width="2"/>
            <circle cx="16" cy="14" r="6" fill="white"/>
            <circle cx="16" cy="14" r="3" fill="#10B981"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
      },
      transport: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#EF4444" stroke="white" stroke-width="2"/>
            <rect x="10" y="12" width="12" height="6" rx="1" fill="white"/>
            <circle cx="12" cy="20" r="1.5" fill="white"/>
            <circle cx="20" cy="20" r="1.5" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
      },
      user: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#6366F1" stroke="white" stroke-width="2"/>
            <circle cx="16" cy="13" r="4" fill="white"/>
            <path d="M8 23C8 19 11.6 16 16 16S24 19 24 23" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
      },
    };

    return iconMap[type as keyof typeof iconMap] || iconMap.attraction;
  };

  const createInfoWindowContent = (marker: MapMarker) => {
    return `
      <div style="padding: 8px; max-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${marker.title}</h3>
        ${marker.description ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${marker.description}</p>` : ''}
        ${marker.rating ? `<div style="margin: 4px 0; font-size: 12px;">⭐ ${marker.rating}</div>` : ''}
        ${marker.price ? `<div style="margin: 4px 0; font-size: 12px;">💰 ₺${marker.price}</div>` : ''}
        ${marker.address ? `<div style="margin: 4px 0; font-size: 11px; color: #888;">📍 ${marker.address}</div>` : ''}
        ${marker.phone ? `<div style="margin: 4px 0; font-size: 11px;">📞 ${marker.phone}</div>` : ''}
        ${marker.website ? `<div style="margin: 4px 0;"><a href="${marker.website}" target="_blank" style="font-size: 11px; color: #3B82F6;">🌐 Website</a></div>` : ''}
      </div>
    `;
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userPos);

          if (mapInstance.current) {
            new window.google.maps.Marker({
              position: userPos,
              map: mapInstance.current,
              title: 'Konumunuz',
              icon: getMarkerIcon('user'),
            });
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapInstance.current) {
      mapInstance.current.setCenter(userLocation);
      mapInstance.current.setZoom(15);
    } else {
      getUserLocation();
    }
  };

  const searchPlaces = async (query: string, type?: string) => {
    if (!mapInstance.current || !window.google || !query.trim()) return;

    setIsSearching(true);
    
    const service = new window.google.maps.places.PlacesService(mapInstance.current);
    const request = {
      query,
      location: mapInstance.current.getCenter(),
      radius: 5000,
      type: type || undefined,
    };

    service.textSearch(request, (results: any[], status: any) => {
      setIsSearching(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setSearchResults(results);
        
        // Add markers for search results
        results.forEach((place, index) => {
          if (index < 10) { // Limit to 10 results
            const marker = new window.google.maps.Marker({
              position: place.geometry.location,
              map: mapInstance.current,
              title: place.name,
              icon: {
                url: `https://maps.google.com/mapfiles/ms/icons/red-dot.png`,
                scaledSize: new window.google.maps.Size(32, 32),
              },
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px;">${place.name}</h3>
                  <p style="margin: 0 0 8px 0; font-size: 12px;">${place.formatted_address}</p>
                  ${place.rating ? `<div style="font-size: 12px;">⭐ ${place.rating}</div>` : ''}
                </div>
              `,
            });

            marker.addListener('click', () => {
              infoWindow.open(mapInstance.current, marker);
            });
          }
        });

        // Focus on results area
        if (results.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          results.slice(0, 10).forEach(place => {
            bounds.extend(place.geometry.location);
          });
          mapInstance.current.fitBounds(bounds);
        }
      }
    });
  };

  const calculateRoute = (origin: any, destination: any, travelMode = 'DRIVING') => {
    if (!directionsService.current || !directionsRenderer.current) return;

    const request = {
      origin,
      destination,
      travelMode: window.google.maps.TravelMode[travelMode],
      unitSystem: window.google.maps.UnitSystem.METRIC,
    };

    directionsService.current.route(request, (result: any, status: any) => {
      if (status === 'OK') {
        directionsRenderer.current.setDirections(result);
        
        const route = result.routes[0];
        const distance = route.legs[0].distance.text;
        const duration = route.legs[0].duration.text;
        
        toast.success(`Rota: ${distance}, ${duration}`);
      } else {
        toast.error('Rota hesaplanamadı');
      }
    });
  };

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardContent 
          className="flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Harita yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showSearch && (
        <CardHeader className="pb-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="map-search-input"
                placeholder="Konum, restoran, otel ara..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchPlaces(searchValue);
                  }
                }}
                className="pl-10"
              />
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={centerOnUser}
              title="Konumuma git"
            >
              <Crosshair className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                const nextType = {
                  roadmap: 'satellite',
                  satellite: 'hybrid',
                  hybrid: 'terrain',
                  terrain: 'roadmap',
                }[mapType] as typeof mapType;
                
                setMapType(nextType);
                if (mapInstance.current) {
                  mapInstance.current.setMapTypeId(nextType);
                }
              }}
              title="Harita türü"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">
                {searchResults.length} sonuç bulundu
              </p>
              <div className="flex flex-wrap gap-1">
                {searchResults.slice(0, 5).map((place, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      if (mapInstance.current) {
                        mapInstance.current.setCenter(place.geometry.location);
                        mapInstance.current.setZoom(16);
                      }
                    }}
                  >
                    {place.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          style={{ height, width: '100%' }}
          className="rounded-b-lg"
        />
        
        {showDirections && (
          <div id="directions-panel" className="p-4 max-h-32 overflow-y-auto border-t">
            <p className="text-sm text-muted-foreground">
              Rota detayları burada görünecek
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



