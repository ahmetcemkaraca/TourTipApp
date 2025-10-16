// Loyalty program types for TourTrip.app
export interface LoyaltyAccount {
  id: string;
  userId: string;
  points: number;
  tier: LoyaltyTier;
  totalEarned: number;
  totalSpent: number;
  joinDate: Date;
  lastActivity: Date;
  status: 'active' | 'suspended' | 'closed';
  notifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  level: number;
  minPoints: number;
  maxPoints?: number;
  benefits: TierBenefit[];
  multiplier: number; // Points earning multiplier
  color: string;
  icon: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TierBenefit {
  id: string;
  type: 'discount' | 'free_shipping' | 'priority_support' | 'exclusive_tours' | 'early_access' | 'bonus_points';
  name: string;
  description: string;
  value: number; // Percentage or amount
  isActive: boolean;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'expired' | 'adjusted' | 'bonus' | 'refund';
  amount: number;
  description: string;
  orderId?: string;
  bookingId?: string;
  promoId?: string;
  referralId?: string;
  expiresAt?: Date;
  isExpired: boolean;
  metadata?: {
    [key: string]: any;
  };
  createdAt: Date;
  processedAt?: Date;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'free_tour' | 'voucher' | 'merchandise' | 'experience';
  category: string;
  pointsCost: number;
  monetaryValue: number;
  currency: string;
  availability: {
    unlimited: boolean;
    quantity?: number;
    remaining?: number;
  };
  eligibility: {
    minTier?: string;
    userTypes?: string[];
    regions?: string[];
  };
  terms: string[];
  images: string[];
  validFrom: Date;
  validUntil?: Date;
  isActive: boolean;
  isFeatured: boolean;
  redemptionCount: number;
  maxRedemptionsPerUser?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  pointsSpent: number;
  redemptionCode: string;
  status: 'pending' | 'confirmed' | 'used' | 'expired' | 'cancelled';
  usedAt?: Date;
  expiresAt?: Date;
  orderId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralProgram {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  rewards: {
    referrer: {
      points: number;
      bonus?: number;
    };
    referee: {
      points: number;
      discount?: number;
    };
  };
  conditions: {
    minSpend?: number;
    validityDays: number;
    maxRedemptions?: number;
  };
  terms: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId?: string;
  refereeEmail?: string;
  refereePhone?: string;
  code: string;
  status: 'sent' | 'registered' | 'completed' | 'expired';
  pointsEarned: number;
  completedAt?: Date;
  expiresAt: Date;
  metadata?: {
    channel: 'email' | 'sms' | 'social' | 'link';
    source?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyRule {
  id: string;
  name: string;
  description: string;
  type: 'booking' | 'signup' | 'review' | 'referral' | 'birthday' | 'milestone';
  trigger: {
    event: string;
    conditions?: {
      [key: string]: any;
    };
  };
  reward: {
    points: number;
    multiplier?: number;
    bonus?: number;
  };
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'unlimited';
  isActive: boolean;
  validFrom: Date;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyChallenge {
  id: string;
  name: string;
  description: string;
  type: 'streak' | 'milestone' | 'time_limited' | 'seasonal';
  requirements: {
    target: number;
    metric: 'bookings' | 'points' | 'referrals' | 'reviews';
    timeframe?: number; // days
  };
  reward: {
    points: number;
    badge?: string;
    tier_boost?: boolean;
  };
  progress?: {
    current: number;
    percentage: number;
  };
  status: 'active' | 'completed' | 'expired' | 'paused';
  startDate: Date;
  endDate?: Date;
  participantCount: number;
  completionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'achievement' | 'milestone' | 'special' | 'tier';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: string;
    value: number;
  };
  isActive: boolean;
  earnedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Date;
  progress?: number;
  isVisible: boolean;
}

export interface LoyaltyNotification {
  id: string;
  userId: string;
  type: 'points_earned' | 'tier_upgrade' | 'reward_available' | 'points_expiring' | 'challenge_complete';
  title: string;
  message: string;
  points?: number;
  tier?: string;
  rewardId?: string;
  challengeId?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// Search and filter interfaces
export interface LoyaltySearchParams {
  userId?: string;
  type?: PointsTransaction['type'];
  tier?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minPoints?: number;
  maxPoints?: number;
  status?: string;
  sortBy?: 'date' | 'points' | 'tier';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface RewardSearchParams {
  category?: string;
  type?: Reward['type'];
  minPoints?: number;
  maxPoints?: number;
  tier?: string;
  availability?: boolean;
  featured?: boolean;
  sortBy?: 'points' | 'popularity' | 'newest';
  limit?: number;
  offset?: number;
}

// Analytics interfaces
export interface LoyaltyAnalytics {
  totalMembers: number;
  activeMembers: number;
  pointsIssued: number;
  pointsRedeemed: number;
  redemptionRate: number;
  averagePointsPerUser: number;
  tierDistribution: {
    [tierName: string]: number;
  };
  topRewards: {
    rewardId: string;
    name: string;
    redemptions: number;
  }[];
  monthlyTrends: {
    month: string;
    newMembers: number;
    pointsEarned: number;
    pointsSpent: number;
    redemptions: number;
  }[];
  engagementMetrics: {
    dailyActiveUsers: number;
    averageSessionDuration: number;
    returnRate: number;
  };
}

// Component props interfaces
export interface LoyaltyDashboardProps {
  userId: string;
  showOnboarding?: boolean;
}

export interface RewardCatalogProps {
  userTier?: string;
  userPoints?: number;
  onRedeem?: (reward: Reward) => void;
  filters?: RewardSearchParams;
}

export interface PointsHistoryProps {
  userId: string;
  limit?: number;
  showFilters?: boolean;
}

export interface TierProgressProps {
  currentTier: LoyaltyTier;
  nextTier?: LoyaltyTier;
  currentPoints: number;
  showAnimation?: boolean;
}

export interface ReferralPanelProps {
  userId: string;
  program: ReferralProgram;
  onInvite?: (emails: string[]) => void;
}
