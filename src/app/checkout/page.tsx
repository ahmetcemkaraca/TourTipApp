import { Metadata } from 'next';
import { CheckoutPage } from '@/components/checkout/checkout-page';
import { RequireAuth } from '@/components/auth/require-auth';

export const metadata: Metadata = {
  title: 'Ödeme | TourTrip',
  description: 'Güvenli ödeme ile rezervasyonunuzu tamamlayın.',
  robots: { index: false, follow: false }, // Don't index checkout pages
};

export default function Checkout() {
  return (
    <RequireAuth>
      <CheckoutPage />
    </RequireAuth>
  );
}
