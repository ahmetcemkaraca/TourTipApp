'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
  Shield,
  Database,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTours: number;
  activeTours: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  systemHealth: {
    firestoreStatus: string;
    functionsStatus: string;
    storageStatus: string;
    authStatus: string;
  };
  recentActivity: Array<{
    id: string;
    adminEmail: string;
    action: string;
    timestamp: Date;
    details: any;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cloud Functions
  const getAdminDashboardMetrics = httpsCallable(functions, 'getAdminDashboardMetrics');
  const bulkUserOperations = httpsCallable(functions, 'bulkUserOperations');
  const manageUsers = httpsCallable(functions, 'manageUsers');
  const migrateData = httpsCallable(functions, 'migrateData');

  const loadMetrics = async () => {
    try {
      setRefreshing(true);
      const result = await getAdminDashboardMetrics();
      setMetrics(result.data.metrics);
    } catch (error) {
      console.error('Failed to load admin metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMetrics();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Veri Yüklenemedi</h2>
          <p className="text-gray-600 mb-4">Admin metrikleri yüklenirken bir hata oluştu.</p>
          <Button onClick={loadMetrics}>Tekrar Dene</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Sistem yönetimi ve analitik veriler
          </p>
        </div>
        <Button 
          onClick={loadMetrics} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeUsers} aktif kullanıcı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tur</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTours.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeTours} aktif tur
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Rezervasyon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingBookings} beklemede
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{metrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Onaylanmış ödemeler
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>Sistem Durumu</CardTitle>
          <CardDescription>
            Tüm hizmetlerin anlık durumu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(metrics.systemHealth).map(([service, status]) => (
              <div key={service} className="flex items-center space-x-2">
                {getStatusIcon(status)}
                <span className="font-medium capitalize">
                  {service.replace('Status', '')}
                </span>
                <Badge className={getStatusColor(status)}>
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Tools */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Kullanıcı Yönetimi</TabsTrigger>
          <TabsTrigger value="data">Veri İşlemleri</TabsTrigger>
          <TabsTrigger value="security">Güvenlik</TabsTrigger>
          <TabsTrigger value="activity">Aktivite</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Yönetimi</CardTitle>
              <CardDescription>
                Kullanıcı hesaplarını toplu olarak yönetin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Kullanıcıları Listele
                </Button>
                <Button variant="outline" className="justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Rol Güncelle
                </Button>
                <Button variant="outline" className="justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Toplu İçe Aktar
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Kullanıcı Raporu
                </Button>
                <Button variant="outline" className="justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Hesap Dondur
                </Button>
                <Button variant="outline" className="justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hesap Sil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Veri İşlemleri</CardTitle>
              <CardDescription>
                Veritabanı yönetimi ve veri taşıma işlemleri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Veri Taşıma
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Veri Dışa Aktar
                </Button>
                <Button variant="outline" className="justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Veri İçe Aktar
                </Button>
                <Button variant="outline" className="justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cache Temizle
                </Button>
                <Button variant="outline" className="justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Index Optimize Et
                </Button>
                <Button variant="outline" className="justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Yedek Al
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik İşlemleri</CardTitle>
              <CardDescription>
                Sistem güvenliği ve izleme araçları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Güvenlik Taraması
                </Button>
                <Button variant="outline" className="justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Şüpheli Aktivite
                </Button>
                <Button variant="outline" className="justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Oturum Yönetimi
                </Button>
                <Button variant="outline" className="justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Erişim Logları
                </Button>
                <Button variant="outline" className="justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  IP Engelleme
                </Button>
                <Button variant="outline" className="justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Güvenlik Raporu
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
              <CardDescription>
                Admin işlemlerinin geçmişi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.recentActivity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Henüz aktivite bulunmuyor
                  </p>
                ) : (
                  metrics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.adminEmail} tarafından
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {activity.timestamp && new Date(activity.timestamp).toLocaleString('tr-TR')}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground">
                            {Object.keys(activity.details).length} detay
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

