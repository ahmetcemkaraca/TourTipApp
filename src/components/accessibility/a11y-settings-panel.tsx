'use client';

import { useState } from 'react';
import { useAccessibility } from './a11y-provider';
import { FocusTrap } from './focus-trap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Accessibility,
  Eye,
  Type,
  Zap,
  Keyboard,
  Volume2,
  Settings,
  X,
  Save,
  RotateCcw,
} from 'lucide-react';
import { AccessibleButton, AriaLive } from './aria-utils';

interface AccessibilitySettingsPanelProps {
  trigger?: React.ReactNode;
  onSettingsChange?: (settings: any) => void;
}

export function AccessibilitySettingsPanel({
  trigger,
  onSettingsChange,
}: AccessibilitySettingsPanelProps) {
  const {
    screenReaderEnabled,
    toggleScreenReader,
    fontSize,
    setFontSize,
    highContrast,
    toggleHighContrast,
    reduceMotion,
    toggleReduceMotion,
    keyboardNavigation,
    toggleKeyboardNavigation,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const handleSettingChange = (setting: string, value: any) => {
    setHasUnsavedChanges(true);

    // Announce changes to screen readers
    switch (setting) {
      case 'screenReader':
        setAnnouncement(value ? 'Ekran okuyucu modu etkinleştirildi' : 'Ekran okuyucu modu devre dışı bırakıldı');
        break;
      case 'fontSize':
        setAnnouncement(`Yazı boyutu ${value} olarak ayarlandı`);
        break;
      case 'highContrast':
        setAnnouncement(value ? 'Yüksek kontrast modu etkinleştirildi' : 'Yüksek kontrast modu devre dışı bırakıldı');
        break;
      case 'reduceMotion':
        setAnnouncement(value ? 'Hareket azaltma modu etkinleştirildi' : 'Hareket azaltma modu devre dışı bırakıldı');
        break;
      case 'keyboardNavigation':
        setAnnouncement(value ? 'Klavye navigasyonu etkinleştirildi' : 'Klavye navigasyonu devre dışı bırakıldı');
        break;
    }

    onSettingsChange?.({ [setting]: value });
  };

  const resetToDefaults = () => {
    setFontSize('medium');
    if (screenReaderEnabled) toggleScreenReader();
    if (highContrast) toggleHighContrast();
    if (reduceMotion) toggleReduceMotion();
    if (!keyboardNavigation) toggleKeyboardNavigation();

    setAnnouncement('Erişilebilirlik ayarları varsayılan değerlere sıfırlandı');
    setHasUnsavedChanges(true);
  };

  const applySettings = () => {
    setHasUnsavedChanges(false);
    setAnnouncement('Erişilebilirlik ayarları kaydedildi');
    setIsOpen(false);
  };

  const defaultTrigger = (
    <AccessibleButton
      className="accessibility-trigger"
      aria-label="Erişilebilirlik ayarları"
    >
      <Accessibility className="h-5 w-5" />
      <span className="sr-only">Erişilebilirlik ayarları</span>
    </AccessibleButton>
  );

  return (
    <>
      <AriaLive message={announcement} priority="assertive" />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>

        <DialogContent
          className="accessibility-settings-dialog"
          aria-labelledby="a11y-settings-title"
          aria-describedby="a11y-settings-description"
        >
          <FocusTrap isActive={isOpen}>
            <DialogHeader>
              <DialogTitle id="a11y-settings-title">
                <Accessibility className="h-5 w-5 mr-2 inline" />
                Erişilebilirlik Ayarları
              </DialogTitle>
              <p id="a11y-settings-description" className="text-sm text-muted-foreground">
                Web sitesini kullanımınızı kolaylaştırmak için erişilebilirlik ayarlarını özelleştirin.
              </p>
            </DialogHeader>

            <div className="accessibility-settings-content space-y-6">
              {/* Font Size Setting */}
              <div className="setting-group">
                <div className="setting-header">
                  <Type className="h-4 w-4" />
                  <h3>Yazı Boyutu</h3>
                </div>
                <p className="setting-description">
                  Metin boyutunu tercihlerinize göre ayarlayın.
                </p>
                <Select
                  value={fontSize}
                  onValueChange={(value: any) => {
                    setFontSize(value);
                    handleSettingChange('fontSize', value);
                  }}
                >
                  <SelectTrigger aria-label="Yazı boyutu seçin">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Küçük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="large">Büyük</SelectItem>
                    <SelectItem value="extra-large">Çok Büyük</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* High Contrast Setting */}
              <div className="setting-group">
                <div className="setting-header">
                  <Eye className="h-4 w-4" />
                  <h3>Yüksek Kontrast</h3>
                </div>
                <p className="setting-description">
                  Metin ve arka plan arasındaki kontrastı artırın.
                </p>
                <Switch
                  checked={highContrast}
                  onCheckedChange={(checked) => {
                    toggleHighContrast();
                    handleSettingChange('highContrast', checked);
                  }}
                  aria-label="Yüksek kontrast modunu aç/kapat"
                />
              </div>

              {/* Reduce Motion Setting */}
              <div className="setting-group">
                <div className="setting-header">
                  <Zap className="h-4 w-4" />
                  <h3>Hareket Azaltma</h3>
                </div>
                <p className="setting-description">
                  Animasyonları ve geçiş efektlerini azaltın.
                </p>
                <Switch
                  checked={reduceMotion}
                  onCheckedChange={(checked) => {
                    toggleReduceMotion();
                    handleSettingChange('reduceMotion', checked);
                  }}
                  aria-label="Hareket azaltma modunu aç/kapat"
                />
              </div>

              {/* Keyboard Navigation Setting */}
              <div className="setting-group">
                <div className="setting-header">
                  <Keyboard className="h-4 w-4" />
                  <h3>Klavye Navigasyonu</h3>
                </div>
                <p className="setting-description">
                  Klavye ile sayfa içinde gezinmeyi etkinleştirin.
                </p>
                <Switch
                  checked={keyboardNavigation}
                  onCheckedChange={(checked) => {
                    toggleKeyboardNavigation();
                    handleSettingChange('keyboardNavigation', checked);
                  }}
                  aria-label="Klavye navigasyonunu aç/kapat"
                />
                {keyboardNavigation && (
                  <div className="keyboard-shortcuts mt-2">
                    <p className="text-sm font-medium">Kısayollar:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Alt + 1: Ana menüye git</li>
                      <li>• Alt + 2: Ana içeriğe git</li>
                      <li>• Alt + 0: İçerik alanına git</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Screen Reader Setting */}
              <div className="setting-group">
                <div className="setting-header">
                  <Volume2 className="h-4 w-4" />
                  <h3>Ekran Okuyucu Desteği</h3>
                </div>
                <p className="setting-description">
                  Ekran okuyucular için ek açıklamalar gösterin.
                </p>
                <Switch
                  checked={screenReaderEnabled}
                  onCheckedChange={(checked) => {
                    toggleScreenReader();
                    handleSettingChange('screenReader', checked);
                  }}
                  aria-label="Ekran okuyucu desteğini aç/kapat"
                />
              </div>

              {/* WCAG Compliance Info */}
              <div className="compliance-info">
                <Badge variant="outline" className="wcag-badge">
                  WCAG 2.1 AA Uyumlu
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Bu ayarlar Web Content Accessibility Guidelines (WCAG) 2.1 AA standardına uygundur.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="accessibility-settings-actions flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                aria-label="Ayarları varsayılan değerlere sıfırla"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Sıfırla
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  aria-label="İptal et ve çık"
                >
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </Button>

                <AccessibleButton
                  onClick={applySettings}
                  disabled={!hasUnsavedChanges}
                  aria-label="Ayarları kaydet ve uygula"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </AccessibleButton>
              </div>
            </div>
          </FocusTrap>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .accessibility-settings-dialog {
          max-width: 500px;
        }

        .setting-group {
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          background: var(--background);
        }

        .setting-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .setting-header h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .setting-description {
          font-size: 0.875rem;
          color: var(--muted-foreground);
          margin-bottom: 1rem;
        }

        .keyboard-shortcuts {
          background: var(--muted);
          padding: 0.75rem;
          border-radius: 0.25rem;
          margin-top: 0.5rem;
        }

        .compliance-info {
          text-align: center;
          padding: 1rem;
          background: var(--muted);
          border-radius: 0.5rem;
        }

        .wcag-badge {
          background: var(--primary);
          color: var(--primary-foreground);
        }

        /* High contrast mode styles */
        :global(.high-contrast) .setting-group {
          border-color: var(--foreground);
        }

        :global(.high-contrast) .setting-description {
          color: var(--foreground);
        }

        /* Reduced motion styles */
        :global(.reduce-motion) * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        /* Font size styles */
        :global(.text-small) {
          font-size: 14px;
        }

        :global(.text-medium) {
          font-size: 16px;
        }

        :global(.text-large) {
          font-size: 18px;
        }

        :global(.text-extra-large) {
          font-size: 20px;
        }

        /* Skip links styles */
        .skip-links {
          position: absolute;
          top: -40px;
          left: 6px;
          z-index: 1000;
          display: flex;
          gap: 0.5rem;
        }

        .skip-links:focus-within {
          top: 6px;
        }

        .skip-link {
          background: var(--primary);
          color: var(--primary-foreground);
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .skip-link:hover,
        .skip-link:focus {
          background: var(--primary-hover, var(--primary));
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .skip-link:focus {
          outline: 2px solid var(--ring);
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}
