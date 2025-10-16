// Security Service for TourTrip.app
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  sessionTimeout: number; // in minutes
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  enableTwoFactor: boolean;
  enableBruteForceProtection: boolean;
  enableSuspiciousActivityDetection: boolean;
  rateLimitRequests: number; // requests per minute
}

export interface UserSecurityData {
  userId: string;
  loginAttempts: number;
  lastLoginAttempt: Date;
  isLocked: boolean;
  lockoutUntil?: Date;
  lastLoginIP: string;
  loginHistory: LoginHistoryEntry[];
  suspiciousActivity: SuspiciousActivityEntry[];
  twoFactorEnabled: boolean;
  securityQuestions: SecurityQuestion[];
  passwordLastChanged: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginHistoryEntry {
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
  failureReason?: string;
}

export interface SuspiciousActivityEntry {
  timestamp: Date;
  activityType: 'multiple_failed_logins' | 'unusual_location' | 'suspicious_request' | 'data_access_violation';
  description: string;
  ipAddress: string;
  userAgent: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export interface SecurityQuestion {
  question: string;
  answerHash: string; // Hashed answer
}

export interface SecurityIncident {
  id: string;
  type: 'data_breach' | 'unauthorized_access' | 'malicious_activity' | 'system_vulnerability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedUsers: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  mitigationSteps: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimitData {
  identifier: string; // IP or user ID
  requests: number;
  windowStart: Date;
  blocked: boolean;
  blockUntil?: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  metadata?: { [key: string]: any };
}

export class SecurityService {
  private static config: SecurityConfig = {
    maxLoginAttempts: 5,
    lockoutDuration: 30, // 30 minutes
    sessionTimeout: 120, // 2 hours
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    enableTwoFactor: false,
    enableBruteForceProtection: true,
    enableSuspiciousActivityDetection: true,
    rateLimitRequests: 100, // 100 requests per minute
  };

  // Get current security configuration
  static getConfig(): SecurityConfig {
    return this.config;
  }

  // Update security configuration (admin only)
  static async updateConfig(newConfig: Partial<SecurityConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      
      // Save to Firestore
      await setDoc(doc(db, 'securityConfig', 'default'), {
        ...this.config,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating security config:', error);
      throw new Error('Failed to update security configuration');
    }
  }

  // Validate password strength
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < this.config.passwordMinLength) {
      errors.push(`Password must be at least ${this.config.passwordMinLength} characters long`);
    }
    
    if (this.config.passwordRequireSpecialChars) {
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
    }
    
    // Check for common passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Check rate limiting
  static async checkRateLimit(identifier: string): Promise<{ allowed: boolean; resetTime?: Date }> {
    try {
      const rateLimitRef = doc(db, 'rateLimits', identifier);
      const rateLimitDoc = await getDoc(rateLimitRef);
      
      const now = new Date();
      const windowDuration = 60 * 1000; // 1 minute in milliseconds
      
      if (!rateLimitDoc.exists()) {
        // Create new rate limit entry
        await setDoc(rateLimitRef, {
          identifier,
          requests: 1,
          windowStart: now,
          blocked: false,
        });
        return { allowed: true };
      }
      
      const data = rateLimitDoc.data() as RateLimitData;
      const windowStart = data.windowStart.toDate();
      const timeSinceWindowStart = now.getTime() - windowStart.getTime();
      
      // Reset window if expired
      if (timeSinceWindowStart >= windowDuration) {
        await updateDoc(rateLimitRef, {
          requests: 1,
          windowStart: now,
          blocked: false,
          blockUntil: null,
        });
        return { allowed: true };
      }
      
      // Check if currently blocked
      if (data.blocked && data.blockUntil && data.blockUntil.toDate() > now) {
        return { allowed: false, resetTime: data.blockUntil.toDate() };
      }
      
      // Increment request count
      const newRequestCount = data.requests + 1;
      
      if (newRequestCount > this.config.rateLimitRequests) {
        // Block user
        const blockUntil = new Date(now.getTime() + windowDuration);
        await updateDoc(rateLimitRef, {
          requests: newRequestCount,
          blocked: true,
          blockUntil,
        });
        
        // Log security incident
        await this.logSuspiciousActivity(
          identifier,
          'suspicious_request',
          `Rate limit exceeded: ${newRequestCount} requests in 1 minute`,
          'medium'
        );
        
        return { allowed: false, resetTime: blockUntil };
      }
      
      // Update request count
      await updateDoc(rateLimitRef, {
        requests: newRequestCount,
      });
      
      return { allowed: true };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Allow request on error to avoid blocking legitimate users
      return { allowed: true };
    }
  }

  // Record login attempt
  static async recordLoginAttempt(
    userId: string, 
    success: boolean, 
    ipAddress: string, 
    userAgent: string,
    failureReason?: string
  ): Promise<void> {
    try {
      const securityRef = doc(db, 'userSecurity', userId);
      const securityDoc = await getDoc(securityRef);
      
      const loginEntry: LoginHistoryEntry = {
        timestamp: new Date(),
        ipAddress,
        userAgent,
        success,
        failureReason,
      };
      
      if (!securityDoc.exists()) {
        // Create new security record
        const securityData: Partial<UserSecurityData> = {
          userId,
          loginAttempts: success ? 0 : 1,
          lastLoginAttempt: new Date(),
          isLocked: false,
          lastLoginIP: ipAddress,
          loginHistory: [loginEntry],
          suspiciousActivity: [],
          twoFactorEnabled: false,
          securityQuestions: [],
          passwordLastChanged: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await setDoc(securityRef, securityData);
      } else {
        const data = securityDoc.data() as UserSecurityData;
        const updates: any = {
          lastLoginAttempt: new Date(),
          lastLoginIP: ipAddress,
          updatedAt: new Date(),
        };
        
        // Update login history (keep last 50 entries)
        const newHistory = [loginEntry, ...data.loginHistory].slice(0, 50);
        updates.loginHistory = newHistory;
        
        if (success) {
          // Reset failed attempts on successful login
          updates.loginAttempts = 0;
          updates.isLocked = false;
          updates.lockoutUntil = null;
        } else {
          // Increment failed attempts
          const newAttempts = data.loginAttempts + 1;
          updates.loginAttempts = newAttempts;
          
          // Lock account if too many attempts
          if (newAttempts >= this.config.maxLoginAttempts) {
            updates.isLocked = true;
            updates.lockoutUntil = new Date(Date.now() + this.config.lockoutDuration * 60 * 1000);
            
            // Log suspicious activity
            await this.logSuspiciousActivity(
              userId,
              'multiple_failed_logins',
              `Account locked after ${newAttempts} failed login attempts`,
              'high'
            );
          }
        }
        
        await updateDoc(securityRef, updates);
      }
      
      // Log audit entry
      await this.logAuditEntry({
        userId,
        action: 'login_attempt',
        resource: 'auth',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        success,
        errorMessage: failureReason,
      });
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  }

  // Check if user account is locked
  static async isAccountLocked(userId: string): Promise<{ locked: boolean; unlockTime?: Date }> {
    try {
      const securityRef = doc(db, 'userSecurity', userId);
      const securityDoc = await getDoc(securityRef);
      
      if (!securityDoc.exists()) {
        return { locked: false };
      }
      
      const data = securityDoc.data() as UserSecurityData;
      
      if (!data.isLocked) {
        return { locked: false };
      }
      
      // Check if lockout has expired
      if (data.lockoutUntil && data.lockoutUntil.toDate() <= new Date()) {
        // Unlock account
        await updateDoc(securityRef, {
          isLocked: false,
          lockoutUntil: null,
          loginAttempts: 0,
          updatedAt: new Date(),
        });
        return { locked: false };
      }
      
      return { 
        locked: true, 
        unlockTime: data.lockoutUntil?.toDate() 
      };
    } catch (error) {
      console.error('Error checking account lock status:', error);
      return { locked: false };
    }
  }

  // Log suspicious activity
  static async logSuspiciousActivity(
    userId: string,
    activityType: SuspiciousActivityEntry['activityType'],
    description: string,
    riskLevel: SuspiciousActivityEntry['riskLevel'],
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<void> {
    try {
      const activity: SuspiciousActivityEntry = {
        timestamp: new Date(),
        activityType,
        description,
        ipAddress,
        userAgent,
        riskLevel,
        resolved: false,
      };
      
      // Add to user's security record
      const securityRef = doc(db, 'userSecurity', userId);
      const securityDoc = await getDoc(securityRef);
      
      if (securityDoc.exists()) {
        const data = securityDoc.data() as UserSecurityData;
        const newActivities = [activity, ...data.suspiciousActivity].slice(0, 100); // Keep last 100
        
        await updateDoc(securityRef, {
          suspiciousActivity: newActivities,
          updatedAt: new Date(),
        });
      }
      
      // Create security incident for high/critical risks
      if (riskLevel === 'high' || riskLevel === 'critical') {
        await this.createSecurityIncident({
          type: 'suspicious_activity',
          severity: riskLevel === 'critical' ? 'critical' : 'high',
          description: `Suspicious activity detected for user ${userId}: ${description}`,
          affectedUsers: [userId],
          detectedAt: new Date(),
          status: 'open',
          mitigationSteps: [],
        });
      }
    } catch (error) {
      console.error('Error logging suspicious activity:', error);
    }
  }

  // Create security incident
  static async createSecurityIncident(
    incident: Omit<SecurityIncident, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const incidentData = {
        ...incident,
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'securityIncidents'), incidentData);
      
      // Update with document ID
      await updateDoc(docRef, { id: docRef.id });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating security incident:', error);
      throw new Error('Failed to create security incident');
    }
  }

  // Log audit entry
  static async logAuditEntry(entry: Omit<AuditLog, 'id'>): Promise<void> {
    try {
      const auditData = {
        ...entry,
        id: '',
      };
      
      const docRef = await addDoc(collection(db, 'auditTrails'), auditData);
      
      // Update with document ID
      await updateDoc(docRef, { id: docRef.id });
    } catch (error) {
      console.error('Error logging audit entry:', error);
    }
  }

  // Validate user permissions
  static async validateUserPermissions(
    userId: string, 
    resource: string, 
    action: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return { allowed: false, reason: 'User not found' };
      }
      
      const userData = userDoc.data();
      const userRole = userData.role || 'user';
      
      // Define permission matrix
      const permissions: { [role: string]: { [resource: string]: string[] } } = {
        admin: {
          '*': ['*'], // Admin has all permissions
        },
        moderator: {
          'content': ['read', 'create', 'update'],
          'media': ['read', 'create', 'update'],
          'faq': ['read', 'create', 'update'],
          'users': ['read'],
        },
        provider: {
          'tours': ['read', 'create', 'update', 'delete'],
          'bookings': ['read', 'update'],
          'restaurants': ['read', 'create', 'update', 'delete'],
          'shops': ['read', 'create', 'update', 'delete'],
          'orders': ['read', 'update'],
        },
        user: {
          'tours': ['read'],
          'bookings': ['read', 'create', 'update'],
          'reviews': ['read', 'create', 'update', 'delete'],
          'orders': ['read', 'create', 'update'],
          'profile': ['read', 'update'],
        },
      };
      
      const rolePermissions = permissions[userRole];
      if (!rolePermissions) {
        return { allowed: false, reason: 'Invalid user role' };
      }
      
      // Check wildcard permissions (admin)
      if (rolePermissions['*'] && rolePermissions['*'].includes('*')) {
        return { allowed: true };
      }
      
      // Check specific resource permissions
      const resourcePermissions = rolePermissions[resource];
      if (!resourcePermissions) {
        return { allowed: false, reason: 'No permissions for this resource' };
      }
      
      if (resourcePermissions.includes('*') || resourcePermissions.includes(action)) {
        return { allowed: true };
      }
      
      return { allowed: false, reason: 'Insufficient permissions for this action' };
    } catch (error) {
      console.error('Error validating user permissions:', error);
      return { allowed: false, reason: 'Permission validation failed' };
    }
  }

  // Sanitize user input
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>\"']/g, '') // Remove HTML/script injection characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate and sanitize email
  static validateEmail(email: string): { isValid: boolean; sanitized: string } {
    const sanitized = this.sanitizeInput(email.toLowerCase());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return {
      isValid: emailRegex.test(sanitized),
      sanitized,
    };
  }

  // Hash sensitive data (for security questions, etc.)
  static async hashSensitiveData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Check for data exposure
  static checkDataExposure(data: any): { safe: boolean; exposedFields: string[] } {
    const sensitiveFields = [
      'password', 'passwordHash', 'securityQuestion', 'answerHash',
      'creditCard', 'ssn', 'socialSecurityNumber', 'bankAccount',
      'apiKey', 'secretKey', 'token', 'refreshToken', 'accessToken'
    ];
    
    const exposedFields: string[] = [];
    
    const checkObject = (obj: any, prefix: string = ''): void => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const lowerKey = key.toLowerCase();
        
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          exposedFields.push(fullKey);
        }
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key], fullKey);
        }
      });
    };
    
    checkObject(data);
    
    return {
      safe: exposedFields.length === 0,
      exposedFields,
    };
  }

  // Get security dashboard data
  static async getSecurityDashboard(): Promise<{
    activeIncidents: number;
    lockedAccounts: number;
    suspiciousActivities: number;
    recentAudits: AuditLog[];
  }> {
    try {
      // Get active incidents
      const incidentsQuery = query(
        collection(db, 'securityIncidents'),
        where('status', 'in', ['open', 'investigating'])
      );
      const incidentsSnapshot = await getDocs(incidentsQuery);
      
      // Get locked accounts
      const lockedAccountsQuery = query(
        collection(db, 'userSecurity'),
        where('isLocked', '==', true)
      );
      const lockedAccountsSnapshot = await getDocs(lockedAccountsQuery);
      
      // Get recent audit logs (last 10)
      const auditQuery = query(collection(db, 'auditTrails'));
      const auditSnapshot = await getDocs(auditQuery);
      const recentAudits = auditSnapshot.docs
        .map(doc => doc.data() as AuditLog)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);
      
      // Count suspicious activities (unresolved, last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      let suspiciousActivities = 0;
      
      const securitySnapshot = await getDocs(collection(db, 'userSecurity'));
      securitySnapshot.docs.forEach(doc => {
        const data = doc.data() as UserSecurityData;
        if (data.suspiciousActivity) {
          suspiciousActivities += data.suspiciousActivity.filter(
            activity => !activity.resolved && activity.timestamp.getTime() > yesterday.getTime()
          ).length;
        }
      });
      
      return {
        activeIncidents: incidentsSnapshot.size,
        lockedAccounts: lockedAccountsSnapshot.size,
        suspiciousActivities,
        recentAudits,
      };
    } catch (error) {
      console.error('Error getting security dashboard:', error);
      throw new Error('Failed to load security dashboard');
    }
  }
}

export default SecurityService;
