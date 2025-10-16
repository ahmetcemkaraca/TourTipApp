'use client';

import React, { useState } from 'react';
import { useMobile, usePWA, usePerformance } from '@/hooks/use-mobile';
import MobileContainer from '@/components/mobile/MobileContainer';
import Touchable from '@/components/mobile/Touchable';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  WifiOff, 
  Battery, 
  Cpu, 
  Zap,
  Download,
  Share2,
  Vibrate,
  Camera,
  MapPin,
  Fingerprint
} from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';

const MobileDemoPage: React.FC = () => {
  const { 
    deviceInfo, 
    isMobile, 
    isTablet, 
    isTouch, 
    orientation, 
    safeAreaInsets,
    vibrate,
    share,
    copyToClipboard
  } = useMobile();

  const { 
    capabilities: pwaCapabilities, 
    canInstall, 
    isStandalone,
    promptInstall 
  } = usePWA();

  const { 
    metrics, 
    isSlowDevice, 
    memoryPressure, 
    measurePerformance 
  } = usePerformance();

  const [actionFeedback, setActionFeedback] = useState<string>('');

  const handleVibrate = () => {
    vibrate([100, 50, 100]);
    setActionFeedback('Cihaz titredi!');
    setTimeout(() => setActionFeedback(''), 2000);
  };

  const handleShare = async () => {
    try {
      await share({
        title: 'TourTrip.app Mobile Demo',
        text: 'Mobil optimizasyonu deneyin!',
        url: window.location.href,
      });
      setActionFeedback('Paylaşım başarılı!');
    } catch (error) {
      setActionFeedback('Paylaşım başarısız');
    }
    setTimeout(() => setActionFeedback(''), 2000);
  };

  const handleCopy = async () => {
    await copyToClipboard(window.location.href);
    setActionFeedback('Link kopyalandı!');
    setTimeout(() => setActionFeedback(''), 2000);
  };

  const handleInstallPWA = async () => {
    if (canInstall) {
      await promptInstall();
      setActionFeedback('PWA yükleme istemi gösterildi');
    } else {
      setActionFeedback('PWA yüklenemez veya zaten yüklü');
    }
    setTimeout(() => setActionFeedback(''), 3000);
  };

  const getDeviceIcon = () => {
    if (isMobile) return <Smartphone className="h-5 w-5" />;
    if (isTablet) return <Tablet className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const getNetworkIcon = () => {
    return deviceInfo.capabilities.network.type !== 'unknown' ? 
      <Wifi className="h-5 w-5" /> : 
      <WifiOff className="h-5 w-5" />;
  };

  const getPerformanceColor = () => {
    if (memoryPressure === 'high') return 'text-red-500';
    if (memoryPressure === 'medium') return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <>
      <SEOHead
        config={{
          title: 'Mobile Optimizations - TourTrip.app',
          description: 'TourTrip.app mobile optimization features demo. Touch gestures, PWA capabilities, performance monitoring.',
          canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/mobile`,
          openGraph: {
            title: 'Mobile Features Demo',
            description: 'Experience TourTrip.app\'s mobile-first design and features',
          },
        }}
      />
      
      <MobileContainer safeArea fullHeight className="p-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              📱 Mobile Optimizations
            </h1>
            <p className="text-gray-600">
              TourTrip.app'in mobil optimizasyon özelliklerini test edin
            </p>
          </div>

          {/* Feedback Alert */}
          {actionFeedback && (
            <Alert className="bg-green-50 border-green-200">
              <Zap className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {actionFeedback}
              </AlertDescription>
            </Alert>
          )}

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getDeviceIcon()}
                Cihaz Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Badge variant={isMobile ? 'default' : 'secondary'}>
                    {deviceInfo.type.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Cihaz Türü</p>
                </div>
                
                <div className="text-center">
                  <Badge variant={deviceInfo.platform === 'web' ? 'secondary' : 'default'}>
                    {deviceInfo.platform.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Platform</p>
                </div>
                
                <div className="text-center">
                  <Badge variant={isTouch ? 'default' : 'secondary'}>
                    {isTouch ? 'TOUCH' : 'NO TOUCH'}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Dokunmatik</p>
                </div>
                
                <div className="text-center">
                  <Badge variant="outline">
                    {orientation.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Yönelim</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Ekran Çözünürlüğü:</span><br />
                  {deviceInfo.screenWidth} × {deviceInfo.screenHeight}
                </div>
                <div>
                  <span className="font-medium">Pixel Oranı:</span><br />
                  {deviceInfo.pixelRatio}×
                </div>
              </div>

              {/* Safe Area Insets */}
              {(safeAreaInsets.top > 0 || safeAreaInsets.bottom > 0) && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-sm mb-2">Güvenli Alan Kenar Boşlukları:</p>
                  <div className="grid grid-cols-4 gap-2 text-xs text-center">
                    <div>Üst: {safeAreaInsets.top}px</div>
                    <div>Sağ: {safeAreaInsets.right}px</div>
                    <div>Alt: {safeAreaInsets.bottom}px</div>
                    <div>Sol: {safeAreaInsets.left}px</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Touch Interactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vibrate className="h-5 w-5" />
                Dokunmatik Etkileşimler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Touchable
                  onPress={handleVibrate}
                  className="p-4 bg-purple-100 rounded-lg text-center hover:bg-purple-200"
                >
                  <Vibrate className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">Titreşim</p>
                  <p className="text-sm text-gray-600">Dokun ve titreşimi hisset</p>
                </Touchable>

                <Touchable
                  onPress={handleShare}
                  className="p-4 bg-blue-100 rounded-lg text-center hover:bg-blue-200"
                >
                  <Share2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium">Paylaş</p>
                  <p className="text-sm text-gray-600">Native share dialog</p>
                </Touchable>

                <Touchable
                  onPress={handleCopy}
                  className="p-4 bg-green-100 rounded-lg text-center hover:bg-green-200"
                >
                  <Download className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Kopyala</p>
                  <p className="text-sm text-gray-600">Linki panoya kopyala</p>
                </Touchable>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>İpucu:</strong> Bu kartlara dokunun, uzun basın veya kaydırın. 
                  Mobil cihazlarda haptic feedback alacaksınız.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* PWA Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                PWA Özellikleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Badge variant={pwaCapabilities.installable ? 'default' : 'secondary'}>
                    {pwaCapabilities.installable ? 'VAR' : 'YOK'}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Yüklenebilir</p>
                </div>
                
                <div className="text-center">
                  <Badge variant={isStandalone ? 'default' : 'secondary'}>
                    {isStandalone ? 'STANDALONE' : 'BROWSER'}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Çalışma Modu</p>
                </div>
                
                <div className="text-center">
                  <Badge variant="outline">
                    {pwaCapabilities.displayMode.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Görünüm</p>
                </div>
                
                <div className="text-center">
                  <Badge variant={pwaCapabilities.isInstalled ? 'default' : 'secondary'}>
                    {pwaCapabilities.isInstalled ? 'YÜKLÜ' : 'DEĞIL'}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Durum</p>
                </div>
              </div>

              <Button 
                onClick={handleInstallPWA}
                disabled={!canInstall}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {canInstall ? 'PWA Yükle' : 'PWA Yüklenemez'}
              </Button>
            </CardContent>
          </Card>

          {/* Device Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Cihaz Yetenekleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries({
                  'Kamera': { icon: Camera, value: deviceInfo.capabilities.camera },
                  'Konum': { icon: MapPin, value: deviceInfo.capabilities.geolocation },
                  'Titreşim': { icon: Vibrate, value: deviceInfo.capabilities.vibration },
                  'Biyometrik': { icon: Fingerprint, value: deviceInfo.capabilities.biometrics },
                }).map(([name, { icon: Icon, value }]) => (
                  <div key={name} className="text-center">
                    <Icon className={`h-8 w-8 mx-auto mb-2 ${value ? 'text-green-500' : 'text-gray-400'}`} />
                    <p className="font-medium">{name}</p>
                    <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                      {value ? 'Desteklenir' : 'Desteklenmez'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Network Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getNetworkIcon()}
                Ağ Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Badge variant="outline">
                    {deviceInfo.capabilities.network.type.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Bağlantı Türü</p>
                </div>
                
                <div className="text-center">
                  <Badge variant="outline">
                    {deviceInfo.capabilities.network.effectiveType.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Hız</p>
                </div>
                
                <div className="text-center">
                  <span className="text-lg font-bold">{deviceInfo.capabilities.network.downlink}</span>
                  <p className="text-sm text-gray-600">Mbps</p>
                </div>
                
                <div className="text-center">
                  <span className="text-lg font-bold">{deviceInfo.capabilities.network.rtt}</span>
                  <p className="text-sm text-gray-600">ms RTT</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5" />
                Performans Metrikleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Cihaz Hızı:</span>
                <Badge variant={isSlowDevice ? 'destructive' : 'default'}>
                  {isSlowDevice ? 'Yavaş Cihaz' : 'Hızlı Cihaz'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Bellek Kullanımı:</span>
                <Badge variant="outline" className={getPerformanceColor()}>
                  {memoryPressure.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>İlk İçerik Boyama:</span>
                  <span>{metrics.firstContentfulPaint.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ağ Gecikmesi:</span>
                  <span>{metrics.networkLatency.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bellek Kullanımı:</span>
                  <span>{(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</span>
                </div>
              </div>

              <Button 
                onClick={() => {
                  const end = measurePerformance('Manual Test');
                  setTimeout(end, 100);
                  setActionFeedback('Performans ölçümü tamamlandı!');
                  setTimeout(() => setActionFeedback(''), 2000);
                }}
                variant="outline"
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Performans Testi Çalıştır
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileContainer>
    </>
  );
};

export default MobileDemoPage;
