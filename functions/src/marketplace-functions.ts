import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentUpdated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

// Process restaurant order
export const processRestaurantOrder = onCall(
  {
    region: 'europe-west1',
    memory: '512MiB',
  },
  async (request: CallableRequest) => {
    const { restaurantId, items, deliveryAddress, paymentMethod, notes } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!restaurantId || !items || items.length === 0) {
      throw new HttpsError('invalid-argument', 'Restaurant ID and items are required');
    }

    try {
      const db = getFirestore();
      const batch = db.batch();

      // Verify restaurant exists and is active
      const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
      if (!restaurantDoc.exists) {
        throw new HttpsError('not-found', 'Restaurant not found');
      }

      const restaurant = restaurantDoc.data();
      if (!restaurant?.isActive) {
        throw new HttpsError('failed-precondition', 'Restaurant is not available');
      }

      // Check inventory for each item
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const menuItemDoc = await db.collection('restaurants').doc(restaurantId)
          .collection('menu').doc(item.menuItemId).get();

        if (!menuItemDoc.exists) {
          throw new HttpsError('not-found', `Menu item ${item.menuItemId} not found`);
        }

        const menuItem = menuItemDoc.data();

        // Check availability and inventory
        if (!menuItem?.isAvailable || menuItem?.inventory < item.quantity) {
          throw new HttpsError('failed-precondition',
            `Insufficient inventory for ${menuItem?.name}`);
        }

        const itemTotal = menuItem.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          menuItemId: item.menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
          total: itemTotal,
          specialInstructions: item.specialInstructions,
        });

        // Update inventory
        batch.update(menuItemDoc.ref, {
          inventory: menuItem.inventory - item.quantity,
          updatedAt: new Date(),
        });
      }

      // Add delivery fee if applicable
      if (restaurant.deliveryFee > 0) {
        totalAmount += restaurant.deliveryFee;
      }

      // Create order
      const orderRef = db.collection('marketplace_orders').doc();
      const orderData = {
        id: orderRef.id,
        userId,
        restaurantId,
        type: 'restaurant',
        items: orderItems,
        totalAmount,
        deliveryAddress,
        paymentMethod,
        notes,
        status: 'confirmed',
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      batch.set(orderRef, orderData);

      // Create notification for restaurant
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        userId: restaurant.ownerId,
        type: 'order',
        title: 'Yeni Sipariş',
        message: `${orderItems.length} adet ürün için yeni sipariş alındı`,
        data: { orderId: orderRef.id },
        status: 'pending',
        priority: 'high',
        channels: ['push', 'in_app'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await batch.commit();

      return {
        orderId: orderRef.id,
        estimatedDeliveryTime: orderData.estimatedDeliveryTime,
        totalAmount,
      };

  } catch (error) {
      logger.error('Error processing restaurant order:', error);
      throw new HttpsError('internal', 'Failed to process order');
    }
  }
);

// Process shop order
export const processShopOrder = onCall(
  {
    region: 'europe-west1',
    memory: '512MiB',
  },
  async (request: CallableRequest) => {
    const { shopId, items, deliveryAddress, paymentMethod, notes } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

    if (!shopId || !items || items.length === 0) {
      throw new HttpsError('invalid-argument', 'Shop ID and items are required');
    }

    try {
      const db = getFirestore();
      const batch = db.batch();

      // Verify shop exists and is active
      const shopDoc = await db.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) {
        throw new HttpsError('not-found', 'Shop not found');
      }

      const shop = shopDoc.data();
      if (!shop?.isActive) {
        throw new HttpsError('failed-precondition', 'Shop is not available');
      }

      // Process items and check inventory
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const productDoc = await db.collection('shops').doc(shopId)
          .collection('products').doc(item.productId).get();

        if (!productDoc.exists) {
          throw new HttpsError('not-found', `Product ${item.productId} not found`);
        }

        const product = productDoc.data();

        // Check availability and inventory
        if (!product?.isAvailable || product?.inventory < item.quantity) {
          throw new HttpsError('failed-precondition',
            `Insufficient inventory for ${product?.name}`);
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          productId: item.productId,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          total: itemTotal,
          specialInstructions: item.specialInstructions,
        });

        // Update inventory
        batch.update(productDoc.ref, {
          inventory: product.inventory - item.quantity,
          updatedAt: new Date(),
        });
      }

      // Add delivery fee if applicable
      if (shop.deliveryFee > 0) {
        totalAmount += shop.deliveryFee;
      }

      // Create order
      const orderRef = db.collection('marketplace_orders').doc();
      const orderData = {
        id: orderRef.id,
        userId,
        shopId,
        type: 'shop',
        items: orderItems,
        totalAmount,
        deliveryAddress,
        paymentMethod,
        notes,
        status: 'confirmed',
        estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      batch.set(orderRef, orderData);

      // Create notification for shop
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        userId: shop.ownerId,
        type: 'order',
        title: 'Yeni Sipariş',
        message: `${orderItems.length} adet ürün için yeni sipariş alındı`,
        data: { orderId: orderRef.id },
        status: 'pending',
        priority: 'high',
        channels: ['push', 'in_app'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await batch.commit();

    return {
        orderId: orderRef.id,
        estimatedDeliveryTime: orderData.estimatedDeliveryTime,
        totalAmount,
    };

  } catch (error) {
      logger.error('Error processing shop order:', error);
      throw new HttpsError('internal', 'Failed to process order');
    }
  }
);

// Update order status
export const updateOrderStatus = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { orderId, status, notes } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

    if (!orderId || !status) {
      throw new HttpsError('invalid-argument', 'Order ID and status are required');
    }

    try {
      const db = getFirestore();

      // Get order
      const orderDoc = await db.collection('marketplace_orders').doc(orderId).get();
      if (!orderDoc.exists) {
        throw new HttpsError('not-found', 'Order not found');
      }

      const order = orderDoc.data();

      // Verify user has permission (order owner or restaurant/shop owner)
      if (order?.userId !== userId) {
        // Check if user is restaurant/shop owner
        let isOwner = false;
        if (order?.type === 'restaurant') {
          const restaurantDoc = await db.collection('restaurants').doc(order.restaurantId).get();
          isOwner = restaurantDoc.data()?.ownerId === userId;
        } else if (order?.type === 'shop') {
          const shopDoc = await db.collection('shops').doc(order.shopId).get();
          isOwner = shopDoc.data()?.ownerId === userId;
        }

        if (!isOwner) {
      throw new HttpsError('permission-denied', 'Access denied');
    }
      }

      // Update order status
      await orderDoc.ref.update({
        status,
        notes,
        updatedAt: new Date(),
      });

      return { success: true };

    } catch (error) {
      logger.error('Error updating order status:', error);
      throw new HttpsError('internal', 'Failed to update order status');
    }
  }
);

// Get restaurant menu with real-time inventory
export const getRestaurantMenu = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { restaurantId } = request.data;

    if (!restaurantId) {
      throw new HttpsError('invalid-argument', 'Restaurant ID is required');
    }

    try {
      const db = getFirestore();

      // Get restaurant
      const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
      if (!restaurantDoc.exists) {
        throw new HttpsError('not-found', 'Restaurant not found');
      }

      // Get menu items
      const menuSnapshot = await db.collection('restaurants')
        .doc(restaurantId)
        .collection('menu')
        .where('isAvailable', '==', true)
        .orderBy('category')
        .orderBy('sortOrder')
        .get();

      const menuItems = menuSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        restaurant: restaurantDoc.data(),
        menuItems,
      };

    } catch (error) {
      logger.error('Error getting restaurant menu:', error);
      throw new HttpsError('internal', 'Failed to get menu');
    }
  }
);

// Get shop products with real-time inventory
export const getShopProducts = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { shopId, category } = request.data;

    if (!shopId) {
      throw new HttpsError('invalid-argument', 'Shop ID is required');
    }

    try {
      const db = getFirestore();

      // Get shop
      const shopDoc = await db.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) {
        throw new HttpsError('not-found', 'Shop not found');
      }

      // Get products
      let query = db.collection('shops')
        .doc(shopId)
        .collection('products')
        .where('isAvailable', '==', true);

      if (category) {
        query = query.where('category', '==', category);
      }

      query = query.orderBy('category').orderBy('sortOrder');

      const productsSnapshot = await query.get();

      const products = productsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
    
    return {
        shop: shopDoc.data(),
        products,
    };

  } catch (error) {
      logger.error('Error getting shop products:', error);
      throw new HttpsError('internal', 'Failed to get products');
    }
  }
);

// Update product inventory
export const updateProductInventory = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { type, businessId, productId, newInventory, operation } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!type || !businessId || !productId || newInventory === undefined) {
      throw new HttpsError('invalid-argument', 'All fields are required');
    }

    try {
      const db = getFirestore();

      // Verify ownership
      let collectionName = '';
      if (type === 'restaurant') {
        collectionName = 'restaurants';
      } else if (type === 'shop') {
        collectionName = 'shops';
      } else {
        throw new HttpsError('invalid-argument', 'Invalid type');
      }

      const businessDoc = await db.collection(collectionName).doc(businessId).get();
      if (!businessDoc.exists || businessDoc.data()?.ownerId !== userId) {
        throw new HttpsError('permission-denied', 'Access denied');
      }

      // Update inventory
      const productRef = db.collection(collectionName)
        .doc(businessId)
        .collection(type === 'restaurant' ? 'menu' : 'products')
        .doc(productId);

      const productDoc = await productRef.get();
      if (!productDoc.exists) {
        throw new HttpsError('not-found', 'Product not found');
      }

      let finalInventory = newInventory;
      if (operation === 'increment' || operation === 'decrement') {
        const currentInventory = productDoc.data()?.inventory || 0;
        finalInventory = operation === 'increment'
          ? currentInventory + newInventory
          : Math.max(0, currentInventory - newInventory);
      }

      await productRef.update({
        inventory: finalInventory,
        updatedAt: new Date(),
      });

      return { success: true, newInventory: finalInventory };

  } catch (error) {
      logger.error('Error updating product inventory:', error);
      throw new HttpsError('internal', 'Failed to update inventory');
    }
  }
);

// Auto-update low inventory notifications for restaurants
export const checkLowInventory = onDocumentUpdated(
  'restaurants/{restaurantId}/menu/{menuItemId}',
  async (event: FirestoreEvent<any, any>) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();

    if (!newData || !previousData) return;

    // Check if inventory dropped below threshold
    if (newData.inventory <= 5 && previousData.inventory > 5) {
      const db = getFirestore();

      // Get restaurant info
      const restaurantDoc = await db.collection('restaurants').doc(event.params.restaurantId).get();
      const restaurant = restaurantDoc.data();

      // Create notification
      await db.collection('notifications').add({
        userId: restaurant?.ownerId,
        type: 'inventory_alert',
        title: 'Stok Uyarısı',
        message: `${newData.name} ürününde stok azaldı (${newData.inventory} adet kaldı)`,
        data: {
          restaurantId: event.params.restaurantId,
          menuItemId: event.params.menuItemId,
        },
        status: 'pending',
        priority: 'medium',
        channels: ['push', 'in_app'],
        createdAt: new Date(),
        updatedAt: new Date(),
          });
        }
      }
);

// Auto-update low inventory notifications for shops
export const checkShopLowInventory = onDocumentUpdated(
  'shops/{shopId}/products/{productId}',
  async (event: FirestoreEvent<any, any>) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();

    if (!newData || !previousData) return;

    // Check if inventory dropped below threshold
    if (newData.inventory <= 5 && previousData.inventory > 5) {
      const db = getFirestore();

      // Get shop info
      const shopDoc = await db.collection('shops').doc(event.params.shopId).get();
      const shop = shopDoc.data();

      // Create notification
      await db.collection('notifications').add({
        userId: shop?.ownerId,
        type: 'inventory_alert',
        title: 'Stok Uyarısı',
        message: `${newData.name} ürününde stok azaldı (${newData.inventory} adet kaldı)`,
        data: {
          shopId: event.params.shopId,
          productId: event.params.productId,
        },
        status: 'pending',
        priority: 'medium',
        channels: ['push', 'in_app'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
);