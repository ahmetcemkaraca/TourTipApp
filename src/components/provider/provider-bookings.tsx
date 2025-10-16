'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Download,
  RefreshCw,
  AlertTriangle,
  MapPin,
  CreditCard
} from 'lucide-react';

interface Booking {
  id: string;
  bookingCode: string;
  serviceName: string;
  serviceImage: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  participants: {
    adults: number;
    children: number;
    infants: number;
  };
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  specialRequests?: string;
  createdAt: string;
  lastUpdated: string;
}

interface ProviderBookingsProps {
  providerId: string;
}

export function ProviderBookings({ providerId }: ProviderBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadBookings();
  }, [providerId]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // TODO: Fetch actual bookings from Firestore
      // TODO: Load real bookings from Firestore
      const bookings: Booking[] = [
        {
          id: '1',
          bookingCode: 'BK240520001',
          serviceName: 'Kapadokya Balon Turu',
          serviceImage: '/placeholder-tour.jpg',
          customerName: 'Ahmet Yılmaz',
          customerEmail: 'ahmet@example.com',
          customerPhone: '+90 532 123 45 67',
          bookingDate: '2024-05-25T05:30:00Z',
          participants: { adults: 2, children: 0, infants: 0 },
          totalPrice: 1700,
          currency: 'TRY',
          status: 'pending',
          paymentStatus: 'completed',
          specialRequests: 'Özel beslenme ihtiyacı var',
          createdAt: '2024-05-20T10:30:00Z',
          lastUpdated: '2024-05-20T10:30:00Z',
        },
        {
          id: '2',
          bookingCode: 'BK240519001',
          serviceName: 'Göreme Açık Hava Müzesi',
          serviceImage: '/placeholder-tour.jpg',
          customerName: 'Fatma Demir',
          customerEmail: 'fatma@example.com',
          customerPhone: '+90 533 234 56 78',
          bookingDate: '2024-05-22T09:00:00Z',
          participants: { adults: 3, children: 1, infants: 0 },
          totalPrice: 720,
          currency: 'TRY',
          status: 'confirmed',
          paymentStatus: 'completed',
          createdAt: '2024-05-19T14:15:00Z',
          lastUpdated: '2024-05-19T15:20:00Z',
        },
        {
          id: '3',
          bookingCode: 'BK240518001',
          serviceName: 'Ihlara Vadisi Yürüyüş',
          serviceImage: '/placeholder-tour.jpg',
          customerName: 'Mehmet Özkan',
          customerEmail: 'mehmet@example.com',
          customerPhone: '+90 534 345 67 89',
          bookingDate: '2024-05-20T08:00:00Z',
          participants: { adults: 2, children: 0, infants: 0 },
          totalPrice: 440,
          currency: 'TRY',
          status: 'completed',
          paymentStatus: 'completed',
          createdAt: '2024-05-18T09:45:00Z',
          lastUpdated: '2024-05-20T18:00:00Z',
        },
        {
          id: '4',
          bookingCode: 'BK240517001',
          serviceName: 'Kapadokya Gün Batımı',
          serviceImage: '/placeholder-tour.jpg',
          customerName: 'Ayşe Kaya',
          customerEmail: 'ayse@example.com',
          customerPhone: '+90 535 456 78 90',
          bookingDate: '2024-05-19T16:00:00Z',
          participants: { adults: 4, children: 2, infants: 0 },
          totalPrice: 1920,
          currency: 'TRY',
          status: 'cancelled',
          paymentStatus: 'refunded',
          createdAt: '2024-05-17T11:20:00Z',
          lastUpdated: '2024-05-18T09:30:00Z',
        },
      ];
      
      // TODO: Load from Firestore
      setBookings([]);
    } catch (error) {
      console.error('Error loading bookings:', error);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: 'Onay Bekliyor', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      completed: { label: 'Tamamlandı', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800', icon: XCircle },
      no_show: { label: 'Gelmedi', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getPaymentStatusConfig = (status: string) => {
    const configs = {
      pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Ödendi', color: 'bg-green-100 text-green-800' },
      failed: { label: 'Başarısız', color: 'bg-red-100 text-red-800' },
      refunded: { label: 'İade Edildi', color: 'bg-blue-100 text-blue-800' },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const filteredBookings = bookings
    .filter(booking => {
      const matchesSearch = booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      const matchesTab = activeTab === 'all' || booking.status === activeTab;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const bookingDate = new Date(booking.bookingDate);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDate = bookingDate.toDateString() === now.toDateString();
            break;
          case 'tomorrow':
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            matchesDate = bookingDate.toDateString() === tomorrow.toDateString();
            break;
          case 'this_week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            matchesDate = bookingDate >= weekStart && bookingDate <= weekEnd;
            break;
          case 'next_week':
            const nextWeekStart = new Date(now);
            nextWeekStart.setDate(now.getDate() + (7 - now.getDay()));
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
            matchesDate = bookingDate >= nextWeekStart && bookingDate <= nextWeekEnd;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate && matchesTab;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
        case 'date_asc':
          return new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime();
        case 'created_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price_desc':
          return b.totalPrice - a.totalPrice;
        case 'price_asc':
          return a.totalPrice - b.totalPrice;
        default:
          return 0;
      }
    });

  const bookingStats = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      // TODO: Update booking status in Firestore
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus as any, lastUpdated: new Date().toISOString() }
          : booking
      ));
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
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
          <h2 className="text-2xl font-bold">Rezervasyonlar</h2>
          <p className="text-muted-foreground">
            {bookings.length} rezervasyon bulundu
          </p>
        </div>
        <Button onClick={loadBookings} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Müşteri adı, rezervasyon kodu veya tur adı ile ara..."
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
                  <SelectItem value="pending">Onay Bekliyor</SelectItem>
                  <SelectItem value="confirmed">Onaylandı</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tarih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tarihler</SelectItem>
                  <SelectItem value="today">Bugün</SelectItem>
                  <SelectItem value="tomorrow">Yarın</SelectItem>
                  <SelectItem value="this_week">Bu Hafta</SelectItem>
                  <SelectItem value="next_week">Gelecek Hafta</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Tur Tarihi (Yeni)</SelectItem>
                  <SelectItem value="date_asc">Tur Tarihi (Eski)</SelectItem>
                  <SelectItem value="created_desc">Oluşturma (Yeni)</SelectItem>
                  <SelectItem value="created_asc">Oluşturma (Eski)</SelectItem>
                  <SelectItem value="price_desc">Tutar (Yüksek)</SelectItem>
                  <SelectItem value="price_asc">Tutar (Düşük)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Tümü ({bookingStats.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Bekleyen ({bookingStats.pending})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Onaylı ({bookingStats.confirmed})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Tamamlanan ({bookingStats.completed})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            İptal ({bookingStats.cancelled})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Rezervasyon bulunamadı</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                    ? 'Arama kriterlerinize uygun rezervasyon bulunamadı.'
                    : 'Henüz hiç rezervasyon bulunmuyor.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onStatusUpdate={handleStatusUpdate}
                formatPrice={formatPrice}
                formatDateTime={formatDateTime}
                getStatusConfig={getStatusConfig}
                getPaymentStatusConfig={getPaymentStatusConfig}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  onStatusUpdate: (id: string, status: string) => void;
  formatPrice: (amount: number, currency: string) => string;
  formatDateTime: (dateString: string) => string;
  getStatusConfig: (status: string) => any;
  getPaymentStatusConfig: (status: string) => any;
}

function BookingCard({ 
  booking, 
  onStatusUpdate, 
  formatPrice, 
  formatDateTime, 
  getStatusConfig, 
  getPaymentStatusConfig 
}: BookingCardProps) {
  const statusConfig = getStatusConfig(booking.status);
  const paymentConfig = getPaymentStatusConfig(booking.paymentStatus);
  const totalParticipants = booking.participants.adults + booking.participants.children + booking.participants.infants;
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Service Image & Basic Info */}
          <div className="flex gap-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={booking.serviceImage}
                alt={booking.serviceName}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold line-clamp-1">{booking.serviceName}</h3>
                <Badge className={statusConfig.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Rezervasyon: {booking.bookingCode}
              </p>
              <p className="text-sm text-muted-foreground">
                Oluşturulma: {formatDateTime(booking.createdAt)}
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Customer Info */}
              <div>
                <h4 className="font-medium text-sm mb-2">Müşteri Bilgileri</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{booking.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Tour Details */}
              <div>
                <h4 className="font-medium text-sm mb-2">Tur Detayları</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateTime(booking.bookingDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {booking.participants.adults} yetişkin
                      {booking.participants.children > 0 && `, ${booking.participants.children} çocuk`}
                      {booking.participants.infants > 0 && `, ${booking.participants.infants} bebek`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-primary">
                      {formatPrice(booking.totalPrice, booking.currency)}
                    </span>
                    <Badge className={paymentConfig.color} variant="outline">
                      {paymentConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {booking.specialRequests && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Özel İstekler</h4>
                  <p className="text-sm text-muted-foreground">
                    {booking.specialRequests}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Detayları Görüntüle
              </Button>

              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Müşteriyle İletişim
              </Button>

              {booking.status === 'pending' && (
                <>
                  <Button 
                    size="sm" 
                    onClick={() => onStatusUpdate(booking.id, 'confirmed')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Onayla
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => onStatusUpdate(booking.id, 'cancelled')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reddet
                  </Button>
                </>
              )}

              {booking.status === 'confirmed' && (
                <Button 
                  size="sm" 
                  onClick={() => onStatusUpdate(booking.id, 'completed')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tamamlandı Olarak İşaretle
                </Button>
              )}

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Bilet İndir
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
