'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Download, 
  Search, 
  Filter,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  Eye
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface PaymentItem {
  id: string;
  bookingId: string;
  tourTitle: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: {
    type: 'card' | 'bank_transfer' | 'wallet';
    last4?: string;
    brand?: string;
  };
  transactionId: string;
  date: string;
  description?: string;
  refundAmount?: number;
  refundReason?: string;
  invoiceUrl?: string;
}

export function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    loadPayments();
  }, [user]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // TODO: Fetch actual payments from Firestore
      // TODO: Load real payment history from Firestore
      const payments: PaymentItem[] = [
        {
          id: '1',
          bookingId: 'booking-001',
          tourTitle: 'Kapadokya Balon Turu',
          amount: 850,
          currency: 'TRY',
          status: 'completed',
          paymentMethod: {
            type: 'card',
            last4: '4242',
            brand: 'visa',
          },
          transactionId: 'TXN_240420_001',
          date: '2024-04-20T10:30:00Z',
          description: 'Kapadokya Balon Turu rezervasyonu için ödeme',
          invoiceUrl: '/invoices/INV_240420_001.pdf',
        },
        {
          id: '2',
          bookingId: 'booking-002',
          tourTitle: 'Pamukkale Gün Batımı Turu',
          amount: 1200,
          currency: 'TRY',
          status: 'completed',
          paymentMethod: {
            type: 'card',
            last4: '1234',
            brand: 'mastercard',
          },
          transactionId: 'TXN_240415_002',
          date: '2024-04-15T14:15:00Z',
          description: 'Pamukkale Gün Batımı Turu rezervasyonu',
          invoiceUrl: '/invoices/INV_240415_002.pdf',
        },
        {
          id: '3',
          bookingId: 'booking-003',
          tourTitle: 'Efes Antik Kenti Rehberli Tur',
          amount: 680,
          currency: 'TRY',
          status: 'refunded',
          paymentMethod: {
            type: 'card',
            last4: '4242',
            brand: 'visa',
          },
          transactionId: 'TXN_240310_003',
          date: '2024-03-10T09:45:00Z',
          description: 'Efes Antik Kenti Rehberli Tur',
          refundAmount: 680,
          refundReason: 'Müşteri talebi',
          invoiceUrl: '/invoices/INV_240310_003.pdf',
        },
        {
          id: '4',
          bookingId: 'booking-004',
          tourTitle: 'Antalya Jeep Safari',
          amount: 450,
          currency: 'TRY',
          status: 'failed',
          paymentMethod: {
            type: 'card',
            last4: '9999',
            brand: 'visa',
          },
          transactionId: 'TXN_240305_004',
          date: '2024-03-05T16:20:00Z',
          description: 'Antalya Jeep Safari rezervasyonu - Ödeme başarısız',
        },
        {
          id: '5',
          bookingId: 'booking-005',
          tourTitle: 'İstanbul Boğaz Turu',
          amount: 380,
          currency: 'TRY',
          status: 'pending',
          paymentMethod: {
            type: 'bank_transfer',
          },
          transactionId: 'TXN_240425_005',
          date: '2024-04-25T11:00:00Z',
          description: 'İstanbul Boğaz Turu - Banka havalesi ile ödeme',
        },
      ];
      
      // TODO: Load from Firestore
      setPayments([]);
    } catch (error) {
      toast.error('Ödeme geçmişi yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: PaymentItem['status']) => {
    const configs = {
      pending: {
        label: 'Beklemede',
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800',
        variant: 'outline' as const,
      },
      completed: {
        label: 'Tamamlandı',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
        variant: 'secondary' as const,
      },
      failed: {
        label: 'Başarısız',
        icon: XCircle,
        color: 'bg-red-100 text-red-800',
        variant: 'destructive' as const,
      },
      refunded: {
        label: 'İade Edildi',
        icon: RefreshCw,
        color: 'bg-blue-100 text-blue-800',
        variant: 'outline' as const,
      },
      cancelled: {
        label: 'İptal Edildi',
        icon: XCircle,
        color: 'bg-gray-100 text-gray-800',
        variant: 'outline' as const,
      },
    };
    return configs[status];
  };

  const getPaymentMethodIcon = (type: string, brand?: string) => {
    if (type === 'card') {
      switch (brand) {
        case 'visa':
          return '💳 Visa';
        case 'mastercard':
          return '💳 Mastercard';
        case 'troy':
          return '💳 Troy';
        default:
          return '💳 Kart';
      }
    } else if (type === 'bank_transfer') {
      return '🏦 Banka Havalesi';
    } else if (type === 'wallet') {
      return '👛 Dijital Cüzdan';
    }
    return '💳';
  };

  const filteredPayments = payments
    .filter(payment => {
      const matchesSearch = payment.tourTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const paymentDate = new Date(payment.date);
        const now = new Date();
        
        switch (dateFilter) {
          case 'last_7_days':
            matchesDate = paymentDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last_30_days':
            matchesDate = paymentDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'last_90_days':
            matchesDate = paymentDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'this_year':
            matchesDate = paymentDate.getFullYear() === now.getFullYear();
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

  const paymentsSummary = {
    total: payments.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0),
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    refunded: payments.filter(p => p.status === 'refunded').length,
    failed: payments.filter(p => p.status === 'failed').length,
  };

  const handleDownloadInvoice = async (payment: PaymentItem) => {
    try {
      if (payment.invoiceUrl) {
        // TODO: Download invoice
        toast.success('Fatura indiriliyor...');
      } else {
        toast.error('Fatura bulunamadı.');
      }
    } catch (error) {
      toast.error('Fatura indirilemedi.');
    }
  };

  const handleRequestRefund = async (paymentId: string) => {
    try {
      // TODO: Request refund
      toast.success('İade talebi oluşturuldu.');
    } catch (error) {
      toast.error('İade talebi oluşturulamadı.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Ödeme Geçmişi</h2>
          <p className="text-muted-foreground">Tüm ödemelerinizi görüntüleyin ve yönetin</p>
        </div>
        <Button onClick={loadPayments} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Harcama</p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(paymentsSummary.total, 'TRY')}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Başarılı Ödeme</p>
                <p className="text-2xl font-bold text-green-600">{paymentsSummary.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bekleyen Ödeme</p>
                <p className="text-2xl font-bold text-yellow-600">{paymentsSummary.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">İade Edilen</p>
                <p className="text-2xl font-bold text-blue-600">{paymentsSummary.refunded}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tur adı veya işlem numarası ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="refunded">İade Edildi</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tarih filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Zamanlar</SelectItem>
                <SelectItem value="last_7_days">Son 7 Gün</SelectItem>
                <SelectItem value="last_30_days">Son 30 Gün</SelectItem>
                <SelectItem value="last_90_days">Son 90 Gün</SelectItem>
                <SelectItem value="this_year">Bu Yıl</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Tarihe Göre (Yeni)</SelectItem>
                <SelectItem value="date_asc">Tarihe Göre (Eski)</SelectItem>
                <SelectItem value="amount_desc">Tutara Göre (Yüksek)</SelectItem>
                <SelectItem value="amount_asc">Tutara Göre (Düşük)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ödeme bulunamadı</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Arama kriterlerinize uygun ödeme bulunamadı.'
                : 'Henüz hiç ödeme yapmamışsınız.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{payment.tourTitle}</h3>
                      <Badge className={getStatusConfig(payment.status).color}>
                        {getStatusConfig(payment.status).label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">İşlem ID:</span> {payment.transactionId}
                      </div>
                      <div>
                        <span className="font-medium">Tarih:</span> {formatDate(payment.date)}
                      </div>
                      <div>
                        <span className="font-medium">Ödeme Yöntemi:</span> {getPaymentMethodIcon(payment.paymentMethod.type, payment.paymentMethod.brand)}
                        {payment.paymentMethod.last4 && ` ••••${payment.paymentMethod.last4}`}
                      </div>
                      <div>
                        <span className="font-medium">Tutar:</span> 
                        <span className="font-bold text-primary ml-1">
                          {formatPrice(payment.amount, payment.currency)}
                        </span>
                      </div>
                    </div>

                    {payment.description && (
                      <p className="text-sm text-muted-foreground">{payment.description}</p>
                    )}

                    {payment.status === 'refunded' && payment.refundAmount && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>İade Edildi:</strong> {formatPrice(payment.refundAmount, payment.currency)}
                          {payment.refundReason && ` - ${payment.refundReason}`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Detay
                    </Button>

                    {payment.invoiceUrl && payment.status === 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadInvoice(payment)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Fatura
                      </Button>
                    )}

                    {payment.status === 'completed' && !payment.refundAmount && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRequestRefund(payment.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        İade Talep Et
                      </Button>
                    )}

                    {payment.status === 'failed' && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tekrar Dene
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
