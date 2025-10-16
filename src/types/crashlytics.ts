import { Timestamp } from 'firebase/firestore';

export type CrashType = 'javascript_error' | 'unhandled_rejection' | 'network_error' | 'performance_issue' | 'user_reported' | 'security_error';
export type CrashSeverity = 'low' | 'medium' | 'high' | 'critical';
export type CrashStatus = 'open' | 'investigating' | 'resolved' | 'ignored';

export interface CrashReport {
  id: string;
  type: CrashType;
  severity: CrashSeverity;
  status: CrashStatus;
  title: string;
  message: string;
  stackTrace?: string;
  timestamp: Timestamp;
  
  // User context
  userId?: string;
  sessionId: string;
  userAgent: string;
  
  // Device/Browser info
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    osVersion: string;
    browser: string;
    browserVersion: string;
    screenResolution: string;
    viewport: string;
    connection?: string;
  };
  
  // App context
  app: {
    version: string;
    environment: 'development' | 'staging' | 'production';
    buildId?: string;
    feature?: string; // Which feature was being used
    route: string; // Current page/route
  };
  
  // Technical details
  technical: {
    url: string;
    referrer?: string;
    loadTime?: number;
    memoryUsage?: number;
    networkLatency?: number;
    consoleErrors?: string[];
    breadcrumbs?: Breadcrumb[];
  };
  
  // Additional metadata
  metadata?: { [key: string]: any };
  
  // Crash clustering
  fingerprint: string; // For grouping similar crashes
  occurrence: number; // How many times this crash occurred
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  
  // Resolution
  resolvedBy?: string;
  resolvedAt?: Timestamp;
  resolution?: string;
  preventionSteps?: string[];
}

export interface Breadcrumb {
  id: string;
  timestamp: Date;
  type: 'navigation' | 'user_action' | 'network' | 'log' | 'error';
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: { [key: string]: any };
}

export interface PerformanceIssue {
  id: string;
  type: 'slow_page_load' | 'memory_leak' | 'cpu_spike' | 'network_timeout' | 'large_bundle' | 'slow_query';
  severity: CrashSeverity;
  title: string;
  description: string;
  timestamp: Timestamp;
  
  // Performance metrics
  metrics: {
    pageLoadTime?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    cumulativeLayoutShift?: number;
    firstInputDelay?: number;
    bundleSize?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    networkRequests?: number;
    networkLatency?: number;
  };
  
  // Context
  userId?: string;
  sessionId: string;
  route: string;
  device: CrashReport['device'];
  
  // Resolution
  status: CrashStatus;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
  optimizations?: string[];
}

export interface UserFeedback {
  id: string;
  crashId?: string;
  performanceIssueId?: string;
  type: 'bug_report' | 'feature_request' | 'performance_issue' | 'usability_issue';
  severity: CrashSeverity;
  title: string;
  description: string;
  stepsToReproduce?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  
  // User info
  userId?: string;
  userEmail?: string;
  sessionId: string;
  
  // Context
  timestamp: Timestamp;
  route: string;
  device: CrashReport['device'];
  screenshots?: string[]; // URLs to screenshots
  
  // Processing
  status: 'new' | 'triaged' | 'in_progress' | 'resolved' | 'wont_fix';
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  
  // Resolution
  resolvedAt?: Timestamp;
  resolution?: string;
  responseToUser?: string;
}

export interface CrashAnalytics {
  id: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  
  overview: {
    totalCrashes: number;
    uniqueCrashes: number;
    affectedUsers: number;
    crashFreeUsers: number;
    crashFreeRate: number; // percentage
  };
  
  byType: {
    [key in CrashType]: {
      count: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  
  bySeverity: {
    [key in CrashSeverity]: {
      count: number;
      percentage: number;
    };
  };
  
  byDevice: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  
  byBrowser: {
    [browser: string]: number;
  };
  
  byRoute: {
    [route: string]: number;
  };
  
  topCrashes: {
    fingerprint: string;
    title: string;
    count: number;
    affectedUsers: number;
    firstSeen: Date;
    lastSeen: Date;
  }[];
  
  performance: {
    avgPageLoadTime: number;
    avgMemoryUsage: number;
    slowestRoutes: {
      route: string;
      avgLoadTime: number;
    }[];
  };
  
  userFeedback: {
    totalReports: number;
    avgSeverity: number;
    mostReportedIssues: {
      title: string;
      count: number;
    }[];
  };
}

export interface CrashlyticsConfiguration {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  
  // Collection settings
  collection: {
    enableAutomaticCrashReporting: boolean;
    enablePerformanceMonitoring: boolean;
    enableUserFeedbackCollection: boolean;
    enableBreadcrumbs: boolean;
    maxBreadcrumbs: number;
    enableConsoleCapture: boolean;
    enableNetworkCapture: boolean;
  };
  
  // Filtering
  filtering: {
    enableSampling: boolean;
    samplingRate: number; // 0-1
    ignorePatterns: string[]; // Regex patterns to ignore
    minimumSeverity: CrashSeverity;
    enableLocalDevelopment: boolean;
  };
  
  // Privacy
  privacy: {
    enableDataScrubbing: boolean;
    scrubFields: string[];
    enableUserIdCollection: boolean;
    enableIpCollection: boolean;
    enableUserAgentCollection: boolean;
  };
  
  // Notification settings
  notifications: {
    enableRealTimeAlerts: boolean;
    enableDigestEmails: boolean;
    alertThresholds: {
      crashRate: number; // crashes per minute
      newCrashTypes: boolean;
      criticalCrashes: boolean;
      performanceDegradation: number; // percentage
    };
    channels: {
      email?: string[];
      slack?: string;
      webhook?: string;
      sms?: string[];
    };
  };
  
  // Integration
  integration: {
    firebaseProject: string;
    enableFirebaseCrashlytics: boolean;
    enableGoogleAnalytics: boolean;
    enableSentry: boolean;
    sentryDsn?: string;
    enableBugsnag: boolean;
    bugsnagApiKey?: string;
  };
  
  // Retention
  retention: {
    crashReportsDays: number;
    performanceDataDays: number;
    userFeedbackDays: number;
    analyticsDataDays: number;
  };
}

export interface ErrorContext {
  userId?: string;
  sessionId: string;
  feature?: string;
  action?: string;
  metadata?: { [key: string]: any };
  breadcrumbs?: Breadcrumb[];
}

export interface CrashMetrics {
  timestamp: Date;
  crashRate: number; // crashes per session
  affectedUsers: number;
  totalSessions: number;
  crashFreeRate: number;
  avgResponseTime: number;
  memoryUsage: number;
  errorRate: number;
}

// Helper types for crash grouping and analysis
export interface CrashCluster {
  fingerprint: string;
  crashes: CrashReport[];
  firstOccurrence: Date;
  lastOccurrence: Date;
  totalOccurrences: number;
  uniqueUsers: number;
  severity: CrashSeverity;
  status: CrashStatus;
  pattern?: {
    commonStack?: string[];
    commonRoutes?: string[];
    commonDevices?: string[];
    commonTimeframes?: string[];
  };
}

export interface CrashTrend {
  period: 'hour' | 'day' | 'week' | 'month';
  data: {
    timestamp: Date;
    crashCount: number;
    userCount: number;
    sessionCount: number;
    crashRate: number;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
}

// For crash reporting API responses
export interface CrashReportResponse {
  success: boolean;
  crashId?: string;
  message?: string;
  shouldRetry?: boolean;
  retryAfter?: number; // seconds
}

// For performance monitoring
export interface PerformanceSnapshot {
  timestamp: Date;
  route: string;
  metrics: {
    loadTime: number;
    renderTime: number;
    interactionTime: number;
    memoryUsage: number;
    bundleSize: number;
    apiResponseTime: number;
    domNodes: number;
    styleRecalculations: number;
    layoutThrashing: number;
  };
  vitals: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
  };
}
