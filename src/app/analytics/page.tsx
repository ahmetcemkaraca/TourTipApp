'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Clock,
  ShoppingCart,
  DollarSign,
  Globe,
  Smartphone,
  Monitor,
  Target,
  Activity,
  Share2,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import useAnalytics, { useEcommerceTracking, useFunnelTracking, useErrorTracking, usePerformanceTracking } from '@/hooks/use-analytics';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    trackEvent, 
    trackPageView, 
    isEnabled, 
    enableAnalytics, 
    disableAnalytics 
  } = useAnalytics();
  
  const { trackAddToCart, trackBeginCheckout } = useEcommerceTracking();
  const { trackFunnelStep, trackBookingFunnel } = useFunnelTracking();
  const { trackError, trackApiError } = useErrorTracking();
  const { trackPageLoadTime, trackApiResponseTime } = usePerformanceTracking();

  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(false);

  // Mock analytics data - in real app, this would come from Firebase Analytics API
  const [analyticsData, setAnalyticsData] = useState({
    realTimeMetrics: {
      activeUsers: 127,
      sessions: 89,
      pageViews: 456,
      events: 1234,
      revenue: 15420,
      conversions: 23,
      bounceRate: 42.5,
      avgSessionDuration: 245,
    },
    topPages: [
      { page: '/tours', views: 234, uniqueViews: 189, avgTime: 180, bounceRate: 35 },
      { page: '/marketplace', views: 156, uniqueViews: 134, avgTime: 210, bounceRate: 28 },
      { page: '/', views: 145, uniqueViews: 98, avgTime: 95, bounceRate: 55 },
      { page: '/booking', views: 89, uniqueViews: 76, avgTime: 320, bounceRate: 15 },
      { page: '/loyalty', views: 67, uniqueViews: 54, avgTime: 160, bounceRate: 40 },
    ],
    topEvents: [
      { event: 'page_view', count: 456, users: 234, value: 0 },
      { event: 'tour_view', count: 123, users: 89, value: 0 },
      { event: 'add_to_cart', count: 67, users: 45, value: 2340 },
      { event: 'purchase', count: 23, users: 23, value: 15420 },
      { event: 'share', count: 34, users: 28, value: 0 },
    ],
    deviceBreakdown: [
      { category: 'mobile', users: 156, sessions: 178, bounceRate: 45, conversionRate: 2.1 },
      { category: 'desktop', users: 98, sessions: 112, bounceRate: 38, conversionRate: 3.2 },
      { category: 'tablet', users: 34, sessions: 41, bounceRate: 52, conversionRate: 1.8 },
    ],
    trafficSources: [
      { source: 'google', medium: 'organic', users: 145, sessions: 167, conversionRate: 2.8, revenue: 8900 },
      { source: 'facebook', medium: 'social', users: 89, sessions: 103, conversionRate: 1.9, revenue: 3200 },
      { source: 'direct', medium: '(none)', users: 67, sessions: 78, conversionRate: 4.1, revenue: 2800 },
      { source: 'instagram', medium: 'social', users: 43, sessions: 52, conversionRate: 1.5, revenue: 520 },
    ],
    conversionFunnel: [
      { step: 'Tour View', users: 1234, rate: 100, dropOff: 0 },
      { step: 'Date Selection', users: 789, rate: 63.9, dropOff: 36.1 },
      { step: 'Participant Info', users: 456, rate: 37.0, dropOff: 26.9 },
      { step: 'Checkout', users: 234, rate: 19.0, dropOff: 18.0 },
      { step: 'Payment', users: 156, rate: 12.6, dropOff: 6.4 },
      { step: 'Confirmation', users: 123, rate: 10.0, dropOff: 2.6 },
    ],
  });

  useEffect(() => {
    // Track page view for analytics page
    trackPageView('/analytics', 'Analytics Dashboard');
    
    // Simulate page load time tracking
    const loadStartTime = performance.now();
    setTimeout(() => {
      const loadTime = performance.now() - loadStartTime;
      trackPageLoadTime(loadTime, 'analytics_dashboard');
    }, 100);
  }, [trackPageView, trackPageLoadTime]);

  const handleRefreshData = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Track API response time
      trackApiResponseTime('/api/analytics/dashboard', 850, true);
      
      toast.success('Analytics verileri yenilendi');
    } catch (error) {
      trackApiError('/api/analytics/dashboard', 500, 'Failed to refresh data');
      toast.error('Veri yenileme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEvent = (eventType: string) => {
    switch (eventType) {
      case 'tour_view':
        trackEvent({
          name: 'view_item',
          parameters: {
            item_id: 'tour_123',
            item_name: 'İstanbul Boğaz Turu',
            item_category: 'tour',
            price: 150,
            currency: 'TRY',
          },
        });
        break;
      
      case 'add_to_cart':
        trackAddToCart({
          item_id: 'tour_123',
          item_name: 'İstanbul Boğaz Turu',
          item_category: 'tour',
          price: 150,
          currency: 'TRY',
        });
        break;
      
      case 'begin_checkout':
        trackBeginCheckout([{
          item_id: 'tour_123',
          item_name: 'İstanbul Boğaz Turu',
          item_category: 'tour',
          price: 150,
          currency: 'TRY',
          quantity: 1,
        }], 150, 'TRY');
        break;
      
      case 'funnel_step':
        trackBookingFunnel('view', 'tour_123');
        break;
      
      case 'error':
        trackError(new Error('Test error for analytics'), 'analytics_demo');
        break;
    }
    
    toast.success(`${eventType} eventi başarıyla gönderildi!`);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Giriş Gerekli</h2>
            <p className="text-gray-600">Analytics dashboard'unu görüntülemek için giriş yapın.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600">Kullanıcı davranışları ve platform performansı</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="1h">Son 1 Saat</option>
            <option value="24h">Son 24 Saat</option>
            <option value="7d">Son 7 Gün</option>
            <option value="30d">Son 30 Gün</option>
          </select>
          <Button onClick={handleRefreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button variant="outline" onClick={() => isEnabled ? disableAnalytics() : enableAnalytics()}>
            {isEnabled ? 'Analytics Devre Dışı' : 'Analytics Etkinleştir'}
          </Button>
        </div>
      </div>

      {/* Real-time Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktif Kullanıcılar</p>
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData.realTimeMetrics.activeUsers}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sayfa Görüntüleme</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatNumber(analyticsData.realTimeMetrics.pageViews)}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Oturum Sayısı</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analyticsData.realTimeMetrics.sessions}
                </p>
              </div>
              <MousePointer className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gelir</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(analyticsData.realTimeMetrics.revenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="pages">Sayfalar</TabsTrigger>
          <TabsTrigger value="events">Etkinlikler</TabsTrigger>
          <TabsTrigger value="audience">Kitle</TabsTrigger>
          <TabsTrigger value="conversions">Dönüşümler</TabsTrigger>
          <TabsTrigger value="testing">Test</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Anahtar Metrikler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Bounce Rate</span>
                      <span className="text-lg font-semibold">{analyticsData.realTimeMetrics.bounceRate}%</span>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg. Session</span>
                      <span className="text-lg font-semibold">
                        {formatDuration(analyticsData.realTimeMetrics.avgSessionDuration)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Dönüşümler</span>
                      <span className="text-lg font-semibold">{analyticsData.realTimeMetrics.conversions}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Etkinlikler</span>
                      <span className="text-lg font-semibold">
                        {formatNumber(analyticsData.realTimeMetrics.events)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Trafik Kaynakları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.trafficSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{source.source}</p>
                        <p className="text-sm text-gray-600">{source.medium}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{source.users} kullanıcı</p>
                        <p className="text-sm text-gray-600">%{source.conversionRate} dönüşüm</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Cihaz Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analyticsData.deviceBreakdown.map((device, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold capitalize">{device.category}</h3>
                      {device.category === 'mobile' && <Smartphone className="h-5 w-5 text-blue-500" />}
                      {device.category === 'desktop' && <Monitor className="h-5 w-5 text-green-500" />}
                      {device.category === 'tablet' && <Smartphone className="h-5 w-5 text-purple-500" />}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Kullanıcılar:</span>
                        <span className="font-medium">{device.users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Oturumlar:</span>
                        <span className="font-medium">{device.sessions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bounce Rate:</span>
                        <span className="font-medium">{device.bounceRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Dönüşüm:</span>
                        <span className="font-medium">{device.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>En Popüler Sayfalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{page.page}</p>
                      <p className="text-sm text-gray-600">{page.views} görüntüleme</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Benzersiz</p>
                        <p className="font-semibold">{page.uniqueViews}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Süre</p>
                        <p className="font-semibold">{formatDuration(page.avgTime)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bounce</p>
                        <p className="font-semibold">{page.bounceRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>En Sık Gerçekleşen Etkinlikler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{event.event}</p>
                      <p className="text-sm text-gray-600">{event.users} benzersiz kullanıcı</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{event.count}</p>
                      {event.value > 0 && (
                        <p className="text-sm text-green-600">{formatCurrency(event.value)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı Segmentleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Yeni Kullanıcılar</h3>
                    <div className="flex justify-between">
                      <span>Kullanıcılar: 156</span>
                      <span>%68.4</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Geri Dönen Kullanıcılar</h3>
                    <div className="flex justify-between">
                      <span>Kullanıcılar: 72</span>
                      <span>%31.6</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Kayıtlı Kullanıcılar</h3>
                    <div className="flex justify-between">
                      <span>Kullanıcılar: 89</span>
                      <span>%39.0</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coğrafi Dağılım</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { country: 'Türkiye', users: 145, sessions: 178 },
                    { country: 'Almanya', users: 34, sessions: 41 },
                    { country: 'İngiltere', users: 23, sessions: 28 },
                    { country: 'Fransa', users: 18, sessions: 22 },
                    { country: 'Diğer', users: 8, sessions: 11 },
                  ].map((location, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{location.country}</span>
                      <div className="text-right">
                        <p className="font-semibold">{location.users} kullanıcı</p>
                        <p className="text-sm text-gray-600">{location.sessions} oturum</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversions Tab */}
        <TabsContent value="conversions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Rezervasyon Hunisi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.conversionFunnel.map((step, index) => (
                  <div key={index} className="flex items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{step.step}</p>
                          <p className="text-sm text-gray-600">{step.users} kullanıcı</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{step.rate.toFixed(1)}%</p>
                      {step.dropOff > 0 && (
                        <p className="text-sm text-red-600">-{step.dropOff.toFixed(1)}%</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Test Araçları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  onClick={() => handleTestEvent('tour_view')}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  variant="outline"
                >
                  <Eye className="h-6 w-6" />
                  <span>Tur Görüntüleme</span>
                </Button>

                <Button 
                  onClick={() => handleTestEvent('add_to_cart')}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  variant="outline"
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span>Sepete Ekleme</span>
                </Button>

                <Button 
                  onClick={() => handleTestEvent('begin_checkout')}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  variant="outline"
                >
                  <DollarSign className="h-6 w-6" />
                  <span>Ödeme Başlat</span>
                </Button>

                <Button 
                  onClick={() => handleTestEvent('funnel_step')}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  variant="outline"
                >
                  <Target className="h-6 w-6" />
                  <span>Huni Adımı</span>
                </Button>

                <Button 
                  onClick={() => handleTestEvent('error')}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  variant="outline"
                >
                  <Activity className="h-6 w-6" />
                  <span>Hata İzleme</span>
                </Button>

                <Button 
                  onClick={() => trackEvent({ name: 'custom_test_event', parameters: { test: true } })}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  variant="outline"
                >
                  <Share2 className="h-6 w-6" />
                  <span>Özel Etkinlik</span>
                </Button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Analytics Durumu</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Analytics Etkin:</span>
                    <Badge variant={isEnabled ? 'default' : 'secondary'}>
                      {isEnabled ? 'Evet' : 'Hayır'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Kullanıcı ID:</span>
                    <span className="font-mono text-sm">{user?.uid.substring(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sayfa:</span>
                    <span>/analytics</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Sistem Implementasyon Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Tamamlanan Özellikler</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Firebase Analytics entegrasyonu</li>
                <li>• GA4 custom events implementasyonu</li>
                <li>• E-commerce tracking (enhanced)</li>
                <li>• User properties ve segmentation</li>
                <li>• Conversion funnel tracking</li>
                <li>• Real-time analytics hooks</li>
                <li>• Error ve performance tracking</li>
                <li>• Custom dimensions yapılandırması</li>
                <li>• Event validation ve sanitization</li>
                <li>• Automatic page view tracking</li>
                <li>• User engagement metrics</li>
                <li>• Cloud Functions analytics triggers</li>
                <li>• Analytics dashboard UI</li>
                <li>• Multi-device tracking support</li>
                <li>• GDPR compliance hooks</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">🔄 Geliştirme Aşamasında</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• BigQuery export integration</li>
                <li>• Custom analytics reports</li>
                <li>• Advanced audience segmentation</li>
                <li>• Predictive analytics</li>
                <li>• A/B testing integration</li>
                <li>• Attribution modeling</li>
                <li>• Cross-platform user journeys</li>
                <li>• Revenue optimization insights</li>
                <li>• Cohort analysis tools</li>
                <li>• Marketing attribution</li>
                <li>• Customer lifetime value tracking</li>
                <li>• Smart alerts ve anomaly detection</li>
                <li>• Export to external BI tools</li>
                <li>• Voice of customer analytics</li>
                <li>• Machine learning insights</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
