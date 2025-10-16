// Analytics Service for TourTrip.app
import { getAnalytics, logEvent, setUserId, setUserProperties as setGAUserProperties, setCurrentScreen } from 'firebase/analytics';
import { getApp } from 'firebase/app';
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
  CustomMetric,
  AnalyticsConfig,
  AnalyticsError
} from '@/types/analytics';

export class AnalyticsService {
  private static analytics: any = null;
  private static isInitialized = false;
  private static isEnabled = true;
  private static debugMode = false;
  private static userId: string | null = null;
  private static sessionId: string | null = null;
  private static eventQueue: AnalyticsEvent[] = [];
  private static config: AnalyticsConfig = {
    measurement_id: '',
    debug_mode: false,
    automatic_events: true,
    enhanced_measurements: true,
    custom_dimensions: [],
    conversion_events: [],
    audience_triggers: [],
  };

  // Initialize Analytics
  static initialize(config?: Partial<AnalyticsConfig>): void {
    if (typeof window === 'undefined') return;

    try {
      const app = getApp();
      this.analytics = getAnalytics(app);
      this.isInitialized = true;
      
      if (config) {
        this.config = { ...this.config, ...config };
      }

      this.debugMode = this.config.debug_mode;
      
      // Generate session ID
      this.generateSessionId();
      
      // Process queued events
      this.processEventQueue();
      
      console.log('Firebase Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error);
      this.handleError('INIT_ERROR', 'Failed to initialize analytics', error);
    }
  }

  // Generate unique session ID
  private static generateSessionId(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Enable/Disable Analytics
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (this.analytics) {
      // Firebase Analytics doesn't have a direct disable method
      // We'll control it at the service level
      console.log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  // Set debug mode
  static setDebugMode(debug: boolean): void {
    this.debugMode = debug;
  }

  // Set user ID
  static setUserId(userId: string): void {
    this.userId = userId;
    
    if (this.isInitialized && this.analytics) {
      setUserId(this.analytics, userId);
    }
    
    this.log('User ID set:', userId);
  }

  // Clear user
  static clearUser(): void {
    this.userId = null;
    
    if (this.isInitialized && this.analytics) {
      setUserId(this.analytics, null);
    }
    
    this.log('User cleared');
  }

  // Set user properties
  static setUserProperties(properties: UserProperties): void {
    if (this.isInitialized && this.analytics) {
      // Convert to Firebase Analytics format
      const gaProperties: { [key: string]: any } = {};
      
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          gaProperties[key] = String(value);
        }
      });
      
      setGAUserProperties(this.analytics, gaProperties);
    }
    
    this.log('User properties set:', properties);
  }

  // Track generic event
  static trackEvent(event: AnalyticsEvent): void {
    if (!this.isEnabled) return;

    // Add metadata
    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
      userId: event.userId || this.userId || undefined,
      sessionId: event.sessionId || this.sessionId || undefined,
    };

    if (this.isInitialized && this.analytics) {
      logEvent(this.analytics, event.name, event.parameters);
    } else {
      // Queue event if not initialized
      this.eventQueue.push(enrichedEvent);
    }

    this.log('Event tracked:', enrichedEvent);
  }

  // Track page view
  static trackPageView(page: string, title?: string): void {
    this.trackEvent({
      name: 'page_view',
      parameters: {
        page_title: title || document.title,
        page_location: window.location.href,
        page_path: page,
        page_referrer: document.referrer,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timestamp: Date.now(),
      },
    });

    // Set current screen for Firebase
    if (this.isInitialized && this.analytics) {
      setCurrentScreen(this.analytics, title || page);
    }
  }

  // Track purchase/conversion
  static trackPurchase(transaction: ConversionEvent): void {
    this.trackEvent({
      name: transaction.event_name,
      parameters: {
        transaction_id: transaction.transaction_id,
        value: transaction.value,
        currency: transaction.currency || 'TRY',
        items: transaction.items || [],
        coupon: transaction.coupon,
        payment_type: transaction.payment_type,
        tax: 0, // Can be calculated
        shipping: 0, // Can be calculated
        affiliation: 'TourTrip',
      },
    });
  }

  // Track search
  static trackSearch(searchParams: SearchEvent['parameters']): void {
    this.trackEvent({
      name: 'search',
      parameters: {
        ...searchParams,
        search_id: `search_${Date.now()}`,
        search_timestamp: Date.now(),
      },
    });
  }

  // Track user engagement
  static trackUserEngagement(engagementParams: {
    engagement_time_msec: number;
    page_title: string;
    page_location: string;
    page_referrer?: string;
    session_duration?: number;
    scroll_depth?: number;
  }): void {
    this.trackEvent({
      name: 'user_engagement',
      parameters: engagementParams,
    });
  }

  // TourTrip specific events
  static trackTourView(tourData: TourViewEvent['parameters']): void {
    this.trackEvent({
      name: 'view_item',
      parameters: {
        ...tourData,
        content_type: 'tour',
        item_list_name: 'tour_catalog',
      },
    });
  }

  static trackTourBooking(bookingData: TourBookingEvent['parameters']): void {
    this.trackEvent({
      name: 'purchase',
      parameters: {
        ...bookingData,
        content_type: 'tour_booking',
        affiliation: 'TourTrip',
      },
    });

    // Also track as conversion
    this.trackEvent({
      name: 'tour_booking_completed',
      parameters: {
        transaction_id: bookingData.transaction_id,
        value: bookingData.value,
        currency: bookingData.currency,
        participants: bookingData.participants,
        tour_date: bookingData.tour_date,
      },
    });
  }

  static trackMarketplaceOrder(orderData: MarketplaceOrderEvent['parameters']): void {
    this.trackEvent({
      name: 'purchase',
      parameters: {
        ...orderData,
        content_type: 'marketplace_order',
        affiliation: 'TourTrip Marketplace',
      },
    });
  }

  static trackLoyaltyAction(loyaltyData: LoyaltyEvent['parameters']): void {
    this.trackEvent({
      name: loyaltyData.action_type === 'earned' ? 'earn_virtual_currency' : 'spend_virtual_currency',
      parameters: loyaltyData,
    });
  }

  static trackShare(shareData: ShareEvent['parameters']): void {
    this.trackEvent({
      name: 'share',
      parameters: shareData,
    });
  }

  static trackReview(reviewData: ReviewEvent['parameters']): void {
    this.trackEvent({
      name: 'post_score',
      parameters: reviewData,
    });

    // Additional review metrics
    this.trackEvent({
      name: 'review_submitted',
      parameters: {
        ...reviewData,
        review_quality_score: this.calculateReviewQuality(reviewData),
      },
    });
  }

  // Custom business events
  static trackSignUp(method: string, userId: string): void {
    this.trackEvent({
      name: 'sign_up',
      parameters: {
        method,
        user_id: userId,
        timestamp: Date.now(),
      },
    });
  }

  static trackLogin(method: string, userId: string): void {
    this.trackEvent({
      name: 'login',
      parameters: {
        method,
        user_id: userId,
        timestamp: Date.now(),
      },
    });
  }

  static trackLogout(userId: string): void {
    this.trackEvent({
      name: 'logout',
      parameters: {
        user_id: userId,
        session_duration: this.getSessionDuration(),
        timestamp: Date.now(),
      },
    });
  }

  static trackAddToCart(item: {
    item_id: string;
    item_name: string;
    item_category: string;
    price: number;
    currency: string;
  }): void {
    this.trackEvent({
      name: 'add_to_cart',
      parameters: {
        currency: item.currency,
        value: item.price,
        items: [item],
      },
    });
  }

  static trackRemoveFromCart(item: {
    item_id: string;
    item_name: string;
    item_category: string;
    price: number;
    currency: string;
  }): void {
    this.trackEvent({
      name: 'remove_from_cart',
      parameters: {
        currency: item.currency,
        value: item.price,
        items: [item],
      },
    });
  }

  static trackBeginCheckout(items: any[], value: number, currency: string): void {
    this.trackEvent({
      name: 'begin_checkout',
      parameters: {
        currency,
        value,
        items,
        checkout_step: 1,
        checkout_option: 'start',
      },
    });
  }

  static trackAddPaymentInfo(paymentType: string, value: number, currency: string): void {
    this.trackEvent({
      name: 'add_payment_info',
      parameters: {
        currency,
        value,
        payment_type: paymentType,
        checkout_step: 2,
        checkout_option: 'payment_info',
      },
    });
  }

  // Error tracking
  static trackError(error: Error, context?: string): void {
    this.trackEvent({
      name: 'exception',
      parameters: {
        description: error.message,
        fatal: false,
        context: context || 'unknown',
        stack_trace: error.stack?.substring(0, 500) || '',
        timestamp: Date.now(),
      },
    });
  }

  // Performance tracking
  static trackPerformance(metric: CustomMetric): void {
    this.trackEvent({
      name: 'performance_metric',
      parameters: {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit || 'ms',
        ...metric.tags,
        timestamp: Date.now(),
      },
    });
  }

  // Funnel tracking
  static trackFunnelStep(funnelName: string, stepNumber: number, stepName: string, additionalParams?: any): void {
    this.trackEvent({
      name: 'funnel_step',
      parameters: {
        funnel_name: funnelName,
        step_number: stepNumber,
        step_name: stepName,
        ...additionalParams,
        timestamp: Date.now(),
      },
    });
  }

  // A/B Test tracking
  static trackExperiment(experimentId: string, variantId: string): void {
    this.trackEvent({
      name: 'experiment_impression',
      parameters: {
        experiment_id: experimentId,
        variant_id: variantId,
        timestamp: Date.now(),
      },
    });
  }

  // Custom metrics
  static setCustomMetric(name: string, value: number, tags?: { [key: string]: string }): void {
    this.trackEvent({
      name: 'custom_metric',
      parameters: {
        metric_name: name,
        metric_value: value,
        ...tags,
        timestamp: Date.now(),
      },
    });
  }

  // Session management
  static startSession(): void {
    this.generateSessionId();
    this.trackEvent({
      name: 'session_start',
      parameters: {
        session_id: this.sessionId,
        timestamp: Date.now(),
      },
    });
  }

  static endSession(): void {
    this.trackEvent({
      name: 'session_end',
      parameters: {
        session_id: this.sessionId,
        session_duration: this.getSessionDuration(),
        timestamp: Date.now(),
      },
    });
  }

  // Helper methods
  private static calculateReviewQuality(reviewData: ReviewEvent['parameters']): number {
    let score = 0;
    
    // Length score (0-30 points)
    if (reviewData.review_length > 50) score += 30;
    else if (reviewData.review_length > 20) score += 20;
    else if (reviewData.review_length > 10) score += 10;
    
    // Photos score (0-20 points)
    if (reviewData.has_photos) score += 20;
    
    // Verified booking score (0-30 points)
    if (reviewData.verified_booking) score += 30;
    
    // Rating score (0-20 points)
    if (reviewData.rating >= 4) score += 20;
    else if (reviewData.rating >= 3) score += 15;
    else if (reviewData.rating >= 2) score += 10;
    
    return score;
  }

  private static getSessionDuration(): number {
    if (!this.sessionId) return 0;
    
    const sessionStart = parseInt(this.sessionId.split('_')[1]);
    return Date.now() - sessionStart;
  }

  // Event queue processing
  private static processEventQueue(): void {
    if (this.eventQueue.length === 0) return;
    
    this.log(`Processing ${this.eventQueue.length} queued events`);
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    events.forEach(event => {
      if (this.analytics) {
        logEvent(this.analytics, event.name, event.parameters);
      }
    });
  }

  // Error handling
  private static handleError(code: string, message: string, details?: any): void {
    const error: AnalyticsError = {
      code,
      message,
      details,
      timestamp: new Date(),
    };
    
    console.error('Analytics Error:', error);
    
    // Track error event
    if (this.isInitialized) {
      this.trackEvent({
        name: 'analytics_error',
        parameters: {
          error_code: code,
          error_message: message,
          error_details: JSON.stringify(details),
        },
      });
    }
  }

  // Debug logging
  private static log(message: string, data?: any): void {
    if (this.debugMode) {
      console.log(`[Analytics] ${message}`, data);
    }
  }

  // Configuration
  static getConfig(): AnalyticsConfig {
    return this.config;
  }

  static updateConfig(updates: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...updates };
    this.log('Configuration updated:', updates);
  }

  // Privacy and consent
  static setConsentMode(analytics: boolean, ads: boolean): void {
    if (this.analytics && 'gtag' in window) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: analytics ? 'granted' : 'denied',
        ad_storage: ads ? 'granted' : 'denied',
      });
    }
    
    this.log('Consent mode set:', { analytics, ads });
  }

  // Data retention
  static requestDataDeletion(userId: string): void {
    this.trackEvent({
      name: 'data_deletion_request',
      parameters: {
        user_id: userId,
        request_timestamp: Date.now(),
      },
    });
    
    this.log('Data deletion requested for user:', userId);
  }

  // Validation
  static validateEvent(event: AnalyticsEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!event.name || typeof event.name !== 'string') {
      errors.push('Event name is required and must be a string');
    }
    
    if (event.name.length > 40) {
      errors.push('Event name must be 40 characters or less');
    }
    
    if (event.parameters) {
      Object.entries(event.parameters).forEach(([key, value]) => {
        if (key.length > 40) {
          errors.push(`Parameter name "${key}" must be 40 characters or less`);
        }
        
        if (typeof value === 'string' && value.length > 500) {
          errors.push(`Parameter value for "${key}" must be 500 characters or less`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Utilities
  static generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static formatCurrency(amount: number, currency: string = 'TRY'): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  static getDeviceInfo(): { category: string; type: string; vendor?: string } {
    const userAgent = navigator.userAgent;
    
    let category = 'desktop';
    let type = 'unknown';
    
    if (/tablet/i.test(userAgent)) {
      category = 'tablet';
    } else if (/mobile/i.test(userAgent)) {
      category = 'mobile';
    }
    
    if (/iPad/i.test(userAgent)) {
      type = 'iPad';
    } else if (/iPhone/i.test(userAgent)) {
      type = 'iPhone';
    } else if (/Android/i.test(userAgent)) {
      type = 'Android';
    }
    
    return { category, type };
  }

  static getBrowserInfo(): { name: string; version: string } {
    const userAgent = navigator.userAgent;
    
    let name = 'Unknown';
    let version = 'Unknown';
    
    if (userAgent.includes('Chrome')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    }
    
    return { name, version };
  }
}

export default AnalyticsService;
