'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Download, 
  Mail, 
  Calendar, 
  MapPin, 
  Users,
  Phone,
  Clock,
  CreditCard,
  Home
} from 'lucide-react';
import { paymentService } from '@/lib/payment-service';
import { toast } from 'sonner';

export function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const paymentIntentId = searchParams.get('payment_intent');
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    const loadPaymentDetails = async () => {
      if (!paymentIntentId) {
        toast.error('Ödeme bilgileri bulunamadı.');
        router.push('/');
        return;
      }

      try {
        const details = await paymentService.getPaymentStatus(paymentIntentId);
        setPaymentDetails(details);

        if (redirectStatus === 'succeeded') {
          toast.success('Ödemeniz başarıyla tamamlandı!');
        } else if (redirectStatus === 'failed') {
          toast.error('Ödeme işlemi başarısız oldu.');
          router.push('/checkout');
          return;
        }
      } catch (error) {
        console.error('Error loading payment details:', error);
        toast.error('Ödeme detayları yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentDetails();
  }, [paymentIntentId, redirectStatus, router]);

  const formatPrice = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Rezervasyon Bulunamadı</h2>
            <p className="text-muted-foreground mb-6">
              İlgili rezervasyon bilgileri bulunamadı.
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold mb-2">
                🎉 Rezervasyonunuz Onaylandı!
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Ödemeniz başarıyla alındı ve rezervasyonunuz doğrulandı.
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge variant="secondary" className="text-sm">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Ödeme Tamamlandı
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  <Mail className="w-4 h-4 mr-1" />
                  E-posta Gönderildi
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  Rezervasyon Aktif
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Ödeme Detayları
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ödeme ID:</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {paymentIntentId?.slice(-12)}
                    </code>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ödeme Tarihi:</span>
                    <span>{formatDate(paymentDetails.createdAt)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ödeme Yöntemi:</span>
                    <span className="capitalize">
                      {paymentDetails.paymentMethod?.brand || 'Kart'} •••• {paymentDetails.paymentMethod?.last4 || '****'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durum:</span>
                    <Badge variant="default" className="text-green-700 bg-green-100">
                      ✓ Başarılı
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Toplam Ödenen:</span>
                    <span className="text-primary">
                      {formatPrice(paymentDetails.amount, paymentDetails.currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Sıradaki Adımlar
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium">Onay E-postanızı Kontrol Edin</h3>
                      <p className="text-sm text-muted-foreground">
                        Rezervasyon detaylarınız e-posta adresinize gönderildi.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium">Tur Gününde Hazır Olun</h3>
                      <p className="text-sm text-muted-foreground">
                        Belirlenen saatte buluşma noktasında olunuz.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium">Deneyiminizi Paylaşın</h3>
                      <p className="text-sm text-muted-foreground">
                        Tur sonrası değerlendirmenizi yapmayı unutmayın.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                İletişim ve Destek
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium mb-1">Telefon Desteği</h3>
                  <p className="text-sm text-muted-foreground">+90 (212) 555 0123</p>
                  <p className="text-xs text-muted-foreground">7/24 Destek</p>
                </div>
                
                <div className="text-center">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium mb-1">E-posta Desteği</h3>
                  <p className="text-sm text-muted-foreground">destek@tourtrip.app</p>
                  <p className="text-xs text-muted-foreground">2 saat içinde yanıt</p>
                </div>
                
                <div className="text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium mb-1">WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">+90 (555) 123 4567</p>
                  <p className="text-xs text-muted-foreground">Anında yanıt</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Button onClick={() => router.push('/dashboard/bookings')} size="lg">
              <Calendar className="mr-2 h-5 w-5" />
              Rezervasyonlarım
            </Button>
            
            <Button variant="outline" onClick={() => router.push('/tours')} size="lg">
              <MapPin className="mr-2 h-5 w-5" />
              Yeni Tur Keşfet
            </Button>
            
            <Button variant="outline" onClick={() => router.push('/')} size="lg">
              <Home className="mr-2 h-5 w-5" />
              Ana Sayfa
            </Button>
          </div>

          {/* Additional Information */}
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-medium mb-2 text-blue-900">💡 İpucu</h3>
              <p className="text-sm text-blue-800">
                Rezervasyonunuzla ilgili herhangi bir değişiklik veya iptal işlemi için 
                <strong> en az 24 saat önceden </strong> 
                bizimle iletişime geçmeniz gerekmektedir. Hesabınızdan rezervasyon detaylarınızı 
                görüntüleyebilir ve gerekli işlemleri yapabilirsiniz.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
