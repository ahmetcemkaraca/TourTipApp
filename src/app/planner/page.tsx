import { Metadata } from 'next';
import { TripPlannerPage } from '@/components/trip-planner/trip-planner-page';

export const metadata: Metadata = {
  title: 'Gezi Planlayıcı | TourTrip',
  description: 'Kişiselleştirilmiş gezi planlarınızı oluşturun, rotalarınızı optimize edin ve unutulmaz deneyimler yaşayın.',
  keywords: ['gezi planlayıcı', 'tur planlama', 'rota optimizasyonu', 'seyahat planı'],
};

export default function TripPlanner() {
  return <TripPlannerPage />;
}
