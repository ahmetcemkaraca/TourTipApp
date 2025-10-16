'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Settings,
  Volume2,
  VolumeX,
  Shield,
  Clock,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface NotificationPreferences {
  email: {
    bookingConfirmation: boolean;
    paymentReceipts: boolean;
    tourReminders: boolean;
    promotions: boolean;
    newsletter: boolean;
    securityAlerts: boolean;
  };
  push: {
    enabled: boolean;
    bookingUpdates: boolean;
    lastMinuteDeals: boolean;
    weatherAlerts: boolean;
    tourStartReminder: boolean;
    paymentReminders: boolean;
  };
  sms: {
    enabled: boolean;
    bookingConfirmation: boolean;
    emergencyAlerts: boolean;
    paymentReminders: boolean;
  };
  inApp: {
    enabled: boolean;
    allNotifications: boolean;
    onlyImportant: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  frequency: {
    promotional: 'daily' | 'weekly' | 'monthly' | 'never';
    digest: 'daily' | 'weekly' | 'monthly' | 'never';
  };
}

export function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      bookingConfirmation: true,
      paymentReceipts: true,
      tourReminders: true,
      promotions: false,
      newsletter: false,
      securityAlerts: true,
    },
    push: {
      enabled: true,
      bookingUpdates: true,
      lastMinuteDeals: false,
      weatherAlerts: true,
      tourStartReminder: true,
      paymentReminders: true,
    },
    sms: {
      enabled: false,
      bookingConfirmation: false,
      emergencyAlerts: true,
      paymentReminders: false,
    },
    inApp: {
      enabled: true,
      allNotifications: false,
      onlyImportant: true,
    },
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
    },
    frequency: {
      promotional: 'weekly',
      digest: 'weekly',
    },
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updatePreference = (category: keyof NotificationPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Save preferences to Firestore
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      toast.success('Bildirim ayarları güncellendi!');
      setHasChanges(false);
    } catch (error) {
      toast.error('Ayarlar güncellenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updatePreference('push', 'enabled', true);
        toast.success('Bildirim izni verildi!');
      } else {
        toast.error('Bildirim izni reddedildi.');
      }
    } else {
      toast.error('Bu tarayıcı bildirimleri desteklemiyor.');
    }
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('TourTrip Test Bildirimi', {
        body: 'Bildirimleriniz düzgün çalışıyor! 🎉',
        icon: '/favicon.ico',
      });
    } else {
      toast.error('Bildirim izni gerekli.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Bildirim Ayarları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* E-posta Bildirimleri */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">E-posta Bildirimleri</h3>
            <Badge variant={preferences.email.bookingConfirmation ? 'default' : 'outline'}>
              {Object.values(preferences.email).filter(Boolean).length} aktif
            </Badge>
          </div>
          
          <div className="space-y-3 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-booking">Rezervasyon Onayları</Label>
                <p className="text-sm text-muted-foreground">Rezervasyon onay ve iptal bildirimleri</p>
              </div>
              <Switch
                id="email-booking"
                checked={preferences.email.bookingConfirmation}
                onCheckedChange={(checked) => updatePreference('email', 'bookingConfirmation', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-payment">Ödeme Makbuzları</Label>
                <p className="text-sm text-muted-foreground">Ödeme onayları ve faturalar</p>
              </div>
              <Switch
                id="email-payment"
                checked={preferences.email.paymentReceipts}
                onCheckedChange={(checked) => updatePreference('email', 'paymentReceipts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-reminders">Tur Hatırlatıcıları</Label>
                <p className="text-sm text-muted-foreground">Tur öncesi hatırlatma e-postaları</p>
              </div>
              <Switch
                id="email-reminders"
                checked={preferences.email.tourReminders}
                onCheckedChange={(checked) => updatePreference('email', 'tourReminders', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-promotions">Promosyonlar</Label>
                <p className="text-sm text-muted-foreground">İndirimler ve özel teklifler</p>
              </div>
              <Switch
                id="email-promotions"
                checked={preferences.email.promotions}
                onCheckedChange={(checked) => updatePreference('email', 'promotions', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-newsletter">Bülten</Label>
                <p className="text-sm text-muted-foreground">Yeni tur duyuruları ve seyahat ipuçları</p>
              </div>
              <Switch
                id="email-newsletter"
                checked={preferences.email.newsletter}
                onCheckedChange={(checked) => updatePreference('email', 'newsletter', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-security">Güvenlik Uyarıları</Label>
                <p className="text-sm text-muted-foreground">Hesap güvenliği ve giriş bildirimleri</p>
                <Badge variant="secondary" className="text-xs mt-1">Önerilen</Badge>
              </div>
              <Switch
                id="email-security"
                checked={preferences.email.securityAlerts}
                onCheckedChange={(checked) => updatePreference('email', 'securityAlerts', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Push Bildirimleri */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            <h3 className="font-medium">Push Bildirimleri</h3>
            <Badge variant={preferences.push.enabled ? 'default' : 'destructive'}>
              {preferences.push.enabled ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>
          
          {!preferences.push.enabled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Push bildirimler devre dışı. Önemli güncellemeleri kaçırmamak için etkinleştirin.
                </p>
              </div>
              <Button 
                onClick={requestNotificationPermission}
                size="sm" 
                className="mt-2"
              >
                Bildirimleri Etkinleştir
              </Button>
            </div>
          )}
          
          <div className="space-y-3 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-enabled">Push Bildirimleri</Label>
                <p className="text-sm text-muted-foreground">Tarayıcı bildirimleri</p>
              </div>
              <Switch
                id="push-enabled"
                checked={preferences.push.enabled}
                onCheckedChange={(checked) => updatePreference('push', 'enabled', checked)}
              />
            </div>
            
            {preferences.push.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-booking">Rezervasyon Güncellemeleri</Label>
                    <p className="text-sm text-muted-foreground">Rezervasyon durumu değişiklikleri</p>
                  </div>
                  <Switch
                    id="push-booking"
                    checked={preferences.push.bookingUpdates}
                    onCheckedChange={(checked) => updatePreference('push', 'bookingUpdates', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-deals">Son Dakika Fırsatları</Label>
                    <p className="text-sm text-muted-foreground">Acil indirimler ve fırsatlar</p>
                  </div>
                  <Switch
                    id="push-deals"
                    checked={preferences.push.lastMinuteDeals}
                    onCheckedChange={(checked) => updatePreference('push', 'lastMinuteDeals', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-weather">Hava Durumu Uyarıları</Label>
                    <p className="text-sm text-muted-foreground">Tur günü hava durumu bilgileri</p>
                  </div>
                  <Switch
                    id="push-weather"
                    checked={preferences.push.weatherAlerts}
                    onCheckedChange={(checked) => updatePreference('push', 'weatherAlerts', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-tour-reminder">Tur Başlangıç Hatırlatıcısı</Label>
                    <p className="text-sm text-muted-foreground">Tur başlamadan 1 saat önce hatırlatma</p>
                  </div>
                  <Switch
                    id="push-tour-reminder"
                    checked={preferences.push.tourStartReminder}
                    onCheckedChange={(checked) => updatePreference('push', 'tourStartReminder', checked)}
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={testNotification} variant="outline" size="sm">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Test Bildirimi Gönder
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* SMS Bildirimleri */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium">SMS Bildirimleri</h3>
            <Badge variant={preferences.sms.enabled ? 'default' : 'outline'}>
              {preferences.sms.enabled ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>
          
          <div className="space-y-3 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-enabled">SMS Bildirimleri</Label>
                <p className="text-sm text-muted-foreground">Telefon numaranıza SMS gönderimi</p>
              </div>
              <Switch
                id="sms-enabled"
                checked={preferences.sms.enabled}
                onCheckedChange={(checked) => updatePreference('sms', 'enabled', checked)}
              />
            </div>
            
            {preferences.sms.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-booking">Rezervasyon Onayları</Label>
                    <p className="text-sm text-muted-foreground">Rezervasyon onay SMS'i</p>
                  </div>
                  <Switch
                    id="sms-booking"
                    checked={preferences.sms.bookingConfirmation}
                    onCheckedChange={(checked) => updatePreference('sms', 'bookingConfirmation', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-emergency">Acil Durum Uyarıları</Label>
                    <p className="text-sm text-muted-foreground">Güvenlik ve acil durum bildirimleri</p>
                    <Badge variant="destructive" className="text-xs mt-1">Kritik</Badge>
                  </div>
                  <Switch
                    id="sms-emergency"
                    checked={preferences.sms.emergencyAlerts}
                    onCheckedChange={(checked) => updatePreference('sms', 'emergencyAlerts', checked)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Sessiz Saatler */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <h3 className="font-medium">Sessiz Saatler</h3>
            <Badge variant={preferences.quietHours.enabled ? 'default' : 'outline'}>
              {preferences.quietHours.enabled ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>
          
          <div className="space-y-3 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="quiet-hours">Sessiz Saatleri Etkinleştir</Label>
                <p className="text-sm text-muted-foreground">Belirtilen saatlerde bildirim almayın</p>
              </div>
              <Switch
                id="quiet-hours"
                checked={preferences.quietHours.enabled}
                onCheckedChange={(checked) => updatePreference('quietHours', 'enabled', checked)}
              />
            </div>
            
            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Başlangıç Saati</Label>
                  <input
                    id="start-time"
                    type="time"
                    value={preferences.quietHours.startTime}
                    onChange={(e) => updatePreference('quietHours', 'startTime', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">Bitiş Saati</Label>
                  <input
                    id="end-time"
                    type="time"
                    value={preferences.quietHours.endTime}
                    onChange={(e) => updatePreference('quietHours', 'endTime', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Kaydet Butonu */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Bildirim tercihleriniz güvenli bir şekilde saklanır</span>
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              'Değişiklikleri Kaydet'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
