'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Building2,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Activity,
  Settings,
  FileText,
  MessageSquare,
  BarChart3,
  Database,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { AdminOverview } from './admin-overview';
import { UserManagement } from './user-management';
import { ProviderManagement } from './provider-management';
import { ContentModeration } from './content-moderation';
import { SystemSettings } from './system-settings';
import { AdminAnalytics } from './admin-analytics';

interface AdminStats {
  users: {
    total: number;
    verified: number;
    active: number;
    newToday: number;
  };
  providers: {
    total: number;
    verified: number;
    pending: number;
    active: number;
  };
  services: {
    total: number;
    active: number;
    pending: number;
    featured: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
  };
  system: {
    uptime: string;
    responseTime: number;
    errorRate: number;
    storage: number;
  };
  moderation: {
    pendingReviews: number;
    reportedContent: number;
    flaggedUsers: number;
  };
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      // TODO: Fetch actual admin stats from Firestore
      // TODO: Load real admin stats from Firestore
      const stats: AdminStats = {
        users: {
          total: 12847,
          verified: 11203,
          active: 8934,
          newToday: 47,
        },
        providers: {
          total: 324,
          verified: 289,
          pending: 23,
          active: 267,
        },
        services: {
          total: 1567,
          active: 1234,
          pending: 89,
          featured: 156,
        },
        bookings: {
          total: 8934,
          pending: 123,
          confirmed: 567,
          completed: 8244,
        },
        system: {
          uptime: '99.9%',
          responseTime: 245,
          errorRate: 0.02,
          storage: 78.5,
        },
        moderation: {
          pendingReviews: 34,
          reportedContent: 12,
          flaggedUsers: 7,
        },
      };
      
      // TODO: Load from Firestore
      setStats({
        totalUsers: 0,
        totalProviders: 0,
        totalBookings: 0,
        totalRevenue: 0,
        recentBookings: [],
        topTours: [],
        revenueChart: [],
        userGrowth: []
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Yetki Hatası</h2>
            <p className="text-muted-foreground mb-6">
              Bu sayfaya erişim yetkiniz bulunmuyor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Admin Dashboard', current: true },
          ]} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                TourTrip platformunu yönetin ve izleyin
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadAdminStats}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Sistem Ayarları
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminStatsCard
            title="Toplam Kullanıcı"
            value={stats.users.total.toLocaleString()}
            subtitle={`${stats.users.newToday} yeni bugün`}
            icon={Users}
            color="blue"
            trend="+12%"
          />
          
          <AdminStatsCard
            title="Aktif Sağlayıcı"
            value={stats.providers.active.toLocaleString()}
            subtitle={`${stats.providers.pending} onay bekliyor`}
            icon={Building2}
            color="green"
            trend="+8%"
          />
          
          <AdminStatsCard
            title="Toplam Tur"
            value={stats.services.total.toLocaleString()}
            subtitle={`${stats.services.pending} onay bekliyor`}
            icon={MapPin}
            color="purple"
            trend="+25%"
          />
          
          <AdminStatsCard
            title="Sistem Uptime"
            value={stats.system.uptime}
            subtitle={`${stats.system.responseTime}ms yanıt süresi`}
            icon={Activity}
            color="orange"
            trend="99.9%"
          />
        </div>

        {/* Critical Alerts */}
        {(stats.moderation.pendingReviews > 0 || stats.moderation.reportedContent > 0) && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                Acil Dikkat Gereken Konular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.moderation.pendingReviews > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <MessageSquare className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">
                        {stats.moderation.pendingReviews} Değerlendirme
                      </p>
                      <p className="text-sm text-yellow-700">Moderasyon bekliyor</p>
                    </div>
                    <Button size="sm" variant="outline">
                      İncele
                    </Button>
                  </div>
                )}
                
                {stats.moderation.reportedContent > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">
                        {stats.moderation.reportedContent} Şikayet
                      </p>
                      <p className="text-sm text-red-700">İnceleme gerekiyor</p>
                    </div>
                    <Button size="sm" variant="outline">
                      İncele
                    </Button>
                  </div>
                )}
                
                {stats.moderation.flaggedUsers > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <Users className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-800">
                        {stats.moderation.flaggedUsers} Kullanıcı
                      </p>
                      <p className="text-sm text-orange-700">İşlem gerekiyor</p>
                    </div>
                    <Button size="sm" variant="outline">
                      İncele
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Genel Bakış</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Kullanıcılar</span>
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Sağlayıcılar</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">İçerik</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analitik</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Ayarlar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview stats={stats} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="providers">
            <ProviderManagement />
          </TabsContent>

          <TabsContent value="content">
            <ContentModeration />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface AdminStatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend: string;
}

function AdminStatsCard({ title, value, subtitle, icon: Icon, color, trend }: AdminStatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
          <span className="text-sm font-medium text-green-600">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
