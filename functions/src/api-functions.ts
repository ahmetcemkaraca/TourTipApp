/**
 * Firebase Functions RESTful API for TourTrip.app
 * Provides comprehensive REST endpoints with authentication, validation, and monitoring
 */

import { HttpsError, CallableRequest, onCall, onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as cors from 'cors';
import * as express from 'express';
import { z } from 'zod';

const db = getFirestore();
const auth = getAuth();

// CORS configuration
const corsHandler = (cors as any)({
  origin: [
    'http://localhost:3000',
    'https://tourtrip.app',
    'https://staging.tourtrip.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
});

// API Configuration
const API_CONFIG = {
  version: 'v1',
  baseUrl: '/api/v1',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  timeout: 30000, // 30 seconds
  maxPayloadSize: '10mb',
};

// Request/Response schemas
const schemas = {
  // Tour schemas
  tourCreate: z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    price: z.number().positive(),
    duration: z.number().positive(),
    maxParticipants: z.number().positive(),
    location: z.object({
      city: z.string(),
      country: z.string(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    }),
    itinerary: z.array(z.object({
      day: z.number(),
      title: z.string(),
      description: z.string(),
      activities: z.array(z.string()),
    })),
    amenities: z.array(z.string()),
    images: z.array(z.string().url()),
    category: z.string(),
    difficulty: z.enum(['easy', 'moderate', 'challenging', 'extreme']),
    tags: z.array(z.string()),
  }),
  
  tourUpdate: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    price: z.number().positive().optional(),
    duration: z.number().positive().optional(),
    maxParticipants: z.number().positive().optional(),
    // ... other optional fields
  }),
  
  // Booking schemas
  bookingCreate: z.object({
    tourId: z.string(),
    participants: z.array(z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.number().min(0).max(120),
      specialRequests: z.string().optional(),
    })),
    selectedDate: z.string().datetime(),
    totalAmount: z.number().positive(),
    paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer']),
    specialRequests: z.string().optional(),
  }),
  
  // User schemas
  userUpdate: z.object({
    fullName: z.string().optional(),
    phoneNumber: z.string().optional(),
    preferences: z.object({
      language: z.string().optional(),
      currency: z.string().optional(),
      notifications: z.object({
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
        push: z.boolean().optional(),
      }).optional(),
    }).optional(),
  }),
  
  // Review schemas
  reviewCreate: z.object({
    tourId: z.string(),
    rating: z.number().min(1).max(5),
    title: z.string().min(1).max(100),
    comment: z.string().min(1).max(1000),
    photos: z.array(z.string().url()).optional(),
  }),
};

// Middleware functions
// const validateApiKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//   const apiKey = req.headers['x-api-key'] as string;
//   
//   if (!apiKey) {
//     return res.status(401).json({
//       success: false,
//       error: {
//         code: 'API_KEY_REQUIRED',
//         message: 'API key is required',
//       },
//     });
//   }
//   
//   try {
//     // Validate API key against Firestore
//     const apiKeyDoc = await db.collection('apiKeys').where('key', '==', apiKey).limit(1).get();
//     
//     if (apiKeyDoc.empty) {
//       return res.status(401).json({
//         success: false,
//         error: {
//           code: 'INVALID_API_KEY',
//           message: 'Invalid API key',
//         },
//       });
//     }
//     
//     const apiKeyData = apiKeyDoc.docs[0].data();
//     
//     if (!apiKeyData.enabled || (apiKeyData.expiresAt && apiKeyData.expiresAt.toDate() < new Date())) {
//       return res.status(401).json({
//         success: false,
//         error: {
//           code: 'API_KEY_EXPIRED',
//           message: 'API key is expired or disabled',
//         },
//       });
//     }
//     
//     // Add API key info to request
//     (req as any).apiKey = apiKeyData;
//     next();
//   } catch (error) {
//     logger.error('API key validation error:', error);
//     return res.status(500).json({
//       success: false,
//       error: {
//         code: 'INTERNAL_ERROR',
//         message: 'Internal server error',
//       },
//     });
//   }
// };

const validateAuth = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_REQUIRED',
        message: 'Authentication token is required',
      },
    });
  }
  
  try {
    const decodedToken = await auth.verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    logger.error('Auth token validation error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_AUTH_TOKEN',
        message: 'Invalid authentication token',
      },
    });
  }
};

const rateLimiter = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [ip, data] of requests.entries()) {
      if (data.resetTime < windowStart) {
        requests.delete(ip);
      }
    }
    
    const current = requests.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (current.resetTime < now) {
      current.count = 0;
      current.resetTime = now + windowMs;
    }
    
    current.count++;
    requests.set(key, current);
    
    if (current.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
        },
      });
    }
    
    next();
  };
};

const requestLogger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  (req as any).requestId = requestId;
  
  // Log request
  logger.info('API Request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - startTime;
    
    logger.info('API Response', {
      requestId,
      statusCode: res.statusCode,
      duration,
      success: data?.success,
    });
    
    // Add meta information to response
    if (data && typeof data === 'object') {
      data.meta = {
        timestamp: new Date().toISOString(),
        version: API_CONFIG.version,
        requestId,
        ...data.meta,
      };
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Error handler
const errorHandler = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('API Error', {
    requestId: (req as any).requestId,
    error: err.message,
    stack: err.stack,
  });
  
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors,
      },
    });
  }
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};

// Create Express app
const app = (express as any)();

// Apply middleware
app.use(corsHandler as any);
app.use((express as any).json({ limit: API_CONFIG.maxPayloadSize }));
app.use(requestLogger);
app.use(rateLimiter(API_CONFIG.rateLimit.windowMs, API_CONFIG.rateLimit.maxRequests));

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: API_CONFIG.version,
      uptime: process.uptime(),
    },
  });
});

// API Documentation endpoint
app.get('/docs', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    data: {
      version: API_CONFIG.version,
      baseUrl: API_CONFIG.baseUrl,
      endpoints: [
        {
          method: 'GET',
          path: '/tours',
          description: 'Get list of tours',
          auth: false,
        },
        {
          method: 'POST',
          path: '/tours',
          description: 'Create a new tour',
          auth: true,
        },
        {
          method: 'GET',
          path: '/tours/:id',
          description: 'Get tour by ID',
          auth: false,
        },
        // ... more endpoints
      ],
    },
  });
});

// Tour endpoints
app.get('/tours', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const category = req.query.category as string;
    const city = req.query.city as string;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    
    let query = db.collection('tours').where('status', '==', 'active');
    
    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }
    if (city) {
      query = query.where('location.city', '==', city);
    }
    if (minPrice !== undefined) {
      query = query.where('price', '>=', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.where('price', '<=', maxPrice);
    }
    
    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedQuery = query.orderBy('createdAt', 'desc').offset(offset).limit(limit);
    const snapshot = await paginatedQuery.get();
    
    const tours = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    res.json({
      success: true,
      data: tours,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/tours/:id', async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const tourId = req.params.id;
    const tourDoc = await db.collection('tours').doc(tourId).get();
    
    if (!tourDoc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TOUR_NOT_FOUND',
          message: 'Tour not found',
        },
      });
    }
    
    const tour = {
      id: tourDoc.id,
      ...tourDoc.data(),
    };
    
    res.json({
      success: true,
      data: tour,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/tours', validateAuth, async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const validatedData = schemas.tourCreate.parse(req.body);
    const user = (req as any).user;
    
    // Check if user has permission to create tours
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.role || !['admin', 'tour_operator'].includes(userData.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to create tours',
        },
      });
    }
    
    const tourData = {
      ...validatedData,
      createdBy: user.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      status: 'active',
      bookingCount: 0,
      averageRating: 0,
      reviewCount: 0,
    };
    
    const tourRef = await db.collection('tours').add(tourData);
    
    res.status(201).json({
      success: true,
      data: {
        id: tourRef.id,
        ...tourData,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Booking endpoints
app.post('/bookings', validateAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const validatedData = schemas.bookingCreate.parse(req.body);
    const user = (req as any).user;
    
    // Check tour availability
    const tourDoc = await db.collection('tours').doc(validatedData.tourId).get();
    
    if (!tourDoc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TOUR_NOT_FOUND',
          message: 'Tour not found',
        },
      });
    }
    
    const tourData = tourDoc.data();
    
    // Check availability for selected date
    const selectedDate = new Date(validatedData.selectedDate);
    const existingBookingsQuery = await db
      .collection('bookings')
      .where('tourId', '==', validatedData.tourId)
      .where('selectedDate', '==', selectedDate)
      .where('status', 'in', ['confirmed', 'pending'])
      .get();
    
    const bookedParticipants = existingBookingsQuery.docs.reduce(
      (sum: number, doc: any) => sum + doc.data().participants.length,
      0
    );
    
    if (bookedParticipants + validatedData.participants.length > tourData?.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOUR_FULLY_BOOKED',
          message: 'Tour is fully booked for the selected date',
        },
      });
    }
    
    const bookingData = {
      ...validatedData,
      userId: user.uid,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      paymentStatus: 'pending',
    };
    
    const bookingRef = await db.collection('bookings').add(bookingData);
    
    res.status(201).json({
      success: true,
      data: {
        id: bookingRef.id,
        ...bookingData,
      },
    });
  } catch (error) {
    next(error);
  }
});

// User endpoints
app.get('/users/profile', validateAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const user = (req as any).user;
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
        },
      });
    }
    
    const userData = userDoc.data();
    
    // Remove sensitive data
    delete userData?.hashedPassword;
    delete userData?.refreshTokens;
    
    res.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userData,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.put('/users/profile', validateAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const validatedData = schemas.userUpdate.parse(req.body);
    const user = (req as any).user;
    
    const updateData = {
      ...validatedData,
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    await db.collection('users').doc(user.uid).update(updateData);
    
    res.json({
      success: true,
      data: {
        message: 'Profile updated successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Review endpoints
app.post('/reviews', validateAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const validatedData = schemas.reviewCreate.parse(req.body);
    const user = (req as any).user;
    
    // Check if user has booked this tour
    const bookingQuery = await db
      .collection('bookings')
      .where('userId', '==', user.uid)
      .where('tourId', '==', validatedData.tourId)
      .where('status', '==', 'completed')
      .limit(1)
      .get();
    
    if (bookingQuery.empty) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'REVIEW_NOT_ALLOWED',
          message: 'You can only review tours you have completed',
        },
      });
    }
    
    // Check if user has already reviewed this tour
    const existingReviewQuery = await db
      .collection('reviews')
      .where('userId', '==', user.uid)
      .where('tourId', '==', validatedData.tourId)
      .limit(1)
      .get();
    
    if (!existingReviewQuery.empty) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REVIEW_ALREADY_EXISTS',
          message: 'You have already reviewed this tour',
        },
      });
    }
    
    const reviewData = {
      ...validatedData,
      userId: user.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      verified: true, // Since we verified the booking
    };
    
    const reviewRef = await db.collection('reviews').add(reviewData);
    
    // Update tour rating
    const tourRef = db.collection('tours').doc(validatedData.tourId);
          await db.runTransaction(async (transaction: any) => {
      const tourDoc = await transaction.get(tourRef);
      const tourData = tourDoc.data();
      
      const currentRating = tourData?.averageRating || 0;
      const currentCount = tourData?.reviewCount || 0;
      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + validatedData.rating) / newCount;
      
      transaction.update(tourRef, {
        averageRating: newRating,
        reviewCount: newCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: reviewRef.id,
        ...reviewData,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use(errorHandler);

// Export the Express app as a Firebase Function
export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '1GiB',
    maxInstances: 100,
  },
  app
);

// Additional callable functions for specific operations
export const getApiMetrics = onCall(
  { region: 'us-central1' },
  async (request: CallableRequest) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Check admin permissions
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admin access required');
    }
    
    try {
      // Get API metrics from logs collection
      const logsSnapshot = await db
        .collection('apiLogs')
        .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        .get();
      
      const metrics = {
        totalRequests: logsSnapshot.size,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        endpointStats: {} as any,
      };
      
      let totalResponseTime = 0;
      
      logsSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        
        if (data.response?.statusCode < 400) {
          metrics.successfulRequests++;
        } else {
          metrics.failedRequests++;
        }
        
        totalResponseTime += data.timing?.duration || 0;
        
        const endpoint = `${data.request?.method} ${data.request?.path}`;
        if (!metrics.endpointStats[endpoint]) {
          metrics.endpointStats[endpoint] = {
            requests: 0,
            errors: 0,
            avgResponseTime: 0,
          };
        }
        
        metrics.endpointStats[endpoint].requests++;
        if (data.response?.statusCode >= 400) {
          metrics.endpointStats[endpoint].errors++;
        }
      });
      
      metrics.avgResponseTime = totalResponseTime / metrics.totalRequests || 0;
      
      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      logger.error('Failed to get API metrics:', error);
      throw new HttpsError('internal', 'Failed to get API metrics');
    }
  }
);
