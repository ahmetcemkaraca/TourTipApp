'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Gift, 
  Star, 
  Trophy, 
  Users, 
  Calendar,
  Target,
  TrendingUp,
  Award,
  Sparkles,
  Crown,
  Zap
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface LoyaltyData {
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  membershipTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextTier: string;
  pointsToNextTier: number;
  referralCount: number;
  achievements: Achievement[];
  availableRewards: Reward[];
  pointsHistory: PointsTransaction[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  earnedAt: string;
  isUnlocked: boolean;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountType: 'percentage' | 'fixed' | 'gift';
  discountValue: number;
  category: string;
  expiresAt?: string;
  isAvailable: boolean;
}

interface PointsTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired';
  points: number;
  description: string;
  date: string;
  bookingId?: string;
}

export function LoyaltyProgram() {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'achievements' | 'history'>('overview');

  useEffect(() => {
    loadLoyaltyData();
  }, [user]);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      // TODO: Fetch actual loyalty data from Firestore
      // TODO: Load real loyalty data from Firestore
      const loyaltyData: LoyaltyData = {
        currentPoints: 1250,
        totalEarned: 2850,
        totalRedeemed: 1600,
        membershipTier: 'silver',
        nextTier: 'Gold',
        pointsToNextTier: 750,
        referralCount: 3,
        achievements: [
          {
            id: '1',
            title: 'İlk Rezervasyon',
            description: 'İlk turunuzu rezerve ettiniz',
            icon: '🎯',
            points: 100,
            earnedAt: '2024-03-15',
            isUnlocked: true,
          },
          {
            id: '2',
            title: 'Sadık Müşteri',
            description: '5 tur tamamladınız',
            icon: '⭐',
            points: 250,
            earnedAt: '2024-04-10',
            isUnlocked: true,
          },
          {
            id: '3',
            title: 'Değerlendirme Uzmanı',
            description: '10 değerlendirme yaptınız',
            icon: '📝',
            points: 150,
            earnedAt: '2024-04-20',
            isUnlocked: true,
          },
          {
            id: '4',
            title: 'Kapadokya Kaşifi',
            description: 'Kapadokya turlarına katıldınız',
            icon: '🎈',
            points: 200,
            earnedAt: '',
            isUnlocked: false,
          },
        ],
        availableRewards: [
          {
            id: '1',
            title: '%10 İndirim Kuponu',
            description: 'Tüm turlarda geçerli %10 indirim',
            pointsCost: 500,
            discountType: 'percentage',
            discountValue: 10,
            category: 'discount',
            isAvailable: true,
          },
          {
            id: '2',
            title: '50 TL İndirim',
            description: '250 TL ve üzeri rezervasyonlarda geçerli',
            pointsCost: 400,
            discountType: 'fixed',
            discountValue: 50,
            category: 'discount',
            isAvailable: true,
          },
          {
            id: '3',
            title: 'Ücretsiz Şehir Turu',
            description: 'İstanbul veya Ankara şehir turu hediye',
            pointsCost: 1200,
            discountType: 'gift',
            discountValue: 0,
            category: 'gift',
            isAvailable: true,
          },
          {
            id: '4',
            title: 'VIP Müşteri Desteği',
            description: '1 yıl boyunca öncelikli destek hattı',
            pointsCost: 2000,
            discountType: 'gift',
            discountValue: 0,
            category: 'service',
            isAvailable: false,
          },
        ],
        pointsHistory: [
          {
            id: '1',
            type: 'earned',
            points: 150,
            description: 'Kapadokya Balon Turu rezervasyonu',
            date: '2024-04-20',
            bookingId: 'booking-001',
          },
          {
            id: '2',
            type: 'earned',
            points: 50,
            description: 'Tur değerlendirmesi',
            date: '2024-04-22',
          },
          {
            id: '3',
            type: 'redeemed',
            points: -500,
            description: '%10 İndirim kuponu kullanımı',
            date: '2024-04-15',
          },
        ],
      };
      
      // TODO: Load from Firestore
      setLoyaltyData({
        currentPoints: 0,
        currentTier: 'Bronze',
        nextTier: 'Silver',
        pointsToNextTier: 500,
        totalEarned: 0,
        totalSpent: 0,
        pointsThisMonth: 0,
        recentTransactions: [],
        availableRewards: []
      });
    } catch (error) {
      toast.error('Sadakat programı verileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getTierConfig = (tier: string) => {
    const configs = {
      bronze: {
        name: 'Bronz',
        icon: '🥉',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        minPoints: 0,
      },
      silver: {
        name: 'Gümüş',
        icon: '🥈',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        minPoints: 500,
      },
      gold: {
        name: 'Altın',
        icon: '🥇',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        minPoints: 2000,
      },
      platinum: {
        name: 'Platin',
        icon: '💎',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        minPoints: 5000,
      },
    };
    return configs[tier as keyof typeof configs];
  };

  const handleRedeemReward = async (rewardId: string) => {
    if (!loyaltyData) return;
    
    const reward = loyaltyData.availableRewards.find(r => r.id === rewardId);
    if (!reward) return;

    if (loyaltyData.currentPoints < reward.pointsCost) {
      toast.error('Yeterli puanınız bulunmuyor.');
      return;
    }

    try {
      // TODO: Redeem reward via API
      toast.success(`${reward.title} başarıyla kullanıldı!`);
      loadLoyaltyData();
    } catch (error) {
      toast.error('Ödül kullanılırken hata oluştu.');
    }
  };

  const handleInviteFriend = () => {
    const referralLink = `https://tourtrip.app/ref/${user?.uid}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referans linki kopyalandı!');
  };

  if (loading || !loyaltyData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const tierConfig = getTierConfig(loyaltyData.membershipTier);
  const progressPercentage = loyaltyData.pointsToNextTier > 0 
    ? ((loyaltyData.currentPoints - tierConfig.minPoints) / loyaltyData.pointsToNextTier) * 100
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sadakat Programı</h2>
          <p className="text-muted-foreground">Puanlarınızı toplayın ve ödüllerinizi kazanın</p>
        </div>
      </div>

      {/* Membership Status */}
      <Card className={`${tierConfig.bgColor} ${tierConfig.borderColor} border-2`}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{tierConfig.icon}</div>
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <span className={tierConfig.color}>{tierConfig.name} Üye</span>
                  <Crown className={`h-6 w-6 ${tierConfig.color}`} />
                </h3>
                <p className="text-muted-foreground">
                  {loyaltyData.currentPoints.toLocaleString()} puan bakiyeniz var
                </p>
              </div>
            </div>
            
            <div className="w-full lg:w-80">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Sonraki seviye: {loyaltyData.nextTier}</span>
                <span className="text-sm text-muted-foreground">
                  {loyaltyData.pointsToNextTier} puan kaldı
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Güncel Puanlar</p>
                <p className="text-2xl font-bold text-primary">
                  {loyaltyData.currentPoints.toLocaleString()}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Kazanılan</p>
                <p className="text-2xl font-bold text-green-600">
                  {loyaltyData.totalEarned.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kullanılan Puanlar</p>
                <p className="text-2xl font-bold text-blue-600">
                  {loyaltyData.totalRedeemed.toLocaleString()}
                </p>
              </div>
              <Gift className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Davet Edilen</p>
                <p className="text-2xl font-bold text-purple-600">{loyaltyData.referralCount}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Genel Bakış', icon: Trophy },
          { id: 'rewards', label: 'Ödüller', icon: Gift },
          { id: 'achievements', label: 'Başarımlar', icon: Award },
          { id: 'history', label: 'Geçmiş', icon: Calendar },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Hızlı İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" onClick={handleInviteFriend}>
                <Users className="h-4 w-4 mr-2" />
                Arkadaş Davet Et (100 puan kazan)
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Star className="h-4 w-4 mr-2" />
                Tur Değerlendir (50 puan kazan)
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Profil Tamamla (25 puan kazan)
              </Button>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Son Başarımlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loyaltyData.achievements
                .filter(a => a.isUnlocked)
                .slice(0, 3)
                .map(achievement => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <Badge variant="secondary">+{achievement.points}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loyaltyData.availableRewards.map(reward => (
            <Card key={reward.id} className={!reward.isAvailable ? 'opacity-50' : ''}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{reward.title}</h3>
                    <Badge variant={reward.category === 'gift' ? 'default' : 'outline'}>
                      {reward.pointsCost} puan
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{reward.description}</p>
                  
                  <Button 
                    className="w-full"
                    disabled={!reward.isAvailable || loyaltyData.currentPoints < reward.pointsCost}
                    onClick={() => handleRedeemReward(reward.id)}
                  >
                    {loyaltyData.currentPoints < reward.pointsCost 
                      ? `${reward.pointsCost - loyaltyData.currentPoints} puan eksik`
                      : reward.isAvailable 
                        ? 'Kullan'
                        : 'Müsait Değil'
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loyaltyData.achievements.map(achievement => (
            <Card key={achievement.id} className={achievement.isUnlocked ? 'bg-green-50 border-green-200' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl opacity-80">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      {achievement.title}
                      {achievement.isUnlocked && <Sparkles className="h-4 w-4 text-green-600" />}
                    </h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {achievement.isUnlocked && achievement.earnedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        {new Date(achievement.earnedAt).toLocaleDateString('tr-TR')} tarihinde kazanıldı
                      </p>
                    )}
                  </div>
                  <Badge variant={achievement.isUnlocked ? 'default' : 'outline'}>
                    +{achievement.points}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Puan Geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loyaltyData.pointsHistory.map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.type === 'earned' 
                          ? 'text-green-600' 
                          : transaction.type === 'redeemed'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}>
                        {transaction.type === 'earned' ? '+' : ''}{transaction.points}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.type === 'earned' ? 'Kazanılan' : 
                         transaction.type === 'redeemed' ? 'Kullanılan' : 'Süresi Doldu'}
                      </p>
                    </div>
                  </div>
                  {index < loyaltyData.pointsHistory.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
