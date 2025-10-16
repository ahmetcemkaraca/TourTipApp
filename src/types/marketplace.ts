// Marketplace types for restaurants, shops, and orders
import { Coordinates } from './location';

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  address: string;
  coordinates: Coordinates;
  phoneNumber: string;
  email?: string;
  website?: string;
  openingHours: OperatingHours;
  priceRange: 1 | 2 | 3 | 4; // $ to $$$$
  rating: number;
  reviewCount: number;
  features: RestaurantFeature[];
  images: string[];
  menuUrl?: string;
  deliveryRadius: number; // in kilometers
  minimumOrder: number;
  deliveryFee: number;
  estimatedDeliveryTime: number; // in minutes
  acceptsReservations: boolean;
  isActive: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  subcategory?: string;
  address: string;
  coordinates: Coordinates;
  phoneNumber: string;
  email?: string;
  website?: string;
  openingHours: OperatingHours;
  rating: number;
  reviewCount: number;
  features: ShopFeature[];
  images: string[];
  deliveryRadius: number; // in kilometers
  minimumOrder: number;
  deliveryFee: number;
  estimatedDeliveryTime: number; // in minutes
  returnsPolicy: string;
  isActive: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  compareAtPrice?: number; // original price for discounts
  currency: string;
  sku: string;
  barcode?: string;
  images: string[];
  variants: ProductVariant[];
  inventory: InventoryItem;
  dimensions?: ProductDimensions;
  weight?: number; // in grams
  tags: string[];
  seoData: ProductSEO;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  currency: string;
  images: string[];
  ingredients: string[];
  allergens: string[];
  nutritionalInfo?: NutritionalInfo;
  options: MenuItemOption[];
  availability: MenuItemAvailability;
  preparationTime: number; // in minutes
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  spiceLevel?: 1 | 2 | 3 | 4 | 5;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  type: 'restaurant' | 'shop';
  customerId: string;
  vendorId: string; // restaurantId or shopId
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  delivery: DeliveryInfo;
  pricing: OrderPricing;
  notes?: string;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  timestamps: OrderTimestamps;
  refund?: RefundInfo;
  customerInfo: CustomerInfo;
  rating?: OrderRating;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  vendorId: string; // shopId or restaurantId
  type: 'product' | 'menuItem';
  items: InventoryItem[];
  lastUpdated: Date;
  autoReorderEnabled: boolean;
  lowStockThreshold: number;
  alerts: InventoryAlert[];
}

// Supporting interfaces
export interface OperatingHours {
  monday?: TimeSlot;
  tuesday?: TimeSlot;
  wednesday?: TimeSlot;
  thursday?: TimeSlot;
  friday?: TimeSlot;
  saturday?: TimeSlot;
  sunday?: TimeSlot;
  holidays?: HolidayHours[];
}

export interface TimeSlot {
  open: string; // HH:mm format
  close: string; // HH:mm format
  closed?: boolean;
}

export interface HolidayHours {
  date: string; // YYYY-MM-DD
  name: string;
  closed: boolean;
  hours?: TimeSlot;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceModifier: number; // +/- amount
  sku?: string;
  inventory?: number;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ProductSEO {
  metaTitle?: string;
  metaDescription?: string;
  slug: string;
  keywords: string[];
}

export interface MenuItemOption {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  choices: MenuItemChoice[];
}

export interface MenuItemChoice {
  id: string;
  name: string;
  priceModifier: number;
  isDefault?: boolean;
}

export interface MenuItemAvailability {
  allDay: boolean;
  timeSlots?: TimeSlot[];
  daysOfWeek: number[]; // 0-6, Sunday-Saturday
  startDate?: Date;
  endDate?: Date;
}

export interface NutritionalInfo {
  calories: number;
  protein: number; // in grams
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number; // in mg
}

export interface OrderItem {
  id: string;
  type: 'product' | 'menuItem';
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  variants?: SelectedVariant[];
  options?: SelectedOption[];
  specialInstructions?: string;
  subtotal: number;
}

export interface SelectedVariant {
  variantId: string;
  name: string;
  value: string;
  priceModifier: number;
}

export interface SelectedOption {
  optionId: string;
  choiceId: string;
  name: string;
  choice: string;
  priceModifier: number;
}

export interface DeliveryInfo {
  type: 'delivery' | 'pickup';
  address?: DeliveryAddress;
  coordinates?: Coordinates;
  deliveryFee: number;
  estimatedTime: number; // in minutes
  actualTime?: number;
  driverId?: string;
  trackingInfo?: TrackingInfo;
  instructions?: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  apartmentNumber?: string;
  floor?: string;
  buildingName?: string;
  landmarks?: string;
}

export interface OrderPricing {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  promoCode?: string;
}

export interface OrderTimestamps {
  ordered: Date;
  confirmed?: Date;
  preparing?: Date;
  ready?: Date;
  outForDelivery?: Date;
  delivered?: Date;
  cancelled?: Date;
}

export interface RefundInfo {
  amount: number;
  reason: string;
  processedAt: Date;
  refundId: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
}

export interface OrderRating {
  food: number; // 1-5
  delivery: number; // 1-5
  overall: number; // 1-5
  comment?: string;
  ratedAt: Date;
}

export interface InventoryItem {
  itemId: string;
  name: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  unit: string;
  costPrice: number;
  supplier?: string;
  reorderLevel: number;
  maxStock: number;
  lastRestocked: Date;
  expiryDate?: Date;
}

export interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';
  itemId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
}

export interface TrackingInfo {
  status: 'preparing' | 'picked_up' | 'on_the_way' | 'nearby' | 'delivered';
  location?: Coordinates;
  estimatedArrival?: Date;
  updates: TrackingUpdate[];
}

export interface TrackingUpdate {
  status: string;
  message: string;
  timestamp: Date;
  location?: Coordinates;
}

// Enums
export type RestaurantFeature = 
  | 'delivery' 
  | 'takeout' 
  | 'dine_in' 
  | 'reservations' 
  | 'parking' 
  | 'wifi' 
  | 'outdoor_seating' 
  | 'kid_friendly' 
  | 'pet_friendly' 
  | 'wheelchair_accessible' 
  | 'live_music' 
  | 'bar' 
  | 'catering';

export type ShopCategory = 
  | 'grocery' 
  | 'pharmacy' 
  | 'electronics' 
  | 'clothing' 
  | 'home_garden' 
  | 'books' 
  | 'sports' 
  | 'beauty' 
  | 'toys' 
  | 'automotive' 
  | 'gifts' 
  | 'other';

export type ShopFeature = 
  | 'delivery' 
  | 'pickup' 
  | 'returns' 
  | 'gift_wrapping' 
  | 'installation' 
  | 'warranty' 
  | 'bulk_orders' 
  | 'same_day_delivery';

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded';

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'refunded' 
  | 'partially_refunded';

// Search and filter interfaces
export interface MarketplaceSearchParams {
  query?: string;
  type: 'restaurant' | 'shop' | 'all';
  location?: Coordinates;
  radius?: number; // in kilometers
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  features?: string[];
  sortBy?: 'distance' | 'rating' | 'price' | 'delivery_time' | 'popularity';
  isOpen?: boolean;
  deliveryAvailable?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductSearchParams {
  query?: string;
  shopId?: string;
  category?: string;
  priceRange?: [number, number];
  inStock?: boolean;
  tags?: string[];
  sortBy?: 'price' | 'popularity' | 'rating' | 'newest';
  limit?: number;
  offset?: number;
}

export interface MenuSearchParams {
  query?: string;
  restaurantId?: string;
  category?: string;
  priceRange?: [number, number];
  dietary?: ('vegetarian' | 'vegan' | 'gluten_free')[];
  spiceLevel?: number;
  available?: boolean;
  sortBy?: 'price' | 'popularity' | 'preparation_time';
  limit?: number;
  offset?: number;
}
