// Error Management Service for TourTrip.app
import { 
  AppError, 
  ErrorSeverity, 
  ErrorCategory, 
  ErrorContext,
  ErrorLog,
  ErrorStatus,
  ErrorPriority,
  FirebaseError,
  NetworkError,
  ValidationError,
  BusinessLogicError,
  PaymentError,
  ErrorReporting,
  ErrorMetrics,
  ErrorTemplate,
  UserFeedback,
  FeedbackType
} from '@/types/error';
import { doc, setDoc, updateDoc, collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import AnalyticsService from './analytics-service';

export class ErrorService {
  private static config: ErrorReporting = {
    enabled: true,
    crashlytics: true,
    analytics: true,
    remote_logging: true,
    user_feedback: true,
    automatic_retry: true,
    max_retry_attempts: 3,
    retry_delay_ms: 1000,
  };

  private static errorTemplates: { [code: string]: ErrorTemplate } = {
    'NETWORK_ERROR': {
      code: 'NETWORK_ERROR',
      title: 'Bağlantı Sorunu',
      description: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
      suggestion: 'Wifi veya mobil veri bağlantınızın aktif olduğundan emin olun.',
      recovery_actions: ['retry', 'refresh'],
      contact_support: false,
    },
    'AUTH_ERROR': {
      code: 'AUTH_ERROR',
      title: 'Kimlik Doğrulama Hatası',
      description: 'Giriş yapmanız gerekiyor veya oturumunuz sona ermiş.',
      suggestion: 'Lütfen tekrar giriş yapın.',
      recovery_actions: ['login'],
      contact_support: false,
    },
    'VALIDATION_ERROR': {
      code: 'VALIDATION_ERROR',
      title: 'Geçersiz Bilgi',
      description: 'Girdiğiniz bilgileri kontrol edin.',
      suggestion: 'Tüm alanları doğru şekilde doldurun.',
      recovery_actions: ['retry'],
      contact_support: false,
    },
    'PAYMENT_ERROR': {
      code: 'PAYMENT_ERROR',
      title: 'Ödeme Hatası',
      description: 'Ödeme işlemi gerçekleştirilemedi.',
      suggestion: 'Kart bilgilerinizi kontrol edin veya başka bir ödeme yöntemi deneyin.',
      recovery_actions: ['retry', 'contact_support'],
      contact_support: true,
    },
    'SYSTEM_ERROR': {
      code: 'SYSTEM_ERROR',
      title: 'Sistem Hatası',
      description: 'Beklenmeyen bir hata oluştu.',
      suggestion: 'Lütfen daha sonra tekrar deneyin.',
      recovery_actions: ['retry', 'refresh', 'contact_support'],
      contact_support: true,
    },
    'BOOKING_ERROR': {
      code: 'BOOKING_ERROR',
      title: 'Rezervasyon Hatası',
      description: 'Rezervasyon işlemi tamamlanamadı.',
      suggestion: 'Seçtiğiniz tarih ve kişi sayısını kontrol edin.',
      recovery_actions: ['retry', 'contact_support'],
      contact_support: true,
    },
  };

  // Initialize error service
  static initialize(config?: Partial<ErrorReporting>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    console.log('Error Service initialized');
  }

  // Create AppError from various error types
  static createError(
    error: Error | string,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Partial<ErrorContext>
  ): AppError {
    const timestamp = new Date();
    const errorId = `error_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`;

    let message: string;
    let stack: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else {
      message = error;
    }

    const userMessage = this.getUserFriendlyMessage(category, message);

    return {
      id: errorId,
      code: this.generateErrorCode(category, message),
      message,
      userMessage,
      severity,
      category,
      timestamp,
      context: {
        ...this.getDefaultContext(),
        ...context,
      },
      stack,
      retryable: this.isRetryable(category),
      resolved: false,
    };
  }

  // Report error
  static async reportError(
    error: AppError,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    if (!this.config.enabled) return;

    // Add user and session info
    error.userId = userId;
    error.sessionId = sessionId;

    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error reported:', error);
      }

      // Store in Firestore
      if (this.config.remote_logging) {
        await this.storeError(error);
      }

      // Track in analytics
      if (this.config.analytics) {
        AnalyticsService.trackError(new Error(error.message), error.context?.component);
      }

      // Track in Crashlytics (would be implemented with Firebase Crashlytics)
      if (this.config.crashlytics) {
        this.trackInCrashlytics(error);
      }

      // Send notifications for critical errors
      if (error.severity === ErrorSeverity.CRITICAL) {
        await this.sendErrorNotification(error);
      }

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  // Store error in Firestore
  private static async storeError(error: AppError): Promise<void> {
    try {
      const errorLog: Omit<ErrorLog, 'id'> = {
        error,
        reported_at: new Date(),
        status: ErrorStatus.OPEN,
        priority: this.mapSeverityToPriority(error.severity),
      };

      await addDoc(collection(db, 'errorLogs'), {
        ...errorLog,
        reported_at: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to store error in Firestore:', err);
    }
  }

  // Track in Crashlytics
  private static trackInCrashlytics(error: AppError): void {
    // This would integrate with Firebase Crashlytics
    // For now, we'll just log it
    console.log('Crashlytics tracking:', {
      errorId: error.id,
      code: error.code,
      message: error.message,
      severity: error.severity,
      category: error.category,
    });
  }

  // Handle global JavaScript errors
  private static handleGlobalError(event: ErrorEvent): void {
    const error = this.createError(
      event.error || event.message,
      ErrorCategory.SYSTEM,
      ErrorSeverity.HIGH,
      {
        component: 'global',
        function: 'window.onerror',
        route: window.location.pathname,
      }
    );

    this.reportError(error);
  }

  // Handle unhandled promise rejections
  private static handlePromiseRejection(event: PromiseRejectionEvent): void {
    const error = this.createError(
      event.reason,
      ErrorCategory.SYSTEM,
      ErrorSeverity.HIGH,
      {
        component: 'global',
        function: 'unhandledrejection',
        route: window.location.pathname,
      }
    );

    this.reportError(error);
  }

  // Create Firebase-specific errors
  static createFirebaseError(
    firebaseError: any,
    operation: string,
    service: 'auth' | 'firestore' | 'storage' | 'functions'
  ): AppError {
    const category = this.mapFirebaseServiceToCategory(service);
    const severity = this.mapFirebaseCodeToSeverity(firebaseError.code);

    return this.createError(
      firebaseError.message || 'Firebase operation failed',
      category,
      severity,
      {
        component: `firebase_${service}`,
        function: operation,
        api_endpoint: service,
      }
    );
  }

  // Create network error
  static createNetworkError(
    statusCode: number,
    endpoint: string,
    method: string = 'GET',
    timeout: boolean = false
  ): NetworkError {
    const baseError = this.createError(
      `Network request failed: ${statusCode}`,
      ErrorCategory.NETWORK,
      statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      {
        api_endpoint: endpoint,
        function: 'network_request',
      }
    );

    return {
      ...baseError,
      category: ErrorCategory.NETWORK,
      status_code: statusCode,
      endpoint,
      method,
      timeout,
      offline: !navigator.onLine,
    };
  }

  // Create validation error
  static createValidationError(
    field: string,
    value: any,
    constraint: string,
    schema?: string
  ): ValidationError {
    const baseError = this.createError(
      `Validation failed for field: ${field}`,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      {
        form_field: field,
        function: 'validation',
      }
    );

    return {
      ...baseError,
      category: ErrorCategory.VALIDATION,
      field,
      value,
      constraint,
      schema,
    };
  }

  // Create business logic error
  static createBusinessLogicError(
    operation: string,
    businessRule: string,
    contextData?: any
  ): BusinessLogicError {
    const baseError = this.createError(
      `Business rule violation: ${businessRule}`,
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.MEDIUM,
      {
        function: operation,
      }
    );

    return {
      ...baseError,
      category: ErrorCategory.BUSINESS_LOGIC,
      operation,
      business_rule: businessRule,
      context_data: contextData,
    };
  }

  // Create payment error
  static createPaymentError(
    paymentProvider: string,
    transactionId: string,
    amount: number,
    currency: string,
    declineReason?: string
  ): PaymentError {
    const baseError = this.createError(
      `Payment failed: ${declineReason || 'Unknown error'}`,
      ErrorCategory.PAYMENT,
      ErrorSeverity.HIGH,
      {
        function: 'payment_processing',
      }
    );

    return {
      ...baseError,
      category: ErrorCategory.PAYMENT,
      payment_provider: paymentProvider,
      transaction_id: transactionId,
      amount,
      currency,
      decline_reason: declineReason,
    };
  }

  // Get user-friendly error message
  static getUserFriendlyMessage(category: ErrorCategory, originalMessage: string): string {
    const template = this.findErrorTemplate(category, originalMessage);
    return template ? template.description : 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
  }

  // Find error template
  private static findErrorTemplate(category: ErrorCategory, message: string): ErrorTemplate | null {
    // Simple template matching based on category and message keywords
    if (category === ErrorCategory.NETWORK) {
      return this.errorTemplates['NETWORK_ERROR'];
    }
    if (category === ErrorCategory.AUTHENTICATION) {
      return this.errorTemplates['AUTH_ERROR'];
    }
    if (category === ErrorCategory.VALIDATION) {
      return this.errorTemplates['VALIDATION_ERROR'];
    }
    if (category === ErrorCategory.PAYMENT) {
      return this.errorTemplates['PAYMENT_ERROR'];
    }
    if (message.toLowerCase().includes('booking') || message.toLowerCase().includes('rezervasyon')) {
      return this.errorTemplates['BOOKING_ERROR'];
    }

    return this.errorTemplates['SYSTEM_ERROR'];
  }

  // Retry error with exponential backoff
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts - 1) {
          break;
        }

        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Get error metrics
  static async getErrorMetrics(timeRange: string = '24h'): Promise<ErrorMetrics> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '1h':
          startDate.setHours(endDate.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
      }

      const errorsQuery = query(
        collection(db, 'errorLogs'),
        where('reported_at', '>=', startDate),
        where('reported_at', '<=', endDate),
        orderBy('reported_at', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(errorsQuery);
      const errorLogs = snapshot.docs.map(doc => doc.data() as ErrorLog);

      return this.calculateMetrics(errorLogs);
    } catch (error) {
      console.error('Failed to get error metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  // Calculate error metrics
  private static calculateMetrics(errorLogs: ErrorLog[]): ErrorMetrics {
    const totalErrors = errorLogs.length;
    const uniqueErrors = new Set(errorLogs.map(log => log.error.code)).size;
    const affectedUsers = new Set(errorLogs.map(log => log.error.userId).filter(Boolean)).size;

    // Group by category
    const errorsByCategory: { [category: string]: number } = {};
    const errorsBySeverity: { [severity: string]: number } = {};
    const errorCounts: { [code: string]: { count: number; firstSeen: Date; lastSeen: Date; users: Set<string> } } = {};

    errorLogs.forEach(log => {
      const category = log.error.category;
      const severity = log.error.severity;
      const code = log.error.code;

      errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1;

      if (!errorCounts[code]) {
        errorCounts[code] = {
          count: 0,
          firstSeen: log.reported_at,
          lastSeen: log.reported_at,
          users: new Set(),
        };
      }

      errorCounts[code].count++;
      errorCounts[code].lastSeen = log.reported_at;
      if (log.error.userId) {
        errorCounts[code].users.add(log.error.userId);
      }
    });

    // Most common errors
    const mostCommonErrors = Object.entries(errorCounts)
      .map(([code, data]) => ({
        code,
        message: errorLogs.find(log => log.error.code === code)?.error.message || '',
        count: data.count,
        first_seen: data.firstSeen,
        last_seen: data.lastSeen,
        affected_users: data.users.size,
        resolution_rate: 0, // Would calculate from resolved errors
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total_errors: totalErrors,
      error_rate: totalErrors / Math.max(1, affectedUsers), // Errors per user
      most_common_errors: mostCommonErrors,
      errors_by_category: errorsByCategory,
      errors_by_severity: errorsBySeverity,
      resolution_time_avg: 0, // Would calculate from resolved errors
      user_affected_count: affectedUsers,
      retry_success_rate: 0, // Would track retry attempts
    };
  }

  // Submit user feedback
  static async submitUserFeedback(
    errorId: string,
    feedbackType: FeedbackType,
    message: string,
    userId?: string,
    contactEmail?: string,
    helpfulRating?: number
  ): Promise<void> {
    try {
      const feedback: Omit<UserFeedback, 'id'> = {
        error_id: errorId,
        user_id: userId || 'anonymous',
        feedback_type: feedbackType,
        message,
        contact_email: contactEmail,
        helpful_rating: helpfulRating,
        submitted_at: new Date(),
      };

      await addDoc(collection(db, 'userFeedback'), {
        ...feedback,
        submitted_at: serverTimestamp(),
      });

    } catch (error) {
      console.error('Failed to submit user feedback:', error);
    }
  }

  // Helper methods
  private static generateErrorCode(category: ErrorCategory, message: string): string {
    const categoryCode = category.toUpperCase().replace(' ', '_');
    const messageHash = this.hashString(message).toString(36).toUpperCase().substring(0, 6);
    return `${categoryCode}_${messageHash}`;
  }

  private static hashString(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private static getDefaultContext(): ErrorContext {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      route: window.location.pathname,
      environment: process.env.NODE_ENV,
      device_info: {
        type: this.getDeviceType(),
        os: navigator.platform,
        browser: this.getBrowserName(),
        screen_resolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      browser_info: {
        name: this.getBrowserName(),
        version: this.getBrowserVersion(),
        vendor: navigator.vendor || 'unknown',
        user_agent: navigator.userAgent,
      },
      network_info: {
        type: (navigator as any).connection?.type || 'unknown',
        effective_type: (navigator as any).connection?.effectiveType || 'unknown',
        online: navigator.onLine,
      },
    };
  }

  private static getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|phone|android|iphone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private static getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private static getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(chrome|firefox|safari|edge)\/(\d+)/i);
    return match ? match[2] : 'unknown';
  }

  private static isRetryable(category: ErrorCategory): boolean {
    return [
      ErrorCategory.NETWORK,
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorCategory.DATABASE,
      ErrorCategory.SYSTEM,
    ].includes(category);
  }

  private static mapSeverityToPriority(severity: ErrorSeverity): ErrorPriority {
    switch (severity) {
      case ErrorSeverity.LOW:
        return ErrorPriority.LOW;
      case ErrorSeverity.MEDIUM:
        return ErrorPriority.MEDIUM;
      case ErrorSeverity.HIGH:
        return ErrorPriority.HIGH;
      case ErrorSeverity.CRITICAL:
        return ErrorPriority.CRITICAL;
      default:
        return ErrorPriority.MEDIUM;
    }
  }

  private static mapFirebaseServiceToCategory(service: string): ErrorCategory {
    switch (service) {
      case 'auth':
        return ErrorCategory.AUTHENTICATION;
      case 'firestore':
        return ErrorCategory.DATABASE;
      case 'storage':
        return ErrorCategory.EXTERNAL_SERVICE;
      case 'functions':
        return ErrorCategory.EXTERNAL_SERVICE;
      default:
        return ErrorCategory.SYSTEM;
    }
  }

  private static mapFirebaseCodeToSeverity(code: string): ErrorSeverity {
    if (code.includes('permission-denied') || code.includes('unauthenticated')) {
      return ErrorSeverity.HIGH;
    }
    if (code.includes('not-found') || code.includes('invalid-argument')) {
      return ErrorSeverity.MEDIUM;
    }
    if (code.includes('unavailable') || code.includes('deadline-exceeded')) {
      return ErrorSeverity.HIGH;
    }
    return ErrorSeverity.MEDIUM;
  }

  private static async sendErrorNotification(error: AppError): Promise<void> {
    // This would integrate with notification services
    console.log('Critical error notification:', {
      errorId: error.id,
      message: error.message,
      severity: error.severity,
      timestamp: error.timestamp,
    });
  }

  private static getEmptyMetrics(): ErrorMetrics {
    return {
      total_errors: 0,
      error_rate: 0,
      most_common_errors: [],
      errors_by_category: {},
      errors_by_severity: {},
      resolution_time_avg: 0,
      user_affected_count: 0,
      retry_success_rate: 0,
    };
  }

  // Configuration methods
  static getConfig(): ErrorReporting {
    return this.config;
  }

  static updateConfig(updates: Partial<ErrorReporting>): void {
    this.config = { ...this.config, ...updates };
  }

  // Add custom error template
  static addErrorTemplate(template: ErrorTemplate): void {
    this.errorTemplates[template.code] = template;
  }

  // Get all error templates
  static getErrorTemplates(): { [code: string]: ErrorTemplate } {
    return this.errorTemplates;
  }
}

export default ErrorService;
