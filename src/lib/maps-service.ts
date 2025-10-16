// Google Maps integration service for TourTrip.app
import { Loader } from '@googlemaps/js-api-loader';
import { Coordinates, PlaceDetails, RouteInfo, LocationSearchParams, MapOptions, MapMarker } from '@/types/location';

class MapsService {
  private loader: Loader;
  private isLoaded = false;
  private googleMaps: typeof google.maps | null = null;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key is required');
    }

    this.loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry', 'drawing']
    });
  }

  /**
   * Initialize Google Maps API
   */
  async initialize(): Promise<typeof google.maps> {
    if (this.isLoaded && this.googleMaps) {
      return this.googleMaps;
    }

    try {
      this.googleMaps = await this.loader.load();
      this.isLoaded = true;
      return this.googleMaps;
    } catch (error) {
      console.error('Failed to load Google Maps API:', error);
      throw error;
    }
  }

  /**
   * Create a new map instance
   */
  async createMap(element: HTMLElement, options: MapOptions): Promise<google.maps.Map> {
    await this.initialize();
    
    const mapOptions: google.maps.MapOptions = {
      center: { lat: options.center.latitude, lng: options.center.longitude },
      zoom: options.zoom,
      mapTypeId: options.mapTypeId || 'roadmap',
      disableDefaultUI: options.disableDefaultUI || false,
      zoomControl: options.zoomControl !== false,
      mapTypeControl: options.mapTypeControl !== false,
      scaleControl: options.scaleControl !== false,
      streetViewControl: options.streetViewControl !== false,
      rotateControl: options.rotateControl !== false,
      fullscreenControl: options.fullscreenControl !== false,
      gestureHandling: options.gestureHandling || 'auto',
      clickableIcons: options.clickableIcons !== false,
      styles: options.styles
    };

    return new google.maps.Map(element, mapOptions);
  }

  /**
   * Add markers to the map
   */
  async addMarkers(map: google.maps.Map, markers: MapMarker[]): Promise<google.maps.Marker[]> {
    await this.initialize();
    
    return markers.map(markerData => {
      const marker = new google.maps.Marker({
        position: { lat: markerData.position.latitude, lng: markerData.position.longitude },
        map,
        title: markerData.title,
        clickable: markerData.clickable !== false,
        draggable: markerData.draggable || false,
        visible: markerData.visible !== false,
        zIndex: markerData.zIndex || 0,
        icon: markerData.icon ? {
          url: markerData.icon,
          scaledSize: new google.maps.Size(32, 32)
        } : undefined
      });

      // Store custom data
      if (markerData.data) {
        (marker as any).customData = markerData.data;
      }

      return marker;
    });
  }

  /**
   * Search for places using Google Places API
   */
  async searchPlaces(params: LocationSearchParams): Promise<PlaceDetails[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const request: google.maps.places.TextSearchRequest = {
        query: params.query || '',
        bounds: params.bounds ? new google.maps.LatLngBounds(
          { lat: params.bounds.south, lng: params.bounds.west },
          { lat: params.bounds.north, lng: params.bounds.east }
        ) : undefined,
        location: params.center ? { lat: params.center.latitude, lng: params.center.longitude } : undefined,
        radius: params.radius ? params.radius * 1000 : undefined, // Convert km to meters
        type: params.types?.[0] as any
      };

      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const places = results.slice(0, params.limit || 20).map(place => this.convertToPlaceDetails(place));
          resolve(places);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: [
          'place_id', 'name', 'geometry', 'formatted_address', 
          'formatted_phone_number', 'website', 'rating', 'price_level',
          'photos', 'reviews', 'opening_hours', 'types'
        ]
      };

      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(this.convertToPlaceDetails(place));
        } else {
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    });
  }

  /**
   * Calculate route between locations
   */
  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[],
    travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
  ): Promise<RouteInfo> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const directionsService = new google.maps.DirectionsService();
      
      const request: google.maps.DirectionsRequest = {
        origin: { lat: origin.latitude, lng: origin.longitude },
        destination: { lat: destination.latitude, lng: destination.longitude },
        waypoints: waypoints?.map(wp => ({
          location: { lat: wp.latitude, lng: wp.longitude },
          stopover: true
        })),
        travelMode,
        optimizeWaypoints: true,
        avoidHighways: false,
        avoidTolls: false
      };

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0];
          const leg = route.legs[0];
          
          resolve({
            distance: leg.distance?.value || 0,
            duration: leg.duration?.value || 0,
            polyline: route.overview_polyline,
            steps: leg.steps.map(step => ({
              distance: step.distance?.value || 0,
              duration: step.duration?.value || 0,
              startLocation: {
                latitude: step.start_location.lat(),
                longitude: step.start_location.lng()
              },
              endLocation: {
                latitude: step.end_location.lat(),
                longitude: step.end_location.lng()
              },
              htmlInstructions: step.instructions,
              travelMode: step.travel_mode as any
            })),
            warnings: route.warnings
          });
        } else {
          reject(new Error(`Route calculation failed: ${status}`));
        }
      });
    });
  }

  /**
   * Calculate distance between two points
   */
  async calculateDistance(point1: Coordinates, point2: Coordinates): Promise<number> {
    await this.initialize();
    
    const latLng1 = new google.maps.LatLng(point1.latitude, point1.longitude);
    const latLng2 = new google.maps.LatLng(point2.latitude, point2.longitude);
    
    return google.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2);
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<Coordinates[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          const coordinates = results.map(result => ({
            latitude: result.geometry.location.lat(),
            longitude: result.geometry.location.lng()
          }));
          resolve(coordinates);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(coordinates: Coordinates): Promise<string[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      const latLng = { lat: coordinates.latitude, lng: coordinates.longitude };
      
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          const addresses = results.map(result => result.formatted_address);
          resolve(addresses);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Get user's current location
   */
  async getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Watch user's location changes
   */
  watchLocation(
    onLocationUpdate: (coordinates: Coordinates) => void,
    onError: (error: GeolocationPositionError) => void
  ): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onLocationUpdate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      onError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );
  }

  /**
   * Stop watching location
   */
  clearLocationWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }

  /**
   * Convert Google Places result to our PlaceDetails format
   */
  private convertToPlaceDetails(place: google.maps.places.PlaceResult): PlaceDetails {
    return {
      placeId: place.place_id || '',
      name: place.name || '',
      coordinates: {
        latitude: place.geometry?.location?.lat() || 0,
        longitude: place.geometry?.location?.lng() || 0
      },
      address: place.formatted_address || '',
      phoneNumber: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      priceLevel: place.price_level,
      photos: place.photos?.map(photo => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
        htmlAttributions: photo.html_attributions
      })),
      reviews: place.reviews?.map(review => ({
        authorName: review.author_name,
        authorUrl: review.author_url,
        language: review.language,
        profilePhotoUrl: review.profile_photo_url,
        rating: review.rating,
        relativeTimeDescription: review.relative_time_description,
        text: review.text,
        time: review.time
      })),
      openingHours: place.opening_hours?.weekday_text,
      types: place.types || []
    };
  }
}

// Export singleton instance
export const mapsService = new MapsService();
