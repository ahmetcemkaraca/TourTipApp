'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Send,
  Clock,
  User
} from 'lucide-react';
import { AppError, ErrorInfo, FeedbackType } from '@/types/error';
import ErrorService from '@/lib/error-service';
import { useToast } from '@/hooks/use-toast';

interface ErrorFallbackProps {
  error: AppError | null;
  errorInfo?: ErrorInfo | null;
  resetError: () => void;
  retryAction?: () => void;
  reloadAction?: () => void;
  goHomeAction?: () => void;
  retryCount?: number;
  lastRetry?: Date | null;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  retryAction,
  reloadAction,
  goHomeAction,
  retryCount = 0,
  lastRetry,
}) => {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  if (!error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Bilinmeyen Hata</h2>
            <p className="text-gray-600 mb-4">Beklenmeyen bir hata oluştu.</p>
            <Button onClick={resetError}>Tekrar Dene</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'network': return '🌐';
      case 'authentication': return '🔐';
      case 'validation': return '✅';
      case 'payment': return '💳';
      case 'business_logic': return '📋';
      default: return '⚠️';
    }
  };

  const handleCopyError = async () => {
    const errorDetails = {
      id: error.id,
      code: error.code,
      message: error.message,
      category: error.category,
      severity: error.severity,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      toast.success('Hata detayları panoya kopyalandı');
    } catch (err) {
      toast.error('Kopyalama başarısız');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error('Lütfen geri bildirim yazın');
      return;
    }

    setSubmittingFeedback(true);
    try {
      await ErrorService.submitUserFeedback(
        error.id,
        FeedbackType.BUG_REPORT,
        feedback,
        error.userId,
        contactEmail || undefined
      );
      
      toast.success('Geri bildiriminiz başarıyla gönderildi');
      setShowFeedback(false);
      setFeedback('');
      setContactEmail('');
    } catch (err) {
      toast.error('Geri bildirim gönderilemedi');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600">Ups! Bir Hata Oluştu</CardTitle>
          <p className="text-gray-600 mt-2">
            {error.userMessage || 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCategoryIcon(error.category)}</span>
                <span className="font-medium capitalize">{error.category.replace('_', ' ')}</span>
              </div>
              <Badge className={getSeverityColor(error.severity)}>
                {error.severity.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Hata Kodu:</span>
                <p className="font-mono font-medium">{error.code}</p>
              </div>
              <div>
                <span className="text-gray-600">Zaman:</span>
                <p className="font-medium">{formatTimestamp(error.timestamp)}</p>
              </div>
            </div>

            {retryCount > 0 && (
              <div className="mt-3 p-2 bg-blue-50 rounded flex items-center gap-2 text-sm text-blue-700">
                <RefreshCw className="h-4 w-4" />
                <span>{retryCount} kez denendi</span>
                {lastRetry && (
                  <span className="text-blue-600">
                    (Son: {formatTimestamp(lastRetry)})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {retryAction && (
              <Button onClick={retryAction} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Tekrar Dene
              </Button>
            )}
            
            {reloadAction && (
              <Button onClick={reloadAction} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Sayfayı Yenile
              </Button>
            )}
            
            {goHomeAction && (
              <Button onClick={goHomeAction} variant="outline" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Ana Sayfaya Dön
              </Button>
            )}
          </div>

          {/* Technical Details */}
          <div className="border-t pt-4">
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Teknik Detaylar
              </span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showDetails && (
              <div className="mt-4 space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Hata ID</span>
                    <Button onClick={handleCopyError} size="sm" variant="ghost">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-mono text-xs text-gray-700">{error.id}</p>
                </div>

                {error.context && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <span className="font-medium text-sm block mb-2">Bağlam</span>
                    <div className="text-xs space-y-1">
                      {error.context.component && (
                        <div><span className="text-gray-600">Bileşen:</span> {error.context.component}</div>
                      )}
                      {error.context.function && (
                        <div><span className="text-gray-600">Fonksiyon:</span> {error.context.function}</div>
                      )}
                      {error.context.route && (
                        <div><span className="text-gray-600">Sayfa:</span> {error.context.route}</div>
                      )}
                      {error.context.user_action && (
                        <div><span className="text-gray-600">Kullanıcı Eylemi:</span> {error.context.user_action}</div>
                      )}
                    </div>
                  </div>
                )}

                {error.message && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <span className="font-medium text-sm block mb-2">Hata Mesajı</span>
                    <p className="text-xs text-gray-700 font-mono">{error.message}</p>
                  </div>
                )}

                {error.stack && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <span className="font-medium text-sm block mb-2">Stack Trace</span>
                    <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Feedback */}
          <div className="border-t pt-4">
            <Button
              onClick={() => setShowFeedback(!showFeedback)}
              variant="ghost"
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Geri Bildirim Gönder
              </span>
              {showFeedback ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showFeedback && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bu hatayı nasıl çözelim? (İsteğe bağlı)
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Hatayı nasıl aldığınızı ve ne beklediğinizi açıklayın..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    İletişim E-postası (İsteğe bağlı)
                  </label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <Button
                  onClick={handleSubmitFeedback}
                  disabled={submittingFeedback}
                  className="w-full"
                >
                  {submittingFeedback ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Geri Bildirim Gönder
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>Bu hata otomatik olarak raporlandı ve geliştiricilerimiz üzerinde çalışıyor.</p>
            <p>Sorununuz devam ederse lütfen destek ekibimizle iletişime geçin.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorFallback;
