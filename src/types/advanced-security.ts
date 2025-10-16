import { Timestamp } from 'firebase/firestore';

export type SecurityEventType = 
  | 'login_attempt'
  | 'login_success' 
  | 'login_failure'
  | 'password_change'
  | 'account_locked'
  | 'suspicious_activity'
  | 'data_access'
  | 'data_modification'
  | 'permission_change'
  | 'security_rule_violation'
  | 'app_check_failure'
  | 'recaptcha_failure'
  | 'rate_limit_exceeded'
  | 'session_hijack_attempt'
  | 'csrf_attempt'
  | 'sql_injection_attempt'
  | 'xss_attempt';

export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  level: SecurityLevel;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  details: {
    resource?: string;
    action?: string;
    outcome?: 'success' | 'failure' | 'blocked';
    reason?: string;
    riskScore?: number;
    [key: string]: any;
  };
  timestamp: Timestamp;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
  notes?: string;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'authorization' | 'firestore' | 'storage' | 'functions' | 'network';
  rule: string; // Firestore security rule syntax
  enabled: boolean;
  priority: number;
  conditions?: {
    userRoles?: string[];
    timeRestrictions?: {
      allowedHours?: number[];
      allowedDays?: number[];
    };
    ipWhitelist?: string[];
    geoRestrictions?: {
      allowedCountries?: string[];
      blockedCountries?: string[];
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastTestedAt?: Timestamp;
  testResults?: {
    passed: boolean;
    errors?: string[];
    warnings?: string[];
  };
}

export interface ThreatDetection {
  id: string;
  threatType: 'brute_force' | 'credential_stuffing' | 'account_takeover' | 'data_exfiltration' | 'privilege_escalation' | 'ddos' | 'bot_activity';
  level: ThreatLevel;
  confidence: number; // 0-100
  sourceIp: string;
  targetUser?: string;
  targetResource?: string;
  detectedAt: Timestamp;
  indicators: {
    failedAttempts?: number;
    requestRate?: number;
    suspiciousPatterns?: string[];
    behaviorAnomalies?: string[];
  };
  automated: boolean;
  actionTaken?: {
    type: 'block_ip' | 'lock_account' | 'require_mfa' | 'rate_limit' | 'manual_review';
    details: string;
    timestamp: Timestamp;
  };
  resolved: boolean;
  falsePositive?: boolean;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'compliance';
  rules: {
    enabled: boolean;
    config: {
      // Authentication policies
      requireMFA?: boolean;
      passwordComplexity?: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
      };
      sessionTimeout?: number; // minutes
      maxConcurrentSessions?: number;
      
      // Authorization policies
      defaultRole?: string;
      roleHierarchy?: { [role: string]: string[] };
      resourcePermissions?: { [resource: string]: string[] };
      
      // Data protection
      encryptionRequired?: boolean;
      auditLogging?: boolean;
      dataRetention?: number; // days
      
      // Network security
      allowedIPs?: string[];
      blockedIPs?: string[];
      requireHTTPS?: boolean;
      corsOrigins?: string[];
      
      // Compliance
      gdprCompliant?: boolean;
      kvkkCompliant?: boolean;
      dataProcessingConsent?: boolean;
    };
  };
  enforcementLevel: 'audit' | 'warn' | 'block';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: string;
  approvedBy?: string;
}

export interface SecurityAudit {
  id: string;
  type: 'manual' | 'automated' | 'scheduled';
  scope: 'full' | 'firestore_rules' | 'storage_rules' | 'functions' | 'authentication' | 'network';
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Timestamp;
  completedAt?: Timestamp;
  initiatedBy: string;
  results?: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
    criticalIssues: number;
    findings: SecurityFinding[];
    recommendations: string[];
  };
  reportUrl?: string;
  nextScheduledAt?: Timestamp;
}

export interface SecurityFinding {
  id: string;
  auditId: string;
  type: 'vulnerability' | 'misconfiguration' | 'policy_violation' | 'best_practice';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  resource: string;
  location?: {
    file?: string;
    line?: number;
    rule?: string;
  };
  remediation: {
    description: string;
    steps: string[];
    automatable: boolean;
    priority: number;
  };
  references?: string[];
  discoveredAt: Timestamp;
  status: 'open' | 'acknowledged' | 'fixed' | 'false_positive' | 'accepted_risk';
  assignee?: string;
  dueDate?: Timestamp;
}

export interface AppCheckConfiguration {
  enabled: boolean;
  providers: {
    recaptchaV3?: {
      enabled: boolean;
      siteKey: string;
      scoreThreshold: number; // 0.0 - 1.0
    };
    recaptchaEnterprise?: {
      enabled: boolean;
      projectId: string;
      siteKey: string;
    };
    debug?: {
      enabled: boolean;
      debugTokens: string[];
    };
  };
  enforcementLevel: 'off' | 'unenforced' | 'enforced';
  customProviders?: {
    name: string;
    tokenEndpoint: string;
    verificationEndpoint: string;
  }[];
}

export interface BiometricAuthConfig {
  enabled: boolean;
  supportedMethods: ('fingerprint' | 'face' | 'voice' | 'iris')[];
  fallbackToPassword: boolean;
  maxAttempts: number;
  timeout: number; // seconds
}

export interface DeviceFingerprint {
  id: string;
  userId: string;
  deviceId: string;
  fingerprint: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    language: string;
    platform: string;
    cookiesEnabled: boolean;
    plugins: string[];
    canvas?: string;
    webgl?: string;
    audioContext?: string;
  };
  trusted: boolean;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  loginCount: number;
  riskScore: number; // 0-100
  blocked: boolean;
  notes?: string;
}

export interface SecurityMetrics {
  timestamp: Timestamp;
  totalUsers: number;
  activeUsers: number;
  blockedIPs: number;
  failedLogins: number;
  successfulLogins: number;
  mfaAdoptions: number;
  securityEvents: {
    [key in SecurityEventType]?: number;
  };
  threatDetections: {
    [key in ThreatLevel]?: number;
  };
  appCheckSuccess: number;
  appCheckFailure: number;
  recaptchaScore: {
    average: number;
    distribution: { [score: string]: number };
  };
}

export interface SecurityConfiguration {
  // App Check
  appCheck: AppCheckConfiguration;
  
  // reCAPTCHA
  recaptcha: {
    v2: {
      enabled: boolean;
      siteKey?: string;
    };
    v3: {
      enabled: boolean;
      siteKey?: string;
      scoreThreshold: number;
    };
    enterprise: {
      enabled: boolean;
      projectId?: string;
      siteKey?: string;
    };
  };
  
  // Biometric Authentication
  biometricAuth: BiometricAuthConfig;
  
  // Monitoring & Alerting
  monitoring: {
    enableRealTimeAlerts: boolean;
    alertThresholds: {
      failedLoginRate: number; // per minute
      suspiciousActivityScore: number; // 0-100
      newDeviceLogins: number; // per hour
      dataExfiltrationSize: number; // bytes
    };
    alertChannels: {
      email?: string[];
      slack?: string;
      sms?: string[];
      webhook?: string;
    };
  };
  
  // Automated Responses
  automation: {
    autoBlockSuspiciousIPs: boolean;
    autoLockCompromisedAccounts: boolean;
    autoRequireMFAForHighRisk: boolean;
    autoRotateSessionsOnThreat: boolean;
  };
  
  // Compliance
  compliance: {
    gdpr: {
      enabled: boolean;
      dataRetentionDays: number;
      consentRequired: boolean;
    };
    kvkk: {
      enabled: boolean;
      dataRetentionDays: number;
      explicitConsent: boolean;
    };
    auditTrail: {
      enabled: boolean;
      retentionDays: number;
      immutable: boolean;
    };
  };
}
