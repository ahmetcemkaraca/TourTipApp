'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  User, 
  Send, 
  Mic, 
  MicOff, 
  RefreshCw, 
  Settings, 
  MapPin, 
  Calendar, 
  DollarSign,
  Star,
  Loader2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface AiChatProps {
  currentTrip?: any;
  onSuggestionSelect?: (suggestion: any) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'tour' | 'activity' | 'route';
  metadata?: any;
  loading?: boolean;
  rating?: 'positive' | 'negative' | null;
}

interface AiSuggestion {
  id: string;
  type: 'tour' | 'activity' | 'restaurant' | 'route' | 'budget';
  title: string;
  description: string;
  location?: string;
  price?: number;
  rating?: number;
  image?: string;
  confidence: number;
}

// Mock AI responses - TODO: Replace with actual AI integration
// Mock responses removed - TODO: Implement real AI responses
const responses = {
  greeting: "Merhaba! TourTrip AI asistanınızım. Size nasıl yardımcı olabilirim? Gezi planlamanızda, tur önerilerinde, bütçe hesaplamalarında ve rota optimizasyonunda size destek olabilirim.",
  
  tours: "Size birkaç harika tur önerisi hazırladım! İstanbul'da tarihi yarımada turu, Kapadokya'da balon turu ve Antalya'da tekne turu en popüler seçenekler arasında. Hangi destinasyonla ilgileniyorsunuz?",
  
  budget: "Bütçenizi optimize etmenize yardımcı olabilirim. Ortalama günlük harcama limitiniz nedir? Konaklama, yemek ve aktiviteler için ayrı bütçeler önerebilirim.",
  
  route: "Rotanızı optimize etmek için aktivitelerinizin konumlarını analiz ettim. En verimli sıralamayı öneriyorum.",
};

export function AiChat({ currentTrip, onSuggestionSelect }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: mockResponses.greeting,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI processing
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };
    
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate AI response based on input
      const response = generateAiResponse(inputValue, currentTrip);
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, ...response, loading: false }
          : msg
      ));

      // Generate suggestions if applicable
      if (response.type === 'suggestion') {
        const newSuggestions = generateSuggestions(inputValue);
        setSuggestions(newSuggestions);
      }

    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { 
              ...msg, 
              content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
              loading: false 
            }
          : msg
      ));
      toast.error('AI asistanı ile bağlantı kurulamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAiResponse = (input: string, trip?: any): Partial<ChatMessage> => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('tur') || lowerInput.includes('öneri')) {
      return {
        content: mockResponses.tours,
        type: 'suggestion',
        metadata: { suggestionsType: 'tours' }
      };
    }
    
    if (lowerInput.includes('bütçe') || lowerInput.includes('fiyat')) {
      return {
        content: mockResponses.budget,
        type: 'suggestion',
        metadata: { suggestionsType: 'budget' }
      };
    }
    
    if (lowerInput.includes('rota') || lowerInput.includes('plan')) {
      return {
        content: mockResponses.route,
        type: 'suggestion',
        metadata: { suggestionsType: 'route' }
      };
    }

    // Default response
    return {
      content: "Sorunuzu anladım. Size en iyi önerileri sunmak için biraz daha detay verebilir misiniz? Hangi konuda yardıma ihtiyacınız var: tur önerileri, bütçe planlaması, rota optimizasyonu veya genel seyahat tavsiyeleri?",
      type: 'text'
    };
  };

  const generateSuggestions = (input: string): AiSuggestion[] => {
    // TODO: Load real AI suggestions
    const suggestions: AiSuggestion[] = [
      {
        id: '1',
        type: 'tour',
        title: 'İstanbul Tarihi Yarımada Turu',
        description: 'Sultanahmet Camii, Ayasofya ve Topkapı Sarayı ziyareti',
        location: 'İstanbul, Türkiye',
        price: 250,
        rating: 4.8,
        confidence: 95,
      },
      {
        id: '2',
        type: 'activity',
        title: 'Kapadokya Balon Turu',
        description: 'Güneş doğumunda büyüleyici balon deneyimi',
        location: 'Kapadokya, Türkiye',
        price: 450,
        rating: 4.9,
        confidence: 92,
      },
      {
        id: '3',
        type: 'restaurant',
        title: 'Pandeli Restaurant',
        description: 'Tarihi Mısır Çarşısı\'nda Osmanlı mutfağı',
        location: 'Eminönü, İstanbul',
        price: 120,
        rating: 4.6,
        confidence: 88,
      },
    ];

    return mockSuggestions;
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
      };
      recognition.start();
    } else {
      toast.error('Ses tanıma özelliği desteklenmiyor.');
    }
  };

  const handleMessageRating = (messageId: string, rating: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ));
    toast.success(rating === 'positive' ? 'Geri bildirim için teşekkürler!' : 'Geri bildiriminizi aldık, gelişim için çalışacağız.');
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Mesaj kopyalandı!');
  };

  const handleClearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: mockResponses.greeting,
      timestamp: new Date(),
      type: 'text',
    }]);
    setSuggestions([]);
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      {/* Chat Header */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              TourTrip AI Asistan
              <Badge variant="outline" className="ml-2">Beta</Badge>
            </CardTitle>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClearChat}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
                onRating={handleMessageRating}
                onCopy={handleCopyMessage}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="border-t p-4">
            <h4 className="font-medium mb-3">Önerilerim:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onSelect={() => {
                    onSuggestionSelect?.(suggestion);
                    toast.success('Öneri seçildi!');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder="AI asistanına sorunuzu yazın..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
                className="pr-12"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={handleVoiceInput}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <QuickActionButton text="Tur önerisi ver" onClick={() => setInputValue('Tur önerisi ver')} />
            <QuickActionButton text="Bütçe hesapla" onClick={() => setInputValue('Bütçe hesapla')} />
            <QuickActionButton text="Rota optimize et" onClick={() => setInputValue('Rota optimize et')} />
            <QuickActionButton text="Restoran öner" onClick={() => setInputValue('Restoran öner')} />
          </div>
        </div>
      </Card>
    </div>
  );
}

interface ChatMessageComponentProps {
  message: ChatMessage;
  onRating: (messageId: string, rating: 'positive' | 'negative') => void;
  onCopy: (content: string) => void;
}

function ChatMessageComponent({ message, onRating, onCopy }: ChatMessageComponentProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Bot className="h-4 w-4 text-blue-600" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div className={`rounded-lg p-3 ${
          isUser 
            ? 'bg-blue-600 text-white ml-auto' 
            : 'bg-muted'
        }`}>
          {message.loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Düşünüyorum...</span>
            </div>
          ) : (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span>{format(message.timestamp, 'HH:mm', { locale: tr })}</span>
          
          {!isUser && !message.loading && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onCopy(message.content)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${message.rating === 'positive' ? 'text-green-600' : ''}`}
                onClick={() => onRating(message.id, 'positive')}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${message.rating === 'negative' ? 'text-red-600' : ''}`}
                onClick={() => onRating(message.id, 'negative')}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: AiSuggestion;
  onSelect: () => void;
}

function SuggestionCard({ suggestion, onSelect }: SuggestionCardProps) {
  const getTypeIcon = (type: string) => {
    const icons = {
      tour: Star,
      activity: Calendar,
      restaurant: MapPin,
      route: MapPin,
      budget: DollarSign,
    };
    return icons[type as keyof typeof icons] || Star;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      tour: 'bg-blue-100 text-blue-800',
      activity: 'bg-green-100 text-green-800',
      restaurant: 'bg-orange-100 text-orange-800',
      route: 'bg-purple-100 text-purple-800',
      budget: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const TypeIcon = getTypeIcon(suggestion.type);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${getTypeColor(suggestion.type)}`}>
            <TypeIcon className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-1 mb-1">
              {suggestion.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {suggestion.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                {suggestion.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{suggestion.location}</span>
                  </div>
                )}
                {suggestion.price && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>₺{suggestion.price}</span>
                  </div>
                )}
              </div>
              
              {suggestion.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs">{suggestion.rating}</span>
                </div>
              )}
            </div>
            
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                %{suggestion.confidence} güven
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionButtonProps {
  text: string;
  onClick: () => void;
}

function QuickActionButton({ text, onClick }: QuickActionButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="text-xs"
    >
      {text}
    </Button>
  );
}
