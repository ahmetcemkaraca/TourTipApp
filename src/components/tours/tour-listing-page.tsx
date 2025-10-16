'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, breadcrumbs } from '@/components/layout/breadcrumb';
import { TourCard } from './tour-card';
import { TourFilters } from './tour-filters';
import { tourService } from '@/lib/firestore-service';
import { ServiceListing } from '@/lib/firestore-collections';
import { Search, Filter, MapPin, Clock, Star, Users, Grid, List, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface TourListingPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export function TourListingPage({ searchParams }: TourListingPageProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const [tours, setTours] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.q as string || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.category as string || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.location as string || '');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.minPrice ? Number(searchParams.minPrice) : 0,
    max: searchParams.maxPrice ? Number(searchParams.maxPrice) : 5000,
  });
  const [sortBy, setSortBy] = useState(searchParams.sort as string || 'rating');

  // Categories and locations for filters
  const categories = [
    { value: '', label: 'Tüm Kategoriler' },
    { value: 'kultur', label: 'Kültür Turları' },
    { value: 'doga', label: 'Doğa & Macera' },
    { value: 'sehir', label: 'Şehir Turları' },
    { value: 'gastromi', label: 'Gastromi' },
    { value: 'deniz', label: 'Deniz & Plaj' },
    { value: 'kis', label: 'Kış Sporları' },
  ];

  const locations = [
    { value: '', label: 'Tüm Şehirler' },
    { value: 'istanbul', label: 'İstanbul' },
    { value: 'ankara', label: 'Ankara' },
    { value: 'izmir', label: 'İzmir' },
    { value: 'antalya', label: 'Antalya' },
    { value: 'kapadokya', label: 'Kapadokya' },
    { value: 'bodrum', label: 'Bodrum' },
    { value: 'marmaris', label: 'Marmaris' },
  ];

  const sortOptions = [
    { value: 'rating', label: 'En Yüksek Puanlı' },
    { value: 'price-low', label: 'En Düşük Fiyat' },
    { value: 'price-high', label: 'En Yüksek Fiyat' },
    { value: 'newest', label: 'En Yeni' },
    { value: 'popular', label: 'En Popüler' },
  ];

  // Load tours based on current filters
  const loadTours = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true);
      
      const filters = {
        category: selectedCategory || undefined,
        location: selectedLocation || undefined,
        maxPrice: priceRange.max < 5000 ? priceRange.max : undefined,
      };

      const result = await tourService.searchTours(searchQuery, filters);
      
      // Sort results
      let sortedTours = [...result];
      switch (sortBy) {
        case 'price-low':
          sortedTours.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
          break;
        case 'price-high':
          sortedTours.sort((a, b) => (b.price?.amount || 0) - (a.price?.amount || 0));
          break;
        case 'rating':
          sortedTours.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'newest':
          sortedTours.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        default:
          // Keep rating sort as default
          break;
      }

      if (reset) {
        setTours(sortedTours);
      } else {
        setTours(prev => [...prev, ...sortedTours]);
      }
      
      setHasMore(result.length === 50); // Assuming we fetch 50 items max
    } catch (error) {
      console.error('Error loading tours:', error);
      toast.error('Turlar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLocation, priceRange, sortBy]);

  // Update URL with current filters
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedLocation) params.set('location', selectedLocation);
    if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
    if (priceRange.max < 5000) params.set('maxPrice', priceRange.max.toString());
    if (sortBy !== 'rating') params.set('sort', sortBy);

    const newURL = `/tours?${params.toString()}`;
    router.push(newURL);
  }, [searchQuery, selectedCategory, selectedLocation, priceRange, sortBy, router]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL();
    loadTours(true);
  };

  // Handle filter changes
  const handleFilterChange = () => {
    updateURL();
    loadTours(true);
  };

  // Load tours on mount and filter changes
  useEffect(() => {
    loadTours(true);
  }, [selectedCategory, selectedLocation, priceRange, sortBy]);

  // Load more tours
  const loadMore = () => {
    if (!loading && hasMore) {
      loadTours(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={breadcrumbs.tours} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Turlar</h1>
          <p className="text-muted-foreground">
            Türkiye'nin dört bir yanında unutulmaz deneyimler sizi bekliyor.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="search">Tur Ara</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Tur adı, şehir veya aktivite arayın..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Şehir</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Şehir seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.value} value={location.value}>
                          {location.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <Button type="submit" className="w-full sm:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  Ara
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full sm:w-auto"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtreler
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        {showFilters && (
          <TourFilters
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            onApply={handleFilterChange}
          />
        )}

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <p className="text-muted-foreground">
              {tours.length} tur bulundu
              {searchQuery && (
                <span> - "{searchQuery}" için sonuçlar</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Sırala:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading && tours.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="aspect-[4/3] bg-muted rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Tur bulunamadı</h3>
            <p className="text-muted-foreground mb-4">
              Arama kriterlerinize uygun tur bulunamadı. Filtreleri değiştirmeyi deneyin.
            </p>
            <Button onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setSelectedLocation('');
              setPriceRange({ min: 0, max: 5000 });
              setSortBy('rating');
              router.push('/tours');
            }}>
              Filtreleri Temizle
            </Button>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {tours.map((tour) => (
                <TourCard 
                  key={tour.id} 
                  tour={tour} 
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button 
                  onClick={loadMore} 
                  variant="outline" 
                  disabled={loading}
                  className="min-w-32"
                >
                  {loading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
