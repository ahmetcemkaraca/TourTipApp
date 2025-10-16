'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Gift, 
  Star, 
  TrendingUp, 
  Users, 
  Calendar,
  Coins,
  Award,
  Share2,
  History
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { 
  LoyaltyAccountService, 
  PointsTransactionService, 
  RewardService,
  ReferralService 
} from '@/lib/loyalty-service';
import { LoyaltyAccount, PointsTransaction, Reward, Referral } from '@/types/loyalty';

interface LoyaltyDashboardProps {
  userId?: string;
  showOnboarding?: boolean;
}

export default function LoyaltyDashboard({ userId, showOnboarding = false }: LoyaltyDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<PointsTransaction[]>([]);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [userReferrals, setUserReferrals] = useState<Referral[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const currentUserId = userId || user?.uid;

  useEffect(() => {
    if (currentUserId) {
      loadLoyaltyData();
    }
  }, [currentUserId]);

  const loadLoyaltyData = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);

      // Load loyalty account
      let account = await LoyaltyAccountService.getAccount(currentUserId);
      
      // Create account if it doesn't exist
      if (!account) {
        account = await LoyaltyAccountService.createAccount(currentUserId);
        toast.success('Sadakat hesabınız oluşturuldu! Hoş geldin bonusu: 100 puan');
      }
      
      setLoyaltyAccount(account);

      // Load recent transactions
      const transactions = await PointsTransactionService.getTransactionHistory(currentUserId, {
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setRecentTransactions(transactions);

      // Load available rewards
      const rewards = await RewardService.getAllRewards({
        limit: 6,
        featured: true
      });
      setAvailableRewards(rewards);

      // Load referrals
      const referrals = await ReferralService.getUserReferrals(currentUserId);
      setUserReferrals(referrals);

    } catch (error) {
      console.error('Error loading loyalty data:', error);
      toast.error('Sadakat programı verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRewardRedeem = async (rewardId: string) => {
    if (!currentUserId) return;

    try {
      await RewardService.redeemReward(currentUserId, rewardId);
      toast.success('Ödül başarıyla kullanıldı!');
      loadLoyaltyData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Ödül kullanılırken hata oluştu');
    }
  };

  const getTierProgress = () => {
    if (!loyaltyAccount) return { current: 0, target: 100, percentage: 0 };

    const currentPoints = loyaltyAccount.points;
    const tierMaxPoints = loyaltyAccount.tier.maxPoints;
    
    if (!tierMaxPoints) {
      return { current: currentPoints, target: 'Maksimum', percentage: 100 };
    }

    const percentage = Math.min((currentPoints / tierMaxPoints) * 100, 100);
    return { current: currentPoints, target: tierMaxPoints, percentage };
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
      case 'bonus':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'spent':
        return <Gift className="h-4 w-4 text-blue-500" />;
      case 'expired':
        return <Calendar className="h-4 w-4 text-red-500" />;
      default:
        return <Coins className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : date;
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!loyaltyAccount) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sadakat hesabı bulunamadı</h3>
          <p className="text-gray-600 mb-4">
            Sadakat programına katılmak için hesap oluşturun
          </p>
          <Button onClick={loadLoyaltyData}>
            Hesap Oluştur
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progress = getTierProgress();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mevcut Puanlar</p>
                <p className="text-2xl font-bold text-blue-600">{loyaltyAccount.points.toLocaleString()}</p>
              </div>
              <Coins className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mevcut Seviye</p>
                <div className="flex items-center gap-2">
                  <Badge style={{ backgroundColor: loyaltyAccount.tier.color }}>
                    {loyaltyAccount.tier.name}
                  </Badge>
                </div>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Kazanılan</p>
                <p className="text-2xl font-bold text-green-600">{loyaltyAccount.totalEarned.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Başarılı Referans</p>
                <p className="text-2xl font-bold text-purple-600">
                  {userReferrals.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Seviye İlerlemesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Mevcut: {loyaltyAccount.tier.name}</span>
              <span>
                {progress.current} / {progress.target} puan
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress.percentage}%`,
                  backgroundColor: loyaltyAccount.tier.color 
                }}
              />
            </div>
            {loyaltyAccount.tier.maxPoints && (
              <p className="text-sm text-gray-600">
                Bir sonraki seviyeye {loyaltyAccount.tier.maxPoints - loyaltyAccount.points} puan kaldı
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="rewards">Ödüller</TabsTrigger>
          <TabsTrigger value="referrals">Referanslar</TabsTrigger>
          <TabsTrigger value="history">Geçmiş</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Son İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Henüz işlem bulunmuyor</p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        ['earned', 'bonus'].includes(transaction.type) ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {['earned', 'bonus'].includes(transaction.type) ? '+' : '-'}{transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popüler Ödüller</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRewards.map((reward) => (
                  <div key={reward.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{reward.name}</h4>
                        <p className="text-sm text-gray-600">{reward.description}</p>
                      </div>
                      <Badge variant="secondary">{reward.pointsCost} puan</Badge>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      disabled={loyaltyAccount.points < reward.pointsCost}
                      onClick={() => handleRewardRedeem(reward.id)}
                    >
                      {loyaltyAccount.points < reward.pointsCost ? 'Yetersiz Puan' : 'Kullan'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Referans Programı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Arkadaşlarını Davet Et, Puan Kazan!</h3>
                <p className="text-gray-600 mb-4">
                  Her başarılı referans için 200 puan kazan. Arkadaşın da 50 puan kazanır!
                </p>
                <Button>
                  <Share2 className="h-4 w-4 mr-2" />
                  Davet Gönder
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Referanslarınız</h4>
                {userReferrals.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Henüz referans bulunmuyor</p>
                ) : (
                  <div className="space-y-2">
                    {userReferrals.map((referral) => (
                      <div key={referral.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{referral.refereeEmail}</p>
                          <p className="text-sm text-gray-500">Kod: {referral.code}</p>
                        </div>
                        <Badge variant={
                          referral.status === 'completed' ? 'default' : 
                          referral.status === 'registered' ? 'secondary' : 'outline'
                        }>
                          {referral.status === 'completed' ? 'Tamamlandı' :
                           referral.status === 'registered' ? 'Kayıt Oldu' :
                           referral.status === 'sent' ? 'Gönderildi' : 'Süresi Doldu'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Puan Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Henüz işlem bulunmuyor</p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border-b">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        ['earned', 'bonus'].includes(transaction.type) ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {['earned', 'bonus'].includes(transaction.type) ? '+' : '-'}{transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
