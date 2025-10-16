import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as test from 'firebase-functions-test';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK for testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-test'
  });
}

const testEnv = test();

describe('Loyalty Functions', () => {
  beforeAll(() => {
    // Set up test environment
  });

  afterAll(() => {
    testEnv.cleanup();
  });

  describe('calculatePoints', () => {
    it('should calculate points correctly for different booking amounts', async () => {
      const calculatePoints = testEnv.wrap(require('../loyalty-functions').calculatePoints);

      // Test different booking amounts
      const testCases = [
        { amount: 100, expectedPoints: 10 }, // 10% of amount
        { amount: 250, expectedPoints: 25 },
        { amount: 500, expectedPoints: 50 },
        { amount: 1000, expectedPoints: 100 }
      ];

      for (const testCase of testCases) {
        const result = await calculatePoints({
          data: {
            userId: 'test-user',
            bookingAmount: testCase.amount,
            currency: 'TRY'
          }
        });

        expect(result.points).toBe(testCase.expectedPoints);
        expect(result.userId).toBe('test-user');
        expect(result.currency).toBe('TRY');
      }
    });

    it('should handle bonus multipliers correctly', async () => {
      const calculatePoints = testEnv.wrap(require('../loyalty-functions').calculatePoints);

      const result = await calculatePoints({
        data: {
          userId: 'test-user',
          bookingAmount: 100,
          currency: 'TRY',
          bonusMultiplier: 2
        }
      });

      expect(result.points).toBe(20); // 10 * 2
    });

    it('should validate input parameters', async () => {
      const calculatePoints = testEnv.wrap(require('../loyalty-functions').calculatePoints);

      // Test missing userId
      await expect(calculatePoints({
        data: {
          bookingAmount: 100,
          currency: 'TRY'
        }
      })).rejects.toThrow();

      // Test missing bookingAmount
      await expect(calculatePoints({
        data: {
          userId: 'test-user',
          currency: 'TRY'
        }
      })).rejects.toThrow();

      // Test invalid bookingAmount
      await expect(calculatePoints({
        data: {
          userId: 'test-user',
          bookingAmount: -100,
          currency: 'TRY'
        }
      })).rejects.toThrow();
    });
  });

  describe('redeemReward', () => {
    it('should redeem reward successfully when user has enough points', async () => {
      const redeemReward = testEnv.wrap(require('../loyalty-functions').redeemReward);

      // Mock user with sufficient points
      const mockUser = {
        userId: 'test-user',
        totalPoints: 1000,
        tier: 'gold'
      };

      const result = await redeemReward({
        data: {
          userId: 'test-user',
          rewardId: 'discount-10',
          pointsRequired: 500
        }
      });

      expect(result.success).toBe(true);
      expect(result.remainingPoints).toBe(500);
      expect(result.rewardId).toBe('discount-10');
    });

    it('should fail when user has insufficient points', async () => {
      const redeemReward = testEnv.wrap(require('../loyalty-functions').redeemReward);

      await expect(redeemReward({
        data: {
          userId: 'test-user',
          rewardId: 'discount-10',
          pointsRequired: 1500
        }
      })).rejects.toThrow('Insufficient points');
    });

    it('should validate reward exists', async () => {
      const redeemReward = testEnv.wrap(require('../loyalty-functions').redeemReward);

      await expect(redeemReward({
        data: {
          userId: 'test-user',
          rewardId: 'non-existent-reward',
          pointsRequired: 100
        }
      })).rejects.toThrow('Reward not found');
    });
  });

  describe('updateUserTier', () => {
    it('should upgrade user tier based on total points', async () => {
      const updateUserTier = testEnv.wrap(require('../loyalty-functions').updateUserTier);

      const testCases = [
        { points: 0, expectedTier: 'bronze' },
        { points: 500, expectedTier: 'silver' },
        { points: 1000, expectedTier: 'gold' },
        { points: 2000, expectedTier: 'platinum' }
      ];

      for (const testCase of testCases) {
        const result = await updateUserTier({
          data: {
            userId: 'test-user',
            totalPoints: testCase.points
          }
        });

        expect(result.tier).toBe(testCase.expectedTier);
        expect(result.userId).toBe('test-user');
      }
    });

    it('should handle tier downgrades correctly', async () => {
      const updateUserTier = testEnv.wrap(require('../loyalty-functions').updateUserTier);

      // User was gold, but points reduced
      const result = await updateUserTier({
        data: {
          userId: 'test-user',
          totalPoints: 800, // Below gold threshold
          previousTier: 'gold'
        }
      });

      expect(result.tier).toBe('silver');
      expect(result.tierChanged).toBe(true);
    });
  });

  describe('processReferral', () => {
    it('should award points to referrer and referee', async () => {
      const processReferral = testEnv.wrap(require('../loyalty-functions').processReferral);

      const result = await processReferral({
        data: {
          referrerId: 'user1',
          refereeId: 'user2',
          referralCode: 'REF123'
        }
      });

      expect(result.referrerPoints).toBe(100);
      expect(result.refereePoints).toBe(50);
      expect(result.referralCode).toBe('REF123');
    });

    it('should prevent self-referral', async () => {
      const processReferral = testEnv.wrap(require('../loyalty-functions').processReferral);

      await expect(processReferral({
        data: {
          referrerId: 'user1',
          refereeId: 'user1', // Same user
          referralCode: 'REF123'
        }
      })).rejects.toThrow('Cannot refer yourself');
    });

    it('should validate referral code format', async () => {
      const processReferral = testEnv.wrap(require('../loyalty-functions').processReferral);

      await expect(processReferral({
        data: {
          referrerId: 'user1',
          refereeId: 'user2',
          referralCode: 'invalid-code'
        }
      })).rejects.toThrow('Invalid referral code format');
    });
  });
});
