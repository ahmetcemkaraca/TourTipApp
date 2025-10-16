'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketSource,
  TicketUserInfo,
  TicketMessage,
  MessageAuthor,
  MessageType,
  FAQItem,
  FAQCategory,
  ChatSession,
  ChatUserInfo,
  ChatStatus,
  UseSupportResult,
  UseSupportAdminResult,
  SupportMetrics,
  MetricsPeriod,
  TicketResolution,
  CustomerSatisfaction
} from '@/types/support';
import SupportService from '@/lib/support-service';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { analyticsService } from '@/lib/analytics-service';

export function useSupport(): UseSupportResult {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ticketUnsubscribeRef = useRef<(() => void) | null>(null);
  const messagesUnsubscribeRef = useRef<(() => void) | null>(null);

  // Load user tickets on mount
  useEffect(() => {
    if (user?.uid) {
      loadUserTickets();
      subscribeToUserTickets();
    }
    
    return () => {
      ticketUnsubscribeRef.current?.();
      messagesUnsubscribeRef.current?.();
    };
  }, [user?.uid]);

  const loadUserTickets = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const userTickets = await SupportService.getUserTickets(user.uid);
      setTickets(userTickets);
    } catch (error) {
      console.error('Error loading user tickets:', error);
      setError('Destek talepleri yüklenirken hata oluştu');
      toast.error('Destek talepleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const subscribeToUserTickets = useCallback(() => {
    if (!user?.uid) return;

    ticketUnsubscribeRef.current = SupportService.subscribeToUserTickets(user.uid, (userTickets) => {
      setTickets(userTickets);
    });
  }, [user?.uid]);

  const createTicket = useCallback(async (ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!user?.uid) {
      toast.error('Destek talebi oluşturmak için giriş yapmalısınız');
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const userInfo: TicketUserInfo = {
        id: user.uid,
        name: user.displayName || `${user.email?.split('@')[0]}`,
        email: user.email || '',
        language: 'tr',
        timezone: 'Europe/Istanbul',
        isRegistered: true,
        ...ticketData.userInfo,
      };

      const completeTicketData = {
        ...ticketData,
        userId: user.uid,
        userInfo,
        source: TicketSource.WEB,
      };

      const ticketId = await SupportService.createTicket(completeTicketData);
      
      toast.success('Destek talebiniz oluşturuldu. E-posta ile bilgilendirileceksiniz.');
      
      analyticsService.logEvent({
        name: 'support_ticket_created_by_user',
        params: {
          ticket_id: ticketId,
          category: ticketData.category,
          priority: ticketData.priority,
          user_id: user.uid,
        },
      });

      return ticketId;
    } catch (error) {
      console.error('Error creating ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Destek talebi oluşturulurken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const updateTicket = useCallback(async (ticketId: string, updates: Partial<SupportTicket>): Promise<void> => {
    if (!user?.uid) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Users can only update certain fields
      const allowedUpdates = {
        ...(updates.description && { description: updates.description }),
        ...(updates.tags && { tags: updates.tags }),
        ...(updates.satisfaction && { satisfaction: updates.satisfaction }),
      };

      await SupportService.updateTicket(ticketId, allowedUpdates);
      
      toast.success('Destek talebi güncellendi');
      
      analyticsService.logEvent({
        name: 'support_ticket_updated_by_user',
        params: {
          ticket_id: ticketId,
          user_id: user.uid,
          updated_fields: Object.keys(allowedUpdates),
        },
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Destek talebi güncellenirken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const getTicket = useCallback(async (ticketId: string): Promise<SupportTicket | null> => {
    setLoading(true);
    setError(null);

    try {
      const ticket = await SupportService.getTicket(ticketId);
      
      if (ticket) {
        setActiveTicket(ticket);
        
        // Subscribe to real-time updates for this ticket
        messagesUnsubscribeRef.current?.();
        messagesUnsubscribeRef.current = SupportService.subscribeToTicketMessages(ticketId, (messages) => {
          setActiveTicket(prev => prev ? { ...prev, messages } : null);
        });
      }
      
      return ticket;
    } catch (error) {
      console.error('Error getting ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Destek talebi yüklenirken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getMyTickets = useCallback(async (): Promise<SupportTicket[]> => {
    if (!user?.uid) {
      return [];
    }

    return loadUserTickets().then(() => tickets);
  }, [user?.uid, loadUserTickets, tickets]);

  const addMessage = useCallback(async (ticketId: string, content: string, attachments: File[] = []): Promise<void> => {
    if (!user?.uid) {
      toast.error('Mesaj göndermek için giriş yapmalısınız');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const author: MessageAuthor = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
        email: user.email || '',
        avatar: user.photoURL || undefined,
        role: 'customer',
      };

      await SupportService.addMessage(ticketId, content, author, MessageType.MESSAGE, attachments);
      
      toast.success('Mesajınız gönderildi');
      
      analyticsService.logEvent({
        name: 'support_message_sent_by_user',
        params: {
          ticket_id: ticketId,
          user_id: user.uid,
          has_attachments: attachments.length > 0,
          message_length: content.length,
        },
      });
    } catch (error) {
      console.error('Error adding message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Mesaj gönderilirken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const searchFAQ = useCallback(async (query: string, category?: FAQCategory): Promise<FAQItem[]> => {
    setLoading(true);
    setError(null);

    try {
      const results = await SupportService.searchFAQ(query, category);
      
      analyticsService.logEvent({
        name: 'faq_searched',
        params: {
          query,
          category: category || 'all',
          results_count: results.length,
          user_id: user?.uid || 'anonymous',
        },
      });

      return results;
    } catch (error) {
      console.error('Error searching FAQ:', error);
      const errorMessage = error instanceof Error ? error.message : 'SSS aranırken hata oluştu';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const getFAQByCategory = useCallback(async (category: FAQCategory): Promise<FAQItem[]> => {
    setLoading(true);
    setError(null);

    try {
      const results = await SupportService.getFAQByCategory(category);
      
      analyticsService.logEvent({
        name: 'faq_category_viewed',
        params: {
          category,
          results_count: results.length,
          user_id: user?.uid || 'anonymous',
        },
      });

      return results;
    } catch (error) {
      console.error('Error getting FAQ by category:', error);
      const errorMessage = error instanceof Error ? error.message : 'SSS kategorisi yüklenirken hata oluştu';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const markFAQHelpful = useCallback(async (faqId: string, helpful: boolean): Promise<void> => {
    try {
      await SupportService.markFAQHelpful(faqId, helpful);
      
      toast.success(helpful ? 'Geri bildiriminiz için teşekkürler!' : 'Geri bildiriminiz alındı');
      
      analyticsService.logEvent({
        name: 'faq_feedback_submitted',
        params: {
          faq_id: faqId,
          helpful,
          user_id: user?.uid || 'anonymous',
        },
      });
    } catch (error) {
      console.error('Error marking FAQ helpful:', error);
      toast.error('Geri bildirim gönderilirken hata oluştu');
    }
  }, [user?.uid, toast]);

  const startChatSession = useCallback(async (initialMessage?: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const userInfo: ChatUserInfo = {
        id: user?.uid,
        name: user?.displayName || user?.email?.split('@')[0],
        email: user?.email,
        isAuthenticated: !!user,
        language: 'tr',
        timezone: 'Europe/Istanbul',
        page: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      };

      const sessionId = await SupportService.startChatSession(userInfo, initialMessage);
      
      // Get the created session
      // setChatSession would be updated via real-time subscription
      
      toast.success('Canlı destek başlatıldı');
      
      analyticsService.logEvent({
        name: 'chat_session_started_by_user',
        params: {
          session_id: sessionId,
          user_id: user?.uid || 'anonymous',
          has_initial_message: !!initialMessage,
        },
      });

      return sessionId;
    } catch (error) {
      console.error('Error starting chat session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Canlı destek başlatılırken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const sendChatMessage = useCallback(async (sessionId: string, message: string): Promise<void> => {
    try {
      const userInfo: ChatUserInfo = {
        id: user?.uid,
        name: user?.displayName || user?.email?.split('@')[0] || 'Kullanıcı',
        email: user?.email,
        isAuthenticated: !!user,
        language: 'tr',
        timezone: 'Europe/Istanbul',
        page: typeof window !== 'undefined' ? window.location.href : '',
      };

      await SupportService.sendChatMessage(sessionId, message, userInfo);
      
      analyticsService.logEvent({
        name: 'chat_message_sent_by_user',
        params: {
          session_id: sessionId,
          user_id: user?.uid || 'anonymous',
          message_length: message.length,
        },
      });
    } catch (error) {
      console.error('Error sending chat message:', error);
      toast.error('Mesaj gönderilirken hata oluştu');
    }
  }, [user, toast]);

  const endChatSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      // Update chat session status to ended
      // await SupportService.endChatSession(sessionId);
      
      setChatSession(null);
      toast.success('Canlı destek sonlandırıldı');
      
      analyticsService.logEvent({
        name: 'chat_session_ended_by_user',
        params: {
          session_id: sessionId,
          user_id: user?.uid || 'anonymous',
        },
      });
    } catch (error) {
      console.error('Error ending chat session:', error);
      toast.error('Canlı destek sonlandırılırken hata oluştu');
    }
  }, [user?.uid, toast]);

  return {
    tickets,
    activeTicket,
    chatSession,
    loading,
    error,
    createTicket,
    updateTicket,
    getTicket,
    getMyTickets,
    addMessage,
    searchFAQ,
    getFAQByCategory,
    markFAQHelpful,
    startChatSession,
    sendChatMessage,
    endChatSession,
  };
}

// Hook for support agents and administrators
export function useSupportAdmin(): UseSupportAdminResult {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [agentQueue, setAgentQueue] = useState<SupportTicket[]>([]);
  const [activeChatSessions, setActiveChatSessions] = useState<ChatSession[]>([]);
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTicketQueue = useCallback(async (agentId?: string): Promise<SupportTicket[]> => {
    setLoading(true);
    setError(null);

    try {
      // This would get tickets assigned to the agent or in queue
      // const queue = await SupportService.getAgentQueue(agentId || user?.uid);
      const queue: SupportTicket[] = []; // Placeholder
      
      setAgentQueue(queue);
      return queue;
    } catch (error) {
      console.error('Error getting ticket queue:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kuyruk yüklenirken hata oluştu';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const assignTicket = useCallback(async (ticketId: string, agentId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await SupportService.assignTicket(ticketId, agentId);
      
      toast.success('Talep atandı');
      
      analyticsService.logEvent({
        name: 'support_ticket_assigned_by_admin',
        params: {
          ticket_id: ticketId,
          agent_id: agentId,
          assigned_by: user?.uid || 'unknown',
        },
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Talep atanırken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const escalateTicket = useCallback(async (ticketId: string, reason: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await SupportService.updateTicketStatus(ticketId, TicketStatus.ESCALATED, user?.uid || 'system');
      
      // Add escalation message
      // await SupportService.addEscalationMessage(ticketId, reason);
      
      toast.success('Talep yükseltildi');
      
      analyticsService.logEvent({
        name: 'support_ticket_escalated',
        params: {
          ticket_id: ticketId,
          reason,
          escalated_by: user?.uid || 'unknown',
        },
      });
    } catch (error) {
      console.error('Error escalating ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Talep yükseltilirken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const resolveTicket = useCallback(async (ticketId: string, resolution: TicketResolution): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await SupportService.updateTicketStatus(ticketId, TicketStatus.RESOLVED, user?.uid || 'system');
      
      // Add resolution details
      // await SupportService.addResolution(ticketId, resolution);
      
      toast.success('Talep çözüldü');
      
      analyticsService.logEvent({
        name: 'support_ticket_resolved',
        params: {
          ticket_id: ticketId,
          resolution_type: resolution.resolutionType,
          resolved_by: user?.uid || 'unknown',
        },
      });
    } catch (error) {
      console.error('Error resolving ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Talep çözülürken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const acceptChat = useCallback(async (sessionId: string): Promise<void> => {
    try {
      // await SupportService.acceptChatSession(sessionId, user?.uid);
      
      toast.success('Sohbet kabul edildi');
      
      analyticsService.logEvent({
        name: 'chat_session_accepted',
        params: {
          session_id: sessionId,
          agent_id: user?.uid || 'unknown',
        },
      });
    } catch (error) {
      console.error('Error accepting chat:', error);
      toast.error('Sohbet kabul edilirken hata oluştu');
    }
  }, [user?.uid, toast]);

  const transferChat = useCallback(async (sessionId: string, toAgentId: string, reason: string): Promise<void> => {
    try {
      // await SupportService.transferChatSession(sessionId, toAgentId, reason);
      
      toast.success('Sohbet transfer edildi');
      
      analyticsService.logEvent({
        name: 'chat_session_transferred',
        params: {
          session_id: sessionId,
          to_agent_id: toAgentId,
          from_agent_id: user?.uid || 'unknown',
          reason,
        },
      });
    } catch (error) {
      console.error('Error transferring chat:', error);
      toast.error('Sohbet transfer edilirken hata oluştu');
    }
  }, [user?.uid, toast]);

  const getMetrics = useCallback(async (period: MetricsPeriod): Promise<SupportMetrics> => {
    setLoading(true);
    setError(null);

    try {
      const supportMetrics = await SupportService.getSupportMetrics(period);
      
      setMetrics(supportMetrics as SupportMetrics);
      
      analyticsService.logEvent({
        name: 'support_metrics_viewed',
        params: {
          period_start: period.start.toDate().toISOString(),
          period_end: period.end.toDate().toISOString(),
          viewed_by: user?.uid || 'unknown',
        },
      });

      return supportMetrics as SupportMetrics;
    } catch (error) {
      console.error('Error getting metrics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Metrikler yüklenirken hata oluştu';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const getAgentStats = useCallback(async (agentId: string, period: MetricsPeriod): Promise<any> => {
    try {
      // const stats = await SupportService.getAgentStats(agentId, period);
      const stats = {}; // Placeholder
      
      return stats;
    } catch (error) {
      console.error('Error getting agent stats:', error);
      throw error;
    }
  }, []);

  const createArticle = useCallback(async (article: any): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      // const articleId = await SupportService.createKnowledgeBaseArticle(article);
      const articleId = 'article_' + Date.now(); // Placeholder
      
      toast.success('Makale oluşturuldu');
      
      analyticsService.logEvent({
        name: 'knowledge_base_article_created',
        params: {
          article_id: articleId,
          category: article.category,
          created_by: user?.uid || 'unknown',
        },
      });

      return articleId;
    } catch (error) {
      console.error('Error creating article:', error);
      const errorMessage = error instanceof Error ? error.message : 'Makale oluşturulurken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  const updateArticle = useCallback(async (articleId: string, updates: any): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // await SupportService.updateKnowledgeBaseArticle(articleId, updates);
      
      toast.success('Makale güncellendi');
      
      analyticsService.logEvent({
        name: 'knowledge_base_article_updated',
        params: {
          article_id: articleId,
          updated_by: user?.uid || 'unknown',
        },
      });
    } catch (error) {
      console.error('Error updating article:', error);
      const errorMessage = error instanceof Error ? error.message : 'Makale güncellenirken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  return {
    agentQueue,
    activeChatSessions,
    metrics,
    loading,
    error,
    getTicketQueue,
    assignTicket,
    escalateTicket,
    resolveTicket,
    acceptChat,
    transferChat,
    getMetrics,
    getAgentStats,
    createArticle,
    updateArticle,
  };
}

// Hook for customer satisfaction
export function useCustomerSatisfaction() {
  const { toast } = useToast();

  const submitRating = useCallback(async (ticketId: string, rating: number, feedback?: string): Promise<void> => {
    try {
      await SupportService.submitSatisfactionRating(ticketId, rating, feedback);
      
      toast.success('Değerlendirmeniz için teşekkürler!');
      
      analyticsService.logEvent({
        name: 'customer_satisfaction_submitted',
        params: {
          ticket_id: ticketId,
          rating,
          has_feedback: !!feedback,
        },
      });
    } catch (error) {
      console.error('Error submitting satisfaction rating:', error);
      toast.error('Değerlendirme gönderilirken hata oluştu');
    }
  }, [toast]);

  return {
    submitRating,
  };
}

export default useSupport;
