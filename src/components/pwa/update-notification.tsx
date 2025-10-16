'use client';

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  X,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface UpdateNotificationProps {
  position?: 'top' | 'bottom' | 'center';
  autoShow?: boolean;
  showChangelog?: boolean;
}

export function UpdateNotification({
  position = 'bottom',
  autoShow = true,
  showChangelog = true,
}: UpdateNotificationProps) {
  const { isUpdateAvailable, update, checkForUpdates } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  useEffect(() => {
    if (autoShow && isUpdateAvailable) {
      setIsVisible(true);
    }
  }, [autoShow, isUpdateAvailable]);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);

      // Simulate progress (real progress would come from service worker)
      const progressInterval = setInterval(() => {
        setUpdateProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await update();

      setUpdateProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setIsUpdating(false);
        setUpdateProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
      setUpdateProgress(0);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Don't dismiss permanently, show again on next visit
  };

  const handleRemindLater = () => {
    setIsVisible(false);
    // Show again in 24 hours
    const remindTime = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa-update-remind', remindTime.toString());
  };

  if (!isVisible || !isUpdateAvailable) {
    return null;
  }

  const changelog = [
    '🎯 Hata düzeltmeleri ve performans iyileştirmeleri',
    '✨ Yeni özellikler eklendi',
    '🔒 Güvenlik güncellemeleri',
    '📱 Mobil deneyim iyileştirildi',
    '⚡ Daha hızlı yükleme süreleri',
  ];

  const positionClasses = {
    top: 'top-4',
    bottom: 'bottom-4',
    center: 'top-1/2 -translate-y-1/2',
  };

  return (
    <div
      className={`update-notification fixed ${positionClasses[position]} left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md bg-white border border-border rounded-lg shadow-xl z-50`}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-full">
              <RefreshCw className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Güncelleme Mevcut</h4>
              <Badge variant="secondary" className="text-xs">
                Yeni Sürüm
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6"
            aria-label="Kapat"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            TourTrip'in yeni sürümü hazır! Daha iyi performans ve yeni özellikler sizi bekliyor.
          </p>

          {/* Progress Bar (when updating) */}
          {isUpdating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Güncelleme yükleniyor...</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${updateProgress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                {updateProgress}%
              </div>
            </div>
          )}

          {/* Changelog */}
          {showChangelog && !isUpdating && (
            <div className="changelog">
              <h5 className="text-sm font-medium mb-2">Bu sürümde:</h5>
              <ul className="space-y-1">
                {changelog.map((item, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {!isUpdating && (
            <div className="benefits grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Hızlı</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Güvenli</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Modern</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Optimize</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              size="sm"
              className="flex-1"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 mr-1" />
                  Şimdi Güncelle
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleRemindLater}
              disabled={isUpdating}
              size="sm"
            >
              <Clock className="h-3 w-3 mr-1" />
              Daha Sonra
            </Button>
          </div>
        </div>
      </div>

      {/* Update Complete Animation */}
      {updateProgress === 100 && (
        <div className="absolute inset-0 bg-green-600 bg-opacity-90 rounded-lg flex items-center justify-center">
          <div className="text-center text-white">
            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Güncelleme Tamamlandı!</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Toast-style update notification
export function UpdateToast() {
  const { isUpdateAvailable, update } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable) {
      setIsVisible(true);
    }
  }, [isUpdateAvailable]);

  const handleUpdate = async () => {
    try {
      await update();
      setIsVisible(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  if (!isVisible || !isUpdateAvailable) {
    return null;
  }

  return (
    <div className="update-toast fixed top-4 right-4 bg-white border border-border rounded-lg shadow-lg p-3 z-50 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="p-2 bg-blue-100 rounded-full">
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">Yeni Güncelleme</h4>
          <p className="text-xs text-muted-foreground mt-1">
            TourTrip'in yeni sürümü hazır
          </p>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={handleUpdate}
            className="text-xs px-2 py-1 h-7"
          >
            Güncelle
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Banner-style update notification
export function UpdateBanner() {
  const { isUpdateAvailable, update } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable) {
      setIsVisible(true);
    }
  }, [isUpdateAvailable]);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      await update();
      setIsVisible(false);
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  if (!isVisible || !isUpdateAvailable) {
    return null;
  }

  return (
    <div className="update-banner bg-blue-600 text-white px-4 py-3 relative">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5" />
          <div>
            <p className="font-medium text-sm">
              TourTrip'in yeni sürümü hazır!
            </p>
            <p className="text-xs opacity-90">
              Daha iyi performans ve yeni özellikler için güncelleyin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              'Güncelle'
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
