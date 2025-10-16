// Social Features Types for TourTrip.app
import { Timestamp } from 'firebase/firestore';

// User Profile & Social Identity
export interface SocialProfile {
  userId: string;
  displayName: string;
  username: string; // Unique handle @username
  avatar: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate: Timestamp;
  isVerified: boolean;
  isPrivate: boolean;
  socialLinks: SocialLinks;
  stats: ProfileStats;
  badges: UserBadge[];
  preferences: SocialPreferences;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
}

export interface ProfileStats {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  reviewsCount: number;
  likesReceived: number;
  toursCompleted: number;
  countriesVisited: number;
  citiesVisited: number;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Timestamp;
  category: BadgeCategory;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export enum BadgeCategory {
  EXPLORER = 'explorer',
  REVIEWER = 'reviewer',
  SOCIAL = 'social',
  LOYALTY = 'loyalty',
  ACHIEVEMENT = 'achievement',
  SEASONAL = 'seasonal'
}

export interface SocialPreferences {
  allowFollowers: boolean;
  showActivity: boolean;
  showLocation: boolean;
  allowMessages: boolean;
  allowTagging: boolean;
  notifyOnFollow: boolean;
  notifyOnLike: boolean;
  notifyOnComment: boolean;
  notifyOnMention: boolean;
}

// Following System
export interface FollowRelationship {
  id: string;
  followerId: string;
  followeeId: string;
  createdAt: Timestamp;
  status: FollowStatus;
  followerProfile: Pick<SocialProfile, 'displayName' | 'username' | 'avatar' | 'isVerified'>;
  followeeProfile: Pick<SocialProfile, 'displayName' | 'username' | 'avatar' | 'isVerified'>;
}

export enum FollowStatus {
  FOLLOWING = 'following',
  PENDING = 'pending', // For private accounts
  BLOCKED = 'blocked'
}

// Social Posts & Content
export interface SocialPost {
  id: string;
  authorId: string;
  author: Pick<SocialProfile, 'displayName' | 'username' | 'avatar' | 'isVerified'>;
  type: PostType;
  content: PostContent;
  media: MediaItem[];
  location?: LocationTag;
  tags: string[];
  mentions: UserMention[];
  visibility: PostVisibility;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stats: PostStats;
  interactions: PostInteraction[];
}

export enum PostType {
  TEXT = 'text',
  PHOTO = 'photo',
  VIDEO = 'video',
  STORY = 'story',
  REVIEW = 'review',
  CHECK_IN = 'check_in',
  TOUR_SHARE = 'tour_share',
  ACHIEVEMENT = 'achievement'
}

export interface PostContent {
  text?: string;
  title?: string;
  description?: string;
  relatedEntityId?: string; // Tour, restaurant, etc.
  relatedEntityType?: 'tour' | 'restaurant' | 'shop' | 'location';
  rating?: number; // For reviews
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  order: number;
  metadata?: MediaMetadata;
}

export interface MediaMetadata {
  width: number;
  height: number;
  duration?: number; // For videos
  size: number;
  format: string;
  location?: LocationTag;
  takenAt?: Timestamp;
}

export interface LocationTag {
  id: string;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  type: 'city' | 'country' | 'landmark' | 'business';
}

export interface UserMention {
  userId: string;
  username: string;
  displayName: string;
  startIndex: number;
  endIndex: number;
}

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  FRIENDS = 'friends',
  PRIVATE = 'private'
}

export interface PostStats {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  savesCount: number;
}

export interface PostInteraction {
  id: string;
  userId: string;
  postId: string;
  type: InteractionType;
  createdAt: Timestamp;
  user: Pick<SocialProfile, 'displayName' | 'username' | 'avatar'>;
}

export enum InteractionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry',
  SAVE = 'save',
  SHARE = 'share',
  REPORT = 'report'
}

// Comments System
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: Pick<SocialProfile, 'displayName' | 'username' | 'avatar' | 'isVerified'>;
  content: string;
  parentId?: string; // For replies
  mentions: UserMention[];
  media?: MediaItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stats: CommentStats;
  isEdited: boolean;
  isDeleted: boolean;
}

export interface CommentStats {
  likesCount: number;
  repliesCount: number;
}

// Stories System
export interface Story {
  id: string;
  authorId: string;
  author: Pick<SocialProfile, 'displayName' | 'username' | 'avatar' | 'isVerified'>;
  media: MediaItem;
  content?: {
    text?: string;
    stickers?: StorySticker[];
    music?: StoryMusic;
  };
  location?: LocationTag;
  visibility: PostVisibility;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  stats: StoryStats;
  viewers: StoryViewer[];
}

export interface StorySticker {
  id: string;
  type: 'emoji' | 'gif' | 'poll' | 'question' | 'music' | 'location' | 'mention';
  content: any;
  position: { x: number; y: number };
  rotation: number;
  scale: number;
}

export interface StoryMusic {
  id: string;
  title: string;
  artist: string;
  preview: string;
  startTime: number;
  duration: number;
}

export interface StoryStats {
  viewsCount: number;
  reactionsCount: number;
  repliesCount: number;
}

export interface StoryViewer {
  userId: string;
  user: Pick<SocialProfile, 'displayName' | 'username' | 'avatar'>;
  viewedAt: Timestamp;
  reaction?: InteractionType;
}

// Social Feed
export interface FeedItem {
  id: string;
  type: FeedItemType;
  content: SocialPost | Story | FeedActivity;
  priority: number;
  relevanceScore: number;
  createdAt: Timestamp;
  seen: boolean;
  dismissed: boolean;
}

export enum FeedItemType {
  POST = 'post',
  STORY = 'story',
  ACTIVITY = 'activity',
  SUGGESTION = 'suggestion',
  AD = 'ad'
}

export interface FeedActivity {
  id: string;
  type: ActivityType;
  actorId: string;
  actor: Pick<SocialProfile, 'displayName' | 'username' | 'avatar'>;
  targetId: string;
  targetType: 'post' | 'user' | 'tour' | 'review';
  target?: any;
  createdAt: Timestamp;
  aggregated?: boolean;
  relatedUsers?: Pick<SocialProfile, 'displayName' | 'username' | 'avatar'>[];
}

export enum ActivityType {
  FOLLOWED_USER = 'followed_user',
  LIKED_POST = 'liked_post',
  COMMENTED_POST = 'commented_post',
  SHARED_POST = 'shared_post',
  COMPLETED_TOUR = 'completed_tour',
  WROTE_REVIEW = 'wrote_review',
  EARNED_BADGE = 'earned_badge',
  JOINED_PLATFORM = 'joined_platform'
}

// Messaging System
export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender: Pick<SocialProfile, 'displayName' | 'username' | 'avatar'>;
  type: MessageType;
  content: MessageContent;
  media?: MediaItem[];
  replyTo?: string;
  createdAt: Timestamp;
  readAt?: Timestamp;
  delivered: boolean;
  edited: boolean;
  deleted: boolean;
}

export enum MessageType {
  TEXT = 'text',
  PHOTO = 'photo',
  VIDEO = 'video',
  AUDIO = 'audio',
  LOCATION = 'location',
  TOUR_SHARE = 'tour_share',
  STICKER = 'sticker',
  GIF = 'gif'
}

export interface MessageContent {
  text?: string;
  location?: LocationTag;
  tourId?: string;
  stickerId?: string;
  gifUrl?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantProfiles: Pick<SocialProfile, 'displayName' | 'username' | 'avatar'>[];
  type: ConversationType;
  name?: string;
  avatar?: string;
  lastMessage?: DirectMessage;
  unreadCount: { [userId: string]: number };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: ConversationSettings;
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group'
}

export interface ConversationSettings {
  muted: boolean;
  archived: boolean;
  pinned: boolean;
  notifications: boolean;
  disappearingMessages: boolean;
  disappearingDuration?: number; // seconds
}

// Notifications System
export interface SocialNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  actorId?: string;
  actor?: Pick<SocialProfile, 'displayName' | 'username' | 'avatar'>;
  createdAt: Timestamp;
  read: boolean;
  clicked: boolean;
  delivered: boolean;
}

export enum NotificationType {
  FOLLOW_REQUEST = 'follow_request',
  NEW_FOLLOWER = 'new_follower',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  COMMENT_REPLY = 'comment_reply',
  POST_SHARE = 'post_share',
  MENTION = 'mention',
  DIRECT_MESSAGE = 'direct_message',
  STORY_VIEW = 'story_view',
  BADGE_EARNED = 'badge_earned',
  TOUR_INVITATION = 'tour_invitation'
}

export interface NotificationData {
  postId?: string;
  commentId?: string;
  conversationId?: string;
  messageId?: string;
  storyId?: string;
  badgeId?: string;
  tourId?: string;
  deepLink?: string;
  actionUrl?: string;
}

// Social Features Configuration
export interface SocialConfig {
  enabledFeatures: SocialFeature[];
  contentModeration: ModerationConfig;
  privacySettings: PrivacyConfig;
  reportingSystem: ReportingConfig;
}

export enum SocialFeature {
  PROFILES = 'profiles',
  FOLLOWING = 'following',
  POSTS = 'posts',
  STORIES = 'stories',
  COMMENTS = 'comments',
  DIRECT_MESSAGES = 'direct_messages',
  NOTIFICATIONS = 'notifications',
  LIVE_CHAT = 'live_chat',
  GROUPS = 'groups',
  EVENTS = 'events'
}

export interface ModerationConfig {
  autoModeration: boolean;
  profanityFilter: boolean;
  spamDetection: boolean;
  imageModeration: boolean;
  communityGuidelines: string[];
  reportThreshold: number;
  reviewQueue: boolean;
}

export interface PrivacyConfig {
  defaultVisibility: PostVisibility;
  allowSearchIndexing: boolean;
  dataRetentionDays: number;
  minAge: number;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
}

export interface ReportingConfig {
  categories: ReportCategory[];
  anonymousReporting: boolean;
  autoAction: boolean;
  reviewProcess: boolean;
  appealProcess: boolean;
}

export interface ReportCategory {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoAction?: 'none' | 'hide' | 'remove' | 'suspend';
}

// Content Reports
export interface ContentReport {
  id: string;
  reporterId: string;
  reporter?: Pick<SocialProfile, 'displayName' | 'username'>;
  targetType: 'post' | 'comment' | 'user' | 'message';
  targetId: string;
  target?: any;
  category: string;
  reason: string;
  description?: string;
  evidence?: MediaItem[];
  status: ReportStatus;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewerId?: string;
  resolution?: string;
  actions?: ContentAction[];
}

export enum ReportStatus {
  PENDING = 'pending',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
  ESCALATED = 'escalated'
}

export interface ContentAction {
  type: 'hide' | 'remove' | 'warn' | 'suspend' | 'ban';
  duration?: number; // minutes
  reason: string;
  executedAt: Timestamp;
  executedBy: string;
}

// Hook interfaces
export interface UseSocialResult {
  // Profile management
  profile: SocialProfile | null;
  updateProfile: (updates: Partial<SocialProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  
  // Following system
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  getFollowers: (userId: string) => Promise<SocialProfile[]>;
  getFollowing: (userId: string) => Promise<SocialProfile[]>;
  isFollowing: (userId: string) => boolean;
  
  // Posts
  createPost: (post: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePost: (postId: string, updates: Partial<SocialPost>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  sharePost: (postId: string, content?: string) => Promise<void>;
  reportPost: (postId: string, reason: string) => Promise<void>;
}

export interface UseFeedResult {
  // Feed management
  feed: FeedItem[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  
  // Actions
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsSeen: (itemId: string) => void;
  dismissItem: (itemId: string) => void;
  
  // Filters
  setFilter: (filter: FeedFilter) => void;
  clearFilter: () => void;
}

export interface FeedFilter {
  type?: FeedItemType[];
  dateRange?: { start: Date; end: Date };
  location?: string;
  following?: boolean;
  hashtags?: string[];
}

export interface UseMessagingResult {
  // Conversations
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: DirectMessage[];
  
  // Actions
  sendMessage: (conversationId: string, content: MessageContent, type: MessageType) => Promise<void>;
  createConversation: (participantIds: string[]) => Promise<string>;
  markAsRead: (conversationId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  
  // Real-time
  subscribeToConversation: (conversationId: string) => void;
  unsubscribeFromConversation: (conversationId: string) => void;
}

export interface UseNotificationsResult {
  // Notifications
  notifications: SocialNotification[];
  unreadCount: number;
  loading: boolean;
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  
  // Settings
  updateSettings: (settings: NotificationSettings) => Promise<void>;
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  inApp: boolean;
  categories: { [key in NotificationType]: boolean };
}

// Component Props
export interface SocialProfileProps {
  userId: string;
  editable?: boolean;
  compact?: boolean;
  showStats?: boolean;
  showBadges?: boolean;
  onFollow?: () => void;
  onMessage?: () => void;
  className?: string;
}

export interface PostCardProps {
  post: SocialPost;
  showActions?: boolean;
  showComments?: boolean;
  showShareOptions?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  className?: string;
}

export interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

export interface CommentThreadProps {
  postId: string;
  comments: Comment[];
  showReplies?: boolean;
  maxDepth?: number;
  onComment?: (content: string, parentId?: string) => void;
  onLike?: (commentId: string) => void;
  onReport?: (commentId: string) => void;
  className?: string;
}

export interface MessageBubbleProps {
  message: DirectMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReply?: () => void;
  onReact?: (reaction: InteractionType) => void;
  className?: string;
}

// Social Analytics
export interface SocialAnalytics {
  profileViews: number;
  postReach: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  followerGrowth: { date: string; count: number }[];
  topPosts: { postId: string; engagement: number }[];
  demographics: {
    ageGroups: { range: string; percentage: number }[];
    locations: { city: string; percentage: number }[];
    interests: { category: string; percentage: number }[];
  };
}
