'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Star,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  BarChart3,
  Pause,
  Play,
  TrendingUp
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ServiceListing {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  price: number;
  currency: string;
  duration: string;
  images: string[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  rating: number;
  reviewCount: number;
  totalBookings: number;
  viewCount: number;
  featured: boolean;
  createdAt: string;
  lastBooking?: string;
}

interface ProviderListingsProps {
  providerId: string;
}

export function ProviderListings({ providerId }: ProviderListingsProps) {
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');

  useEffect(() => {
    loadListings();
  }, [providerId]);

  const loadListings = async () => {
    try {
      setLoading(true);
      // TODO: Fetch actual listings from Firestore
      // TODO: Load real listings from Firestore
      const listings: ServiceListing[] = [
        {
          id: '1',
          title: 'Kapadokya Balon Turu - Gün Doğumu',
          description: 'Kapadokya\'nın büyüleyici manzarasını sıcak hava balonuyla keşfedin',
          category: 'Macera',
          location: 'Göreme, Nevşehir',
          price: 850,
          currency: 'TRY',
          duration: '3 saat',
          images: ['/placeholder-tour.jpg'],
          status: 'active',
          rating: 4.8,
          reviewCount: 124,
          totalBookings: 256,
          viewCount: 1520,
          featured: true,
          createdAt: '2024-01-15',
          lastBooking: '2024-04-20',
        },
        {
          id: '2',
          title: 'Göreme Açık Hava Müzesi Turu',
          description: 'UNESCO Dünya Mirası listesindeki tarihi kilise ve şapelleri keşfedin',
          category: 'Kültür',
          location: 'Göreme, Nevşehir',
          price: 180,
          currency: 'TRY',
          duration: '2 saat',
          images: ['/placeholder-tour.jpg'],
          status: 'active',
          rating: 4.6,
          reviewCount: 89,
          totalBookings: 145,
          viewCount: 890,
          featured: false,
          createdAt: '2024-02-10',
          lastBooking: '2024-04-18',
        },
        {
          id: '3',
          title: 'Ihlara Vadisi Yürüyüş Turu',
          description: 'Doğal güzellikleri ve tarihi kaya kiliselerini yürüyerek keşfedin',
          category: 'Doğa',
          location: 'Ihlara, Aksaray',
          price: 220,
          currency: 'TRY',
          duration: '5 saat',
          images: ['/placeholder-tour.jpg'],
          status: 'paused',
          rating: 4.4,
          reviewCount: 56,
          totalBookings: 98,
          viewCount: 650,
          featured: false,
          createdAt: '2024-03-05',
          lastBooking: '2024-04-10',
        },
        {
          id: '4',
          title: 'Kapadokya Gün Batımı Fotoğraf Turu',
          description: 'Profesyonel fotoğrafçı eşliğinde en güzel manzaraları yakalayın',
          category: 'Fotoğraf',
          location: 'Uçhisar, Nevşehir',
          price: 320,
          currency: 'TRY',
          duration: '4 saat',
          images: ['/placeholder-tour.jpg'],
          status: 'draft',
          rating: 0,
          reviewCount: 0,
          totalBookings: 0,
          viewCount: 0,
          featured: false,
          createdAt: '2024-04-15',
        },
      ];
      
      // TODO: Load from Firestore
      setListings([]);
    } catch (error) {
      console.error('Error loading listings:', error);
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

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { label: 'Taslak', color: 'bg-gray-100 text-gray-800' },
      active: { label: 'Aktif', color: 'bg-green-100 text-green-800' },
      paused: { label: 'Duraklatıldı', color: 'bg-yellow-100 text-yellow-800' },
      archived: { label: 'Arşivlendi', color: 'bg-red-100 text-red-800' },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const categories = ['all', ...Array.from(new Set(listings.map(listing => listing.category)))];

  const filteredListings = listings
    .filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           listing.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || listing.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price_desc':
          return b.price - a.price;
        case 'price_asc':
          return a.price - b.price;
        case 'rating':
          return b.rating - a.rating;
        case 'bookings':
          return b.totalBookings - a.totalBookings;
        default:
          return 0;
      }
    });

  const handleStatusChange = async (listingId: string, newStatus: string) => {
    try {
      // TODO: Update listing status in Firestore
      setListings(prev => prev.map(listing => 
        listing.id === listingId ? { ...listing, status: newStatus as any } : listing
      ));
    } catch (error) {
      console.error('Error updating listing status:', error);
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Bu turu silmek istediğinizden emin misiniz?')) return;
    
    try {
      // TODO: Delete listing from Firestore
      setListings(prev => prev.filter(listing => listing.id !== listingId));
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  const handleDuplicate = async (listingId: string) => {
    try {
      // TODO: Duplicate listing in Firestore
      const originalListing = listings.find(l => l.id === listingId);
      if (originalListing) {
        const newListing = {
          ...originalListing,
          id: Date.now().toString(),
          title: `${originalListing.title} (Kopya)`,
          status: 'draft' as const,
          totalBookings: 0,
          viewCount: 0,
          rating: 0,
          reviewCount: 0,
          createdAt: new Date().toISOString(),
        };
        setListings(prev => [newListing, ...prev]);
      }
    } catch (error) {
      console.error('Error duplicating listing:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
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
          <h2 className="text-2xl font-bold">Turlarım</h2>
          <p className="text-muted-foreground">
            {listings.length} tur listenizde
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Tur Ekle
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tur adı veya konum ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="draft">Taslak</SelectItem>
                  <SelectItem value="paused">Duraklatıldı</SelectItem>
                  <SelectItem value="archived">Arşivlendi</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">Oluşturma (Yeni)</SelectItem>
                  <SelectItem value="created_asc">Oluşturma (Eski)</SelectItem>
                  <SelectItem value="price_desc">Fiyat (Yüksek)</SelectItem>
                  <SelectItem value="price_asc">Fiyat (Düşük)</SelectItem>
                  <SelectItem value="rating">Puan (Yüksek)</SelectItem>
                  <SelectItem value="bookings">Rezervasyon (Çok)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listings */}
      {filteredListings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                ? 'Arama sonucu bulunamadı'
                : 'Henüz tur eklememişsiniz'
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Farklı anahtar kelimeler deneyin veya filtreleri temizleyin.'
                : 'İlk turunuzu ekleyerek misafirlerinizle buluşmaya başlayın.'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Tur Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              formatPrice={formatPrice}
              getStatusConfig={getStatusConfig}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ListingCardProps {
  listing: ServiceListing;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  formatPrice: (amount: number, currency: string) => string;
  getStatusConfig: (status: string) => { label: string; color: string };
}

function ListingCard({ 
  listing, 
  onStatusChange, 
  onDelete, 
  onDuplicate, 
  formatPrice, 
  getStatusConfig 
}: ListingCardProps) {
  const statusConfig = getStatusConfig(listing.status);

  return (
    <Card className={listing.featured ? 'ring-2 ring-primary/20' : ''}>
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Tour Image */}
          <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={listing.images[0] || '/placeholder-tour.jpg'}
              alt={listing.title}
              fill
              className="object-cover"
            />
            {listing.featured && (
              <Badge className="absolute top-1 left-1 text-xs">
                Öne Çıkan
              </Badge>
            )}
          </div>

          {/* Tour Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {listing.description}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Badge className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      Görüntüle
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(listing.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Kopyala
                    </DropdownMenuItem>
                    {listing.status === 'active' ? (
                      <DropdownMenuItem onClick={() => onStatusChange(listing.id, 'paused')}>
                        <Pause className="h-4 w-4 mr-2" />
                        Duraklat
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onStatusChange(listing.id, 'active')}>
                        <Play className="h-4 w-4 mr-2" />
                        Aktifleştir
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => onDelete(listing.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{listing.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{listing.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{formatPrice(listing.price, listing.currency)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline">{listing.category}</Badge>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{listing.rating > 0 ? listing.rating : '-'}</span>
                  <span className="text-muted-foreground">
                    ({listing.reviewCount} değerlendirme)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{listing.totalBookings} rezervasyon</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>{listing.viewCount} görüntülenme</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  İstatistikler
                </Button>
                <Button size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Düzenle
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
