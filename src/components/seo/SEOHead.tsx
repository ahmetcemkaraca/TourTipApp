'use client';

import Head from 'next/head';
import { useMemo } from 'react';
import { SEOMetadata, StructuredData } from '@/types/seo';
import { SEOService } from '@/lib/seo-service';

interface SEOHeadProps {
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
  structuredData?: StructuredData | StructuredData[];
  alternateLanguages?: { [lang: string]: string };
}

export default function SEOHead({
  title,
  description,
  canonical,
  image,
  type = 'website',
  publishedAt,
  modifiedAt,
  author,
  keywords,
  noIndex = false,
  structuredData,
  alternateLanguages,
}: SEOHeadProps) {
  const config = SEOService.getConfig();
  const { defaultMetadata } = config;

  const fullTitle = useMemo(() => {
    return title === defaultMetadata.siteName 
      ? title 
      : `${title} | ${defaultMetadata.siteName}`;
  }, [title, defaultMetadata.siteName]);

  const canonicalUrl = useMemo(() => {
    return canonical || `${defaultMetadata.siteUrl}${canonical || ''}`;
  }, [canonical, defaultMetadata.siteUrl]);

  const imageUrl = useMemo(() => {
    return image || defaultMetadata.defaultImage;
  }, [image, defaultMetadata.defaultImage]);

  const metaKeywords = useMemo(() => {
    return keywords?.join(', ') || defaultMetadata.keywords.join(', ');
  }, [keywords, defaultMetadata.keywords]);

  const socialMetaTags = useMemo(() => {
    return SEOService.generateSocialMetaTags({
      title: fullTitle,
      description,
      image: imageUrl,
      url: canonicalUrl,
      type,
    });
  }, [fullTitle, description, imageUrl, canonicalUrl, type]);

  const jsonLD = useMemo(() => {
    if (!structuredData) return null;
    return SEOService.generateJSONLD(structuredData);
  }, [structuredData]);

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={author || defaultMetadata.author} />
      <meta name="creator" content={defaultMetadata.author} />
      <meta name="publisher" content={defaultMetadata.siteName} />

      {/* Robots */}
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      <meta name="googlebot" content={noIndex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Language Alternatives */}
      {alternateLanguages && Object.entries(alternateLanguages).map(([lang, url]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}

      {/* Social Media Meta Tags */}
      {socialMetaTags.map((tag, index) => (
        <meta key={index} property={tag.property} content={tag.content} />
      ))}

      {/* Additional Meta Tags */}
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {modifiedAt && <meta property="article:modified_time" content={modifiedAt} />}
      {author && <meta property="article:author" content={author} />}

      {/* Favicon and Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#0066cc" />

      {/* Apple Meta Tags */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={defaultMetadata.siteName} />

      {/* Microsoft Meta Tags */}
      <meta name="msapplication-TileColor" content="#0066cc" />
      <meta name="msapplication-config" content="/browserconfig.xml" />

      {/* Security Headers */}
      <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      <meta name="referrer" content="origin-when-cross-origin" />

      {/* Performance Hints */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//maps.googleapis.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* Structured Data */}
      {jsonLD && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLD }}
        />
      )}

      {/* Google Site Verification */}
      {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
        <meta 
          name="google-site-verification" 
          content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} 
        />
      )}

      {/* Bing Site Verification */}
      {process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION && (
        <meta 
          name="msvalidate.01" 
          content={process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION} 
        />
      )}

      {/* Facebook App ID */}
      {process.env.NEXT_PUBLIC_FACEBOOK_APP_ID && (
        <meta property="fb:app_id" content={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID} />
      )}
    </Head>
  );
}
