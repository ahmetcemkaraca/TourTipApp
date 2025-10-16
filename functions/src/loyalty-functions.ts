import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

// Earn points from booking
export const earnPointsFromBooking = onDocumentCreated(
  'bookings/{bookingId}',
  async (event: FirestoreEvent<any, any>) => {
    const booking = event.data?.data();
    if (!booking || booking.status !== 'confirmed') return;

    const db = getFirestore();

    try {
      const loyaltyRef = db.collection('user_loyalty').doc(booking.userId);
      const loyaltyDoc = await loyaltyRef.get();

      if (!loyaltyDoc.exists) {
        await loyaltyRef.set({
          id: loyaltyRef.id,
          userId: booking.userId,
          totalPoints: 0,
          availablePoints: 0,
          lifetimePoints: 0,
          currentTier: 'bronze',
          pointsHistory: [],
          redeemedRewards: [],
          joinedAt: new Date(),
          lastActivity: new Date(),
          updatedAt: new Date(),
        });
      }

      const loyalty = loyaltyDoc.exists ? loyaltyDoc.data() : null;
      const pointsToEarn = Math.floor(booking.totalAmount * 1);

      const transactionRef = db.collection('points_transactions').doc();
      const transaction = {
        id: transactionRef.id,
        userId: booking.userId,
        type: 'earned',
        points: pointsToEarn,
        reason: `Rezervasyon #${booking.id}`,
        orderId: booking.id,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      await transactionRef.set(transaction);

      const currentTotal = loyalty?.totalPoints || 0;
      const currentAvailable = loyalty?.availablePoints || 0;
      const newTotal = currentTotal + pointsToEarn;
      const newAvailable = currentAvailable + pointsToEarn;

      let newTier = 'bronze';
      if (newTotal >= 10000) newTier = 'platinum';
      else if (newTotal >= 5000) newTier = 'gold';
      else if (newTotal >= 1000) newTier = 'silver';

      const history = loyalty?.pointsHistory || [];
      history.push({
        id: transactionRef.id,
        type: 'earned',
        points: pointsToEarn,
        reason: transaction.reason,
        orderId: booking.id,
        createdAt: new Date(),
      });

      await loyaltyRef.update({
        totalPoints: newTotal,
        availablePoints: newAvailable,
        lifetimePoints: (loyalty?.lifetimePoints || 0) + pointsToEarn,
        currentTier: newTier,
        pointsHistory: history.slice(-50),
        lastActivity: new Date(),
        updatedAt: new Date(),
      });

      logger.info(`Earned ${pointsToEarn} points for user ${booking.userId}`);

    } catch (error) {
      logger.error('Error earning points from booking:', error);
    }
  }
);

// Redeem reward
export const redeemReward = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { rewardId } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!rewardId) {
      throw new HttpsError('invalid-argument', 'Reward ID is required');
    }

    try {
      const db = getFirestore();

      const loyaltyRef = db.collection('user_loyalty').doc(userId);
      const loyaltyDoc = await loyaltyRef.get();

      if (!loyaltyDoc.exists) {
        throw new HttpsError('not-found', 'Loyalty account not found');
      }

      const loyalty = loyaltyDoc.data();
      const rewardDoc = await db.collection('loyalty_rewards').doc(rewardId).get();

      if (!rewardDoc.exists) {
        throw new HttpsError('not-found', 'Reward not found');
      }

      const reward = rewardDoc.data();

      if (!reward?.isActive) {
        throw new HttpsError('failed-precondition', 'Reward is not available');
      }

      if (loyalty?.availablePoints < reward.pointsCost) {
        throw new HttpsError('failed-precondition', 'Insufficient points');
      }

      const redemptionRef = db.collection('reward_redemptions').doc();
      const redemption = {
        id: redemptionRef.id,
        userId,
        rewardId,
        pointsSpent: reward.pointsCost,
        rewardDetails: reward,
        redeemedAt: new Date(),
        orderId: null,
        usedAt: null,
      };

      const transactionRef = db.collection('points_transactions').doc();
      const transaction = {
        id: transactionRef.id,
        userId,
        type: 'redeemed',
        points: -reward.pointsCost,
        reason: `Ödül: ${reward.name}`,
        rewardId,
        createdAt: new Date(),
      };

      const batch = db.batch();
      batch.set(redemptionRef, redemption);
      batch.set(transactionRef, transaction);

      const updatedHistory = [...(loyalty?.pointsHistory || []), {
        id: transactionRef.id,
        type: 'redeemed',
        points: -reward.pointsCost,
        reason: transaction.reason,
        rewardId,
        createdAt: new Date(),
      }];

      batch.update(loyaltyRef, {
        availablePoints: (loyalty?.availablePoints || 0) - reward.pointsCost,
        pointsHistory: updatedHistory.slice(-50),
        lastActivity: new Date(),
        updatedAt: new Date(),
      });

      batch.update(rewardDoc.ref, {
        currentUsage: (reward.currentUsage || 0) + 1,
        updatedAt: new Date(),
      });

      await batch.commit();

      return { redemptionId: redemptionRef.id, redemption };

    } catch (error) {
      logger.error('Error redeeming reward:', error);
      throw new HttpsError('internal', 'Failed to redeem reward');
    }
  }
);

// Get user loyalty status
export const getUserLoyalty = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const db = getFirestore();

      const loyaltyDoc = await db.collection('user_loyalty').doc(userId).get();
      if (!loyaltyDoc.exists) {
        const loyaltyRef = db.collection('user_loyalty').doc(userId);
        const newLoyalty = {
          id: userId,
          userId,
          totalPoints: 0,
          availablePoints: 0,
          lifetimePoints: 0,
          currentTier: 'bronze',
          pointsHistory: [],
          redeemedRewards: [],
          joinedAt: new Date(),
          lastActivity: new Date(),
          updatedAt: new Date(),
        };

        await loyaltyRef.set(newLoyalty);
        return newLoyalty;
      }

      return loyaltyDoc.data();

    } catch (error) {
      logger.error('Error getting user loyalty:', error);
      throw new HttpsError('internal', 'Failed to get loyalty status');
    }
  }
);

// Get available rewards
export const getAvailableRewards = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const db = getFirestore();

      const loyaltyDoc = await db.collection('user_loyalty').doc(userId).get();
      const availablePoints = loyaltyDoc.exists ? loyaltyDoc.data()?.availablePoints || 0 : 0;

      const rewardsSnapshot = await db.collection('loyalty_rewards')
        .where('isActive', '==', true)
        .where('pointsCost', '<=', availablePoints)
        .orderBy('pointsCost')
        .get();

      const rewards = rewardsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { rewards, availablePoints };

    } catch (error) {
      logger.error('Error getting available rewards:', error);
      throw new HttpsError('internal', 'Failed to get rewards');
    }
  }
);