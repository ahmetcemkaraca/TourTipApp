import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  serverTimestamp, 
  Timestamp,
  runTransaction 
} from 'firebase/firestore';
import { 
  SecurityEvent, 
  SecurityRule, 
  ThreatDetection, 
  SecurityPolicy, 
  SecurityAudit, 
  SecurityFinding,
  DeviceFingerprint,
  SecurityMetrics,
  SecurityConfiguration,
  SecurityEventType,
  SecurityLevel,
  ThreatLevel 
} from '@/types/advanced-security';
import { AppError } from '@/types/error';
import { analytics } from '@/lib/analytics-service';

// Security configuration from environment
const securityConfig: SecurityConfiguration = {
  appCheck: {
    enabled: process.env.NEXT_PUBLIC_ADVANCED_SECURITY_APP_CHECK === 'true',
    providers: {
      recaptchaV3: {
        enabled: process.env.NEXT_PUBLIC_RECAPTCHA_V3_ENABLED === 'true',
        siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY || '',
        scoreThreshold: parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5'),
      },
      debug: {
        enabled: process.env.NODE_ENV === 'development',
        debugTokens: process.env.FIREBASE_APP_CHECK_DEBUG_TOKENS?.split(',') || [],
      },
    },
    enforcementLevel: (process.env.APP_CHECK_ENFORCEMENT as any) || 'unenforced',
  },
  recaptcha: {
    v2: {
      enabled: process.env.NEXT_PUBLIC_RECAPTCHA_V2_ENABLED === 'true',
      siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY,
    },
    v3: {
      enabled: process.env.NEXT_PUBLIC_RECAPTCHA_V3_ENABLED === 'true',
      siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY,
      scoreThreshold: parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5'),
    },
    enterprise: {
      enabled: process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_ENABLED === 'true',
      projectId: process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID,
      siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY,
    },
  },
  biometricAuth: {
    enabled: process.env.NEXT_PUBLIC_BIOMETRIC_AUTH_ENABLED === 'true',
    supportedMethods: ['fingerprint', 'face'],
    fallbackToPassword: true,
    maxAttempts: 3,
    timeout: 30,
  },
  monitoring: {
    enableRealTimeAlerts: process.env.SECURITY_REAL_TIME_ALERTS === 'true',
    alertThresholds: {
      failedLoginRate: parseInt(process.env.SECURITY_FAILED_LOGIN_THRESHOLD || '10', 10),
      suspiciousActivityScore: parseInt(process.env.SECURITY_SUSPICIOUS_SCORE_THRESHOLD || '80', 10),
      newDeviceLogins: parseInt(process.env.SECURITY_NEW_DEVICE_THRESHOLD || '5', 10),
      dataExfiltrationSize: parseInt(process.env.SECURITY_DATA_EXFIL_THRESHOLD || '10485760', 10), // 10MB
    },
    alertChannels: {
      email: process.env.SECURITY_ALERT_EMAILS?.split(','),
      slack: process.env.SECURITY_ALERT_SLACK_WEBHOOK,
      webhook: process.env.SECURITY_ALERT_WEBHOOK,
    },
  },
  automation: {
    autoBlockSuspiciousIPs: process.env.SECURITY_AUTO_BLOCK_IPS === 'true',
    autoLockCompromisedAccounts: process.env.SECURITY_AUTO_LOCK_ACCOUNTS === 'true',
    autoRequireMFAForHighRisk: process.env.SECURITY_AUTO_REQUIRE_MFA === 'true',
    autoRotateSessionsOnThreat: process.env.SECURITY_AUTO_ROTATE_SESSIONS === 'true',
  },
  compliance: {
    gdpr: {
      enabled: process.env.SECURITY_GDPR_ENABLED === 'true',
      dataRetentionDays: parseInt(process.env.SECURITY_GDPR_RETENTION_DAYS || '365', 10),
      consentRequired: process.env.SECURITY_GDPR_CONSENT_REQUIRED === 'true',
    },
    kvkk: {
      enabled: process.env.SECURITY_KVKK_ENABLED === 'true',
      dataRetentionDays: parseInt(process.env.SECURITY_KVKV_RETENTION_DAYS || '365', 10),
      explicitConsent: process.env.SECURITY_KVKV_EXPLICIT_CONSENT === 'true',
    },
    auditTrail: {
      enabled: process.env.SECURITY_AUDIT_TRAIL_ENABLED === 'true',
      retentionDays: parseInt(process.env.SECURITY_AUDIT_RETENTION_DAYS || '2555', 10), // 7 years
      immutable: process.env.SECURITY_AUDIT_IMMUTABLE === 'true',
    },
  },
};

class AdvancedSecurityService {
  private securityEventsCollection = collection(db, 'securityEvents');
  private securityRulesCollection = collection(db, 'securityRules');
  private threatDetectionsCollection = collection(db, 'threatDetections');
  private securityPoliciesCollection = collection(db, 'securityPolicies');
  private securityAuditsCollection = collection(db, 'securityAudits');
  private securityFindingsCollection = collection(db, 'securityFindings');
  private deviceFingerprintsCollection = collection(db, 'deviceFingerprints');
  private securityMetricsCollection = collection(db, 'securityMetrics');

  // --- Security Events ---
  async logSecurityEvent(
    type: SecurityEventType,
    level: SecurityLevel,
    details: SecurityEvent['details'],
    userId?: string,
    sessionId?: string
  ): Promise<SecurityEvent> {
    try {
      const ipAddress = await this.getClientIPAddress();
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
      const location = await this.getLocationFromIP(ipAddress);

      const event: Omit<SecurityEvent, 'id'> = {
        type,
        level,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        location,
        details,
        timestamp: serverTimestamp() as Timestamp,
        resolved: false,
      };

      const docRef = await addDoc(this.securityEventsCollection, event);
      
      // Trigger automated threat detection
      await this.analyzeForThreats(event, docRef.id);
      
      // Send real-time alerts for high/critical events
      if ((level === 'high' || level === 'critical') && securityConfig.monitoring.enableRealTimeAlerts) {
        await this.sendSecurityAlert(event, docRef.id);
      }

      analytics.trackEvent('security_event_logged', {
        event_type: type,
        event_level: level,
        user_id: userId,
      });

      return { id: docRef.id, ...event };
    } catch (error: any) {
      throw new AppError('SECURITY_EVENT_LOG_FAILED', 'Güvenlik olayı kaydedilemedi.', 'critical', { type, level, originalError: error.message });
    }
  }

  async getSecurityEvents(
    filters?: {
      type?: SecurityEventType;
      level?: SecurityLevel;
      userId?: string;
      timeRange?: '1h' | '24h' | '7d' | '30d';
      resolved?: boolean;
    },
    limitCount: number = 100
  ): Promise<SecurityEvent[]> {
    try {
      let q = query(this.securityEventsCollection, orderBy('timestamp', 'desc'), limit(limitCount));

      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters?.level) {
        q = query(q, where('level', '==', filters.level));
      }
      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters?.resolved !== undefined) {
        q = query(q, where('resolved', '==', filters.resolved));
      }
      if (filters?.timeRange) {
        const timeRangeMs = this.getTimeRangeMs(filters.timeRange);
        const cutoffTime = new Date(Date.now() - timeRangeMs);
        q = query(q, where('timestamp', '>=', cutoffTime));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityEvent));
    } catch (error: any) {
      throw new AppError('SECURITY_EVENTS_FETCH_FAILED', 'Güvenlik olayları alınamadı.', 'critical', { filters, originalError: error.message });
    }
  }

  // --- Threat Detection ---
  async analyzeForThreats(event: Omit<SecurityEvent, 'id'>, eventId: string): Promise<ThreatDetection | null> {
    try {
      const threats = await this.detectThreats(event);
      
      if (threats.length === 0) return null;

      // Get the highest confidence threat
      const primaryThreat = threats.reduce((max, threat) => 
        threat.confidence > max.confidence ? threat : max
      );

      const detection: Omit<ThreatDetection, 'id'> = {
        threatType: primaryThreat.type,
        level: this.calculateThreatLevel(primaryThreat.confidence),
        confidence: primaryThreat.confidence,
        sourceIp: event.ipAddress,
        targetUser: event.userId,
        targetResource: event.details.resource,
        detectedAt: serverTimestamp() as Timestamp,
        indicators: primaryThreat.indicators,
        automated: true,
        resolved: false,
      };

      // Take automated action if enabled
      if (this.shouldTakeAutomatedAction(detection)) {
        const action = await this.takeAutomatedAction(detection);
        detection.actionTaken = action;
      }

      const docRef = await addDoc(this.threatDetectionsCollection, detection);
      
      analytics.trackEvent('threat_detected', {
        threat_type: detection.threatType,
        threat_level: detection.level,
        confidence: detection.confidence,
        automated_action: detection.actionTaken?.type,
      });

      return { id: docRef.id, ...detection };
    } catch (error: any) {
      console.error('Threat analysis failed:', error);
      return null;
    }
  }

  private async detectThreats(event: Omit<SecurityEvent, 'id'>): Promise<Array<{
    type: ThreatDetection['threatType'];
    confidence: number;
    indicators: ThreatDetection['indicators'];
  }>> {
    const threats: Array<{
      type: ThreatDetection['threatType'];
      confidence: number;
      indicators: ThreatDetection['indicators'];
    }> = [];

    // Brute force detection
    if (event.type === 'login_failure') {
      const recentFailures = await this.countRecentFailedLogins(event.ipAddress, event.userId);
      if (recentFailures >= 5) {
        threats.push({
          type: 'brute_force',
          confidence: Math.min(95, 50 + (recentFailures * 5)),
          indicators: {
            failedAttempts: recentFailures,
            suspiciousPatterns: ['repeated_login_failures'],
          },
        });
      }
    }

    // Credential stuffing detection
    if (event.type === 'login_failure' && event.details.reason === 'invalid_credentials') {
      const suspiciousPatterns = await this.detectCredentialStuffingPatterns(event.ipAddress);
      if (suspiciousPatterns.length > 0) {
        threats.push({
          type: 'credential_stuffing',
          confidence: 75,
          indicators: {
            suspiciousPatterns,
            behaviorAnomalies: ['multiple_user_attempts_same_ip'],
          },
        });
      }
    }

    // Account takeover detection
    if (event.type === 'login_success') {
      const riskScore = await this.calculateLoginRiskScore(event);
      if (riskScore > 70) {
        threats.push({
          type: 'account_takeover',
          confidence: riskScore,
          indicators: {
            behaviorAnomalies: await this.getLoginAnomalies(event),
          },
        });
      }
    }

    // Bot activity detection
    const botScore = await this.calculateBotScore(event);
    if (botScore > 80) {
      threats.push({
        type: 'bot_activity',
        confidence: botScore,
        indicators: {
          suspiciousPatterns: ['automated_behavior_patterns'],
          behaviorAnomalies: ['non_human_interaction_patterns'],
        },
      });
    }

    return threats;
  }

  // --- Device Fingerprinting ---
  async createDeviceFingerprint(userId: string, fingerprintData: DeviceFingerprint['fingerprint']): Promise<DeviceFingerprint> {
    try {
      const deviceId = this.generateDeviceId(fingerprintData);
      
      // Check if device already exists
      const existingQuery = query(
        this.deviceFingerprintsCollection,
        where('userId', '==', userId),
        where('deviceId', '==', deviceId),
        limit(1)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        // Update existing device
        const deviceRef = existingSnapshot.docs[0].ref;
        await updateDoc(deviceRef, {
          lastSeen: serverTimestamp(),
          loginCount: (existingSnapshot.docs[0].data().loginCount || 0) + 1,
        });
        return { id: deviceRef.id, ...existingSnapshot.docs[0].data() } as DeviceFingerprint;
      }

      // Create new device fingerprint
      const riskScore = this.calculateDeviceRiskScore(fingerprintData);
      const fingerprint: Omit<DeviceFingerprint, 'id'> = {
        userId,
        deviceId,
        fingerprint: fingerprintData,
        trusted: riskScore < 30,
        firstSeen: serverTimestamp() as Timestamp,
        lastSeen: serverTimestamp() as Timestamp,
        loginCount: 1,
        riskScore,
        blocked: false,
      };

      const docRef = await addDoc(this.deviceFingerprintsCollection, fingerprint);
      
      analytics.trackEvent('device_fingerprint_created', {
        user_id: userId,
        device_id: deviceId,
        risk_score: riskScore,
        trusted: fingerprint.trusted,
      });

      return { id: docRef.id, ...fingerprint };
    } catch (error: any) {
      throw new AppError('DEVICE_FINGERPRINT_FAILED', 'Cihaz parmak izi oluşturulamadı.', 'warning', { userId, originalError: error.message });
    }
  }

  // --- Security Rules Management ---
  async createSecurityRule(rule: Omit<SecurityRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityRule> {
    try {
      const securityRule: Omit<SecurityRule, 'id'> = {
        ...rule,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(this.securityRulesCollection, securityRule);
      
      // Test the rule syntax
      const testResults = await this.testSecurityRule(securityRule.rule);
      await updateDoc(docRef, {
        lastTestedAt: serverTimestamp(),
        testResults,
      });

      analytics.trackEvent('security_rule_created', {
        rule_category: rule.category,
        rule_enabled: rule.enabled,
        test_passed: testResults.passed,
      });

      return { id: docRef.id, ...securityRule, testResults };
    } catch (error: any) {
      throw new AppError('SECURITY_RULE_CREATE_FAILED', 'Güvenlik kuralı oluşturulamadı.', 'critical', { rule: rule.name, originalError: error.message });
    }
  }

  async testSecurityRule(ruleText: string): Promise<SecurityRule['testResults']> {
    try {
      // This would integrate with Firebase Security Rules testing
      // For now, we'll do basic syntax validation
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic syntax checks
      if (!ruleText.includes('allow') && !ruleText.includes('deny')) {
        errors.push('Rule must contain allow or deny statements');
      }

      if (ruleText.includes('auth.uid') && !ruleText.includes('request.auth')) {
        warnings.push('Consider using request.auth.uid instead of auth.uid');
      }

      return {
        passed: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error: any) {
      return {
        passed: false,
        errors: [error.message],
        warnings: [],
      };
    }
  }

  // --- Security Metrics ---
  async collectSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Collect various security metrics
      const [
        totalUsersSnapshot,
        activeUsersSnapshot,
        failedLoginsSnapshot,
        successfulLoginsSnapshot,
        securityEventsSnapshot,
        threatDetectionsSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'userSessions'), where('lastActive', '>=', last24h))),
        getDocs(query(this.securityEventsCollection, where('type', '==', 'login_failure'), where('timestamp', '>=', last24h))),
        getDocs(query(this.securityEventsCollection, where('type', '==', 'login_success'), where('timestamp', '>=', last24h))),
        getDocs(query(this.securityEventsCollection, where('timestamp', '>=', last24h))),
        getDocs(query(this.threatDetectionsCollection, where('detectedAt', '>=', last24h))),
      ]);

      // Count events by type
      const securityEvents: SecurityMetrics['securityEvents'] = {};
      securityEventsSnapshot.docs.forEach(doc => {
        const event = doc.data() as SecurityEvent;
        securityEvents[event.type] = (securityEvents[event.type] || 0) + 1;
      });

      // Count threats by level
      const threatDetections: SecurityMetrics['threatDetections'] = {};
      threatDetectionsSnapshot.docs.forEach(doc => {
        const threat = doc.data() as ThreatDetection;
        threatDetections[threat.level] = (threatDetections[threat.level] || 0) + 1;
      });

      const metrics: SecurityMetrics = {
        timestamp: serverTimestamp() as Timestamp,
        totalUsers: totalUsersSnapshot.size,
        activeUsers: activeUsersSnapshot.size,
        blockedIPs: 0, // Would come from your IP blocking system
        failedLogins: failedLoginsSnapshot.size,
        successfulLogins: successfulLoginsSnapshot.size,
        mfaAdoptions: 0, // Would come from MFA tracking
        securityEvents,
        threatDetections,
        appCheckSuccess: 0, // Would come from App Check metrics
        appCheckFailure: 0,
        recaptchaScore: {
          average: 0.85, // Would come from reCAPTCHA analytics
          distribution: {},
        },
      };

      // Store metrics
      await addDoc(this.securityMetricsCollection, metrics);
      
      return metrics;
    } catch (error: any) {
      throw new AppError('SECURITY_METRICS_COLLECTION_FAILED', 'Güvenlik metrikleri toplanamadı.', 'warning', { originalError: error.message });
    }
  }

  // --- Utility Methods ---
  private async getClientIPAddress(): Promise<string> {
    try {
      if (typeof window !== 'undefined') {
        // In browser, we can't directly get the real IP
        return 'client-ip';
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async getLocationFromIP(ipAddress: string): Promise<SecurityEvent['location']> {
    try {
      // This would integrate with a geolocation service
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
      };
    } catch {
      return undefined;
    }
  }

  private getTimeRangeMs(timeRange: string): number {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    return ranges[timeRange as keyof typeof ranges] || ranges['24h'];
  }

  private calculateThreatLevel(confidence: number): ThreatLevel {
    if (confidence >= 90) return 'critical';
    if (confidence >= 70) return 'high';
    if (confidence >= 40) return 'medium';
    if (confidence >= 20) return 'low';
    return 'none';
  }

  private shouldTakeAutomatedAction(detection: Omit<ThreatDetection, 'id'>): boolean {
    if (detection.level === 'critical' && securityConfig.automation.autoBlockSuspiciousIPs) {
      return true;
    }
    if (detection.threatType === 'brute_force' && securityConfig.automation.autoLockCompromisedAccounts) {
      return true;
    }
    return false;
  }

  private async takeAutomatedAction(detection: Omit<ThreatDetection, 'id'>): Promise<ThreatDetection['actionTaken']> {
    // This would integrate with your security infrastructure
    return {
      type: 'manual_review',
      details: 'Threat detected and flagged for manual review',
      timestamp: serverTimestamp() as Timestamp,
    };
  }

  private async countRecentFailedLogins(ipAddress: string, userId?: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let q = query(
      this.securityEventsCollection,
      where('type', '==', 'login_failure'),
      where('ipAddress', '==', ipAddress),
      where('timestamp', '>=', oneHourAgo)
    );

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  private async detectCredentialStuffingPatterns(ipAddress: string): Promise<string[]> {
    // This would analyze patterns in login attempts
    return [];
  }

  private async calculateLoginRiskScore(event: Omit<SecurityEvent, 'id'>): Promise<number> {
    // This would analyze login context for risk factors
    return Math.random() * 100; // Placeholder
  }

  private async getLoginAnomalies(event: Omit<SecurityEvent, 'id'>): Promise<string[]> {
    // This would detect anomalies in login behavior
    return [];
  }

  private async calculateBotScore(event: Omit<SecurityEvent, 'id'>): Promise<number> {
    // This would analyze request patterns for bot behavior
    return Math.random() * 100; // Placeholder
  }

  private generateDeviceId(fingerprint: DeviceFingerprint['fingerprint']): string {
    // Generate a hash from fingerprint components
    const components = [
      fingerprint.userAgent,
      fingerprint.screenResolution,
      fingerprint.timezone,
      fingerprint.language,
      fingerprint.platform,
      fingerprint.cookiesEnabled.toString(),
      fingerprint.plugins.join(','),
    ].join('|');

    // Simple hash function (in production, use a proper crypto hash)
    let hash = 0;
    for (let i = 0; i < components.length; i++) {
      const char = components.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private calculateDeviceRiskScore(fingerprint: DeviceFingerprint['fingerprint']): number {
    let riskScore = 0;

    // Check for suspicious characteristics
    if (fingerprint.plugins.length === 0) riskScore += 20; // No plugins is suspicious
    if (fingerprint.userAgent.includes('bot') || fingerprint.userAgent.includes('crawler')) riskScore += 50;
    if (!fingerprint.cookiesEnabled) riskScore += 15;
    if (fingerprint.platform === 'unknown') riskScore += 10;

    return Math.min(100, riskScore);
  }

  private async sendSecurityAlert(event: Omit<SecurityEvent, 'id'>, eventId: string): Promise<void> {
    try {
      // This would integrate with your alerting system
      console.log(`Security Alert: ${event.type} - ${event.level} - ${eventId}`);
      
      // Send to configured channels
      if (securityConfig.monitoring.alertChannels.webhook) {
        // Send webhook alert
      }
      if (securityConfig.monitoring.alertChannels.email) {
        // Send email alert
      }
      if (securityConfig.monitoring.alertChannels.slack) {
        // Send Slack alert
      }
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }
}

export const advancedSecurityService = new AdvancedSecurityService();
