// Analytics types for TourTrip.app
export interface AnalyticsEvent {
  name: string;
  parameters?: { [key: string]: any };
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

export interface UserProperties {
  user_id?: string;
  age_group?: string;
  gender?: string;
  preferred_language?: string;
  country?: string;
  city?: string;
  user_type?: 'guest' | 'registered' | 'premium' | 'provider';
  registration_date?: string;
  last_login_date?: string;
  total_bookings?: number;
  total_spent?: number;
  favorite_destinations?: string[];
  device_type?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  platform?: 'web' | 'ios' | 'android';
}

export interface ConversionEvent {
  event_name: string;
  value?: number;
  currency?: string;
  transaction_id?: string;
  items?: AnalyticsItem[];
  coupon?: string;
  payment_type?: string;
}

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category: string;
  item_variant?: string;
  price: number;
  quantity: number;
  currency: string;
  item_brand?: string;
  item_list_name?: string;
  item_list_id?: string;
  index?: number;
}

// TourTrip specific event types
export interface TourViewEvent extends AnalyticsEvent {
  name: 'view_item';
  parameters: {
    item_id: string;
    item_name: string;
    item_category: 'tour';
    price: number;
    currency: string;
    destination: string;
    duration: number;
    provider_id: string;
    provider_name: string;
  };
}

export interface TourBookingEvent extends AnalyticsEvent {
  name: 'purchase';
  parameters: {
    transaction_id: string;
    value: number;
    currency: string;
    items: AnalyticsItem[];
    payment_type: string;
    participants: number;
    tour_date: string;
    booking_source: 'web' | 'mobile' | 'api';
  };
}

export interface SearchEvent extends AnalyticsEvent {
  name: 'search';
  parameters: {
    search_term: string;
    destination?: string;
    date_from?: string;
    date_to?: string;
    price_range?: string;
    tour_type?: string;
    participants?: number;
    results_count: number;
    search_source: 'header' | 'filters' | 'suggestions';
  };
}

export interface MarketplaceOrderEvent extends AnalyticsEvent {
  name: 'purchase';
  parameters: {
    transaction_id: string;
    value: number;
    currency: string;
    items: AnalyticsItem[];
    order_type: 'restaurant' | 'shop';
    delivery_type?: 'pickup' | 'delivery';
    restaurant_id?: string;
    shop_id?: string;
  };
}

export interface LoyaltyEvent extends AnalyticsEvent {
  name: 'earn_virtual_currency' | 'spend_virtual_currency';
  parameters: {
    virtual_currency_name: 'loyalty_points';
    value: number;
    source?: string;
    reward_id?: string;
    action_type: 'earned' | 'spent' | 'redeemed';
  };
}

export interface UserEngagementEvent extends AnalyticsEvent {
  name: 'user_engagement';
  parameters: {
    engagement_time_msec: number;
    page_title: string;
    page_location: string;
    page_referrer?: string;
    session_duration?: number;
    scroll_depth?: number;
  };
}

export interface ShareEvent extends AnalyticsEvent {
  name: 'share';
  parameters: {
    content_type: 'tour' | 'restaurant' | 'shop' | 'article';
    item_id: string;
    method: 'facebook' | 'twitter' | 'whatsapp' | 'copy_link' | 'email';
    content_id: string;
  };
}

export interface ReviewEvent extends AnalyticsEvent {
  name: 'post_score' | 'rate_item';
  parameters: {
    item_id: string;
    item_category: 'tour' | 'restaurant' | 'shop';
    rating: number;
    review_length: number;
    has_photos: boolean;
    verified_booking: boolean;
  };
}

export interface CustomMetric {
  name: string;
  value: number;
  unit?: string;
  tags?: { [key: string]: string };
  timestamp?: Date;
}

export interface AnalyticsAudience {
  id: string;
  name: string;
  description: string;
  conditions: AudienceCondition[];
  size?: number;
  growth_rate?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AudienceCondition {
  type: 'event' | 'user_property' | 'custom_dimension';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with';
  value: string | number;
  timeframe?: number; // days
}

export interface ConversionGoal {
  id: string;
  name: string;
  description: string;
  event_name: string;
  target_value?: number;
  target_currency?: string;
  funnel_steps?: FunnelStep[];
  conversion_window: number; // days
  is_active: boolean;
  created_at: Date;
}

export interface FunnelStep {
  step_number: number;
  event_name: string;
  required_parameters?: { [key: string]: any };
  description?: string;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'real_time' | 'standard' | 'custom';
  metrics: AnalyticsMetric[];
  dimensions: AnalyticsDimension[];
  filters?: AnalyticsFilter[];
  date_range: DateRange;
  data: AnalyticsReportData[];
  generated_at: Date;
}

export interface AnalyticsMetric {
  name: string;
  type: 'count' | 'sum' | 'average' | 'rate' | 'ratio';
  display_name: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
}

export interface AnalyticsDimension {
  name: string;
  display_name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface AnalyticsFilter {
  dimension: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface DateRange {
  start_date: Date;
  end_date: Date;
  comparison_start_date?: Date;
  comparison_end_date?: Date;
}

export interface AnalyticsReportData {
  [key: string]: any;
  metrics: { [key: string]: number };
  dimensions: { [key: string]: string | number };
}

export interface RealTimeMetrics {
  active_users: number;
  sessions: number;
  page_views: number;
  events: number;
  revenue: number;
  conversions: number;
  bounce_rate: number;
  avg_session_duration: number;
  top_pages: PageMetric[];
  top_events: EventMetric[];
  user_locations: LocationMetric[];
  traffic_sources: SourceMetric[];
  device_breakdown: DeviceMetric[];
}

export interface PageMetric {
  page_title: string;
  page_path: string;
  views: number;
  unique_views: number;
  avg_time_on_page: number;
  bounce_rate: number;
  exit_rate: number;
}

export interface EventMetric {
  event_name: string;
  event_count: number;
  unique_users: number;
  event_value: number;
  conversion_rate?: number;
}

export interface LocationMetric {
  country: string;
  city?: string;
  users: number;
  sessions: number;
  bounce_rate: number;
  revenue: number;
}

export interface SourceMetric {
  source: string;
  medium: string;
  campaign?: string;
  users: number;
  sessions: number;
  conversion_rate: number;
  revenue: number;
}

export interface DeviceMetric {
  category: 'mobile' | 'desktop' | 'tablet';
  users: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversion_rate: number;
}

export interface AnalyticsConfig {
  measurement_id: string;
  api_secret?: string;
  debug_mode: boolean;
  automatic_events: boolean;
  enhanced_measurements: boolean;
  custom_dimensions: CustomDimension[];
  conversion_events: string[];
  audience_triggers: AudienceTrigger[];
}

export interface CustomDimension {
  parameter_name: string;
  display_name: string;
  description?: string;
  scope: 'event' | 'user';
  is_active: boolean;
}

export interface AudienceTrigger {
  name: string;
  event_name: string;
  conditions: { [key: string]: any };
  action: 'add_to_audience' | 'remove_from_audience';
}

export interface AnalyticsPerformance {
  load_time: number;
  event_queue_size: number;
  batch_size: number;
  error_rate: number;
  last_sync: Date;
  data_freshness: number; // minutes
}

export interface EcommerceMetrics {
  revenue: number;
  transactions: number;
  avg_order_value: number;
  conversion_rate: number;
  cart_abandonment_rate: number;
  refund_rate: number;
  product_performance: ProductPerformance[];
  sales_funnel: FunnelMetrics;
}

export interface ProductPerformance {
  item_id: string;
  item_name: string;
  item_category: string;
  revenue: number;
  quantity: number;
  views: number;
  conversion_rate: number;
  avg_rating: number;
}

export interface FunnelMetrics {
  steps: FunnelStepMetric[];
  overall_conversion_rate: number;
  drop_off_points: DropOffPoint[];
}

export interface FunnelStepMetric {
  step_name: string;
  users: number;
  conversion_rate: number;
  drop_off_rate: number;
  avg_time_to_next_step: number;
}

export interface DropOffPoint {
  step_from: string;
  step_to: string;
  drop_off_rate: number;
  users_lost: number;
  common_exit_pages: string[];
}

// Hook interfaces
export interface UseAnalyticsResult {
  // Tracking functions
  trackEvent: (event: AnalyticsEvent) => void;
  trackPageView: (page: string, title?: string) => void;
  trackPurchase: (transaction: ConversionEvent) => void;
  trackSearch: (searchParams: SearchEvent['parameters']) => void;
  trackUserEngagement: (engagement: UserEngagementEvent['parameters']) => void;
  
  // User management
  setUserId: (userId: string) => void;
  setUserProperties: (properties: UserProperties) => void;
  clearUser: () => void;
  
  // Custom events
  trackTourView: (tourData: TourViewEvent['parameters']) => void;
  trackTourBooking: (bookingData: TourBookingEvent['parameters']) => void;
  trackMarketplaceOrder: (orderData: MarketplaceOrderEvent['parameters']) => void;
  trackLoyaltyAction: (loyaltyData: LoyaltyEvent['parameters']) => void;
  trackShare: (shareData: ShareEvent['parameters']) => void;
  trackReview: (reviewData: ReviewEvent['parameters']) => void;
  
  // Configuration
  isEnabled: boolean;
  debugMode: boolean;
  enableAnalytics: () => void;
  disableAnalytics: () => void;
}

export interface UseAnalyticsReportsResult {
  // Report data
  realTimeMetrics: RealTimeMetrics | null;
  customReports: AnalyticsReport[];
  ecommerceMetrics: EcommerceMetrics | null;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Functions
  generateReport: (config: Partial<AnalyticsReport>) => Promise<AnalyticsReport>;
  refreshMetrics: () => Promise<void>;
  exportReport: (reportId: string, format: 'csv' | 'json' | 'pdf') => Promise<Blob>;
  
  // Real-time updates
  subscribeToRealTime: () => void;
  unsubscribeFromRealTime: () => void;
}

export interface UseConversionTrackingResult {
  // Conversion tracking
  trackConversion: (goalId: string, value?: number) => void;
  trackFunnelStep: (funnelId: string, stepNumber: number) => void;
  
  // Goals management
  conversionGoals: ConversionGoal[];
  createGoal: (goal: Omit<ConversionGoal, 'id' | 'created_at'>) => Promise<string>;
  updateGoal: (goalId: string, updates: Partial<ConversionGoal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  
  // Performance
  goalPerformance: { [goalId: string]: { rate: number; value: number } };
  funnelAnalysis: FunnelMetrics[];
}

export interface UseAudienceResult {
  // Audience management
  audiences: AnalyticsAudience[];
  createAudience: (audience: Omit<AnalyticsAudience, 'id' | 'size' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateAudience: (audienceId: string, updates: Partial<AnalyticsAudience>) => Promise<void>;
  deleteAudience: (audienceId: string) => Promise<void>;
  
  // User audience membership
  getUserAudiences: (userId: string) => Promise<string[]>;
  addUserToAudience: (userId: string, audienceId: string) => Promise<void>;
  removeUserFromAudience: (userId: string, audienceId: string) => Promise<void>;
}

// Error types
export interface AnalyticsError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  event?: AnalyticsEvent;
}

// Configuration validation
export interface AnalyticsValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
