// Data Privacy & Compliance Types for TourTrip.app
import { Timestamp } from 'firebase/firestore';

// Data Privacy Compliance Framework
export interface PrivacyConfig {
  regulations: ComplianceRegulation[];
  dataRetentionPeriods: DataRetentionConfig;
  consentManagement: ConsentManagementConfig;
  dataProcessingBasis: ProcessingBasisConfig;
  rightsManagement: DataRightsConfig;
  auditSettings: AuditConfig;
  anonymizationRules: AnonymizationConfig;
  crossBorderTransfer: CrossBorderConfig;
}

export enum ComplianceRegulation {
  GDPR = 'gdpr', // General Data Protection Regulation (EU)
  KVKK = 'kvkk', // Kişisel Verilerin Korunması Kanunu (Turkey)
  CCPA = 'ccpa', // California Consumer Privacy Act (US)
  LGPD = 'lgpd', // Lei Geral de Proteção de Dados (Brazil)
  PIPEDA = 'pipeda', // Personal Information Protection and Electronic Documents Act (Canada)
  DPA = 'dpa' // Data Protection Act (UK)
}

export interface DataRetentionConfig {
  defaultPeriod: number; // days
  categorySpecific: { [category in DataCategory]: number };
  automaticDeletion: boolean;
  warningPeriod: number; // days before deletion
  graceperiod: number; // days after warning
}

export interface ConsentManagementConfig {
  requireExplicitConsent: boolean;
  granularConsent: boolean;
  consentWithdrawalEasy: boolean;
  minorConsentAge: number;
  parentalConsentRequired: boolean;
  consentRefreshPeriod: number; // days
}

export interface ProcessingBasisConfig {
  defaultBasis: ProcessingLegalBasis;
  categorySpecific: { [category in DataCategory]: ProcessingLegalBasis };
  requireDocumentation: boolean;
  legitimateInterestAssessment: boolean;
}

export interface DataRightsConfig {
  accessRequest: RightConfig;
  rectification: RightConfig;
  erasure: RightConfig;
  portability: RightConfig;
  restriction: RightConfig;
  objection: RightConfig;
  automaticDecisionMaking: RightConfig;
}

export interface RightConfig {
  enabled: boolean;
  timeLimit: number; // days to respond
  verificationRequired: boolean;
  feeApplicable: boolean;
  automatedProcessing: boolean;
}

export interface AuditConfig {
  logAllAccess: boolean;
  logDataChanges: boolean;
  logConsentChanges: boolean;
  logDeletions: boolean;
  retentionPeriod: number; // days
  encryptLogs: boolean;
  realTimeMonitoring: boolean;
}

export interface AnonymizationConfig {
  automaticAnonymization: boolean;
  anonymizationDelay: number; // days after deletion request
  pseudonymizationLevel: 'basic' | 'advanced' | 'cryptographic';
  kAnonymity: number;
  lDiversity: boolean;
  tCloseness: boolean;
}

export interface CrossBorderConfig {
  allowedCountries: string[];
  adequacyDecisions: string[];
  safeguardsRequired: boolean;
  bindingCorporateRules: boolean;
  standardContractualClauses: boolean;
  certificationRequired: boolean;
}

// Data Classification & Categories
export enum DataCategory {
  PERSONAL_IDENTIFIERS = 'personal_identifiers', // Name, email, phone, address
  SENSITIVE_PERSONAL = 'sensitive_personal', // Health, religion, sexual orientation
  FINANCIAL = 'financial', // Payment info, bank details, transaction history
  BIOMETRIC = 'biometric', // Fingerprints, facial recognition, voice prints
  LOCATION = 'location', // GPS coordinates, IP address, travel routes
  BEHAVIORAL = 'behavioral', // Browsing history, preferences, interactions
  COMMUNICATION = 'communication', // Messages, emails, call logs
  TECHNICAL = 'technical', // Device info, logs, cookies, session data
  PSEUDONYMIZED = 'pseudonymized', // Anonymized or pseudonymized data
  PUBLIC = 'public' // Publicly available information
}

export enum DataSensitivity {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  TOP_SECRET = 'top_secret'
}

export enum ProcessingLegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

export interface DataInventoryItem {
  id: string;
  name: string;
  description: string;
  category: DataCategory;
  sensitivity: DataSensitivity;
  personalData: boolean;
  sensitiveData: boolean;
  legalBasis: ProcessingLegalBasis;
  purposes: ProcessingPurpose[];
  retention: RetentionPolicy;
  storage: StorageInfo;
  access: AccessInfo;
  sharing: SharingInfo;
  protection: ProtectionMeasures;
  compliance: ComplianceInfo;
  lastUpdated: Timestamp;
  dataOwner: string;
  dataController: string;
  dataProcessor?: string;
}

export enum ProcessingPurpose {
  SERVICE_PROVISION = 'service_provision',
  CONTRACT_PERFORMANCE = 'contract_performance',
  CUSTOMER_SUPPORT = 'customer_support',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  SECURITY = 'security',
  LEGAL_COMPLIANCE = 'legal_compliance',
  RESEARCH = 'research',
  QUALITY_IMPROVEMENT = 'quality_improvement',
  FRAUD_PREVENTION = 'fraud_prevention'
}

export interface RetentionPolicy {
  period: number; // days
  basis: 'legal_requirement' | 'business_need' | 'consent_duration' | 'contract_duration';
  deletionMethod: 'secure_deletion' | 'anonymization' | 'pseudonymization';
  archivalRequired: boolean;
  archivalPeriod?: number; // days
  reviewPeriod: number; // days
}

export interface StorageInfo {
  location: string[]; // Countries or regions
  provider: string;
  encryption: EncryptionInfo;
  backup: BackupInfo;
  access: 'restricted' | 'controlled' | 'monitored' | 'public';
}

export interface EncryptionInfo {
  atRest: boolean;
  inTransit: boolean;
  algorithm: string;
  keyManagement: 'managed' | 'customer_managed' | 'bring_your_own';
  keyRotation: boolean;
  keyRotationPeriod?: number; // days
}

export interface BackupInfo {
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  retention: number; // days
  encryption: boolean;
  offSite: boolean;
  geographicDistribution: string[];
}

export interface AccessInfo {
  whoCanAccess: AccessRole[];
  accessControls: string[];
  monitoring: boolean;
  logging: boolean;
  mfaRequired: boolean;
  vpnRequired: boolean;
}

export enum AccessRole {
  DATA_SUBJECT = 'data_subject',
  CUSTOMER_SUPPORT = 'customer_support',
  DEVELOPER = 'developer',
  ANALYST = 'analyst',
  ADMIN = 'admin',
  DPO = 'dpo', // Data Protection Officer
  LEGAL = 'legal',
  SECURITY = 'security',
  THIRD_PARTY = 'third_party'
}

export interface SharingInfo {
  sharedWith: ThirdParty[];
  purposes: ProcessingPurpose[];
  legalBasis: ProcessingLegalBasis;
  safeguards: string[];
  contractual: boolean;
  crossBorder: boolean;
  countries: string[];
}

export interface ThirdParty {
  name: string;
  type: 'processor' | 'controller' | 'joint_controller' | 'recipient';
  country: string;
  purposes: ProcessingPurpose[];
  dataTypes: DataCategory[];
  contractInPlace: boolean;
  adequacyDecision: boolean;
  safeguards: string[];
}

export interface ProtectionMeasures {
  technical: TechnicalMeasure[];
  organizational: OrganizationalMeasure[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastRiskAssessment: Timestamp;
  vulnerabilities: Vulnerability[];
  mitigations: Mitigation[];
}

export interface TechnicalMeasure {
  type: 'encryption' | 'access_control' | 'monitoring' | 'backup' | 'network_security' | 'endpoint_protection';
  description: string;
  implemented: boolean;
  effectiveness: 'low' | 'medium' | 'high';
  lastReview: Timestamp;
}

export interface OrganizationalMeasure {
  type: 'policy' | 'training' | 'audit' | 'incident_response' | 'governance' | 'certification';
  description: string;
  implemented: boolean;
  effectiveness: 'low' | 'medium' | 'high';
  lastReview: Timestamp;
}

export interface Vulnerability {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  discovered: Timestamp;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted';
  impact: string;
  likelihood: 'low' | 'medium' | 'high';
}

export interface Mitigation {
  vulnerabilityId: string;
  description: string;
  type: 'technical' | 'organizational' | 'legal';
  status: 'planned' | 'in_progress' | 'completed';
  dueDate: Timestamp;
  responsible: string;
}

export interface ComplianceInfo {
  regulations: ComplianceRegulation[];
  assessments: ComplianceAssessment[];
  certifications: Certification[];
  lastAudit: Timestamp;
  nextAudit: Timestamp;
  complianceScore: number; // 0-100
  findings: ComplianceFinding[];
}

export interface ComplianceAssessment {
  regulation: ComplianceRegulation;
  score: number; // 0-100
  date: Timestamp;
  assessor: string;
  findings: ComplianceFinding[];
  recommendations: string[];
  status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
}

export interface Certification {
  name: string;
  issuer: string;
  validFrom: Timestamp;
  validUntil: Timestamp;
  scope: string;
  certificateNumber: string;
  status: 'valid' | 'expired' | 'suspended' | 'revoked';
}

export interface ComplianceFinding {
  id: string;
  regulation: ComplianceRegulation;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  requirement: string;
  evidence: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted';
  dueDate: Timestamp;
  responsible: string;
  remediation: string;
}

// Consent Management
export interface ConsentRecord {
  id: string;
  userId: string;
  dataSubjectId: string; // For non-users (e.g., contacts)
  consentType: ConsentType;
  purposes: ProcessingPurpose[];
  dataCategories: DataCategory[];
  status: ConsentStatus;
  version: string;
  language: string;
  consentMethod: ConsentMethod;
  consentText: string;
  granular: boolean;
  granularChoices?: GranularConsent[];
  givenAt: Timestamp;
  withdrawnAt?: Timestamp;
  lastUpdated: Timestamp;
  expiresAt?: Timestamp;
  ipAddress: string;
  userAgent: string;
  source: ConsentSource;
  evidence: ConsentEvidence;
  legalBasis: ProcessingLegalBasis;
  withdrawn: boolean;
  withdrawalReason?: string;
  parentalConsent?: ParentalConsent;
}

export enum ConsentType {
  EXPLICIT = 'explicit',
  IMPLIED = 'implied',
  OPT_IN = 'opt_in',
  OPT_OUT = 'opt_out',
  BLANKET = 'blanket',
  GRANULAR = 'granular'
}

export enum ConsentStatus {
  GIVEN = 'given',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
  PENDING = 'pending',
  REFUSED = 'refused',
  INVALID = 'invalid'
}

export enum ConsentMethod {
  CHECKBOX = 'checkbox',
  BUTTON_CLICK = 'button_click',
  VERBAL = 'verbal',
  WRITTEN = 'written',
  ELECTRONIC_SIGNATURE = 'electronic_signature',
  BIOMETRIC = 'biometric',
  BEHAVIORAL = 'behavioral'
}

export enum ConsentSource {
  WEBSITE = 'website',
  MOBILE_APP = 'mobile_app',
  EMAIL = 'email',
  PHONE = 'phone',
  IN_PERSON = 'in_person',
  THIRD_PARTY = 'third_party',
  API = 'api'
}

export interface GranularConsent {
  purpose: ProcessingPurpose;
  dataCategory: DataCategory;
  consented: boolean;
  required: boolean;
  description: string;
}

export interface ConsentEvidence {
  type: 'screenshot' | 'recording' | 'log' | 'document' | 'witness';
  url?: string;
  hash?: string;
  metadata: { [key: string]: any };
}

export interface ParentalConsent {
  parentId: string;
  parentName: string;
  parentEmail: string;
  verificationMethod: 'id_verification' | 'credit_card' | 'call_back' | 'email_verification';
  verified: boolean;
  verifiedAt?: Timestamp;
  childAge: number;
  relationship: string;
}

// Data Subject Rights
export interface DataSubjectRequest {
  id: string;
  requestNumber: string; // Human readable
  userId?: string;
  dataSubjectInfo: DataSubjectInfo;
  requestType: DataSubjectRightType;
  description: string;
  scope: RequestScope;
  status: RequestStatus;
  priority: RequestPriority;
  submittedAt: Timestamp;
  dueDate: Timestamp;
  completedAt?: Timestamp;
  assignedTo?: string;
  verificationStatus: VerificationStatus;
  verificationMethod?: VerificationMethod;
  verificationData?: VerificationData;
  processing: ProcessingInfo;
  response?: RequestResponse;
  appeal?: Appeal;
  auditTrail: AuditLogEntry[];
  metadata: RequestMetadata;
}

export interface DataSubjectInfo {
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  dateOfBirth?: string;
  nationalId?: string;
  passportNumber?: string;
  relationship?: 'self' | 'parent' | 'guardian' | 'representative' | 'lawyer';
  representativeInfo?: RepresentativeInfo;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface RepresentativeInfo {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  authorization: string; // Document reference
  verified: boolean;
}

export enum DataSubjectRightType {
  ACCESS = 'access', // Right to access personal data
  RECTIFICATION = 'rectification', // Right to rectify inaccurate data
  ERASURE = 'erasure', // Right to be forgotten
  PORTABILITY = 'portability', // Right to data portability
  RESTRICTION = 'restriction', // Right to restrict processing
  OBJECTION = 'objection', // Right to object to processing
  WITHDRAW_CONSENT = 'withdraw_consent', // Right to withdraw consent
  AUTOMATED_DECISION = 'automated_decision', // Right not to be subject to automated decision-making
  INFORMATION = 'information', // Right to be informed
  COMPLAINT = 'complaint' // Right to lodge a complaint
}

export interface RequestScope {
  dataCategories: DataCategory[];
  purposes: ProcessingPurpose[];
  timeRange?: {
    start: Timestamp;
    end: Timestamp;
  };
  systems: string[];
  includeBackups: boolean;
  includeArchived: boolean;
  includeThirdParties: boolean;
}

export enum RequestStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  VERIFICATION_PENDING = 'verification_pending',
  VERIFICATION_FAILED = 'verification_failed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  EXTENDED = 'extended',
  APPEALED = 'appealed'
}

export enum RequestPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  NOT_REQUIRED = 'not_required'
}

export enum VerificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  ID_DOCUMENT = 'id_document',
  BIOMETRIC = 'biometric',
  KNOWLEDGE_BASED = 'knowledge_based',
  MULTI_FACTOR = 'multi_factor',
  MANUAL = 'manual'
}

export interface VerificationData {
  method: VerificationMethod;
  attempts: number;
  verifiedAt?: Timestamp;
  evidence: string[]; // Document IDs or references
  score?: number; // Confidence score
  notes?: string;
}

export interface ProcessingInfo {
  startedAt: Timestamp;
  estimatedCompletion: Timestamp;
  progress: number; // 0-100
  steps: ProcessingStep[];
  challenges: ProcessingChallenge[];
  systemsInvolved: string[];
  dataVolume: DataVolume;
}

export interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  notes?: string;
  automatedProcessing: boolean;
}

export interface ProcessingChallenge {
  type: 'technical' | 'legal' | 'business' | 'third_party';
  description: string;
  impact: 'low' | 'medium' | 'high';
  resolution?: string;
  resolvedAt?: Timestamp;
}

export interface DataVolume {
  recordsCount: number;
  storageSize: number; // bytes
  systemsCount: number;
  backupsCount: number;
  thirdPartiesCount: number;
}

export interface RequestResponse {
  type: 'fulfillment' | 'rejection' | 'partial_fulfillment';
  message: string;
  reason?: string;
  legalBasis?: string;
  data?: ResponseData;
  timeline: ResponseTimeline;
  appealInformation?: AppealInformation;
}

export interface ResponseData {
  format: 'json' | 'xml' | 'csv' | 'pdf' | 'structured' | 'machine_readable';
  files: ResponseFile[];
  summary: DataSummary;
  verification: string; // Hash or checksum
}

export interface ResponseFile {
  id: string;
  name: string;
  type: string;
  size: number;
  downloadUrl: string;
  expiresAt: Timestamp;
  encrypted: boolean;
  password?: string;
}

export interface DataSummary {
  totalRecords: number;
  dataCategories: { [category in DataCategory]?: number };
  purposes: { [purpose in ProcessingPurpose]?: number };
  timeRange: {
    earliest: Timestamp;
    latest: Timestamp;
  };
  sources: string[];
}

export interface ResponseTimeline {
  received: Timestamp;
  verified: Timestamp;
  processed: Timestamp;
  delivered: Timestamp;
  acknowledged?: Timestamp;
}

export interface AppealInformation {
  deadline: Timestamp;
  process: string;
  contact: ContactInfo;
  supervisoryAuthority: SupervisoryAuthority;
}

export interface Appeal {
  submittedAt: Timestamp;
  reason: string;
  evidence: string[];
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
  decision?: AppealDecision;
}

export interface AppealDecision {
  decidedAt: Timestamp;
  decision: 'upheld' | 'overturned' | 'modified';
  reasoning: string;
  newResponse?: RequestResponse;
  decidedBy: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  website?: string;
}

export interface SupervisoryAuthority {
  name: string;
  country: string;
  contact: ContactInfo;
  website: string;
  complaintForm?: string;
}

export interface RequestMetadata {
  source: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  referrer?: string;
  language: string;
  regulations: ComplianceRegulation[];
  estimatedComplexity: 'simple' | 'medium' | 'complex';
  fees?: FeeInfo;
}

export interface FeeInfo {
  applicable: boolean;
  amount?: number;
  currency?: string;
  reason?: string;
  waived?: boolean;
  waiverReason?: string;
}

// Audit & Logging
export interface AuditLogEntry {
  id: string;
  timestamp: Timestamp;
  userId?: string;
  sessionId?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  details: AuditDetails;
  result: AuditResult;
  metadata: AuditMetadata;
  ipAddress: string;
  userAgent: string;
  geolocation?: Geolocation;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dataCategories: DataCategory[];
  legalBasis?: ProcessingLegalBasis;
  retention: AuditRetention;
}

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  LOGIN = 'login',
  LOGOUT = 'logout',
  CONSENT_GIVEN = 'consent_given',
  CONSENT_WITHDRAWN = 'consent_withdrawn',
  REQUEST_SUBMITTED = 'request_submitted',
  REQUEST_PROCESSED = 'request_processed',
  DATA_BREACH = 'data_breach',
  UNAUTHORIZED_ACCESS = 'unauthorized_access'
}

export enum AuditResourceType {
  USER = 'user',
  PERSONAL_DATA = 'personal_data',
  CONSENT = 'consent',
  DATA_SUBJECT_REQUEST = 'data_subject_request',
  SYSTEM = 'system',
  CONFIGURATION = 'configuration',
  POLICY = 'policy',
  DOCUMENT = 'document'
}

export interface AuditDetails {
  oldValue?: any;
  newValue?: any;
  changes?: string[];
  reason?: string;
  approvedBy?: string;
  automatedProcess?: boolean;
  systemGenerated?: boolean;
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
  BLOCKED = 'blocked',
  ERROR = 'error'
}

export interface AuditMetadata {
  system: string;
  module: string;
  function: string;
  correlationId?: string;
  requestId?: string;
  batchId?: string;
  tags: string[];
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface Geolocation {
  country: string;
  region: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AuditRetention {
  period: number; // days
  archiveAfter: number; // days
  deleteAfter: number; // days
  encrypted: boolean;
  immutable: boolean;
}

// Data Breach Management
export interface DataBreach {
  id: string;
  incidentNumber: string;
  title: string;
  description: string;
  category: BreachCategory;
  severity: BreachSeverity;
  status: BreachStatus;
  discoveredAt: Timestamp;
  reportedAt: Timestamp;
  occurredAt?: Timestamp;
  containedAt?: Timestamp;
  resolvedAt?: Timestamp;
  discoveredBy: string;
  reportedBy: string;
  assignedTo: string;
  affectedData: AffectedData;
  affectedIndividuals: AffectedIndividuals;
  rootCause: RootCause;
  impact: BreachImpact;
  notifications: BreachNotification[];
  remediation: RemediationPlan;
  lessons: LessonsLearned;
  auditTrail: AuditLogEntry[];
  documents: BreachDocument[];
  costs: BreachCosts;
  compliance: BreachCompliance;
}

export enum BreachCategory {
  CONFIDENTIALITY = 'confidentiality',
  INTEGRITY = 'integrity',
  AVAILABILITY = 'availability',
  COMBINED = 'combined'
}

export enum BreachSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum BreachStatus {
  DISCOVERED = 'discovered',
  INVESTIGATING = 'investigating',
  CONTAINED = 'contained',
  NOTIFIED = 'notified',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface AffectedData {
  categories: DataCategory[];
  volume: DataVolume;
  sensitivity: DataSensitivity;
  systems: string[];
  backupsAffected: boolean;
  thirdPartiesAffected: string[];
  geographicScope: string[];
}

export interface AffectedIndividuals {
  count: number;
  categories: string[]; // customers, employees, partners, etc.
  countries: string[];
  minors: boolean;
  vulnerableGroups: string[];
  notificationRequired: boolean;
  notificationMethod: string[];
}

export interface RootCause {
  primary: string;
  contributing: string[];
  category: 'human_error' | 'system_failure' | 'malicious_attack' | 'natural_disaster' | 'third_party' | 'unknown';
  preventable: boolean;
  previous: boolean; // Has this type of breach occurred before?
}

export interface BreachImpact {
  individuals: IndividualImpact;
  organization: OrganizationalImpact;
  reputation: ReputationalImpact;
  operational: OperationalImpact;
  financial: FinancialImpact;
  legal: LegalImpact;
}

export interface IndividualImpact {
  riskLevel: 'low' | 'medium' | 'high';
  risks: string[]; // identity theft, financial loss, etc.
  mitigation: string[];
  ongoing: boolean;
}

export interface OrganizationalImpact {
  businessContinuity: 'none' | 'minimal' | 'moderate' | 'severe';
  dataLoss: boolean;
  systemAvailability: number; // percentage
  customerTrust: 'none' | 'minimal' | 'moderate' | 'severe';
}

export interface ReputationalImpact {
  mediaAttention: boolean;
  socialMediaImpact: 'none' | 'minimal' | 'moderate' | 'severe';
  customerChurn: number; // percentage
  brandValue: 'none' | 'minimal' | 'moderate' | 'severe';
}

export interface OperationalImpact {
  systemsDown: string[];
  processesAffected: string[];
  resourcesRequired: ResourceRequirement[];
  timeline: OperationalTimeline;
}

export interface ResourceRequirement {
  type: 'human' | 'technical' | 'financial' | 'external';
  description: string;
  quantity: number;
  duration: number; // hours
  cost: number;
}

export interface OperationalTimeline {
  detection: Timestamp;
  containment: Timestamp;
  investigation: Timestamp;
  notification: Timestamp;
  resolution: Timestamp;
  recovery: Timestamp;
}

export interface FinancialImpact {
  directCosts: CostCategory[];
  indirectCosts: CostCategory[];
  totalEstimated: number;
  currency: string;
  insuranceCoverage: number;
  penalties: PenaltyInfo[];
}

export interface CostCategory {
  category: string;
  amount: number;
  description: string;
  actual: boolean; // true if actual, false if estimated
}

export interface PenaltyInfo {
  authority: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'potential' | 'assessed' | 'paid' | 'appealed';
}

export interface LegalImpact {
  lawsuits: LawsuitInfo[];
  regulatoryAction: RegulatoryAction[];
  complianceViolations: ComplianceViolation[];
  legalCosts: number;
}

export interface LawsuitInfo {
  plaintiff: string;
  type: 'individual' | 'class_action' | 'regulatory';
  amount: number;
  status: 'potential' | 'filed' | 'settled' | 'dismissed' | 'judgment';
  description: string;
}

export interface RegulatoryAction {
  authority: string;
  type: 'investigation' | 'enforcement' | 'fine' | 'order';
  status: 'pending' | 'ongoing' | 'resolved';
  description: string;
}

export interface ComplianceViolation {
  regulation: ComplianceRegulation;
  article: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
}

export interface BreachNotification {
  id: string;
  type: 'supervisory_authority' | 'data_subject' | 'media' | 'partner' | 'customer';
  recipient: string;
  method: 'email' | 'letter' | 'phone' | 'website' | 'media' | 'app_notification';
  sentAt: Timestamp;
  acknowledgedAt?: Timestamp;
  content: string;
  language: string;
  mandatory: boolean;
  deadline: Timestamp;
  status: 'pending' | 'sent' | 'delivered' | 'acknowledged' | 'failed';
}

export interface RemediationPlan {
  immediateActions: RemediationAction[];
  shortTermActions: RemediationAction[];
  longTermActions: RemediationAction[];
  preventiveMeasures: PreventiveMeasure[];
  totalCost: number;
  timeline: number; // days
  responsible: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Timestamp;
}

export interface RemediationAction {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  dueDate: Timestamp;
  completedAt?: Timestamp;
  cost: number;
  effectiveness: number; // 0-100
}

export interface PreventiveMeasure {
  type: 'technical' | 'organizational' | 'procedural';
  description: string;
  implemented: boolean;
  cost: number;
  effectiveness: number; // 0-100
  timeline: number; // days to implement
}

export interface LessonsLearned {
  summary: string;
  improvements: Improvement[];
  policyChanges: PolicyChange[];
  trainingNeeds: TrainingNeed[];
  technologyChanges: TechnologyChange[];
  processChanges: ProcessChange[];
}

export interface Improvement {
  area: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  implementationDate: Timestamp;
  responsible: string;
  cost: number;
}

export interface PolicyChange {
  policy: string;
  change: string;
  reason: string;
  effectiveDate: Timestamp;
  approvedBy: string;
}

export interface TrainingNeed {
  audience: string;
  topic: string;
  frequency: string;
  method: string;
  cost: number;
}

export interface TechnologyChange {
  system: string;
  change: string;
  justification: string;
  cost: number;
  timeline: number; // days
}

export interface ProcessChange {
  process: string;
  change: string;
  impact: string;
  timeline: number; // days
}

export interface BreachDocument {
  id: string;
  type: 'incident_report' | 'evidence' | 'notification' | 'legal_document' | 'remediation_plan';
  name: string;
  url: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  confidential: boolean;
  retention: number; // days
}

export interface BreachCosts {
  investigation: number;
  containment: number;
  notification: number;
  remediation: number;
  legal: number;
  regulatory: number;
  businessImpact: number;
  total: number;
  currency: string;
}

export interface BreachCompliance {
  notifications: ComplianceNotification[];
  deadlines: ComplianceDeadline[];
  requirements: ComplianceRequirement[];
  violations: ComplianceViolation[];
}

export interface ComplianceNotification {
  regulation: ComplianceRegulation;
  authority: string;
  required: boolean;
  deadline: Timestamp;
  sent: boolean;
  sentAt?: Timestamp;
  acknowledgedAt?: Timestamp;
}

export interface ComplianceDeadline {
  regulation: ComplianceRegulation;
  requirement: string;
  deadline: Timestamp;
  met: boolean;
  evidence?: string;
}

export interface ComplianceRequirement {
  regulation: ComplianceRegulation;
  requirement: string;
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  evidence?: string;
  notes?: string;
}

// Hook Interfaces
export interface UsePrivacyResult {
  // Consent management
  getConsent: (userId: string, purpose: ProcessingPurpose) => Promise<ConsentRecord | null>;
  giveConsent: (userId: string, consent: Omit<ConsentRecord, 'id' | 'givenAt' | 'lastUpdated'>) => Promise<string>;
  withdrawConsent: (consentId: string, reason?: string) => Promise<void>;
  updateConsent: (consentId: string, updates: Partial<ConsentRecord>) => Promise<void>;
  
  // Data subject rights
  submitRequest: (request: Omit<DataSubjectRequest, 'id' | 'requestNumber' | 'submittedAt'>) => Promise<string>;
  getMyRequests: (userId: string) => Promise<DataSubjectRequest[]>;
  getRequestStatus: (requestId: string) => Promise<DataSubjectRequest | null>;
  
  // Data deletion & anonymization
  deleteUserData: (userId: string, categories?: DataCategory[]) => Promise<void>;
  anonymizeUserData: (userId: string, categories?: DataCategory[]) => Promise<void>;
  exportUserData: (userId: string, format?: string) => Promise<string>;
  
  // Compliance checks
  checkCompliance: (regulation: ComplianceRegulation) => Promise<ComplianceAssessment>;
  getDataInventory: () => Promise<DataInventoryItem[]>;
  
  // State
  loading: boolean;
  error: string | null;
}

export interface UsePrivacyAdminResult {
  // Request management
  getPendingRequests: () => Promise<DataSubjectRequest[]>;
  processRequest: (requestId: string, response: RequestResponse) => Promise<void>;
  verifyIdentity: (requestId: string, verification: VerificationData) => Promise<void>;
  
  // Consent management
  getAllConsents: (filters?: ConsentFilter) => Promise<ConsentRecord[]>;
  invalidateConsent: (consentId: string, reason: string) => Promise<void>;
  
  // Breach management
  reportBreach: (breach: Omit<DataBreach, 'id' | 'incidentNumber' | 'reportedAt'>) => Promise<string>;
  getBreaches: (status?: BreachStatus) => Promise<DataBreach[]>;
  updateBreach: (breachId: string, updates: Partial<DataBreach>) => Promise<void>;
  
  // Audit & monitoring
  getAuditLogs: (filters: AuditFilter) => Promise<AuditLogEntry[]>;
  createAuditEntry: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => Promise<string>;
  
  // Compliance reporting
  generateComplianceReport: (regulation: ComplianceRegulation, period: DateRange) => Promise<ComplianceReport>;
  scheduleDataDeletion: (criteria: DeletionCriteria) => Promise<void>;
  
  // State
  pendingRequests: DataSubjectRequest[];
  recentBreaches: DataBreach[];
  complianceScore: number;
  loading: boolean;
  error: string | null;
}

export interface ConsentFilter {
  userId?: string;
  status?: ConsentStatus;
  purpose?: ProcessingPurpose;
  dateRange?: DateRange;
  consentType?: ConsentType;
}

export interface AuditFilter {
  userId?: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  dateRange: DateRange;
  riskLevel?: string;
  result?: AuditResult;
}

export interface DateRange {
  start: Timestamp;
  end: Timestamp;
}

export interface ComplianceReport {
  regulation: ComplianceRegulation;
  period: DateRange;
  score: number;
  findings: ComplianceFinding[];
  recommendations: string[];
  nextAssessment: Timestamp;
}

export interface DeletionCriteria {
  categories: DataCategory[];
  olderThan: number; // days
  exceptions: string[];
  dryRun: boolean;
}

// Component Props
export interface ConsentBannerProps {
  purposes: ProcessingPurpose[];
  granular?: boolean;
  onConsent: (consent: ConsentRecord) => void;
  onReject: () => void;
  className?: string;
}

export interface PrivacyDashboardProps {
  userId: string;
  onExportData: () => void;
  onDeleteAccount: () => void;
  className?: string;
}

export interface DataSubjectRequestFormProps {
  requestType: DataSubjectRightType;
  onSubmit: (request: DataSubjectRequest) => void;
  className?: string;
}

export interface ComplianceReportProps {
  regulation: ComplianceRegulation;
  period: DateRange;
  onExport: (format: string) => void;
  className?: string;
}
