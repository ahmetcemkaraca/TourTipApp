'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoyaltyDashboard from '@/components/loyalty/LoyaltyDashboard';
import { 
  Trophy, 
  Gift, 
  Star, 
  TrendingUp, 
  Users, 
  Award,
  Target,
  Calendar,
  Crown
} from 'lucide-react';

export default function LoyaltyPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">TourTrip Sadakat Programı</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Gezilerinizden puan kazanın, özel ödüller ve ayrıcalıklardan yararlanın. 
          Her rezervasyonunuz size daha fazla avantaj sağlasın!
        </p>
      </div>

      {/* Program Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Coins className="h-12 w-12 mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Puan Kazanın</h3>
            <p className="text-gray-600">
              Her rezervasyondan, yorumdan ve referanstan puan kazanın. 
              1 TL = 1 puan + seviye çarpanı!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Gift className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ödül Kullanın</h3>
            <p className="text-gray-600">
              Puanlarınızla indirim kuponu, ücretsiz tur ve özel deneyimler 
              satın alın.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Crown className="h-12 w-12 mx-auto text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Seviye Atlayın</h3>
            <p className="text-gray-600">
              Yüksek seviyelerde daha fazla çarpan, özel indirimler ve 
              öncelikli destek kazanın.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Seviye Sistemi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Badge className="mb-2 bg-gray-500">Bronz</Badge>
              <p className="text-sm font-semibold">0 - 499 puan</p>
              <p className="text-xs text-gray-600 mt-2">1x çarpan</p>
              <div className="mt-3 space-y-1 text-xs">
                <p>• Temel ödüller</p>
                <p>• Hoş geldin bonusu</p>
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Badge className="mb-2 bg-gray-400">Gümüş</Badge>
              <p className="text-sm font-semibold">500 - 1,999 puan</p>
              <p className="text-xs text-gray-600 mt-2">1.2x çarpan</p>
              <div className="mt-3 space-y-1 text-xs">
                <p>• %5 ekstra indirim</p>
                <p>• Doğum günü bonusu</p>
                <p>• Öncelikli destek</p>
              </div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Badge className="mb-2 bg-yellow-500">Altın</Badge>
              <p className="text-sm font-semibold">2,000 - 9,999 puan</p>
              <p className="text-xs text-gray-600 mt-2">1.5x çarpan</p>
              <div className="mt-3 space-y-1 text-xs">
                <p>• %10 ekstra indirim</p>
                <p>• Özel turlar</p>
                <p>• Erken rezervasyon</p>
                <p>• Ücretsiz iptal</p>
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Badge className="mb-2 bg-purple-500">Elmas</Badge>
              <p className="text-sm font-semibold">10,000+ puan</p>
              <p className="text-xs text-gray-600 mt-2">2x çarpan</p>
              <div className="mt-3 space-y-1 text-xs">
                <p>• %15 ekstra indirim</p>
                <p>• VIP tur deneyimleri</p>
                <p>• Kişisel tur danışmanı</p>
                <p>• Özel etkinlikler</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Earn Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Nasıl Puan Kazanırsınız?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500" />
                <div>
                  <h4 className="font-semibold">Rezervasyon Tamamlama</h4>
                  <p className="text-sm text-gray-600">1 TL = 1 puan + 50 bonus puan</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Star className="h-6 w-6 text-blue-500" />
                <div>
                  <h4 className="font-semibold">Yorum Yazma</h4>
                  <p className="text-sm text-gray-600">Her yorum için 25 puan</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Users className="h-6 w-6 text-purple-500" />
                <div>
                  <h4 className="font-semibold">Arkadaş Davet Etme</h4>
                  <p className="text-sm text-gray-600">Başarılı referans için 200 puan</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <Gift className="h-6 w-6 text-yellow-500" />
                <div>
                  <h4 className="font-semibold">Hesap Açma</h4>
                  <p className="text-sm text-gray-600">Hoş geldin bonusu: 100 puan</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <Calendar className="h-6 w-6 text-red-500" />
                <div>
                  <h4 className="font-semibold">Doğum Günü Bonusu</h4>
                  <p className="text-sm text-gray-600">Yılda bir kez 100 puan</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                <Award className="h-6 w-6 text-indigo-500" />
                <div>
                  <h4 className="font-semibold">Seviye Yükseltme</h4>
                  <p className="text-sm text-gray-600">Her seviye için 100 bonus puan</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Program Kuralları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Puanlar kazanıldıktan 1 yıl sonra otomatik olarak sona erer</p>
            <p>• Seviye seçimi toplam kazanılan puanlara göre belirlenir</p>
            <p>• İptal edilen rezervasyonlardan puan kazanılmaz</p>
            <p>• Referans bonusu, davet edilen kişi ilk rezervasyonunu tamamladıktan sonra verilir</p>
            <p>• TourTrip, program şartlarını önceden haber vermeksizin değiştirme hakkını saklı tutar</p>
            <p>• Hesap kapatıldığında tüm puanlar iptal olur</p>
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Sadakat Dashboard Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Aşağıda sadakat programı dashboard'inin demo versiyonu bulunmaktadır. 
            Gerçek uygulamada kullanıcının giriş yapması gerekir.
          </p>
          
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
            <LoyaltyDashboard showOnboarding={true} />
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>Sadakat Programı Özellikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Tamamlanan Özellikler</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Puan kazanma sistemi</li>
                <li>• Seviye yükseltme otomasyonu</li>
                <li>• Ödül katalogu</li>
                <li>• Ödül kullanma sistemi</li>
                <li>• Referans programı</li>
                <li>• Puan geçmişi takibi</li>
                <li>• Otomatik puan verme (Cloud Functions)</li>
                <li>• Firestore entegrasyonu</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">🔄 Geliştirme Aşamasında</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• E-posta bildirim sistemi</li>
                <li>• Mobil uygulama entegrasyonu</li>
                <li>• Sosyal medya paylaşım ödülleri</li>
                <li>• Gamification badge sistemi</li>
                <li>• Sezonsal özel kampanyalar</li>
                <li>• Kişiselleştirilmiş ödül önerileri</li>
                <li>• Analitik dashboard (admin)</li>
                <li>• A/B test entegrasyonu</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Coins({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
