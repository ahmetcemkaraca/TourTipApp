import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch,
  runTransaction,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { CartItem, CartItemSchema } from './firestore-collections';
import { FirestoreService } from './firestore-service';

export class CartService extends FirestoreService<CartItem> {
  constructor() {
    super('cart', CartItemSchema);
  }

  // Add item to cart
  async addToCart(userId: string, cartData: Omit<CartItem, 'id' | 'userId' | 'status' | 'expiresAt' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Set expiration time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const cartItem: Omit<CartItem, 'id'> = {
        userId,
        ...cartData,
        status: 'active',
        expiresAt,
      };

      return await this.create(cartItem);
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  // Get user's cart items
  async getUserCart(userId: string): Promise<CartItem[]> {
    try {
      // Clean expired items first
      await this.cleanExpiredItems(userId);

      const result = await this.list({
        filters: [
          { field: 'userId', operator: '==', value: userId },
          { field: 'status', operator: '==', value: 'active' }
        ],
        orderField: 'createdAt',
        orderDirection: 'desc'
      });

      return result.data;
    } catch (error) {
      console.error('Error getting user cart:', error);
      throw error;
    }
  }

  // Update cart item
  async updateCartItem(cartItemId: string, updates: Partial<Omit<CartItem, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    try {
      // Extend expiration time when updating
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await this.update(cartItemId, {
        ...updates,
        expiresAt,
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeFromCart(cartItemId: string): Promise<void> {
    try {
      await this.delete(cartItemId);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  // Clear user's entire cart
  async clearCart(userId: string): Promise<void> {
    try {
      const cartItems = await this.getUserCart(userId);
      
      if (cartItems.length === 0) return;

      const batch = writeBatch(db);
      const cartCollection = collection(db, 'cart');

      cartItems.forEach(item => {
        const docRef = doc(cartCollection, item.id);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Reserve cart items (when user goes to checkout)
  async reserveCartItems(userId: string, reservationTime: number = 15): Promise<void> {
    try {
      const cartItems = await this.getUserCart(userId);
      
      if (cartItems.length === 0) return;

      const batch = writeBatch(db);
      const cartCollection = collection(db, 'cart');
      
      // Set reservation expiration (15 minutes by default)
      const reservationExpiry = new Date();
      reservationExpiry.setMinutes(reservationExpiry.getMinutes() + reservationTime);

      cartItems.forEach(item => {
        const docRef = doc(cartCollection, item.id);
        batch.update(docRef, {
          status: 'reserved',
          expiresAt: Timestamp.fromDate(reservationExpiry),
          updatedAt: Timestamp.now(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error reserving cart items:', error);
      throw error;
    }
  }

  // Release reserved items (if checkout is cancelled)
  async releaseReservedItems(userId: string): Promise<void> {
    try {
      const result = await this.list({
        filters: [
          { field: 'userId', operator: '==', value: userId },
          { field: 'status', operator: '==', value: 'reserved' }
        ]
      });

      if (result.data.length === 0) return;

      const batch = writeBatch(db);
      const cartCollection = collection(db, 'cart');
      
      // Reset to active status with extended expiry
      const newExpiry = new Date();
      newExpiry.setHours(newExpiry.getHours() + 24);

      result.data.forEach(item => {
        const docRef = doc(cartCollection, item.id);
        batch.update(docRef, {
          status: 'active',
          expiresAt: Timestamp.fromDate(newExpiry),
          updatedAt: Timestamp.now(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error releasing reserved items:', error);
      throw error;
    }
  }

  // Check if specific tour date/time is already in cart
  async isInCart(userId: string, serviceId: string, selectedDate: string, timeSlot?: string): Promise<boolean> {
    try {
      const filters = [
        { field: 'userId', operator: '==', value: userId },
        { field: 'serviceId', operator: '==', value: serviceId },
        { field: 'selectedDate', operator: '==', value: selectedDate },
        { field: 'status', operator: 'in', value: ['active', 'reserved'] }
      ];

      const result = await this.list({ filters });
      
      // If no time slot specified, just check service and date
      if (!timeSlot) {
        return result.data.length > 0;
      }

      // Check specific time slot
      return result.data.some(item => item.timeSlot === timeSlot);
    } catch (error) {
      console.error('Error checking if item is in cart:', error);
      return false;
    }
  }

  // Calculate cart totals
  calculateCartTotals(cartItems: CartItem[]): {
    itemCount: number;
    subtotal: number;
    addOnsTotal: number;
    insuranceTotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
    currency: string;
  } {
    let itemCount = 0;
    let subtotal = 0;
    let addOnsTotal = 0;
    let insuranceTotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    const currency = cartItems.length > 0 ? cartItems[0].pricing.currency : 'TRY';

    cartItems.forEach(item => {
      itemCount++;
      subtotal += item.pricing.basePrice;
      addOnsTotal += item.pricing.addOnsTotal;
      insuranceTotal += item.pricing.insuranceTotal;
      taxTotal += item.pricing.taxAmount;
      discountTotal += item.pricing.discountAmount;
    });

    const grandTotal = subtotal + addOnsTotal + insuranceTotal + taxTotal - discountTotal;

    return {
      itemCount,
      subtotal,
      addOnsTotal,
      insuranceTotal,
      taxTotal,
      discountTotal,
      grandTotal,
      currency,
    };
  }

  // Clean expired cart items
  async cleanExpiredItems(userId?: string): Promise<number> {
    try {
      const now = new Date();
      const filters = [
        { field: 'expiresAt', operator: '<', value: Timestamp.fromDate(now) }
      ];

      if (userId) {
        filters.push({ field: 'userId', operator: '==', value: userId });
      }

      const result = await this.list({ filters });
      
      if (result.data.length === 0) return 0;

      const batch = writeBatch(db);
      const cartCollection = collection(db, 'cart');

      result.data.forEach(item => {
        const docRef = doc(cartCollection, item.id);
        batch.delete(docRef);
      });

      await batch.commit();
      return result.data.length;
    } catch (error) {
      console.error('Error cleaning expired cart items:', error);
      return 0;
    }
  }

  // Real-time cart listener
  onCartChange(userId: string, callback: (cartItems: CartItem[]) => void): () => void {
    const cartCollection = collection(db, 'cart');
    const q = query(
      cartCollection,
      where('userId', '==', userId),
      where('status', 'in', ['active', 'reserved']),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const cartItems: CartItem[] = [];
      
      snapshot.forEach(doc => {
        try {
          const data = { id: doc.id, ...doc.data() } as CartItem;
          const validatedData = CartItemSchema.parse(data);
          cartItems.push(validatedData);
        } catch (error) {
          console.warn(`Invalid cart item data for ${doc.id}:`, error);
        }
      });

      callback(cartItems);
    }, (error) => {
      console.error('Cart listener error:', error);
    });
  }

  // Validate cart item availability before checkout
  async validateCartAvailability(cartItems: CartItem[]): Promise<{
    valid: boolean;
    unavailableItems: string[];
    conflictingItems: string[];
  }> {
    try {
      const unavailableItems: string[] = [];
      const conflictingItems: string[] = [];

      // This would typically check against tour availability data
      // For now, we'll do basic validation
      for (const item of cartItems) {
        // Check if the selected date is in the past
        const selectedDate = new Date(item.selectedDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (selectedDate < now) {
          unavailableItems.push(item.id);
          continue;
        }

        // Check if item is expired
        if (item.expiresAt < new Date()) {
          unavailableItems.push(item.id);
          continue;
        }

        // Additional availability checks would go here
        // e.g., checking against tour capacity, provider availability, etc.
      }

      return {
        valid: unavailableItems.length === 0 && conflictingItems.length === 0,
        unavailableItems,
        conflictingItems,
      };
    } catch (error) {
      console.error('Error validating cart availability:', error);
      return {
        valid: false,
        unavailableItems: cartItems.map(item => item.id),
        conflictingItems: [],
      };
    }
  }

  // Merge guest cart with user cart (after login)
  async mergeGuestCart(userId: string, guestCartItems: Omit<CartItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      if (guestCartItems.length === 0) return;

      // Get existing user cart
      const existingCart = await this.getUserCart(userId);
      
      // Check for duplicates and merge
      const itemsToAdd: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>[] = [];

      for (const guestItem of guestCartItems) {
        const isDuplicate = existingCart.some(existing => 
          existing.serviceId === guestItem.serviceId &&
          existing.selectedDate === guestItem.selectedDate &&
          existing.timeSlot === guestItem.timeSlot
        );

        if (!isDuplicate) {
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          itemsToAdd.push({
            userId,
            ...guestItem,
            expiresAt,
          });
        }
      }

      // Batch add new items
      if (itemsToAdd.length > 0) {
        const batch = writeBatch(db);
        const cartCollection = collection(db, 'cart');

        itemsToAdd.forEach(item => {
          const docRef = doc(cartCollection);
          batch.set(docRef, {
            ...item,
            id: docRef.id,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        });

        await batch.commit();
      }
    } catch (error) {
      console.error('Error merging guest cart:', error);
      throw error;
    }
  }
}

// Export cart service instance
export const cartService = new CartService();
