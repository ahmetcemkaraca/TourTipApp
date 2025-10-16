import { Metadata } from 'next';
import { CartPage } from '@/components/cart/cart-page';
import { RequireAuth } from '@/components/auth/require-auth';

export const metadata: Metadata = {
  title: 'Sepetim | TourTrip',
  description: 'Seçtiğiniz turları görüntüleyin ve rezervasyon yapın.',
  robots: { index: false, follow: false }, // Don't index cart pages
};

export default function Cart() {
  return (
    <RequireAuth>
      <CartPage />
    </RequireAuth>
  );
}
