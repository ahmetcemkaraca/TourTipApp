import { Metadata } from 'next';
import { TourListingPage } from '@/components/tours/tour-listing-page';

export const metadata: Metadata = {
  title: 'Turlar',
  description: 'Türkiye\'nin en güzel yerlerinde unutulmaz tur deneyimleri. Binlerce tur seçeneği arasından size en uygun olanı bulun.',
  keywords: ['tur', 'gezi', 'seyahat', 'aktivite', 'macera', 'kültür', 'doğa'],
};

export default function ToursPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return <TourListingPage searchParams={searchParams} />;
}
