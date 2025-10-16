// Email System Types for TourTrip.app
import { Timestamp } from 'firebase/firestore';

// Email Configuration
export interface EmailConfig {
  provider: EmailProvider;
  apiKey: string;
  domain: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  trackingEnabled: boolean;
  retryAttempts: number;
  retryDelay: number; // milliseconds
  batchSize: number;
  templates: EmailTemplateConfig[];
}

export enum EmailProvider {
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  RESEND = 'resend',
  POSTMARK = 'postmark',
  SES = 'ses', // Amazon SES
  SMTP = 'smtp'
}

export interface EmailTemplateConfig {
  id: string;
  name: string;
  provider: EmailProvider;
  templateId: string;
  category: EmailCategory;
  language: string;
  isActive: boolean;
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
}

// Email Categories
export enum EmailCategory {
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
  SUPPORT = 'support'
}

export enum EmailType {
  // Authentication & Account
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_ACTIVATION = 'account_activation',
  ACCOUNT_DELETION = 'account_deletion',
  LOGIN_ALERT = 'login_alert',
  
  // Booking & Reservations
  BOOKING_CONFIRMATION = 'booking_confirmation',
  BOOKING_REMINDER = 'booking_reminder',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_MODIFIED = 'booking_modified',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_PROCESSED = 'refund_processed',
  
  // Tour Related
  TOUR_STARTS_SOON = 'tour_starts_soon',
  TOUR_COMPLETED = 'tour_completed',
  TOUR_CANCELLED = 'tour_cancelled',
  TOUR_RESCHEDULED = 'tour_rescheduled',
  WEATHER_ALERT = 'weather_alert',
  EMERGENCY_ALERT = 'emergency_alert',
  
  // Reviews & Feedback
  REVIEW_REQUEST = 'review_request',
  REVIEW_RESPONSE = 'review_response',
  FEEDBACK_REQUEST = 'feedback_request',
  
  // Marketing & Promotions
  NEWSLETTER = 'newsletter',
  PROMOTIONAL_OFFER = 'promotional_offer',
  SEASONAL_CAMPAIGN = 'seasonal_campaign',
  PERSONALIZED_RECOMMENDATIONS = 'personalized_recommendations',
  ABANDONED_CART = 'abandoned_cart',
  LOYALTY_REWARD = 'loyalty_reward',
  
  // Support & Communication
  SUPPORT_TICKET_CREATED = 'support_ticket_created',
  SUPPORT_TICKET_UPDATED = 'support_ticket_updated',
  SUPPORT_TICKET_RESOLVED = 'support_ticket_resolved',
  CONTACT_FORM_RESPONSE = 'contact_form_response',
  
  // Social & Community
  SOCIAL_NOTIFICATION = 'social_notification',
  FRIEND_INVITATION = 'friend_invitation',
  COMMUNITY_UPDATE = 'community_update',
  
  // System & Admin
  SYSTEM_MAINTENANCE = 'system_maintenance',
  DATA_EXPORT_READY = 'data_export_ready',
  SECURITY_ALERT = 'security_alert',
  GDPR_REQUEST = 'gdpr_request'
}

// Email Template Interface
export interface EmailTemplate {
  id: string;
  type: EmailType;
  category: EmailCategory;
  name: string;
  description: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: TemplateVariable[];
  metadata: TemplateMetadata;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

export interface TemplateMetadata {
  language: string;
  timezone: string;
  previewText?: string;
  tags: string[];
  estimatedReadTime: number; // minutes
  designVersion: string;
  lastTestedAt?: Timestamp;
  conversionRate?: number;
  openRate?: number;
  clickRate?: number;
}

// Email Data & Personalization
export interface EmailData {
  // User Information
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    language: string;
    timezone: string;
    avatar?: string;
    loyaltyTier?: string;
  };
  
  // Booking Information
  booking?: {
    id: string;
    tourId: string;
    tourTitle: string;
    tourDate: string;
    tourTime: string;
    participants: number;
    totalAmount: number;
    currency: string;
    status: string;
    confirmationCode: string;
    meetingPoint?: string;
    guideInfo?: GuideInfo;
    cancelationPolicy?: string;
  };
  
  // Payment Information
  payment?: {
    id: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    transactionId: string;
    receipt?: string;
  };
  
  // Tour Information
  tour?: {
    id: string;
    title: string;
    description: string;
    duration: string;
    difficulty: string;
    images: string[];
    provider: {
      name: string;
      contact: string;
      logo?: string;
    };
    meetingPoint: string;
    inclusions: string[];
    exclusions: string[];
  };
  
  // Promotional Information
  promotion?: {
    title: string;
    description: string;
    discountPercentage?: number;
    discountAmount?: number;
    promoCode?: string;
    validUntil: string;
    minOrderAmount?: number;
    applicableTours?: string[];
  };
  
  // Custom Variables
  custom?: { [key: string]: any };
}

export interface GuideInfo {
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  rating?: number;
  experience?: string;
}

// Email Request & Response
export interface EmailRequest {
  id?: string;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  template: EmailType;
  data: EmailData;
  options?: EmailOptions;
  scheduledAt?: Timestamp;
  priority: EmailPriority;
  metadata?: RequestMetadata;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  substitutions?: { [key: string]: string };
}

export interface EmailOptions {
  trackOpens: boolean;
  trackClicks: boolean;
  trackUnsubscribes: boolean;
  customHeaders?: { [key: string]: string };
  attachments?: EmailAttachment[];
  replyTo?: string;
  sendAt?: Timestamp;
  timezone?: string;
  testMode?: boolean;
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  type: string; // MIME type
  disposition: 'attachment' | 'inline';
  contentId?: string; // for inline images
}

export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface RequestMetadata {
  source: string; // 'web', 'mobile', 'api', 'cron'
  campaignId?: string;
  userId?: string;
  tags?: string[];
  correlationId?: string;
}

// Email Status & Tracking
export interface EmailStatus {
  id: string;
  requestId: string;
  to: string;
  status: DeliveryStatus;
  provider: EmailProvider;
  providerId?: string; // Provider's message ID
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  openedAt?: Timestamp;
  clickedAt?: Timestamp;
  bouncedAt?: Timestamp;
  spamReportedAt?: Timestamp;
  unsubscribedAt?: Timestamp;
  errorMessage?: string;
  retryCount: number;
  lastRetryAt?: Timestamp;
  events: EmailEvent[];
}

export enum DeliveryStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  SPAM = 'spam',
  UNSUBSCRIBED = 'unsubscribed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface EmailEvent {
  type: EmailEventType;
  timestamp: Timestamp;
  data?: any;
  ipAddress?: string;
  userAgent?: string;
  url?: string; // for click events
}

export enum EmailEventType {
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  SPAM_REPORT = 'spam_report',
  UNSUBSCRIBED = 'unsubscribed',
  FAILED = 'failed'
}

// Campaign Management
export interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  template: EmailType;
  recipients: CampaignRecipient[];
  schedule: CampaignSchedule;
  segmentation: CampaignSegmentation;
  tracking: CampaignTracking;
  status: CampaignStatus;
  createdAt: Timestamp;
  createdBy: string;
  sentAt?: Timestamp;
  completedAt?: Timestamp;
  results?: CampaignResults;
}

export enum CampaignType {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring',
  TRIGGERED = 'triggered',
  A_B_TEST = 'a_b_test',
  DRIP = 'drip'
}

export interface CampaignRecipient {
  email: string;
  name?: string;
  data?: EmailData;
  status: 'pending' | 'sent' | 'failed' | 'excluded';
  sentAt?: Timestamp;
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  sendAt?: Timestamp;
  timezone?: string;
  recurrence?: RecurrencePattern;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // every N days/weeks/months
  daysOfWeek?: number[]; // for weekly (0=Sunday, 6=Saturday)
  dayOfMonth?: number; // for monthly
  endDate?: Timestamp;
  maxOccurrences?: number;
}

export interface CampaignSegmentation {
  criteria: SegmentationCriteria[];
  logic: 'AND' | 'OR';
  excludeUnsubscribed: boolean;
  excludeBounced: boolean;
  testSegment?: boolean;
  testPercentage?: number;
}

export interface SegmentationCriteria {
  field: string; // user field
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface CampaignTracking {
  trackOpens: boolean;
  trackClicks: boolean;
  trackUnsubscribes: boolean;
  trackConversions: boolean;
  conversionEvents?: string[];
  utmParameters?: {
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
  };
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface CampaignResults {
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  spamCount: number;
  unsubscribedCount: number;
  failedCount: number;
  
  // Calculated rates
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  bounceRate: number;
  spamRate: number;
  unsubscribeRate: number;
  
  // Revenue tracking
  conversionCount?: number;
  conversionRate?: number;
  revenue?: number;
  
  // Performance over time
  hourlyStats?: { hour: number; opens: number; clicks: number }[];
  deviceStats?: { device: string; count: number }[];
  locationStats?: { country: string; count: number }[];
}

// Subscription Management
export interface EmailSubscription {
  email: string;
  userId?: string;
  subscribed: boolean;
  categories: SubscriptionCategory[];
  language: string;
  frequency: EmailFrequency;
  subscribedAt: Timestamp;
  unsubscribedAt?: Timestamp;
  source: string; // where they subscribed from
  doubleOptIn: boolean;
  ipAddress?: string;
  preferences: SubscriptionPreferences;
}

export interface SubscriptionCategory {
  type: EmailCategory;
  subscribed: boolean;
  lastUpdated: Timestamp;
}

export enum EmailFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  NEVER = 'never'
}

export interface SubscriptionPreferences {
  htmlEmail: boolean;
  timezoneName: string;
  bestTimeToSend: number; // hour of day (0-23)
  marketingEmails: boolean;
  transactionalEmails: boolean;
  socialNotifications: boolean;
  productUpdates: boolean;
  specialOffers: boolean;
}

// Email Analytics
export interface EmailAnalytics {
  period: AnalyticsPeriod;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalSpam: number;
  totalUnsubscribed: number;
  
  // Rates
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  spamRate: number;
  unsubscribeRate: number;
  
  // Performance by category
  categoryStats: CategoryStats[];
  
  // Performance by template
  templateStats: TemplateStats[];
  
  // Time series data
  dailyStats: DailyEmailStats[];
  
  // Engagement metrics
  topClickedLinks: LinkStats[];
  deviceBreakdown: DeviceStats[];
  locationBreakdown: LocationStats[];
}

export interface AnalyticsPeriod {
  start: Timestamp;
  end: Timestamp;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface CategoryStats {
  category: EmailCategory;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export interface TemplateStats {
  template: EmailType;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  conversions: number;
  revenue: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface DailyEmailStats {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

export interface LinkStats {
  url: string;
  clicks: number;
  uniqueClicks: number;
  clickRate: number;
}

export interface DeviceStats {
  device: string;
  count: number;
  percentage: number;
}

export interface LocationStats {
  country: string;
  city?: string;
  count: number;
  percentage: number;
}

// Error Handling
export interface EmailError {
  code: string;
  message: string;
  provider?: EmailProvider;
  providerError?: any;
  retryable: boolean;
  timestamp: Timestamp;
}

export enum EmailErrorCode {
  INVALID_EMAIL = 'invalid_email',
  TEMPLATE_NOT_FOUND = 'template_not_found',
  PROVIDER_ERROR = 'provider_error',
  RATE_LIMITED = 'rate_limited',
  QUOTA_EXCEEDED = 'quota_exceeded',
  AUTHENTICATION_FAILED = 'authentication_failed',
  INVALID_TEMPLATE_DATA = 'invalid_template_data',
  SPAM_DETECTED = 'spam_detected',
  BLACKLISTED = 'blacklisted',
  UNSUBSCRIBED = 'unsubscribed',
  SUPPRESSED = 'suppressed'
}

// Hook Interfaces
export interface UseEmailResult {
  // Send email
  sendEmail: (request: EmailRequest) => Promise<string>;
  sendBulkEmails: (requests: EmailRequest[]) => Promise<string[]>;
  
  // Templates
  getTemplates: () => Promise<EmailTemplate[]>;
  getTemplate: (type: EmailType, language?: string) => Promise<EmailTemplate | null>;
  previewTemplate: (type: EmailType, data: EmailData) => Promise<string>;
  
  // Campaign management
  createCampaign: (campaign: Omit<EmailCampaign, 'id' | 'createdAt'>) => Promise<string>;
  sendCampaign: (campaignId: string) => Promise<void>;
  getCampaignResults: (campaignId: string) => Promise<CampaignResults>;
  
  // Subscription management
  subscribe: (email: string, categories?: EmailCategory[]) => Promise<void>;
  unsubscribe: (email: string, categories?: EmailCategory[]) => Promise<void>;
  updatePreferences: (email: string, preferences: SubscriptionPreferences) => Promise<void>;
  
  // Analytics
  getAnalytics: (period: AnalyticsPeriod) => Promise<EmailAnalytics>;
  getEmailStatus: (emailId: string) => Promise<EmailStatus>;
  
  // State
  loading: boolean;
  error: string | null;
}

// Component Props
export interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
  onPreview: (data: EmailData) => void;
  className?: string;
}

export interface EmailCampaignBuilderProps {
  onSave: (campaign: EmailCampaign) => void;
  onSend: (campaignId: string) => void;
  className?: string;
}

export interface EmailAnalyticsDashboardProps {
  period?: AnalyticsPeriod;
  filters?: AnalyticsFilter[];
  className?: string;
}

export interface AnalyticsFilter {
  field: string;
  operator: string;
  value: any;
}

export interface SubscriptionManagementProps {
  email?: string;
  onUpdate: (subscription: EmailSubscription) => void;
  className?: string;
}
