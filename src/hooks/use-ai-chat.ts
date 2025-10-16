'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiService, AiChatMessage, AiSuggestion } from '@/lib/ai-service';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface UseAiChatOptions {
  sessionId?: string;
  autoSave?: boolean;
  maxMessages?: number;
}

interface UseAiChatReturn {
  messages: AiChatMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
  suggestions: AiSuggestion[];
  context: any;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  rateLimitRemaining: number;
  retryLastMessage: () => Promise<void>;
}

export function useAiChat(options: UseAiChatOptions = {}): UseAiChatReturn {
  const { user } = useAuth();
  const {
    sessionId: providedSessionId,
    autoSave = true,
    maxMessages = 100,
  } = options;

  const [sessionId] = useState(() => 
    providedSessionId || aiService.generateSessionId()
  );
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [context, setContext] = useState<any>({});
  const [rateLimitRemaining, setRateLimitRemaining] = useState(10);
  const [lastMessage, setLastMessage] = useState<string>('');

  // Load chat history on mount
  useEffect(() => {
    if (user && autoSave) {
      loadChatHistory();
    }
  }, [user, sessionId, autoSave]);

  // Subscribe to real-time messages if autoSave is enabled
  useEffect(() => {
    if (user && autoSave) {
      const unsubscribe = aiService.subscribeToChatMessages(sessionId, (newMessages) => {
        setMessages(newMessages.slice(-maxMessages));
      });

      return unsubscribe;
    }
  }, [user, sessionId, autoSave, maxMessages]);

  const loadChatHistory = async () => {
    try {
      const history = await aiService.getChatHistory(sessionId);
      setMessages(history.slice(-maxMessages));
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    if (rateLimitRemaining <= 0) {
      toast.error('Çok fazla mesaj gönderdiniz. Lütfen biraz bekleyin.');
      return;
    }

    setLastMessage(message);
    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: AiChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
      sessionId,
      userId: user?.uid,
    };

    setMessages(prev => [...prev, userMessage]);

    // Add loading message
    const loadingMessage: AiChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      sessionId,
      loading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Send to AI service
      const response = await aiService.sendMessage(message, sessionId, context);
      
      // Remove loading message and add AI response
      setMessages(prev => 
        prev.filter(msg => !msg.loading).concat([
          userMessage,
          response.message,
        ]).slice(-maxMessages)
      );

      setSuggestions(response.suggestions);
      setContext(response.context);
      setRateLimitRemaining(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      
      // Remove loading message and show error
      setMessages(prev => prev.filter(msg => !msg.loading));
      
      toast.error('AI asistanı ile bağlantı kurulamadı.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, rateLimitRemaining, sessionId, context, user, maxMessages]);

  const retryLastMessage = useCallback(async () => {
    if (lastMessage) {
      await sendMessage(lastMessage);
    }
  }, [lastMessage, sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSuggestions([]);
    setContext({});
    setError(null);
    setRateLimitRemaining(10);
  }, []);

  // Reset rate limit every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitRemaining(prev => Math.min(10, prev + 1));
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    suggestions,
    context,
    sendMessage,
    clearChat,
    rateLimitRemaining,
    retryLastMessage,
  };
}

export function useAiSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback(async (
    tripId?: string, 
    suggestionType?: string
  ) => {
    if (!user) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await aiService.generateSuggestions(tripId, suggestionType);
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setError('Öneriler oluşturulamadı.');
      toast.error('AI önerileri oluşturulamadı.');
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const applySuggestion = useCallback(async (suggestionId: string) => {
    try {
      await aiService.applySuggestion(suggestionId);
      setSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...s, applied: true } : s)
      );
      toast.success('Öneri uygulandı!');
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast.error('Öneri uygulanamadı.');
    }
  }, []);

  const submitFeedback = useCallback(async (
    suggestionId: string,
    feedback: string,
    rating: number
  ) => {
    try {
      await aiService.submitFeedback(suggestionId, feedback, rating);
      toast.success('Geri bildiriminiz kaydedildi!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Geri bildirim gönderilemedi.');
    }
  }, []);

  return {
    suggestions,
    isGenerating,
    error,
    generateSuggestions,
    applySuggestion,
    submitFeedback,
  };
}

export function useAiAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalChats: 0,
    appliedSuggestions: 0,
    averageRating: 0,
    topIntents: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const data = await aiService.getAnalytics(user.uid);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    isLoading,
    refresh: loadAnalytics,
  };
}



