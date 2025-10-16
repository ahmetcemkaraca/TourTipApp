// Marketplace service for managing restaurants, shops, products, and orders
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  Timestamp,
  writeBatch,
  runTransaction,
  DocumentSnapshot
} from 'firebase/firestore';
import { GeoFirestore } from 'geofirestore';
import { geohashForLocation } from 'geofire-common';
import { db } from './firebase';
import { geolocationService } from './geolocation-service';
import { 
  Restaurant, 
  Shop, 
  Product, 
  MenuItem, 
  Order, 
  Inventory,
  MarketplaceSearchParams,
  ProductSearchParams,
  MenuSearchParams,
  OrderStatus,
  PaymentStatus
} from '@/lib/firestore-collections';
import { Coordinates } from '@/types/location';

class MarketplaceService {
  private geoFirestore: GeoFirestore;

  constructor() {
    this.geoFirestore = new GeoFirestore(db);
  }

  // Restaurant Management
  async createRestaurant(restaurantData: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt' | 'geohash'>): Promise<string> {
    try {
      const data = {
        ...restaurantData,
        geohash: geohashForLocation([restaurantData.coordinates.latitude, restaurantData.coordinates.longitude]),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const geoCollection = this.geoFirestore.collection('restaurants');
      const docRef = await geoCollection.add(data);
      return docRef.id;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  }

  async updateRestaurant(restaurantId: string, updates: Partial<Omit<Restaurant, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      // Update geohash if coordinates changed
      if (updates.coordinates) {
        updateData.geohash = geohashForLocation([
          updates.coordinates.latitude, 
          updates.coordinates.longitude
        ]);
      }

      const geoCollection = this.geoFirestore.collection('restaurants');
      await geoCollection.doc(restaurantId).update(updateData);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      throw error;
    }
  }

  async getRestaurant(restaurantId: string): Promise<Restaurant | null> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Restaurant;
      }
      return null;
    } catch (error) {
      console.error('Error getting restaurant:', error);
      throw error;
    }
  }

  // Shop Management
  async createShop(shopData: Omit<Shop, 'id' | 'createdAt' | 'updatedAt' | 'geohash'>): Promise<string> {
    try {
      const data = {
        ...shopData,
        geohash: geohashForLocation([shopData.coordinates.latitude, shopData.coordinates.longitude]),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const geoCollection = this.geoFirestore.collection('shops');
      const docRef = await geoCollection.add(data);
      return docRef.id;
    } catch (error) {
      console.error('Error creating shop:', error);
      throw error;
    }
  }

  async updateShop(shopId: string, updates: Partial<Omit<Shop, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      if (updates.coordinates) {
        updateData.geohash = geohashForLocation([
          updates.coordinates.latitude, 
          updates.coordinates.longitude
        ]);
      }

      const geoCollection = this.geoFirestore.collection('shops');
      await geoCollection.doc(shopId).update(updateData);
    } catch (error) {
      console.error('Error updating shop:', error);
      throw error;
    }
  }

  async getShop(shopId: string): Promise<Shop | null> {
    try {
      const docRef = doc(db, 'shops', shopId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Shop;
      }
      return null;
    } catch (error) {
      console.error('Error getting shop:', error);
      throw error;
    }
  }

  // Product Management
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await updateDoc(doc(db, 'products', productId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    try {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
      }
      return null;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  }

  async getProductsByShop(shopId: string, params?: ProductSearchParams): Promise<Product[]> {
    try {
      let q = query(
        collection(db, 'products'),
        where('shopId', '==', shopId),
        where('isActive', '==', true)
      );

      if (params?.category) {
        q = query(q, where('category', '==', params.category));
      }

      if (params?.inStock) {
        q = query(q, where('inventory.availableStock', '>', 0));
      }

      if (params?.sortBy) {
        switch (params.sortBy) {
          case 'price':
            q = query(q, orderBy('price'));
            break;
          case 'popularity':
            q = query(q, orderBy('salesCount', 'desc'));
            break;
          case 'rating':
            q = query(q, orderBy('rating', 'desc'));
            break;
          case 'newest':
            q = query(q, orderBy('createdAt', 'desc'));
            break;
        }
      }

      if (params?.limit) {
        q = query(q, limit(params.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
    } catch (error) {
      console.error('Error getting products by shop:', error);
      throw error;
    }
  }

  // Menu Item Management
  async createMenuItem(menuItemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'menuItems'), {
        ...menuItemData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  }

  async updateMenuItem(menuItemId: string, updates: Partial<Omit<MenuItem, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await updateDoc(doc(db, 'menuItems', menuItemId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  async getMenuItem(menuItemId: string): Promise<MenuItem | null> {
    try {
      const docRef = doc(db, 'menuItems', menuItemId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as MenuItem;
      }
      return null;
    } catch (error) {
      console.error('Error getting menu item:', error);
      throw error;
    }
  }

  async getMenuByRestaurant(restaurantId: string, params?: MenuSearchParams): Promise<MenuItem[]> {
    try {
      let q = query(
        collection(db, 'menuItems'),
        where('restaurantId', '==', restaurantId),
        where('isActive', '==', true)
      );

      if (params?.category) {
        q = query(q, where('category', '==', params.category));
      }

      if (params?.dietary?.includes('vegetarian')) {
        q = query(q, where('isVegetarian', '==', true));
      }

      if (params?.dietary?.includes('vegan')) {
        q = query(q, where('isVegan', '==', true));
      }

      if (params?.dietary?.includes('gluten_free')) {
        q = query(q, where('isGlutenFree', '==', true));
      }

      if (params?.sortBy) {
        switch (params.sortBy) {
          case 'price':
            q = query(q, orderBy('price'));
            break;
          case 'popularity':
            q = query(q, orderBy('orderCount', 'desc'));
            break;
          case 'preparation_time':
            q = query(q, orderBy('preparationTime'));
            break;
        }
      }

      if (params?.limit) {
        q = query(q, limit(params.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
    } catch (error) {
      console.error('Error getting menu by restaurant:', error);
      throw error;
    }
  }

  // Order Management
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Create order
        const orderRef = doc(collection(db, 'orders'));
        const order = {
          ...orderData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        transaction.set(orderRef, order);

        // Update inventory for products
        for (const item of orderData.items) {
          if (item.type === 'product') {
            const productRef = doc(db, 'products', item.itemId);
            const productSnap = await transaction.get(productRef);
            
            if (productSnap.exists()) {
              const productData = productSnap.data() as Product;
              const newStock = productData.inventory.availableStock - item.quantity;
              
              if (newStock < 0) {
                throw new Error(`Insufficient stock for product: ${item.name}`);
              }
              
              transaction.update(productRef, {
                'inventory.availableStock': newStock,
                'inventory.reservedStock': productData.inventory.reservedStock + item.quantity,
                'salesCount': (productData.salesCount || 0) + item.quantity,
                updatedAt: Timestamp.now()
              });
            }
          } else if (item.type === 'menuItem') {
            const menuItemRef = doc(db, 'menuItems', item.itemId);
            const menuItemSnap = await transaction.get(menuItemRef);
            
            if (menuItemSnap.exists()) {
              const menuItemData = menuItemSnap.data() as MenuItem;
              transaction.update(menuItemRef, {
                orderCount: (menuItemData.orderCount || 0) + item.quantity,
                updatedAt: Timestamp.now()
              });
            }
          }
        }

        return orderRef.id;
      });
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, additionalData?: any): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      // Update timestamps based on status
      const timestampField = `timestamps.${this.getTimestampFieldForStatus(status)}`;
      updateData[timestampField] = Timestamp.now();

      // Add any additional data
      if (additionalData) {
        Object.assign(updateData, additionalData);
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<void> {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      }
      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  }

  async getOrdersByCustomer(customerId: string, limitCount?: number): Promise<Order[]> {
    try {
      let q = query(
        collection(db, 'orders'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Error getting orders by customer:', error);
      throw error;
    }
  }

  async getOrdersByVendor(vendorId: string, limitCount?: number): Promise<Order[]> {
    try {
      let q = query(
        collection(db, 'orders'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Error getting orders by vendor:', error);
      throw error;
    }
  }

  // Inventory Management
  async updateInventory(vendorId: string, inventoryData: Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const inventoryRef = doc(db, 'inventory', vendorId);
      await updateDoc(inventoryRef, {
        ...inventoryData,
        lastUpdated: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  async getInventory(vendorId: string): Promise<Inventory | null> {
    try {
      const docRef = doc(db, 'inventory', vendorId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Inventory;
      }
      return null;
    } catch (error) {
      console.error('Error getting inventory:', error);
      throw error;
    }
  }

  async checkLowStock(vendorId: string): Promise<any[]> {
    try {
      const inventory = await this.getInventory(vendorId);
      if (!inventory) return [];

      return inventory.items.filter(item => 
        item.availableStock <= item.reorderLevel
      );
    } catch (error) {
      console.error('Error checking low stock:', error);
      throw error;
    }
  }

  // Search Functions
  async searchMarketplace(params: MarketplaceSearchParams): Promise<any[]> {
    try {
      const results: any[] = [];

      if (params.type === 'restaurant' || params.type === 'all') {
        const restaurants = await this.searchRestaurants(params);
        results.push(...restaurants.map(r => ({ ...r, type: 'restaurant' })));
      }

      if (params.type === 'shop' || params.type === 'all') {
        const shops = await this.searchShops(params);
        results.push(...shops.map(s => ({ ...s, type: 'shop' })));
      }

      // Sort by specified criteria
      if (params.sortBy === 'distance' && params.location) {
        results.sort((a, b) => {
          const distanceA = geolocationService.calculateDistance(params.location!, a.coordinates);
          const distanceB = geolocationService.calculateDistance(params.location!, b.coordinates);
          return distanceA - distanceB;
        });
      } else if (params.sortBy === 'rating') {
        results.sort((a, b) => b.rating - a.rating);
      }

      return results.slice(0, params.limit || 20);
    } catch (error) {
      console.error('Error searching marketplace:', error);
      throw error;
    }
  }

  private async searchRestaurants(params: MarketplaceSearchParams): Promise<Restaurant[]> {
    if (params.location && params.radius) {
      const geoCollection = this.geoFirestore.collection('restaurants');
      const geoQuery = geoCollection.near({
        center: [params.location.latitude, params.location.longitude],
        radius: params.radius
      });

      const snapshot = await geoQuery.get();
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Restaurant))
        .filter(restaurant => {
          if (params.rating && restaurant.rating < params.rating) return false;
          if (params.features && !params.features.every(f => restaurant.features.includes(f as any))) return false;
          if (params.isOpen && !this.isCurrentlyOpen(restaurant.openingHours)) return false;
          return true;
        });
    }

    // Fallback to regular query
    let q = query(collection(db, 'restaurants'), where('isActive', '==', true));
    
    if (params.limit) {
      q = query(q, limit(params.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
  }

  private async searchShops(params: MarketplaceSearchParams): Promise<Shop[]> {
    if (params.location && params.radius) {
      const geoCollection = this.geoFirestore.collection('shops');
      const geoQuery = geoCollection.near({
        center: [params.location.latitude, params.location.longitude],
        radius: params.radius
      });

      const snapshot = await geoQuery.get();
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Shop))
        .filter(shop => {
          if (params.category && shop.category !== params.category) return false;
          if (params.rating && shop.rating < params.rating) return false;
          if (params.features && !params.features.every(f => shop.features.includes(f as any))) return false;
          if (params.isOpen && !this.isCurrentlyOpen(shop.openingHours)) return false;
          return true;
        });
    }

    // Fallback to regular query
    let q = query(collection(db, 'shops'), where('isActive', '==', true));
    
    if (params.category) {
      q = query(q, where('category', '==', params.category));
    }
    
    if (params.limit) {
      q = query(q, limit(params.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shop));
  }

  // Helper Functions
  private getTimestampFieldForStatus(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      'pending': 'ordered',
      'confirmed': 'confirmed',
      'preparing': 'preparing',
      'ready': 'ready',
      'out_for_delivery': 'outForDelivery',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'refunded': 'cancelled'
    };
    
    return statusMap[status] || 'ordered';
  }

  private isCurrentlyOpen(openingHours: any): boolean {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todaySchedule = openingHours[dayNames[currentDay]];

    if (!todaySchedule || todaySchedule.closed) {
      return false;
    }

    return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
  }

  // Analytics and Reporting
  async getVendorAnalytics(vendorId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const orders = await getDocs(query(
        collection(db, 'orders'),
        where('vendorId', '==', vendorId),
        where('createdAt', '>=', Timestamp.fromDate(dateRange.start)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.end))
      ));

      const analytics = {
        totalOrders: orders.size,
        totalRevenue: 0,
        averageOrderValue: 0,
        topItems: new Map(),
        ordersByStatus: new Map(),
        revenueByDay: new Map()
      };

      orders.docs.forEach(doc => {
        const order = doc.data() as Order;
        analytics.totalRevenue += order.pricing.total;

        // Count orders by status
        const statusCount = analytics.ordersByStatus.get(order.status) || 0;
        analytics.ordersByStatus.set(order.status, statusCount + 1);

        // Track top items
        order.items.forEach(item => {
          const itemCount = analytics.topItems.get(item.name) || 0;
          analytics.topItems.set(item.name, itemCount + item.quantity);
        });

        // Revenue by day
        const dayKey = order.createdAt.toDate().toDateString();
        const dayRevenue = analytics.revenueByDay.get(dayKey) || 0;
        analytics.revenueByDay.set(dayKey, dayRevenue + order.pricing.total);
      });

      analytics.averageOrderValue = analytics.totalOrders > 0 
        ? analytics.totalRevenue / analytics.totalOrders 
        : 0;

      return {
        ...analytics,
        topItems: Array.from(analytics.topItems.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10),
        ordersByStatus: Object.fromEntries(analytics.ordersByStatus),
        revenueByDay: Object.fromEntries(analytics.revenueByDay)
      };
    } catch (error) {
      console.error('Error getting vendor analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const marketplaceService = new MarketplaceService();
