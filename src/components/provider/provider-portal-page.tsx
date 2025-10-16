'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Users,
  Star,
  Eye,
  Plus,
  Settings,
  BarChart3,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Camera,
  Edit
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { ProviderDashboard } from './provider-dashboard';
import { ProviderListings } from './provider-listings';
import { ProviderBookings } from './provider-bookings';
import { ProviderAnalytics } from './provider-analytics';
import { ProviderSettings } from './provider-settings';
import { ProviderProfile } from './provider-profile';

interface ProviderData {
  id: string;
  companyName: string;
  businessType: 'individual' | 'company' | 'agency';
  description: string;
  logo?: string;
  coverImage?: string;
  verification: {
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: Date;
  };
  statistics: {
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
    activeListings: number;
    viewCount: number;
  };
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
    address: {
      city: string;
      country: string;
    };
  };
}

export function ProviderPortalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviderData();
  }, [user]);

  const loadProviderData = async () => {
    try {
      setLoading(true);
      // TODO: Fetch actual provider data from Firestore
      const mockData: ProviderData = {
        id: 'provider-001',
        companyName: 'Kapadokya Macera Turları',
        businessType: 'company',
        description: 'Kapadokya\'da unutulmaz deneyimler sunan profesyonel tur operatörü',
        logo: '/placeholder-logo.png',
        coverImage: '/placeholder-cover.jpg',
        verification: {
          status: 'verified',
          verifiedAt: new Date('2024-01-15'),
        },
        statistics: {
          totalBookings: 248,
          totalRevenue: 125000,
          averageRating: 4.8,
          totalReviews: 89,
          activeListings: 12,
          viewCount: 5420,
        },
        contactInfo: {
          email: 'info@kapadokyamacera.com',
          phone: '+90 384 123 45 67',
          website: 'https://kapadokyamacera.com',
          address: {
            city: 'Nevşehir',
            country: 'Türkiye',
          },
        },
      };
      
      setProviderData(mockData);
    } catch (error) {
      console.error('Error loading provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    const configs = {
      pending: { label: 'Doğrulama Beklemede', variant: 'outline' as const, color: 'text-yellow-600' },
      verified: { label: 'Doğrulanmış Hesap', variant: 'default' as const, color: 'text-green-600' },
      rejected: { label: 'Doğrulama Reddedildi', variant: 'destructive' as const, color: 'text-red-600' },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!providerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Hizmet Sağlayıcı Hesabı Bulunamadı</h2>
            <p className="text-muted-foreground mb-6">
              Henüz bir hizmet sağlayıcı hesabınız bulunmuyor.
            </p>
            <Button>
              Hizmet Sağlayıcı Ol
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const verificationBadge = getVerificationBadge(providerData.verification.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Hizmet Sağlayıcı Portalı', current: true },
          ]} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Provider Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Provider Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {providerData.logo ? (
                      <img 
                        src={providerData.logo} 
                        alt={providerData.companyName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{providerData.companyName}</h1>
                    <Badge 
                      variant={verificationBadge.variant}
                      className={verificationBadge.color}
                    >
                      {verificationBadge.label}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-3">{providerData.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{providerData.contactInfo.address.city}, {providerData.contactInfo.address.country}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{providerData.statistics.averageRating} ({providerData.statistics.totalReviews} değerlendirme)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{providerData.statistics.totalBookings} rezervasyon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Profili Düzenle
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Tur Ekle
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Bu Ay Gelir"
            value={`₺${providerData.statistics.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="+12%"
            trendUp={true}
          />
          <StatsCard
            title="Aktif Rezervasyon"
            value={providerData.statistics.totalBookings.toString()}
            icon={Calendar}
            trend="+8"
            trendUp={true}
          />
          <StatsCard
            title="Görüntülenme"
            value={providerData.statistics.viewCount.toLocaleString()}
            icon={Eye}
            trend="+25%"
            trendUp={true}
          />
          <StatsCard
            title="Ortalama Puan"
            value={providerData.statistics.averageRating.toString()}
            icon={Star}
            trend="+0.2"
            trendUp={true}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Genel Bakış</span>
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Turlarım</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Rezervasyonlar</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analitik</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Ayarlar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ProviderDashboard providerData={providerData} />
          </TabsContent>

          <TabsContent value="listings">
            <ProviderListings providerId={providerData.id} />
          </TabsContent>

          <TabsContent value="bookings">
            <ProviderBookings providerId={providerData.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <ProviderAnalytics providerId={providerData.id} />
          </TabsContent>

          <TabsContent value="profile">
            <ProviderProfile providerData={providerData} onUpdate={loadProviderData} />
          </TabsContent>

          <TabsContent value="settings">
            <ProviderSettings providerId={providerData.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
}

function StatsCard({ title, value, icon: Icon, trend, trendUp }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className={`text-sm flex items-center gap-1 ${
                trendUp ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-4 w-4 ${trendUp ? '' : 'rotate-180'}`} />
                {trend} geçen aya göre
              </p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
