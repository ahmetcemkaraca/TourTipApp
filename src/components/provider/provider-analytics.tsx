'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  DollarSign,
  Users,
  Star,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    chartData: { month: string; amount: number }[];
  };
  bookings: {
    current: number;
    previous: number;
    growth: number;
    chartData: { month: string; count: number }[];
  };
  customers: {
    total: number;
    returning: number;
    new: number;
    retentionRate: number;
  };
  performance: {
    averageRating: number;
    totalReviews: number;
    responseTime: number; // hours
    conversionRate: number; // percentage
  };
  topServices: {
    id: string;
    name: string;
    bookings: number;
    revenue: number;
    rating: number;
  }[];
  marketingChannels: {
    source: string;
    visitors: number;
    bookings: number;
    conversionRate: number;
  }[];
}

interface ProviderAnalyticsProps {
  providerId: string;
}

export function ProviderAnalytics({ providerId }: ProviderAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last_30_days');

  useEffect(() => {
    loadAnalyticsData();
  }, [providerId, dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // TODO: Fetch actual analytics data from Firestore/Analytics
      // TODO: Load real analytics from Firestore
      const data: AnalyticsData = {
        revenue: {
          current: 28500,
          previous: 22100,
          growth: 28.9,
          chartData: [
            { month: 'Oca', amount: 18500 },
            { month: 'Şub', amount: 22100 },
            { month: 'Mar', amount: 25800 },
            { month: 'Nis', amount: 28500 },
            { month: 'May', amount: 31200 },
            { month: 'Haz', amount: 29800 },
          ],
        },
        bookings: {
          current: 156,
          previous: 132,
          growth: 18.2,
          chartData: [
            { month: 'Oca', count: 98 },
            { month: 'Şub', count: 132 },
            { month: 'Mar', count: 145 },
            { month: 'Nis', count: 156 },
            { month: 'May', count: 168 },
            { month: 'Haz', count: 172 },
          ],
        },
        customers: {
          total: 289,
          returning: 89,
          new: 200,
          retentionRate: 30.8,
        },
        performance: {
          averageRating: 4.7,
          totalReviews: 183,
          responseTime: 2.3,
          conversionRate: 12.5,
        },
        topServices: [
          {
            id: '1',
            name: 'Kapadokya Balon Turu',
            bookings: 89,
            revenue: 75650,
            rating: 4.8,
          },
          {
            id: '2',
            name: 'Göreme Gün Batımı',
            bookings: 34,
            revenue: 14280,
            rating: 4.6,
          },
          {
            id: '3',
            name: 'Ihlara Vadisi Yürüyüş',
            bookings: 23,
            revenue: 5060,
            rating: 4.5,
          },
          {
            id: '4',
            name: 'Kapadokya Fotoğraf Turu',
            bookings: 10,
            revenue: 3200,
            rating: 4.9,
          },
        ],
        marketingChannels: [
          {
            source: 'Organik Arama',
            visitors: 1240,
            bookings: 89,
            conversionRate: 7.2,
          },
          {
            source: 'Google Ads',
            visitors: 890,
            bookings: 67,
            conversionRate: 7.5,
          },
          {
            source: 'Sosyal Medya',
            visitors: 567,
            bookings: 23,
            conversionRate: 4.1,
          },
          {
            source: 'Doğrudan Trafik',
            visitors: 445,
            bookings: 34,
            conversionRate: 7.6,
          },
        ],
      };
      
      // TODO: Load from Firestore
      setAnalyticsData({
        totalRevenue: 0,
        totalBookings: 0,
        avgRating: 0,
        totalViews: 0,
        revenueChart: [],
        bookingsChart: [],
        topServices: [],
        recentBookings: []
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading || !analyticsData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Analitik ve Raporlar</h2>
          <p className="text-muted-foreground">
            İşletmenizin performansını takip edin ve büyüme fırsatlarını keşfedin
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Zaman aralığı" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Son 7 Gün</SelectItem>
              <SelectItem value="last_30_days">Son 30 Gün</SelectItem>
              <SelectItem value="last_90_days">Son 90 Gün</SelectItem>
              <SelectItem value="last_year">Son 1 Yıl</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={loadAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Toplam Gelir"
          value={formatPrice(analyticsData.revenue.current)}
          change={analyticsData.revenue.growth}
          icon={DollarSign}
          comparison={`Önceki dönem: ${formatPrice(analyticsData.revenue.previous)}`}
        />
        
        <MetricCard
          title="Rezervasyon Sayısı"
          value={analyticsData.bookings.current.toString()}
          change={analyticsData.bookings.growth}
          icon={Calendar}
          comparison={`Önceki dönem: ${analyticsData.bookings.previous}`}
        />
        
        <MetricCard
          title="Ortalama Puan"
          value={analyticsData.performance.averageRating.toString()}
          change={8.5} // Mock positive change
          icon={Star}
          comparison={`${analyticsData.performance.totalReviews} değerlendirme`}
        />
        
        <MetricCard
          title="Dönüşüm Oranı"
          value={`${analyticsData.performance.conversionRate}%`}
          change={2.3} // Mock positive change
          icon={Target}
          comparison="Ziyaretçi başına rezervasyon"
        />
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Gelir Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-48 flex items-end justify-between gap-2">
                {analyticsData.revenue.chartData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-primary rounded-t"
                      style={{ 
                        height: `${(data.amount / Math.max(...analyticsData.revenue.chartData.map(d => d.amount))) * 100}%`,
                        minHeight: '20px'
                      }}
                    ></div>
                    <span className="text-xs text-muted-foreground">{data.month}</span>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Son 6 aylık gelir performansı
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              En Popüler Turlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.topServices.map((service, index) => (
              <div key={service.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium line-clamp-1">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {service.bookings} rezervasyon • {service.rating}⭐
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">
                    {formatPrice(service.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Customer Analytics and Marketing Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Müşteri Analizi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{analyticsData.customers.total}</p>
                <p className="text-sm text-muted-foreground">Toplam Müşteri</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{analyticsData.customers.retentionRate}%</p>
                <p className="text-sm text-muted-foreground">Müşteri Sadakati</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Yeni Müşteriler</span>
                <span>{analyticsData.customers.new}</span>
              </div>
              <Progress 
                value={(analyticsData.customers.new / analyticsData.customers.total) * 100} 
                className="h-2" 
              />
              
              <div className="flex justify-between text-sm">
                <span>Tekrar Eden Müşteriler</span>
                <span>{analyticsData.customers.returning}</span>
              </div>
              <Progress 
                value={(analyticsData.customers.returning / analyticsData.customers.total) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Marketing Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Trafik Kaynakları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.marketingChannels.map((channel, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{channel.source}</span>
                  <span className="text-sm text-muted-foreground">
                    {channel.conversionRate}% dönüşüm
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{channel.visitors} ziyaretçi</span>
                  <span>{channel.bookings} rezervasyon</span>
                </div>
                <Progress value={channel.conversionRate * 8} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performans Göstergeleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground/20"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${(analyticsData.performance.averageRating / 5) * 100}, 100`}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{analyticsData.performance.averageRating}</span>
                </div>
              </div>
              <p className="font-medium">Ortalama Puan</p>
              <p className="text-sm text-muted-foreground">5 üzerinden</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-2">
                {analyticsData.performance.responseTime}
              </p>
              <p className="font-medium">Yanıt Süresi</p>
              <p className="text-sm text-muted-foreground">ortalama saat</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 mb-2">
                {analyticsData.performance.conversionRate}%
              </p>
              <p className="font-medium">Dönüşüm Oranı</p>
              <p className="text-sm text-muted-foreground">ziyaretçi/rezervasyon</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {analyticsData.performance.totalReviews}
              </p>
              <p className="font-medium">Toplam Yorum</p>
              <p className="text-sm text-muted-foreground">müşteri geri bildirimi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  comparison: string;
}

function MetricCard({ title, value, change, icon: Icon, comparison }: MetricCardProps) {
  const isPositive = change > 0;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center gap-1 mt-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(change)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{comparison}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
