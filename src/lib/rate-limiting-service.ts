// Rate Limiting & DDoS Protection Service for TourTrip.app
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  RateLimitConfig,
  RateLimitEntry,
  RateLimitViolation,
  RateLimitResult,
  RateLimitIdentifier,
  HttpMethod,
  UserTier,
  RateLimitActionType,
  ViolationSeverity,
  RateLimitMetadata,
  DDoSProtectionConfig,
  AttackSeverity,
  DDoSAction,
  CircuitBreakerConfig,
  RateLimitAnalytics,
  AnalyticsPeriod
} from '@/types/rate-limiting';
import { analyticsService } from './analytics-service';
import { errorService } from './error-service';

export class RateLimitingService {
  private static config: RateLimitConfig = {
    global: {
      enabled: true,
      windowSize: 60, // 1 minute
      maxRequests: 1000,
      burstSize: 100,
      gracePeriod: 10,
      excludeHealthChecks: true,
      excludeAuthenticated: false,
    },
    endpoints: [
      {
        id: 'api_auth',
        path: '/api/auth/*',
        method: [HttpMethod.POST],
        enabled: true,
        limits: [
          {
            windowSize: 60, // 1 minute
            maxRequests: 5,
            identifier: RateLimitIdentifier.IP,
            burstSize: 2,
          },
          {
            windowSize: 3600, // 1 hour
            maxRequests: 20,
            identifier: RateLimitIdentifier.IP,
          },
        ],
        customHeaders: true,
        skipIfAuthenticated: false,
        priority: 1,
        description: 'Authentication endpoints protection',
      },
      {
        id: 'api_search',
        path: '/api/search/*',
        method: [HttpMethod.GET, HttpMethod.POST],
        enabled: true,
        limits: [
          {
            windowSize: 60,
            maxRequests: 100,
            identifier: RateLimitIdentifier.IP,
          },
          {
            windowSize: 60,
            maxRequests: 200,
            identifier: RateLimitIdentifier.USER_ID,
          },
        ],
        customHeaders: true,
        skipIfAuthenticated: false,
        priority: 2,
        description: 'Search API endpoints',
      },
      {
        id: 'api_booking',
        path: '/api/booking/*',
        method: [HttpMethod.POST, HttpMethod.PUT],
        enabled: true,
        limits: [
          {
            windowSize: 60,
            maxRequests: 10,
            identifier: RateLimitIdentifier.USER_ID,
          },
          {
            windowSize: 3600,
            maxRequests: 50,
            identifier: RateLimitIdentifier.USER_ID,
          },
        ],
        customHeaders: true,
        skipIfAuthenticated: false,
        priority: 1,
        description: 'Booking operation protection',
      },
    ],
    userTiers: [
      {
        tier: UserTier.ANONYMOUS,
        multiplier: 0.5,
        exemptions: [],
        quotas: [
          {
            resource: 'api_calls' as any,
            limit: 100,
            period: 'hour' as any,
            carryOver: false,
            burst: false,
          },
        ],
      },
      {
        tier: UserTier.FREE,
        multiplier: 1.0,
        exemptions: [],
        quotas: [
          {
            resource: 'api_calls' as any,
            limit: 1000,
            period: 'hour' as any,
            carryOver: false,
            burst: true,
          },
        ],
      },
      {
        tier: UserTier.PREMIUM,
        multiplier: 2.0,
        exemptions: ['/api/premium/*'],
        quotas: [
          {
            resource: 'api_calls' as any,
            limit: 5000,
            period: 'hour' as any,
            carryOver: true,
            burst: true,
          },
        ],
      },
      {
        tier: UserTier.BUSINESS,
        multiplier: 5.0,
        exemptions: ['/api/premium/*', '/api/business/*'],
        quotas: [
          {
            resource: 'api_calls' as any,
            limit: 20000,
            period: 'hour' as any,
            carryOver: true,
            burst: true,
          },
        ],
      },
      {
        tier: UserTier.ADMIN,
        multiplier: 10.0,
        exemptions: ['*'],
        quotas: [],
      },
    ],
    ipBased: {
      enabled: true,
      whitelistedIPs: ['127.0.0.1', '::1'],
      blacklistedIPs: [],
      geolocation: {
        enabled: true,
        allowedCountries: [], // Empty means all allowed
        blockedCountries: ['CN', 'RU', 'KP'], // High-risk countries
        allowVPN: false,
        allowTor: false,
        allowProxy: false,
        requireVerification: true,
      },
      suspicious: {
        enabled: true,
        rapidRequestThreshold: 100,
        failedAuthThreshold: 10,
        multipleAccountThreshold: 5,
        timeWindow: 5,
        blockDuration: 30,
        progressiveBlocking: true,
      },
      reputation: {
        enabled: true,
        providers: [],
        trustScore: 70,
        cacheTime: 60,
        fallbackAction: 'allow',
      },
    },
    ddosProtection: {
      enabled: true,
      detection: {
        enabled: true,
        thresholds: [
          {
            metric: 'requests_per_second' as any,
            threshold: 1000,
            timeWindow: 60,
            severity: AttackSeverity.HIGH,
            action: DDoSAction.THROTTLE,
          },
          {
            metric: 'error_rate' as any,
            threshold: 50, // 50% error rate
            timeWindow: 300,
            severity: AttackSeverity.MEDIUM,
            action: DDoSAction.LOG,
          },
        ],
        patterns: [],
        anomalyDetection: {
          enabled: true,
          algorithm: 'statistical',
          sensitivity: 7,
          learningPeriod: 7,
          baselineWindow: 24,
          adaptiveThresholds: true,
        },
        monitoring: {
          realTime: true,
          alertThresholds: [],
          dashboards: [],
          exportLogs: true,
          retentionPeriod: 30,
        },
      },
      mitigation: {
        autoMitigation: true,
        strategies: [],
        fallbackActions: [],
        collaborativeDefense: false,
        trafficShaping: {
          enabled: true,
          priorityQueues: [],
          bandwidthLimits: [],
          congestionControl: {
            algorithm: 'token_bucket',
            parameters: {},
            backpressure: true,
          },
        },
      },
      cloudflare: {
        enabled: false,
        zoneId: '',
        apiKey: '',
        email: '',
        settings: {
          ddosProtection: true,
          rateLimit: true,
          bot: {
            enabled: true,
            mode: 'medium',
            challengePassage: 30,
            javaScriptDetection: true,
          },
          firewall: {
            enabled: true,
            rules: [],
            geoBlocking: [],
            ipWhitelist: [],
            ipBlacklist: [],
          },
          caching: {
            level: 'aggressive',
            browserTTL: 14400,
            edgeTTL: 7200,
            alwaysOnline: true,
          },
        },
      },
      awsShield: {
        enabled: false,
        advanced: false,
        emergencyContacts: [],
        proactiveEngagement: false,
        ddosResponseTeam: false,
      },
      customRules: [],
    },
    circuitBreakers: [],
    monitoring: {
      enabled: true,
      realTime: true,
      metrics: [],
      alerts: [],
      dashboards: [],
      exportConfig: {
        enabled: true,
        destinations: [],
        format: 'json',
        interval: 5,
        retention: 30,
      },
    },
    actions: [],
  };

  private static circuitBreakers: Map<string, any> = new Map();

  // Core Rate Limiting
  static async checkRateLimit(
    identifier: string,
    endpoint: string,
    method: HttpMethod,
    userTier: UserTier = UserTier.ANONYMOUS,
    metadata: Partial<RateLimitMetadata> = {}
  ): Promise<RateLimitResult> {
    try {
      // Check if globally enabled
      if (!this.config.global.enabled) {
        return { allowed: true, remaining: Infinity, resetTime: Timestamp.now() };
      }

      // Check whitelist
      if (this.isWhitelisted(identifier, metadata.ipAddress)) {
        return { allowed: true, remaining: Infinity, resetTime: Timestamp.now() };
      }

      // Check blacklist
      if (this.isBlacklisted(identifier, metadata.ipAddress)) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: Timestamp.now(),
          reason: 'IP blacklisted',
          action: RateLimitActionType.BLOCK,
        };
      }

      // Find applicable endpoint configuration
      const endpointConfig = this.findEndpointConfig(endpoint, method);
      if (!endpointConfig || !endpointConfig.enabled) {
        return { allowed: true, remaining: Infinity, resetTime: Timestamp.now() };
      }

      // Check each rate limit for this endpoint
      for (const rateLimit of endpointConfig.limits) {
        const result = await this.checkSpecificLimit(
          identifier,
          endpoint,
          method,
          rateLimit,
          userTier,
          metadata
        );

        if (!result.allowed) {
          // Log violation
          await this.logViolation(identifier, endpoint, method, rateLimit, userTier, metadata);
          return result;
        }
      }

      // All checks passed
      return { allowed: true, remaining: 1000, resetTime: Timestamp.now() };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Fail open - allow request if rate limiting service fails
      return { allowed: true, remaining: 0, resetTime: Timestamp.now() };
    }
  }

  private static isWhitelisted(identifier: string, ipAddress?: string): boolean {
    if (ipAddress && this.config.ipBased.whitelistedIPs.includes(ipAddress)) {
      return true;
    }
    return false;
  }

  private static isBlacklisted(identifier: string, ipAddress?: string): boolean {
    if (ipAddress && this.config.ipBased.blacklistedIPs.includes(ipAddress)) {
      return true;
    }
    return false;
  }

  private static findEndpointConfig(endpoint: string, method: HttpMethod): any {
    return this.config.endpoints.find(config => {
      const pathMatches = this.matchPath(config.path, endpoint);
      const methodMatches = config.method.includes(method);
      return pathMatches && methodMatches;
    });
  }

  private static matchPath(pattern: string, path: string): boolean {
    // Simple pattern matching - in production, use a proper pattern matching library
    const regex = pattern.replace(/\*/g, '.*');
    return new RegExp(`^${regex}$`).test(path);
  }

  private static async checkSpecificLimit(
    identifier: string,
    endpoint: string,
    method: HttpMethod,
    rateLimit: any,
    userTier: UserTier,
    metadata: Partial<RateLimitMetadata>
  ): Promise<RateLimitResult> {
    const key = this.generateRateLimitKey(identifier, endpoint, method, rateLimit.identifier);
    const now = Timestamp.now();
    const windowStart = Timestamp.fromMillis(now.toMillis() - (rateLimit.windowSize * 1000));

    try {
      // Get current rate limit entry
      const entryDoc = await getDoc(doc(db, 'rateLimitEntries', key));
      let entry: RateLimitEntry;

      if (entryDoc.exists()) {
        entry = entryDoc.data() as RateLimitEntry;
        
        // Check if window has expired
        if (entry.windowEnd.toMillis() < now.toMillis()) {
          // Reset counter for new window
          entry = {
            ...entry,
            count: 0,
            windowStart: windowStart,
            windowEnd: Timestamp.fromMillis(windowStart.toMillis() + (rateLimit.windowSize * 1000)),
          };
        }
      } else {
        // Create new entry
        entry = {
          id: key,
          identifier,
          identifierType: rateLimit.identifier,
          endpoint,
          method,
          count: 0,
          windowStart,
          windowEnd: Timestamp.fromMillis(windowStart.toMillis() + (rateLimit.windowSize * 1000)),
          lastRequest: now,
          blocked: false,
          userTier,
          metadata: metadata as RateLimitMetadata,
        };
      }

      // Apply user tier multiplier
      const tierConfig = this.config.userTiers.find(tier => tier.tier === userTier);
      const effectiveLimit = Math.floor(rateLimit.maxRequests * (tierConfig?.multiplier || 1));

      // Check if limit exceeded
      if (entry.count >= effectiveLimit) {
        const resetTime = entry.windowEnd;
        const retryAfter = Math.ceil((resetTime.toMillis() - now.toMillis()) / 1000);

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter,
          reason: `Rate limit exceeded: ${entry.count}/${effectiveLimit} requests`,
          action: RateLimitActionType.THROTTLE,
        };
      }

      // Allow request
      const remaining = effectiveLimit - entry.count - 1;
      return {
        allowed: true,
        remaining,
        resetTime: entry.windowEnd,
      };
    } catch (error) {
      console.error('Error checking specific rate limit:', error);
      return { allowed: true, remaining: 0, resetTime: now };
    }
  }

  static async incrementCounter(
    identifier: string,
    endpoint: string,
    method: HttpMethod,
    metadata: Partial<RateLimitMetadata>
  ): Promise<void> {
    try {
      const endpointConfig = this.findEndpointConfig(endpoint, method);
      if (!endpointConfig || !endpointConfig.enabled) {
        return;
      }

      for (const rateLimit of endpointConfig.limits) {
        const key = this.generateRateLimitKey(identifier, endpoint, method, rateLimit.identifier);
        
        await runTransaction(db, async (transaction) => {
          const entryRef = doc(db, 'rateLimitEntries', key);
          const entryDoc = await transaction.get(entryRef);
          
          if (entryDoc.exists()) {
            transaction.update(entryRef, {
              count: increment(1),
              lastRequest: serverTimestamp(),
              metadata,
            });
          } else {
            const now = Timestamp.now();
            const windowStart = Timestamp.fromMillis(now.toMillis() - (rateLimit.windowSize * 1000));
            
            const newEntry: RateLimitEntry = {
              id: key,
              identifier,
              identifierType: rateLimit.identifier,
              endpoint,
              method,
              count: 1,
              windowStart,
              windowEnd: Timestamp.fromMillis(windowStart.toMillis() + (rateLimit.windowSize * 1000)),
              lastRequest: now,
              blocked: false,
              metadata: metadata as RateLimitMetadata,
            };
            
            transaction.set(entryRef, newEntry);
          }
        });
      }
    } catch (error) {
      console.error('Error incrementing rate limit counter:', error);
    }
  }

  private static generateRateLimitKey(
    identifier: string,
    endpoint: string,
    method: HttpMethod,
    identifierType: RateLimitIdentifier
  ): string {
    const sanitizedEndpoint = endpoint.replace(/[^\w\-]/g, '_');
    return `${identifierType}_${identifier}_${sanitizedEndpoint}_${method}`;
  }

  private static async logViolation(
    identifier: string,
    endpoint: string,
    method: HttpMethod,
    rateLimit: any,
    userTier: UserTier,
    metadata: Partial<RateLimitMetadata>
  ): Promise<void> {
    try {
      const violation: RateLimitViolation = {
        id: '',
        identifier,
        identifierType: rateLimit.identifier,
        endpoint,
        method,
        limitType: 'rate_limit',
        limit: rateLimit.maxRequests,
        actual: rateLimit.maxRequests + 1, // Approximation
        windowSize: rateLimit.windowSize,
        timestamp: Timestamp.now(),
        action: RateLimitActionType.THROTTLE,
        severity: this.calculateViolationSeverity(rateLimit.maxRequests + 1, rateLimit.maxRequests),
        metadata: metadata as RateLimitMetadata,
        resolved: false,
      };

      const violationRef = await addDoc(collection(db, 'rateLimitViolations'), violation);
      violation.id = violationRef.id;
      
      await updateDoc(violationRef, { id: violationRef.id });

      // Track analytics
      analyticsService.logEvent({
        name: 'rate_limit_violation',
        params: {
          identifier,
          endpoint,
          method,
          limit: rateLimit.maxRequests,
          severity: violation.severity,
          user_tier: userTier,
        },
      });
    } catch (error) {
      console.error('Error logging rate limit violation:', error);
    }
  }

  private static calculateViolationSeverity(actual: number, limit: number): ViolationSeverity {
    const ratio = actual / limit;
    
    if (ratio >= 5) return ViolationSeverity.CRITICAL;
    if (ratio >= 3) return ViolationSeverity.HIGH;
    if (ratio >= 2) return ViolationSeverity.MEDIUM;
    return ViolationSeverity.LOW;
  }

  // DDoS Protection
  static async detectDDoSAttack(metrics: any): Promise<boolean> {
    try {
      if (!this.config.ddosProtection.enabled) {
        return false;
      }

      for (const threshold of this.config.ddosProtection.detection.thresholds) {
        if (this.checkDDoSThreshold(metrics, threshold)) {
          await this.triggerDDoSMitigation(threshold);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error detecting DDoS attack:', error);
      return false;
    }
  }

  private static checkDDoSThreshold(metrics: any, threshold: any): boolean {
    const metricValue = metrics[threshold.metric];
    if (metricValue === undefined) return false;

    return metricValue >= threshold.threshold;
  }

  private static async triggerDDoSMitigation(threshold: any): Promise<void> {
    try {
      console.warn(`DDoS attack detected: ${threshold.metric} exceeded threshold`, threshold);

      // Log attack
      await addDoc(collection(db, 'ddosAttacks'), {
        metric: threshold.metric,
        threshold: threshold.threshold,
        severity: threshold.severity,
        action: threshold.action,
        detectedAt: serverTimestamp(),
        mitigated: false,
      });

      // Apply mitigation based on action
      switch (threshold.action) {
        case DDoSAction.THROTTLE:
          await this.enableThrottling(threshold.severity);
          break;
        case DDoSAction.BLOCK:
          await this.enableBlocking(threshold.severity);
          break;
        case DDoSAction.CHALLENGE:
          await this.enableChallenge(threshold.severity);
          break;
        default:
          console.log(`DDoS attack logged only: ${threshold.metric}`);
      }

      analyticsService.logEvent({
        name: 'ddos_attack_detected',
        params: {
          metric: threshold.metric,
          severity: threshold.severity,
          action: threshold.action,
        },
      });
    } catch (error) {
      console.error('Error triggering DDoS mitigation:', error);
    }
  }

  private static async enableThrottling(severity: AttackSeverity): Promise<void> {
    // Implement throttling logic based on severity
    const throttleMultiplier = severity === AttackSeverity.CRITICAL ? 0.1 : 
                             severity === AttackSeverity.HIGH ? 0.3 : 0.5;
    
    // Temporarily reduce rate limits
    console.log(`Enabling throttling with multiplier: ${throttleMultiplier}`);
  }

  private static async enableBlocking(severity: AttackSeverity): Promise<void> {
    // Implement IP blocking logic
    console.log(`Enabling IP blocking for severity: ${severity}`);
  }

  private static async enableChallenge(severity: AttackSeverity): Promise<void> {
    // Implement challenge-response logic
    console.log(`Enabling challenge for severity: ${severity}`);
  }

  // Circuit Breaker Pattern
  static async checkCircuitBreaker(serviceId: string): Promise<boolean> {
    try {
      const config = this.config.circuitBreakers.find(cb => cb.service === serviceId);
      if (!config || !config.enabled) {
        return true; // Allow if no circuit breaker configured
      }

      const breaker = this.circuitBreakers.get(serviceId);
      if (!breaker) {
        // Initialize circuit breaker
        this.initializeCircuitBreaker(serviceId, config);
        return true;
      }

      return breaker.allowRequest();
    } catch (error) {
      console.error('Error checking circuit breaker:', error);
      return true; // Fail open
    }
  }

  private static initializeCircuitBreaker(serviceId: string, config: CircuitBreakerConfig): void {
    const breaker = {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null,
      allowRequest: () => {
        if (breaker.state === 'CLOSED') {
          return true;
        } else if (breaker.state === 'OPEN') {
          const now = Date.now();
          if (now - breaker.lastFailureTime >= config.resetTimeout) {
            breaker.state = 'HALF_OPEN';
            breaker.successCount = 0;
            return true;
          }
          return false;
        } else { // HALF_OPEN
          return true;
        }
      },
      recordSuccess: () => {
        breaker.failureCount = 0;
        if (breaker.state === 'HALF_OPEN') {
          breaker.successCount++;
          if (breaker.successCount >= config.successThreshold) {
            breaker.state = 'CLOSED';
          }
        }
      },
      recordFailure: () => {
        breaker.failureCount++;
        breaker.lastFailureTime = Date.now();
        if (breaker.failureCount >= config.failureThreshold) {
          breaker.state = 'OPEN';
        }
      },
    };

    this.circuitBreakers.set(serviceId, breaker);
  }

  static recordCircuitBreakerResult(serviceId: string, success: boolean): void {
    const breaker = this.circuitBreakers.get(serviceId);
    if (breaker) {
      if (success) {
        breaker.recordSuccess();
      } else {
        breaker.recordFailure();
      }
    }
  }

  // Analytics & Reporting
  static async getRateLimitAnalytics(period: AnalyticsPeriod): Promise<RateLimitAnalytics> {
    try {
      // Get violations in the period
      const violationsQuery = query(
        collection(db, 'rateLimitViolations'),
        where('timestamp', '>=', period.start),
        where('timestamp', '<=', period.end),
        orderBy('timestamp', 'desc')
      );

      const violationDocs = await getDocs(violationsQuery);
      const violations = violationDocs.docs.map(doc => doc.data() as RateLimitViolation);

      // Get rate limit entries for the period
      const entriesQuery = query(
        collection(db, 'rateLimitEntries'),
        where('lastRequest', '>=', period.start),
        where('lastRequest', '<=', period.end),
        orderBy('lastRequest', 'desc'),
        limit(1000)
      );

      const entryDocs = await getDocs(entriesQuery);
      const entries = entryDocs.docs.map(doc => doc.data() as RateLimitEntry);

      // Calculate analytics
      const analytics: RateLimitAnalytics = {
        period,
        summary: this.calculateSummary(entries, violations),
        topViolators: this.calculateTopViolators(violations),
        endpointAnalytics: this.calculateEndpointAnalytics(entries, violations),
        geographicAnalytics: this.calculateGeographicAnalytics(violations),
        timeSeriesData: this.calculateTimeSeriesData(entries, violations, period),
        patterns: this.analyzePatterns(violations),
        recommendations: this.generateRecommendations(violations, entries),
      };

      return analytics;
    } catch (error) {
      console.error('Error getting rate limit analytics:', error);
      throw errorService.createAppError(error as Error, {
        code: 'RATE_LIMIT_ANALYTICS_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  private static calculateSummary(entries: RateLimitEntry[], violations: RateLimitViolation[]): any {
    const totalRequests = entries.reduce((sum, entry) => sum + entry.count, 0);
    const blockedRequests = violations.length;
    const allowedRequests = totalRequests - blockedRequests;

    const endpointStats: any = {};
    entries.forEach(entry => {
      if (!endpointStats[entry.endpoint]) {
        endpointStats[entry.endpoint] = { requests: 0, blocked: 0 };
      }
      endpointStats[entry.endpoint].requests += entry.count;
    });

    violations.forEach(violation => {
      if (endpointStats[violation.endpoint]) {
        endpointStats[violation.endpoint].blocked++;
      }
    });

    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]: [string, any]) => ({
        endpoint,
        requests: stats.requests,
        blocked: stats.blocked,
        blockRate: stats.requests > 0 ? (stats.blocked / stats.requests) * 100 : 0,
        averageResponseTime: 200, // Would calculate from actual response times
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    return {
      totalRequests,
      blockedRequests,
      allowedRequests,
      blockRate: totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0,
      topEndpoints,
      topCountries: [], // Would calculate from geolocation data
      averageResponseTime: 200,
      peakRequestsPerSecond: 100, // Would calculate from time series data
    };
  }

  private static calculateTopViolators(violations: RateLimitViolation[]): any[] {
    const violatorMap: { [key: string]: any } = {};

    violations.forEach(violation => {
      if (!violatorMap[violation.identifier]) {
        violatorMap[violation.identifier] = {
          identifier: violation.identifier,
          identifierType: violation.identifierType,
          violations: 0,
          totalRequests: 0,
          lastViolation: violation.timestamp,
          severity: ViolationSeverity.LOW,
          status: 'active',
        };
      }

      const violator = violatorMap[violation.identifier];
      violator.violations++;
      violator.totalRequests += violation.actual;
      
      if (violation.timestamp.toMillis() > violator.lastViolation.toMillis()) {
        violator.lastViolation = violation.timestamp;
      }

      if (violation.severity === ViolationSeverity.CRITICAL || 
          (violation.severity === ViolationSeverity.HIGH && violator.severity !== ViolationSeverity.CRITICAL)) {
        violator.severity = violation.severity;
      }
    });

    return Object.values(violatorMap)
      .map((violator: any) => ({
        ...violator,
        violationRate: violator.totalRequests > 0 ? (violator.violations / violator.totalRequests) * 100 : 0,
      }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 10);
  }

  private static calculateEndpointAnalytics(entries: RateLimitEntry[], violations: RateLimitViolation[]): any[] {
    const endpointMap: { [key: string]: any } = {};

    entries.forEach(entry => {
      const key = `${entry.endpoint}_${entry.method}`;
      if (!endpointMap[key]) {
        endpointMap[key] = {
          endpoint: entry.endpoint,
          method: entry.method,
          requests: 0,
          violations: 0,
          averageResponseTime: 200,
          errorRate: 0,
          topUsers: [],
          timeDistribution: [],
        };
      }
      endpointMap[key].requests += entry.count;
    });

    violations.forEach(violation => {
      const key = `${violation.endpoint}_${violation.method}`;
      if (endpointMap[key]) {
        endpointMap[key].violations++;
      }
    });

    return Object.values(endpointMap).slice(0, 20);
  }

  private static calculateGeographicAnalytics(violations: RateLimitViolation[]): any[] {
    const countryMap: { [key: string]: any } = {};

    violations.forEach(violation => {
      const country = violation.metadata?.country || 'Unknown';
      if (!countryMap[country]) {
        countryMap[country] = {
          country,
          requests: 0,
          violations: 0,
          suspiciousActivity: false,
          riskScore: 0,
        };
      }
      
      countryMap[country].violations++;
      countryMap[country].requests += violation.actual;
    });

    return Object.values(countryMap)
      .map((country: any) => ({
        ...country,
        blockRate: country.requests > 0 ? (country.violations / country.requests) * 100 : 0,
        riskScore: Math.min(country.violations * 10, 100),
        suspiciousActivity: country.violations > 10,
      }))
      .sort((a, b) => b.violations - a.violations);
  }

  private static calculateTimeSeriesData(entries: RateLimitEntry[], violations: RateLimitViolation[], period: AnalyticsPeriod): any[] {
    // Group data by time buckets based on granularity
    const bucketSize = this.getBucketSize(period.granularity);
    const buckets: { [key: number]: any } = {};

    // Initialize buckets
    const start = period.start.toMillis();
    const end = period.end.toMillis();
    
    for (let time = start; time <= end; time += bucketSize) {
      buckets[time] = {
        timestamp: Timestamp.fromMillis(time),
        requests: 0,
        blocked: 0,
        violations: 0,
        responseTime: 200,
        errorRate: 0,
        concurrentConnections: 0,
      };
    }

    // Populate buckets with data
    entries.forEach(entry => {
      const bucketTime = Math.floor(entry.lastRequest.toMillis() / bucketSize) * bucketSize;
      if (buckets[bucketTime]) {
        buckets[bucketTime].requests += entry.count;
      }
    });

    violations.forEach(violation => {
      const bucketTime = Math.floor(violation.timestamp.toMillis() / bucketSize) * bucketSize;
      if (buckets[bucketTime]) {
        buckets[bucketTime].violations++;
        buckets[bucketTime].blocked++;
      }
    });

    return Object.values(buckets);
  }

  private static getBucketSize(granularity: string): number {
    switch (granularity) {
      case 'minute': return 60 * 1000;
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // Default to hour
    }
  }

  private static analyzePatterns(violations: RateLimitViolation[]): any[] {
    // Simple pattern analysis - in production, use more sophisticated algorithms
    const patterns: any[] = [];

    // Check for rapid burst patterns
    const burstThreshold = 10; // violations in 1 minute
    const burstWindow = 60 * 1000; // 1 minute

    const burstGroups: { [key: string]: RateLimitViolation[] } = {};
    
    violations.forEach(violation => {
      const key = violation.identifier;
      if (!burstGroups[key]) {
        burstGroups[key] = [];
      }
      burstGroups[key].push(violation);
    });

    Object.entries(burstGroups).forEach(([identifier, groupViolations]) => {
      // Sort by timestamp
      groupViolations.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      
      // Look for bursts
      for (let i = 0; i < groupViolations.length - burstThreshold; i++) {
        const startTime = groupViolations[i].timestamp.toMillis();
        const endTime = groupViolations[i + burstThreshold - 1].timestamp.toMillis();
        
        if (endTime - startTime <= burstWindow) {
          patterns.push({
            pattern: 'rapid_burst',
            description: `${burstThreshold} violations in ${burstWindow / 1000} seconds`,
            occurrences: 1,
            severity: ViolationSeverity.HIGH,
            confidence: 90,
            firstSeen: groupViolations[i].timestamp,
            lastSeen: groupViolations[i + burstThreshold - 1].timestamp,
            affectedEndpoints: [...new Set(groupViolations.slice(i, i + burstThreshold).map(v => v.endpoint))],
            affectedUsers: [identifier],
          });
        }
      }
    });

    return patterns;
  }

  private static generateRecommendations(violations: RateLimitViolation[], entries: RateLimitEntry[]): any[] {
    const recommendations: any[] = [];

    // Check for endpoints with high violation rates
    const endpointViolations: { [key: string]: number } = {};
    const endpointRequests: { [key: string]: number } = {};

    violations.forEach(violation => {
      endpointViolations[violation.endpoint] = (endpointViolations[violation.endpoint] || 0) + 1;
    });

    entries.forEach(entry => {
      endpointRequests[entry.endpoint] = (endpointRequests[entry.endpoint] || 0) + entry.count;
    });

    Object.entries(endpointViolations).forEach(([endpoint, violationCount]) => {
      const requestCount = endpointRequests[endpoint] || 0;
      const violationRate = requestCount > 0 ? (violationCount / requestCount) * 100 : 0;

      if (violationRate > 20) { // High violation rate
        recommendations.push({
          type: 'threshold_adjustment',
          description: `Increase rate limit for ${endpoint}`,
          rationale: `High violation rate (${violationRate.toFixed(1)}%) suggests legitimate traffic is being blocked`,
          impact: 'medium',
          confidence: 80,
          proposedChange: {
            endpoint,
            action: 'increase_limit',
            currentLimit: 100, // Would get from actual config
            proposedLimit: 150,
          },
          estimatedReduction: 50,
        });
      }
    });

    // Check for frequently violated IPs that might need whitelisting
    const ipViolations: { [key: string]: number } = {};
    violations.forEach(violation => {
      if (violation.identifierType === RateLimitIdentifier.IP) {
        ipViolations[violation.identifier] = (ipViolations[violation.identifier] || 0) + 1;
      }
    });

    Object.entries(ipViolations).forEach(([ip, violationCount]) => {
      if (violationCount > 50) { // Frequent violator
        recommendations.push({
          type: 'whitelist_addition',
          description: `Consider whitelisting IP ${ip}`,
          rationale: `IP has ${violationCount} violations - might be legitimate heavy user`,
          impact: 'low',
          confidence: 60,
          proposedChange: {
            type: 'add_to_whitelist',
            ip,
          },
          estimatedReduction: 30,
        });
      }
    });

    return recommendations;
  }

  // Configuration Management
  static async updateConfig(updates: Partial<RateLimitConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...updates };
      
      // Save to Firestore
      await updateDoc(doc(db, 'rateLimitConfig', 'main'), {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      analyticsService.logEvent({
        name: 'rate_limit_config_updated',
        params: {
          updated_sections: Object.keys(updates),
        },
      });
    } catch (error) {
      console.error('Error updating rate limit config:', error);
      throw errorService.createAppError(error as Error, {
        code: 'RATE_LIMIT_CONFIG_UPDATE_FAILED',
        category: 'configuration',
        severity: 'high',
      });
    }
  }

  static getConfig(): RateLimitConfig {
    return this.config;
  }

  // Cleanup old entries
  static async cleanupOldEntries(): Promise<void> {
    try {
      const cutoffTime = Timestamp.fromMillis(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago
      
      const oldEntriesQuery = query(
        collection(db, 'rateLimitEntries'),
        where('windowEnd', '<', cutoffTime)
      );

      const oldEntries = await getDocs(oldEntriesQuery);
      
      for (const entryDoc of oldEntries.docs) {
        await deleteDoc(entryDoc.ref);
      }

      console.log(`Cleaned up ${oldEntries.size} old rate limit entries`);
    } catch (error) {
      console.error('Error cleaning up old rate limit entries:', error);
    }
  }
}

export default RateLimitingService;
