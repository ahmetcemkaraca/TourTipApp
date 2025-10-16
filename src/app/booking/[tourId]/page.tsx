import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookingFlow } from '@/components/booking/booking-flow';
import { tourService } from '@/lib/firestore-service';
import { RequireAuth } from '@/components/auth/require-auth';

interface BookingPageProps {
  params: { tourId: string };
  searchParams: { 
    date?: string; 
    adults?: string; 
    children?: string; 
  };
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  try {
    const tour = await tourService.read(params.tourId);
    
    if (!tour) {
      return {
        title: 'Rezervasyon | TourTrip',
        description: 'Tur rezervasyonu yapın.',
      };
    }

    return {
      title: `${tour.title} - Rezervasyon | TourTrip`,
      description: `${tour.title} için rezervasyon yapın.`,
      robots: { index: false, follow: false }, // Don't index booking pages
    };
  } catch (error) {
    return {
      title: 'Rezervasyon | TourTrip',
      description: 'Tur rezervasyonu yapın.',
    };
  }
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  try {
    const tour = await tourService.read(params.tourId);
    
    if (!tour) {
      notFound();
    }

    // Parse search params
    const bookingParams = {
      date: searchParams.date || '',
      adults: parseInt(searchParams.adults || '1'),
      children: parseInt(searchParams.children || '0'),
    };

    return (
      <RequireAuth>
        <BookingFlow tour={tour} initialParams={bookingParams} />
      </RequireAuth>
    );
  } catch (error) {
    console.error('Error loading booking page:', error);
    notFound();
  }
}
