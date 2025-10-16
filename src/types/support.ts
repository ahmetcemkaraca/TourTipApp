// Support System Types for TourTrip.app
import { Timestamp } from 'firebase/firestore';

// Support Ticket System
export interface SupportTicket {
  id: string;
  ticketNumber: string; // Human-readable ticket number (e.g., "TT-2024-001234")
  userId?: string;
  userInfo: TicketUserInfo;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  source: TicketSource;
  assignedTo?: string;
  assigneeInfo?: SupportAgent;
  tags: string[];
  attachments: TicketAttachment[];
  messages: TicketMessage[];
  metadata: TicketMetadata;
  resolution?: TicketResolution;
  satisfaction?: CustomerSatisfaction;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
  closedAt?: Timestamp;
  firstResponseAt?: Timestamp;
  escalatedAt?: Timestamp;
}

export interface TicketUserInfo {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  language: string;
  timezone: string;
  isRegistered: boolean;
  loyaltyTier?: string;
  totalBookings?: number;
  lastBookingDate?: Timestamp;
}

export enum TicketCategory {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  TOUR_ISSUE = 'tour_issue',
  TECHNICAL = 'technical',
  ACCOUNT = 'account',
  REFUND = 'refund',
  CANCELLATION = 'cancellation',
  FEEDBACK = 'feedback',
  COMPLAINT = 'complaint',
  SUGGESTION = 'suggestion',
  PARTNERSHIP = 'partnership',
  ACCESSIBILITY = 'accessibility',
  BILLING = 'billing',
  OTHER = 'other'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum TicketStatus {
  NEW = 'new',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_CUSTOMER = 'pending_customer',
  PENDING_INTERNAL = 'pending_internal',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

export enum TicketSource {
  WEB = 'web',
  MOBILE = 'mobile',
  EMAIL = 'email',
  PHONE = 'phone',
  CHAT = 'chat',
  SOCIAL = 'social',
  API = 'api'
}

export interface TicketAttachment {
  id: string;
  filename: string;
  url: string;
  type: string; // MIME type
  size: number;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  author: MessageAuthor;
  content: string;
  type: MessageType;
  attachments: TicketAttachment[];
  isInternal: boolean;
  isAutomatic: boolean;
  createdAt: Timestamp;
  editedAt?: Timestamp;
  seenBy: MessageSeen[];
}

export interface MessageAuthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'customer' | 'agent' | 'admin' | 'system';
}

export enum MessageType {
  MESSAGE = 'message',
  NOTE = 'note',
  STATUS_CHANGE = 'status_change',
  ASSIGNMENT = 'assignment',
  ESCALATION = 'escalation',
  RESOLUTION = 'resolution',
  SYSTEM = 'system'
}

export interface MessageSeen {
  userId: string;
  seenAt: Timestamp;
}

export interface TicketMetadata {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
  browserInfo?: BrowserInfo;
  relatedBookingId?: string;
  relatedOrderId?: string;
  relatedTourId?: string;
  customFields?: { [key: string]: any };
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  osVersion: string;
  screenResolution: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  language: string;
  cookiesEnabled: boolean;
  javascriptEnabled: boolean;
}

export interface TicketResolution {
  summary: string;
  details: string;
  resolvedBy: string;
  resolutionType: ResolutionType;
  actionsTaken: string[];
  followUpRequired: boolean;
  followUpDate?: Timestamp;
  internalNotes?: string;
}

export enum ResolutionType {
  RESOLVED = 'resolved',
  WORKAROUND = 'workaround',
  NO_RESOLUTION = 'no_resolution',
  DUPLICATE = 'duplicate',
  INVALID = 'invalid',
  WONT_FIX = 'wont_fix'
}

export interface CustomerSatisfaction {
  rating: number; // 1-5 scale
  feedback?: string;
  submittedAt: Timestamp;
  followUpRequested: boolean;
}

// Support Agents & Teams
export interface SupportAgent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: AgentRole;
  department: string;
  skills: AgentSkill[];
  languages: string[];
  availability: AgentAvailability;
  workSchedule: WorkSchedule;
  stats: AgentStats;
  isActive: boolean;
  lastActiveAt: Timestamp;
  createdAt: Timestamp;
}

export enum AgentRole {
  AGENT = 'agent',
  SENIOR_AGENT = 'senior_agent',
  SUPERVISOR = 'supervisor',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

export interface AgentSkill {
  category: TicketCategory;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  certified: boolean;
}

export interface AgentAvailability {
  status: 'online' | 'away' | 'busy' | 'offline';
  currentCapacity: number;
  maxCapacity: number;
  autoAssign: boolean;
  statusMessage?: string;
}

export interface WorkSchedule {
  timezone: string;
  workDays: number[]; // 0=Sunday, 6=Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  breaks: BreakPeriod[];
}

export interface BreakPeriod {
  startTime: string;
  endTime: string;
  type: 'lunch' | 'break' | 'meeting';
}

export interface AgentStats {
  totalTickets: number;
  resolvedTickets: number;
  averageResponseTime: number; // minutes
  averageResolutionTime: number; // minutes
  customerSatisfactionScore: number;
  activeTickets: number;
  monthlyStats: MonthlyAgentStats[];
}

export interface MonthlyAgentStats {
  month: string; // YYYY-MM
  ticketsHandled: number;
  ticketsResolved: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
}

// FAQ & Knowledge Base
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  tags: string[];
  language: string;
  isPublic: boolean;
  isPopular: boolean;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedArticles: string[];
  lastUpdated: Timestamp;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum FAQCategory {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  TOURS = 'tours',
  ACCOUNT = 'account',
  MOBILE_APP = 'mobile_app',
  CANCELLATION = 'cancellation',
  REFUNDS = 'refunds',
  TECHNICAL = 'technical',
  POLICIES = 'policies',
  ACCESSIBILITY = 'accessibility',
  GENERAL = 'general'
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: FAQCategory;
  subcategory?: string;
  tags: string[];
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // minutes
  isPublic: boolean;
  isDraft: boolean;
  viewCount: number;
  rating: number;
  ratingCount: number;
  attachments: KnowledgeBaseAttachment[];
  relatedTickets: string[];
  lastReviewed: Timestamp;
  version: number;
  publishedAt?: Timestamp;
  createdBy: string;
  updatedBy: string;
  reviewedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface KnowledgeBaseAttachment {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'audio';
  size: number;
  description?: string;
}

// Live Chat System
export interface ChatSession {
  id: string;
  userId?: string;
  userInfo: ChatUserInfo;
  agentId?: string;
  agentInfo?: SupportAgent;
  status: ChatStatus;
  queue?: string;
  priority: number;
  waitTime: number; // seconds
  messages: ChatMessage[];
  tags: string[];
  metadata: ChatMetadata;
  transferHistory: ChatTransfer[];
  satisfaction?: ChatSatisfaction;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  lastMessageAt?: Timestamp;
  firstResponseAt?: Timestamp;
}

export interface ChatUserInfo {
  id?: string;
  name?: string;
  email?: string;
  isAuthenticated: boolean;
  language: string;
  timezone: string;
  page: string; // Current page URL
  referrer?: string;
}

export enum ChatStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  TRANSFERRED = 'transferred',
  ENDED = 'ended',
  ABANDONED = 'abandoned'
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  author: MessageAuthor;
  content: string;
  type: ChatMessageType;
  attachments: TicketAttachment[];
  isRead: boolean;
  sentAt: Timestamp;
  deliveredAt?: Timestamp;
  readAt?: Timestamp;
}

export enum ChatMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  LINK = 'link',
  SYSTEM = 'system',
  BOT = 'bot',
  QUICK_REPLY = 'quick_reply',
  TYPING = 'typing'
}

export interface ChatMetadata {
  source: 'widget' | 'mobile' | 'api';
  initialQuestion?: string;
  suggestedArticles?: string[];
  botInteractions?: BotInteraction[];
  escalatedFrom?: 'bot' | 'tier1';
  customerJourney?: JourneyStep[];
}

export interface BotInteraction {
  intent: string;
  confidence: number;
  response: string;
  timestamp: Timestamp;
  helpful?: boolean;
}

export interface JourneyStep {
  page: string;
  timestamp: Timestamp;
  action?: string;
}

export interface ChatTransfer {
  fromAgentId?: string;
  toAgentId: string;
  reason: string;
  timestamp: Timestamp;
  acceptedAt?: Timestamp;
}

export interface ChatSatisfaction {
  rating: number; // 1-5 scale
  feedback?: string;
  submittedAt: Timestamp;
}

// Support Metrics & Analytics
export interface SupportMetrics {
  period: MetricsPeriod;
  tickets: TicketMetrics;
  chat: ChatMetrics;
  agents: AgentMetrics;
  satisfaction: SatisfactionMetrics;
  knowledge: KnowledgeMetrics;
}

export interface MetricsPeriod {
  start: Timestamp;
  end: Timestamp;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface TicketMetrics {
  total: number;
  new: number;
  resolved: number;
  closed: number;
  escalated: number;
  byCategory: CategoryMetrics[];
  byPriority: PriorityMetrics[];
  bySource: SourceMetrics[];
  averageResponseTime: number; // minutes
  averageResolutionTime: number; // minutes
  firstContactResolution: number; // percentage
  backlog: number;
  slaCompliance: number; // percentage
}

export interface CategoryMetrics {
  category: TicketCategory;
  count: number;
  percentage: number;
  avgResolutionTime: number;
}

export interface PriorityMetrics {
  priority: TicketPriority;
  count: number;
  percentage: number;
  avgResolutionTime: number;
}

export interface SourceMetrics {
  source: TicketSource;
  count: number;
  percentage: number;
}

export interface ChatMetrics {
  totalSessions: number;
  activeSessions: number;
  queuedSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  averageWaitTime: number; // seconds
  averageChatDuration: number; // minutes
  transferRate: number; // percentage
  botResolutionRate: number; // percentage
}

export interface AgentMetrics {
  totalAgents: number;
  onlineAgents: number;
  averageUtilization: number; // percentage
  topPerformers: AgentPerformance[];
  averageResponseTime: number;
  averageHandleTime: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  ticketsHandled: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  utilizationRate: number;
}

export interface SatisfactionMetrics {
  averageRating: number;
  responseCount: number;
  distribution: RatingDistribution[];
  comments: SatisfactionComment[];
  npsScore?: number; // Net Promoter Score
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

export interface SatisfactionComment {
  rating: number;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: Timestamp;
}

export interface KnowledgeMetrics {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  averageRating: number;
  topArticles: PopularArticle[];
  searchQueries: SearchQuery[];
}

export interface PopularArticle {
  id: string;
  title: string;
  views: number;
  rating: number;
  helpfulPercentage: number;
}

export interface SearchQuery {
  query: string;
  count: number;
  results: number;
  clickThroughRate: number;
}

// Escalation Rules & SLA
export interface EscalationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  order: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EscalationCondition {
  type: 'time' | 'priority' | 'category' | 'customer_tier' | 'agent_skill';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface EscalationAction {
  type: 'assign' | 'notify' | 'change_priority' | 'add_tag' | 'send_email';
  parameters: { [key: string]: any };
}

export interface SLAPolicy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  applicableCategories: TicketCategory[];
  applicablePriorities: TicketPriority[];
  targets: SLATarget[];
  businessHours: BusinessHours;
  escalationRules: string[]; // EscalationRule IDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SLATarget {
  metric: 'first_response' | 'resolution' | 'escalation';
  target: number; // in minutes
  warningThreshold: number; // percentage (e.g., 80%)
}

export interface BusinessHours {
  timezone: string;
  workDays: number[]; // 0=Sunday, 6=Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  holidays: Holiday[];
}

export interface Holiday {
  name: string;
  date: string; // YYYY-MM-DD
  isRecurring: boolean;
}

// Automation & Workflows
export interface SupportWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  executionCount: number;
  lastExecuted?: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkflowTrigger {
  type: 'ticket_created' | 'ticket_updated' | 'message_received' | 'scheduled' | 'manual';
  parameters: { [key: string]: any };
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'send_email' | 'assign_agent' | 'change_status' | 'add_tag' | 'create_task' | 'webhook';
  parameters: { [key: string]: any };
  delay?: number; // minutes
}

// Hook Interfaces
export interface UseSupportResult {
  // Ticket management
  createTicket: (ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTicket: (ticketId: string, updates: Partial<SupportTicket>) => Promise<void>;
  getTicket: (ticketId: string) => Promise<SupportTicket | null>;
  getMyTickets: () => Promise<SupportTicket[]>;
  addMessage: (ticketId: string, content: string, attachments?: File[]) => Promise<void>;
  
  // FAQ & Knowledge Base
  searchFAQ: (query: string, category?: FAQCategory) => Promise<FAQItem[]>;
  getFAQByCategory: (category: FAQCategory) => Promise<FAQItem[]>;
  markFAQHelpful: (faqId: string, helpful: boolean) => Promise<void>;
  
  // Chat support
  startChatSession: (initialMessage?: string) => Promise<string>;
  sendChatMessage: (sessionId: string, message: string) => Promise<void>;
  endChatSession: (sessionId: string) => Promise<void>;
  
  // State
  tickets: SupportTicket[];
  activeTicket: SupportTicket | null;
  chatSession: ChatSession | null;
  loading: boolean;
  error: string | null;
}

export interface UseSupportAdminResult {
  // Agent management
  getTicketQueue: (agentId?: string) => Promise<SupportTicket[]>;
  assignTicket: (ticketId: string, agentId: string) => Promise<void>;
  escalateTicket: (ticketId: string, reason: string) => Promise<void>;
  resolveTicket: (ticketId: string, resolution: TicketResolution) => Promise<void>;
  
  // Chat management
  acceptChat: (sessionId: string) => Promise<void>;
  transferChat: (sessionId: string, toAgentId: string, reason: string) => Promise<void>;
  
  // Analytics
  getMetrics: (period: MetricsPeriod) => Promise<SupportMetrics>;
  getAgentStats: (agentId: string, period: MetricsPeriod) => Promise<AgentStats>;
  
  // Knowledge base management
  createArticle: (article: Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateArticle: (articleId: string, updates: Partial<KnowledgeBaseArticle>) => Promise<void>;
  
  // State
  agentQueue: SupportTicket[];
  activeChatSessions: ChatSession[];
  metrics: SupportMetrics | null;
  loading: boolean;
  error: string | null;
}

// Component Props
export interface SupportTicketFormProps {
  onSubmit: (ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => void;
  initialCategory?: TicketCategory;
  userInfo?: TicketUserInfo;
  className?: string;
}

export interface TicketListProps {
  tickets: SupportTicket[];
  onTicketSelect: (ticket: SupportTicket) => void;
  showFilters?: boolean;
  showSearch?: boolean;
  className?: string;
}

export interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'light' | 'dark';
  minimized?: boolean;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionId: string) => void;
  className?: string;
}

export interface FAQSearchProps {
  onQuestionSelect: (faq: FAQItem) => void;
  category?: FAQCategory;
  placeholder?: string;
  maxResults?: number;
  showCategories?: boolean;
  className?: string;
}

export interface SupportMetricsDashboardProps {
  period?: MetricsPeriod;
  agentId?: string; // for agent-specific metrics
  realTime?: boolean;
  className?: string;
}
