/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://tourtrip.app',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: [
    '/admin/*',
    '/dashboard/*',
    '/api/*',
    '/login',
    '/register',
    '/404',
    '/500',
    '/_next/*',
    '/cms/*'
  ],
  additionalPaths: async (config) => {
    // Dynamic paths can be added here
    const result = [];

    // Add language-specific paths
    const languages = ['tr', 'en', 'de', 'fr', 'ar', 'ru'];
    const staticPaths = [
      '/',
      '/tours',
      '/marketplace',
      '/loyalty',
      '/about',
      '/contact',
      '/help',
      '/privacy',
      '/terms'
    ];

    languages.forEach(lang => {
      staticPaths.forEach(path => {
        if (lang !== 'tr') { // Turkish is default, no language prefix
          result.push({
            loc: `/${lang}${path === '/' ? '' : path}`,
            changefreq: 'weekly',
            priority: path === '/' ? 1.0 : 0.8,
            lastmod: new Date().toISOString(),
            alternateRefs: languages.map(altLang => ({
              href: `${config.siteUrl}${altLang !== 'tr' ? `/${altLang}` : ''}${path === '/' ? '' : path}`,
              hreflang: altLang,
            })),
          });
        }
      });
    });

    return result;
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/login',
          '/register',
          '/_next/',
          '/cms/'
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      }
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tourtrip.app'}/sitemap-dynamic.xml`,
    ],
  },
  transform: async (config, path) => {
    // Custom transformation for each URL
    const defaultTransform = {
      loc: path,
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    };

    // Higher priority for important pages
    if (path === '/') {
      return {
        ...defaultTransform,
        priority: 1.0,
        changefreq: 'daily',
      };
    }

    if (path.startsWith('/tours')) {
      return {
        ...defaultTransform,
        priority: 0.9,
        changefreq: 'daily',
      };
    }

    if (path.startsWith('/marketplace')) {
      return {
        ...defaultTransform,
        priority: 0.8,
        changefreq: 'daily',
      };
    }

    if (path.startsWith('/blog') || path.startsWith('/guide')) {
      return {
        ...defaultTransform,
        priority: 0.6,
        changefreq: 'monthly',
      };
    }

    return defaultTransform;
  },
};
