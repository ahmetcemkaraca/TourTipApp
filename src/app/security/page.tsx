'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  Activity,
  BarChart3,
  Settings,
  Bell,
  Key,
  Smartphone,
  Globe,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useSecurity, useSecurityAdmin, usePermissions } from '@/hooks/use-security';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function SecurityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    securityStatus, 
    isLoading, 
    error, 
    checkAccountSecurity,
    isAccountSecure,
    getSecurityScore,
    getSecurityRecommendations 
  } = useSecurity();
  
  const { isAdmin, dashboard, loading: dashboardLoading, loadDashboard } = useSecurityAdmin();
  const { hasPermission, checkPermission } = usePermissions();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  useEffect(() => {
    if (user) {
      checkAccountSecurity();
    }
  }, [user, checkAccountSecurity]);

  useEffect(() => {
    // Check permissions for different resources
    const checkPermissions = async () => {
      await checkPermission('security', 'read');
      await checkPermission('admin', 'read');
    };
    
    if (user) {
      checkPermissions();
    }
  }, [user, checkPermission]);

  const handleRefreshSecurity = () => {
    checkAccountSecurity();
    if (isAdmin) {
      loadDashboard();
    }
    toast.success('Güvenlik bilgileri yenilendi');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const securityScore = securityStatus ? getSecurityScore() : 0;
  const recommendations = securityStatus ? getSecurityRecommendations() : [];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Giriş Gerekli</h2>
            <p className="text-gray-600">Güvenlik ayarlarınızı görüntülemek için giriş yapın.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Güvenlik Merkezi</h1>
            <p className="text-gray-600">Hesap güvenliği ve aktivite izleme</p>
          </div>
        </div>
        <Button onClick={handleRefreshSecurity} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Score Overview */}
      {securityStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Güvenlik Skoru</p>
                  <p className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
                    {securityScore}/100
                  </p>
                </div>
                {isAccountSecure() ? (
                  <ShieldCheck className="h-8 w-8 text-green-500" />
                ) : (
                  <ShieldAlert className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hesap Durumu</p>
                  <p className={`text-lg font-semibold ${securityStatus.isLocked ? 'text-red-600' : 'text-green-600'}`}>
                    {securityStatus.isLocked ? 'Kilitli' : 'Aktif'}
                  </p>
                </div>
                {securityStatus.isLocked ? (
                  <Lock className="h-8 w-8 text-red-500" />
                ) : (
                  <Unlock className="h-8 w-8 text-green-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Başarısız Giriş</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {securityStatus.loginAttempts}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">2FA Durumu</p>
                  <p className={`text-lg font-semibold ${securityStatus.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {securityStatus.twoFactorEnabled ? 'Aktif' : 'Pasif'}
                  </p>
                </div>
                {securityStatus.twoFactorEnabled ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="activity">Aktivite</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          <TabsTrigger value="recommendations">Öneriler</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Yönetim</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Security Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Hesap Güvenliği
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Hesap Kilidi</span>
                  <Badge variant={securityStatus?.isLocked ? 'destructive' : 'default'}>
                    {securityStatus?.isLocked ? 'Kilitli' : 'Aktif'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>İki Faktörlü Doğrulama</span>
                  <Badge variant={securityStatus?.twoFactorEnabled ? 'default' : 'secondary'}>
                    {securityStatus?.twoFactorEnabled ? 'Etkin' : 'Pasif'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Şifre Yaşı</span>
                  <Badge variant={securityStatus && securityStatus.passwordAge > 90 ? 'destructive' : 'default'}>
                    {securityStatus?.passwordAge || 0} gün
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Şüpheli Aktivite</span>
                  <Badge variant={securityStatus && securityStatus.suspiciousActivityCount > 0 ? 'destructive' : 'default'}>
                    {securityStatus?.suspiciousActivityCount || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Login Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Son Giriş Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">IP Adresi:</span>
                    <div className="flex items-center gap-2">
                      {showSensitiveData ? (
                        <span className="font-mono text-sm">{securityStatus?.lastLoginIP || 'Bilinmiyor'}</span>
                      ) : (
                        <span className="font-mono text-sm">•••.•••.•••.•••</span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowSensitiveData(!showSensitiveData)}
                      >
                        {showSensitiveData ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Son Giriş:</span>
                    <span className="text-sm">
                      {securityStatus?.lastLoginAttempt ? formatDate(securityStatus.lastLoginAttempt) : 'Bilinmiyor'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Başarısız Deneme:</span>
                    <Badge variant={securityStatus && securityStatus.loginAttempts > 0 ? 'destructive' : 'default'}>
                      {securityStatus?.loginAttempts || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Score Details */}
          {securityStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Güvenlik Skoru Detayları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Genel Güvenlik Skoru</span>
                    <Badge variant={getScoreBadgeVariant(securityScore)}>
                      {securityScore}/100
                    </Badge>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        securityScore >= 80 ? 'bg-green-500' :
                        securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${securityScore}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {securityStatus.isLocked ? 0 : 25}
                      </div>
                      <div className="text-sm text-gray-600">Hesap Erişimi</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {securityStatus.twoFactorEnabled ? 20 : 0}
                      </div>
                      <div className="text-sm text-gray-600">2FA Koruması</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {securityStatus.passwordAge <= 90 ? 25 : 0}
                      </div>
                      <div className="text-sm text-gray-600">Şifre Güncelliği</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.max(0, 30 - (securityStatus.loginAttempts * 10) - (securityStatus.suspiciousActivityCount * 10))}
                      </div>
                      <div className="text-sm text-gray-600">Aktivite Güvenliği</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Güvenlik Aktiviteleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Aktivite geçmişi yükleniyor...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Bu özellik yakında aktif olacak
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Güvenlik Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">İki Faktörlü Doğrulama</h4>
                    <p className="text-sm text-gray-600">SMS veya authenticator app ile ek güvenlik</p>
                  </div>
                  <Button size="sm" variant="outline">
                    {securityStatus?.twoFactorEnabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Şifre Değiştir</h4>
                    <p className="text-sm text-gray-600">Güçlü şifre kullanın</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Değiştir
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Güvenlik Soruları</h4>
                    <p className="text-sm text-gray-600">Hesap kurtarma için güvenlik soruları</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Ayarla
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Oturum Yönetimi</h4>
                    <p className="text-sm text-gray-600">Aktif oturumları görüntüle ve yönet</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Yönet
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Bildirim Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Güvenlik Uyarıları</h4>
                    <p className="text-sm text-gray-600">Şüpheli aktivite bildirimleri</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Etkin
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Giriş Bildirimleri</h4>
                    <p className="text-sm text-gray-600">Yeni cihazdan giriş bildirimleri</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Etkin
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">E-posta Bildirimleri</h4>
                    <p className="text-sm text-gray-600">Güvenlik ile ilgili e-posta bildirimleri</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Etkin
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Güvenlik Önerileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="mt-1">
                        {recommendation.includes('kilitlenmiş') || recommendation.includes('şüpheli') ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : recommendation.includes('önerilir') || recommendation.includes('değiştirin') ? (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-gray-600">Şu anda herhangi bir güvenlik önerisi bulunmuyor.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Aktif Olaylar</p>
                      <p className="text-2xl font-bold text-red-600">
                        {dashboard?.activeIncidents || 0}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Kilitli Hesaplar</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {dashboard?.lockedAccounts || 0}
                      </p>
                    </div>
                    <Lock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Şüpheli Aktivite</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {dashboard?.suspiciousActivities || 0}
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Audit Logları</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {dashboard?.recentAudits?.length || 0}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {dashboard && dashboard.recentAudits && dashboard.recentAudits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Son Audit Logları</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboard.recentAudits.slice(0, 10).map((audit, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${audit.success ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="font-medium">{audit.action}</p>
                            <p className="text-sm text-gray-600">{audit.resource}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {audit.timestamp ? formatDate(audit.timestamp) : 'Bilinmiyor'}
                          </p>
                          <p className="text-xs text-gray-500">{audit.ipAddress}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Güvenlik Sistem Implementasyon Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Tamamlanan Özellikler</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Firestore Security Rules implementasyonu</li>
                <li>• Firebase Storage güvenlik kuralları</li>
                <li>• User authentication ve authorization</li>
                <li>• Role-based access control (RBAC)</li>
                <li>• Rate limiting ve DDoS koruması</li>
                <li>• Brute force attack detection</li>
                <li>• Suspicious activity monitoring</li>
                <li>• Audit trail logging</li>
                <li>• Security incident management</li>
                <li>• Account lockout mechanisms</li>
                <li>• Password strength validation</li>
                <li>• Data sanitization ve validation</li>
                <li>• Permission validation system</li>
                <li>• Security dashboard ve metrics</li>
                <li>• Automated security cleanup</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">🔄 Geliştirme Aşamasında</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Two-factor authentication (2FA)</li>
                <li>• Security questions setup</li>
                <li>• Session management</li>
                <li>• Device fingerprinting</li>
                <li>• IP geolocation tracking</li>
                <li>• Real-time threat detection</li>
                <li>• Security alerts ve notifications</li>
                <li>• CAPTCHA integration</li>
                <li>• Vulnerability scanning</li>
                <li>• Penetration testing automation</li>
                <li>• GDPR/KVKK compliance tools</li>
                <li>• Security training modules</li>
                <li>• Incident response automation</li>
                <li>• Threat intelligence integration</li>
                <li>• Security metrics ve reporting</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
