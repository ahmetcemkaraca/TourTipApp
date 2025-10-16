import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentUpdated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

// Generate sitemap
export const generateSitemap = onCall(
  {
    region: 'europe-west1',
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async (request: CallableRequest) => {
    try {
const db = getFirestore();

      // Get all published content pages
      const pagesSnapshot = await db.collection('content_pages')
      .where('status', '==', 'published')
      .get();

      // Get all active tours
      const toursSnapshot = await db.collection('tours')
        .where('isActive', '==', true)
        .get();

      // Get all active restaurants
    const restaurantsSnapshot = await db.collection('restaurants')
      .where('isActive', '==', true)
      .get();

      // Get all active shops
    const shopsSnapshot = await db.collection('shops')
      .where('isActive', '==', true)
      .get();

      const baseUrl = 'https://tourtrip.app';

      // Generate static pages
      const staticPages = [
        { url: '/', priority: 1.0, changefreq: 'daily' },
        { url: '/tours', priority: 0.9, changefreq: 'daily' },
        { url: '/restaurants', priority: 0.8, changefreq: 'weekly' },
        { url: '/shops', priority: 0.8, changefreq: 'weekly' },
        { url: '/planner', priority: 0.7, changefreq: 'monthly' },
        { url: '/ai-assistant', priority: 0.6, changefreq: 'monthly' },
        { url: '/about', priority: 0.5, changefreq: 'monthly' },
        { url: '/contact', priority: 0.5, changefreq: 'monthly' },
        { url: '/privacy', priority: 0.3, changefreq: 'yearly' },
        { url: '/terms', priority: 0.3, changefreq: 'yearly' },
      ];

      // Generate dynamic pages
      const dynamicPages: any[] = [];

      // Content pages
      pagesSnapshot.docs.forEach((doc: any) => {
        const page = doc.data();
        dynamicPages.push({
          url: `/page/${page.slug}`,
          priority: 0.6,
          changefreq: 'weekly',
          lastmod: page.updatedAt?.toDate()?.toISOString(),
        });
      });

      // Tours
      toursSnapshot.docs.forEach((doc: any) => {
        const tour = doc.data();
        dynamicPages.push({
          url: `/tours/${doc.id}`,
          priority: 0.8,
          changefreq: 'weekly',
          lastmod: tour.updatedAt?.toDate()?.toISOString(),
        });
      });

      // Restaurants
      restaurantsSnapshot.docs.forEach((doc: any) => {
        const restaurant = doc.data();
        dynamicPages.push({
          url: `/restaurants/${doc.id}`,
          priority: 0.7,
          changefreq: 'weekly',
          lastmod: restaurant.updatedAt?.toDate()?.toISOString(),
        });
      });

      // Shops
      shopsSnapshot.docs.forEach((doc: any) => {
        const shop = doc.data();
        dynamicPages.push({
          url: `/shops/${doc.id}`,
          priority: 0.7,
          changefreq: 'weekly',
          lastmod: shop.updatedAt?.toDate()?.toISOString(),
        });
      });

      // Generate XML sitemap
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${[...staticPages, ...dynamicPages].map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}

</urlset>`;

      // Store sitemap in Firestore for retrieval
      await db.collection('seo_data').doc('sitemap').set({
        content: sitemap,
        generatedAt: new Date(),
        urlCount: staticPages.length + dynamicPages.length,
      });

      return {
        sitemap,
        urlCount: staticPages.length + dynamicPages.length,
        generatedAt: new Date(),
      };

  } catch (error) {
      logger.error('Error generating sitemap:', error);
      throw new HttpsError('internal', 'Failed to generate sitemap');
    }
  }
);

// Generate structured data for tours
export const generateTourStructuredData = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { tourId } = request.data;
    
    if (!tourId) {
      throw new HttpsError('invalid-argument', 'Tour ID is required');
    }

    try {
      const db = getFirestore();
    
      const tourDoc = await db.collection('tours').doc(tourId).get();
    if (!tourDoc.exists) {
        throw new HttpsError('not-found', 'Tour not found');
      }

      const tour = tourDoc.data();

      // Get reviews for aggregate rating
      const reviewsSnapshot = await db.collection('tours')
        .doc(tourId)
        .collection('reviews')
        .where('isApproved', '==', true)
        .get();

      const reviews = reviewsSnapshot.docs.map((doc: any) => doc.data());
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
        : 0;

      // Generate JSON-LD structured data
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
        name: tour?.name || 'Tour',
      description: tour?.description || '',
        image: tour?.images?.[0] || tour?.image,
        offers: {
          '@type': 'Offer',
          price: tour?.price || 0,
          priceCurrency: 'TRY',
          availability: 'https://schema.org/InStock',
          validFrom: tour?.startDate?.toDate()?.toISOString(),
        },
        aggregateRating: reviews.length > 0 ? {
          '@type': 'AggregateRating',
          ratingValue: averageRating.toFixed(1),
          reviewCount: reviews.length,
          bestRating: 5,
          worstRating: 1,
        } : undefined,
      provider: {
        '@type': 'Organization',
        name: 'TourTrip',
        url: 'https://tourtrip.app',
      },
        touristType: tour?.category,
        duration: tour?.duration ? `P${tour.duration}D` : undefined,
        includes: tour?.includes?.split(','),
        excludes: tour?.excludes?.split(','),
        itinerary: tour?.itinerary?.map((item: any) => ({
          '@type': 'ListItem',
          position: item.day,
          item: {
            '@type': 'TouristAttraction',
            name: item.title,
            description: item.description,
          },
        })),
      };

      return { structuredData };

    } catch (error) {
      logger.error('Error generating tour structured data:', error);
      throw new HttpsError('internal', 'Failed to generate structured data');
    }
  }
);

// Generate structured data for restaurants
export const generateRestaurantStructuredData = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { restaurantId } = request.data;

    if (!restaurantId) {
      throw new HttpsError('invalid-argument', 'Restaurant ID is required');
    }

    try {
      const db = getFirestore();

      const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
      if (!restaurantDoc.exists) {
        throw new HttpsError('not-found', 'Restaurant not found');
      }

      const restaurant = restaurantDoc.data();

      // Get reviews
      const reviewsSnapshot = await db.collection('restaurants')
        .doc(restaurantId)
        .collection('reviews')
        .where('isApproved', '==', true)
        .get();

      const reviews = reviewsSnapshot.docs.map((doc: any) => doc.data());
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
        : 0;

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: restaurant?.name || 'Restaurant',
        description: restaurant?.description || '',
        image: restaurant?.images?.[0] || restaurant?.image,
        address: {
          '@type': 'PostalAddress',
          streetAddress: restaurant?.address,
          addressLocality: restaurant?.location?.city,
          addressRegion: restaurant?.location?.district,
          postalCode: restaurant?.location?.postalCode,
          addressCountry: 'TR',
        },
        geo: restaurant?.location ? {
          '@type': 'GeoCoordinates',
          latitude: restaurant?.location?.latitude,
          longitude: restaurant?.location?.longitude,
      } : undefined,
        telephone: restaurant?.phone,
        url: restaurant?.website,
        priceRange: restaurant?.priceRange === 'budget' ? '$' :
                   restaurant?.priceRange === 'moderate' ? '$$' :
                   restaurant?.priceRange === 'expensive' ? '$$$' : '$$$$',
        servesCuisine: restaurant?.cuisineType,
        aggregateRating: reviews.length > 0 ? {
        '@type': 'AggregateRating',
          ratingValue: averageRating.toFixed(1),
          reviewCount: reviews.length,
      } : undefined,
        openingHoursSpecification: Object.entries(restaurant?.openingHours || {}).map(([day, hours]: [string, any]) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: `https://schema.org/${day.charAt(0).toUpperCase() + day.slice(1)}`,
          opens: hours.isOpen ? hours.open : null,
          closes: hours.isOpen ? hours.close : null,
        })),
      };

      return { structuredData };

  } catch (error) {
      logger.error('Error generating restaurant structured data:', error);
      throw new HttpsError('internal', 'Failed to generate structured data');
    }
  }
);

// Generate meta tags for page
export const generateMetaTags = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { pageType, entityId, customData } = request.data;

    if (!pageType) {
      throw new HttpsError('invalid-argument', 'Page type is required');
    }

    try {
      const db = getFirestore();
      let entity = null;

      // Get entity data based on type
      if (entityId) {
        switch (pageType) {
          case 'tour':
            const tourDoc = await db.collection('tours').doc(entityId).get();
            entity = tourDoc.exists ? tourDoc.data() : null;
            break;
          case 'restaurant':
            const restaurantDoc = await db.collection('restaurants').doc(entityId).get();
            entity = restaurantDoc.exists ? restaurantDoc.data() : null;
            break;
          case 'shop':
            const shopDoc = await db.collection('shops').doc(entityId).get();
            entity = shopDoc.exists ? shopDoc.data() : null;
            break;
          case 'content':
            const contentDoc = await db.collection('content_pages').doc(entityId).get();
            entity = contentDoc.exists ? contentDoc.data() : null;
            break;
        }
      }

      // Generate meta tags
      const metaTags = {
        title: generateTitle(pageType, entity, customData),
        description: generateDescription(pageType, entity, customData),
        keywords: generateKeywords(pageType, entity, customData),
        image: generateImage(pageType, entity, customData),
        url: generateUrl(pageType, entityId, customData),
        type: getOpenGraphType(pageType),
        siteName: 'TourTrip',
        locale: 'tr_TR',
        alternateLocales: ['en_US', 'de_DE'],
      };

      return { metaTags };

  } catch (error) {
      logger.error('Error generating meta tags:', error);
      throw new HttpsError('internal', 'Failed to generate meta tags');
    }
  }
);

// Submit to search engines (ping)
export const submitToSearchEngines = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { urls } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!urls || !Array.isArray(urls)) {
      throw new HttpsError('invalid-argument', 'URLs array is required');
    }

    try {
      // In a real implementation, you would ping search engines
      // For now, just log the submission
      logger.info('Submitting URLs to search engines:', urls);

      // Store submission record
      const db = getFirestore();
      await db.collection('seo_submissions').add({
        urls,
        submittedBy: userId,
        submittedAt: new Date(),
        status: 'pending',
      });

      return { success: true, submittedUrls: urls.length };

  } catch (error) {
      logger.error('Error submitting to search engines:', error);
      throw new HttpsError('internal', 'Failed to submit to search engines');
    }
  }
);

// Update SEO analytics
export const updateSEOAnalytics = onDocumentUpdated(
  'content_pages',
  async (event: FirestoreEvent<any, any>) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();

    if (!newData || !previousData) return;

    // Only update if content changed
    if (newData.content?.tr !== previousData.content?.tr ||
        newData.title?.tr !== previousData.title?.tr) {

      const db = getFirestore();

      // Mark for re-indexing
      await db.collection('seo_queue').add({
        type: 'content_update',
        entityId: event.params.pageId,
        entityType: 'page',
        priority: 'normal',
        queuedAt: new Date(),
        status: 'pending',
      });
    }
  }
);

// Helper functions
function generateTitle(pageType: string, entity: any, customData: any): string {
  const baseTitle = 'TourTrip - Seyahat ve Tur Rezervasyon Platformu';

  switch (pageType) {
    case 'tour':
      return entity ? `${entity.name} - TourTrip` : baseTitle;
    case 'restaurant':
      return entity ? `${entity.name} Restoranı - TourTrip` : baseTitle;
    case 'shop':
      return entity ? `${entity.name} - TourTrip Alışveriş` : baseTitle;
    case 'content':
      return entity ? `${entity.title?.tr || entity.title} - TourTrip` : baseTitle;
    default:
      return customData?.title || baseTitle;
  }
}

function generateDescription(pageType: string, entity: any, customData: any): string {
  const baseDescription = 'Türkiye\'nin en büyük seyahat ve tur rezervasyon platformu. Tur, restoran ve mağaza rezervasyonlarınızı kolayca yapın.';

  switch (pageType) {
    case 'tour':
      return entity?.description?.substring(0, 160) || baseDescription;
    case 'restaurant':
      return entity?.description?.substring(0, 160) ||
             `${entity?.name} restoranı hakkında bilgi, menü ve rezervasyon.`;
    case 'shop':
      return entity?.description?.substring(0, 160) ||
             `${entity?.name} mağazası ürünleri ve hizmetleri.`;
    case 'content':
      return entity?.excerpt?.tr?.substring(0, 160) ||
             entity?.content?.tr?.substring(0, 160) || baseDescription;
    default:
      return customData?.description || baseDescription;
  }
}

function generateKeywords(pageType: string, entity: any, customData: any): string[] {
  const baseKeywords = ['seyahat', 'tur', 'rezervasyon', 'Türkiye', 'tatil'];

  switch (pageType) {
    case 'tour':
      return entity ? [
        ...baseKeywords,
        entity.category || '',
        entity.location?.city || '',
        'tur rezervasyonu',
      ].filter(Boolean) : baseKeywords;
    case 'restaurant':
      return entity ? [
        ...baseKeywords,
        'restoran',
        entity.cuisineType?.[0] || '',
        entity.location?.city || '',
        'rezervasyon',
      ].filter(Boolean) : baseKeywords;
    case 'shop':
      return entity ? [
        ...baseKeywords,
        'alışveriş',
        entity.category || '',
        'ürün',
        'satın al',
      ].filter(Boolean) : baseKeywords;
    default:
      return customData?.keywords || baseKeywords;
  }
}

function generateImage(pageType: string, entity: any, customData: any): string {
  const defaultImage = 'https://tourtrip.app/images/default-og.jpg';

  if (customData?.image) return customData.image;

  switch (pageType) {
    case 'tour':
    case 'restaurant':
    case 'shop':
      return entity?.images?.[0] || entity?.image || defaultImage;
    case 'content':
      return entity?.media?.featuredImage || defaultImage;
    default:
      return defaultImage;
  }
}

function generateUrl(pageType: string, entityId: string, customData: any): string {
  const baseUrl = 'https://tourtrip.app';

  if (customData?.url) return customData.url;

  switch (pageType) {
    case 'tour':
      return `${baseUrl}/tours/${entityId}`;
    case 'restaurant':
      return `${baseUrl}/restaurants/${entityId}`;
    case 'shop':
      return `${baseUrl}/shops/${entityId}`;
    case 'content':
      return `${baseUrl}/page/${entityId}`;
    default:
      return baseUrl;
  }
}

function getOpenGraphType(pageType: string): string {
  switch (pageType) {
    case 'tour':
    case 'restaurant':
    case 'shop':
      return 'business.business';
    case 'content':
      return 'article';
    default:
      return 'website';
  }
}