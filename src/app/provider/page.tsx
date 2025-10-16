import { Metadata } from 'next';
import { ProviderPortalPage } from '@/components/provider/provider-portal-page';
import { RequireAuth } from '@/components/auth/require-auth';

export const metadata: Metadata = {
  title: 'Hizmet Sağlayıcı Portalı | TourTrip',
  description: 'Turlarınızı yönetin, rezervasyonları takip edin ve gelirlerinizi artırın.',
  robots: { index: false, follow: false },
};

export default function ProviderPortal() {
  return (
    <RequireAuth>
      <ProviderPortalPage />
    </RequireAuth>
  );
}
