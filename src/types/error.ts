// Error Management Types for TourTrip.app
export interface AppError {
  id: string;
  code: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  context?: ErrorContext;
  stack?: string;
  userId?: string;
  sessionId?: string;
  retryable: boolean;
  resolved: boolean;
  metadata?: { [key: string]: any };
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  PAYMENT = 'payment',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  SYSTEM = 'system',
  USER_INPUT = 'user_input',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

export interface ErrorContext {
  component?: string;
  function?: string;
  route?: string;
  api_endpoint?: string;
  user_action?: string;
  form_field?: string;
  request_id?: string;
  correlation_id?: string;
  environment?: string;
  device_info?: DeviceInfo;
  browser_info?: BrowserInfo;
  network_info?: NetworkInfo;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screen_resolution: string;
  language: string;
  timezone: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  vendor: string;
  user_agent: string;
}

export interface NetworkInfo {
  type: string;
  effective_type: string;
  downlink?: number;
  rtt?: number;
  online: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
  errorInfo?: ErrorInfo;
  retryCount: number;
  lastRetry?: Date;
}

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  eventType?: string;
}

export interface ErrorLog {
  id: string;
  error: AppError;
  reported_at: Date;
  resolved_at?: Date;
  resolution_notes?: string;
  reporter_id?: string;
  assignee_id?: string;
  status: ErrorStatus;
  priority: ErrorPriority;
}

export enum ErrorStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  DUPLICATE = 'duplicate',
  WONT_FIX = 'wont_fix'
}

export enum ErrorPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export interface ErrorRecoveryAction {
  type: ErrorRecoveryType;
  label: string;
  action: () => void | Promise<void>;
  icon?: string;
  disabled?: boolean;
}

export enum ErrorRecoveryType {
  RETRY = 'retry',
  REFRESH = 'refresh',
  RELOAD = 'reload',
  NAVIGATE = 'navigate',
  LOGIN = 'login',
  CONTACT_SUPPORT = 'contact_support',
  CUSTOM = 'custom'
}

export interface ErrorFallback {
  component: React.ComponentType<ErrorFallbackProps>;
  condition?: (error: AppError) => boolean;
  priority: number;
}

export interface ErrorFallbackProps {
  error: AppError;
  resetError: () => void;
  retryAction?: () => void;
  recoveryActions?: ErrorRecoveryAction[];
}

export interface ErrorReporting {
  enabled: boolean;
  crashlytics: boolean;
  analytics: boolean;
  remote_logging: boolean;
  user_feedback: boolean;
  automatic_retry: boolean;
  max_retry_attempts: number;
  retry_delay_ms: number;
}

export interface ErrorMetrics {
  total_errors: number;
  error_rate: number;
  most_common_errors: ErrorSummary[];
  errors_by_category: { [category: string]: number };
  errors_by_severity: { [severity: string]: number };
  resolution_time_avg: number;
  user_affected_count: number;
  retry_success_rate: number;
}

export interface ErrorSummary {
  code: string;
  message: string;
  count: number;
  first_seen: Date;
  last_seen: Date;
  affected_users: number;
  resolution_rate: number;
}

export interface ErrorNotification {
  id: string;
  error_id: string;
  recipients: string[];
  channels: NotificationChannel[];
  sent_at: Date;
  delivery_status: { [channel: string]: DeliveryStatus };
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced'
}

export interface UserFeedback {
  id: string;
  error_id: string;
  user_id: string;
  feedback_type: FeedbackType;
  message: string;
  contact_email?: string;
  helpful_rating?: number;
  submitted_at: Date;
  responded_at?: Date;
  response?: string;
}

export enum FeedbackType {
  BUG_REPORT = 'bug_report',
  FEATURE_REQUEST = 'feature_request',
  GENERAL_FEEDBACK = 'general_feedback',
  ERROR_CLARIFICATION = 'error_clarification'
}

// Firebase-specific error types
export interface FirebaseError {
  code: string;
  message: string;
  details?: any;
  operation?: string;
  service?: 'auth' | 'firestore' | 'storage' | 'functions' | 'analytics';
}

export interface FirestoreError extends FirebaseError {
  service: 'firestore';
  query?: string;
  document_path?: string;
  operation: 'read' | 'write' | 'delete' | 'query' | 'transaction';
}

export interface AuthError extends FirebaseError {
  service: 'auth';
  operation: 'login' | 'logout' | 'register' | 'reset_password' | 'verify_email' | 'update_profile';
  provider?: string;
}

export interface StorageError extends FirebaseError {
  service: 'storage';
  operation: 'upload' | 'download' | 'delete' | 'get_metadata';
  file_path?: string;
  file_size?: number;
}

export interface FunctionsError extends FirebaseError {
  service: 'functions';
  function_name: string;
  operation: 'call';
  timeout?: boolean;
}

// Network error types
export interface NetworkError extends AppError {
  category: ErrorCategory.NETWORK;
  status_code?: number;
  endpoint?: string;
  method?: string;
  request_payload?: any;
  response_body?: any;
  timeout?: boolean;
  offline?: boolean;
}

// Validation error types
export interface ValidationError extends AppError {
  category: ErrorCategory.VALIDATION;
  field?: string;
  value?: any;
  constraint?: string;
  schema?: string;
}

// Business logic error types
export interface BusinessLogicError extends AppError {
  category: ErrorCategory.BUSINESS_LOGIC;
  operation?: string;
  business_rule?: string;
  context_data?: any;
}

// Payment error types
export interface PaymentError extends AppError {
  category: ErrorCategory.PAYMENT;
  payment_provider?: string;
  transaction_id?: string;
  amount?: number;
  currency?: string;
  payment_method?: string;
  decline_reason?: string;
}

// Hook interfaces
export interface UseErrorHandlingResult {
  // Error state
  errors: AppError[];
  hasErrors: boolean;
  criticalErrors: AppError[];
  
  // Error actions
  reportError: (error: Error | AppError, context?: Partial<ErrorContext>) => void;
  clearError: (errorId: string) => void;
  clearAllErrors: () => void;
  retryError: (errorId: string) => Promise<void>;
  
  // Error boundaries
  resetErrorBoundary: () => void;
  
  // Configuration
  setErrorReporting: (config: Partial<ErrorReporting>) => void;
  getErrorMetrics: () => ErrorMetrics;
}

export interface UseErrorBoundaryResult {
  error: AppError | null;
  hasError: boolean;
  resetError: () => void;
  captureError: (error: Error, errorInfo?: ErrorInfo) => void;
}

export interface UseNetworkErrorResult {
  isOnline: boolean;
  networkError: NetworkError | null;
  retryFailedRequests: () => Promise<void>;
  getFailedRequests: () => NetworkError[];
}

// Error handler configuration
export interface ErrorHandlerConfig {
  reporting: ErrorReporting;
  fallbacks: ErrorFallback[];
  recovery_actions: { [category: string]: ErrorRecoveryAction[] };
  notification_rules: ErrorNotificationRule[];
  severity_thresholds: { [category: string]: ErrorSeverity };
  auto_resolve_conditions: AutoResolveCondition[];
}

export interface ErrorNotificationRule {
  condition: (error: AppError) => boolean;
  channels: NotificationChannel[];
  recipients: string[];
  debounce_minutes: number;
  max_notifications_per_hour: number;
}

export interface AutoResolveCondition {
  condition: (error: AppError) => boolean;
  action: () => Promise<boolean>;
  max_attempts: number;
  backoff_strategy: 'linear' | 'exponential' | 'fixed';
}

// Error template for user-friendly messages
export interface ErrorTemplate {
  code: string;
  title: string;
  description: string;
  suggestion: string;
  recovery_actions: ErrorRecoveryType[];
  documentation_url?: string;
  contact_support: boolean;
}

// Error analytics
export interface ErrorAnalytics {
  track_error: (error: AppError) => void;
  track_recovery: (errorId: string, recoveryType: ErrorRecoveryType, success: boolean) => void;
  track_user_feedback: (feedback: UserFeedback) => void;
  get_error_trends: (timeRange: string) => Promise<ErrorTrend[]>;
}

export interface ErrorTrend {
  date: Date;
  total_errors: number;
  unique_errors: number;
  critical_errors: number;
  resolution_rate: number;
  most_common_category: ErrorCategory;
}

// Error context providers
export interface ErrorContextValue {
  reportError: (error: Error | AppError, context?: Partial<ErrorContext>) => void;
  clearError: (errorId: string) => void;
  errors: AppError[];
  config: ErrorHandlerConfig;
  updateConfig: (updates: Partial<ErrorHandlerConfig>) => void;
}

// Component props
export interface ErrorDisplayProps {
  error: AppError;
  showDetails?: boolean;
  showStack?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  onFeedback?: (feedback: string) => void;
}

export interface ErrorListProps {
  errors: AppError[];
  onErrorSelect?: (error: AppError) => void;
  onErrorClear?: (errorId: string) => void;
  onRetry?: (errorId: string) => void;
  groupBy?: 'category' | 'severity' | 'timestamp';
  filter?: (error: AppError) => boolean;
}

export interface ErrorStatsProps {
  metrics: ErrorMetrics;
  timeRange: string;
  onTimeRangeChange?: (range: string) => void;
  onCategoryFilter?: (category: ErrorCategory) => void;
}
