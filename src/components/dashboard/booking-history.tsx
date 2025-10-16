'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  Download, 
  Star,
  Search,
  Filter,
  Eye,
  MessageCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface BookingItem {
  id: string;
  tourTitle: string;
  tourImage: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  participants: {
    adults: number;
    children: number;
  };
  totalPrice: number;
  currency: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending';
  bookingCode: string;
  providerName: string;
  hasReview?: boolean;
  cancellable?: boolean;
}

export function BookingHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // TODO: Fetch actual bookings from Firestore
      // Real booking data would be loaded here
      
      // TODO: Load real booking data from Firestore
      setBookings([]);
    } catch (error) {
      toast.error('Rezervasyonlar yüklenirken hata oluştu.');
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

  const getStatusConfig = (status: BookingItem['status']) => {
    const configs = {
      upcoming: {
        label: 'Yaklaşan',
        variant: 'default' as const,
        color: 'bg-blue-100 text-blue-800',
      },
      completed: {
        label: 'Tamamlandı',
        variant: 'secondary' as const,
        color: 'bg-green-100 text-green-800',
      },
      cancelled: {
        label: 'İptal Edildi',
        variant: 'destructive' as const,
        color: 'bg-red-100 text-red-800',
      },
      pending: {
        label: 'Onay Bekliyor',
        variant: 'outline' as const,
        color: 'bg-yellow-100 text-yellow-800',
      },
    };
    return configs[status];
  };

  const filteredBookings = bookings
    .filter(booking => {
      const matchesSearch = booking.tourTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.bookingCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'price_desc':
          return b.totalPrice - a.totalPrice;
        case 'price_asc':
          return a.totalPrice - b.totalPrice;
        default:
          return 0;
      }
    });

  const bookingsByStatus = {
    all: bookings,
    upcoming: bookings.filter(b => b.status === 'upcoming'),
    completed: bookings.filter(b => b.status === 'completed'),
    cancelled: bookings.filter(b => b.status === 'cancelled'),
    pending: bookings.filter(b => b.status === 'pending'),
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      // TODO: Implement cancellation logic
      toast.success('Rezervasyon iptal edildi.');
      loadBookings();
    } catch (error) {
      toast.error('İptal işlemi başarısız oldu.');
    }
  };

  const handleDownloadTicket = async (bookingId: string) => {
    try {
      // TODO: Generate and download ticket PDF
      toast.success('Bilet indiriliyor...');
    } catch (error) {
      toast.error('Bilet indirilemedi.');
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
          <h2 className="text-2xl font-bold">Rezervasyon Geçmişi</h2>
          <p className="text-muted-foreground">Tüm rezervasyonlarınızı görüntüleyin ve yönetin</p>
        </div>
        <Button onClick={loadBookings} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tur adı, konum veya rezervasyon kodu ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="upcoming">Yaklaşan</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="pending">Onay Bekliyor</SelectItem>
                <SelectItem value="cancelled">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Tarihe Göre (Yeni)</SelectItem>
                <SelectItem value="date_asc">Tarihe Göre (Eski)</SelectItem>
                <SelectItem value="price_desc">Fiyata Göre (Yüksek)</SelectItem>
                <SelectItem value="price_asc">Fiyata Göre (Düşük)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Tümü ({bookingsByStatus.all.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Yaklaşan ({bookingsByStatus.upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Tamamlandı ({bookingsByStatus.completed.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Beklemede ({bookingsByStatus.pending.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            İptal ({bookingsByStatus.cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Rezervasyon bulunamadı</h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === 'all' 
                    ? 'Henüz hiç rezervasyon yapmamışsınız.'
                    : `${getStatusConfig(statusFilter as BookingItem['status']).label} durumunda rezervasyon bulunmuyor.`
                  }
                </p>
                <Button>
                  Turları Keşfet
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancelBooking}
                onDownloadTicket={handleDownloadTicket}
                formatPrice={formatPrice}
                formatDate={formatDate}
                getStatusConfig={getStatusConfig}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface BookingCardProps {
  booking: BookingItem;
  onCancel: (id: string) => void;
  onDownloadTicket: (id: string) => void;
  formatPrice: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
  getStatusConfig: (status: BookingItem['status']) => any;
}

function BookingCard({ 
  booking, 
  onCancel, 
  onDownloadTicket, 
  formatPrice, 
  formatDate, 
  getStatusConfig 
}: BookingCardProps) {
  const statusConfig = getStatusConfig(booking.status);
  const totalParticipants = booking.participants.adults + booking.participants.children;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tour Image */}
          <div className="relative w-full lg:w-32 h-48 lg:h-32 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={booking.tourImage}
              alt={booking.tourTitle}
              fill
              className="object-cover"
            />
            <Badge className={`absolute top-2 right-2 ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Booking Details */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div>
                <h3 className="text-lg font-semibold line-clamp-1">{booking.tourTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  Rezervasyon Kodu: {booking.bookingCode}
                </p>
                <p className="text-sm text-muted-foreground">
                  Sağlayıcı: {booking.providerName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">
                  {formatPrice(booking.totalPrice, booking.currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {totalParticipants} kişi için
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(booking.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{booking.time} ({booking.duration})</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{booking.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {booking.participants.adults} yetişkin
                  {booking.participants.children > 0 && `, ${booking.participants.children} çocuk`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Detayları Görüntüle
              </Button>

              {booking.status === 'upcoming' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => onDownloadTicket(booking.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Bilet İndir
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Sağlayıcıyla İletişim
                  </Button>
                  {booking.cancellable && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onCancel(booking.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      İptal Et
                    </Button>
                  )}
                </>
              )}

              {booking.status === 'completed' && !booking.hasReview && (
                <Button variant="outline" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  Değerlendir
                </Button>
              )}

              {booking.status === 'completed' && booking.hasReview && (
                <Button variant="outline" size="sm" disabled>
                  <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
                  Değerlendirildi
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
