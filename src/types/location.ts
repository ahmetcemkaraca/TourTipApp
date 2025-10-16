// Location and mapping related types for TourTrip.app
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  id: string;
  name: string;
  coordinates: Coordinates;
  country: string;
  region: string;
  timezone: string;
  weatherApiEndpoint?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface POI {
  id: string;
  locationId: string;
  name: string;
  type: 'historical' | 'natural' | 'cultural' | 'adventure' | 'culinary';
  coordinates: Coordinates;
  description: string;
  accessibilityInfo: AccessibilityInfo;
  operatingHours?: OperatingHours;
  rating?: number;
  reviewCount?: number;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  hasElevator?: boolean;
  hasAccessibleParking?: boolean;
  hasAccessibleRestroom?: boolean;
  visualAidSupport?: boolean;
  hearingAidSupport?: boolean;
  notes?: string;
}

export interface OperatingHours {
  monday?: TimeSlot;
  tuesday?: TimeSlot;
  wednesday?: TimeSlot;
  thursday?: TimeSlot;
  friday?: TimeSlot;
  saturday?: TimeSlot;
  sunday?: TimeSlot;
  holidays?: { date: string; closed: boolean; hours?: TimeSlot }[];
}

export interface TimeSlot {
  open: string; // HH:mm format
  close: string; // HH:mm format
  closed?: boolean;
}

export interface TourLocation {
  id: string;
  tourId: string;
  locationId: string;
  poiId?: string;
  order: number; // Order in the tour itinerary
  duration: number; // Duration in minutes
  type: 'start' | 'waypoint' | 'destination' | 'accommodation' | 'meal' | 'activity';
  description?: string;
  meetingPoint?: Coordinates;
  instructions?: string;
  estimatedArrivalTime?: Date;
  estimatedDepartureTime?: Date;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeofireDocument {
  coordinates: Coordinates;
  geohash: string;
}

export interface LocationSearchParams {
  query?: string;
  bounds?: MapBounds;
  radius?: number; // in kilometers
  center?: Coordinates;
  types?: string[];
  country?: string;
  limit?: number;
  offset?: number;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  coordinates: Coordinates;
  address: string;
  phoneNumber?: string;
  website?: string;
  rating?: number;
  priceLevel?: number;
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  openingHours?: string[];
  types: string[];
}

export interface PlacePhoto {
  photoReference: string;
  width: number;
  height: number;
  htmlAttributions: string[];
}

export interface PlaceReview {
  authorName: string;
  authorUrl?: string;
  language: string;
  profilePhotoUrl?: string;
  rating: number;
  relativeTimeDescription: string;
  text: string;
  time: number;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string;
  steps: RouteStep[];
  warnings?: string[];
}

export interface RouteStep {
  distance: number;
  duration: number;
  startLocation: Coordinates;
  endLocation: Coordinates;
  htmlInstructions: string;
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
}

export interface MapMarker {
  id: string;
  position: Coordinates;
  title: string;
  type: 'tour' | 'poi' | 'meeting_point' | 'emergency' | 'restaurant' | 'accommodation';
  icon?: string;
  color?: string;
  clickable?: boolean;
  draggable?: boolean;
  visible?: boolean;
  zIndex?: number;
  data?: any;
}

export interface MapOptions {
  center: Coordinates;
  zoom: number;
  mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  disableDefaultUI?: boolean;
  zoomControl?: boolean;
  mapTypeControl?: boolean;
  scaleControl?: boolean;
  streetViewControl?: boolean;
  rotateControl?: boolean;
  fullscreenControl?: boolean;
  gestureHandling?: 'cooperative' | 'greedy' | 'none' | 'auto';
  clickableIcons?: boolean;
  styles?: google.maps.MapTypeStyle[];
}
