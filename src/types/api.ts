import { Timestamp } from 'firebase/firestore';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId: string;
    cached?: boolean;
    cacheExpiry?: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

// API Request Types
export interface ApiRequest {
  headers: { [key: string]: string };
  query: { [key: string]: string | string[] };
  body?: any;
  user?: {
    uid: string;
    email?: string;
    role: string;
    permissions: string[];
  };
  requestId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

// API Endpoints Configuration
export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  version: string;
  description: string;
  
  // Authentication & Authorization
  auth: {
    required: boolean;
    roles?: string[];
    permissions?: string[];
    rateLimit?: {
      windowMs: number;
      maxRequests: number;
    };
  };
  
  // Request/Response Schema
  schema: {
    request?: {
      headers?: { [key: string]: any };
      query?: { [key: string]: any };
      body?: any;
    };
    response: {
      success: any;
      error?: any;
    };
  };
  
  // Documentation
  docs: {
    summary: string;
    description: string;
    tags: string[];
    examples: {
      request?: any;
      response: any;
    }[];
    deprecated?: boolean;
    deprecatedSince?: string;
    removedIn?: string;
  };
  
  // Configuration
  config: {
    timeout: number;
    retries: number;
    cache?: {
      enabled: boolean;
      ttl: number; // seconds
      strategy: 'public' | 'private' | 'no-cache';
    };
    monitoring: {
      enabled: boolean;
      alertOnErrors: boolean;
      alertThreshold: number; // error rate percentage
    };
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// GraphQL Types
export interface GraphQLSchema {
  id: string;
  version: string;
  schema: string; // SDL (Schema Definition Language)
  resolvers: {
    [typeName: string]: {
      [fieldName: string]: {
        handler: string; // Function name or path
        auth?: {
          required: boolean;
          roles?: string[];
          permissions?: string[];
        };
        cache?: {
          enabled: boolean;
          ttl: number;
        };
        rateLimit?: {
          windowMs: number;
          maxRequests: number;
        };
      };
    };
  };
  
  // Documentation
  docs: {
    description: string;
    examples: {
      query: string;
      variables?: any;
      response: any;
    }[];
  };
  
  // Configuration
  config: {
    introspection: boolean;
    playground: boolean;
    subscriptions: boolean;
    depth: number; // Query depth limit
    complexity: number; // Query complexity limit
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  active: boolean;
}

// API Version Management
export interface ApiVersion {
  id: string;
  version: string; // e.g., "v1", "v2"
  status: 'development' | 'beta' | 'stable' | 'deprecated' | 'sunset';
  releaseDate: Timestamp;
  deprecationDate?: Timestamp;
  sunsetDate?: Timestamp;
  
  changes: {
    type: 'added' | 'modified' | 'deprecated' | 'removed';
    endpoint?: string;
    field?: string;
    description: string;
    breaking: boolean;
  }[];
  
  compatibility: {
    backwardCompatible: boolean;
    forwardCompatible: boolean;
    migrationGuide?: string;
  };
  
  docs: {
    changelog: string;
    migrationGuide?: string;
    breakingChanges?: string[];
  };
}

// API Analytics
export interface ApiAnalytics {
  id: string;
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  
  overview: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    uniqueUsers: number;
    uniqueIPs: number;
  };
  
  byEndpoint: {
    [endpoint: string]: {
      requests: number;
      errors: number;
      avgResponseTime: number;
      statusCodes: { [code: string]: number };
    };
  };
  
  byVersion: {
    [version: string]: {
      requests: number;
      errors: number;
      adoption: number; // percentage
    };
  };
  
  byUser: {
    [userId: string]: {
      requests: number;
      errors: number;
      lastSeen: Date;
    };
  };
  
  errors: {
    code: string;
    message: string;
    count: number;
    endpoints: string[];
    firstSeen: Date;
    lastSeen: Date;
  }[];
  
  performance: {
    slowestEndpoints: {
      endpoint: string;
      avgResponseTime: number;
      p95ResponseTime: number;
    }[];
    highestErrorRates: {
      endpoint: string;
      errorRate: number;
      errorCount: number;
    }[];
  };
}

// API Gateway Configuration
export interface ApiGatewayConfig {
  baseUrl: string;
  versions: string[];
  defaultVersion: string;
  
  // Global settings
  global: {
    timeout: number;
    maxPayloadSize: number; // bytes
    enableCors: boolean;
    corsOrigins: string[];
    enableCompression: boolean;
    enableHttps: boolean;
    redirectHttpToHttps: boolean;
  };
  
  // Authentication
  auth: {
    enabled: boolean;
    providers: ('firebase' | 'jwt' | 'apikey')[];
    defaultProvider: string;
    tokenHeader: string;
    apiKeyHeader: string;
    sessionTimeout: number; // minutes
  };
  
  // Rate Limiting
  rateLimiting: {
    enabled: boolean;
    global: {
      windowMs: number;
      maxRequests: number;
    };
    byUser: {
      windowMs: number;
      maxRequests: number;
    };
    byIP: {
      windowMs: number;
      maxRequests: number;
    };
  };
  
  // Caching
  caching: {
    enabled: boolean;
    provider: 'memory' | 'redis' | 'memcached';
    defaultTTL: number; // seconds
    maxSize: number; // entries
    compression: boolean;
  };
  
  // Logging & Monitoring
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    includeRequestBody: boolean;
    includeResponseBody: boolean;
    excludeHealthChecks: boolean;
    sensitiveFields: string[];
  };
  
  monitoring: {
    enabled: boolean;
    healthCheckPath: string;
    metricsPath: string;
    enablePrometheus: boolean;
    alerting: {
      enabled: boolean;
      errorRateThreshold: number;
      responseTimeThreshold: number;
      channels: string[];
    };
  };
  
  // Security
  security: {
    enableAppCheck: boolean;
    enableCSRF: boolean;
    enableXSS: boolean;
    enableSQLInjection: boolean;
    ipWhitelist?: string[];
    ipBlacklist?: string[];
    headerSizeLimit: number;
    enableSecurityHeaders: boolean;
  };
}

// Webhook Configuration
export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[]; // Event types to subscribe to
  
  // Authentication
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'custom';
    credentials?: {
      token?: string;
      username?: string;
      password?: string;
      headers?: { [key: string]: string };
    };
  };
  
  // Delivery
  delivery: {
    timeout: number; // seconds
    retries: number;
    backoffStrategy: 'linear' | 'exponential';
    maxBackoff: number; // seconds
  };
  
  // Filtering
  filters?: {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
    value: string;
  }[];
  
  // Status
  enabled: boolean;
  lastDelivery?: Timestamp;
  lastSuccess?: Timestamp;
  failureCount: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// API Key Management
export interface ApiKey {
  id: string;
  key: string; // Hashed
  name: string;
  description?: string;
  
  // Permissions
  permissions: {
    endpoints: string[]; // Allowed endpoints
    methods: string[]; // Allowed HTTP methods
    rateLimit?: {
      windowMs: number;
      maxRequests: number;
    };
    ipRestrictions?: string[]; // Allowed IP addresses/ranges
  };
  
  // Usage
  usage: {
    totalRequests: number;
    lastUsed?: Timestamp;
    monthlyRequests: number;
    dailyRequests: number;
  };
  
  // Status
  enabled: boolean;
  expiresAt?: Timestamp;
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
}

// Request/Response Logging
export interface ApiLog {
  id: string;
  requestId: string;
  
  // Request details
  request: {
    method: string;
    path: string;
    version: string;
    query: { [key: string]: any };
    headers: { [key: string]: string };
    body?: any;
    size: number; // bytes
  };
  
  // Response details
  response: {
    statusCode: number;
    headers: { [key: string]: string };
    body?: any;
    size: number; // bytes
    cached: boolean;
  };
  
  // Timing
  timing: {
    startTime: Timestamp;
    endTime: Timestamp;
    duration: number; // milliseconds
    processingTime: number; // Time spent in business logic
    networkTime: number; // Time spent in network I/O
  };
  
  // Context
  context: {
    userId?: string;
    sessionId?: string;
    ipAddress: string;
    userAgent: string;
    referer?: string;
    apiKey?: string;
  };
  
  // Error details (if any)
  error?: {
    code: string;
    message: string;
    stack?: string;
    handled: boolean;
  };
  
  // Metadata
  tags?: string[];
  environment: string;
}

// API Testing Types
export interface ApiTest {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  
  // Test configuration
  config: {
    request: {
      headers?: { [key: string]: string };
      query?: { [key: string]: any };
      body?: any;
    };
    expectations: {
      statusCode: number;
      responseTime?: number; // max response time in ms
      headers?: { [key: string]: string };
      body?: any; // Expected response body or schema
    };
    setup?: string[]; // Setup steps before test
    teardown?: string[]; // Cleanup steps after test
  };
  
  // Test results
  results?: {
    passed: boolean;
    duration: number;
    error?: string;
    response?: {
      statusCode: number;
      headers: { [key: string]: string };
      body: any;
    };
    lastRun: Timestamp;
  };
  
  // Scheduling
  schedule?: {
    enabled: boolean;
    cron: string; // Cron expression
    timezone: string;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// Circuit Breaker Pattern
export interface CircuitBreakerConfig {
  id: string;
  service: string;
  
  // Thresholds
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes before closing
  timeout: number; // Timeout for requests in ms
  
  // State management
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureTime?: Timestamp;
  nextAttemptTime?: Timestamp;
  
  // Configuration
  resetTimeout: number; // Time to wait before trying again in ms
  monitoringWindow: number; // Time window for monitoring in ms
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
