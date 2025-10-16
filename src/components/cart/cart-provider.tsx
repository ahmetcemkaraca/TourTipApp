'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cartService } from '@/lib/cart-service';
import { CartItem } from '@/lib/firestore-collections';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotals: {
    itemCount: number;
    subtotal: number;
    addOnsTotal: number;
    insuranceTotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
    currency: string;
  };
  loading: boolean;
  addToCart: (cartData: Omit<CartItem, 'id' | 'userId' | 'status' | 'expiresAt' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCartItem: (cartItemId: string, updates: Partial<CartItem>) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (serviceId: string, selectedDate: string, timeSlot?: string) => boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate cart totals
  const cartTotals = cartService.calculateCartTotals(cartItems);
  const cartCount = cartItems.length;

  // Load cart items when user changes
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  // Set up real-time listener for cart changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = cartService.onCartChange(user.uid, (items) => {
      setCartItems(items);
    });

    return unsubscribe;
  }, [user]);

  // Load cart items
  const loadCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const items = await cartService.getUserCart(user.uid);
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Sepet yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (cartData: Omit<CartItem, 'id' | 'userId' | 'status' | 'expiresAt' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error('Sepete eklemek için giriş yapmalısınız.');
      return;
    }

    try {
      // Check if item is already in cart
      const alreadyInCart = await cartService.isInCart(
        user.uid, 
        cartData.serviceId, 
        cartData.selectedDate, 
        cartData.timeSlot
      );

      if (alreadyInCart) {
        toast.error('Bu tur zaten sepetinizde bulunuyor.');
        return;
      }

      await cartService.addToCart(user.uid, cartData);
      toast.success('Tur sepete eklendi!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Sepete eklerken hata oluştu.');
    }
  };

  // Update cart item
  const updateCartItem = async (cartItemId: string, updates: Partial<CartItem>) => {
    try {
      await cartService.updateCartItem(cartItemId, updates);
      toast.success('Sepet güncellendi.');
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast.error('Sepet güncellenirken hata oluştu.');
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemId: string) => {
    try {
      await cartService.removeFromCart(cartItemId);
      toast.success('Tur sepetten çıkarıldı.');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Sepetten çıkarırken hata oluştu.');
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!user) return;

    try {
      await cartService.clearCart(user.uid);
      toast.success('Sepet temizlendi.');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Sepet temizlenirken hata oluştu.');
    }
  };

  // Check if item is in cart
  const isInCart = (serviceId: string, selectedDate: string, timeSlot?: string): boolean => {
    return cartItems.some(item => 
      item.serviceId === serviceId &&
      item.selectedDate === selectedDate &&
      (!timeSlot || item.timeSlot === timeSlot)
    );
  };

  // Refresh cart manually
  const refreshCart = async () => {
    await loadCart();
  };

  const value = {
    cartItems,
    cartCount,
    cartTotals,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    isInCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
