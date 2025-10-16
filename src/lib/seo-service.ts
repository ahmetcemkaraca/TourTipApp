import { Metadata } from 'next';
import { 
  SEOMetadata, 
  StructuredData, 
  TourStructuredData, 
  OrganizationStructuredData,
  ArticleStructuredData,
  BreadcrumbStructuredData,
  FAQStructuredData,
  BreadcrumbItem,
  SEOConfig
} from '../types/seo';

// Default SEO configuration
const DEFAULT_SEO_CONFIG: SEOConfig = {
  defaultMetadata: {
    siteName: 'TourTrip',
    siteUrl: 'https://tourtrip.app',
    description: 'Türkiye\'nin en kapsamlı tur ve gezi platformu. En iyi fiyatlarla unutulmaz seyahat deneyimleri.',
    keywords: ['tur', 'gezi', 'seyahat', 'tatil', 'turizm', 'türkiye', 'istanbul', 'antalya', 'kapadokya'],
    author: 'TourTrip Team',
    twitterHandle: '@tourtrip_app',
    defaultImage: 'https://tourtrip.app/images/og-default.jpg',
  },
  languages: {
    default: 'tr',
    supported: ['tr', 'en', 'de', 'fr', 'ar', 'ru'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  sitemap: {
    enabled: true,
    priority: {
      homepage: 1.0,
      pages: 0.8,
      posts: 0.6,
      categories: 0.5,
    },
    changeFreq: {
      homepage: 'daily',
      pages: 'weekly',
      posts: 'monthly',
      categories: 'weekly',
    },
  },
};

// SEO Service Class
export class SEOService {
  private static config: SEOConfig = DEFAULT_SEO_CONFIG;

  static setConfig(config: Partial<SEOConfig>): void {
    this.config = { ...this.config, ...config };
  }

  static getConfig(): SEOConfig {
    return this.config;
  }

  // Generate Next.js Metadata object
  static generateMetadata(params: {
    title: string;
    description: string;
    canonical?: string;
    image?: string;
    type?: 'website' | 'article' | 'product';
    publishedAt?: string;
    modifiedAt?: string;
    author?: string;
    keywords?: string[];
    noIndex?: boolean;
    alternateLanguages?: { [lang: string]: string };
  }): Metadata {
    const { defaultMetadata } = this.config;
    const fullTitle = params.title === defaultMetadata.siteName 
      ? params.title 
      : `${params.title} | ${defaultMetadata.siteName}`;

    const canonical = params.canonical || `${defaultMetadata.siteUrl}${params.canonical || ''}`;
    const image = params.image || defaultMetadata.defaultImage;

    const metadata: Metadata = {
      title: fullTitle,
      description: params.description,
      keywords: params.keywords || defaultMetadata.keywords,
      authors: params.author ? [{ name: params.author }] : [{ name: defaultMetadata.author }],
      creator: defaultMetadata.author,
      publisher: defaultMetadata.siteName,
      robots: params.noIndex ? 'noindex,nofollow' : 'index,follow',
      alternates: {
        canonical,
        ...(params.alternateLanguages && {
          languages: params.alternateLanguages,
        }),
      },
      openGraph: {
        title: fullTitle,
        description: params.description,
        url: canonical,
        siteName: defaultMetadata.siteName,
        images: [{
          url: image,
          width: 1200,
          height: 630,
          alt: params.title,
        }],
        locale: this.config.languages.default,
        type: params.type || 'website',
        ...(params.publishedAt && { publishedTime: params.publishedAt }),
        ...(params.modifiedAt && { modifiedTime: params.modifiedAt }),
      },
      twitter: {
        card: 'summary_large_image',
        title: fullTitle,
        description: params.description,
        images: [image],
        creator: defaultMetadata.twitterHandle,
        site: defaultMetadata.twitterHandle,
      },
      other: {
        'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
      },
    };

    return metadata;
  }

  // Generate structured data for tours
  static generateTourStructuredData(tour: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    images: string[];
    provider: string;
    location: {
      name: string;
      coordinates: { latitude: number; longitude: number };
      address?: string;
    };
    duration?: number;
    startDate?: Date;
    endDate?: Date;
    rating?: number;
    reviewCount?: number;
    reviews?: Array<{
      author: string;
      rating: number;
      text: string;
      date: Date;
    }>;
  }): TourStructuredData {
    const structuredData: TourStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      name: tour.title,
      description: tour.description,
      image: tour.images,
      provider: {
        '@type': 'Organization',
        name: tour.provider,
        url: this.config.defaultMetadata.siteUrl,
      },
      offers: {
        '@type': 'Offer',
        price: tour.price.toString(),
        priceCurrency: tour.currency,
        availability: 'InStock',
      },
      location: {
        '@type': 'Place',
        name: tour.location.name,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: tour.location.coordinates.latitude,
          longitude: tour.location.coordinates.longitude,
        },
        ...(tour.location.address && {
          address: {
            '@type': 'PostalAddress',
            streetAddress: tour.location.address,
          },
        }),
      },
    };

    if (tour.duration) {
      structuredData.duration = `PT${tour.duration}H`;
    }

    if (tour.startDate) {
      structuredData.startDate = tour.startDate.toISOString();
    }

    if (tour.endDate) {
      structuredData.endDate = tour.endDate.toISOString();
    }

    if (tour.rating && tour.reviewCount) {
      structuredData.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: tour.rating,
        ratingCount: tour.reviewCount,
        bestRating: 5,
        worstRating: 1,
      };
    }

    if (tour.reviews && tour.reviews.length > 0) {
      structuredData.review = tour.reviews.map(review => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: review.author,
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: review.text,
        datePublished: review.date.toISOString(),
      }));
    }

    return structuredData;
  }

  // Generate organization structured data
  static generateOrganizationStructuredData(): OrganizationStructuredData {
    const { defaultMetadata } = this.config;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: defaultMetadata.siteName,
      url: defaultMetadata.siteUrl,
      logo: `${defaultMetadata.siteUrl}/images/logo.png`,
      description: defaultMetadata.description,
      contactPoint: [{
        '@type': 'ContactPoint',
        telephone: '+90-212-555-0123',
        contactType: 'customer service',
        areaServed: 'TR',
        availableLanguage: ['Turkish', 'English'],
      }],
      sameAs: [
        'https://facebook.com/tourtrip',
        'https://twitter.com/tourtrip_app',
        'https://instagram.com/tourtrip',
        'https://linkedin.com/company/tourtrip',
      ],
      foundingDate: '2024',
    };
  }

  // Generate article structured data
  static generateArticleStructuredData(article: {
    title: string;
    description: string;
    content: string;
    author: string;
    publishedAt: Date;
    modifiedAt: Date;
    image: string;
    url: string;
  }): ArticleStructuredData {
    const { defaultMetadata } = this.config;

    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      image: [article.image],
      author: {
        '@type': 'Person',
        name: article.author,
      },
      publisher: {
        '@type': 'Organization',
        name: defaultMetadata.siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${defaultMetadata.siteUrl}/images/logo.png`,
        },
      },
      datePublished: article.publishedAt.toISOString(),
      dateModified: article.modifiedAt.toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': article.url,
      },
    };
  }

  // Generate breadcrumb structured data
  static generateBreadcrumbStructuredData(items: BreadcrumbItem[]): BreadcrumbStructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  // Generate FAQ structured data
  static generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>): FAQStructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  // Generate robots.txt content
  static generateRobotsTxt(): string {
    const { siteUrl } = this.config.defaultMetadata;
    
    return `# Robots.txt for ${siteUrl}
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/sitemap-0.xml

# Block admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /login
Disallow: /dashboard/

# Allow search engines to crawl CSS and JS
Allow: /_next/static/

# Crawl-delay for specific bots
User-agent: bingbot
Crawl-delay: 1

User-agent: Slurp
Crawl-delay: 1
`;
  }

  // Generate canonical URL
  static generateCanonicalUrl(path: string, params?: { [key: string]: string }): string {
    const { siteUrl } = this.config.defaultMetadata;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let url = `${siteUrl}${cleanPath}`;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    return url;
  }

  // Calculate reading time
  static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  // Extract keywords from content
  static extractKeywords(content: string, maxKeywords: number = 10): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  // Generate hreflang links
  static generateHreflangLinks(
    currentPath: string, 
    supportedLanguages: string[] = this.config.languages.supported
  ): Array<{ hreflang: string; href: string }> {
    const { siteUrl } = this.config.defaultMetadata;
    
    return supportedLanguages.map(lang => ({
      hreflang: lang,
      href: `${siteUrl}/${lang}${currentPath}`,
    }));
  }

  // Validate SEO metadata
  static validateSEOMetadata(metadata: Partial<SEOMetadata>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Title validation
    if (!metadata.title) {
      errors.push('Title is required');
    } else {
      if (metadata.title.length < 30) {
        warnings.push('Title is too short (recommended: 30-60 characters)');
      }
      if (metadata.title.length > 60) {
        warnings.push('Title is too long (recommended: 30-60 characters)');
      }
    }

    // Description validation
    if (!metadata.description) {
      errors.push('Description is required');
    } else {
      if (metadata.description.length < 120) {
        warnings.push('Description is too short (recommended: 120-160 characters)');
      }
      if (metadata.description.length > 160) {
        warnings.push('Description is too long (recommended: 120-160 characters)');
      }
    }

    // Open Graph validation
    if (metadata.openGraph) {
      if (!metadata.openGraph.image) {
        warnings.push('Open Graph image is recommended');
      }
      if (!metadata.openGraph.url) {
        warnings.push('Open Graph URL is recommended');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Generate social media meta tags
  static generateSocialMetaTags(params: {
    title: string;
    description: string;
    image: string;
    url: string;
    type?: string;
  }): Array<{ property: string; content: string }> {
    const { defaultMetadata } = this.config;

    return [
      // Open Graph
      { property: 'og:title', content: params.title },
      { property: 'og:description', content: params.description },
      { property: 'og:image', content: params.image },
      { property: 'og:url', content: params.url },
      { property: 'og:type', content: params.type || 'website' },
      { property: 'og:site_name', content: defaultMetadata.siteName },
      { property: 'og:locale', content: this.config.languages.default },

      // Twitter
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: params.title },
      { property: 'twitter:description', content: params.description },
      { property: 'twitter:image', content: params.image },
      { property: 'twitter:site', content: defaultMetadata.twitterHandle || '' },
      { property: 'twitter:creator', content: defaultMetadata.twitterHandle || '' },
    ];
  }

  // Generate JSON-LD script tag
  static generateJSONLD(structuredData: StructuredData | StructuredData[]): string {
    const data = Array.isArray(structuredData) ? structuredData : [structuredData];
    
    return `<script type="application/ld+json">
${JSON.stringify(data, null, 2)}
</script>`;
  }

  // URL optimization
  static optimizeUrl(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  // Generate sitemap entry
  static generateSitemapEntry(params: {
    url: string;
    lastModified?: Date;
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
    alternateLanguages?: { [lang: string]: string };
  }): string {
    let entry = `  <url>
    <loc>${params.url}</loc>`;

    if (params.lastModified) {
      entry += `
    <lastmod>${params.lastModified.toISOString().split('T')[0]}</lastmod>`;
    }

    if (params.changeFrequency) {
      entry += `
    <changefreq>${params.changeFrequency}</changefreq>`;
    }

    if (params.priority !== undefined) {
      entry += `
    <priority>${params.priority}</priority>`;
    }

    if (params.alternateLanguages) {
      Object.entries(params.alternateLanguages).forEach(([lang, url]) => {
        entry += `
    <xhtml:link rel="alternate" hreflang="${lang}" href="${url}" />`;
      });
    }

    entry += `
  </url>`;

    return entry;
  }
}

// Hook for using SEO in React components
export function useSEO(initialMetadata?: Partial<SEOMetadata>) {
  const generateMetadata = (updates: Partial<SEOMetadata> = {}) => {
    const merged = { ...initialMetadata, ...updates };
    return SEOService.generateMetadata({
      title: merged.title || 'TourTrip',
      description: merged.description || SEOService.getConfig().defaultMetadata.description,
      canonical: merged.canonical,
      keywords: merged.keywords,
      noIndex: merged.noIndex,
    });
  };

  const generateStructuredData = (type: string, data: any): StructuredData => {
    switch (type) {
      case 'tour':
        return SEOService.generateTourStructuredData(data);
      case 'article':
        return SEOService.generateArticleStructuredData(data);
      case 'organization':
        return SEOService.generateOrganizationStructuredData();
      case 'breadcrumb':
        return SEOService.generateBreadcrumbStructuredData(data);
      case 'faq':
        return SEOService.generateFAQStructuredData(data);
      default:
        throw new Error(`Unknown structured data type: ${type}`);
    }
  };

  return {
    generateMetadata,
    generateStructuredData,
    generateCanonicalUrl: SEOService.generateCanonicalUrl,
    optimizeUrl: SEOService.optimizeUrl,
    calculateReadingTime: SEOService.calculateReadingTime,
    extractKeywords: SEOService.extractKeywords,
    validateMetadata: SEOService.validateSEOMetadata,
  };
}

export default SEOService;
