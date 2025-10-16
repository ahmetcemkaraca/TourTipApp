'use client';

import React, { useEffect } from 'react';
import { usePerformance } from '@/hooks/use-performance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, TrendingDown } from 'lucide-react';

export default function PerformancePage() {
  const { 
    performance, 
    getReport, 
    startMonitoring, 
    stopMonitoring, 
    measureOperation 
  } = usePerformance();

  useEffect(() => {
    getReport();
  }, [getReport]);

  const getCoreWebVitalStatus = (metric: string, value: number) => {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'needs-improvement':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'needs-improvement':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const testPerformanceOperation = async () => {
    await measureOperation('test_operation', async () => {
      // Simulate some async work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
      
      // Simulate API call
      await fetch('/api/test-endpoint');
      
      return 'Operation completed';
    });
    
    getReport();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performans İzleme</h1>
          <p className="text-muted-foreground">
            Uygulama performansını izleyin ve optimize edin
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={performance.isMonitoring ? stopMonitoring : startMonitoring}
            variant={performance.isMonitoring ? 'destructive' : 'default'}
          >
            {performance.isMonitoring ? 'İzlemeyi Durdur' : 'İzlemeyi Başlat'}
          </Button>
          <Button onClick={getReport} variant="outline">
            Raporu Yenile
          </Button>
          <Button onClick={testPerformanceOperation} variant="outline">
            Test İşlemi
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="core-vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="metrics">Metrikler</TabsTrigger>
          <TabsTrigger value="recommendations">Öneriler</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Aktif İzleme
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performance.isMonitoring ? 'Aktif' : 'Pasif'}
                </div>
                <Badge 
                  variant={performance.isMonitoring ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {performance.isMonitoring ? 'Çalışıyor' : 'Durduruldu'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Toplam Metrik
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance.metrics.length}</div>
                <p className="text-xs text-muted-foreground">
                  Kaydedilen metrik sayısı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Core Web Vitals
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(performance.coreWebVitals).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ölçülen vital metrikleri
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Öneriler
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance.recommendations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Performans önerisi
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="core-vitals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(performance.coreWebVitals).map(([metric, value]) => {
              const status = getCoreWebVitalStatus(metric, value);
              return (
                <Card key={metric}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {metric.toUpperCase()}
                    </CardTitle>
                    {getStatusIcon(status)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {value.toFixed(2)}
                      {metric === 'cls' ? '' : 'ms'}
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {status === 'good' && 'İyi'}
                      {status === 'needs-improvement' && 'Geliştirilmeli'}
                      {status === 'poor' && 'Kötü'}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {Object.keys(performance.coreWebVitals).length === 0 && (
            <Card>
              <CardContent className="text-center py-6">
                <p className="text-muted-foreground">
                  Henüz Core Web Vitals verisi bulunmuyor. 
                  Sayfayla etkileşim kurun ve verilerin toplanmasını bekleyin.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performans Metrikleri</CardTitle>
              <CardDescription>
                Kaydedilen tüm performans metrikleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performance.metrics.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Henüz metrik verisi bulunmuyor
                  </p>
                ) : (
                  performance.metrics.slice(-10).reverse().map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{metric.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {metric.duration ? `${metric.duration.toFixed(2)}ms` : 'Devam ediyor'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {new Date(metric.startTime).toLocaleTimeString()}
                        </p>
                        {metric.attributes && (
                          <div className="flex gap-1 mt-1">
                            {Object.entries(metric.attributes).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performans Önerileri</CardTitle>
              <CardDescription>
                Uygulamanızın performansını artırmak için öneriler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performance.recommendations.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Harika! Şu anda performans önerisi bulunmuyor.
                    </p>
                  </div>
                ) : (
                  performance.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Genel Optimizasyon İpuçları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900">Görselleri Optimize Edin</h4>
                    <p className="text-sm text-blue-700">
                      Next.js Image bileşenini kullanın ve modern formatları (WebP, AVIF) tercih edin.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900">Code Splitting Kullanın</h4>
                    <p className="text-sm text-green-700">
                      Dynamic imports ile bileşenleri lazy loading yapın.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-purple-900">Caching Stratejileri</h4>
                    <p className="text-sm text-purple-700">
                      Firebase offline persistence ve uygun cache headers kullanın.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
