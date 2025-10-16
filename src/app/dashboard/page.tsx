import { Metadata } from 'next';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { RequireAuth } from '@/components/auth/require-auth';

export const metadata: Metadata = {
  title: 'Kontrol Paneli | TourTrip',
  description: 'Hesap bilgilerinizi ve rezervasyonlarınızı yönetin.',
  robots: { index: false, follow: false },
};

export default function Dashboard() {
  return (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  );
}
