// Email Service for TourTrip.app
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  EmailRequest,
  EmailTemplate,
  EmailType,
  EmailCategory,
  EmailData,
  EmailStatus,
  DeliveryStatus,
  EmailProvider,
  EmailConfig,
  EmailSubscription,
  EmailCampaign,
  CampaignStatus,
  EmailAnalytics,
  AnalyticsPeriod,
  EmailError,
  EmailErrorCode,
  EmailEvent,
  EmailEventType,
  EmailPriority
} from '@/types/email';
import { analyticsService } from './analytics-service';
import { errorService } from './error-service';

export class EmailService {
  private static config: EmailConfig = {
    provider: EmailProvider.SENDGRID,
    apiKey: process.env.SENDGRID_API_KEY || '',
    domain: process.env.EMAIL_DOMAIN || 'tourtrip.app',
    fromEmail: process.env.FROM_EMAIL || 'noreply@tourtrip.app',
    fromName: process.env.FROM_NAME || 'TourTrip.app',
    replyTo: process.env.REPLY_TO_EMAIL || 'support@tourtrip.app',
    trackingEnabled: true,
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
    batchSize: 100,
    templates: [],
  };

  // Template Management
  static async getTemplate(type: EmailType, language = 'tr'): Promise<EmailTemplate | null> {
    try {
      const templatesQuery = query(
        collection(db, 'emailTemplates'),
        where('type', '==', type),
        where('metadata.language', '==', language),
        where('isActive', '==', true),
        orderBy('version', 'desc'),
        limit(1)
      );
      
      const templateDocs = await getDocs(templatesQuery);
      
      if (templateDocs.empty) {
        // Fallback to English if Turkish not found
        if (language !== 'en') {
          return this.getTemplate(type, 'en');
        }
        return null;
      }
      
      return templateDocs.docs[0].data() as EmailTemplate;
    } catch (error) {
      console.error('Error getting email template:', error);
      throw errorService.createAppError(error as Error, {
        code: 'EMAIL_TEMPLATE_GET_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  static async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const templateData: EmailTemplate = {
        ...template,
        id: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const templateRef = await addDoc(collection(db, 'emailTemplates'), templateData);
      
      // Update the template with its ID
      await updateDoc(templateRef, { id: templateRef.id });
      
      analyticsService.logEvent({
        name: 'email_template_created',
        params: {
          template_type: template.type,
          template_category: template.category,
          language: template.metadata.language,
        },
      });

      return templateRef.id;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw errorService.createAppError(error as Error, {
        code: 'EMAIL_TEMPLATE_CREATE_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  static async previewTemplate(type: EmailType, data: EmailData, language = 'tr'): Promise<{ subject: string; html: string; text: string }> {
    try {
      const template = await this.getTemplate(type, language);
      if (!template) {
        throw new Error(`Template not found: ${type}`);
      }

      // Replace variables in template
      const processedSubject = this.processTemplate(template.subject, data);
      const processedHtml = this.processTemplate(template.htmlContent, data);
      const processedText = this.processTemplate(template.textContent, data);

      return {
        subject: processedSubject,
        html: processedHtml,
        text: processedText,
      };
    } catch (error) {
      console.error('Error previewing email template:', error);
      throw errorService.createAppError(error as Error, {
        code: 'EMAIL_TEMPLATE_PREVIEW_FAILED',
        category: 'business_logic',
        severity: 'low',
      });
    }
  }

  private static processTemplate(template: string, data: EmailData): string {
    let processed = template;
    
    // Replace user variables
    if (data.user) {
      processed = processed.replace(/\{\{user\.firstName\}\}/g, data.user.firstName || '');
      processed = processed.replace(/\{\{user\.lastName\}\}/g, data.user.lastName || '');
      processed = processed.replace(/\{\{user\.email\}\}/g, data.user.email || '');
      processed = processed.replace(/\{\{user\.loyaltyTier\}\}/g, data.user.loyaltyTier || 'Bronze');
    }

    // Replace booking variables
    if (data.booking) {
      processed = processed.replace(/\{\{booking\.tourTitle\}\}/g, data.booking.tourTitle || '');
      processed = processed.replace(/\{\{booking\.tourDate\}\}/g, data.booking.tourDate || '');
      processed = processed.replace(/\{\{booking\.tourTime\}\}/g, data.booking.tourTime || '');
      processed = processed.replace(/\{\{booking\.participants\}\}/g, String(data.booking.participants || 1));
      processed = processed.replace(/\{\{booking\.totalAmount\}\}/g, String(data.booking.totalAmount || 0));
      processed = processed.replace(/\{\{booking\.currency\}\}/g, data.booking.currency || 'TRY');
      processed = processed.replace(/\{\{booking\.confirmationCode\}\}/g, data.booking.confirmationCode || '');
      processed = processed.replace(/\{\{booking\.meetingPoint\}\}/g, data.booking.meetingPoint || '');
    }

    // Replace payment variables
    if (data.payment) {
      processed = processed.replace(/\{\{payment\.amount\}\}/g, String(data.payment.amount || 0));
      processed = processed.replace(/\{\{payment\.currency\}\}/g, data.payment.currency || 'TRY');
      processed = processed.replace(/\{\{payment\.method\}\}/g, data.payment.method || '');
      processed = processed.replace(/\{\{payment\.transactionId\}\}/g, data.payment.transactionId || '');
    }

    // Replace tour variables
    if (data.tour) {
      processed = processed.replace(/\{\{tour\.title\}\}/g, data.tour.title || '');
      processed = processed.replace(/\{\{tour\.description\}\}/g, data.tour.description || '');
      processed = processed.replace(/\{\{tour\.duration\}\}/g, data.tour.duration || '');
      processed = processed.replace(/\{\{tour\.difficulty\}\}/g, data.tour.difficulty || '');
      processed = processed.replace(/\{\{tour\.meetingPoint\}\}/g, data.tour.meetingPoint || '');
    }

    // Replace promotion variables
    if (data.promotion) {
      processed = processed.replace(/\{\{promotion\.title\}\}/g, data.promotion.title || '');
      processed = processed.replace(/\{\{promotion\.description\}\}/g, data.promotion.description || '');
      processed = processed.replace(/\{\{promotion\.discountPercentage\}\}/g, String(data.promotion.discountPercentage || 0));
      processed = processed.replace(/\{\{promotion\.promoCode\}\}/g, data.promotion.promoCode || '');
      processed = processed.replace(/\{\{promotion\.validUntil\}\}/g, data.promotion.validUntil || '');
    }

    // Replace custom variables
    if (data.custom) {
      Object.entries(data.custom).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{custom\\.${key}\\}\\}`, 'g');
        processed = processed.replace(regex, String(value));
      });
    }

    // Replace common variables
    processed = processed.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());
    processed = processed.replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString('tr-TR'));
    processed = processed.replace(/\{\{siteName\}\}/g, 'TourTrip.app');
    processed = processed.replace(/\{\{siteUrl\}\}/g, process.env.NEXT_PUBLIC_SITE_URL || 'https://tourtrip.app');
    processed = processed.replace(/\{\{supportEmail\}\}/g, this.config.replyTo || 'support@tourtrip.app');

    return processed;
  }

  // Email Sending
  static async sendEmail(request: EmailRequest): Promise<string> {
    try {
      // Validate request
      this.validateEmailRequest(request);

      // Check subscription status
      for (const recipient of request.to) {
        const isSubscribed = await this.checkSubscriptionStatus(recipient.email, request.template);
        if (!isSubscribed) {
          throw new Error(`Recipient ${recipient.email} is unsubscribed from ${request.template}`);
        }
      }

      // Get template
      const template = await this.getTemplate(
        request.template,
        request.data.user?.language || 'tr'
      );
      
      if (!template) {
        throw new Error(`Template not found: ${request.template}`);
      }

      // Process template with data
      const processedTemplate = await this.previewTemplate(
        request.template,
        request.data,
        request.data.user?.language || 'tr'
      );

      // Create email status record
      const emailStatus: EmailStatus = {
        id: '',
        requestId: request.id || this.generateRequestId(),
        to: request.to[0].email, // For simplicity, taking first recipient
        status: DeliveryStatus.PENDING,
        provider: this.config.provider,
        retryCount: 0,
        events: [],
      };

      const statusRef = await addDoc(collection(db, 'emailStatus'), emailStatus);
      emailStatus.id = statusRef.id;

      // Send via provider
      const providerId = await this.sendViaProvider(request, processedTemplate);
      
      // Update status
      await updateDoc(statusRef, {
        status: DeliveryStatus.SENT,
        providerId,
        sentAt: serverTimestamp(),
      });

      // Track analytics
      analyticsService.logEvent({
        name: 'email_sent',
        params: {
          email_type: request.template,
          provider: this.config.provider,
          recipient_count: request.to.length,
          priority: request.priority,
        },
      });

      return statusRef.id;
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Log email error
      const emailError: EmailError = {
        code: EmailErrorCode.PROVIDER_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
        provider: this.config.provider,
        retryable: true,
        timestamp: Timestamp.now(),
      };

      await addDoc(collection(db, 'emailErrors'), emailError);
      
      throw errorService.createAppError(error as Error, {
        code: 'EMAIL_SEND_FAILED',
        category: 'external_service',
        severity: 'high',
      });
    }
  }

  private static validateEmailRequest(request: EmailRequest): void {
    if (!request.to || request.to.length === 0) {
      throw new Error('No recipients specified');
    }

    for (const recipient of request.to) {
      if (!this.isValidEmail(recipient.email)) {
        throw new Error(`Invalid email address: ${recipient.email}`);
      }
    }

    if (!request.template || !Object.values(EmailType).includes(request.template)) {
      throw new Error(`Invalid email template: ${request.template}`);
    }

    if (!request.data || !request.data.user) {
      throw new Error('Email data and user information are required');
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async sendViaProvider(
    request: EmailRequest,
    processedTemplate: { subject: string; html: string; text: string }
  ): Promise<string> {
    switch (this.config.provider) {
      case EmailProvider.SENDGRID:
        return this.sendViaSendGrid(request, processedTemplate);
      case EmailProvider.MAILGUN:
        return this.sendViaMailgun(request, processedTemplate);
      case EmailProvider.RESEND:
        return this.sendViaResend(request, processedTemplate);
      default:
        throw new Error(`Unsupported email provider: ${this.config.provider}`);
    }
  }

  private static async sendViaSendGrid(
    request: EmailRequest,
    processedTemplate: { subject: string; html: string; text: string }
  ): Promise<string> {
    try {
      // This would use SendGrid's API
      // For now, return a mock ID
      const mockId = `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Sending via SendGrid:', {
        to: request.to,
        subject: processedTemplate.subject,
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
      });
      
      return mockId;
    } catch (error) {
      throw new Error(`SendGrid API error: ${error}`);
    }
  }

  private static async sendViaMailgun(
    request: EmailRequest,
    processedTemplate: { subject: string; html: string; text: string }
  ): Promise<string> {
    try {
      // This would use Mailgun's API
      const mockId = `mg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Sending via Mailgun:', {
        to: request.to,
        subject: processedTemplate.subject,
      });
      
      return mockId;
    } catch (error) {
      throw new Error(`Mailgun API error: ${error}`);
    }
  }

  private static async sendViaResend(
    request: EmailRequest,
    processedTemplate: { subject: string; html: string; text: string }
  ): Promise<string> {
    try {
      // This would use Resend's API
      const mockId = `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Sending via Resend:', {
        to: request.to,
        subject: processedTemplate.subject,
      });
      
      return mockId;
    } catch (error) {
      throw new Error(`Resend API error: ${error}`);
    }
  }

  // Subscription Management
  static async checkSubscriptionStatus(email: string, templateType: EmailType): Promise<boolean> {
    try {
      const subscriptionQuery = query(
        collection(db, 'emailSubscriptions'),
        where('email', '==', email.toLowerCase()),
        limit(1)
      );
      
      const subscriptionDocs = await getDocs(subscriptionQuery);
      
      if (subscriptionDocs.empty) {
        // No subscription record means subscribed by default for transactional emails
        return this.isTransactionalEmail(templateType);
      }
      
      const subscription = subscriptionDocs.docs[0].data() as EmailSubscription;
      
      if (!subscription.subscribed) {
        return false;
      }
      
      // Check category-specific subscription
      const emailCategory = this.getEmailCategory(templateType);
      const categorySubscription = subscription.categories.find(cat => cat.type === emailCategory);
      
      return categorySubscription ? categorySubscription.subscribed : true;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      // Default to subscribed for transactional emails
      return this.isTransactionalEmail(templateType);
    }
  }

  private static isTransactionalEmail(templateType: EmailType): boolean {
    const transactionalTypes = [
      EmailType.WELCOME,
      EmailType.EMAIL_VERIFICATION,
      EmailType.PASSWORD_RESET,
      EmailType.BOOKING_CONFIRMATION,
      EmailType.PAYMENT_CONFIRMATION,
      EmailType.TOUR_STARTS_SOON,
      EmailType.TOUR_CANCELLED,
      EmailType.REFUND_PROCESSED,
    ];
    
    return transactionalTypes.includes(templateType);
  }

  private static getEmailCategory(templateType: EmailType): EmailCategory {
    // Map email types to categories
    const categoryMap: { [key in EmailType]: EmailCategory } = {
      [EmailType.WELCOME]: EmailCategory.TRANSACTIONAL,
      [EmailType.EMAIL_VERIFICATION]: EmailCategory.TRANSACTIONAL,
      [EmailType.PASSWORD_RESET]: EmailCategory.TRANSACTIONAL,
      [EmailType.BOOKING_CONFIRMATION]: EmailCategory.TRANSACTIONAL,
      [EmailType.PAYMENT_CONFIRMATION]: EmailCategory.TRANSACTIONAL,
      [EmailType.NEWSLETTER]: EmailCategory.MARKETING,
      [EmailType.PROMOTIONAL_OFFER]: EmailCategory.MARKETING,
      [EmailType.REVIEW_REQUEST]: EmailCategory.NOTIFICATION,
      [EmailType.SUPPORT_TICKET_CREATED]: EmailCategory.SUPPORT,
      [EmailType.SOCIAL_NOTIFICATION]: EmailCategory.NOTIFICATION,
      [EmailType.SYSTEM_MAINTENANCE]: EmailCategory.SYSTEM,
      // Add more mappings as needed
    } as any;
    
    return categoryMap[templateType] || EmailCategory.TRANSACTIONAL;
  }

  static async subscribe(email: string, categories: EmailCategory[] = []): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const subscriptionQuery = query(
          collection(db, 'emailSubscriptions'),
          where('email', '==', email.toLowerCase()),
          limit(1)
        );
        
        const subscriptionDocs = await getDocs(subscriptionQuery);
        
        if (subscriptionDocs.empty) {
          // Create new subscription
          const subscription: EmailSubscription = {
            email: email.toLowerCase(),
            subscribed: true,
            categories: categories.map(type => ({
              type,
              subscribed: true,
              lastUpdated: Timestamp.now(),
            })),
            language: 'tr',
            frequency: 'weekly' as any,
            subscribedAt: Timestamp.now(),
            source: 'web',
            doubleOptIn: false,
            preferences: {
              htmlEmail: true,
              timezoneName: 'Europe/Istanbul',
              bestTimeToSend: 10,
              marketingEmails: true,
              transactionalEmails: true,
              socialNotifications: true,
              productUpdates: true,
              specialOffers: true,
            },
          };
          
          const subscriptionRef = doc(collection(db, 'emailSubscriptions'));
          transaction.set(subscriptionRef, subscription);
        } else {
          // Update existing subscription
          const subscriptionRef = subscriptionDocs.docs[0].ref;
          transaction.update(subscriptionRef, {
            subscribed: true,
            subscribedAt: serverTimestamp(),
          });
        }
      });

      analyticsService.logEvent({
        name: 'email_subscribed',
        params: {
          email,
          categories: categories.join(','),
        },
      });
    } catch (error) {
      console.error('Error subscribing to emails:', error);
      throw errorService.createAppError(error as Error, {
        code: 'EMAIL_SUBSCRIBE_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  static async unsubscribe(email: string, categories: EmailCategory[] = []): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const subscriptionQuery = query(
          collection(db, 'emailSubscriptions'),
          where('email', '==', email.toLowerCase()),
          limit(1)
        );
        
        const subscriptionDocs = await getDocs(subscriptionQuery);
        
        if (!subscriptionDocs.empty) {
          const subscriptionRef = subscriptionDocs.docs[0].ref;
          
          if (categories.length === 0) {
            // Unsubscribe from all
            transaction.update(subscriptionRef, {
              subscribed: false,
              unsubscribedAt: serverTimestamp(),
            });
          } else {
            // Unsubscribe from specific categories
            const subscription = subscriptionDocs.docs[0].data() as EmailSubscription;
            const updatedCategories = subscription.categories.map(cat => 
              categories.includes(cat.type)
                ? { ...cat, subscribed: false, lastUpdated: Timestamp.now() }
                : cat
            );
            
            transaction.update(subscriptionRef, {
              categories: updatedCategories,
            });
          }
        }
      });

      analyticsService.logEvent({
        name: 'email_unsubscribed',
        params: {
          email,
          categories: categories.join(','),
        },
      });
    } catch (error) {
      console.error('Error unsubscribing from emails:', error);
      throw errorService.createAppError(error as Error, {
        code: 'EMAIL_UNSUBSCRIBE_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  // Bulk Email Operations
  static async sendBulkEmails(requests: EmailRequest[]): Promise<string[]> {
    const results: string[] = [];
    const batchSize = this.config.batchSize;
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const batchPromises = batch.map(request => 
        this.sendEmail(request).catch(error => {
          console.error(`Batch email failed:`, error);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(id => id !== null) as string[]);
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  // Email Status Tracking
  static async getEmailStatus(emailId: string): Promise<EmailStatus | null> {
    try {
      const statusDoc = await getDoc(doc(db, 'emailStatus', emailId));
      
      if (statusDoc.exists()) {
        return statusDoc.data() as EmailStatus;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting email status:', error);
      throw errorService.createAppError(error as Error, {
        code: 'EMAIL_STATUS_GET_FAILED',
        category: 'database',
        severity: 'low',
      });
    }
  }

  static async updateEmailStatus(emailId: string, status: DeliveryStatus, event?: EmailEvent): Promise<void> {
    try {
      const updates: any = {
        status,
        [`${status}At`]: serverTimestamp(),
      };
      
      if (event) {
        updates.events = [...(await this.getEmailStatus(emailId))?.events || [], event];
      }
      
      await updateDoc(doc(db, 'emailStatus', emailId), updates);
    } catch (error) {
      console.error('Error updating email status:', error);
      throw errorService.createAppError(error as Error, {
        code: 'EMAIL_STATUS_UPDATE_FAILED',
        category: 'database',
        severity: 'low',
      });
    }
  }

  // Webhook handling for email events
  static async handleWebhook(provider: EmailProvider, payload: any): Promise<void> {
    try {
      switch (provider) {
        case EmailProvider.SENDGRID:
          await this.handleSendGridWebhook(payload);
          break;
        case EmailProvider.MAILGUN:
          await this.handleMailgunWebhook(payload);
          break;
        case EmailProvider.RESEND:
          await this.handleResendWebhook(payload);
          break;
        default:
          console.warn(`Unsupported webhook provider: ${provider}`);
      }
    } catch (error) {
      console.error('Error handling email webhook:', error);
      throw errorService.createAppError(error as Error, {
        code: 'EMAIL_WEBHOOK_FAILED',
        category: 'external_service',
        severity: 'medium',
      });
    }
  }

  private static async handleSendGridWebhook(events: any[]): Promise<void> {
    for (const event of events) {
      const emailEvent: EmailEvent = {
        type: this.mapSendGridEventType(event.event),
        timestamp: Timestamp.fromMillis(event.timestamp * 1000),
        data: event,
        ipAddress: event.ip,
        userAgent: event.useragent,
        url: event.url,
      };
      
      // Find email status by provider ID
      const statusQuery = query(
        collection(db, 'emailStatus'),
        where('providerId', '==', event.sg_message_id),
        limit(1)
      );
      
      const statusDocs = await getDocs(statusQuery);
      
      if (!statusDocs.empty) {
        const statusRef = statusDocs.docs[0].ref;
        await this.updateEmailStatus(
          statusRef.id,
          this.mapToDeliveryStatus(emailEvent.type),
          emailEvent
        );
      }
    }
  }

  private static mapSendGridEventType(eventType: string): EmailEventType {
    const eventMap: { [key: string]: EmailEventType } = {
      'delivered': EmailEventType.DELIVERED,
      'open': EmailEventType.OPENED,
      'click': EmailEventType.CLICKED,
      'bounce': EmailEventType.BOUNCED,
      'spamreport': EmailEventType.SPAM_REPORT,
      'unsubscribe': EmailEventType.UNSUBSCRIBED,
      'dropped': EmailEventType.FAILED,
    };
    
    return eventMap[eventType] || EmailEventType.DELIVERED;
  }

  private static mapToDeliveryStatus(eventType: EmailEventType): DeliveryStatus {
    const statusMap: { [key in EmailEventType]: DeliveryStatus } = {
      [EmailEventType.SENT]: DeliveryStatus.SENT,
      [EmailEventType.DELIVERED]: DeliveryStatus.DELIVERED,
      [EmailEventType.OPENED]: DeliveryStatus.OPENED,
      [EmailEventType.CLICKED]: DeliveryStatus.CLICKED,
      [EmailEventType.BOUNCED]: DeliveryStatus.BOUNCED,
      [EmailEventType.SPAM_REPORT]: DeliveryStatus.SPAM,
      [EmailEventType.UNSUBSCRIBED]: DeliveryStatus.UNSUBSCRIBED,
      [EmailEventType.FAILED]: DeliveryStatus.FAILED,
    };
    
    return statusMap[eventType];
  }

  private static async handleMailgunWebhook(payload: any): Promise<void> {
    // Implement Mailgun webhook handling
    console.log('Mailgun webhook:', payload);
  }

  private static async handleResendWebhook(payload: any): Promise<void> {
    // Implement Resend webhook handling
    console.log('Resend webhook:', payload);
  }

  // Analytics
  static async getEmailAnalytics(period: AnalyticsPeriod): Promise<EmailAnalytics> {
    try {
      const statusQuery = query(
        collection(db, 'emailStatus'),
        where('sentAt', '>=', period.start),
        where('sentAt', '<=', period.end)
      );
      
      const statusDocs = await getDocs(statusQuery);
      const statuses = statusDocs.docs.map(doc => doc.data() as EmailStatus);
      
      // Calculate metrics
      const totalSent = statuses.length;
      const totalDelivered = statuses.filter(s => s.status === DeliveryStatus.DELIVERED || s.status === DeliveryStatus.OPENED || s.status === DeliveryStatus.CLICKED).length;
      const totalOpened = statuses.filter(s => s.status === DeliveryStatus.OPENED || s.status === DeliveryStatus.CLICKED).length;
      const totalClicked = statuses.filter(s => s.status === DeliveryStatus.CLICKED).length;
      const totalBounced = statuses.filter(s => s.status === DeliveryStatus.BOUNCED).length;
      const totalSpam = statuses.filter(s => s.status === DeliveryStatus.SPAM).length;
      const totalUnsubscribed = statuses.filter(s => s.status === DeliveryStatus.UNSUBSCRIBED).length;
      
      const analytics: EmailAnalytics = {
        period,
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalBounced,
        totalSpam,
        totalUnsubscribed,
        deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
        clickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
        bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
        spamRate: totalSent > 0 ? (totalSpam / totalSent) * 100 : 0,
        unsubscribeRate: totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0,
        categoryStats: [],
        templateStats: [],
        dailyStats: [],
        topClickedLinks: [],
        deviceBreakdown: [],
        locationBreakdown: [],
      };
      
      return analytics;
    } catch (error) {
      console.error('Error getting email analytics:', error);
      throw errorService.createAppError(error as Error, {
        code: 'EMAIL_ANALYTICS_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }
}

export default EmailService;
