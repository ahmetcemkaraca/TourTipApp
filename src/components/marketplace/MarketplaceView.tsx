'use client';

// Main marketplace view component
import React, { useState, useEffect, useCallback } from 'react';
import { marketplaceService } from '@/lib/marketplace-service';
import { Restaurant, Shop } from '@/lib/firestore-collections';
import { MarketplaceSearchParams } from '@/types/marketplace';
import { Coordinates } from '@/types/location';
import RestaurantCard from './RestaurantCard';
import ShopCard from './ShopCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Star, 
  DollarSign,
  Grid3X3,
  List,
  Loader2,
  TrendingUp
} from 'lucide-react';

interface MarketplaceViewProps {
  userLocation?: Coordinates;
  className?: string;
}

export default function MarketplaceView({
  userLocation,
  className = ''
}: MarketplaceViewProps) {
  const [searchParams, setSearchParams] = useState<MarketplaceSearchParams>({
    type: 'all',
    query: '',
    location: userLocation,
    radius: 10,
    sortBy: 'distance',
    limit: 20
  });

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'restaurants' | 'shops'>('all');

  /**
   * Search marketplace based on current parameters
   */
  const searchMarketplace = useCallback(async () => {
    setIsLoading(true);
    
    try {
      if (searchParams.type === 'restaurant' || searchParams.type === 'all') {
        const restaurantResults = await marketplaceService.searchMarketplace({
          ...searchParams,
          type: 'restaurant'
        });
        setRestaurants(restaurantResults as Restaurant[]);
      }

      if (searchParams.type === 'shop' || searchParams.type === 'all') {
        const shopResults = await marketplaceService.searchMarketplace({
          ...searchParams,
          type: 'shop'
        });
        setShops(shopResults as Shop[]);
      }
    } catch (error) {
      console.error('Error searching marketplace:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  /**
   * Handle search input change
   */
  const handleSearchChange = (query: string) => {
    setSearchParams(prev => ({ ...prev, query }));
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (filters: Partial<MarketplaceSearchParams>) => {
    setSearchParams(prev => ({ ...prev, ...filters }));
  };

  /**
   * Handle tab change
   */
  const handleTabChange = (tab: 'all' | 'restaurants' | 'shops') => {
    setActiveTab(tab);
    const type = tab === 'all' ? 'all' : tab === 'restaurants' ? 'restaurant' : 'shop';
    setSearchParams(prev => ({ ...prev, type }));
  };

  /**
   * Get current location
   */
  const getCurrentLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      setSearchParams(prev => ({ ...prev, location }));
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Search when parameters change
  useEffect(() => {
    if (searchParams.location) {
      searchMarketplace();
    }
  }, [searchMarketplace]);

  // Initial search
  useEffect(() => {
    if (!searchParams.location && userLocation) {
      setSearchParams(prev => ({ ...prev, location: userLocation }));
    } else if (searchParams.location) {
      searchMarketplace();
    }
  }, [userLocation]);

  const totalResults = restaurants.length + shops.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-gray-600">
            Yakınındaki restoranlar ve mağazaları keşfet
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <Button
              onClick={() => setViewMode('grid')}
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
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
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Restoran veya mağaza ara..."
                  value={searchParams.query}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtreler
              </Button>

              <Button
                onClick={getCurrentLocation}
                variant="outline"
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Konumum
              </Button>
            </div>

            {/* Filters panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {/* Radius filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mesafe
                  </label>
                  <select
                    value={searchParams.radius}
                    onChange={(e) => handleFilterChange({ radius: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                  </select>
                </div>

                {/* Rating filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Puan
                  </label>
                  <select
                    value={searchParams.rating || ''}
                    onChange={(e) => handleFilterChange({ 
                      rating: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Tümü</option>
                    <option value={4}>4+ Yıldız</option>
                    <option value={3}>3+ Yıldız</option>
                    <option value={2}>2+ Yıldız</option>
                  </select>
                </div>

                {/* Sort by */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sıralama
                  </label>
                  <select
                    value={searchParams.sortBy}
                    onChange={(e) => handleFilterChange({ 
                      sortBy: e.target.value as MarketplaceSearchParams['sortBy']
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="distance">Mesafe</option>
                    <option value="rating">Puan</option>
                    <option value="delivery_time">Teslimat Süresi</option>
                    <option value="popularity">Popülerlik</option>
                  </select>
                </div>

                {/* Open now filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durum
                  </label>
                  <select
                    value={searchParams.isOpen ? 'open' : ''}
                    onChange={(e) => handleFilterChange({ 
                      isOpen: e.target.value === 'open' ? true : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Tümü</option>
                    <option value="open">Sadece Açık Olanlar</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {isLoading ? 'Aranıyor...' : `${totalResults} sonuç bulundu`}
          </span>
          
          {searchParams.location && (
            <Badge variant="outline">
              {searchParams.radius} km yarıçap
            </Badge>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-gray-600">Marketplace aranıyor...</p>
          </div>
        </div>
      )}

      {/* Tabs for different types */}
      <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            Tümü ({totalResults})
          </TabsTrigger>
          <TabsTrigger value="restaurants">
            Restoranlar ({restaurants.length})
          </TabsTrigger>
          <TabsTrigger value="shops">
            Mağazalar ({shops.length})
          </TabsTrigger>
        </TabsList>

        {/* All results */}
        <TabsContent value="all" className="space-y-6">
          {/* Restaurants section */}
          {restaurants.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Restoranlar
              </h2>
              <div className={`grid gap-4 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {restaurants.slice(0, 6).map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onViewMenu={(restaurant) => console.log('View menu:', restaurant)}
                    onOrderNow={(restaurant) => console.log('Order now:', restaurant)}
                    distance={searchParams.location ? 
                      calculateDistance(searchParams.location, restaurant.coordinates) : 
                      undefined
                    }
                  />
                ))}
              </div>
              {restaurants.length > 6 && (
                <div className="text-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('restaurants')}
                  >
                    Tüm Restoranları Gör ({restaurants.length})
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Shops section */}
          {shops.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Mağazalar
              </h2>
              <div className={`grid gap-4 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {shops.slice(0, 6).map((shop) => (
                  <ShopCard
                    key={shop.id}
                    shop={shop}
                    onViewProducts={(shop) => console.log('View products:', shop)}
                    onVisitShop={(shop) => console.log('Visit shop:', shop)}
                    distance={searchParams.location ? 
                      calculateDistance(searchParams.location, shop.coordinates) : 
                      undefined
                    }
                  />
                ))}
              </div>
              {shops.length > 6 && (
                <div className="text-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('shops')}
                  >
                    Tüm Mağazaları Gör ({shops.length})
                  </Button>
                </div>
              )}
            </section>
          )}
        </TabsContent>

        {/* Restaurants only */}
        <TabsContent value="restaurants">
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onViewMenu={(restaurant) => console.log('View menu:', restaurant)}
                onOrderNow={(restaurant) => console.log('Order now:', restaurant)}
                distance={searchParams.location ? 
                  calculateDistance(searchParams.location, restaurant.coordinates) : 
                  undefined
                }
              />
            ))}
          </div>
        </TabsContent>

        {/* Shops only */}
        <TabsContent value="shops">
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {shops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                onViewProducts={(shop) => console.log('View products:', shop)}
                onVisitShop={(shop) => console.log('Visit shop:', shop)}
                distance={searchParams.location ? 
                  calculateDistance(searchParams.location, shop.coordinates) : 
                  undefined
                }
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty state */}
      {!isLoading && totalResults === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sonuç Bulunamadı
          </h3>
          <p className="text-gray-600 mb-4">
            Arama kriterlerinizi değiştirmeyi deneyin.
          </p>
          <Button onClick={() => setShowFilters(true)}>
            Filtreleri Düzenle
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate distance
function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
