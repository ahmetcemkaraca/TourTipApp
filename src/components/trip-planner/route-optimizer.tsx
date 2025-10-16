'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Route, 
  Navigation, 
  Clock, 
  MapPin, 
  Car, 
  Zap, 
  RotateCcw,
  Download,
  Share2,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface RouteOptimizerProps {
  currentTrip: any;
}

interface RoutePoint {
  id: string;
  activityId: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  estimatedDuration: number;
  travelTime: number;
  order: number;
  category: string;
}

interface OptimizationSettings {
  transportMode: 'driving' | 'walking' | 'transit' | 'bicycling';
  prioritizeTime: boolean;
  prioritizeCost: boolean;
  avoidTolls: boolean;
  avoidHighways: boolean;
  maxWalkingDistance: number; // in meters
}

export function RouteOptimizer({ currentTrip }: RouteOptimizerProps) {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<RoutePoint[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>({
    transportMode: 'driving',
    prioritizeTime: true,
    prioritizeCost: false,
    avoidTolls: false,
    avoidHighways: false,
    maxWalkingDistance: 1000,
  });
  const [routeStats, setRouteStats] = useState({
    totalDistance: 0,
    totalTime: 0,
    estimatedCost: 0,
    optimizationScore: 0,
  });

  // Mock route points from current trip
  useEffect(() => {
    if (currentTrip?.activities) {
      const points: RoutePoint[] = currentTrip.activities.map((activity: any, index: number) => ({
        id: activity.id,
        activityId: activity.id,
        name: activity.name,
        address: activity.location?.address || activity.location?.name || '',
        location: {
          latitude: activity.location?.latitude || 41.0082 + (Math.random() - 0.5) * 0.01,
          longitude: activity.location?.longitude || 28.9784 + (Math.random() - 0.5) * 0.01,
        },
        estimatedDuration: activity.duration || 2,
        travelTime: Math.round(Math.random() * 30 + 5), // Mock travel time
        order: index,
        category: activity.category || 'activity',
      }));
      setRoutePoints(points);
      setOptimizedRoute([...points]);
    }
  }, [currentTrip]);

  const handleOptimizeRoute = async () => {
    if (routePoints.length < 2) {
      toast.error('Rota optimizasyonu için en az 2 aktivite gerekli.');
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock optimization algorithm - in real implementation, use Google Maps Directions API
      const optimized = [...routePoints].sort((a, b) => {
        if (optimizationSettings.prioritizeTime) {
          return a.travelTime - b.travelTime;
        }
        return Math.random() - 0.5; // Random for demo
      }).map((point, index) => ({
        ...point,
        order: index,
        travelTime: Math.max(5, point.travelTime - Math.random() * 10), // Reduced travel time
      }));

      setOptimizedRoute(optimized);
      
      // Calculate stats
      const totalTime = optimized.reduce((sum, point) => sum + point.travelTime + point.estimatedDuration, 0);
      const totalDistance = optimized.reduce((sum, point) => sum + point.travelTime * 2, 0); // Mock distance calculation
      const optimizationScore = Math.min(95, 70 + Math.random() * 25);
      
      setRouteStats({
        totalDistance,
        totalTime,
        estimatedCost: calculateEstimatedCost(totalDistance, optimizationSettings.transportMode),
        optimizationScore,
      });

      toast.success('Rota optimize edildi!');
    } catch (error) {
      toast.error('Rota optimizasyonu sırasında hata oluştu.');
      console.error('Optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const calculateEstimatedCost = (distance: number, mode: string): number => {
    const rates = {
      driving: 0.15, // per km
      walking: 0,
      transit: 0.05,
      bicycling: 0.02,
    };
    return distance * (rates[mode as keyof typeof rates] || 0);
  };

  const handleResetRoute = () => {
    setOptimizedRoute([...routePoints]);
    setRouteStats({
      totalDistance: 0,
      totalTime: 0,
      estimatedCost: 0,
      optimizationScore: 0,
    });
  };

  const handleExportRoute = () => {
    const routeData = {
      points: optimizedRoute,
      stats: routeStats,
      settings: optimizationSettings,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(routeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${currentTrip?.title || 'plan'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Rota dışa aktarıldı!');
  };

  const getTransportIcon = (mode: string) => {
    const icons = {
      driving: Car,
      walking: Navigation,
      transit: Route,
      bicycling: Route,
    };
    return icons[mode as keyof typeof icons] || Car;
  };

  if (!currentTrip || !routePoints.length) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">Rota Optimizasyonu</h3>
          <p className="text-muted-foreground">
            Rota optimize etmek için önce bir gezi planı oluşturun ve aktivite ekleyin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Optimization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Optimizasyon Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ulaşım Yöntemi</label>
              <Select 
                value={optimizationSettings.transportMode} 
                onValueChange={(value: any) => 
                  setOptimizationSettings(prev => ({ ...prev, transportMode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driving">🚗 Araba</SelectItem>
                  <SelectItem value="walking">🚶 Yürüme</SelectItem>
                  <SelectItem value="transit">🚌 Toplu Taşıma</SelectItem>
                  <SelectItem value="bicycling">🚴 Bisiklet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Öncelik</label>
              <Select 
                value={optimizationSettings.prioritizeTime ? 'time' : 'cost'} 
                onValueChange={(value) => 
                  setOptimizationSettings(prev => ({ 
                    ...prev, 
                    prioritizeTime: value === 'time',
                    prioritizeCost: value === 'cost'
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">⏱️ Zaman Tasarrufu</SelectItem>
                  <SelectItem value="cost">💰 Maliyet Tasarrufu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex gap-2">
                <Button onClick={handleOptimizeRoute} disabled={isOptimizing} className="flex-1">
                  {isOptimizing ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Optimize Ediliyor...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Optimize Et
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleResetRoute}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={optimizationSettings.avoidTolls}
                onChange={(e) => setOptimizationSettings(prev => ({ 
                  ...prev, 
                  avoidTolls: e.target.checked 
                }))}
                className="rounded"
              />
              <span className="text-sm">Ücretli yolları önle</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={optimizationSettings.avoidHighways}
                onChange={(e) => setOptimizationSettings(prev => ({ 
                  ...prev, 
                  avoidHighways: e.target.checked 
                }))}
                className="rounded"
              />
              <span className="text-sm">Otoyolları önle</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Route Stats */}
      {routeStats.optimizationScore > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Optimizasyon Sonuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(routeStats.totalDistance)} km
                </div>
                <div className="text-sm text-muted-foreground">Toplam Mesafe</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(routeStats.totalTime / 60)}h {routeStats.totalTime % 60}m
                </div>
                <div className="text-sm text-muted-foreground">Toplam Süre</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ₺{routeStats.estimatedCost.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Tahmini Maliyet</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(routeStats.optimizationScore)}%
                </div>
                <div className="text-sm text-muted-foreground">Optimizasyon Skoru</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimized Route */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Optimize Edilmiş Rota ({optimizedRoute.length} Aktivite)
            </CardTitle>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportRoute}>
                <Download className="h-4 w-4 mr-2" />
                Dışa Aktar
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Paylaş
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {optimizedRoute.map((point, index) => {
              const TransportIcon = getTransportIcon(optimizationSettings.transportMode);
              const isLast = index === optimizedRoute.length - 1;
              
              return (
                <div key={point.id} className="relative">
                  <RoutePointCard
                    point={point}
                    index={index}
                    transportMode={optimizationSettings.transportMode}
                  />
                  
                  {!isLast && (
                    <div className="flex items-center justify-center my-2">
                      <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs">
                        <TransportIcon className="h-3 w-3" />
                        <span>{point.travelTime} dk</span>
                        <span className="text-muted-foreground">→</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Route Warnings */}
      {routeStats.optimizationScore > 0 && routeStats.optimizationScore < 70 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800 mb-1">Optimizasyon Uyarısı</h4>
                <p className="text-sm text-orange-700">
                  Rota optimizasyon skoru düşük. Aktivite sıralamasını veya ulaşım yöntemini 
                  değiştirerek daha iyi sonuçlar elde edebilirsiniz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface RoutePointCardProps {
  point: RoutePoint;
  index: number;
  transportMode: string;
}

function RoutePointCard({ point, index, transportMode }: RoutePointCardProps) {
  const getCategoryColor = (category: string) => {
    const colors = {
      tour: 'bg-blue-100 text-blue-800',
      restaurant: 'bg-orange-100 text-orange-800',
      accommodation: 'bg-purple-100 text-purple-800',
      transport: 'bg-green-100 text-green-800',
      activity: 'bg-yellow-100 text-yellow-800',
      shopping: 'bg-pink-100 text-pink-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Order Number */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            {index + 1}
          </div>
          
          {/* Point Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{point.name}</h4>
              <Badge className={getCategoryColor(point.category)}>
                {point.category}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{point.address}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{point.estimatedDuration}h aktivite</span>
              </div>
              
              <div className="text-muted-foreground">
                Sıra: {point.order + 1}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
