'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-6">😵</div>
        <h2 className="text-2xl font-bold mb-4">Bir şeyler ters gitti!</h2>
        <p className="text-muted-foreground mb-6">
          Üzgünüz, beklenmedik bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.
        </p>
        <div className="space-y-4">
          <Button onClick={reset} className="w-full">
            Tekrar Dene
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
            Ana Sayfaya Dön
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Hata Detayları (Geliştirici Modu)
            </summary>
            <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto max-h-40">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
