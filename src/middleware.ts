import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/profile',
  '/bookings',
  '/favorites',
  '/settings',
  '/dashboard',
  '/trip-planner',
  '/admin',
];

// Routes that are only for non-authenticated users
const authRoutes = [
  '/auth',
  '/login',
  '/signup',
  '/forgot-password',
];

// Admin routes
const adminRoutes = [
  '/admin',
];

export function middleware(request: NextRequest) {
  // Skip middleware in development or when using static export
  if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true') {
    return NextResponse.next();
  }
  
  const { pathname } = request.nextUrl;
  
  // Get auth token from cookies
  const authToken = request.cookies.get('__session')?.value;
  const isAuthenticated = !!authToken;
  
  // Get user role from cookies (set by auth context)
  const userRole = request.cookies.get('userRole')?.value;
  const isAdmin = userRole === 'admin';

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current route is auth-only
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current route is admin-only
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users trying to access auth routes
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect non-admin users trying to access admin routes
  if (isAdminRoute && (!isAuthenticated || !isAdmin)) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Add security headers
  const response = NextResponse.next();
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://www.google-analytics.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https: blob:;
      connect-src 'self' https://api.tourtrip.app https://firestore.googleapis.com https://identitytoolkit.googleapis.com;
      frame-src 'self' https://www.google.com;
    `.replace(/\s{2,}/g, ' ').trim()
  );

  // Other security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
