/**
 * Firestore Collections - MVP Version
 *
 * Simplified schema definitions for MVP 1.0
 * Only essential collections and fields are included
 */

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

// ============================================================================
// USER COLLECTION
// ============================================================================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  profilePicture: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(['user', 'provider', 'admin']).default('user'),
  emailVerified: z.boolean().default(false),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});

export type User = z.infer<typeof UserSchema>;

// ============================================================================
// SERVICE PROVIDER COLLECTION
// ============================================================================

export const ServiceProviderSchema = z.object({
  id: z.string(),
  userId: z.string(), // Link to User who owns this provider account
  businessName: z.string(),
  description: z.string(),
  logoUrl: z.string().url().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
  address: z.object({
    city: z.string(),
    country: z.string().default('Turkey'),
  }).optional(),
  approved: z.boolean().default(false),
  approvedAt: TimestampSchema.optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});

export type ServiceProvider = z.infer<typeof ServiceProviderSchema>;

// ============================================================================
// TOUR/ACTIVITY COLLECTION
// ============================================================================

export const TourSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['tour', 'activity', 'event']),
  imageUrl: z.string().url().optional(),
  price: z.number().positive(),
  currency: z.string().default('TRY'),
  duration: z.number().positive(), // in minutes
  maxCapacity: z.number().positive().optional(),
  location: z.object({
    city: z.string(),
    address: z.string().optional(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
  availability: z.array(z.object({
    date: TimestampSchema,
    available: z.boolean().default(true),
    spotsLeft: z.number().optional(),
  })).default([]),
  isActive: z.boolean().default(true),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});

export type Tour = z.infer<typeof TourSchema>;

// ============================================================================
// BOOKING COLLECTION
// ============================================================================

export const BookingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tourId: z.string(),
  providerId: z.string(),
  date: TimestampSchema,
  numberOfPeople: z.number().positive(),
  totalPrice: z.number().positive(),
  currency: z.string().default('TRY'),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
  paymentIntentId: z.string().optional(), // Stripe payment intent ID
  paymentStatus: z.enum(['pending', 'paid', 'refunded']).default('pending'),
  cancellationReason: z.string().optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});

export type Booking = z.infer<typeof BookingSchema>;

// ============================================================================
// REVIEW COLLECTION
// ============================================================================

export const ReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tourId: z.string(),
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  createdAt: TimestampSchema.default(() => new Date()),
  updatedAt: TimestampSchema.default(() => new Date()),
});

export type Review = z.infer<typeof ReviewSchema>;

// ============================================================================
// COLLECTION NAMES (Constants)
// ============================================================================

export const COLLECTIONS = {
  USERS: 'users',
  PROVIDERS: 'providers',
  TOURS: 'tours',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate data against a schema
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely parse data, returning null on error
 */
export function safeParseData<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export const Schemas = {
  User: UserSchema,
  ServiceProvider: ServiceProviderSchema,
  Tour: TourSchema,
  Booking: BookingSchema,
  Review: ReviewSchema,
} as const;
