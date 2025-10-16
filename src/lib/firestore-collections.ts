import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Helper schema for Firestore Timestamps
export const TimestampSchema = z.union([
  z.date(),
  z.custom<Timestamp>((val) => val instanceof Timestamp),
]).transform((val) => {
  if (val instanceof Timestamp) {
    return val.toDate();
  }
  return val;
});

// User Schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  profilePicture: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: TimestampSchema.optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  preferences: z.object({
    language: z.string().default('tr'),
    currency: z.string().default('TRY'),
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      push: z.boolean().default(true),
    }),
  }),
  membershipStatus: z.enum(['free', 'premium', 'vip']).default('free'),
  loyaltyPoints: z.number().default(0),
  emailVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  lastLoginAt: TimestampSchema.optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type User = z.infer<typeof UserSchema>;

// Service Provider Schema
export const ServiceProviderSchema = z.object({
  id: z.string(),
  userId: z.string(), // Link to User who owns this provider account
  companyName: z.string(),
  businessType: z.enum(['individual', 'company', 'agency']),
  description: z.string(),
  logo: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  contactInfo: z.object({
    email: z.string().email(),
    phone: z.string(),
    website: z.string().url().optional(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    }),
  }),
  businessDetails: z.object({
    licenseNumber: z.string().optional(),
    taxNumber: z.string().optional(),
    insuranceInfo: z.object({
      provider: z.string(),
      policyNumber: z.string(),
      expiryDate: TimestampSchema,
    }).optional(),
  }),
  verification: z.object({
    status: z.enum(['pending', 'verified', 'rejected']).default('pending'),
    documents: z.array(z.object({
      type: z.string(),
      url: z.string().url(),
      uploadedAt: TimestampSchema,
    })).default([]),
    verifiedAt: TimestampSchema.optional(),
    verifiedBy: z.string().optional(),
    rejectionReason: z.string().optional(),
  }),
  settings: z.object({
    autoAcceptBookings: z.boolean().default(false),
    leadTime: z.number().default(24), // hours
    cancellationPolicy: z.string(),
    paymentTerms: z.string(),
  }),
  statistics: z.object({
    totalBookings: z.number().default(0),
    totalRevenue: z.number().default(0),
    averageRating: z.number().default(0),
    totalReviews: z.number().default(0),
    responseTime: z.number().default(0), // in hours
  }),
  bankDetails: z.object({
    accountHolder: z.string(),
    bankName: z.string(),
    iban: z.string(),
    swiftCode: z.string().optional(),
  }).optional(),
  isActive: z.boolean().default(true),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type ServiceProvider = z.infer<typeof ServiceProviderSchema>;

// Service Listing Schema
export const ServiceListingSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  title: z.string(),
  description: z.string(),
  shortDescription: z.string(),
  category: z.string(),
  subCategory: z.string().optional(),
  type: z.enum(['tour', 'activity', 'experience', 'transport', 'accommodation']),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    address: z.string().optional(),
    meetingPoint: z.string().optional(),
  }),
  pricing: z.object({
    basePrice: z.number(),
    currency: z.string().default('TRY'),
    priceType: z.enum(['per_person', 'per_group', 'per_hour', 'fixed']),
    groupSize: z.object({
      min: z.number().default(1),
      max: z.number().default(20),
    }),
    seasonalPricing: z.array(z.object({
      season: z.string(),
      multiplier: z.number(),
      startDate: TimestampSchema,
      endDate: TimestampSchema,
    })).optional(),
  }),
  duration: z.object({
    value: z.number(),
    unit: z.enum(['hours', 'days', 'weeks']),
  }),
  schedule: z.object({
    type: z.enum(['fixed', 'flexible', 'on_demand']),
    availability: z.array(z.object({
      dayOfWeek: z.number(), // 0-6 (Sunday-Saturday)
      startTime: z.string(), // HH:MM format
      endTime: z.string(),
      maxBookings: z.number().optional(),
    })),
    blackoutDates: z.array(TimestampSchema).optional(),
  }),
  images: z.array(z.string().url()),
  amenities: z.array(z.string()),
  included: z.array(z.string()),
  excluded: z.array(z.string()),
  requirements: z.object({
    minAge: z.number().optional(),
    maxAge: z.number().optional(),
    fitnessLevel: z.enum(['low', 'moderate', 'high']).optional(),
    experience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    equipment: z.array(z.string()).optional(),
  }),
  cancellationPolicy: z.object({
    type: z.enum(['flexible', 'moderate', 'strict']),
    details: z.string(),
    refundPercentages: z.array(z.object({
      daysBeforeStart: z.number(),
      refundPercentage: z.number(),
    })),
  }),
  tags: z.array(z.string()),
  seoData: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    slug: z.string(),
  }),
  status: z.enum(['draft', 'active', 'paused', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  rating: z.number().default(0),
  reviewCount: z.number().default(0),
  totalBookings: z.number().default(0),
  viewCount: z.number().default(0),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type ServiceListing = z.infer<typeof ServiceListingSchema>;

// Booking Schema
export const BookingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  serviceId: z.string(),
  providerId: z.string(),
  bookingDate: TimestampSchema,
  participants: z.object({
    adults: z.number().min(1),
    children: z.number().min(0).default(0),
    infants: z.number().min(0).default(0),
    details: z.array(z.object({
      name: z.string(),
      age: z.number(),
      type: z.enum(['adult', 'child', 'infant']),
    })).optional(),
  }),
  pricing: z.object({
    basePrice: z.number(),
    addOnsTotal: z.number().default(0),
    taxAmount: z.number().default(0),
    discountAmount: z.number().default(0),
    totalPrice: z.number(),
    currency: z.string().default('TRY'),
  }),
  paymentInfo: z.object({
    paymentMethod: z.string(),
    paymentStatus: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']),
    paymentId: z.string().optional(),
    paidAt: TimestampSchema.optional(),
  }),
  bookingStatus: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).default('pending'),
  specialRequests: z.string().optional(),
  contactInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
  cancellationInfo: z.object({
    cancelledAt: TimestampSchema.optional(),
    cancelledBy: z.string().optional(), // 'user' or 'provider'
    reason: z.string().optional(),
    refundAmount: z.number().optional(),
  }).optional(),
  providerNotes: z.string().optional(),
  remindersSent: z.array(TimestampSchema).default([]),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Booking = z.infer<typeof BookingSchema>;

// Review Schema
export const ReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  targetId: z.string(), // serviceId or providerId
  targetType: z.enum(['service', 'provider']),
  bookingId: z.string().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string(),
  images: z.array(z.string().url()).default([]),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  helpfulVotes: z.number().default(0),
  reportCount: z.number().default(0),
  isVerified: z.boolean().default(false),
  providerResponse: z.object({
    content: z.string(),
    respondedAt: TimestampSchema,
    respondedBy: z.string(),
  }).optional(),
  moderationStatus: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  moderationNotes: z.string().optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Review = z.infer<typeof ReviewSchema>;

// CartItem Schema
export const CartItemSchema = z.object({
  serviceId: z.string(),
  bookingDate: TimestampSchema,
  participants: z.number().int().positive('Katılımcı sayısı pozitif olmalı.'),
  pricePerParticipant: z.number().positive('Kişi başı fiyat pozitif bir değer olmalı.'),
  currency: z.string().default('TRY'),
  quantity: z.number().int().positive('Miktar pozitif bir değer olmalı.').default(1),
  addedAt: TimestampSchema.default(() => new Date()),
  serviceTitle: z.string().optional(),
  serviceImage: z.string().url().optional(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

// Cart Schema
export const CartSchema = z.object({
  id: z.string(),
  userId: z.string().nullable().optional(),
  items: z.array(CartItemSchema).default([]),
  totalPrice: z.number().default(0),
  currency: z.string().default('TRY'),
  promoCode: z.string().nullable().optional(),
  discountAmount: z.number().default(0),
  expiresAt: TimestampSchema.nullable().optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Cart = z.infer<typeof CartSchema>;

// Notification Schema
export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['booking', 'payment', 'promotion', 'system', 'reminder']),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  status: z.enum(['unread', 'read', 'archived']).default('unread'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  channels: z.array(z.enum(['in_app', 'email', 'sms', 'push'])).default(['in_app']),
  scheduledFor: TimestampSchema.optional(),
  sentAt: TimestampSchema.optional(),
  readAt: TimestampSchema.optional(),
  expiresAt: TimestampSchema.optional(),
  actionUrl: z.string().url().optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Notification = z.infer<typeof NotificationSchema>;

// Analytics Event Schema
export const AnalyticsEventSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  sessionId: z.string(),
  eventName: z.string(),
  eventCategory: z.string(),
  eventLabel: z.string().optional(),
  eventValue: z.number().optional(),
  properties: z.record(z.any()).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  referrer: z.string().optional(),
  page: z.object({
    url: z.string(),
    title: z.string().optional(),
    path: z.string(),
  }),
  device: z.object({
    type: z.enum(['desktop', 'mobile', 'tablet']).optional(),
    os: z.string().optional(),
    browser: z.string().optional(),
  }).optional(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
  }).optional(),
  timestamp: TimestampSchema.default(() => new Date()),
});
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// Promo Code Schema
export const PromoCodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.number(), // percentage (0-100) or fixed amount
  minimumAmount: z.number().optional(),
  maximumDiscount: z.number().optional(),
  usageLimit: z.number().optional(),
  usageCount: z.number().default(0),
  userLimit: z.number().optional(), // max uses per user
  applicableServices: z.array(z.string()).optional(), // serviceIds
  applicableCategories: z.array(z.string()).optional(),
  startDate: TimestampSchema,
  endDate: TimestampSchema,
  isActive: z.boolean().default(true),
  createdBy: z.string(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type PromoCode = z.infer<typeof PromoCodeSchema>;

// Wishlist Item Schema
export const WishlistItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  serviceId: z.string(),
  addedAt: TimestampSchema.default(() => new Date()),
  notes: z.string().optional(),
  priceAlert: z.object({
    enabled: z.boolean().default(false),
    targetPrice: z.number().optional(),
    notified: z.boolean().default(false),
  }).optional(),
});
export type WishlistItem = z.infer<typeof WishlistItemSchema>;

// Support Ticket Schema
export const SupportTicketSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subject: z.string(),
  description: z.string(),
  category: z.enum(['booking', 'payment', 'technical', 'general', 'complaint']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open'),
  assignedTo: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number(),
  })).default([]),
  messages: z.array(z.object({
    id: z.string(),
    senderId: z.string(),
    senderType: z.enum(['user', 'agent', 'system']),
    content: z.string(),
    timestamp: TimestampSchema,
    isInternal: z.boolean().default(false),
  })).default([]),
  tags: z.array(z.string()).default([]),
  resolution: z.string().optional(),
  satisfactionRating: z.number().min(1).max(5).optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
  resolvedAt: TimestampSchema.optional(),
  closedAt: TimestampSchema.optional(),
});
export type SupportTicket = z.infer<typeof SupportTicketSchema>;

// Location Schema
export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  country: z.string(),
  region: z.string(),
  timezone: z.string(),
  weatherApiEndpoint: z.string().url().optional(),
  geohash: z.string(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Location = z.infer<typeof LocationSchema>;

// POI (Point of Interest) Schema
export const POISchema = z.object({
  id: z.string(),
  locationId: z.string(),
  name: z.string(),
  type: z.enum(['historical', 'natural', 'cultural', 'adventure', 'culinary']),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  description: z.string(),
  accessibilityInfo: z.object({
    wheelchairAccessible: z.boolean(),
    hasElevator: z.boolean().optional(),
    hasAccessibleParking: z.boolean().optional(),
    hasAccessibleRestroom: z.boolean().optional(),
    visualAidSupport: z.boolean().optional(),
    hearingAidSupport: z.boolean().optional(),
    notes: z.string().optional(),
  }),
  operatingHours: z.object({
    monday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    tuesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    wednesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    thursday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    friday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    saturday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    sunday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    holidays: z.array(z.object({
      date: z.string(),
      closed: z.boolean(),
      hours: z.object({
        open: z.string(),
        close: z.string(),
      }).optional(),
    })).optional(),
  }).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().default(0),
  images: z.array(z.string().url()).default([]),
  geohash: z.string(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type POI = z.infer<typeof POISchema>;

// Tour Location Schema
export const TourLocationSchema = z.object({
  id: z.string(),
  tourId: z.string(),
  locationId: z.string(),
  poiId: z.string().optional(),
  order: z.number().int().min(0),
  duration: z.number().int().min(0), // in minutes
  type: z.enum(['start', 'waypoint', 'destination', 'accommodation', 'meal', 'activity']),
  description: z.string().optional(),
  meetingPoint: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  instructions: z.string().optional(),
  estimatedArrivalTime: TimestampSchema.optional(),
  estimatedDepartureTime: TimestampSchema.optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type TourLocation = z.infer<typeof TourLocationSchema>;

// Location Search History Schema
export const LocationSearchSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  sessionId: z.string(),
  query: z.string(),
  filters: z.object({
    radius: z.number().optional(),
    center: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    types: z.array(z.string()).optional(),
    priceRange: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
  }).optional(),
  results: z.array(z.object({
    serviceId: z.string(),
    relevanceScore: z.number(),
    distance: z.number().optional(),
  })).default([]),
  resultsCount: z.number().default(0),
  searchedAt: TimestampSchema.default(() => new Date()),
});
export type LocationSearch = z.infer<typeof LocationSearchSchema>;

// Geo Fence Schema (for location-based notifications)
export const GeoFenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  center: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  radius: z.number().positive(), // in meters
  triggers: z.array(z.enum(['enter', 'exit', 'dwell'])),
  actions: z.array(z.object({
    type: z.enum(['notification', 'email', 'sms', 'webhook']),
    config: z.record(z.any()),
  })),
  isActive: z.boolean().default(true),
  targetUsers: z.array(z.string()).optional(), // specific userIds
  targetServices: z.array(z.string()).optional(), // specific serviceIds
  schedule: z.object({
    startDate: TimestampSchema.optional(),
    endDate: TimestampSchema.optional(),
    timeOfDay: z.object({
      start: z.string(), // HH:MM
      end: z.string(),   // HH:MM
    }).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday
  }).optional(),
  analytics: z.object({
    totalTriggers: z.number().default(0),
    uniqueUsers: z.number().default(0),
    lastTriggered: TimestampSchema.optional(),
  }),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type GeoFence = z.infer<typeof GeoFenceSchema>;

// Restaurant Schema
export const RestaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  cuisine: z.array(z.string()),
  address: z.string(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  phoneNumber: z.string(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  openingHours: z.object({
    monday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    tuesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    wednesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    thursday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    friday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    saturday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    sunday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    holidays: z.array(z.object({
      date: z.string(),
      name: z.string(),
      closed: z.boolean(),
      hours: z.object({
        open: z.string(),
        close: z.string(),
      }).optional(),
    })).optional(),
  }),
  priceRange: z.number().min(1).max(4),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().default(0),
  features: z.array(z.enum([
    'delivery', 'takeout', 'dine_in', 'reservations', 'parking', 'wifi',
    'outdoor_seating', 'kid_friendly', 'pet_friendly', 'wheelchair_accessible',
    'live_music', 'bar', 'catering'
  ])),
  images: z.array(z.string().url()),
  menuUrl: z.string().url().optional(),
  deliveryRadius: z.number().min(0),
  minimumOrder: z.number().min(0),
  deliveryFee: z.number().min(0),
  estimatedDeliveryTime: z.number().min(0),
  acceptsReservations: z.boolean(),
  isActive: z.boolean().default(true),
  ownerId: z.string(),
  geohash: z.string(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Restaurant = z.infer<typeof RestaurantSchema>;

// Shop Schema
export const ShopSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum([
    'grocery', 'pharmacy', 'electronics', 'clothing', 'home_garden',
    'books', 'sports', 'beauty', 'toys', 'automotive', 'gifts', 'other'
  ]),
  subcategory: z.string().optional(),
  address: z.string(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  phoneNumber: z.string(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  openingHours: z.object({
    monday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    tuesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    wednesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    thursday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    friday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    saturday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    sunday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    }).optional(),
    holidays: z.array(z.object({
      date: z.string(),
      name: z.string(),
      closed: z.boolean(),
      hours: z.object({
        open: z.string(),
        close: z.string(),
      }).optional(),
    })).optional(),
  }),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().default(0),
  features: z.array(z.enum([
    'delivery', 'pickup', 'returns', 'gift_wrapping', 'installation',
    'warranty', 'bulk_orders', 'same_day_delivery'
  ])),
  images: z.array(z.string().url()),
  deliveryRadius: z.number().min(0),
  minimumOrder: z.number().min(0),
  deliveryFee: z.number().min(0),
  estimatedDeliveryTime: z.number().min(0),
  returnsPolicy: z.string(),
  isActive: z.boolean().default(true),
  ownerId: z.string(),
  geohash: z.string(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Shop = z.infer<typeof ShopSchema>;

// Product Schema
export const ProductSchema = z.object({
  id: z.string(),
  shopId: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  currency: z.string().default('TRY'),
  sku: z.string(),
  barcode: z.string().optional(),
  images: z.array(z.string().url()),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    value: z.string(),
    priceModifier: z.number(),
    sku: z.string().optional(),
    inventory: z.number().optional(),
  })).default([]),
  inventory: z.object({
    currentStock: z.number().min(0),
    reservedStock: z.number().min(0).default(0),
    availableStock: z.number().min(0),
    unit: z.string(),
    costPrice: z.number().min(0).optional(),
    reorderLevel: z.number().min(0).default(5),
    maxStock: z.number().min(0).default(1000),
  }),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
    unit: z.enum(['cm', 'in']),
  }).optional(),
  weight: z.number().min(0).optional(),
  tags: z.array(z.string()).default([]),
  seoData: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    slug: z.string(),
    keywords: z.array(z.string()).default([]),
  }),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().default(0),
  salesCount: z.number().default(0),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Product = z.infer<typeof ProductSchema>;

// Menu Item Schema
export const MenuItemSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default('TRY'),
  images: z.array(z.string().url()),
  ingredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  nutritionalInfo: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbohydrates: z.number().min(0),
    fat: z.number().min(0),
    fiber: z.number().min(0),
    sugar: z.number().min(0),
    sodium: z.number().min(0),
  }).optional(),
  options: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['single', 'multiple']),
    required: z.boolean(),
    choices: z.array(z.object({
      id: z.string(),
      name: z.string(),
      priceModifier: z.number(),
      isDefault: z.boolean().optional(),
    })),
  })).default([]),
  availability: z.object({
    allDay: z.boolean().default(true),
    timeSlots: z.array(z.object({
      open: z.string(),
      close: z.string(),
    })).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)),
    startDate: TimestampSchema.optional(),
    endDate: TimestampSchema.optional(),
  }),
  preparationTime: z.number().min(0),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  spiceLevel: z.number().min(1).max(5).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().default(0),
  orderCount: z.number().default(0),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

// Order Schema
export const OrderSchema = z.object({
  id: z.string(),
  type: z.enum(['restaurant', 'shop']),
  customerId: z.string(),
  vendorId: z.string(),
  items: z.array(z.object({
    id: z.string(),
    type: z.enum(['product', 'menuItem']),
    itemId: z.string(),
    name: z.string(),
    price: z.number().min(0),
    quantity: z.number().min(1),
    variants: z.array(z.object({
      variantId: z.string(),
      name: z.string(),
      value: z.string(),
      priceModifier: z.number(),
    })).optional(),
    options: z.array(z.object({
      optionId: z.string(),
      choiceId: z.string(),
      name: z.string(),
      choice: z.string(),
      priceModifier: z.number(),
    })).optional(),
    specialInstructions: z.string().optional(),
    subtotal: z.number().min(0),
  })),
  status: z.enum([
    'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery',
    'delivered', 'cancelled', 'refunded'
  ]).default('pending'),
  paymentStatus: z.enum([
    'pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'
  ]).default('pending'),
  delivery: z.object({
    type: z.enum(['delivery', 'pickup']),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
      apartmentNumber: z.string().optional(),
      floor: z.string().optional(),
      buildingName: z.string().optional(),
      landmarks: z.string().optional(),
    }).optional(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    deliveryFee: z.number().min(0),
    estimatedTime: z.number().min(0),
    actualTime: z.number().optional(),
    driverId: z.string().optional(),
    instructions: z.string().optional(),
  }),
  pricing: z.object({
    subtotal: z.number().min(0),
    deliveryFee: z.number().min(0),
    serviceFee: z.number().min(0),
    tax: z.number().min(0),
    discount: z.number().min(0),
    total: z.number().min(0),
    currency: z.string().default('TRY'),
    promoCode: z.string().optional(),
  }),
  notes: z.string().optional(),
  estimatedDeliveryTime: TimestampSchema,
  actualDeliveryTime: TimestampSchema.optional(),
  timestamps: z.object({
    ordered: TimestampSchema,
    confirmed: TimestampSchema.optional(),
    preparing: TimestampSchema.optional(),
    ready: TimestampSchema.optional(),
    outForDelivery: TimestampSchema.optional(),
    delivered: TimestampSchema.optional(),
    cancelled: TimestampSchema.optional(),
  }),
  refund: z.object({
    amount: z.number().min(0),
    reason: z.string(),
    processedAt: TimestampSchema,
    refundId: z.string(),
  }).optional(),
  customerInfo: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email(),
  }),
  rating: z.object({
    food: z.number().min(1).max(5),
    delivery: z.number().min(1).max(5),
    overall: z.number().min(1).max(5),
    comment: z.string().optional(),
    ratedAt: TimestampSchema,
  }).optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Order = z.infer<typeof OrderSchema>;

// Inventory Schema
export const InventorySchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  type: z.enum(['product', 'menuItem']),
  items: z.array(z.object({
    itemId: z.string(),
    name: z.string(),
    currentStock: z.number().min(0),
    reservedStock: z.number().min(0).default(0),
    availableStock: z.number().min(0),
    unit: z.string(),
    costPrice: z.number().min(0).optional(),
    supplier: z.string().optional(),
    reorderLevel: z.number().min(0).default(5),
    maxStock: z.number().min(0).default(1000),
    lastRestocked: TimestampSchema,
    expiryDate: TimestampSchema.optional(),
  })),
  lastUpdated: TimestampSchema,
  autoReorderEnabled: z.boolean().default(false),
  lowStockThreshold: z.number().min(0).default(10),
  alerts: z.array(z.object({
    id: z.string(),
    type: z.enum(['low_stock', 'out_of_stock', 'expiring_soon', 'expired']),
    itemId: z.string(),
    message: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    createdAt: TimestampSchema,
    acknowledged: z.boolean().default(false),
    acknowledgedAt: TimestampSchema.optional(),
  })).default([]),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Inventory = z.infer<typeof InventorySchema>;

// Loyalty Account Schema
export const LoyaltyAccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  points: z.number().min(0),
  tier: z.object({
    id: z.string(),
    name: z.string(),
    level: z.number(),
    minPoints: z.number(),
    maxPoints: z.number().optional(),
    multiplier: z.number(),
    color: z.string(),
  }),
  totalEarned: z.number().min(0),
  totalSpent: z.number().min(0),
  joinDate: TimestampSchema,
  lastActivity: TimestampSchema,
  status: z.enum(['active', 'suspended', 'closed']).default('active'),
  notifications: z.boolean().default(true),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type LoyaltyAccount = z.infer<typeof LoyaltyAccountSchema>;

// Loyalty Tier Schema
export const LoyaltyTierSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().min(0),
  minPoints: z.number().min(0),
  maxPoints: z.number().min(0).optional(),
  benefits: z.array(z.object({
    id: z.string(),
    type: z.enum(['discount', 'free_shipping', 'priority_support', 'exclusive_tours', 'early_access', 'bonus_points']),
    name: z.string(),
    description: z.string(),
    value: z.number(),
    isActive: z.boolean(),
  })),
  multiplier: z.number().min(1),
  color: z.string(),
  icon: z.string(),
  description: z.string(),
  isActive: z.boolean().default(true),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type LoyaltyTier = z.infer<typeof LoyaltyTierSchema>;

// Points Transaction Schema
export const PointsTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['earned', 'spent', 'expired', 'adjusted', 'bonus', 'refund']),
  amount: z.number(),
  description: z.string(),
  orderId: z.string().optional(),
  bookingId: z.string().optional(),
  promoId: z.string().optional(),
  referralId: z.string().optional(),
  expiresAt: TimestampSchema.optional(),
  isExpired: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  processedAt: TimestampSchema.optional(),
});
export type PointsTransaction = z.infer<typeof PointsTransactionSchema>;

// Reward Schema
export const RewardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['discount', 'free_tour', 'voucher', 'merchandise', 'experience']),
  category: z.string(),
  pointsCost: z.number().min(0),
  monetaryValue: z.number().min(0),
  currency: z.string().default('TRY'),
  availability: z.object({
    unlimited: z.boolean(),
    quantity: z.number().optional(),
    remaining: z.number().optional(),
  }),
  eligibility: z.object({
    minTier: z.string().optional(),
    userTypes: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
  }),
  terms: z.array(z.string()),
  images: z.array(z.string().url()),
  validFrom: TimestampSchema,
  validUntil: TimestampSchema.optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  redemptionCount: z.number().default(0),
  maxRedemptionsPerUser: z.number().optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Reward = z.infer<typeof RewardSchema>;

// Reward Redemption Schema
export const RewardRedemptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  rewardId: z.string(),
  pointsSpent: z.number().min(0),
  redemptionCode: z.string(),
  status: z.enum(['pending', 'confirmed', 'used', 'expired', 'cancelled']),
  usedAt: TimestampSchema.optional(),
  expiresAt: TimestampSchema.optional(),
  orderId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type RewardRedemption = z.infer<typeof RewardRedemptionSchema>;

// Referral Program Schema
export const ReferralProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean().default(true),
  rewards: z.object({
    referrer: z.object({
      points: z.number().min(0),
      bonus: z.number().optional(),
    }),
    referee: z.object({
      points: z.number().min(0),
      discount: z.number().optional(),
    }),
  }),
  conditions: z.object({
    minSpend: z.number().optional(),
    validityDays: z.number().min(1),
    maxRedemptions: z.number().optional(),
  }),
  terms: z.array(z.string()),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type ReferralProgram = z.infer<typeof ReferralProgramSchema>;

// Referral Schema
export const ReferralSchema = z.object({
  id: z.string(),
  referrerId: z.string(),
  refereeId: z.string().optional(),
  refereeEmail: z.string().email().optional(),
  refereePhone: z.string().optional(),
  code: z.string(),
  status: z.enum(['sent', 'registered', 'completed', 'expired']),
  pointsEarned: z.number().min(0),
  completedAt: TimestampSchema.optional(),
  expiresAt: TimestampSchema,
  metadata: z.object({
    channel: z.enum(['email', 'sms', 'social', 'link']),
    source: z.string().optional(),
  }).optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Referral = z.infer<typeof ReferralSchema>;

// Loyalty Rule Schema
export const LoyaltyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['booking', 'signup', 'review', 'referral', 'birthday', 'milestone']),
  trigger: z.object({
    event: z.string(),
    conditions: z.record(z.any()).optional(),
  }),
  reward: z.object({
    points: z.number().min(0),
    multiplier: z.number().optional(),
    bonus: z.number().optional(),
  }),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly', 'unlimited']),
  isActive: z.boolean().default(true),
  validFrom: TimestampSchema,
  validUntil: TimestampSchema.optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type LoyaltyRule = z.infer<typeof LoyaltyRuleSchema>;

// Localized Content Schema
export const LocalizedContentSchema = z.object({
  tr: z.string(),
  en: z.string().optional(),
  de: z.string().optional(),
  fr: z.string().optional(),
  ar: z.string().optional(),
  ru: z.string().optional(),
});
export type LocalizedContent = z.infer<typeof LocalizedContentSchema>;

// Content Page Schema
export const ContentPageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: LocalizedContentSchema,
  content: LocalizedContentSchema,
  excerpt: LocalizedContentSchema.optional(),
  type: z.enum(['page', 'blog', 'guide', 'help', 'legal']),
  status: z.enum(['draft', 'published', 'archived']),
  featured: z.boolean().default(false),
  publishedAt: TimestampSchema.optional(),
  authorId: z.string(),
  authorName: z.string(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  seo: z.object({
    metaTitle: LocalizedContentSchema.optional(),
    metaDescription: LocalizedContentSchema.optional(),
    keywords: z.array(z.string()).optional(),
    canonical: z.string().optional(),
    noIndex: z.boolean().optional(),
  }),
  media: z.object({
    featuredImage: z.string().optional(),
    gallery: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
  }),
  settings: z.object({
    allowComments: z.boolean().default(true),
    showAuthor: z.boolean().default(true),
    showDate: z.boolean().default(true),
    template: z.string().optional(),
  }),
  analytics: z.object({
    views: z.number().default(0),
    shares: z.number().default(0),
    readTime: z.number().default(0),
  }),
  workflow: z.object({
    version: z.number().default(1),
    lastEditedBy: z.string(),
    reviewStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
    reviewedBy: z.string().optional(),
    reviewedAt: TimestampSchema.optional(),
    reviewNotes: z.string().optional(),
  }),
  translations: z.record(z.object({
    isComplete: z.boolean(),
    translatedBy: z.string().optional(),
    translatedAt: TimestampSchema.optional(),
  })).default({}),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type ContentPage = z.infer<typeof ContentPageSchema>;

// Content Category Schema
export const ContentCategorySchema = z.object({
  id: z.string(),
  name: LocalizedContentSchema,
  slug: z.string(),
  description: LocalizedContentSchema.optional(),
  parentId: z.string().optional(),
  type: z.enum(['page', 'blog', 'guide', 'help', 'legal']),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
  seo: z.object({
    metaTitle: LocalizedContentSchema.optional(),
    metaDescription: LocalizedContentSchema.optional(),
  }),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type ContentCategory = z.infer<typeof ContentCategorySchema>;

// Content Block Schema
export const ContentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'video', 'gallery', 'quote', 'list', 'button', 'separator', 'embed', 'table']),
  content: z.any(),
  settings: z.record(z.any()),
  order: z.number(),
});
export type ContentBlock = z.infer<typeof ContentBlockSchema>;

// Content Template Schema
export const ContentTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['page', 'blog', 'guide', 'help', 'legal']),
  structure: z.array(ContentBlockSchema),
  thumbnail: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  usageCount: z.number().default(0),
  createdBy: z.string(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type ContentTemplate = z.infer<typeof ContentTemplateSchema>;

// Media Library Schema
export const MediaLibrarySchema = z.object({
  id: z.string(),
  fileName: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: LocalizedContentSchema.optional(),
  caption: LocalizedContentSchema.optional(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  folder: z.string().optional(),
  tags: z.array(z.string()).default([]),
  uploadedBy: z.string(),
  usageCount: z.number().default(0),
  isPublic: z.boolean().default(true),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type MediaLibrary = z.infer<typeof MediaLibrarySchema>;

// Navigation Menu Item Schema
export const NavigationMenuItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  type: z.enum(['page', 'category', 'external', 'custom']),
  targetId: z.string().optional(),
  icon: z.string().optional(),
  newTab: z.boolean().default(false),
  order: z.number(),
  children: z.array(z.lazy(() => NavigationMenuItemSchema)).optional(),
  isActive: z.boolean().default(true),
});
export type NavigationMenuItem = z.infer<typeof NavigationMenuItemSchema>;

// Content Menu Schema
export const ContentMenuSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.enum(['header', 'footer', 'sidebar', 'mobile']),
  items: z.array(NavigationMenuItemSchema),
  isActive: z.boolean().default(true),
  language: z.string().default('tr'),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type ContentMenu = z.infer<typeof ContentMenuSchema>;

// FAQ Schema
export const FAQSchema = z.object({
  id: z.string(),
  question: LocalizedContentSchema,
  answer: LocalizedContentSchema,
  categoryId: z.string(),
  tags: z.array(z.string()).default([]),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
  helpful: z.number().default(0),
  notHelpful: z.number().default(0),
  createdBy: z.string(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type FAQ = z.infer<typeof FAQSchema>;

// Announcement Schema
export const AnnouncementSchema = z.object({
  id: z.string(),
  title: LocalizedContentSchema,
  message: LocalizedContentSchema,
  type: z.enum(['info', 'warning', 'success', 'error']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  target: z.object({
    userTypes: z.array(z.enum(['all', 'guests', 'users', 'providers', 'admins'])).optional(),
    regions: z.array(z.string()).optional(),
    pages: z.array(z.string()).optional(),
    startDate: TimestampSchema.optional(),
    endDate: TimestampSchema.optional(),
  }),
  display: z.object({
    position: z.enum(['banner', 'modal', 'notification', 'sidebar']),
    dismissible: z.boolean().default(true),
    autoHide: z.number().optional(),
    showOnce: z.boolean().optional(),
  }),
  isActive: z.boolean().default(true),
  createdBy: z.string(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type Announcement = z.infer<typeof AnnouncementSchema>;

// Content Revision Schema
export const ContentRevisionSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  version: z.number(),
  title: LocalizedContentSchema,
  content: LocalizedContentSchema,
  changeLog: z.string(),
  changedBy: z.string(),
  isPublished: z.boolean().default(false),
  createdAt: TimestampSchema.default(() => new Date()),
});
export type ContentRevision = z.infer<typeof ContentRevisionSchema>;

// CMS Settings Schema
export const CMSSettingsSchema = z.object({
  id: z.string(),
  general: z.object({
    siteName: LocalizedContentSchema,
    siteDescription: LocalizedContentSchema,
    defaultLanguage: z.string().default('tr'),
    availableLanguages: z.array(z.string()).default(['tr', 'en']),
    timezone: z.string().default('Europe/Istanbul'),
    dateFormat: z.string().default('DD/MM/YYYY'),
  }),
  content: z.object({
    defaultStatus: z.enum(['draft', 'published', 'archived']).default('draft'),
    enableRevisions: z.boolean().default(true),
    maxRevisions: z.number().default(10),
    enableWorkflow: z.boolean().default(false),
    defaultWorkflowId: z.string().optional(),
    enableComments: z.boolean().default(true),
    moderateComments: z.boolean().default(true),
  }),
  media: z.object({
    maxFileSize: z.number().default(10),
    allowedTypes: z.array(z.string()).default(['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx']),
    enableImageOptimization: z.boolean().default(true),
    thumbnailSizes: z.object({
      small: z.object({ width: z.number().default(150), height: z.number().default(150) }),
      medium: z.object({ width: z.number().default(300), height: z.number().default(300) }),
      large: z.object({ width: z.number().default(800), height: z.number().default(600) }),
    }),
  }),
  seo: z.object({
    enableSitemap: z.boolean().default(true),
    enableRobots: z.boolean().default(true),
    defaultMetaTitle: LocalizedContentSchema,
    defaultMetaDescription: LocalizedContentSchema,
    socialMedia: z.object({
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
    }),
  }),
  updatedBy: z.string(),
  updatedAt: TimestampSchema.default(() => new Date()),
});
export type CMSSettings = z.infer<typeof CMSSettingsSchema>;

// Marketplace Collections
export const MarketplaceRestaurantSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string(),
  image: z.string(),
  coverImage: z.string().optional(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  website: z.string().optional(),
  cuisineType: z.array(z.string()),
  priceRange: z.enum(['budget', 'moderate', 'expensive', 'luxury']),
  rating: z.number().min(0).max(5),
  totalReviews: z.number(),
  deliveryFee: z.number(),
  minimumOrder: z.number(),
  estimatedDeliveryTime: z.number(),
  openingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
  }),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
    city: z.string(),
    district: z.string(),
  }),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  acceptsCash: z.boolean(),
  acceptsCard: z.boolean(),
  acceptsOnlinePayment: z.boolean(),
  features: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type MarketplaceRestaurant = z.infer<typeof MarketplaceRestaurantSchema>;

export const MarketplaceShopSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string(),
  image: z.string(),
  coverImage: z.string().optional(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  website: z.string().optional(),
  category: z.string(),
  subcategory: z.string().optional(),
  priceRange: z.enum(['budget', 'moderate', 'expensive', 'luxury']),
  rating: z.number().min(0).max(5),
  totalReviews: z.number(),
  deliveryFee: z.number(),
  minimumOrder: z.number(),
  estimatedDeliveryTime: z.number(),
  openingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
  }),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
    city: z.string(),
    district: z.string(),
  }),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  acceptsCash: z.boolean(),
  acceptsCard: z.boolean(),
  acceptsOnlinePayment: z.boolean(),
  features: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type MarketplaceShop = z.infer<typeof MarketplaceShopSchema>;

export const MarketplaceOrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  restaurantId: z.string().optional(),
  shopId: z.string().optional(),
  type: z.enum(['restaurant', 'shop']),
  items: z.array(z.object({
    menuItemId: z.string().optional(),
    productId: z.string().optional(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    total: z.number(),
    specialInstructions: z.string().optional(),
    variants: z.record(z.string()).optional(),
  })),
  totalAmount: z.number(),
  deliveryFee: z.number(),
  taxAmount: z.number(),
  discountAmount: z.number(),
  finalAmount: z.number(),
  deliveryAddress: z.object({
    fullName: z.string(),
    phone: z.string(),
    address: z.string(),
    apartment: z.string().optional(),
    city: z.string(),
    district: z.string(),
    postalCode: z.string().optional(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    instructions: z.string().optional(),
  }),
  paymentMethod: z.enum(['cash', 'card', 'online']),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
  orderStatus: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']),
  notes: z.string().optional(),
  estimatedDeliveryTime: TimestampSchema,
  actualDeliveryTime: TimestampSchema.optional(),
  driverId: z.string().optional(),
  trackingNumber: z.string().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type MarketplaceOrder = z.infer<typeof MarketplaceOrderSchema>;

// Loyalty Program Collections
export const LoyaltyProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['points', 'tiered', 'gamified']),
  isActive: z.boolean(),
  rules: z.object({
    pointsPerTL: z.number(),
    pointsExpiryDays: z.number(),
    minimumPointsForRedemption: z.number(),
    redemptionRate: z.number(),
  }),
  tiers: z.object({
    bronze: z.object({ minPoints: z.number(), benefits: z.array(z.string()) }),
    silver: z.object({ minPoints: z.number(), benefits: z.array(z.string()) }),
    gold: z.object({ minPoints: z.number(), benefits: z.array(z.string()) }),
    platinum: z.object({ minPoints: z.number(), benefits: z.array(z.string()) }),
  }).optional(),
  rewards: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['discount', 'free_item', 'free_delivery', 'cashback']),
    pointsCost: z.number(),
    value: z.number(),
    category: z.string(),
    isActive: z.boolean(),
    validUntil: TimestampSchema.optional(),
    usageLimit: z.number().optional(),
    currentUsage: z.number(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type LoyaltyProgram = z.infer<typeof LoyaltyProgramSchema>;

export const UserLoyaltySchema = z.object({
  id: z.string(),
  userId: z.string(),
  totalPoints: z.number(),
  availablePoints: z.number(),
  lifetimePoints: z.number(),
  currentTier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  pointsHistory: z.array(z.object({
    id: z.string(),
    type: z.enum(['earned', 'redeemed', 'expired', 'adjusted']),
    points: z.number(),
    reason: z.string(),
    orderId: z.string().optional(),
    rewardId: z.string().optional(),
    expiresAt: TimestampSchema.optional(),
    createdAt: TimestampSchema,
  })),
  redeemedRewards: z.array(z.object({
    id: z.string(),
    rewardId: z.string(),
    pointsSpent: z.number(),
    rewardDetails: z.any(),
    redeemedAt: TimestampSchema,
    usedAt: TimestampSchema.optional(),
    orderId: z.string().optional(),
  })),
  joinedAt: TimestampSchema,
  lastActivity: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type UserLoyalty = z.infer<typeof UserLoyaltySchema>;
