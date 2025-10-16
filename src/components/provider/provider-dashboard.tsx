'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Users,
  Star,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  ArrowRight,
  Plus,
  BarChart3
} from 'lucide-react';

interface ProviderDashboardProps {
  providerData: any;
}

interface RecentBooking {
  id: string;
  serviceName: string;
  customerName: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
  participants: number;
}

interface RecentReview {
  id: string;
  serviceName: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  responded: boolean;
}

export function ProviderDashboard({ providerData }: ProviderDashboardProps) {
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    revenue: { current: 25000, previous: 22000, growth: 13.6 },
    bookings: { current: 48, previous: 42, growth: 14.3 },
    reviews: { current: 12, previous: 8, growth: 50 },
    rating: { current: 4.8, previous: 4.6, growth: 4.3 },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // TODO: Fetch actual data from Firestore
    setRecentBookings([
      {
        id: '1',
        serviceName: 'Kapadokya Balon Turu',
        customerName: 'Ahmet Yılmaz',
        date: '2024-05-15',
        status: 'pending',
        amount: 850,
        participants: 2,
      },
      {
        id: '2',
        serviceName: 'Göreme Gün Batımı',
        customerName: 'Fatma Demir',
        date: '2024-05-16',
        status: 'confirmed',
        amount: 420,
        participants: 4,
      },
      {
        id: '3',
        serviceName: 'Ihlara Vadisi Yürüyüşü',
        customerName: 'Mehmet Kaya',
        date: '2024-05-14',
        status: 'completed',
        amount: 180,
        participants: 2,
      },
    ]);

    setRecentReviews([
      {
        id: '1',
        serviceName: 'Kapadokya Balon Turu',
        customerName: 'Ayşe Özkan',
        rating: 5,
        comment: 'Muhteşem bir deneyimdi! Rehber çok bilgiliydi ve manzara nefes kesiciydi.',
        date: '2024-04-28',
        responded: false,
      },
      {
        id: '2',
        serviceName: 'Göreme Gün Batımı',
        customerName: 'Can Erdoğan',
        rating: 4,
        comment: 'Güzel bir tur ama biraz daha uzun olabilirdi.',
        date: '2024-04-25',
        responded: true,
      },
    ]);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: 'Onay Bekliyor', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Tamamlandı', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800' },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className="space-y-6">
      {/* Revenue Chart and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Aylık Gelir Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(monthlyStats.revenue.current)}
                  </p>
                  <p className="text-sm text-muted-foreground">Bu ay toplam gelir</p>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-medium">
                    +{monthlyStats.revenue.growth}%
                  </p>
                  <p className="text-sm text-muted-foreground">Geçen aya göre</p>
                </div>
              </div>
              
              {/* Simple progress visualization */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Hedef: ₺30.000</span>
                  <span>%{((monthlyStats.revenue.current / 30000) * 100).toFixed(0)}</span>
                </div>
                <Progress value={(monthlyStats.revenue.current / 30000) * 100} className="h-2" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-lg font-semibold">{monthlyStats.bookings.current}</p>
                  <p className="text-xs text-muted-foreground">Rezervasyon</p>
                  <p className="text-xs text-green-600">+{monthlyStats.bookings.growth}%</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{monthlyStats.reviews.current}</p>
                  <p className="text-xs text-muted-foreground">Değerlendirme</p>
                  <p className="text-xs text-green-600">+{monthlyStats.reviews.growth}%</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{monthlyStats.rating.current}</p>
                  <p className="text-xs text-muted-foreground">Ortalama Puan</p>
                  <p className="text-xs text-green-600">+{monthlyStats.rating.growth}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Tur Ekle
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Takvimi Güncelle
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="h-4 w-4 mr-2" />
              Müşteri Mesajları
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Raporları Görüntüle
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Son Rezervasyonlar
            </CardTitle>
            <Button variant="ghost" size="sm">
              Tümünü Gör
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{booking.serviceName}</h4>
                    <p className="text-sm text-muted-foreground">{booking.customerName}</p>
                  </div>
                  <Badge className={getStatusConfig(booking.status).color}>
                    {getStatusConfig(booking.status).label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>{new Date(booking.date).toLocaleDateString('tr-TR')} - {booking.participants} kişi</span>
                  <span className="font-semibold text-primary">
                    {formatPrice(booking.amount)}
                  </span>
                </div>
                {booking.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Onayla
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Reddet
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Son Değerlendirmeler
            </CardTitle>
            <Button variant="ghost" size="sm">
              Tümünü Gör
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{review.serviceName}</h4>
                    <p className="text-sm text-muted-foreground">{review.customerName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm mb-3 line-clamp-2">{review.comment}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.date).toLocaleDateString('tr-TR')}
                  </span>
                  {!review.responded && (
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Yanıtla
                    </Button>
                  )}
                  {review.responded && (
                    <Badge variant="secondary">Yanıtlandı</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Önemli Bildirimler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Bekleyen Rezervasyonlar</h4>
              <p className="text-sm text-yellow-700">
                3 rezervasyon onayınızı bekliyor. Müşteri memnuniyeti için 24 saat içinde yanıt verin.
              </p>
            </div>
            <Button size="sm" variant="outline">
              İncele
            </Button>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Profil Optimizasyonu</h4>
              <p className="text-sm text-blue-700">
                Turlarınızın görünürlüğünü artırmak için profil fotoğrafı ve açıklama ekleyin.
              </p>
            </div>
            <Button size="sm" variant="outline">
              Düzenle
            </Button>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">Doğrulama Tamamlandı</h4>
              <p className="text-sm text-green-700">
                Hesabınız başarıyla doğrulandı. Artık tüm özelliklerden yararlanabilirsiniz.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
