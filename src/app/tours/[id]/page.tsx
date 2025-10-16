import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TourDetailPage } from '@/components/tours/tour-detail-page';
import { tourService } from '@/lib/firestore-service';

interface TourPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: TourPageProps): Promise<Metadata> {
  try {
    const tour = await tourService.read(params.id);
    
    if (!tour) {
      return {
        title: 'Tur Bulunamadı',
        description: 'Aradığınız tur bulunamadı.',
      };
    }

    return {
      title: `${tour.title} | TourTrip`,
      description: tour.description,
      keywords: [tour.category, tour.title, 'tur', 'gezi', 'seyahat'].filter(Boolean),
      openGraph: {
        title: tour.title,
        description: tour.description,
        images: tour.images ? [
          {
            url: tour.images[0],
            width: 1200,
            height: 630,
            alt: tour.title,
          }
        ] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: tour.title,
        description: tour.description,
        images: tour.images?.[0] ? [tour.images[0]] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Tur Detayı',
      description: 'Tur detaylarını görüntüleyin.',
    };
  }
}

export default async function TourPage({ params }: TourPageProps) {
  try {
    const tour = await tourService.read(params.id);
    
    if (!tour) {
      notFound();
    }

    return <TourDetailPage tour={tour} />;
  } catch (error) {
    console.error('Error loading tour:', error);
    notFound();
  }
}
