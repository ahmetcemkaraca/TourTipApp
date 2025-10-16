// Support Service for TourTrip.app
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
  onSnapshot,
  Timestamp,
  startAfter,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketSource,
  TicketMessage,
  TicketUserInfo,
  TicketResolution,
  MessageType,
  MessageAuthor,
  FAQItem,
  FAQCategory,
  KnowledgeBaseArticle,
  ChatSession,
  ChatStatus,
  ChatMessage,
  ChatMessageType,
  ChatUserInfo,
  SupportAgent,
  AgentAvailability,
  SupportMetrics,
  MetricsPeriod,
  CustomerSatisfaction
} from '@/types/support';
import { analyticsService } from './analytics-service';
import { errorService } from './error-service';

export class SupportService {
  // Ticket Management
  static async createTicket(ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Generate ticket number
      const ticketNumber = await this.generateTicketNumber();
      
      const ticket: SupportTicket = {
        ...ticketData,
        id: '',
        ticketNumber,
        status: TicketStatus.NEW,
        messages: [],
        attachments: [],
        tags: [],
        metadata: {
          ...ticketData.metadata,
          ipAddress: this.getClientIP(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const ticketRef = await addDoc(collection(db, 'supportTickets'), ticket);
      ticket.id = ticketRef.id;
      
      // Update ticket with its ID
      await updateDoc(ticketRef, { id: ticketRef.id });

      // Create initial system message
      await this.addSystemMessage(ticketRef.id, `Destek talebi oluşturuldu. Talep numarası: ${ticketNumber}`, MessageType.SYSTEM);

      // Auto-assign if possible
      await this.autoAssignTicket(ticketRef.id, ticket.category, ticket.priority);

      // Send notification email
      await this.sendTicketNotification(ticket, 'created');

      analyticsService.logEvent({
        name: 'support_ticket_created',
        params: {
          ticket_id: ticketRef.id,
          category: ticket.category,
          priority: ticket.priority,
          source: ticket.source,
          user_id: ticket.userId || 'anonymous',
        },
      });

      return ticketRef.id;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw errorService.createAppError(error as Error, {
        code: 'SUPPORT_TICKET_CREATE_FAILED',
        category: 'business_logic',
        severity: 'high',
      });
    }
  }

  private static async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get the count of tickets this month to generate sequential number
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);
    
    const monthlyTicketsQuery = query(
      collection(db, 'supportTickets'),
      where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
      where('createdAt', '<=', Timestamp.fromDate(endOfMonth))
    );
    
    const monthlyTickets = await getDocs(monthlyTicketsQuery);
    const sequentialNumber = String(monthlyTickets.size + 1).padStart(6, '0');
    
    return `TT-${year}${month}-${sequentialNumber}`;
  }

  private static getClientIP(): string {
    // This would typically be handled on the server side
    // For client-side, we can't get the real IP
    return 'unknown';
  }

  static async getTicket(ticketId: string): Promise<SupportTicket | null> {
    try {
      const ticketDoc = await getDoc(doc(db, 'supportTickets', ticketId));
      
      if (ticketDoc.exists()) {
        return ticketDoc.data() as SupportTicket;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting support ticket:', error);
      throw errorService.createAppError(error as Error, {
        code: 'SUPPORT_TICKET_GET_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  static async getUserTickets(userId: string, limitCount = 20): Promise<SupportTicket[]> {
    try {
      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const ticketDocs = await getDocs(ticketsQuery);
      return ticketDocs.docs.map(doc => doc.data() as SupportTicket);
    } catch (error) {
      console.error('Error getting user tickets:', error);
      throw errorService.createAppError(error as Error, {
        code: 'USER_TICKETS_GET_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  static async updateTicketStatus(ticketId: string, status: TicketStatus, updatedBy: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const ticketRef = doc(db, 'supportTickets', ticketId);
        const ticketDoc = await transaction.get(ticketRef);
        
        if (!ticketDoc.exists()) {
          throw new Error('Ticket not found');
        }

        const ticket = ticketDoc.data() as SupportTicket;
        const updates: any = {
          status,
          updatedAt: serverTimestamp(),
        };

        // Set timestamps for specific status changes
        if (status === TicketStatus.RESOLVED) {
          updates.resolvedAt = serverTimestamp();
        } else if (status === TicketStatus.CLOSED) {
          updates.closedAt = serverTimestamp();
        }

        transaction.update(ticketRef, updates);

        // Add system message
        const systemMessage = `Talep durumu "${this.getStatusDisplayName(status)}" olarak güncellendi.`;
        await this.addSystemMessage(ticketId, systemMessage, MessageType.STATUS_CHANGE);
      });

      analyticsService.logEvent({
        name: 'support_ticket_status_updated',
        params: {
          ticket_id: ticketId,
          new_status: status,
          updated_by: updatedBy,
        },
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw errorService.createAppError(error as Error, {
        code: 'SUPPORT_TICKET_UPDATE_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  private static getStatusDisplayName(status: TicketStatus): string {
    const statusNames = {
      [TicketStatus.NEW]: 'Yeni',
      [TicketStatus.OPEN]: 'Açık',
      [TicketStatus.IN_PROGRESS]: 'İşlem Halinde',
      [TicketStatus.PENDING_CUSTOMER]: 'Müşteri Bekleniyor',
      [TicketStatus.PENDING_INTERNAL]: 'İç Bekleme',
      [TicketStatus.ESCALATED]: 'Yükseltildi',
      [TicketStatus.RESOLVED]: 'Çözüldü',
      [TicketStatus.CLOSED]: 'Kapatıldı',
      [TicketStatus.CANCELLED]: 'İptal Edildi',
    };
    
    return statusNames[status] || status;
  }

  static async addMessage(
    ticketId: string,
    content: string,
    author: MessageAuthor,
    type: MessageType = MessageType.MESSAGE,
    attachments: File[] = []
  ): Promise<string> {
    try {
      // Upload attachments if any
      const uploadedAttachments = await this.uploadAttachments(attachments, author.id);

      const message: TicketMessage = {
        id: '',
        ticketId,
        author,
        content,
        type,
        attachments: uploadedAttachments,
        isInternal: author.role === 'agent' || author.role === 'admin',
        isAutomatic: type === MessageType.SYSTEM,
        createdAt: Timestamp.now(),
        seenBy: [{ userId: author.id, seenAt: Timestamp.now() }],
      };

      const messageRef = await addDoc(collection(db, 'ticketMessages'), message);
      message.id = messageRef.id;

      // Update message with its ID
      await updateDoc(messageRef, { id: messageRef.id });

      // Update ticket's last message time and response time
      await runTransaction(db, async (transaction) => {
        const ticketRef = doc(db, 'supportTickets', ticketId);
        const ticketDoc = await transaction.get(ticketRef);
        
        if (ticketDoc.exists()) {
          const ticket = ticketDoc.data() as SupportTicket;
          const updates: any = {
            updatedAt: serverTimestamp(),
          };

          // Set first response time if this is the first agent response
          if (author.role === 'agent' && !ticket.firstResponseAt && type === MessageType.MESSAGE) {
            updates.firstResponseAt = serverTimestamp();
          }

          // Auto-update status
          if (ticket.status === TicketStatus.NEW && author.role === 'agent') {
            updates.status = TicketStatus.OPEN;
          } else if (ticket.status === TicketStatus.PENDING_CUSTOMER && author.role === 'customer') {
            updates.status = TicketStatus.OPEN;
          }

          transaction.update(ticketRef, updates);
        }
      });

      // Send notification
      const ticket = await this.getTicket(ticketId);
      if (ticket) {
        await this.sendMessageNotification(ticket, message);
      }

      analyticsService.logEvent({
        name: 'support_message_added',
        params: {
          ticket_id: ticketId,
          message_type: type,
          author_role: author.role,
          has_attachments: attachments.length > 0,
        },
      });

      return messageRef.id;
    } catch (error) {
      console.error('Error adding message to ticket:', error);
      throw errorService.createAppError(error as Error, {
        code: 'SUPPORT_MESSAGE_ADD_FAILED',
        category: 'business_logic',
        severity: 'medium',
      });
    }
  }

  private static async addSystemMessage(ticketId: string, content: string, type: MessageType): Promise<void> {
    const systemAuthor: MessageAuthor = {
      id: 'system',
      name: 'Sistem',
      email: 'system@tourtrip.app',
      role: 'system',
    };

    await this.addMessage(ticketId, content, systemAuthor, type);
  }

  private static async uploadAttachments(files: File[], userId: string): Promise<any[]> {
    const attachments = [];
    
    for (const file of files) {
      try {
        const filename = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `support-attachments/${userId}/${filename}`);
        
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        attachments.push({
          id: snapshot.ref.name,
          filename: file.name,
          url: downloadURL,
          type: file.type,
          size: file.size,
          uploadedBy: userId,
          uploadedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error(`Error uploading attachment ${file.name}:`, error);
      }
    }
    
    return attachments;
  }

  private static async autoAssignTicket(ticketId: string, category: TicketCategory, priority: TicketPriority): Promise<void> {
    try {
      // Get available agents with relevant skills
      const availableAgents = await this.getAvailableAgents(category);
      
      if (availableAgents.length === 0) {
        return; // No available agents
      }

      // Simple round-robin assignment for now
      // In production, this could be more sophisticated (workload balancing, skill matching, etc.)
      const selectedAgent = availableAgents[0];
      
      await this.assignTicket(ticketId, selectedAgent.id);
    } catch (error) {
      console.error('Error auto-assigning ticket:', error);
      // Don't throw error - assignment failure shouldn't break ticket creation
    }
  }

  private static async getAvailableAgents(category: TicketCategory): Promise<SupportAgent[]> {
    try {
      const agentsQuery = query(
        collection(db, 'supportAgents'),
        where('isActive', '==', true),
        where('availability.status', 'in', ['online', 'away']),
        where('availability.autoAssign', '==', true)
      );
      
      const agentDocs = await getDocs(agentsQuery);
      const agents = agentDocs.docs.map(doc => doc.data() as SupportAgent);
      
      // Filter agents by skills and capacity
      return agents.filter(agent => {
        // Check if agent has skills for this category
        const hasSkill = agent.skills.some(skill => skill.category === category);
        
        // Check if agent has capacity
        const hasCapacity = agent.availability.currentCapacity < agent.availability.maxCapacity;
        
        return hasSkill && hasCapacity;
      });
    } catch (error) {
      console.error('Error getting available agents:', error);
      return [];
    }
  }

  static async assignTicket(ticketId: string, agentId: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const ticketRef = doc(db, 'supportTickets', ticketId);
        const agentRef = doc(db, 'supportAgents', agentId);
        
        const [ticketDoc, agentDoc] = await Promise.all([
          transaction.get(ticketRef),
          transaction.get(agentRef)
        ]);
        
        if (!ticketDoc.exists() || !agentDoc.exists()) {
          throw new Error('Ticket or agent not found');
        }

        const agent = agentDoc.data() as SupportAgent;
        
        transaction.update(ticketRef, {
          assignedTo: agentId,
          assigneeInfo: {
            id: agent.id,
            name: agent.name,
            email: agent.email,
            avatar: agent.avatar,
            role: agent.role,
            department: agent.department,
            skills: agent.skills,
            languages: agent.languages,
            availability: agent.availability,
            workSchedule: agent.workSchedule,
            stats: agent.stats,
            isActive: agent.isActive,
            lastActiveAt: agent.lastActiveAt,
            createdAt: agent.createdAt,
          },
          status: TicketStatus.OPEN,
          updatedAt: serverTimestamp(),
        });

        // Update agent's current capacity
        transaction.update(agentRef, {
          'availability.currentCapacity': increment(1),
          'stats.activeTickets': increment(1),
        });
      });

      // Add system message
      const agent = await this.getAgent(agentId);
      const systemMessage = `Talep ${agent?.name || 'bilinmeyen ajan'} tarafından alındı.`;
      await this.addSystemMessage(ticketId, systemMessage, MessageType.ASSIGNMENT);

      analyticsService.logEvent({
        name: 'support_ticket_assigned',
        params: {
          ticket_id: ticketId,
          agent_id: agentId,
        },
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      throw errorService.createAppError(error as Error, {
        code: 'SUPPORT_TICKET_ASSIGN_FAILED',
        category: 'business_logic',
        severity: 'medium',
      });
    }
  }

  private static async getAgent(agentId: string): Promise<SupportAgent | null> {
    try {
      const agentDoc = await getDoc(doc(db, 'supportAgents', agentId));
      return agentDoc.exists() ? agentDoc.data() as SupportAgent : null;
    } catch (error) {
      console.error('Error getting agent:', error);
      return null;
    }
  }

  // FAQ & Knowledge Base
  static async searchFAQ(searchQuery: string, category?: FAQCategory, language = 'tr'): Promise<FAQItem[]> {
    try {
      let faqQuery = query(
        collection(db, 'faqItems'),
        where('language', '==', language),
        where('isPublic', '==', true)
      );

      if (category) {
        faqQuery = query(faqQuery, where('category', '==', category));
      }

      const faqDocs = await getDocs(faqQuery);
      const faqs = faqDocs.docs.map(doc => doc.data() as FAQItem);

      // Simple text search (in production, you'd use a search service like Algolia)
      const searchResults = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      // Sort by relevance (simplified scoring)
      return searchResults.sort((a, b) => {
        const scoreA = this.calculateFAQRelevanceScore(a, searchQuery);
        const scoreB = this.calculateFAQRelevanceScore(b, searchQuery);
        return scoreB - scoreA;
      }).slice(0, 10); // Limit to top 10 results
    } catch (error) {
      console.error('Error searching FAQ:', error);
      throw errorService.createAppError(error as Error, {
        code: 'FAQ_SEARCH_FAILED',
        category: 'database',
        severity: 'low',
      });
    }
  }

  private static calculateFAQRelevanceScore(faq: FAQItem, searchQuery: string): number {
    let score = 0;
    const query = searchQuery.toLowerCase();
    
    // Exact match in question gets highest score
    if (faq.question.toLowerCase().includes(query)) {
      score += 10;
    }
    
    // Match in answer
    if (faq.answer.toLowerCase().includes(query)) {
      score += 5;
    }
    
    // Match in tags
    if (faq.tags.some(tag => tag.toLowerCase().includes(query))) {
      score += 3;
    }
    
    // Popular questions get bonus
    if (faq.isPopular) {
      score += 2;
    }
    
    // View count and helpfulness factor in
    score += Math.log(faq.viewCount + 1) * 0.1;
    score += (faq.helpfulCount / Math.max(faq.helpfulCount + faq.notHelpfulCount, 1)) * 2;
    
    return score;
  }

  static async getFAQByCategory(category: FAQCategory, language = 'tr'): Promise<FAQItem[]> {
    try {
      const faqQuery = query(
        collection(db, 'faqItems'),
        where('category', '==', category),
        where('language', '==', language),
        where('isPublic', '==', true),
        orderBy('viewCount', 'desc')
      );
      
      const faqDocs = await getDocs(faqQuery);
      return faqDocs.docs.map(doc => doc.data() as FAQItem);
    } catch (error) {
      console.error('Error getting FAQ by category:', error);
      throw errorService.createAppError(error as Error, {
        code: 'FAQ_GET_BY_CATEGORY_FAILED',
        category: 'database',
        severity: 'low',
      });
    }
  }

  static async markFAQHelpful(faqId: string, helpful: boolean): Promise<void> {
    try {
      const faqRef = doc(db, 'faqItems', faqId);
      
      await runTransaction(db, async (transaction) => {
        const faqDoc = await transaction.get(faqRef);
        
        if (faqDoc.exists()) {
          const updates = helpful 
            ? { helpfulCount: increment(1) }
            : { notHelpfulCount: increment(1) };
          
          transaction.update(faqRef, updates);
        }
      });

      analyticsService.logEvent({
        name: 'faq_feedback',
        params: {
          faq_id: faqId,
          helpful: helpful,
        },
      });
    } catch (error) {
      console.error('Error marking FAQ helpful:', error);
      throw errorService.createAppError(error as Error, {
        code: 'FAQ_MARK_HELPFUL_FAILED',
        category: 'database',
        severity: 'low',
      });
    }
  }

  // Chat Support
  static async startChatSession(userInfo: ChatUserInfo, initialMessage?: string): Promise<string> {
    try {
      const chatSession: ChatSession = {
        id: '',
        userId: userInfo.id,
        userInfo,
        status: ChatStatus.WAITING,
        priority: 1,
        waitTime: 0,
        messages: [],
        tags: [],
        metadata: {
          source: 'widget',
          initialQuestion: initialMessage,
        },
        transferHistory: [],
        startedAt: Timestamp.now(),
        lastMessageAt: Timestamp.now(),
      };

      const sessionRef = await addDoc(collection(db, 'chatSessions'), chatSession);
      chatSession.id = sessionRef.id;
      
      // Update session with its ID
      await updateDoc(sessionRef, { id: sessionRef.id });

      // Add initial message if provided
      if (initialMessage) {
        await this.sendChatMessage(sessionRef.id, initialMessage, userInfo);
      }

      // Try to auto-assign to available agent
      await this.autoAssignChat(sessionRef.id);

      analyticsService.logEvent({
        name: 'chat_session_started',
        params: {
          session_id: sessionRef.id,
          user_id: userInfo.id || 'anonymous',
          has_initial_message: !!initialMessage,
        },
      });

      return sessionRef.id;
    } catch (error) {
      console.error('Error starting chat session:', error);
      throw errorService.createAppError(error as Error, {
        code: 'CHAT_SESSION_START_FAILED',
        category: 'business_logic',
        severity: 'medium',
      });
    }
  }

  static async sendChatMessage(sessionId: string, content: string, userInfo: ChatUserInfo): Promise<string> {
    try {
      const author: MessageAuthor = {
        id: userInfo.id || 'anonymous',
        name: userInfo.name || 'Misafir',
        email: userInfo.email || '',
        role: 'customer',
      };

      const message: ChatMessage = {
        id: '',
        sessionId,
        author,
        content,
        type: ChatMessageType.TEXT,
        attachments: [],
        isRead: false,
        sentAt: Timestamp.now(),
      };

      const messageRef = await addDoc(collection(db, 'chatMessages'), message);
      message.id = messageRef.id;
      
      // Update message with its ID
      await updateDoc(messageRef, { id: messageRef.id });

      // Update session's last message time
      await updateDoc(doc(db, 'chatSessions', sessionId), {
        lastMessageAt: serverTimestamp(),
      });

      analyticsService.logEvent({
        name: 'chat_message_sent',
        params: {
          session_id: sessionId,
          message_type: ChatMessageType.TEXT,
          author_role: 'customer',
        },
      });

      return messageRef.id;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw errorService.createAppError(error as Error, {
        code: 'CHAT_MESSAGE_SEND_FAILED',
        category: 'business_logic',
        severity: 'medium',
      });
    }
  }

  private static async autoAssignChat(sessionId: string): Promise<void> {
    try {
      const availableAgents = await this.getAvailableChatAgents();
      
      if (availableAgents.length === 0) {
        return; // No available agents, chat will remain in queue
      }

      const selectedAgent = availableAgents[0]; // Simple assignment
      
      await this.assignChatToAgent(sessionId, selectedAgent.id);
    } catch (error) {
      console.error('Error auto-assigning chat:', error);
      // Don't throw error - assignment failure shouldn't break chat creation
    }
  }

  private static async getAvailableChatAgents(): Promise<SupportAgent[]> {
    try {
      const agentsQuery = query(
        collection(db, 'supportAgents'),
        where('isActive', '==', true),
        where('availability.status', '==', 'online'),
        where('availability.autoAssign', '==', true)
      );
      
      const agentDocs = await getDocs(agentsQuery);
      const agents = agentDocs.docs.map(doc => doc.data() as SupportAgent);
      
      // Filter by chat capacity
      return agents.filter(agent => 
        agent.availability.currentCapacity < agent.availability.maxCapacity
      );
    } catch (error) {
      console.error('Error getting available chat agents:', error);
      return [];
    }
  }

  private static async assignChatToAgent(sessionId: string, agentId: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const sessionRef = doc(db, 'chatSessions', sessionId);
        const agentRef = doc(db, 'supportAgents', agentId);
        
        const [sessionDoc, agentDoc] = await Promise.all([
          transaction.get(sessionRef),
          transaction.get(agentRef)
        ]);
        
        if (!sessionDoc.exists() || !agentDoc.exists()) {
          throw new Error('Chat session or agent not found');
        }

        const agent = agentDoc.data() as SupportAgent;
        
        transaction.update(sessionRef, {
          agentId,
          agentInfo: agent,
          status: ChatStatus.ACTIVE,
          firstResponseAt: serverTimestamp(),
        });

        transaction.update(agentRef, {
          'availability.currentCapacity': increment(1),
        });
      });
    } catch (error) {
      console.error('Error assigning chat to agent:', error);
      throw error;
    }
  }

  // Notifications
  private static async sendTicketNotification(ticket: SupportTicket, event: 'created' | 'updated' | 'resolved'): Promise<void> {
    try {
      // This would integrate with the email service
      console.log(`Sending ticket notification: ${event}`, ticket.ticketNumber);
      
      // Implementation would depend on email service integration
      // await EmailService.sendTicketNotification(ticket, event);
    } catch (error) {
      console.error('Error sending ticket notification:', error);
      // Don't throw - notification failure shouldn't break main operation
    }
  }

  private static async sendMessageNotification(ticket: SupportTicket, message: TicketMessage): Promise<void> {
    try {
      // Send notification to appropriate party
      if (message.author.role === 'customer' && ticket.assignedTo) {
        // Notify assigned agent
        console.log(`Notifying agent ${ticket.assignedTo} of new message in ticket ${ticket.ticketNumber}`);
      } else if (message.author.role === 'agent' && ticket.userId) {
        // Notify customer
        console.log(`Notifying customer ${ticket.userId} of new message in ticket ${ticket.ticketNumber}`);
      }
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  }

  // Real-time subscriptions
  static subscribeToTicket(ticketId: string, callback: (ticket: SupportTicket | null) => void): () => void {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    
    const unsubscribe = onSnapshot(ticketRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as SupportTicket);
      } else {
        callback(null);
      }
    });
    
    return unsubscribe;
  }

  static subscribeToTicketMessages(ticketId: string, callback: (messages: TicketMessage[]) => void): () => void {
    const messagesQuery = query(
      collection(db, 'ticketMessages'),
      where('ticketId', '==', ticketId),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => doc.data() as TicketMessage);
      callback(messages);
    });
    
    return unsubscribe;
  }

  static subscribeToUserTickets(userId: string, callback: (tickets: SupportTicket[]) => void): () => void {
    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );
    
    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const tickets = snapshot.docs.map(doc => doc.data() as SupportTicket);
      callback(tickets);
    });
    
    return unsubscribe;
  }

  // Customer satisfaction
  static async submitSatisfactionRating(ticketId: string, rating: number, feedback?: string): Promise<void> {
    try {
      const satisfaction: CustomerSatisfaction = {
        rating,
        feedback,
        submittedAt: Timestamp.now(),
        followUpRequested: rating <= 3, // Request follow-up for poor ratings
      };

      await updateDoc(doc(db, 'supportTickets', ticketId), {
        satisfaction,
        updatedAt: serverTimestamp(),
      });

      analyticsService.logEvent({
        name: 'support_satisfaction_submitted',
        params: {
          ticket_id: ticketId,
          rating,
          has_feedback: !!feedback,
        },
      });
    } catch (error) {
      console.error('Error submitting satisfaction rating:', error);
      throw errorService.createAppError(error as Error, {
        code: 'SATISFACTION_SUBMIT_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  // Basic metrics (would be more complex in production)
  static async getSupportMetrics(period: MetricsPeriod): Promise<Partial<SupportMetrics>> {
    try {
      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('createdAt', '>=', period.start),
        where('createdAt', '<=', period.end)
      );
      
      const ticketDocs = await getDocs(ticketsQuery);
      const tickets = ticketDocs.docs.map(doc => doc.data() as SupportTicket);
      
      const metrics = {
        period,
        tickets: {
          total: tickets.length,
          new: tickets.filter(t => t.status === TicketStatus.NEW).length,
          resolved: tickets.filter(t => t.status === TicketStatus.RESOLVED).length,
          closed: tickets.filter(t => t.status === TicketStatus.CLOSED).length,
          escalated: tickets.filter(t => t.status === TicketStatus.ESCALATED).length,
          byCategory: this.calculateCategoryMetrics(tickets),
          byPriority: this.calculatePriorityMetrics(tickets),
          bySource: this.calculateSourceMetrics(tickets),
          averageResponseTime: this.calculateAverageResponseTime(tickets),
          averageResolutionTime: this.calculateAverageResolutionTime(tickets),
          firstContactResolution: this.calculateFirstContactResolution(tickets),
          backlog: tickets.filter(t => [TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.IN_PROGRESS].includes(t.status)).length,
          slaCompliance: 85, // Would calculate from SLA data
        },
        // Other metrics would be calculated similarly
      };
      
      return metrics;
    } catch (error) {
      console.error('Error getting support metrics:', error);
      throw errorService.createAppError(error as Error, {
        code: 'SUPPORT_METRICS_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  private static calculateCategoryMetrics(tickets: SupportTicket[]): any[] {
    const categoryGroups = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryGroups).map(([category, count]) => ({
      category,
      count,
      percentage: (count / tickets.length) * 100,
      avgResolutionTime: 0, // Would calculate actual resolution time
    }));
  }

  private static calculatePriorityMetrics(tickets: SupportTicket[]): any[] {
    const priorityGroups = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(priorityGroups).map(([priority, count]) => ({
      priority,
      count,
      percentage: (count / tickets.length) * 100,
      avgResolutionTime: 0,
    }));
  }

  private static calculateSourceMetrics(tickets: SupportTicket[]): any[] {
    const sourceGroups = tickets.reduce((acc, ticket) => {
      acc[ticket.source] = (acc[ticket.source] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(sourceGroups).map(([source, count]) => ({
      source,
      count,
      percentage: (count / tickets.length) * 100,
    }));
  }

  private static calculateAverageResponseTime(tickets: SupportTicket[]): number {
    const responseTimes = tickets
      .filter(t => t.firstResponseAt && t.createdAt)
      .map(t => (t.firstResponseAt!.toMillis() - t.createdAt.toMillis()) / (1000 * 60)); // minutes
    
    return responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
  }

  private static calculateAverageResolutionTime(tickets: SupportTicket[]): number {
    const resolutionTimes = tickets
      .filter(t => t.resolvedAt && t.createdAt)
      .map(t => (t.resolvedAt!.toMillis() - t.createdAt.toMillis()) / (1000 * 60)); // minutes
    
    return resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length 
      : 0;
  }

  private static calculateFirstContactResolution(tickets: SupportTicket[]): number {
    const resolvedTickets = tickets.filter(t => t.status === TicketStatus.RESOLVED);
    const firstContactResolutions = resolvedTickets.filter(t => t.messages.length <= 2); // Initial message + resolution
    
    return resolvedTickets.length > 0 
      ? (firstContactResolutions.length / resolvedTickets.length) * 100 
      : 0;
  }
}

export default SupportService;
