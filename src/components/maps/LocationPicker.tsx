'use client';

// Location picker component with search and map selection
import React, { useState, useCallback } from 'react';
import MapComponent from './MapComponent';
import { mapsService } from '@/lib/maps-service';
import { Coordinates, PlaceDetails } from '@/types/location';
import { Search, MapPin, X, Check } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (location: {
    coordinates: Coordinates;
    address: string;
    placeDetails?: PlaceDetails;
  }) => void;
  onCancel?: () => void;
  initialLocation?: Coordinates;
  className?: string;
  title?: string;
  placeholder?: string;
}

export default function LocationPicker({
  onLocationSelect,
  onCancel,
  initialLocation,
  className = '',
  title = 'Konum Seç',
  placeholder = 'Adres veya yer adı ara...'
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(
    initialLocation || null
  );
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<PlaceDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  /**
   * Handle map click to select location
   */
  const handleMapClick = useCallback(async (coordinates: Coordinates) => {
    setSelectedLocation(coordinates);
    setSelectedPlaceDetails(null);
    
    try {
      // Reverse geocode to get address
      const addresses = await mapsService.reverseGeocode(coordinates);
      const address = addresses[0] || `${coordinates.latitude}, ${coordinates.longitude}`;
      setSelectedAddress(address);
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      setSelectedAddress(`${coordinates.latitude}, ${coordinates.longitude}`);
    }
  }, []);

  /**
   * Handle place selection from search
   */
  const handlePlaceSelect = useCallback(async (place: PlaceDetails) => {
    setSelectedLocation(place.coordinates);
    setSelectedAddress(place.address);
    setSelectedPlaceDetails(place);
    setSearchQuery(place.name);
    setShowResults(false);
  }, []);

  /**
   * Search for places
   */
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const results = await mapsService.searchPlaces({
        query,
        limit: 10
      });
      
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Handle search input change
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchPlaces(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  /**
   * Confirm location selection
   */
  const handleConfirm = () => {
    if (!selectedLocation) return;

    onLocationSelect({
      coordinates: selectedLocation,
      address: selectedAddress,
      placeDetails: selectedPlaceDetails || undefined
    });
  };

  /**
   * Get current location
   */
  const handleCurrentLocation = async () => {
    try {
      const location = await mapsService.getCurrentLocation();
      await handleMapClick(location);
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm">
            {searchResults.map((place, index) => (
              <button
                key={`${place.placeId}-${index}`}
                onClick={() => handlePlaceSelect(place)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">{place.name}</div>
                    <div className="text-sm text-gray-500">{place.address}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Current Location Button */}
        <button
          onClick={handleCurrentLocation}
          className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Mevcut konumumu kullan</span>
        </button>
      </div>

      {/* Map */}
      <div className="p-4">
        <MapComponent
          center={selectedLocation || { latitude: 41.0082, longitude: 28.9784 }}
          zoom={selectedLocation ? 15 : 10}
          markers={selectedLocation ? [{
            id: 'selected',
            position: selectedLocation,
            title: 'Seçilen Konum',
            type: 'meeting_point',
            color: '#ef4444'
          }] : []}
          onMapClick={handleMapClick}
          onPlaceSelect={handlePlaceSelect}
          showCurrentLocation={true}
          height="300px"
          className="rounded-lg"
        />
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">
                Seçilen Konum
              </div>
              <div className="text-sm text-gray-600 truncate">
                {selectedAddress}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 p-4 border-t border-gray-200">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            İptal
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!selectedLocation}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="h-4 w-4" />
          Konumu Seç
        </button>
      </div>
    </div>
  );
}
