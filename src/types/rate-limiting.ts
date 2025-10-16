// Rate Limiting & DDoS Protection Types for TourTrip.app
import { Timestamp } from 'firebase/firestore';

// Rate Limiting Configuration
export interface RateLimitConfig {
  global: GlobalRateLimit;
  endpoints: EndpointRateLimit[];
  userTiers: UserTierLimit[];
  ipBased: IPBasedLimit;
  ddosProtection: DDoSProtectionConfig;
  circuitBreakers: CircuitBreakerConfig[];
  monitoring: RateLimitMonitoring;
  actions: RateLimitAction[];
}

export interface GlobalRateLimit {
  enabled: boolean;
  windowSize: number; // seconds
  maxRequests: number;
  burstSize: number;
  gracePeriod: number; // seconds
  excludeHealthChecks: boolean;
  excludeAuthenticated: boolean;
}

export interface EndpointRateLimit {
  id: string;
  path: string;
  method: HttpMethod[];
  enabled: boolean;
  limits: RateLimit[];
  customHeaders: boolean;
  skipIfAuthenticated: boolean;
  priority: number;
  description: string;
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

export interface RateLimit {
  windowSize: number; // seconds
  maxRequests: number;
  burstSize?: number;
  identifier: RateLimitIdentifier;
  skipSuccessful?: boolean;
  skipConditions?: SkipCondition[];
}

export enum RateLimitIdentifier {
  IP = 'ip',
  USER_ID = 'user_id',
  API_KEY = 'api_key',
  SESSION = 'session',
  DEVICE_ID = 'device_id',
  FINGERPRINT = 'fingerprint',
  COMPOSITE = 'composite'
}

export interface SkipCondition {
  type: 'header' | 'ip_range' | 'user_role' | 'api_key_tier' | 'time_range';
  value: string;
  operator: 'equals' | 'contains' | 'in_range' | 'regex';
}

export interface UserTierLimit {
  tier: UserTier;
  multiplier: number;
  absoluteLimits?: AbsoluteTierLimit;
  exemptions: string[]; // endpoint patterns
  quotas: QuotaLimit[];
}

export enum UserTier {
  ANONYMOUS = 'anonymous',
  FREE = 'free',
  PREMIUM = 'premium',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin',
  SYSTEM = 'system'
}

export interface AbsoluteTierLimit {
  dailyRequests: number;
  hourlyRequests: number;
  minuteRequests: number;
  concurrentRequests: number;
}

export interface QuotaLimit {
  resource: QuotaResource;
  limit: number;
  period: QuotaPeriod;
  resetTime?: string; // HH:mm for daily reset
  carryOver: boolean;
  burst: boolean;
}

export enum QuotaResource {
  API_CALLS = 'api_calls',
  SEARCH_QUERIES = 'search_queries',
  FILE_UPLOADS = 'file_uploads',
  EMAIL_SENDS = 'email_sends',
  SMS_SENDS = 'sms_sends',
  NOTIFICATIONS = 'notifications',
  BOOKINGS = 'bookings',
  REVIEWS = 'reviews',
  MESSAGES = 'messages'
}

export enum QuotaPeriod {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

export interface IPBasedLimit {
  enabled: boolean;
  whitelistedIPs: string[];
  blacklistedIPs: string[];
  geolocation: GeolocationLimit;
  suspicious: SuspiciousIPLimit;
  reputation: IPReputationLimit;
}

export interface GeolocationLimit {
  enabled: boolean;
  allowedCountries: string[];
  blockedCountries: string[];
  allowVPN: boolean;
  allowTor: boolean;
  allowProxy: boolean;
  requireVerification: boolean;
}

export interface SuspiciousIPLimit {
  enabled: boolean;
  rapidRequestThreshold: number; // requests per minute
  failedAuthThreshold: number; // failed attempts
  multipleAccountThreshold: number; // accounts per IP
  timeWindow: number; // minutes
  blockDuration: number; // minutes
  progressiveBlocking: boolean;
}

export interface IPReputationLimit {
  enabled: boolean;
  providers: ReputationProvider[];
  trustScore: number; // minimum trust score (0-100)
  cacheTime: number; // minutes
  fallbackAction: 'allow' | 'block' | 'throttle';
}

export interface ReputationProvider {
  name: string;
  apiKey: string;
  endpoint: string;
  weight: number;
  timeout: number; // milliseconds
}

// DDoS Protection
export interface DDoSProtectionConfig {
  enabled: boolean;
  detection: DDoSDetection;
  mitigation: DDoSMitigation;
  cloudflare: CloudflareConfig;
  awsShield: AWSShieldConfig;
  customRules: CustomDDoSRule[];
}

export interface DDoSDetection {
  enabled: boolean;
  thresholds: DDoSThreshold[];
  patterns: AttackPattern[];
  anomalyDetection: AnomalyDetection;
  monitoring: DDoSMonitoring;
}

export interface DDoSThreshold {
  metric: DDoSMetric;
  threshold: number;
  timeWindow: number; // seconds
  severity: AttackSeverity;
  action: DDoSAction;
}

export enum DDoSMetric {
  REQUESTS_PER_SECOND = 'requests_per_second',
  BANDWIDTH_USAGE = 'bandwidth_usage',
  UNIQUE_IPS = 'unique_ips',
  ERROR_RATE = 'error_rate',
  CONNECTION_COUNT = 'connection_count',
  CPU_USAGE = 'cpu_usage',
  MEMORY_USAGE = 'memory_usage'
}

export enum AttackSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum DDoSAction {
  LOG = 'log',
  THROTTLE = 'throttle',
  BLOCK = 'block',
  CHALLENGE = 'challenge',
  REDIRECT = 'redirect',
  BLACKHOLE = 'blackhole'
}

export interface AttackPattern {
  name: string;
  description: string;
  signatures: AttackSignature[];
  enabled: boolean;
  severity: AttackSeverity;
  action: DDoSAction;
}

export interface AttackSignature {
  type: 'header' | 'user_agent' | 'payload' | 'frequency' | 'geography';
  pattern: string;
  weight: number;
  description: string;
}

export interface AnomalyDetection {
  enabled: boolean;
  algorithm: 'statistical' | 'machine_learning' | 'pattern_matching';
  sensitivity: number; // 1-10
  learningPeriod: number; // days
  baselineWindow: number; // hours
  adaptiveThresholds: boolean;
}

export interface DDoSMonitoring {
  realTime: boolean;
  alertThresholds: AlertThreshold[];
  dashboards: string[];
  exportLogs: boolean;
  retentionPeriod: number; // days
}

export interface AlertThreshold {
  metric: DDoSMetric;
  threshold: number;
  timeWindow: number;
  recipients: string[];
  channels: AlertChannel[];
}

export enum AlertChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  PAGERDUTY = 'pagerduty'
}

export interface DDoSMitigation {
  autoMitigation: boolean;
  strategies: MitigationStrategy[];
  fallbackActions: FallbackAction[];
  collaborativeDefense: boolean;
  trafficShaping: TrafficShaping;
}

export interface MitigationStrategy {
  type: MitigationType;
  enabled: boolean;
  priority: number;
  conditions: MitigationCondition[];
  parameters: { [key: string]: any };
}

export enum MitigationType {
  RATE_LIMITING = 'rate_limiting',
  GEO_BLOCKING = 'geo_blocking',
  IP_BLOCKING = 'ip_blocking',
  CHALLENGE_RESPONSE = 'challenge_response',
  TRAFFIC_SHAPING = 'traffic_shaping',
  LOAD_BALANCING = 'load_balancing',
  CONTENT_FILTERING = 'content_filtering',
  CONNECTION_LIMITING = 'connection_limiting'
}

export interface MitigationCondition {
  metric: DDoSMetric;
  operator: 'greater_than' | 'less_than' | 'equals' | 'percentage_increase';
  value: number;
  timeWindow: number;
}

export interface FallbackAction {
  trigger: 'primary_failure' | 'capacity_exceeded' | 'manual_override';
  action: DDoSAction;
  duration: number; // minutes
  whitelist: string[];
}

export interface TrafficShaping {
  enabled: boolean;
  priorityQueues: PriorityQueue[];
  bandwidthLimits: BandwidthLimit[];
  congestionControl: CongestionControl;
}

export interface PriorityQueue {
  name: string;
  priority: number;
  conditions: QueueCondition[];
  allocation: number; // percentage of bandwidth
  burstAllowance: number;
}

export interface QueueCondition {
  type: 'user_tier' | 'endpoint' | 'content_type' | 'geography';
  value: string;
  operator: 'equals' | 'contains' | 'regex';
}

export interface BandwidthLimit {
  type: 'per_ip' | 'per_user' | 'per_endpoint' | 'global';
  limit: number; // bytes per second
  burstSize: number;
  timeWindow: number;
}

export interface CongestionControl {
  algorithm: 'token_bucket' | 'leaky_bucket' | 'sliding_window' | 'adaptive';
  parameters: { [key: string]: any };
  backpressure: boolean;
}

export interface CloudflareConfig {
  enabled: boolean;
  zoneId: string;
  apiKey: string;
  email: string;
  settings: CloudflareSettings;
}

export interface CloudflareSettings {
  ddosProtection: boolean;
  rateLimit: boolean;
  bot: BotProtection;
  firewall: FirewallSettings;
  caching: CacheSettings;
}

export interface BotProtection {
  enabled: boolean;
  mode: 'off' | 'essentially_off' | 'low' | 'medium' | 'high' | 'under_attack';
  challengePassage: number; // minutes
  javaScriptDetection: boolean;
}

export interface FirewallSettings {
  enabled: boolean;
  rules: FirewallRule[];
  geoBlocking: string[];
  ipWhitelist: string[];
  ipBlacklist: string[];
}

export interface FirewallRule {
  expression: string;
  action: 'allow' | 'block' | 'challenge' | 'js_challenge' | 'managed_challenge';
  priority: number;
  enabled: boolean;
}

export interface CacheSettings {
  level: 'off' | 'basic' | 'simplified' | 'aggressive';
  browserTTL: number; // seconds
  edgeTTL: number; // seconds
  alwaysOnline: boolean;
}

export interface AWSShieldConfig {
  enabled: boolean;
  advanced: boolean;
  emergencyContacts: EmergencyContact[];
  proactiveEngagement: boolean;
  ddosResponseTeam: boolean;
}

export interface EmergencyContact {
  email: string;
  phone: string;
  contactNote: string;
}

export interface CustomDDoSRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: DDoSRuleCondition[];
  actions: DDoSRuleAction[];
  priority: number;
  tags: string[];
}

export interface DDoSRuleCondition {
  field: 'ip' | 'user_agent' | 'referer' | 'country' | 'asn' | 'request_rate';
  operator: 'equals' | 'contains' | 'greater_than' | 'in_list' | 'regex';
  value: string | number | string[];
  negate: boolean;
}

export interface DDoSRuleAction {
  type: DDoSAction;
  duration: number; // minutes
  redirectUrl?: string;
  responseCode?: number;
  message?: string;
}

// Circuit Breaker Pattern
export interface CircuitBreakerConfig {
  id: string;
  name: string;
  enabled: boolean;
  service: string;
  endpoint?: string;
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // milliseconds
  resetTimeout: number; // milliseconds
  monitoring: CircuitBreakerMonitoring;
  fallback: FallbackConfig;
}

export interface CircuitBreakerMonitoring {
  enabled: boolean;
  windowSize: number; // requests
  minimumThroughput: number;
  errorPercentage: number;
  slowCallThreshold: number; // milliseconds
  slowCallPercentage: number;
}

export interface FallbackConfig {
  enabled: boolean;
  type: 'static_response' | 'cached_response' | 'alternative_service' | 'graceful_degradation';
  response?: any;
  cacheKey?: string;
  serviceUrl?: string;
  timeout?: number;
}

// Rate Limit Tracking & Storage
export interface RateLimitEntry {
  id: string;
  identifier: string;
  identifierType: RateLimitIdentifier;
  endpoint: string;
  method: HttpMethod;
  count: number;
  windowStart: Timestamp;
  windowEnd: Timestamp;
  lastRequest: Timestamp;
  blocked: boolean;
  userTier?: UserTier;
  metadata: RateLimitMetadata;
}

export interface RateLimitMetadata {
  ipAddress: string;
  userAgent: string;
  country?: string;
  asn?: string;
  userId?: string;
  sessionId?: string;
  apiKey?: string;
  fingerprint?: string;
  referer?: string;
  requestSize: number;
  responseSize: number;
  duration: number; // milliseconds
  statusCode: number;
}

export interface RateLimitViolation {
  id: string;
  identifier: string;
  identifierType: RateLimitIdentifier;
  endpoint: string;
  method: HttpMethod;
  limitType: 'rate_limit' | 'quota' | 'concurrent';
  limit: number;
  actual: number;
  windowSize: number;
  timestamp: Timestamp;
  action: RateLimitActionType;
  severity: ViolationSeverity;
  metadata: RateLimitMetadata;
  resolved: boolean;
  resolvedAt?: Timestamp;
  resolution?: string;
}

export enum RateLimitActionType {
  THROTTLE = 'throttle',
  BLOCK = 'block',
  DELAY = 'delay',
  QUEUE = 'queue',
  REDIRECT = 'redirect',
  CHALLENGE = 'challenge',
  LOG_ONLY = 'log_only'
}

export enum ViolationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface RateLimitAction {
  trigger: RateLimitTrigger;
  action: RateLimitActionType;
  parameters: ActionParameters;
  enabled: boolean;
  priority: number;
}

export interface RateLimitTrigger {
  type: 'violation_count' | 'violation_rate' | 'threshold_exceeded' | 'pattern_detected';
  threshold: number;
  timeWindow: number; // minutes
  conditions: TriggerCondition[];
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'contains' | 'in_range';
  value: any;
}

export interface ActionParameters {
  duration?: number; // minutes
  delayMs?: number;
  redirectUrl?: string;
  queuePriority?: number;
  challengeType?: 'captcha' | 'js_challenge' | 'managed_challenge';
  message?: string;
  responseCode?: number;
  headers?: { [key: string]: string };
}

// Monitoring & Analytics
export interface RateLimitMonitoring {
  enabled: boolean;
  realTime: boolean;
  metrics: MonitoringMetric[];
  alerts: MonitoringAlert[];
  dashboards: Dashboard[];
  exportConfig: ExportConfig;
}

export interface MonitoringMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels: string[];
  description: string;
  unit: string;
  aggregation: 'sum' | 'avg' | 'max' | 'min' | 'percentile';
}

export interface MonitoringAlert {
  name: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  timeWindow: number; // minutes
  severity: AlertSeverity;
  channels: AlertChannel[];
  recipients: string[];
  cooldown: number; // minutes
  enabled: boolean;
}

export interface AlertCondition {
  operator: 'greater_than' | 'less_than' | 'equals' | 'percentage_change';
  aggregation: 'sum' | 'avg' | 'max' | 'min' | 'percentile';
  percentile?: number;
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

export interface Dashboard {
  name: string;
  description: string;
  panels: DashboardPanel[];
  refresh: number; // seconds
  timeRange: TimeRange;
  variables: DashboardVariable[];
}

export interface DashboardPanel {
  title: string;
  type: 'graph' | 'table' | 'stat' | 'gauge' | 'heatmap';
  metrics: string[];
  timeRange?: TimeRange;
  options: { [key: string]: any };
}

export interface TimeRange {
  from: string; // relative time (e.g., "1h", "24h") or absolute timestamp
  to: string;
}

export interface DashboardVariable {
  name: string;
  type: 'query' | 'custom' | 'constant';
  query?: string;
  options?: string[];
  value?: string;
  multiValue: boolean;
}

export interface ExportConfig {
  enabled: boolean;
  destinations: ExportDestination[];
  format: 'json' | 'csv' | 'prometheus' | 'influxdb';
  interval: number; // minutes
  retention: number; // days
}

export interface ExportDestination {
  type: 'webhook' | 's3' | 'gcs' | 'elasticsearch' | 'prometheus' | 'influxdb';
  config: { [key: string]: any };
  enabled: boolean;
}

// Analytics & Reporting
export interface RateLimitAnalytics {
  period: AnalyticsPeriod;
  summary: AnalyticsSummary;
  topViolators: TopViolator[];
  endpointAnalytics: EndpointAnalytics[];
  geographicAnalytics: GeographicAnalytics[];
  timeSeriesData: TimeSeriesData[];
  patterns: PatternAnalysis[];
  recommendations: Recommendation[];
}

export interface AnalyticsPeriod {
  start: Timestamp;
  end: Timestamp;
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsSummary {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  blockRate: number; // percentage
  topEndpoints: EndpointStat[];
  topCountries: CountryStat[];
  averageResponseTime: number;
  peakRequestsPerSecond: number;
}

export interface EndpointStat {
  endpoint: string;
  requests: number;
  blocked: number;
  blockRate: number;
  averageResponseTime: number;
}

export interface CountryStat {
  country: string;
  requests: number;
  blocked: number;
  blockRate: number;
}

export interface TopViolator {
  identifier: string;
  identifierType: RateLimitIdentifier;
  violations: number;
  totalRequests: number;
  violationRate: number;
  lastViolation: Timestamp;
  severity: ViolationSeverity;
  status: 'active' | 'blocked' | 'whitelisted';
}

export interface EndpointAnalytics {
  endpoint: string;
  method: HttpMethod;
  requests: number;
  violations: number;
  averageResponseTime: number;
  errorRate: number;
  topUsers: UserStat[];
  timeDistribution: HourlyDistribution[];
}

export interface UserStat {
  identifier: string;
  requests: number;
  violations: number;
  userTier?: UserTier;
}

export interface HourlyDistribution {
  hour: number;
  requests: number;
  violations: number;
}

export interface GeographicAnalytics {
  country: string;
  requests: number;
  violations: number;
  blockRate: number;
  suspiciousActivity: boolean;
  riskScore: number; // 0-100
}

export interface TimeSeriesData {
  timestamp: Timestamp;
  requests: number;
  blocked: number;
  violations: number;
  responseTime: number;
  errorRate: number;
  concurrentConnections: number;
}

export interface PatternAnalysis {
  pattern: string;
  description: string;
  occurrences: number;
  severity: ViolationSeverity;
  confidence: number; // 0-100
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  affectedEndpoints: string[];
  affectedUsers: string[];
}

export interface Recommendation {
  type: 'threshold_adjustment' | 'new_rule' | 'whitelist_addition' | 'pattern_blocking';
  description: string;
  rationale: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  proposedChange: any;
  estimatedReduction: number; // percentage reduction in false positives/negatives
}

// Hook Interfaces
export interface UseRateLimitingResult {
  // Rate limit checking
  checkRateLimit: (identifier: string, endpoint: string, method: HttpMethod) => Promise<RateLimitResult>;
  incrementCounter: (identifier: string, endpoint: string, method: HttpMethod, metadata: Partial<RateLimitMetadata>) => Promise<void>;
  
  // Violation management
  reportViolation: (violation: Omit<RateLimitViolation, 'id' | 'timestamp'>) => Promise<string>;
  getViolations: (identifier?: string, timeRange?: TimeRange) => Promise<RateLimitViolation[]>;
  resolveViolation: (violationId: string, resolution: string) => Promise<void>;
  
  // Analytics
  getAnalytics: (period: AnalyticsPeriod, filters?: AnalyticsFilter) => Promise<RateLimitAnalytics>;
  getTopViolators: (period: AnalyticsPeriod, limit?: number) => Promise<TopViolator[]>;
  
  // Configuration
  updateConfig: (config: Partial<RateLimitConfig>) => Promise<void>;
  getConfig: () => Promise<RateLimitConfig>;
  
  // State
  loading: boolean;
  error: string | null;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Timestamp;
  retryAfter?: number; // seconds
  reason?: string;
  action?: RateLimitActionType;
}

export interface AnalyticsFilter {
  endpoints?: string[];
  methods?: HttpMethod[];
  identifierTypes?: RateLimitIdentifier[];
  countries?: string[];
  userTiers?: UserTier[];
  minViolations?: number;
}

// Component Props
export interface RateLimitDashboardProps {
  period?: AnalyticsPeriod;
  realTime?: boolean;
  onConfigChange?: (config: RateLimitConfig) => void;
  className?: string;
}

export interface ViolationListProps {
  violations: RateLimitViolation[];
  onResolve?: (violationId: string) => void;
  onWhitelist?: (identifier: string) => void;
  onBlock?: (identifier: string) => void;
  className?: string;
}

export interface RateLimitConfigEditorProps {
  config: RateLimitConfig;
  onChange: (config: RateLimitConfig) => void;
  onSave: () => void;
  className?: string;
}
