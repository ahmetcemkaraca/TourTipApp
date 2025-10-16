import { Timestamp } from 'firebase/firestore';

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer';
export type AlertStatus = 'normal' | 'warning' | 'critical';
export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export interface Metric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  unit?: string;
  timestamp: Timestamp;
  labels?: { [key: string]: string };
  description?: string;
}

export interface PerformanceMetric {
  id: string;
  metricName: string;
  value: number;
  deviceCategory?: 'mobile' | 'desktop' | 'tablet';
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  connectionType?: string;
  timestamp: Timestamp;
  userId?: string;
  sessionId?: string;
  url?: string;
}

export interface SystemHealth {
  id: string;
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  errorRate?: number;
  uptime?: number;
  lastCheck: Timestamp;
  details?: { [key: string]: any };
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  level: AlertLevel;
  status: AlertStatus;
  service: string;
  metricName?: string;
  threshold?: number;
  currentValue?: number;
  triggeredAt: Timestamp;
  resolvedAt?: Timestamp;
  assignedTo?: string;
  tags?: string[];
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'status' | 'log';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: {
    metricName?: string;
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
    filters?: { [key: string]: string };
    refresh?: number; // seconds
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
}

export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service: string;
  timestamp: Timestamp;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: { [key: string]: any };
  stackTrace?: string;
  environment?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metricName: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  duration: number; // seconds
  severity: AlertLevel;
  enabled: boolean;
  notifications: {
    email?: string[];
    sms?: string[];
    slack?: string;
    webhook?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MonitoringConfig {
  enablePerformanceTracking: boolean;
  enableRealUserMonitoring: boolean;
  enableErrorTracking: boolean;
  enableCustomMetrics: boolean;
  metricRetentionDays: number;
  alertRetentionDays: number;
  logRetentionDays: number;
  defaultRefreshInterval: number;
  maxDashboardWidgets: number;
}

// Chart data types
export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface ChartOptions {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title?: string;
  subtitle?: string;
  xAxis?: {
    title?: string;
    type?: 'datetime' | 'category' | 'linear';
  };
  yAxis?: {
    title?: string;
    min?: number;
    max?: number;
  };
  legend?: {
    enabled: boolean;
    position?: 'top' | 'right' | 'bottom' | 'left';
  };
  tooltip?: {
    enabled: boolean;
    formatter?: (value: any) => string;
  };
}

// Real-time data types
export interface RealTimeMetrics {
  activeUsers: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  timestamp: Date;
}

export interface ServiceStatus {
  service: string;
  status: 'operational' | 'degraded' | 'outage';
  lastIncident?: {
    title: string;
    startTime: Date;
    endTime?: Date;
    severity: AlertLevel;
  };
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
}

// Monitoring service configuration
export interface MonitoringServiceConfig {
  firebase: {
    enableAnalytics: boolean;
    enablePerformance: boolean;
    enableCrashlytics: boolean;
    enableRemoteConfig: boolean;
  };
  external: {
    enableUptimeRobot: boolean;
    enableDatadog: boolean;
    enableNewRelic: boolean;
    enableSentry: boolean;
  };
  customMetrics: {
    enableBusinessMetrics: boolean;
    enableUserMetrics: boolean;
    enableSystemMetrics: boolean;
  };
  alerts: {
    enableSlackNotifications: boolean;
    enableEmailNotifications: boolean;
    enableSMSNotifications: boolean;
    enableWebhookNotifications: boolean;
  };
}
