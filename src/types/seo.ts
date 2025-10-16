// SEO types for TourTrip.app
export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  openGraph: {
    title: string;
    description: string;
    type: 'website' | 'article' | 'product' | 'profile';
    url: string;
    image?: {
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    };
    siteName: string;
    locale: string;
    alternateLocales?: string[];
  };
  twitter: {
    card: 'summary' | 'summary_large_image' | 'app' | 'player';
    site?: string;
    creator?: string;
    title: string;
    description: string;
    image?: string;
  };
  additionalMetaTags?: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
  additionalLinkTags?: Array<{
    rel: string;
    href: string;
    type?: string;
    hreflang?: string;
  }>;
}

export interface StructuredData {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: any;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternateRefs?: Array<{
    href: string;
    hreflang: string;
  }>;
}

// TourTrip specific structured data types
export interface TourStructuredData extends StructuredData {
  '@type': 'TouristTrip';
  name: string;
  description: string;
  image: string | string[];
  provider: {
    '@type': 'Organization';
    name: string;
    url?: string;
  };
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder';
    validFrom?: string;
    validThrough?: string;
  };
  duration?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    '@type': 'Place';
    name: string;
    address?: {
      '@type': 'PostalAddress';
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
    geo?: {
      '@type': 'GeoCoordinates';
      latitude: number;
      longitude: number;
    };
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    ratingCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  review?: Array<{
    '@type': 'Review';
    author: {
      '@type': 'Person';
      name: string;
    };
    reviewRating: {
      '@type': 'Rating';
      ratingValue: number;
      bestRating?: number;
      worstRating?: number;
    };
    reviewBody: string;
    datePublished: string;
  }>;
}

export interface OrganizationStructuredData extends StructuredData {
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description?: string;
  address?: {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  contactPoint?: Array<{
    '@type': 'ContactPoint';
    telephone: string;
    contactType: string;
    areaServed?: string;
    availableLanguage?: string[];
  }>;
  sameAs?: string[];
  foundingDate?: string;
  founder?: {
    '@type': 'Person';
    name: string;
  };
}

export interface LocalBusinessStructuredData extends StructuredData {
  '@type': 'LocalBusiness';
  name: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    ratingCount: number;
  };
  image?: string | string[];
  servesCuisine?: string[];
  acceptsReservations?: boolean;
}

export interface ProductStructuredData extends StructuredData {
  '@type': 'Product';
  name: string;
  description: string;
  image: string | string[];
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder';
    seller: {
      '@type': 'Organization';
      name: string;
    };
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    ratingCount: number;
  };
  review?: Array<{
    '@type': 'Review';
    author: {
      '@type': 'Person';
      name: string;
    };
    reviewRating: {
      '@type': 'Rating';
      ratingValue: number;
    };
    reviewBody: string;
  }>;
}

export interface ArticleStructuredData extends StructuredData {
  '@type': 'Article';
  headline: string;
  description: string;
  image: string | string[];
  author: {
    '@type': 'Person';
    name: string;
    url?: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
}

export interface BreadcrumbStructuredData extends StructuredData {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export interface FAQStructuredData extends StructuredData {
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

export interface SEOAnalysis {
  score: number; // 0-100
  issues: SEOIssue[];
  recommendations: SEORecommendation[];
  metrics: {
    titleLength: number;
    descriptionLength: number;
    keywordDensity: number;
    readabilityScore: number;
    loadTime: number;
    imageOptimization: number;
  };
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: 'meta' | 'content' | 'performance' | 'accessibility' | 'images';
  message: string;
  impact: 'high' | 'medium' | 'low';
  fix?: string;
}

export interface SEORecommendation {
  category: 'meta' | 'content' | 'performance' | 'accessibility' | 'images';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
}

// Configuration interfaces
export interface SEOConfig {
  defaultMetadata: {
    siteName: string;
    siteUrl: string;
    description: string;
    keywords: string[];
    author: string;
    twitterHandle?: string;
    facebookAppId?: string;
    defaultImage: string;
  };
  languages: {
    default: string;
    supported: string[];
  };
  robots: {
    index: boolean;
    follow: boolean;
    googleBot?: {
      index?: boolean;
      follow?: boolean;
      'max-snippet'?: number;
      'max-image-preview'?: 'none' | 'standard' | 'large';
      'max-video-preview'?: number;
    };
  };
  sitemap: {
    enabled: boolean;
    priority: {
      homepage: number;
      pages: number;
      posts: number;
      categories: number;
    };
    changeFreq: {
      homepage: string;
      pages: string;
      posts: string;
      categories: string;
    };
  };
}

// Hook and utility interfaces
export interface UseSEOResult {
  metadata: SEOMetadata;
  updateMetadata: (updates: Partial<SEOMetadata>) => void;
  generateStructuredData: (type: string, data: any) => StructuredData;
  generateBreadcrumbs: (items: BreadcrumbItem[]) => BreadcrumbStructuredData;
}

export interface SEOPageProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  tags?: string[];
  structuredData?: StructuredData[];
}

// Next.js specific interfaces
export interface NextSEOProps {
  title: string;
  description: string;
  canonical?: string;
  openGraph?: {
    url?: string;
    type?: string;
    title?: string;
    description?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
    siteName?: string;
  };
  twitter?: {
    handle?: string;
    site?: string;
    cardType?: string;
  };
  additionalMetaTags?: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
  additionalLinkTags?: Array<{
    rel: string;
    href: string;
    type?: string;
  }>;
}
