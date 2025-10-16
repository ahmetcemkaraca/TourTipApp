'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import { 
  Smartphone,
  Wifi,
  Download,
  Bell,
  Sync,
  Share2,
  HardDrive,
  Zap,
  Monitor,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  Clock,
  Trash2,
  RefreshCw,
  Settings,
  Activity,
  Shield,
  Globe
} from 'lucide-react';
import { usePWA, useIsMobile, usePWADisplayMode, useOfflineData } from '@/hooks/use-pwa';
import { useToast } from '@/hooks/use-toast';

export default function PWAPage() {
  const { toast } = useToast();
  const {
    installationStatus,
    networkStatus,
    isOnline,
    notificationsEnabled,
    updateAvailable,
    syncStatus,
    storageUsage,
    appVersion,
    promptInstall,
    requestNotificationPermission,
    showNotification,
    subscribeToPushNotifications,
    checkForUpdates,
    applyUpdate,
    addToSyncQueue,
    clearFailedSyncItems,
    shareContent,
    clearCache,
    trackUsage
  } = usePWA();
  
  const isMobile = useIsMobile();
  const displayMode = usePWADisplayMode();
  const [activeTab, setActiveTab] = useState('overview');
  const [demoNotificationTitle, setDemoNotificationTitle] = useState('TourTrip Bildirimi');
  const [demoNotificationBody, setDemoNotificationBody] = useState('Bu bir demo bildirim mesajıdır!');
  const [offlineData, setOfflineData] = useOfflineData('pwa-demo', { count: 0, lastAction: '' });

  useEffect(() => {
    trackUsage('pwa_page_visited', { displayMode, isMobile });
  }, [trackUsage, displayMode, isMobile]);

  const handleInstallApp = async () => {
    try {
      const success = await promptInstall();
      if (success) {
        toast.success('Uygulama başarıyla yüklendi!');
      }
    } catch (error) {
      toast.error('Yükleme sırasında hata oluştu');
    }
  };

  const handleNotificationPermission = async () => {
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        toast.success('Bildirim izni verildi!');
      } else {
        toast.error('Bildirim izni reddedildi');
      }
    } catch (error) {
      toast.error('İzin isteği sırasında hata oluştu');
    }
  };

  const handleShowNotification = async () => {
    try {
      await showNotification(demoNotificationTitle, {
        body: demoNotificationBody,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'demo-notification',
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'Görüntüle' },
          { action: 'dismiss', title: 'Kapat' }
        ]
      });
      toast.success('Bildirim gönderildi!');
    } catch (error) {
      toast.error('Bildirim gönderilemedi');
    }
  };

  const handlePushSubscription = async () => {
    try {
      const subscription = await subscribeToPushNotifications();
      if (subscription) {
        toast.success('Push bildirimlere abone olundu!');
      } else {
        toast.error('Push bildirim aboneliği başarısız');
      }
    } catch (error) {
      toast.error('Push bildirim hatası');
    }
  };

  const handleCheckUpdates = async () => {
    try {
      const hasUpdate = await checkForUpdates();
      if (hasUpdate) {
        toast.success('Güncelleme mevcut!');
      } else {
        toast.success('Uygulama güncel');
      }
    } catch (error) {
      toast.error('Güncelleme kontrolü başarısız');
    }
  };

  const handleApplyUpdate = async () => {
    try {
      await applyUpdate();
      toast.success('Güncelleme uygulandı!');
    } catch (error) {
      toast.error('Güncelleme uygulanamadı');
    }
  };

  const handleAddToSync = () => {
    const syncId = addToSyncQueue('demo_action', {
      timestamp: Date.now(),
      data: 'Demo sync data'
    });
    
    setOfflineData({
      count: offlineData.count + 1,
      lastAction: `Sync queued: ${syncId}`
    });
    
    toast.success('İşlem senkronizasyon kuyruğuna eklendi');
  };

  const handleClearSyncQueue = () => {
    clearFailedSyncItems();
    toast.success('Başarısız senkronizasyonlar temizlendi');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'TourTrip PWA Demo',
      text: 'TourTrip Progressive Web App özelliklerini keşfedin!',
      url: window.location.href
    };

    try {
      const success = await shareContent(shareData);
      if (success) {
        toast.success('İçerik paylaşıldı!');
      } else {
        toast.error('Paylaşım başarısız');
      }
    } catch (error) {
      toast.error('Paylaşım hatası');
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      toast.success('Önbellek temizlendi!');
    } catch (error) {
      toast.error('Önbellek temizlenemedi');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: boolean) => status ? 'text-green-600' : 'text-red-600';
  const getStatusIcon = (status: boolean) => status ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Smartphone className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Progressive Web App Demo</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          TourTrip PWA özelliklerini test edin ve deneyimleyin. Modern web teknolojileri ile 
          native uygulama deneyimi sunan gelişmiş özellikleri keşfedin.
        </p>
      </div>

      {/* Install Prompt */}
      {installationStatus.canInstall && !installationStatus.isInstalled && (
        <InstallPrompt />
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Uygulama Durumu</p>
                <p className={`text-lg font-semibold ${getStatusColor(installationStatus.isInstalled)}`}>
                  {installationStatus.isInstalled ? 'Yüklü' : 'Web Tarayıcısı'}
                </p>
              </div>
              {installationStatus.isInstalled ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <Download className="h-8 w-8 text-blue-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bağlantı Durumu</p>
                <p className={`text-lg font-semibold ${getStatusColor(isOnline)}`}>
                  {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                </p>
              </div>
              {isOnline ? (
                <Wifi className="h-8 w-8 text-green-500" />
              ) : (
                <WifiOff className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bildirimler</p>
                <p className={`text-lg font-semibold ${getStatusColor(notificationsEnabled)}`}>
                  {notificationsEnabled ? 'Etkin' : 'Kapalı'}
                </p>
              </div>
              <Bell className={`h-8 w-8 ${notificationsEnabled ? 'text-green-500' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sync Kuyruğu</p>
                <p className="text-lg font-semibold text-blue-600">
                  {syncStatus.pending + syncStatus.failed}
                </p>
              </div>
              <Sync className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="installation">Yükleme</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="offline">Çevrimdışı</TabsTrigger>
          <TabsTrigger value="updates">Güncellemeler</TabsTrigger>
          <TabsTrigger value="storage">Depolama</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Cihaz Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <Badge>{installationStatus.platform}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Görüntüleme Modu:</span>
                  <Badge variant="outline">{displayMode}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Mobil Cihaz:</span>
                  <span className={getStatusColor(isMobile)}>{isMobile ? 'Evet' : 'Hayır'}</span>
                </div>
                <div className="flex justify-between">
                  <span>PWA Desteği:</span>
                  <span className={getStatusColor(installationStatus.supportsPWA)}>
                    {installationStatus.supportsPWA ? 'Evet' : 'Hayır'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Standalone Mod:</span>
                  <span className={getStatusColor(installationStatus.isStandalone)}>
                    {installationStatus.isStandalone ? 'Evet' : 'Hayır'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Network Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Ağ Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Bağlantı Türü:</span>
                  <Badge>{networkStatus.effectiveType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>İndirme Hızı:</span>
                  <span>{networkStatus.downlink} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span>Gecikme:</span>
                  <span>{networkStatus.rtt} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Veri Tasarrufu:</span>
                  <span className={getStatusColor(networkStatus.saveData)}>
                    {networkStatus.saveData ? 'Açık' : 'Kapalı'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PWA Features */}
          <Card>
            <CardHeader>
              <CardTitle>PWA Özellikleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { 
                    icon: <Download className="h-6 w-6" />, 
                    title: 'Yüklenebilir', 
                    description: 'Ana ekrana eklenebilir',
                    status: installationStatus.supportsPWA
                  },
                  { 
                    icon: <Wifi className="h-6 w-6" />, 
                    title: 'Çevrimdışı Çalışma', 
                    description: 'İnternet olmadan kullanım',
                    status: true
                  },
                  { 
                    icon: <Bell className="h-6 w-6" />, 
                    title: 'Push Bildirimler', 
                    description: 'Anlık bildirim desteği',
                    status: 'Notification' in window
                  },
                  { 
                    icon: <Sync className="h-6 w-6" />, 
                    title: 'Arka Plan Sync', 
                    description: 'Otomatik senkronizasyon',
                    status: 'serviceWorker' in navigator
                  },
                  { 
                    icon: <Share2 className="h-6 w-6" />, 
                    title: 'Web Share API', 
                    description: 'Native paylaşım desteği',
                    status: 'share' in navigator
                  },
                  { 
                    icon: <HardDrive className="h-6 w-6" />, 
                    title: 'Yerel Depolama', 
                    description: 'Veriler cihazda saklanır',
                    status: 'indexedDB' in window
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className={`${feature.status ? 'text-green-500' : 'text-gray-400'}`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {getStatusIcon(feature.status)}
                        <span className={`text-xs ${getStatusColor(feature.status)}`}>
                          {feature.status ? 'Destekleniyor' : 'Desteklenmiyor'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Installation Tab */}
        <TabsContent value="installation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uygulama Yükleme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Yükleme Durumu</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Yüklenebilir</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(installationStatus.canInstall)}
                        <span className={getStatusColor(installationStatus.canInstall)}>
                          {installationStatus.canInstall ? 'Evet' : 'Hayır'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Yüklenmiş</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(installationStatus.isInstalled)}
                        <span className={getStatusColor(installationStatus.isInstalled)}>
                          {installationStatus.isInstalled ? 'Evet' : 'Hayır'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Standalone Mod</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(installationStatus.isStandalone)}
                        <span className={getStatusColor(installationStatus.isStandalone)}>
                          {installationStatus.isStandalone ? 'Evet' : 'Hayır'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">İşlemler</h3>
                  <div className="space-y-3">
                    <Button
                      onClick={handleInstallApp}
                      disabled={!installationStatus.canInstall}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Uygulamayı Yükle
                    </Button>
                    
                    {installationStatus.platform === 'ios' && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>iOS:</strong> Safari'de paylaş butonuna dokunup 
                          "Ana Ekrana Ekle" seçeneğini kullanın.
                        </p>
                      </div>
                    )}
                    
                    {installationStatus.platform === 'android' && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Android:</strong> Chrome menüsünden 
                          "Ana ekrana ekle" seçeneğini kullanabilirsiniz.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Yönetimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Bildirim Durumu</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Bildirim Desteği</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon('Notification' in window)}
                        <span className={getStatusColor('Notification' in window)}>
                          {'Notification' in window ? 'Destekleniyor' : 'Desteklenmiyor'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>İzin Durumu</span>
                      <Badge variant={notificationsEnabled ? 'default' : 'secondary'}>
                        {Notification.permission === 'granted' ? 'Verildi' :
                         Notification.permission === 'denied' ? 'Reddedildi' : 'Bekleniyor'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleNotificationPermission}
                      disabled={notificationsEnabled}
                      className="w-full"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Bildirim İzni İste
                    </Button>
                    
                    <Button
                      onClick={handlePushSubscription}
                      disabled={!notificationsEnabled}
                      variant="outline"
                      className="w-full"
                    >
                      Push Bildirimlere Abone Ol
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Demo Bildirim</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Başlık</label>
                      <input
                        type="text"
                        value={demoNotificationTitle}
                        onChange={(e) => setDemoNotificationTitle(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        placeholder="Bildirim başlığı"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Mesaj</label>
                      <textarea
                        value={demoNotificationBody}
                        onChange={(e) => setDemoNotificationBody(e.target.value)}
                        className="w-full p-2 border rounded-lg h-20 resize-none"
                        placeholder="Bildirim mesajı"
                      />
                    </div>
                    <Button
                      onClick={handleShowNotification}
                      disabled={!notificationsEnabled}
                      className="w-full"
                    >
                      Demo Bildirimi Gönder
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offline Tab */}
        <TabsContent value="offline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Çevrimdışı Özellikler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Senkronizasyon Durumu</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Bekleyen İşlemler</span>
                      <Badge>{syncStatus.pending}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Başarısız İşlemler</span>
                      <Badge variant="destructive">{syncStatus.failed}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Offline Veri Sayısı</span>
                      <Badge variant="outline">{offlineData.count}</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button onClick={handleAddToSync} className="w-full">
                      <Sync className="h-4 w-4 mr-2" />
                      Demo Sync İşlemi Ekle
                    </Button>
                    <Button 
                      onClick={handleClearSyncQueue} 
                      variant="outline"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Başarısız İşlemleri Temizle
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Çevrimdışı Veri</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Son İşlem:</p>
                    <p className="font-mono text-xs break-all">
                      {offlineData.lastAction || 'Henüz işlem yapılmadı'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Çevrimdışı Özellikler</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>✅ Sayfa görüntüleme</li>
                      <li>✅ Önceden yüklenmiş içerik</li>
                      <li>✅ Form verilerini kaydetme</li>
                      <li>✅ Otomatik senkronizasyon</li>
                      <li>✅ Offline bildirimleri</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Updates Tab */}
        <TabsContent value="updates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uygulama Güncellemeleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Güncelleme Durumu</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Mevcut Sürüm</span>
                      <Badge>{appVersion}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Güncelleme Mevcut</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(updateAvailable)}
                        <span className={getStatusColor(updateAvailable)}>
                          {updateAvailable ? 'Evet' : 'Hayır'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {updateAvailable && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Güncelleme Mevcut</span>
                      </div>
                      <p className="text-sm text-yellow-700 mb-3">
                        Yeni bir uygulama sürümü mevcut. Güncellemek için aşağıdaki butona tıklayın.
                      </p>
                      <Button onClick={handleApplyUpdate} size="sm" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Güncellemeyi Uygula
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Güncelleme İşlemleri</h3>
                  <div className="space-y-3">
                    <Button onClick={handleCheckUpdates} className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Güncellemeleri Kontrol Et
                    </Button>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Otomatik Güncellemeler</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Service Worker arka planda otomatik olarak güncellemeleri kontrol eder.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Güncellemeler arka planda indirilir</li>
                        <li>• Kullanıcıya bildirim gösterilir</li>
                        <li>• Güncelleme onaylandığında uygulanır</li>
                        <li>• Otomatik yeniden başlatma</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Depolama Yönetimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Depolama Kullanımı</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Kullanılan Alan</span>
                      <span className="font-mono text-sm">{formatBytes(storageUsage.used)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Toplam Kota</span>
                      <span className="font-mono text-sm">{formatBytes(storageUsage.quota)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Kullanım Oranı</span>
                      <span className="font-semibold">{storageUsage.percentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Depolama Kullanımı</span>
                      <span>{storageUsage.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Önbellek Yönetimi</h3>
                  <div className="space-y-3">
                    <Button onClick={handleClearCache} variant="outline" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Önbelleği Temizle
                    </Button>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Önbellek Türleri</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Statik dosyalar (JS, CSS)</li>
                        <li>• Görseller ve medya</li>
                        <li>• API yanıtları</li>
                        <li>• Font dosyaları</li>
                        <li>• Firestore verileri</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Cache Stratejisi</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• StaleWhileRevalidate</li>
                        <li>• NetworkFirst</li>
                        <li>• CacheFirst</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PWA Features Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>PWA Implementasyon Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Tamamlanan Özellikler</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Service Worker kurulumu</li>
                <li>• Manifest.json konfigürasyonu</li>
                <li>• Install prompt yönetimi</li>
                <li>• Offline caching stratejisi</li>
                <li>• Push notification desteği</li>
                <li>• Background sync işlemleri</li>
                <li>• Web Share API entegrasyonu</li>
                <li>• Network status izleme</li>
                <li>• Storage management</li>
                <li>• Update mechanism</li>
                <li>• Cross-platform support</li>
                <li>• PWA analytics tracking</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">🔄 Geliştirme Aşamasında</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Badge API desteği</li>
                <li>• File System Access API</li>
                <li>• Web Locks API</li>
                <li>• Periodic background sync</li>
                <li>• Advanced caching strategies</li>
                <li>• Offline-first architecture</li>
                <li>• Progressive loading</li>
                <li>• App shortcuts customization</li>
                <li>• Protocol handlers</li>
                <li>• Window controls overlay</li>
                <li>• Performance monitoring</li>
                <li>• A/B testing for PWA features</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleShare} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              PWA Demo Paylaş
            </Button>
            <Button onClick={() => trackUsage('manual_tracking_test')} variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Analytics Test
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sayfayı Yenile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
