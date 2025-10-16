'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Calendar, 
  Heart, 
  CreditCard, 
  Settings, 
  MapPin, 
  Star,
  Gift,
  Bell,
  Download,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { ProfileSettings } from './profile-settings';
import { BookingHistory } from './booking-history';
import { FavoritesList } from './favorites-list';
import { PaymentHistory } from './payment-history';
import { LoyaltyProgram } from './loyalty-program';
import { NotificationSettings } from './notification-settings';

export function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Dashboard statistics
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    favoriteCount: 0,
    loyaltyPoints: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    // Load dashboard statistics
    loadDashboardStats();
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      // TODO: Implement actual API calls to get statistics
      setStats({
        totalBookings: 5,
        upcomingBookings: 2,
        completedBookings: 3,
        favoriteCount: 8,
        loyaltyPoints: 1250,
        totalSpent: 2450,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const formatPrice = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Kontrol Paneli', current: true },
          ]} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Hoş geldiniz, {user?.displayName || 'Kullanıcı'}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Hesap bilgilerinizi ve rezervasyonlarınızı buradan yönetebilirsiniz.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Rapor İndir
              </Button>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Profili Düzenle
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Toplam Rezervasyon"
            value={stats.totalBookings}
            icon={Calendar}
            color="blue"
          />
          <StatsCard
            title="Yaklaşan Turlar"
            value={stats.upcomingBookings}
            icon={Clock}
            color="green"
          />
          <StatsCard
            title="Favori Turlar"
            value={stats.favoriteCount}
            icon={Heart}
            color="red"
          />
          <StatsCard
            title="Sadakat Puanı"
            value={stats.loyaltyPoints}
            icon={Gift}
            color="purple"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Genel Bakış</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Rezervasyonlar</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favoriler</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Ödemeler</span>
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Sadakat</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Ayarlar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab stats={stats} formatPrice={formatPrice} />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingHistory />
          </TabsContent>

          <TabsContent value="favorites">
            <FavoritesList />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentHistory />
          </TabsContent>

          <TabsContent value="loyalty">
            <LoyaltyProgram />
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfileSettings />
              <NotificationSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'purple';
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OverviewTabProps {
  stats: any;
  formatPrice: (amount: number, currency?: string) => string;
}

function OverviewTab({ stats, formatPrice }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Son Aktiviteler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ActivityItem
            icon={CheckCircle}
            iconColor="text-green-600"
            title="Kapadokya Balon Turu rezervasyonu onaylandı"
            time="2 saat önce"
          />
          <ActivityItem
            icon={Heart}
            iconColor="text-red-600"
            title="Pamukkale Gün Batımı Turu favorilere eklendi"
            time="1 gün önce"
          />
          <ActivityItem
            icon={CreditCard}
            iconColor="text-blue-600"
            title="₺850 tutarında ödeme alındı"
            time="3 gün önce"
          />
          <ActivityItem
            icon={Star}
            iconColor="text-yellow-600"
            title="Efes Antik Kenti Turu için 5 yıldız verdiniz"
            time="1 hafta önce"
          />
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Yaklaşan Turlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.upcomingBookings > 0 ? (
            <>
              <UpcomingBookingItem
                title="Kapadokya Balon Turu"
                date="15 Mayıs 2024"
                time="05:30"
                status="confirmed"
                participants={2}
              />
              <UpcomingBookingItem
                title="Pamukkale Gün Batımı"
                date="22 Mayıs 2024"
                time="16:00"
                status="pending"
                participants={4}
              />
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Yaklaşan turunuz bulunmamaktadır.</p>
              <Button className="mt-4" size="sm">
                Yeni Tur Keşfet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Hesap Özeti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Toplam Harcama</span>
            <span className="font-semibold">{formatPrice(stats.totalSpent)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sadakat Puanı</span>
            <span className="font-semibold">{stats.loyaltyPoints} puan</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Üyelik Durumu</span>
            <Badge variant="secondary">Standart</Badge>
          </div>
          <Separator />
          <Button className="w-full" variant="outline">
            <Gift className="h-4 w-4 mr-2" />
            Puanları Kullan
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Hızlı İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="ghost">
            <User className="h-4 w-4 mr-2" />
            Profil Bilgilerini Güncelle
          </Button>
          <Button className="w-full justify-start" variant="ghost">
            <Bell className="h-4 w-4 mr-2" />
            Bildirim Ayarları
          </Button>
          <Button className="w-full justify-start" variant="ghost">
            <Heart className="h-4 w-4 mr-2" />
            Favorileri Görüntüle
          </Button>
          <Button className="w-full justify-start" variant="ghost">
            <Download className="h-4 w-4 mr-2" />
            Rezervasyon Belgesi İndir
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface ActivityItemProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  time: string;
}

function ActivityItem({ icon: Icon, iconColor, title, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

interface UpcomingBookingItemProps {
  title: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  participants: number;
}

function UpcomingBookingItem({ title, date, time, status, participants }: UpcomingBookingItemProps) {
  const statusConfig = {
    confirmed: { label: 'Onaylandı', color: 'bg-green-100 text-green-800' },
    pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
    cancelled: { label: 'İptal', color: 'bg-red-100 text-red-800' },
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium">{title}</h4>
        <Badge className={statusConfig[status].color}>
          {statusConfig[status].label}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{date} - {time}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{participants} kişi</span>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4 mr-1" />
          Detay
        </Button>
        {status === 'confirmed' && (
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Bilet
          </Button>
        )}
      </div>
    </div>
  );
}
