'use client';

import { useAccessibility } from './a11y-provider';
import { Button } from '@/components/ui/button';
import { SkipForward, Navigation, FileText } from 'lucide-react';

export function SkipLinks() {
  const { skipToNavigation, skipToMain, skipToContent } = useAccessibility();

  return (
    <div className="skip-links" role="navigation" aria-label="Hızlı navigasyon bağlantıları">
      <Button
        variant="outline"
        size="sm"
        onClick={skipToNavigation}
        className="skip-link skip-to-nav"
        aria-label="Ana navigasyona git"
      >
        <Navigation className="h-4 w-4 mr-2" aria-hidden="true" />
        <span>Menüye Git</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={skipToMain}
        className="skip-link skip-to-main"
        aria-label="Ana içeriğe git"
      >
        <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
        <span>İçeriğe Git</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={skipToContent}
        className="skip-link skip-to-content"
        aria-label="İçerik alanına git"
      >
        <SkipForward className="h-4 w-4 mr-2" aria-hidden="true" />
        <span>İçeriği Atla</span>
      </Button>
    </div>
  );
}

export function SkipLink({
  href,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <a
      href={href}
      className="skip-link"
      {...props}
    >
      {children}
    </a>
  );
}
