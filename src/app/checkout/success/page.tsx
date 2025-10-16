import { Metadata } from 'next';
import { CheckoutSuccessPage } from '@/components/checkout/checkout-success-page';
import { RequireAuth } from '@/components/auth/require-auth';

export const metadata: Metadata = {
  title: 'Ödeme Başarılı | TourTrip',
  description: 'Rezervasyonunuz başarıyla tamamlandı.',
  robots: { index: false, follow: false },
};

export default function CheckoutSuccess() {
  return (
    <RequireAuth>
      <CheckoutSuccessPage />
    </RequireAuth>
  );
}
