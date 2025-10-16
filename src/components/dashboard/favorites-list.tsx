'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Heart, 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Search,
  Grid3X3,
  List,
  Trash2,
  Share2,
  ShoppingCart,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface FavoriteItem {
  id: string;
  tourId: string;
  tourTitle: string;
  tourImage: string;
  location: string;
  duration: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  category: string;
  provider: string;
  addedAt: string;
  isAvailable: boolean;
}

export function FavoritesList() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // TODO: Fetch actual favorites from Firestore
      // TODO: Load real favorites from Firestore
      const favorites: FavoriteItem[] = [
        {
          id: '1',
          tourId: 'tour-001',
          tourTitle: 'Kapadokya Balon Turu - Gün Doğumu',
          tourImage: '/placeholder-tour.jpg',
          location: 'Göreme, Nevşehir',
          duration: '3 saat',
          price: 850,
          currency: 'TRY',
          rating: 4.8,
          reviewCount: 245,
          category: 'Macera',
          provider: 'Kapadokya Balon Turları',
          addedAt: '2024-04-20',
          isAvailable: true,
        },
        {
          id: '2',
          tourId: 'tour-002',
          tourTitle: 'Pamukkale Travertenleri ve Hierapolis Antik Kenti',
          tourImage: '/placeholder-tour.jpg',
          location: 'Pamukkale, Denizli',
          duration: '6 saat',
          price: 320,
          currency: 'TRY',
          rating: 4.6,
          reviewCount: 156,
          category: 'Kültür',
          provider: 'Pamukkale Gezileri',
          addedAt: '2024-04-15',
          isAvailable: true,
        },
        {
          id: '3',
          tourId: 'tour-003',
          tourTitle: 'Antalya Çevresinde Jeep Safari',
          tourImage: '/placeholder-tour.jpg',
          location: 'Antalya',
          duration: '8 saat',
          price: 180,
          currency: 'TRY',
          rating: 4.4,
          reviewCount: 89,
          category: 'Macera',
          provider: 'Antalya Safari Tours',
          addedAt: '2024-04-10',
          isAvailable: false,
        },
        {
          id: '4',
          tourId: 'tour-004',
          tourTitle: 'İstanbul Boğaz Turu ve Dolmabahçe Sarayı',
          tourImage: '/placeholder-tour.jpg',
          location: 'İstanbul',
          duration: '4 saat',
          price: 450,
          currency: 'TRY',
          rating: 4.7,
          reviewCount: 312,
          category: 'Kültür',
          provider: 'İstanbul Rehberler',
          addedAt: '2024-04-05',
          isAvailable: true,
        },
      ];
      
      // TODO: Load from Firestore
      setFavorites([]);
    } catch (error) {
      toast.error('Favoriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const categories = ['all', ...Array.from(new Set(favorites.map(fav => fav.category)))];

  const filteredFavorites = favorites
    .filter(fav => {
      const matchesSearch = fav.tourTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fav.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || fav.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'date_asc':
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        case 'price_desc':
          return b.price - a.price;
        case 'price_asc':
          return a.price - b.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.tourTitle.localeCompare(b.tourTitle, 'tr');
        default:
          return 0;
      }
    });

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      // TODO: Remove from Firestore
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      toast.success('Favorilerden çıkarıldı.');
    } catch (error) {
      toast.error('Favorilerden çıkarılırken hata oluştu.');
    }
  };

  const handleBulkRemove = async () => {
    try {
      // TODO: Bulk remove from Firestore
      setFavorites(prev => prev.filter(fav => !selectedItems.includes(fav.id)));
      setSelectedItems([]);
      toast.success(`${selectedItems.length} ürün favorilerden çıkarıldı.`);
    } catch (error) {
      toast.error('Favorilerden çıkarılırken hata oluştu.');
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredFavorites.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredFavorites.map(fav => fav.id));
    }
  };

  const handleItemSelect = (favoriteId: string) => {
    setSelectedItems(prev => 
      prev.includes(favoriteId)
        ? prev.filter(id => id !== favoriteId)
        : [...prev, favoriteId]
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <CardContent className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Favori Turlarım</h2>
          <p className="text-muted-foreground">
            {favorites.length} tur favori listenizde
          </p>
        </div>
        
        {selectedItems.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkRemove}>
              <Trash2 className="h-4 w-4 mr-2" />
              Seçilenleri Çıkar ({selectedItems.length})
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Paylaş
            </Button>
          </div>
        )}
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tur adı veya konum ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 w-full lg:w-auto">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.filter(c => c !== 'all').map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Ekleme Tarihi (Yeni)</SelectItem>
                  <SelectItem value="date_asc">Ekleme Tarihi (Eski)</SelectItem>
                  <SelectItem value="price_desc">Fiyat (Yüksek)</SelectItem>
                  <SelectItem value="price_asc">Fiyat (Düşük)</SelectItem>
                  <SelectItem value="rating">Puan (Yüksek)</SelectItem>
                  <SelectItem value="name">İsim (A-Z)</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {filteredFavorites.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedItems.length === filteredFavorites.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {filteredFavorites.length} tur gösteriliyor
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Favorites List */}
      {filteredFavorites.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || categoryFilter !== 'all' ? 'Arama sonucu bulunamadı' : 'Henüz favori turunuz yok'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Farklı anahtar kelimeler deneyin veya filtreleri temizleyin.'
                : 'Beğendiğiniz turları favori listenize ekleyerek daha sonra kolayca erişebilirsiniz.'
              }
            </p>
            <Button>
              Turları Keşfet
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((favorite) => (
            <FavoriteGridCard
              key={favorite.id}
              favorite={favorite}
              isSelected={selectedItems.includes(favorite.id)}
              onSelect={() => handleItemSelect(favorite.id)}
              onRemove={() => handleRemoveFavorite(favorite.id)}
              formatPrice={formatPrice}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFavorites.map((favorite) => (
            <FavoriteListCard
              key={favorite.id}
              favorite={favorite}
              isSelected={selectedItems.includes(favorite.id)}
              onSelect={() => handleItemSelect(favorite.id)}
              onRemove={() => handleRemoveFavorite(favorite.id)}
              formatPrice={formatPrice}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FavoriteCardProps {
  favorite: FavoriteItem;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  formatPrice: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
}

function FavoriteGridCard({ favorite, isSelected, onSelect, onRemove, formatPrice }: FavoriteCardProps) {
  return (
    <Card className={`group relative overflow-hidden ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300"
        />
      </div>
      
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-white/80 hover:bg-white"
          onClick={onRemove}
        >
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
        </Button>
      </div>

      <Link href={`/tours/${favorite.tourId}`}>
        <div className="relative h-48 overflow-hidden">
          <Image
            src={favorite.tourImage}
            alt={favorite.tourTitle}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {!favorite.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive">Müsait Değil</Badge>
            </div>
          )}
          <Badge className="absolute bottom-2 left-2">
            {favorite.category}
          </Badge>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/tours/${favorite.tourId}`}>
          <h3 className="font-semibold line-clamp-2 mb-2 hover:text-primary transition-colors">
            {favorite.tourTitle}
          </h3>
        </Link>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{favorite.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{favorite.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{favorite.rating} ({favorite.reviewCount} yorum)</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <span className="font-bold text-primary">
            {formatPrice(favorite.price, favorite.currency)}
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline">
              <ShoppingCart className="h-4 w-4" />
            </Button>
            <Button size="sm">
              <Calendar className="h-4 w-4 mr-1" />
              Rezerve Et
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FavoriteListCard({ favorite, isSelected, onSelect, onRemove, formatPrice }: FavoriteCardProps) {
  return (
    <Card className={`overflow-hidden ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300"
            />
          </div>
          
          <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={favorite.tourImage}
              alt={favorite.tourTitle}
              fill
              className="object-cover"
            />
            {!favorite.isAvailable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-xs">Müsait Değil</Badge>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-start">
              <Link href={`/tours/${favorite.tourId}`}>
                <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
                  {favorite.tourTitle}
                </h3>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRemove}
              >
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{favorite.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{favorite.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{favorite.rating} ({favorite.reviewCount})</span>
              </div>
              <Badge variant="outline">{favorite.category}</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-primary">
                {formatPrice(favorite.price, favorite.currency)}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Sepete Ekle
                </Button>
                <Button size="sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  Rezerve Et
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
