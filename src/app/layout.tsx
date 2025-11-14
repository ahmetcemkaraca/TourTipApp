import type { Metadata } from 'next';
import './globals.css';
import { Layout } from '@/components/layout/layout';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/components/cart/cart-provider';
import { AccessibilityProvider } from '@/components/accessibility/a11y-provider';
import { ErrorBoundary, AsyncErrorBoundary } from '@/components/error/error-boundary';

// Note: PWA features removed for MVP 1.0, will be added in V2.0

export const metadata: Metadata = {
  title: {
    default: 'TourTrip - Türkiye\'nin En Büyük Tur Rezervasyon Platformu',
    template: '%s | TourTrip'
  },
  description: 'Türkiye\'nin dört bir yanında unutulmaz deneyimler. Turlar, aktiviteler ve maceralar için güvenilir adresiniz.',
  keywords: ['tur', 'seyahat', 'aktivite', 'rezervasyon', 'Türkiye', 'gezi', 'tatil'],
  authors: [{ name: 'TourTrip Team' }],
  creator: 'TourTrip',
  publisher: 'TourTrip',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tourtrip.app'),
  alternates: {
    canonical: '/',
    languages: {
      'tr-TR': '/tr',
      'en-US': '/en',
      'de-DE': '/de',
      'ru-RU': '/ru',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'TourTrip',
    title: 'TourTrip - Türkiye\'nin En Büyük Tur Rezervasyon Platformu',
    description: 'Türkiye\'nin dört bir yanında unutulmaz deneyimler. Turlar, aktiviteler ve maceralar için güvenilir adresiniz.',
    url: '/',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TourTrip',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TourTrip - Türkiye\'nin En Büyük Tur Rezervasyon Platformu',
    description: 'Türkiye\'nin dört bir yanında unutulmaz deneyimler.',
    images: ['/og-image.jpg'],
    creator: '@tourtrip',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AsyncErrorBoundary>
          <ErrorBoundary
            onError={(error, errorInfo) => {
              // Log to Firebase Crashlytics
              if (typeof window !== 'undefined' && (window as any).firebase?.crashlytics) {
                const crashlytics = (window as any).firebase.crashlytics();
                crashlytics.recordError(error, {
                  component: 'RootLayout',
                  stackTrace: errorInfo.componentStack,
                });
              }
            }}
          >
            <AccessibilityProvider>
              <CartProvider>
                <Layout>
                  {children}
                </Layout>
              </CartProvider>
            </AccessibilityProvider>
          </ErrorBoundary>
        </AsyncErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
