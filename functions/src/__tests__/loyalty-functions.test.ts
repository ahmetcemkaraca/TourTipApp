import { describe, it, expect, vi, beforeEach } from 'vitest'
import { httpsCallable } from 'firebase/functions'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'
import { redeemReward } from '../loyalty-functions'

// Mock Firebase functions
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}))

vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  firestore: {
    Timestamp: {
      now: vi.fn(() => ({ toDate: () => new Date() })),
    },
  },
}))

describe('Loyalty Functions', () => {
  let mockRequest: any
  let mockResponse: any
  let mockContext: any

  beforeEach(() => {
    mockRequest = {
      auth: {
        uid: 'test-user-id',
      },
    }

    mockResponse = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    }

    mockContext = {
      params: {
        bookingId: 'test-booking-id',
      },
    }

    vi.clearAllMocks()
  })

  describe('redeemReward', () => {
    it('should successfully redeem a reward with sufficient points', async () => {
      // Mock Firestore calls
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          availablePoints: 500,
          pointsHistory: [],
          redeemedRewards: [],
        }),
      }

      const mockRewardDoc = {
        exists: () => true,
        data: () => ({
          pointsCost: 200,
          isActive: true,
          currentUsage: 0,
          usageLimit: 10,
        }),
      }

      ;(getDoc as any).mockResolvedValueOnce(mockUserDoc)
      ;(getDoc as any).mockResolvedValueOnce(mockRewardDoc)

      const mockRequest = {
        data: { rewardId: 'test-reward-id' },
        auth: { uid: 'test-user-id' },
      }

      await expect(redeemReward(mockRequest)).resolves.toBeDefined()

      // Verify Firestore calls
      expect(getDoc).toHaveBeenCalledWith(expect.anything())
      expect(setDoc).toHaveBeenCalled()
    })

    it('should throw error for insufficient points', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          availablePoints: 100, // Less than required 200
          pointsHistory: [],
          redeemedRewards: [],
        }),
      }

      ;(getDoc as any).mockResolvedValue(mockUserDoc)

      const mockRequest = {
        data: { rewardId: 'test-reward-id' },
        auth: { uid: 'test-user-id' },
      }

      await expect(redeemReward(mockRequest)).rejects.toThrow('Insufficient points')
    })

    it('should throw error for non-existent reward', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          availablePoints: 500,
          pointsHistory: [],
          redeemedRewards: [],
        }),
      }

      const mockRewardDoc = {
        exists: () => false,
      }

      ;(getDoc as any).mockResolvedValueOnce(mockUserDoc)
      ;(getDoc as any).mockResolvedValueOnce(mockRewardDoc)

      const mockRequest = {
        data: { rewardId: 'non-existent-reward' },
        auth: { uid: 'test-user-id' },
      }

      await expect(redeemReward(mockRequest)).rejects.toThrow('Reward not found')
    })

    it('should throw error for unauthenticated user', async () => {
      const mockRequest = {
        data: { rewardId: 'test-reward-id' },
        auth: null,
      }

      await expect(redeemReward(mockRequest)).rejects.toThrow('User must be authenticated')
    })
  })

  describe('getUserLoyalty', () => {
    it('should return user loyalty data for existing user', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          totalPoints: 1000,
          availablePoints: 800,
          currentTier: 'silver',
          pointsHistory: [],
          redeemedRewards: [],
        }),
      }

      ;(getDoc as any).mockResolvedValue(mockUserDoc)

      const mockRequest = {
        auth: { uid: 'test-user-id' },
      }

      const result = await getUserLoyalty(mockRequest)

      expect(result).toEqual({
        totalPoints: 1000,
        availablePoints: 800,
        currentTier: 'silver',
        pointsHistory: [],
        redeemedRewards: [],
      })
    })

    it('should create new loyalty account for non-existing user', async () => {
      const mockUserDoc = {
        exists: () => false,
      }

      ;(getDoc as any).mockResolvedValue(mockUserDoc)

      const mockRequest = {
        auth: { uid: 'new-user-id' },
      }

      const result = await getUserLoyalty(mockRequest)

      expect(setDoc).toHaveBeenCalled()
      expect(result).toHaveProperty('totalPoints', 0)
      expect(result).toHaveProperty('availablePoints', 0)
      expect(result).toHaveProperty('currentTier', 'bronze')
    })
  })

  describe('getAvailableRewards', () => {
    it('should return available rewards for user', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          availablePoints: 500,
        }),
      }

      const mockRewardsSnapshot = {
        docs: [
          {
            id: 'reward-1',
            data: () => ({
              pointsCost: 200,
              isActive: true,
            }),
          },
          {
            id: 'reward-2',
            data: () => ({
              pointsCost: 600, // More than user's points
              isActive: true,
            }),
          },
        ],
      }

      ;(getDoc as any).mockResolvedValue(mockUserDoc)
      ;(getDocs as any).mockResolvedValue(mockRewardsSnapshot)

      const mockRequest = {
        auth: { uid: 'test-user-id' },
      }

      const result = await getAvailableRewards(mockRequest)

      expect(result.rewards).toHaveLength(1)
      expect(result.rewards[0].id).toBe('reward-1')
      expect(result.availablePoints).toBe(500)
    })

    it('should return empty array for user with no points', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          availablePoints: 0,
        }),
      }

      ;(getDoc as any).mockResolvedValue(mockUserDoc)

      const mockRequest = {
        auth: { uid: 'test-user-id' },
      }

      const result = await getAvailableRewards(mockRequest)

      expect(result.rewards).toHaveLength(0)
      expect(result.availablePoints).toBe(0)
    })
  })
})
