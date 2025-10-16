'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Monitor, Zap, Wifi, Bell } from 'lucide-react';
import { usePWA, useIsMobile, usePWADisplayMode } from '@/hooks/use-pwa';
import { useToast } from '@/hooks/use-toast';

interface InstallPromptProps {
  onDismiss?: () => void;
  compact?: boolean;
}

export default function InstallPrompt({ onDismiss, compact = false }: InstallPromptProps) {
  const { installationStatus, promptInstall, trackUsage } = usePWA();
  const isMobile = useIsMobile();
  const displayMode = usePWADisplayMode();
  const { toast } = useToast();
  const [isInstalling, setIsInstalling] = useState(false);

  // Don't show if already installed or can't install
  if (!installationStatus.canInstall || installationStatus.isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    trackUsage('install_prompt_clicked');
    
    try {
      const success = await promptInstall();
      
      if (success) {
        toast.success('Uygulama başarıyla yüklendi!');
        onDismiss?.();
      } else {
        toast.error('Yükleme iptal edildi');
      }
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Yükleme sırasında hata oluştu');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    trackUsage('install_prompt_dismissed');
    onDismiss?.();
  };

  const benefits = [
    {
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      title: 'Hızlı Erişim',
      description: 'Ana ekranınızdan tek tıkla açın'
    },
    {
      icon: <Wifi className="h-5 w-5 text-blue-500" />,
      title: 'Çevrimdışı Kullanım',
      description: 'İnternet olmadan da kullanabilirsiniz'
    },
    {
      icon: <Bell className="h-5 w-5 text-green-500" />,
      title: 'Anlık Bildirimler',
      description: 'Önemli güncellemeleri kaçırmayın'
    }
  ];

  if (compact) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile ? (
                <Smartphone className="h-6 w-6 text-blue-600" />
              ) : (
                <Monitor className="h-6 w-6 text-blue-600" />
              )}
              <div>
                <p className="font-medium text-blue-900">TourTrip'i Yükleyin</p>
                <p className="text-sm text-blue-700">Daha hızlı ve kolay erişim</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={isInstalling}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-1" />
                {isInstalling ? 'Yükleniyor...' : 'Yükle'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-blue-600 hover:text-blue-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {isMobile ? (
              <Smartphone className="h-8 w-8 text-blue-600" />
            ) : (
              <Monitor className="h-8 w-8 text-blue-600" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                TourTrip Uygulamasını {isMobile ? 'Telefonunuza' : 'Bilgisayarınıza'} Yükleyin
              </h3>
              <p className="text-blue-700">
                Daha hızlı, daha kolay ve çevrimdışı erişim imkanı
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
              {benefit.icon}
              <div>
                <p className="font-medium text-gray-900">{benefit.title}</p>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-700">
            <p>✅ Güvenli ve hızlı</p>
            <p>✅ İstediğiniz zaman kaldırabilirsiniz</p>
          </div>
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="bg-blue-600 hover:bg-blue-700 px-6"
          >
            <Download className="h-4 w-4 mr-2" />
            {isInstalling ? 'Yükleniyor...' : 'Şimdi Yükle'}
          </Button>
        </div>

        {isMobile && installationStatus.platform === 'ios' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>iOS Kullanıcıları:</strong> Safari'de paylaş butonuna dokunup 
              "Ana Ekrana Ekle" seçeneğini kullanabilirsiniz.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
