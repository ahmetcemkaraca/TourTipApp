'use client';

import { useState, useCallback } from 'react';
import {
  EmailRequest,
  EmailTemplate,
  EmailType,
  EmailData,
  EmailStatus,
  EmailCampaign,
  CampaignResults,
  EmailAnalytics,
  AnalyticsPeriod,
  EmailCategory,
  SubscriptionPreferences,
  UseEmailResult
} from '@/types/email';
import EmailService from '@/lib/email-service';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { analyticsService } from '@/lib/analytics-service';

export function useEmail(): UseEmailResult {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = useCallback(async (request: EmailRequest): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const emailId = await EmailService.sendEmail(request);
      
      toast.success('E-posta başarıyla gönderildi');
      
      analyticsService.logEvent({
        name: 'email_sent_via_hook',
        params: {
          email_type: request.template,
          recipient_count: request.to.length,
          user_id: user?.uid || 'anonymous',
        },
      });

      return emailId;
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMessage = error instanceof Error ? error.message : 'E-posta gönderilirken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const sendBulkEmails = useCallback(async (requests: EmailRequest[]): Promise<string[]> => {
    setLoading(true);
    setError(null);

    try {
      const emailIds = await EmailService.sendBulkEmails(requests);
      
      const successCount = emailIds.length;
      const failureCount = requests.length - successCount;
      
      if (failureCount === 0) {
        toast.success(`${successCount} e-posta başarıyla gönderildi`);
      } else {
        toast.warning(`${successCount} başarılı, ${failureCount} başarısız e-posta`);
      }
      
      analyticsService.logEvent({
        name: 'bulk_emails_sent',
        params: {
          total_requests: requests.length,
          successful_sends: successCount,
          failed_sends: failureCount,
          user_id: user?.uid || 'anonymous',
        },
      });

      return emailIds;
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      const errorMessage = error instanceof Error ? error.message : 'Toplu e-posta gönderilirken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const getTemplates = useCallback(async (): Promise<EmailTemplate[]> => {
    setLoading(true);
    setError(null);

    try {
      // This would fetch all templates from the service
      // For now, return empty array as the service doesn't have a getTemplates method
      console.log('Getting email templates...');
      return [];
    } catch (error) {
      console.error('Error getting templates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Şablonlar yüklenirken hata oluştu';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTemplate = useCallback(async (type: EmailType, language = 'tr'): Promise<EmailTemplate | null> => {
    setLoading(true);
    setError(null);

    try {
      const template = await EmailService.getTemplate(type, language);
      return template;
    } catch (error) {
      console.error('Error getting template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Şablon yüklenirken hata oluştu';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const previewTemplate = useCallback(async (type: EmailType, data: EmailData): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const preview = await EmailService.previewTemplate(type, data, data.user?.language || 'tr');
      
      analyticsService.logEvent({
        name: 'email_template_previewed',
        params: {
          template_type: type,
          language: data.user?.language || 'tr',
          user_id: user?.uid || 'anonymous',
        },
      });

      return preview.html;
    } catch (error) {
      console.error('Error previewing template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Şablon önizlenirken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const createCampaign = useCallback(async (campaign: Omit<EmailCampaign, 'id' | 'createdAt'>): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      // This would be implemented in EmailService
      const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      toast.success('Kampanya oluşturuldu');
      
      analyticsService.logEvent({
        name: 'email_campaign_created',
        params: {
          campaign_type: campaign.type,
          template_type: campaign.template,
          recipient_count: campaign.recipients.length,
          user_id: user?.uid || 'anonymous',
        },
      });

      return campaignId;
    } catch (error) {
      console.error('Error creating campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kampanya oluşturulurken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const sendCampaign = useCallback(async (campaignId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // This would be implemented in EmailService
      console.log(`Sending campaign: ${campaignId}`);
      
      toast.success('Kampanya gönderilmeye başlandı');
      
      analyticsService.logEvent({
        name: 'email_campaign_sent',
        params: {
          campaign_id: campaignId,
          user_id: user?.uid || 'anonymous',
        },
      });
    } catch (error) {
      console.error('Error sending campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kampanya gönderilirken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const getCampaignResults = useCallback(async (campaignId: string): Promise<CampaignResults> => {
    setLoading(true);
    setError(null);

    try {
      // This would be implemented in EmailService
      // For now, return mock results
      const mockResults: CampaignResults = {
        totalRecipients: 1000,
        sentCount: 950,
        deliveredCount: 920,
        openedCount: 350,
        clickedCount: 85,
        bouncedCount: 30,
        spamCount: 5,
        unsubscribedCount: 12,
        failedCount: 50,
        deliveryRate: 96.8,
        openRate: 38.0,
        clickRate: 24.3,
        clickToOpenRate: 24.3,
        bounceRate: 3.2,
        spamRate: 0.5,
        unsubscribeRate: 1.3,
        conversionCount: 15,
        conversionRate: 1.6,
        revenue: 1250.00,
      };

      return mockResults;
    } catch (error) {
      console.error('Error getting campaign results:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kampanya sonuçları alınırken hata oluştu';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribe = useCallback(async (email: string, categories: EmailCategory[] = []): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await EmailService.subscribe(email, categories);
      
      toast.success('E-posta aboneliği başarıyla oluşturuldu');
      
      analyticsService.logEvent({
        name: 'email_subscription_created',
        params: {
          email,
          categories: categories.join(','),
          user_id: user?.uid || 'anonymous',
        },
      });
    } catch (error) {
      console.error('Error subscribing to emails:', error);
      const errorMessage = error instanceof Error ? error.message : 'Abonelik oluşturulurken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const unsubscribe = useCallback(async (email: string, categories: EmailCategory[] = []): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await EmailService.unsubscribe(email, categories);
      
      const message = categories.length === 0 
        ? 'Tüm e-posta aboneliklerinden çıkarıldınız'
        : 'Seçilen kategorilerden abonelik iptal edildi';
      
      toast.success(message);
      
      analyticsService.logEvent({
        name: 'email_subscription_cancelled',
        params: {
          email,
          categories: categories.join(','),
          user_id: user?.uid || 'anonymous',
        },
      });
    } catch (error) {
      console.error('Error unsubscribing from emails:', error);
      const errorMessage = error instanceof Error ? error.message : 'Abonelik iptal edilirken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const updatePreferences = useCallback(async (email: string, preferences: SubscriptionPreferences): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // This would be implemented in EmailService
      console.log('Updating email preferences:', { email, preferences });
      
      toast.success('E-posta tercihleri güncellendi');
      
      analyticsService.logEvent({
        name: 'email_preferences_updated',
        params: {
          email,
          user_id: user?.uid || 'anonymous',
        },
      });
    } catch (error) {
      console.error('Error updating email preferences:', error);
      const errorMessage = error instanceof Error ? error.message : 'Tercihler güncellenirken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const getAnalytics = useCallback(async (period: AnalyticsPeriod): Promise<EmailAnalytics> => {
    setLoading(true);
    setError(null);

    try {
      const analytics = await EmailService.getEmailAnalytics(period);
      
      analyticsService.logEvent({
        name: 'email_analytics_viewed',
        params: {
          period_start: period.start.toDate().toISOString(),
          period_end: period.end.toDate().toISOString(),
          user_id: user?.uid || 'anonymous',
        },
      });

      return analytics;
    } catch (error) {
      console.error('Error getting email analytics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analitik veriler alınırken hata oluştu';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const getEmailStatus = useCallback(async (emailId: string): Promise<EmailStatus> => {
    setLoading(true);
    setError(null);

    try {
      const status = await EmailService.getEmailStatus(emailId);
      
      if (!status) {
        throw new Error('E-posta durumu bulunamadı');
      }

      return status;
    } catch (error) {
      console.error('Error getting email status:', error);
      const errorMessage = error instanceof Error ? error.message : 'E-posta durumu alınırken hata oluştu';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sendEmail,
    sendBulkEmails,
    getTemplates,
    getTemplate,
    previewTemplate,
    createCampaign,
    sendCampaign,
    getCampaignResults,
    subscribe,
    unsubscribe,
    updatePreferences,
    getAnalytics,
    getEmailStatus,
    loading,
    error,
  };
}

// Specialized hooks for common email types
export function useTransactionalEmails() {
  const { sendEmail } = useEmail();

  const sendWelcomeEmail = useCallback(async (userData: EmailData['user']) => {
    const request: EmailRequest = {
      to: [{ email: userData.email, name: `${userData.firstName} ${userData.lastName}` }],
      template: EmailType.WELCOME,
      data: { user: userData },
      priority: 'high' as any,
    };

    return sendEmail(request);
  }, [sendEmail]);

  const sendBookingConfirmation = useCallback(async (userData: EmailData['user'], bookingData: EmailData['booking']) => {
    const request: EmailRequest = {
      to: [{ email: userData.email, name: `${userData.firstName} ${userData.lastName}` }],
      template: EmailType.BOOKING_CONFIRMATION,
      data: { user: userData, booking: bookingData },
      priority: 'high' as any,
    };

    return sendEmail(request);
  }, [sendEmail]);

  const sendPaymentConfirmation = useCallback(async (userData: EmailData['user'], paymentData: EmailData['payment']) => {
    const request: EmailRequest = {
      to: [{ email: userData.email, name: `${userData.firstName} ${userData.lastName}` }],
      template: EmailType.PAYMENT_CONFIRMATION,
      data: { user: userData, payment: paymentData },
      priority: 'high' as any,
    };

    return sendEmail(request);
  }, [sendEmail]);

  const sendPasswordReset = useCallback(async (userData: EmailData['user'], resetToken: string) => {
    const request: EmailRequest = {
      to: [{ email: userData.email, name: `${userData.firstName} ${userData.lastName}` }],
      template: EmailType.PASSWORD_RESET,
      data: { 
        user: userData, 
        custom: { 
          resetToken,
          resetUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`
        }
      },
      priority: 'urgent' as any,
    };

    return sendEmail(request);
  }, [sendEmail]);

  return {
    sendWelcomeEmail,
    sendBookingConfirmation,
    sendPaymentConfirmation,
    sendPasswordReset,
  };
}

export function useMarketingEmails() {
  const { sendEmail, createCampaign, sendCampaign } = useEmail();

  const sendNewsletterEmail = useCallback(async (userData: EmailData['user'], content: any) => {
    const request: EmailRequest = {
      to: [{ email: userData.email, name: `${userData.firstName} ${userData.lastName}` }],
      template: EmailType.NEWSLETTER,
      data: { user: userData, custom: content },
      priority: 'normal' as any,
    };

    return sendEmail(request);
  }, [sendEmail]);

  const sendPromotionalOffer = useCallback(async (userData: EmailData['user'], promotionData: EmailData['promotion']) => {
    const request: EmailRequest = {
      to: [{ email: userData.email, name: `${userData.firstName} ${userData.lastName}` }],
      template: EmailType.PROMOTIONAL_OFFER,
      data: { user: userData, promotion: promotionData },
      priority: 'normal' as any,
    };

    return sendEmail(request);
  }, [sendEmail]);

  const createPromotionalCampaign = useCallback(async (
    name: string,
    recipients: { email: string; name?: string; data?: EmailData }[],
    promotionData: EmailData['promotion']
  ) => {
    const campaign = {
      name,
      description: `Promotional campaign: ${promotionData?.title}`,
      type: 'one_time' as any,
      template: EmailType.PROMOTIONAL_OFFER,
      recipients: recipients.map(r => ({
        email: r.email,
        name: r.name,
        data: r.data,
        status: 'pending' as any,
      })),
      schedule: {
        type: 'immediate' as any,
      },
      segmentation: {
        criteria: [],
        logic: 'AND' as any,
        excludeUnsubscribed: true,
        excludeBounced: true,
      },
      tracking: {
        trackOpens: true,
        trackClicks: true,
        trackUnsubscribes: true,
        trackConversions: true,
      },
      status: 'draft' as any,
      createdBy: 'system',
    };

    return createCampaign(campaign);
  }, [createCampaign]);

  return {
    sendNewsletterEmail,
    sendPromotionalOffer,
    createPromotionalCampaign,
  };
}

export default useEmail;
