'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import AnalyticsService from '@/lib/analytics-service';
import { 
  AnalyticsEvent, 
  UserProperties, 
  ConversionEvent,
  TourViewEvent,
  TourBookingEvent,
  SearchEvent,
  MarketplaceOrderEvent,
  LoyaltyEvent,
  ShareEvent,
  ReviewEvent,
  UseAnalyticsResult
} from '@/types/analytics';

export function useAnalytics(): UseAnalyticsResult {
  const { user } = useAuth();
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const lastPageRef = useRef<string>('');
  const pageStartTimeRef = useRef<number>(Date.now());
  const engagementIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize analytics
  useEffect(() => {
    if (typeof window !== 'undefined') {
      AnalyticsService.initialize({
        measurement_id: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
        debug_mode: process.env.NODE_ENV === 'development',
        automatic_events: true,
        enhanced_measurements: true,
        conversion_events: [
          'purchase',
          'tour_booking_completed',
          'sign_up',
          'login',
          'review_submitted'
        ],
        custom_dimensions: [
          {
            parameter_name: 'user_type',
            display_name: 'User Type',
            scope: 'user',
            is_active: true,
          },
          {
            parameter_name: 'tour_category',
            display_name: 'Tour Category',
            scope: 'event',
            is_active: true,
          },
          {
            parameter_name: 'booking_source',
            display_name: 'Booking Source',
            scope: 'event',
            is_active: true,
          },
        ],
        audience_triggers: [],
      });

      setDebugMode(process.env.NODE_ENV === 'development');
      AnalyticsService.setDebugMode(process.env.NODE_ENV === 'development');
    }
  }, []);

  // Set user data when user changes
  useEffect(() => {
    if (user) {
      AnalyticsService.setUserId(user.uid);
      
      // Set user properties
      const userProperties: UserProperties = {
        user_id: user.uid,
        user_type: 'registered',
        registration_date: user.metadata.creationTime,
        last_login_date: user.metadata.lastSignInTime,
        preferred_language: 'tr',
        platform: 'web',
        device_type: getDeviceType(),
        browser: getBrowserName(),
      };

      AnalyticsService.setUserProperties(userProperties);
    } else {
      AnalyticsService.clearUser();
      
      // Set anonymous user properties
      const anonymousProperties: UserProperties = {
        user_type: 'guest',
        preferred_language: 'tr',
        platform: 'web',
        device_type: getDeviceType(),
        browser: getBrowserName(),
      };

      AnalyticsService.setUserProperties(anonymousProperties);
    }
  }, [user]);

  // Track page views automatically
  useEffect(() => {
    const handleRouteChange = () => {
      const currentPage = window.location.pathname;
      
      // Track previous page engagement time
      if (lastPageRef.current) {
        const engagementTime = Date.now() - pageStartTimeRef.current;
        AnalyticsService.trackUserEngagement({
          engagement_time_msec: engagementTime,
          page_title: document.title,
          page_location: window.location.href,
          page_referrer: document.referrer,
        });
      }
      
      // Track new page view
      trackPageView(currentPage, document.title);
      
      // Update refs
      lastPageRef.current = currentPage;
      pageStartTimeRef.current = Date.now();
    };

    // Initial page view
    handleRouteChange();

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      if (engagementIntervalRef.current) {
        clearInterval(engagementIntervalRef.current);
      }
    };
  }, []);

  // Track user engagement periodically
  useEffect(() => {
    if (isEnabled) {
      engagementIntervalRef.current = setInterval(() => {
        const engagementTime = Date.now() - pageStartTimeRef.current;
        
        if (engagementTime > 10000) { // Only track if user has been on page for more than 10 seconds
          AnalyticsService.trackUserEngagement({
            engagement_time_msec: engagementTime,
            page_title: document.title,
            page_location: window.location.href,
            scroll_depth: getScrollDepth(),
          });
        }
      }, 30000); // Every 30 seconds
    }

    return () => {
      if (engagementIntervalRef.current) {
        clearInterval(engagementIntervalRef.current);
      }
    };
  }, [isEnabled]);

  // Core tracking functions
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    if (!isEnabled) return;
    
    const validation = AnalyticsService.validateEvent(event);
    if (!validation.valid) {
      console.warn('Invalid analytics event:', validation.errors);
      return;
    }

    AnalyticsService.trackEvent(event);
  }, [isEnabled]);

  const trackPageView = useCallback((page: string, title?: string) => {
    if (!isEnabled) return;
    AnalyticsService.trackPageView(page, title);
  }, [isEnabled]);

  const trackPurchase = useCallback((transaction: ConversionEvent) => {
    if (!isEnabled) return;
    AnalyticsService.trackPurchase(transaction);
  }, [isEnabled]);

  const trackSearch = useCallback((searchParams: SearchEvent['parameters']) => {
    if (!isEnabled) return;
    AnalyticsService.trackSearch(searchParams);
  }, [isEnabled]);

  const trackUserEngagement = useCallback((engagement: any) => {
    if (!isEnabled) return;
    AnalyticsService.trackUserEngagement(engagement);
  }, [isEnabled]);

  // User management
  const setUserId = useCallback((userId: string) => {
    AnalyticsService.setUserId(userId);
  }, []);

  const setUserProperties = useCallback((properties: UserProperties) => {
    AnalyticsService.setUserProperties(properties);
  }, []);

  const clearUser = useCallback(() => {
    AnalyticsService.clearUser();
  }, []);

  // TourTrip specific events
  const trackTourView = useCallback((tourData: TourViewEvent['parameters']) => {
    if (!isEnabled) return;
    AnalyticsService.trackTourView(tourData);
  }, [isEnabled]);

  const trackTourBooking = useCallback((bookingData: TourBookingEvent['parameters']) => {
    if (!isEnabled) return;
    AnalyticsService.trackTourBooking(bookingData);
  }, [isEnabled]);

  const trackMarketplaceOrder = useCallback((orderData: MarketplaceOrderEvent['parameters']) => {
    if (!isEnabled) return;
    AnalyticsService.trackMarketplaceOrder(orderData);
  }, [isEnabled]);

  const trackLoyaltyAction = useCallback((loyaltyData: LoyaltyEvent['parameters']) => {
    if (!isEnabled) return;
    AnalyticsService.trackLoyaltyAction(loyaltyData);
  }, [isEnabled]);

  const trackShare = useCallback((shareData: ShareEvent['parameters']) => {
    if (!isEnabled) return;
    AnalyticsService.trackShare(shareData);
  }, [isEnabled]);

  const trackReview = useCallback((reviewData: ReviewEvent['parameters']) => {
    if (!isEnabled) return;
    AnalyticsService.trackReview(reviewData);
  }, [isEnabled]);

  // Configuration
  const enableAnalytics = useCallback(() => {
    setIsEnabled(true);
    AnalyticsService.setEnabled(true);
  }, []);

  const disableAnalytics = useCallback(() => {
    setIsEnabled(false);
    AnalyticsService.setEnabled(false);
  }, []);

  return {
    // Tracking functions
    trackEvent,
    trackPageView,
    trackPurchase,
    trackSearch,
    trackUserEngagement,
    
    // User management
    setUserId,
    setUserProperties,
    clearUser,
    
    // Custom events
    trackTourView,
    trackTourBooking,
    trackMarketplaceOrder,
    trackLoyaltyAction,
    trackShare,
    trackReview,
    
    // Configuration
    isEnabled,
    debugMode,
    enableAnalytics,
    disableAnalytics,
  };
}

// Hook for e-commerce tracking
export function useEcommerceTracking() {
  const { trackEvent, isEnabled } = useAnalytics();

  const trackAddToCart = useCallback((item: {
    item_id: string;
    item_name: string;
    item_category: string;
    price: number;
    currency: string;
    quantity?: number;
  }) => {
    if (!isEnabled) return;
    AnalyticsService.trackAddToCart(item);
  }, [isEnabled]);

  const trackRemoveFromCart = useCallback((item: {
    item_id: string;
    item_name: string;
    item_category: string;
    price: number;
    currency: string;
    quantity?: number;
  }) => {
    if (!isEnabled) return;
    AnalyticsService.trackRemoveFromCart(item);
  }, [isEnabled]);

  const trackBeginCheckout = useCallback((items: any[], value: number, currency: string) => {
    if (!isEnabled) return;
    AnalyticsService.trackBeginCheckout(items, value, currency);
  }, [isEnabled]);

  const trackAddPaymentInfo = useCallback((paymentType: string, value: number, currency: string) => {
    if (!isEnabled) return;
    AnalyticsService.trackAddPaymentInfo(paymentType, value, currency);
  }, [isEnabled]);

  return {
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackAddPaymentInfo,
  };
}

// Hook for funnel tracking
export function useFunnelTracking() {
  const { trackEvent, isEnabled } = useAnalytics();

  const trackFunnelStep = useCallback((
    funnelName: string, 
    stepNumber: number, 
    stepName: string, 
    additionalParams?: any
  ) => {
    if (!isEnabled) return;
    AnalyticsService.trackFunnelStep(funnelName, stepNumber, stepName, additionalParams);
  }, [isEnabled]);

  const trackBookingFunnel = useCallback((step: 'view' | 'select_date' | 'add_participants' | 'checkout' | 'payment' | 'confirmation', tourId: string) => {
    const stepMap = {
      view: { number: 1, name: 'Tour View' },
      select_date: { number: 2, name: 'Date Selection' },
      add_participants: { number: 3, name: 'Participant Info' },
      checkout: { number: 4, name: 'Checkout' },
      payment: { number: 5, name: 'Payment' },
      confirmation: { number: 6, name: 'Confirmation' },
    };

    const stepInfo = stepMap[step];
    trackFunnelStep('tour_booking', stepInfo.number, stepInfo.name, { tour_id: tourId });
  }, [trackFunnelStep]);

  const trackMarketplaceFunnel = useCallback((step: 'browse' | 'view_item' | 'add_to_cart' | 'checkout' | 'payment' | 'confirmation', itemId: string) => {
    const stepMap = {
      browse: { number: 1, name: 'Browse Items' },
      view_item: { number: 2, name: 'View Item' },
      add_to_cart: { number: 3, name: 'Add to Cart' },
      checkout: { number: 4, name: 'Checkout' },
      payment: { number: 5, name: 'Payment' },
      confirmation: { number: 6, name: 'Confirmation' },
    };

    const stepInfo = stepMap[step];
    trackFunnelStep('marketplace_order', stepInfo.number, stepInfo.name, { item_id: itemId });
  }, [trackFunnelStep]);

  return {
    trackFunnelStep,
    trackBookingFunnel,
    trackMarketplaceFunnel,
  };
}

// Hook for error tracking
export function useErrorTracking() {
  const { trackEvent, isEnabled } = useAnalytics();

  const trackError = useCallback((error: Error, context?: string, fatal?: boolean) => {
    if (!isEnabled) return;
    
    trackEvent({
      name: 'exception',
      parameters: {
        description: error.message,
        fatal: fatal || false,
        context: context || 'unknown',
        stack_trace: error.stack?.substring(0, 500) || '',
        error_name: error.name,
        timestamp: Date.now(),
      },
    });
  }, [trackEvent, isEnabled]);

  const trackApiError = useCallback((endpoint: string, statusCode: number, errorMessage: string) => {
    if (!isEnabled) return;
    
    trackEvent({
      name: 'api_error',
      parameters: {
        endpoint,
        status_code: statusCode,
        error_message: errorMessage,
        timestamp: Date.now(),
      },
    });
  }, [trackEvent, isEnabled]);

  const trackValidationError = useCallback((formName: string, fieldName: string, errorType: string) => {
    if (!isEnabled) return;
    
    trackEvent({
      name: 'validation_error',
      parameters: {
        form_name: formName,
        field_name: fieldName,
        error_type: errorType,
        timestamp: Date.now(),
      },
    });
  }, [trackEvent, isEnabled]);

  return {
    trackError,
    trackApiError,
    trackValidationError,
  };
}

// Hook for performance tracking
export function usePerformanceTracking() {
  const { trackEvent, isEnabled } = useAnalytics();

  const trackPageLoadTime = useCallback((loadTime: number, pageName: string) => {
    if (!isEnabled) return;
    
    trackEvent({
      name: 'page_load_time',
      parameters: {
        page_name: pageName,
        load_time: loadTime,
        timestamp: Date.now(),
      },
    });
  }, [trackEvent, isEnabled]);

  const trackApiResponseTime = useCallback((endpoint: string, responseTime: number, success: boolean) => {
    if (!isEnabled) return;
    
    trackEvent({
      name: 'api_response_time',
      parameters: {
        endpoint,
        response_time: responseTime,
        success,
        timestamp: Date.now(),
      },
    });
  }, [trackEvent, isEnabled]);

  const trackImageLoadTime = useCallback((imageUrl: string, loadTime: number, fileSize?: number) => {
    if (!isEnabled) return;
    
    trackEvent({
      name: 'image_load_time',
      parameters: {
        image_url: imageUrl,
        load_time: loadTime,
        file_size: fileSize,
        timestamp: Date.now(),
      },
    });
  }, [trackEvent, isEnabled]);

  return {
    trackPageLoadTime,
    trackApiResponseTime,
    trackImageLoadTime,
  };
}

// Utility functions
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = navigator.userAgent;
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|phone|android|iphone/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

function getBrowserName(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getScrollDepth(): number {
  if (typeof window === 'undefined') return 0;
  
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY;
  
  return Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
}

export default useAnalytics;
