'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '@/lib/auth';
import { httpsCallable, getFunctions } from 'firebase/functions';

export interface SecurityStatus {
  isLocked: boolean;
  loginAttempts: number;
  twoFactorEnabled: boolean;
  passwordAge: number;
  suspiciousActivityCount: number;
  lastLoginIP?: string;
  lastLoginAttempt?: Date;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetTime?: Date;
  reason?: string;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

export interface SecurityDashboard {
  activeIncidents: number;
  lockedAccounts: number;
  suspiciousActivities: number;
  recentAudits: any[];
}

export interface UseSecurityResult {
  // Security status
  securityStatus: SecurityStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // Functions
  checkAccountSecurity: () => Promise<void>;
  recordLoginAttempt: (success: boolean, failureReason?: string) => Promise<void>;
  checkRateLimit: (identifier: string) => Promise<RateLimitResult>;
  validatePermissions: (resource: string, action: string) => Promise<PermissionCheck>;
  getSecurityDashboard: () => Promise<SecurityDashboard>;
  
  // Utilities
  isAccountSecure: () => boolean;
  getSecurityScore: () => number;
  getSecurityRecommendations: () => string[];
}

export function useSecurity(): UseSecurityResult {
  const { user } = useAuth();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const functions = getFunctions();

  // Cloud Functions
  const checkAccountSecurityFn = httpsCallable(functions, 'checkAccountSecurity');
  const recordLoginAttemptFn = httpsCallable(functions, 'recordLoginAttempt');
  const checkRateLimitFn = httpsCallable(functions, 'checkRateLimit');
  const validatePermissionsFn = httpsCallable(functions, 'validatePermissions');
  const getSecurityDashboardFn = httpsCallable(functions, 'getSecurityDashboard');

  // Check account security
  const checkAccountSecurity = useCallback(async (): Promise<void> => {
    if (!user) {
      setSecurityStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await checkAccountSecurityFn();
      setSecurityStatus(result.data as SecurityStatus);
    } catch (error: any) {
      console.error('Error checking account security:', error);
      setError(error.message || 'Failed to check account security');
    } finally {
      setIsLoading(false);
    }
  }, [user, checkAccountSecurityFn]);

  // Record login attempt
  const recordLoginAttempt = useCallback(async (success: boolean, failureReason?: string): Promise<void> => {
    if (!user) return;

    try {
      await recordLoginAttemptFn({
        userId: user.uid,
        success,
        failureReason,
      });
    } catch (error: any) {
      console.error('Error recording login attempt:', error);
    }
  }, [user, recordLoginAttemptFn]);

  // Check rate limit
  const checkRateLimit = useCallback(async (identifier: string): Promise<RateLimitResult> => {
    try {
      const result = await checkRateLimitFn({ identifier });
      return result.data as RateLimitResult;
    } catch (error: any) {
      console.error('Error checking rate limit:', error);
      return { allowed: true }; // Allow on error
    }
  }, [checkRateLimitFn]);

  // Validate permissions
  const validatePermissions = useCallback(async (resource: string, action: string): Promise<PermissionCheck> => {
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    try {
      const result = await validatePermissionsFn({ resource, action });
      return result.data as PermissionCheck;
    } catch (error: any) {
      console.error('Error validating permissions:', error);
      return { allowed: false, reason: error.message || 'Permission check failed' };
    }
  }, [user, validatePermissionsFn]);

  // Get security dashboard (admin only)
  const getSecurityDashboard = useCallback(async (): Promise<SecurityDashboard> => {
    try {
      const result = await getSecurityDashboardFn();
      return result.data as SecurityDashboard;
    } catch (error: any) {
      console.error('Error getting security dashboard:', error);
      throw new Error(error.message || 'Failed to load security dashboard');
    }
  }, [getSecurityDashboardFn]);

  // Check if account is secure
  const isAccountSecure = useCallback((): boolean => {
    if (!securityStatus) return false;

    return (
      !securityStatus.isLocked &&
      securityStatus.loginAttempts < 3 &&
      securityStatus.suspiciousActivityCount === 0 &&
      securityStatus.passwordAge < 90 // Password less than 90 days old
    );
  }, [securityStatus]);

  // Calculate security score (0-100)
  const getSecurityScore = useCallback((): number => {
    if (!securityStatus) return 0;

    let score = 100;

    // Deduct points for security issues
    if (securityStatus.isLocked) score -= 50;
    if (securityStatus.loginAttempts > 0) score -= securityStatus.loginAttempts * 5;
    if (!securityStatus.twoFactorEnabled) score -= 20;
    if (securityStatus.passwordAge > 90) score -= 15;
    if (securityStatus.passwordAge > 180) score -= 25;
    if (securityStatus.suspiciousActivityCount > 0) score -= securityStatus.suspiciousActivityCount * 10;

    return Math.max(0, score);
  }, [securityStatus]);

  // Get security recommendations
  const getSecurityRecommendations = useCallback((): string[] => {
    if (!securityStatus) return [];

    const recommendations: string[] = [];

    if (securityStatus.isLocked) {
      recommendations.push('Hesabınız kilitlenmiş. Destek ekibi ile iletişime geçin.');
    }

    if (!securityStatus.twoFactorEnabled) {
      recommendations.push('İki faktörlü kimlik doğrulamayı etkinleştirin.');
    }

    if (securityStatus.passwordAge > 90) {
      recommendations.push('Şifrenizi değiştirmeniz önerilir (90 günden eski).');
    }

    if (securityStatus.passwordAge > 180) {
      recommendations.push('Şifreniz çok eski! Hemen değiştirin (180 günden eski).');
    }

    if (securityStatus.loginAttempts > 0) {
      recommendations.push('Son zamanlarda başarısız giriş denemeleri tespit edildi.');
    }

    if (securityStatus.suspiciousActivityCount > 0) {
      recommendations.push('Hesabınızda şüpheli aktivite tespit edildi. Güvenlik ayarlarınızı gözden geçirin.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Hesabınız güvenli görünüyor! Güvenlik ayarlarınızı düzenli olarak kontrol etmeyi unutmayın.');
    }

    return recommendations;
  }, [securityStatus]);

  // Load security status on mount and when user changes
  useEffect(() => {
    if (user) {
      checkAccountSecurity();
    } else {
      setSecurityStatus(null);
      setError(null);
    }
  }, [user, checkAccountSecurity]);

  return {
    // Security status
    securityStatus,
    isLoading,
    error,
    
    // Functions
    checkAccountSecurity,
    recordLoginAttempt,
    checkRateLimit,
    validatePermissions,
    getSecurityDashboard,
    
    // Utilities
    isAccountSecure,
    getSecurityScore,
    getSecurityRecommendations,
  };
}

// Hook for permission checking
export function usePermissions() {
  const { validatePermissions } = useSecurity();
  const [permissions, setPermissions] = useState<{ [key: string]: boolean }>({});

  const checkPermission = useCallback(async (resource: string, action: string): Promise<boolean> => {
    const key = `${resource}:${action}`;
    
    if (permissions[key] !== undefined) {
      return permissions[key];
    }

    try {
      const result = await validatePermissions(resource, action);
      setPermissions(prev => ({ ...prev, [key]: result.allowed }));
      return result.allowed;
    } catch (error) {
      console.error('Permission check failed:', error);
      setPermissions(prev => ({ ...prev, [key]: false }));
      return false;
    }
  }, [validatePermissions, permissions]);

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    const key = `${resource}:${action}`;
    return permissions[key] === true;
  }, [permissions]);

  const clearPermissions = useCallback(() => {
    setPermissions({});
  }, []);

  return {
    checkPermission,
    hasPermission,
    clearPermissions,
    permissions,
  };
}

// Hook for rate limiting
export function useRateLimit() {
  const { checkRateLimit } = useSecurity();
  const [rateLimitStatus, setRateLimitStatus] = useState<{ [key: string]: RateLimitResult }>({});

  const checkLimit = useCallback(async (identifier: string): Promise<RateLimitResult> => {
    try {
      const result = await checkRateLimit(identifier);
      setRateLimitStatus(prev => ({ ...prev, [identifier]: result }));
      return result;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      const errorResult = { allowed: true };
      setRateLimitStatus(prev => ({ ...prev, [identifier]: errorResult }));
      return errorResult;
    }
  }, [checkRateLimit]);

  const isRateLimited = useCallback((identifier: string): boolean => {
    const status = rateLimitStatus[identifier];
    return status ? !status.allowed : false;
  }, [rateLimitStatus]);

  const getRemainingRequests = useCallback((identifier: string): number => {
    const status = rateLimitStatus[identifier];
    return status?.remaining || 0;
  }, [rateLimitStatus]);

  const getResetTime = useCallback((identifier: string): Date | null => {
    const status = rateLimitStatus[identifier];
    return status?.resetTime || null;
  }, [rateLimitStatus]);

  return {
    checkLimit,
    isRateLimited,
    getRemainingRequests,
    getResetTime,
    rateLimitStatus,
  };
}

// Security context for admin users
export function useSecurityAdmin() {
  const { user } = useAuth();
  const { getSecurityDashboard, validatePermissions } = useSecurity();
  const [isAdmin, setIsAdmin] = useState(false);
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const result = await validatePermissions('*', '*');
        setIsAdmin(result.allowed);
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, validatePermissions]);

  // Load security dashboard
  const loadDashboard = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const data = await getSecurityDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load security dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, getSecurityDashboard]);

  useEffect(() => {
    if (isAdmin) {
      loadDashboard();
    }
  }, [isAdmin, loadDashboard]);

  return {
    isAdmin,
    dashboard,
    loading,
    loadDashboard,
  };
}
