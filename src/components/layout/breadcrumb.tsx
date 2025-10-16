'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon } from '@radix-ui/react-icons';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs if no items provided
  const breadcrumbItems = items || generateAutoBreadcrumbs(pathname);

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {breadcrumbItems.map((item, index) => (
          <Fragment key={item.href || index}>
            {index > 0 && (
              <li>
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
              </li>
            )}
            <li>
              {item.href && !item.current ? (
                <Link 
                  href={item.href} 
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

// Auto-generate breadcrumbs from pathname
function generateAutoBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(segment => segment !== '');
  
  const items: BreadcrumbItem[] = [
    { label: 'Ana Sayfa', href: '/' }
  ];

  segments.forEach((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    
    // Customize labels for specific routes
    let label = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    switch (segment) {
      case 'tours':
        label = 'Turlar';
        break;
      case 'booking':
        label = 'Rezervasyon';
        break;
      case 'auth':
        label = 'Giriş';
        break;
      case 'dashboard':
        label = 'Panel';
        break;
      case 'profile':
        label = 'Profil';
        break;
      case 'bookings':
        label = 'Rezervasyonlarım';
        break;
      case 'about':
        label = 'Hakkımızda';
        break;
      case 'providers':
        label = 'Sağlayıcılar';
        break;
      default:
        // For dynamic routes, keep the original segment
        if (segment.length > 10) {
          label = segment.substring(0, 10) + '...';
        }
        break;
    }

    items.push({
      label,
      href: isLast ? undefined : href,
      current: isLast,
    });
  });

  return items;
}

// Predefined breadcrumb configurations
export const breadcrumbs = {
  tours: [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Turlar', current: true },
  ],
  
  tourDetails: (title: string): BreadcrumbItem[] => [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Turlar', href: '/tours' },
    { label: title, current: true },
  ],
  
  booking: (tourTitle: string): BreadcrumbItem[] => [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Turlar', href: '/tours' },
    { label: tourTitle, href: `/tours/${tourTitle.toLowerCase().replace(/\s+/g, '-')}` },
    { label: 'Rezervasyon', current: true },
  ],
  
  dashboard: [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Dashboard', current: true },
  ],
  
  profile: [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Profil', current: true },
  ],
  
  userBookings: [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Rezervasyonlarım', current: true },
  ],
  
  about: [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Hakkımızda', current: true },
  ],
  
  providers: [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Sağlayıcılar', current: true },
  ],

  auth: [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Giriş', current: true },
  ],
};
