import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-8xl font-bold text-primary mb-4">404</div>
        <h2 className="text-2xl font-bold mb-4">Sayfa Bulunamadı</h2>
        <p className="text-muted-foreground mb-6">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">Ana Sayfaya Dön</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/tours">Turları İncele</Link>
          </Button>
        </div>
        
        {/* Helpful Links */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold mb-3">Popüler Sayfalar</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link href="/tours" className="text-primary hover:underline">
              Turlar
            </Link>
            <Link href="/destinations" className="text-primary hover:underline">
              Destinasyonlar
            </Link>
            <Link href="/trip-planner" className="text-primary hover:underline">
              Gezi Planlayıcı
            </Link>
            <Link href="/about" className="text-primary hover:underline">
              Hakkımızda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
