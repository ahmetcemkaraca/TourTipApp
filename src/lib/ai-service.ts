import { httpsCallable, getFunctions } from 'firebase/functions';
import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { db, functions } from './firebase';

export interface AiChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  context?: any;
  loading?: boolean;
  rating?: 'positive' | 'negative' | null;
}

export interface AiSuggestion {
  id?: string;
  type: 'tour' | 'activity' | 'restaurant' | 'route' | 'budget';
  title: string;
  description: string;
  confidence: number;
  metadata: any;
  applied?: boolean;
  appliedAt?: Date;
}

export interface AiContext {
  userId: string;
  preferences: {
    preferredCategories: string[];
    budgetRange: 'budget' | 'moderate' | 'luxury';
    travelStyle: string;
  };
  lastBooking?: any;
  conversationHistory: string[];
  updatedAt: Date;
}

class AiService {
  private functions = getFunctions();
  
  /**
   * Send a message to AI and get response
   */
  async sendMessage(
    message: string, 
    sessionId: string, 
    context?: any
  ): Promise<{
    message: AiChatMessage;
    suggestions: AiSuggestion[];
    context: any;
  }> {
    const processAiChatMessage = httpsCallable(this.functions, 'processAiChatMessage');
    
    try {
      const result = await processAiChatMessage({
        message,
        sessionId,
        context,
      });
      
      return result.data as {
        message: AiChatMessage;
        suggestions: AiSuggestion[];
        context: any;
      };
    } catch (error) {
      console.error('Error sending AI message:', error);
      throw new Error('Failed to send message to AI');
    }
  }

  /**
   * Generate AI suggestions for a trip
   */
  async generateSuggestions(
    tripId?: string, 
    suggestionType?: string
  ): Promise<{ suggestions: AiSuggestion[] }> {
    const generateAiSuggestions = httpsCallable(this.functions, 'generateAiSuggestions');
    
    try {
      const result = await generateAiSuggestions({
        tripId,
        suggestionType,
      });
      
      return result.data as { suggestions: AiSuggestion[] };
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      throw new Error('Failed to generate suggestions');
    }
  }

  /**
   * Submit feedback on AI suggestions
   */
  async submitFeedback(
    suggestionId: string,
    feedback: string,
    rating: number
  ): Promise<void> {
    const processAiFeedback = httpsCallable(this.functions, 'processAiFeedback');
    
    try {
      await processAiFeedback({
        suggestionId,
        feedback,
        rating,
      });
    } catch (error) {
      console.error('Error submitting AI feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  /**
   * Get chat history for a session
   */
  async getChatHistory(sessionId: string): Promise<AiChatMessage[]> {
    try {
      const messagesRef = collection(db, 'ai_chats', sessionId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as AiChatMessage[];
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time chat messages
   */
  subscribeToChatMessages(
    sessionId: string,
    callback: (messages: AiChatMessage[]) => void
  ): () => void {
    const messagesRef = collection(db, 'ai_chats', sessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as AiChatMessage[];
      
      callback(messages);
    });
  }

  /**
   * Save chat message locally (for offline support)
   */
  async saveChatMessage(
    sessionId: string,
    message: Omit<AiChatMessage, 'id'>
  ): Promise<string> {
    try {
      const messagesRef = collection(db, 'ai_chats', sessionId, 'messages');
      const docRef = await addDoc(messagesRef, {
        ...message,
        timestamp: Timestamp.fromDate(message.timestamp),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw new Error('Failed to save message');
    }
  }

  /**
   * Get user's AI context and preferences
   */
  async getUserContext(userId: string): Promise<AiContext | null> {
    try {
      const contextRef = doc(db, 'ai_contexts', userId);
      const snapshot = await getDocs(query(collection(db, 'ai_contexts'), where('userId', '==', userId)));
      
      if (snapshot.empty) return null;
      
      const contextDoc = snapshot.docs[0];
      return {
        ...contextDoc.data(),
        updatedAt: contextDoc.data().updatedAt.toDate(),
      } as AiContext;
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  /**
   * Update user's AI context
   */
  async updateUserContext(
    userId: string,
    updates: Partial<AiContext>
  ): Promise<void> {
    try {
      const contextRef = doc(db, 'ai_contexts', userId);
      await addDoc(collection(db, 'ai_contexts'), {
        userId,
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error updating user context:', error);
      throw new Error('Failed to update context');
    }
  }

  /**
   * Get AI suggestions history
   */
  async getSuggestionsHistory(
    userId: string,
    limitCount: number = 20
  ): Promise<AiSuggestion[]> {
    try {
      const suggestionsRef = collection(db, 'ai_suggestions');
      const q = query(
        suggestionsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AiSuggestion[];
    } catch (error) {
      console.error('Error getting suggestions history:', error);
      return [];
    }
  }

  /**
   * Mark suggestion as applied
   */
  async applySuggestion(suggestionId: string): Promise<void> {
    try {
      const suggestionRef = doc(db, 'ai_suggestions', suggestionId);
      await addDoc(collection(db, 'ai_suggestions'), {
        applied: true,
        appliedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error applying suggestion:', error);
      throw new Error('Failed to apply suggestion');
    }
  }

  /**
   * Generate session ID for chat
   */
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format AI message for display
   */
  formatMessage(content: string): string {
    // Basic formatting - can be enhanced
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Extract intent from user message
   */
  extractIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('tur') || lowerMessage.includes('öneri')) {
      return 'tour_recommendation';
    }
    if (lowerMessage.includes('bütçe') || lowerMessage.includes('fiyat')) {
      return 'budget_help';
    }
    if (lowerMessage.includes('rota') || lowerMessage.includes('plan')) {
      return 'route_planning';
    }
    if (lowerMessage.includes('restoran') || lowerMessage.includes('yemek')) {
      return 'restaurant_recommendation';
    }
    if (lowerMessage.includes('otel') || lowerMessage.includes('konaklama')) {
      return 'accommodation_help';
    }
    
    return 'general';
  }

  /**
   * Get quick action suggestions based on context
   */
  getQuickActions(context?: any): string[] {
    const baseActions = [
      'Tur önerisi ver',
      'Bütçe hesapla',
      'Rota optimize et',
      'Restoran öner',
    ];

    if (context?.destination) {
      baseActions.unshift(`${context.destination} için plan öner`);
    }

    if (context?.budget) {
      baseActions.push(`${context.budget} TL bütçe ile ne yapabilirim?`);
    }

    return baseActions.slice(0, 6); // Limit to 6 actions
  }

  /**
   * Validate AI response for safety
   */
  validateResponse(content: string): boolean {
    // Basic content validation
    const forbiddenWords = [
      'illegal', 'dangerous', 'harmful', 'unsafe'
    ];
    
    const lowerContent = content.toLowerCase();
    return !forbiddenWords.some(word => lowerContent.includes(word));
  }

  /**
   * Get AI analytics data
   */
  async getAnalytics(userId: string): Promise<{
    totalChats: number;
    appliedSuggestions: number;
    averageRating: number;
    topIntents: { intent: string; count: number }[];
  }> {
    try {
      // Mock data - TODO: Implement real analytics queries
      return {
        totalChats: 47,
        appliedSuggestions: 23,
        averageRating: 4.6,
        topIntents: [
          { intent: 'tour_recommendation', count: 15 },
          { intent: 'budget_help', count: 12 },
          { intent: 'route_planning', count: 8 },
          { intent: 'restaurant_recommendation', count: 7 },
        ],
      };
    } catch (error) {
      console.error('Error getting AI analytics:', error);
      return {
        totalChats: 0,
        appliedSuggestions: 0,
        averageRating: 0,
        topIntents: [],
      };
    }
  }
}

export const aiService = new AiService();



