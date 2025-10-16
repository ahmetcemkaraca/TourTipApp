'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Wifi,
  RefreshCw,
  Home,
  Phone,
  Mail,
  ExternalLink,
  X,
  CheckCircle,
  Info,
  AlertCircle,
} from 'lucide-react';
import { AppError } from '@/hooks/use-error-handler';

interface ErrorMessageProps {
  error: AppError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function ErrorMessage({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className = '',
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setRetryCount(0);
    }
  }, [error]);

  if (!error || !isVisible) {
    return null;
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry?.();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const getErrorIcon = () => {
    switch (error.severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-600" />;
      case 'low':
      default:
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getErrorColor = () => {
    switch (error.severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
      default:
        return 'secondary';
    }
  };

  const getActionButton = () => {
    if (!error.action) return null;

    switch (error.action) {
      case 'retry':
        return (
          <Button onClick={handleRetry} size="sm" disabled={retryCount >= 3}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {retryCount > 0 ? `Tekrar Dene (${retryCount}/3)` : 'Tekrar Dene'}
          </Button>
        );

      case 'reload':
        return (
          <Button onClick={() => window.location.reload()} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sayfayı Yenile
          </Button>
        );

      case 'login':
        return (
          <Button onClick={() => window.location.href = '/auth/login'} size="sm">
            Giriş Yap
          </Button>
        );

      case 'contact':
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = 'tel:+902121234567'}
            >
              <Phone className="h-4 w-4 mr-2" />
              Ara
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/contact'}
            >
              <Mail className="h-4 w-4 mr-2" />
              İletişim
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const getNetworkErrorMessage = () => {
    if (error.code === 'network-error' || !navigator.onLine) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wifi className="h-4 w-4" />
            <span>İnternet bağlantınızı kontrol edin</span>
          </div>

          <div className="text-xs text-muted-foreground">
            <strong>Öneriler:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Wi-Fi veya mobil verinizi kontrol edin</li>
              <li>Farklı bir ağ deneyin</li>
              <li>Router'ınızı yeniden başlatın</li>
              <li>VPN kullanıyorsanız kapatın</li>
            </ul>
          </div>
        </div>
      );
    }

    return null;
  };

  const getDetailedError = () => {
    if (!showDetails) return null;

    return (
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          Teknik Detaylar
        </summary>
        <div className="mt-2 p-3 bg-muted rounded-lg text-xs font-mono">
          <div><strong>Kod:</strong> {error.code}</div>
          <div><strong>Mesaj:</strong> {error.message}</div>
          <div><strong>Şiddet:</strong> {error.severity}</div>
          <div><strong>Zaman:</strong> {new Date().toLocaleString('tr-TR')}</div>
          <div><strong>Tarayıcı:</strong> {navigator.userAgent}</div>
        </div>
      </details>
    );
  };

  return (
    <Card className={`error-message ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getErrorIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <Badge variant={getErrorColor() as any} className="text-xs">
                {error.severity === 'critical' && 'Kritik'}
                {error.severity === 'high' && 'Yüksek'}
                {error.severity === 'medium' && 'Orta'}
                {error.severity === 'low' && 'Düşük'}
              </Badge>

              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0"
                  aria-label="Hatayı kapat"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Hata Oluştu</h4>
                <p className="text-sm text-muted-foreground">
                  {error.userMessage}
                </p>
              </div>

              {getNetworkErrorMessage()}

              <div className="flex flex-wrap gap-2">
                {getActionButton()}

                {error.action === 'contact' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const subject = encodeURIComponent('TourTrip Hata Bildirimi');
                      const body = encodeURIComponent(`
Hata Detayları:
Kod: ${error.code}
Mesaj: ${error.message}
Zaman: ${new Date().toLocaleString('tr-TR')}
Tarayıcı: ${navigator.userAgent}
URL: ${window.location.href}

Lütfen hatayı açıklayın...
                      `);
                      window.location.href = `mailto:destek@tourtrip.app?subject=${subject}&body=${body}`;
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Detaylı Bildir
                  </Button>
                )}
              </div>

              {getDetailedError()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline error message for forms
export function InlineError({
  error,
  className = '',
}: {
  error: string;
  className?: string;
}) {
  if (!error) return null;

  return (
    <div className={`inline-error flex items-center gap-2 text-sm text-red-600 ${className}`}>
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}

// Toast error message
export function ToastError({
  error,
  onRetry,
}: {
  error: AppError;
  onRetry?: () => void;
}) {
  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error.userMessage}</span>
        {error.action === 'retry' && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-4"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Tekrar
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Loading error component
export function LoadingError({
  error,
  onRetry,
  className = '',
}: {
  error: AppError;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`loading-error text-center py-8 ${className}`}>
      <div className="mb-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">
          Yükleme Başarısız
        </h3>
        <p className="text-muted-foreground">
          {error.userMessage}
        </p>
      </div>

      {error.action === 'retry' && onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tekrar Dene
        </Button>
      )}
    </div>
  );
}

// Network status indicator
export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showMessage) return null;

  return (
    <div className={`network-status fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
      showMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    }`}>
      <Alert className={`max-w-md ${isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        {isOnline ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <Wifi className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription>
          {isOnline ? 'İnternet bağlantısı geri geldi' : 'İnternet bağlantısı kesildi'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
