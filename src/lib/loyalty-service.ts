import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  increment,
  writeBatch,
  Timestamp,
  DocumentReference
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  LoyaltyAccount, 
  LoyaltyTier, 
  PointsTransaction, 
  Reward, 
  RewardRedemption, 
  ReferralProgram, 
  Referral, 
  LoyaltyRule,
  LoyaltySearchParams,
  RewardSearchParams,
  LoyaltyAnalytics
} from '../types/loyalty';
import {
  LoyaltyAccountSchema,
  LoyaltyTierSchema,
  PointsTransactionSchema,
  RewardSchema,
  RewardRedemptionSchema,
  ReferralProgramSchema,
  ReferralSchema,
  LoyaltyRuleSchema
} from './firestore-collections';

// Collection references
const COLLECTIONS = {
  LOYALTY_ACCOUNTS: 'loyaltyAccounts',
  LOYALTY_TIERS: 'loyaltyTiers',
  POINTS_TRANSACTIONS: 'pointsTransactions',
  REWARDS: 'rewards',
  REWARD_REDEMPTIONS: 'rewardRedemptions',
  REFERRAL_PROGRAMS: 'referralPrograms',
  REFERRALS: 'referrals',
  LOYALTY_RULES: 'loyaltyRules',
} as const;

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateReferralCode = () => Math.random().toString(36).substr(2, 8).toUpperCase();
const generateRedemptionCode = () => Math.random().toString(36).substr(2, 10).toUpperCase();

// Loyalty Account Management
export class LoyaltyAccountService {
  static async createAccount(userId: string): Promise<LoyaltyAccount> {
    try {
      // Get bronze tier (default)
      const bronzeTier = await LoyaltyTierService.getTierByLevel(0);
      if (!bronzeTier) {
        throw new Error('Default tier not found');
      }

      const accountData = {
        id: generateId(),
        userId,
        points: 0,
        tier: {
          id: bronzeTier.id,
          name: bronzeTier.name,
          level: bronzeTier.level,
          minPoints: bronzeTier.minPoints,
          maxPoints: bronzeTier.maxPoints,
          multiplier: bronzeTier.multiplier,
          color: bronzeTier.color,
        },
        totalEarned: 0,
        totalSpent: 0,
        joinDate: new Date(),
        lastActivity: new Date(),
        status: 'active' as const,
        notifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validatedData = LoyaltyAccountSchema.parse(accountData);
      const docRef = await addDoc(collection(db, COLLECTIONS.LOYALTY_ACCOUNTS), validatedData);
      
      return { ...validatedData, id: docRef.id };
    } catch (error) {
      console.error('Error creating loyalty account:', error);
      throw new Error('Failed to create loyalty account');
    }
  }

  static async getAccount(userId: string): Promise<LoyaltyAccount | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.LOYALTY_ACCOUNTS),
        where('userId', '==', userId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as LoyaltyAccount;
    } catch (error) {
      console.error('Error getting loyalty account:', error);
      throw new Error('Failed to get loyalty account');
    }
  }

  static async updatePoints(userId: string, pointsChange: number, description: string): Promise<void> {
    try {
      const account = await this.getAccount(userId);
      if (!account) {
        throw new Error('Loyalty account not found');
      }

      const batch = writeBatch(db);
      
      // Update account points
      const accountRef = doc(db, COLLECTIONS.LOYALTY_ACCOUNTS, account.id);
      const newPoints = Math.max(0, account.points + pointsChange);
      
      batch.update(accountRef, {
        points: newPoints,
        totalEarned: pointsChange > 0 ? account.totalEarned + pointsChange : account.totalEarned,
        totalSpent: pointsChange < 0 ? account.totalSpent + Math.abs(pointsChange) : account.totalSpent,
        lastActivity: new Date(),
        updatedAt: new Date(),
      });

      // Create transaction record
      const transactionData = {
        id: generateId(),
        userId,
        type: pointsChange > 0 ? 'earned' as const : 'spent' as const,
        amount: Math.abs(pointsChange),
        description,
        createdAt: new Date(),
      };

      const validatedTransaction = PointsTransactionSchema.parse(transactionData);
      const transactionRef = doc(collection(db, COLLECTIONS.POINTS_TRANSACTIONS), transactionData.id);
      batch.set(transactionRef, validatedTransaction);

      // Check for tier upgrade
      if (pointsChange > 0) {
        await this.checkTierUpgrade(userId, newPoints, batch);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error updating points:', error);
      throw new Error('Failed to update points');
    }
  }

  private static async checkTierUpgrade(userId: string, newPoints: number, batch: any): Promise<void> {
    const tiers = await LoyaltyTierService.getAllTiers();
    const eligibleTier = tiers
      .filter(tier => tier.isActive && newPoints >= tier.minPoints)
      .sort((a, b) => b.level - a.level)[0];

    if (eligibleTier) {
      const account = await this.getAccount(userId);
      if (account && account.tier.level < eligibleTier.level) {
        const accountRef = doc(db, COLLECTIONS.LOYALTY_ACCOUNTS, account.id);
        batch.update(accountRef, {
          tier: {
            id: eligibleTier.id,
            name: eligibleTier.name,
            level: eligibleTier.level,
            minPoints: eligibleTier.minPoints,
            maxPoints: eligibleTier.maxPoints,
            multiplier: eligibleTier.multiplier,
            color: eligibleTier.color,
          },
          updatedAt: new Date(),
        });
      }
    }
  }
}

// Loyalty Tier Management
export class LoyaltyTierService {
  static async getAllTiers(): Promise<LoyaltyTier[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.LOYALTY_TIERS),
        where('isActive', '==', true),
        orderBy('level', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LoyaltyTier[];
    } catch (error) {
      console.error('Error getting tiers:', error);
      throw new Error('Failed to get loyalty tiers');
    }
  }

  static async getTierByLevel(level: number): Promise<LoyaltyTier | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.LOYALTY_TIERS),
        where('level', '==', level),
        where('isActive', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as LoyaltyTier;
    } catch (error) {
      console.error('Error getting tier by level:', error);
      throw new Error('Failed to get tier');
    }
  }

  static async createTier(tierData: Omit<LoyaltyTier, 'id' | 'createdAt' | 'updatedAt'>): Promise<LoyaltyTier> {
    try {
      const data = {
        ...tierData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validatedData = LoyaltyTierSchema.parse(data);
      const docRef = await addDoc(collection(db, COLLECTIONS.LOYALTY_TIERS), validatedData);
      
      return { ...validatedData, id: docRef.id };
    } catch (error) {
      console.error('Error creating tier:', error);
      throw new Error('Failed to create loyalty tier');
    }
  }
}

// Points Transaction Management
export class PointsTransactionService {
  static async getTransactionHistory(userId: string, params: LoyaltySearchParams = {}): Promise<PointsTransaction[]> {
    try {
      let q = query(collection(db, COLLECTIONS.POINTS_TRANSACTIONS));
      
      // Add filters
      q = query(q, where('userId', '==', userId));
      
      if (params.type) {
        q = query(q, where('type', '==', params.type));
      }
      
      if (params.dateFrom) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(params.dateFrom)));
      }
      
      if (params.dateTo) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(params.dateTo)));
      }

      // Add ordering and pagination
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';
      q = query(q, orderBy(sortBy, sortOrder));
      
      if (params.limit) {
        q = query(q, limit(params.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PointsTransaction[];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw new Error('Failed to get transaction history');
    }
  }

  static async awardPoints(userId: string, amount: number, description: string, metadata?: any): Promise<PointsTransaction> {
    try {
      // Update account points
      await LoyaltyAccountService.updatePoints(userId, amount, description);

      // Return the transaction
      const transactions = await this.getTransactionHistory(userId, { limit: 1, sortBy: 'createdAt', sortOrder: 'desc' });
      return transactions[0];
    } catch (error) {
      console.error('Error awarding points:', error);
      throw new Error('Failed to award points');
    }
  }
}

// Reward Management
export class RewardService {
  static async getAllRewards(params: RewardSearchParams = {}): Promise<Reward[]> {
    try {
      let q = query(collection(db, COLLECTIONS.REWARDS));
      
      // Add filters
      q = query(q, where('isActive', '==', true));
      
      if (params.category) {
        q = query(q, where('category', '==', params.category));
      }
      
      if (params.type) {
        q = query(q, where('type', '==', params.type));
      }
      
      if (params.featured !== undefined) {
        q = query(q, where('isFeatured', '==', params.featured));
      }
      
      if (params.minPoints) {
        q = query(q, where('pointsCost', '>=', params.minPoints));
      }
      
      if (params.maxPoints) {
        q = query(q, where('pointsCost', '<=', params.maxPoints));
      }

      // Add ordering and pagination
      const sortBy = params.sortBy || 'pointsCost';
      q = query(q, orderBy(sortBy, 'asc'));
      
      if (params.limit) {
        q = query(q, limit(params.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reward[];
    } catch (error) {
      console.error('Error getting rewards:', error);
      throw new Error('Failed to get rewards');
    }
  }

  static async redeemReward(userId: string, rewardId: string): Promise<RewardRedemption> {
    try {
      // Get reward details
      const rewardDoc = await getDoc(doc(db, COLLECTIONS.REWARDS, rewardId));
      if (!rewardDoc.exists()) {
        throw new Error('Reward not found');
      }
      
      const reward = { id: rewardDoc.id, ...rewardDoc.data() } as Reward;
      
      // Get user account
      const account = await LoyaltyAccountService.getAccount(userId);
      if (!account) {
        throw new Error('Loyalty account not found');
      }
      
      // Check if user has enough points
      if (account.points < reward.pointsCost) {
        throw new Error('Insufficient points');
      }

      // Check availability
      if (!reward.availability.unlimited && reward.availability.remaining !== undefined && reward.availability.remaining <= 0) {
        throw new Error('Reward not available');
      }

      const batch = writeBatch(db);

      // Create redemption record
      const redemptionData = {
        id: generateId(),
        userId,
        rewardId,
        pointsSpent: reward.pointsCost,
        redemptionCode: generateRedemptionCode(),
        status: 'confirmed' as const,
        expiresAt: reward.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validatedRedemption = RewardRedemptionSchema.parse(redemptionData);
      const redemptionRef = doc(collection(db, COLLECTIONS.REWARD_REDEMPTIONS), redemptionData.id);
      batch.set(redemptionRef, validatedRedemption);

      // Deduct points from account
      const accountRef = doc(db, COLLECTIONS.LOYALTY_ACCOUNTS, account.id);
      batch.update(accountRef, {
        points: account.points - reward.pointsCost,
        totalSpent: account.totalSpent + reward.pointsCost,
        lastActivity: new Date(),
        updatedAt: new Date(),
      });

      // Create points transaction
      const transactionData = {
        id: generateId(),
        userId,
        type: 'spent' as const,
        amount: reward.pointsCost,
        description: `Redeemed: ${reward.name}`,
        createdAt: new Date(),
      };

      const validatedTransaction = PointsTransactionSchema.parse(transactionData);
      const transactionRef = doc(collection(db, COLLECTIONS.POINTS_TRANSACTIONS), transactionData.id);
      batch.set(transactionRef, validatedTransaction);

      // Update reward redemption count and availability
      const rewardRef = doc(db, COLLECTIONS.REWARDS, rewardId);
      const updateData: any = {
        redemptionCount: increment(1),
        updatedAt: new Date(),
      };
      
      if (!reward.availability.unlimited && reward.availability.remaining !== undefined) {
        updateData['availability.remaining'] = reward.availability.remaining - 1;
      }
      
      batch.update(rewardRef, updateData);

      await batch.commit();

      return validatedRedemption;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw new Error('Failed to redeem reward');
    }
  }

  static async getUserRedemptions(userId: string): Promise<RewardRedemption[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.REWARD_REDEMPTIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RewardRedemption[];
    } catch (error) {
      console.error('Error getting user redemptions:', error);
      throw new Error('Failed to get redemptions');
    }
  }
}

// Referral Program Management
export class ReferralService {
  static async createReferral(referrerId: string, refereeEmail: string, programId: string): Promise<Referral> {
    try {
      const program = await this.getReferralProgram(programId);
      if (!program || !program.isActive) {
        throw new Error('Referral program not found or inactive');
      }

      const referralData = {
        id: generateId(),
        referrerId,
        refereeEmail,
        code: generateReferralCode(),
        status: 'sent' as const,
        pointsEarned: 0,
        expiresAt: new Date(Date.now() + program.conditions.validityDays * 24 * 60 * 60 * 1000),
        metadata: {
          channel: 'email' as const,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validatedData = ReferralSchema.parse(referralData);
      const docRef = await addDoc(collection(db, COLLECTIONS.REFERRALS), validatedData);
      
      return { ...validatedData, id: docRef.id };
    } catch (error) {
      console.error('Error creating referral:', error);
      throw new Error('Failed to create referral');
    }
  }

  static async completeReferral(referralCode: string, refereeId: string): Promise<void> {
    try {
      const q = query(
        collection(db, COLLECTIONS.REFERRALS),
        where('code', '==', referralCode),
        where('status', '==', 'sent'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        throw new Error('Referral not found or already used');
      }

      const referralDoc = snapshot.docs[0];
      const referral = { id: referralDoc.id, ...referralDoc.data() } as Referral;
      
      if (referral.expiresAt < new Date()) {
        throw new Error('Referral code expired');
      }

      const program = await this.getActivReferralProgram();
      if (!program) {
        throw new Error('No active referral program');
      }

      const batch = writeBatch(db);

      // Update referral status
      const referralRef = doc(db, COLLECTIONS.REFERRALS, referral.id);
      batch.update(referralRef, {
        refereeId,
        status: 'completed',
        pointsEarned: program.rewards.referrer.points,
        completedAt: new Date(),
        updatedAt: new Date(),
      });

      // Award points to referrer
      await LoyaltyAccountService.updatePoints(
        referral.referrerId,
        program.rewards.referrer.points,
        `Referral bonus for inviting ${refereeId}`
      );

      // Award points to referee
      await LoyaltyAccountService.updatePoints(
        refereeId,
        program.rewards.referee.points,
        'Welcome bonus from referral'
      );

      await batch.commit();
    } catch (error) {
      console.error('Error completing referral:', error);
      throw new Error('Failed to complete referral');
    }
  }

  static async getReferralProgram(programId: string): Promise<ReferralProgram | null> {
    try {
      const docRef = doc(db, COLLECTIONS.REFERRAL_PROGRAMS, programId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return { id: docSnap.id, ...docSnap.data() } as ReferralProgram;
    } catch (error) {
      console.error('Error getting referral program:', error);
      throw new Error('Failed to get referral program');
    }
  }

  static async getActivReferralProgram(): Promise<ReferralProgram | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.REFERRAL_PROGRAMS),
        where('isActive', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ReferralProgram;
    } catch (error) {
      console.error('Error getting active referral program:', error);
      throw new Error('Failed to get active referral program');
    }
  }

  static async getUserReferrals(userId: string): Promise<Referral[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.REFERRALS),
        where('referrerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Referral[];
    } catch (error) {
      console.error('Error getting user referrals:', error);
      throw new Error('Failed to get user referrals');
    }
  }
}

// Loyalty Analytics
export class LoyaltyAnalyticsService {
  static async getAnalytics(): Promise<LoyaltyAnalytics> {
    try {
      // This would typically involve complex queries and aggregations
      // For now, we'll provide a basic implementation
      
      const accountsSnapshot = await getDocs(collection(db, COLLECTIONS.LOYALTY_ACCOUNTS));
      const transactionsSnapshot = await getDocs(collection(db, COLLECTIONS.POINTS_TRANSACTIONS));
      const redemptionsSnapshot = await getDocs(collection(db, COLLECTIONS.REWARD_REDEMPTIONS));

      const totalMembers = accountsSnapshot.size;
      const activeMembers = accountsSnapshot.docs.filter(doc => {
        const data = doc.data();
        const lastActivity = data.lastActivity?.toDate();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastActivity && lastActivity > thirtyDaysAgo;
      }).length;

      const pointsIssued = transactionsSnapshot.docs
        .filter(doc => ['earned', 'bonus'].includes(doc.data().type))
        .reduce((sum, doc) => sum + doc.data().amount, 0);

      const pointsRedeemed = transactionsSnapshot.docs
        .filter(doc => doc.data().type === 'spent')
        .reduce((sum, doc) => sum + doc.data().amount, 0);

      const redemptionRate = pointsIssued > 0 ? (pointsRedeemed / pointsIssued) * 100 : 0;

      const tierDistribution: { [tierName: string]: number } = {};
      accountsSnapshot.docs.forEach(doc => {
        const tierName = doc.data().tier?.name || 'Unknown';
        tierDistribution[tierName] = (tierDistribution[tierName] || 0) + 1;
      });

      return {
        totalMembers,
        activeMembers,
        pointsIssued,
        pointsRedeemed,
        redemptionRate,
        averagePointsPerUser: totalMembers > 0 ? pointsIssued / totalMembers : 0,
        tierDistribution,
        topRewards: [], // Would need complex aggregation
        monthlyTrends: [], // Would need time-series data
        engagementMetrics: {
          dailyActiveUsers: 0, // Would need detailed analytics
          averageSessionDuration: 0,
          returnRate: 0,
        },
      };
    } catch (error) {
      console.error('Error getting loyalty analytics:', error);
      throw new Error('Failed to get loyalty analytics');
    }
  }
}

// Export all services
export {
  LoyaltyAccountService,
  LoyaltyTierService,
  PointsTransactionService,
  RewardService,
  ReferralService,
  LoyaltyAnalyticsService,
};
