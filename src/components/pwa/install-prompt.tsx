'use client';

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Download,
  X,
  Star,
  Zap,
  Globe,
  Bell,
  MapPin,
  Clock,
} from 'lucide-react';

interface InstallPromptProps {
  trigger?: React.ReactNode;
  autoShow?: boolean;
  delay?: number;
}

export function InstallPrompt({ trigger, autoShow = true, delay = 30000 }: InstallPromptProps) {
  const { isInstallable, isInstalled, install } = usePWA();
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);

  // Auto-show after delay
  useEffect(() => {
    if (!autoShow || !isInstallable || isInstalled) return;

    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setIsOpen(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [autoShow, isInstallable, isInstalled, delay]);

  // Check if user dismissed before
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    setShowDismissed(!!dismissed);
  }, []);

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      await install();
      setIsOpen(false);
      localStorage.setItem('pwa-install-completed', 'true');
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    setShowDismissed(true);
  };

  const handleRemindLater = () => {
    setIsOpen(false);
    // Show again in 7 days
    const remindDate = new Date();
    remindDate.setDate(remindDate.getDate() + 7);
    localStorage.setItem('pwa-install-remind', remindDate.toISOString());
  };

  if (isInstalled || (!isInstallable && !trigger)) {
    return null;
  }

  const features = [
    {
      icon: Globe,
      title: 'Çevrimdışı Erişim',
      description: 'İnternet olmadan turlarınızı görün',
    },
    {
      icon: Bell,
      title: 'Anlık Bildirimler',
      description: 'Rezervasyon ve fırsat bildirimleri',
    },
    {
      icon: Zap,
      title: 'Hızlı Erişim',
      description: 'Telefonunuzda uygulama gibi çalışır',
    },
    {
      icon: MapPin,
      title: 'Harita Entegrasyonu',
      description: 'GPS ve harita özelliklerini kullanın',
    },
    {
      icon: Clock,
      title: 'Arka Planda Çalışır',
      description: 'Rezervasyonlarınızı takip eder',
    },
    {
      icon: Star,
      title: 'Kişiselleştirme',
      description: 'Favori turlarınızı kolayca bulun',
    },
  ];

  return (
    <>
      {/* Trigger button if provided */}
      {trigger && (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      )}

      {/* Install Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="install-prompt-dialog max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    TourTrip'i Telefonunuza Ekleyin
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Daha hızlı ve kolay seyahat deneyimi için uygulamayı yükleyin
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="install-prompt-content">
            {/* Hero Section */}
            <div className="hero-section text-center mb-6">
              <Badge variant="secondary" className="mb-3">
                Ücretsiz • Güvenli • Hızlı
              </Badge>
              <h3 className="text-lg font-semibold mb-2">
                Seyahat Deneyiminizi İyileştirin
              </h3>
              <p className="text-muted-foreground">
                TourTrip'i telefonunuza ekleyerek seyahat planlarınızı her zaman yanınızda taşıyın
              </p>
            </div>

            {/* Features Grid */}
            <div className="features-grid grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className="feature-item flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Installation Steps */}
            <div className="installation-steps mb-6">
              <h4 className="font-semibold mb-3">Kurulum Adımları:</h4>
              <div className="steps space-y-2">
                <div className="step flex items-center gap-2 text-sm">
                  <div className="step-number w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span>"Uygulamaya Ekle" butonuna tıklayın</span>
                </div>
                <div className="step flex items-center gap-2 text-sm">
                  <div className="step-number w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span>İnternet tarayıcınız uygulamayı yükleyecektir</span>
                </div>
                <div className="step flex items-center gap-2 text-sm">
                  <div className="step-number w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span>Ana ekranda TourTrip simgesi görünecektir</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="install-prompt-actions flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {isInstalling ? 'Yükleniyor...' : 'Uygulamaya Ekle'}
            </Button>

            <Button
              variant="outline"
              onClick={handleRemindLater}
              className="flex-1"
              size="lg"
            >
              Daha Sonra Hatırlat
            </Button>

            <Button
              variant="ghost"
              onClick={handleDismiss}
              size="lg"
            >
              Vazgeç
            </Button>
          </div>

          {/* Footer Note */}
          <div className="text-center text-xs text-muted-foreground mt-4">
            Bu uygulama hiçbir ücret ödemeden kullanılabilir
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .install-prompt-dialog {
          max-height: 90vh;
          overflow-y: auto;
        }

        .hero-section {
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 0.75rem;
          margin: -1.5rem -1.5rem 1.5rem -1.5rem;
        }

        .feature-item {
          transition: all 0.2s ease;
        }

        .feature-item:hover {
          background: var(--muted);
          transform: translateY(-1px);
        }

        .step-number {
          flex-shrink: 0;
        }

        .steps {
          padding-left: 0.5rem;
        }

        @media (max-width: 640px) {
          .install-prompt-dialog {
            margin: 1rem;
            max-height: calc(100vh - 2rem);
          }

          .hero-section {
            padding: 1rem;
            margin: -1rem -1rem 1rem -1rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

// Mini install prompt for smaller screens
export function MiniInstallPrompt() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (isInstallable && !isInstalled) {
      const dismissed = localStorage.getItem('pwa-mini-dismissed');
      if (!dismissed) {
        // Show after 10 seconds
        const timer = setTimeout(() => setIsVisible(true), 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      await install();
      setIsVisible(false);
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-mini-dismissed', 'true');
  };

  if (!isVisible || !isInstallable || isInstalled) {
    return null;
  }

  return (
    <div className="mini-install-prompt fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-white border border-border rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="p-2 bg-blue-100 rounded-full">
            <Smartphone className="h-4 w-4 text-blue-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">TourTrip'i Yükleyin</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Daha hızlı erişim için uygulamayı telefonunuza ekleyin
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleInstall}
            disabled={isInstalling}
          >
            {isInstalling ? 'Yükleniyor...' : 'Yükle'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
