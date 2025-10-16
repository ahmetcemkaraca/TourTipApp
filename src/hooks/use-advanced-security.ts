import { useState, useCallback, useEffect } from 'react';
import { advancedSecurityService } from '@/lib/advanced-security-service';
import { 
  SecurityEvent, 
  SecurityRule, 
  ThreatDetection, 
  DeviceFingerprint,
  SecurityMetrics,
  SecurityEventType,
  SecurityLevel 
} from '@/types/advanced-security';
import { useErrorHandling } from './use-error-handling';
import { useAuth } from './use-auth'; // Assuming useAuth hook exists

/**
 * Hook for advanced security features including threat detection, device fingerprinting, and security monitoring
 */
export const useAdvancedSecurity = () => {
  const { handleError } = useErrorHandling();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [threatDetections, setThreatDetections] = useState<ThreatDetection[]>([]);
  const [securityRules, setSecurityRules] = useState<SecurityRule[]>([]);
  const [deviceFingerprints, setDeviceFingerprints] = useState<DeviceFingerprint[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);

  // --- Security Events ---
  const logSecurityEvent = useCallback(async (
    type: SecurityEventType,
    level: SecurityLevel,
    details: SecurityEvent['details'],
    sessionId?: string
  ) => {
    try {
      const event = await advancedSecurityService.logSecurityEvent(
        type,
        level,
        details,
        currentUser?.uid,
        sessionId
      );
      setSecurityEvents(prev => [event, ...prev]);
      return event;
    } catch (error) {
      handleError(error, { code: 'LOG_SECURITY_EVENT_ERROR', category: 'security' });
      return null;
    }
  }, [currentUser, handleError]);

  const fetchSecurityEvents = useCallback(async (
    filters?: {
      type?: SecurityEventType;
      level?: SecurityLevel;
      userId?: string;
      timeRange?: '1h' | '24h' | '7d' | '30d';
      resolved?: boolean;
    }
  ) => {
    setLoading(true);
    try {
      const events = await advancedSecurityService.getSecurityEvents(filters);
      setSecurityEvents(events);
      return events;
    } catch (error) {
      handleError(error, { code: 'FETCH_SECURITY_EVENTS_ERROR', category: 'security' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // --- Device Fingerprinting ---
  const createDeviceFingerprint = useCallback(async () => {
    if (!currentUser || typeof navigator === 'undefined') return null;

    try {
      const fingerprintData = await collectDeviceFingerprint();
      const fingerprint = await advancedSecurityService.createDeviceFingerprint(
        currentUser.uid,
        fingerprintData
      );
      setDeviceFingerprints(prev => [fingerprint, ...prev.filter(f => f.id !== fingerprint.id)]);
      return fingerprint;
    } catch (error) {
      handleError(error, { code: 'CREATE_DEVICE_FINGERPRINT_ERROR', category: 'security' });
      return null;
    }
  }, [currentUser, handleError]);

  // --- Security Rules ---
  const createSecurityRule = useCallback(async (rule: Omit<SecurityRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const newRule = await advancedSecurityService.createSecurityRule(rule);
      setSecurityRules(prev => [newRule, ...prev]);
      return newRule;
    } catch (error) {
      handleError(error, { code: 'CREATE_SECURITY_RULE_ERROR', category: 'security' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const testSecurityRule = useCallback(async (ruleText: string) => {
    try {
      return await advancedSecurityService.testSecurityRule(ruleText);
    } catch (error) {
      handleError(error, { code: 'TEST_SECURITY_RULE_ERROR', category: 'security' });
      return { passed: false, errors: ['Test failed'], warnings: [] };
    }
  }, [handleError]);

  // --- Security Metrics ---
  const collectSecurityMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const metrics = await advancedSecurityService.collectSecurityMetrics();
      setSecurityMetrics(metrics);
      return metrics;
    } catch (error) {
      handleError(error, { code: 'COLLECT_SECURITY_METRICS_ERROR', category: 'security' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // --- Convenience Methods ---
  const logLoginAttempt = useCallback(async (success: boolean, reason?: string, sessionId?: string) => {
    const type: SecurityEventType = success ? 'login_success' : 'login_failure';
    const level: SecurityLevel = success ? 'low' : 'medium';
    
    return await logSecurityEvent(type, level, {
      outcome: success ? 'success' : 'failure',
      reason,
      action: 'login',
    }, sessionId);
  }, [logSecurityEvent]);

  const logSuspiciousActivity = useCallback(async (
    activity: string, 
    riskScore: number, 
    details: Record<string, any> = {}
  ) => {
    const level: SecurityLevel = riskScore > 80 ? 'critical' : riskScore > 60 ? 'high' : 'medium';
    
    return await logSecurityEvent('suspicious_activity', level, {
      activity,
      riskScore,
      outcome: 'blocked',
      ...details,
    });
  }, [logSecurityEvent]);

  const logDataAccess = useCallback(async (
    resource: string, 
    action: string, 
    authorized: boolean,
    details: Record<string, any> = {}
  ) => {
    const level: SecurityLevel = authorized ? 'low' : 'high';
    
    return await logSecurityEvent('data_access', level, {
      resource,
      action,
      outcome: authorized ? 'success' : 'blocked',
      ...details,
    });
  }, [logSecurityEvent]);

  const logSecurityRuleViolation = useCallback(async (
    rule: string,
    resource: string,
    details: Record<string, any> = {}
  ) => {
    return await logSecurityEvent('security_rule_violation', 'high', {
      rule,
      resource,
      outcome: 'blocked',
      ...details,
    });
  }, [logSecurityEvent]);

  // --- reCAPTCHA Integration ---
  const verifyRecaptcha = useCallback(async (token: string, action?: string): Promise<{
    success: boolean;
    score?: number;
    errors?: string[];
  }> => {
    try {
      // This would integrate with your reCAPTCHA verification endpoint
      const response = await fetch('/api/security/verify-recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      });

      const result = await response.json();
      
      // Log reCAPTCHA result
      await logSecurityEvent(
        result.success ? 'login_success' : 'recaptcha_failure',
        result.score && result.score < 0.5 ? 'high' : 'low',
        {
          action: 'recaptcha_verification',
          outcome: result.success ? 'success' : 'failure',
          score: result.score,
          action_name: action,
        }
      );

      return result;
    } catch (error) {
      handleError(error, { code: 'RECAPTCHA_VERIFICATION_ERROR', category: 'security' });
      return { success: false, errors: ['Verification failed'] };
    }
  }, [logSecurityEvent, handleError]);

  // --- Biometric Authentication ---
  const checkBiometricSupport = useCallback((): {
    supported: boolean;
    methods: string[];
  } => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return { supported: false, methods: [] };
    }

    const methods: string[] = [];
    
    // Check for WebAuthn support
    if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      methods.push('platform'); // Face ID, Touch ID, Windows Hello, etc.
    }
    
    // Check for fingerprint support (approximation)
    if (navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone')) {
      methods.push('fingerprint');
    }

    return {
      supported: methods.length > 0,
      methods,
    };
  }, []);

  const authenticateWithBiometrics = useCallback(async (): Promise<{
    success: boolean;
    credential?: any;
    error?: string;
  }> => {
    try {
      if (!window.PublicKeyCredential) {
        throw new Error('Biometric authentication not supported');
      }

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32), // Should be random in production
          rp: {
            name: 'TourTrip.app',
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(currentUser?.uid || 'anonymous'),
            name: currentUser?.email || 'user@example.com',
            displayName: currentUser?.displayName || 'User',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 30000,
        },
      });

      await logSecurityEvent('login_success', 'low', {
        action: 'biometric_authentication',
        outcome: 'success',
        authenticator_type: 'platform',
      });

      return { success: true, credential };
    } catch (error: any) {
      await logSecurityEvent('login_failure', 'medium', {
        action: 'biometric_authentication',
        outcome: 'failure',
        reason: error.message,
      });

      return { success: false, error: error.message };
    }
  }, [currentUser, logSecurityEvent]);

  // --- Session Security ---
  const validateSession = useCallback(async (sessionId: string): Promise<{
    valid: boolean;
    riskScore: number;
    recommendations: string[];
  }> => {
    try {
      // Check session integrity
      const sessionEvents = await advancedSecurityService.getSecurityEvents({
        userId: currentUser?.uid,
        timeRange: '1h',
      });

      const suspiciousEvents = sessionEvents.filter(e => 
        e.level === 'high' || e.level === 'critical'
      );

      const riskScore = Math.min(100, suspiciousEvents.length * 25);
      const recommendations: string[] = [];

      if (riskScore > 50) {
        recommendations.push('Consider requiring multi-factor authentication');
      }
      if (riskScore > 75) {
        recommendations.push('Force session refresh');
        recommendations.push('Review recent activity');
      }

      return {
        valid: riskScore < 80,
        riskScore,
        recommendations,
      };
    } catch (error) {
      handleError(error, { code: 'SESSION_VALIDATION_ERROR', category: 'security' });
      return {
        valid: false,
        riskScore: 100,
        recommendations: ['Session validation failed - force logout'],
      };
    }
  }, [currentUser, handleError]);

  // --- Automatic Security Monitoring ---
  useEffect(() => {
    if (currentUser) {
      // Create device fingerprint on login
      createDeviceFingerprint();
      
      // Log successful login
      logLoginAttempt(true, 'session_start');
    }
  }, [currentUser, createDeviceFingerprint, logLoginAttempt]);

  // --- Device Fingerprint Collection ---
  const collectDeviceFingerprint = useCallback(async (): Promise<DeviceFingerprint['fingerprint']> => {
    if (typeof window === 'undefined') {
      throw new Error('Device fingerprinting only available in browser');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let canvasFingerprint = '';
    
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint test 🔒', 2, 2);
      canvasFingerprint = canvas.toDataURL();
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    oscillator.connect(analyser);
    const audioFingerprint = analyser.frequencyBinCount.toString();
    audioContext.close();

    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      plugins: Array.from(navigator.plugins).map(p => p.name),
      canvas: canvasFingerprint,
      audioContext: audioFingerprint,
    };
  }, []);

  return {
    loading,
    securityEvents,
    threatDetections,
    securityRules,
    deviceFingerprints,
    securityMetrics,
    
    // Security Events
    logSecurityEvent,
    fetchSecurityEvents,
    
    // Device Fingerprinting
    createDeviceFingerprint,
    
    // Security Rules
    createSecurityRule,
    testSecurityRule,
    
    // Metrics
    collectSecurityMetrics,
    
    // Convenience Methods
    logLoginAttempt,
    logSuspiciousActivity,
    logDataAccess,
    logSecurityRuleViolation,
    
    // reCAPTCHA
    verifyRecaptcha,
    
    // Biometric Authentication
    checkBiometricSupport,
    authenticateWithBiometrics,
    
    // Session Security
    validateSession,
  };
};
