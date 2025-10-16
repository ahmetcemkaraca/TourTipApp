'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SocialProfile,
  SocialPost,
  PostContent,
  PostType,
  PostVisibility,
  MediaItem,
  FeedItem,
  Comment,
  SocialNotification,
  DirectMessage,
  Conversation,
  MessageType,
  MessageContent,
  UseSocialResult,
  UseFeedResult,
  UseMessagingResult,
  UseNotificationsResult,
  FeedFilter,
  NotificationSettings,
  InteractionType
} from '@/types/social';
import SocialService from '@/lib/social-service';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { analyticsService } from '@/lib/analytics-service';

export function useSocial(): UseSocialResult {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  // Load user profile
  useEffect(() => {
    if (user?.uid) {
      loadProfile(user.uid);
    }
  }, [user?.uid]);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const userProfile = await SocialService.getProfile(userId);
      setProfile(userProfile);
      
      if (userProfile) {
        // Load following list to track who user is following
        const followingUsers = await SocialService.getFollowing(userId);
        setFollowing(new Set(followingUsers.map(u => u.userId)));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Profil yüklenirken hata oluştu');
    }
  }, [toast]);

  const updateProfile = useCallback(async (updates: Partial<SocialProfile>) => {
    if (!user?.uid) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    try {
      await SocialService.updateProfile(user.uid, updates);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profil güncellendi');
      
      analyticsService.logEvent({
        name: 'profile_updated',
        params: {
          user_id: user.uid,
          fields_updated: Object.keys(updates),
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Profil güncellenirken hata oluştu');
    }
  }, [user?.uid, toast]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const avatarUrl = await SocialService.uploadAvatar(user.uid, file);
      setProfile(prev => prev ? { ...prev, avatar: avatarUrl } : null);
      toast.success('Profil fotoğrafı güncellendi');
      return avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Profil fotoğrafı yüklenirken hata oluştu');
      throw error;
    }
  }, [user?.uid, toast]);

  const followUser = useCallback(async (userId: string) => {
    if (!user?.uid) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    try {
      await SocialService.followUser(user.uid, userId);
      setFollowing(prev => new Set([...prev, userId]));
      toast.success('Kullanıcı takip edildi');
      
      analyticsService.logEvent({
        name: 'user_followed',
        params: {
          follower_id: user.uid,
          followee_id: userId,
        },
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Takip edilirken hata oluştu');
    }
  }, [user?.uid, toast]);

  const unfollowUser = useCallback(async (userId: string) => {
    if (!user?.uid) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    try {
      await SocialService.unfollowUser(user.uid, userId);
      setFollowing(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      toast.success('Takip bırakıldı');
      
      analyticsService.logEvent({
        name: 'user_unfollowed',
        params: {
          follower_id: user.uid,
          followee_id: userId,
        },
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Takip bırakılırken hata oluştu');
    }
  }, [user?.uid, toast]);

  const getFollowers = useCallback(async (userId: string): Promise<SocialProfile[]> => {
    try {
      return await SocialService.getFollowers(userId);
    } catch (error) {
      console.error('Error getting followers:', error);
      toast.error('Takipçiler yüklenirken hata oluştu');
      return [];
    }
  }, [toast]);

  const getFollowing = useCallback(async (userId: string): Promise<SocialProfile[]> => {
    try {
      return await SocialService.getFollowing(userId);
    } catch (error) {
      console.error('Error getting following:', error);
      toast.error('Takip edilenler yüklenirken hata oluştu');
      return [];
    }
  }, [toast]);

  const isFollowing = useCallback((userId: string): boolean => {
    return following.has(userId);
  }, [following]);

  const createPost = useCallback(async (postData: {
    type: PostType;
    content: PostContent;
    media?: MediaItem[];
    visibility?: PostVisibility;
    tags?: string[];
  }): Promise<string> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const postId = await SocialService.createPost(user.uid, postData);
      toast.success('Gönderi paylaşıldı');
      
      analyticsService.logEvent({
        name: 'post_created',
        params: {
          post_id: postId,
          post_type: postData.type,
          has_media: (postData.media?.length || 0) > 0,
          tag_count: postData.tags?.length || 0,
        },
      });
      
      return postId;
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Gönderi paylaşılırken hata oluştu');
      throw error;
    }
  }, [user?.uid, toast]);

  const updatePost = useCallback(async (postId: string, updates: Partial<SocialPost>) => {
    if (!user?.uid) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    try {
      await SocialService.updatePost(postId, updates);
      toast.success('Gönderi güncellendi');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Gönderi güncellenirken hata oluştu');
    }
  }, [user?.uid, toast]);

  const deletePost = useCallback(async (postId: string) => {
    if (!user?.uid) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    try {
      await SocialService.deletePost(postId);
      toast.success('Gönderi silindi');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Gönderi silinirken hata oluştu');
    }
  }, [user?.uid, toast]);

  const likePost = useCallback(async (postId: string) => {
    if (!user?.uid) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    try {
      await SocialService.likePost(user.uid, postId);
      
      analyticsService.logEvent({
        name: 'post_liked',
        params: {
          post_id: postId,
          user_id: user.uid,
        },
      });
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Beğeni eklenirken hata oluştu');
    }
  }, [user?.uid, toast]);

  const unlikePost = useCallback(async (postId: string) => {
    if (!user?.uid) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    try {
      await SocialService.likePost(user.uid, postId); // Same method handles unlike
    } catch (error) {
      console.error('Error unliking post:', error);
      toast.error('Beğeni kaldırılırken hata oluştu');
    }
  }, [user?.uid, toast]);

  const sharePost = useCallback(async (postId: string, content?: string) => {
    if (!user?.uid) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    try {
      // Create a new post that shares the original
      await SocialService.createPost(user.uid, {
        type: PostType.TOUR_SHARE,
        content: {
          text: content || '',
          relatedEntityId: postId,
          relatedEntityType: 'tour',
        },
        media: [],
        visibility: PostVisibility.PUBLIC,
        tags: [],
        mentions: [],
      });
      
      toast.success('Gönderi paylaşıldı');
      
      analyticsService.logEvent({
        name: 'post_shared',
        params: {
          original_post_id: postId,
          user_id: user.uid,
        },
      });
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Gönderi paylaşılırken hata oluştu');
    }
  }, [user?.uid, toast]);

  const reportPost = useCallback(async (postId: string, reason: string) => {
    if (!user?.uid) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    try {
      await SocialService.reportContent(user.uid, 'post', postId, 'inappropriate', reason);
      toast.success('Gönderi rapor edildi');
      
      analyticsService.logEvent({
        name: 'post_reported',
        params: {
          post_id: postId,
          reporter_id: user.uid,
          reason,
        },
      });
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error('Gönderi rapor edilirken hata oluştu');
    }
  }, [user?.uid, toast]);

  return {
    profile,
    updateProfile,
    uploadAvatar,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    isFollowing,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    sharePost,
    reportPost,
  };
}

export function useFeed(): UseFeedResult {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter | null>(null);
  
  const lastVisibleRef = useRef<any>(null);

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (!user?.uid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const lastVisible = isRefresh ? null : lastVisibleRef.current;
      const feedItems = await SocialService.getFeed(user.uid, 20, lastVisible);
      
      if (isRefresh) {
        setFeed(feedItems);
      } else {
        setFeed(prev => [...prev, ...feedItems]);
      }
      
      setHasMore(feedItems.length === 20);
      
      if (feedItems.length > 0) {
        lastVisibleRef.current = feedItems[feedItems.length - 1];
      }
      
      analyticsService.logEvent({
        name: 'feed_loaded',
        params: {
          user_id: user.uid,
          items_count: feedItems.length,
          is_refresh: isRefresh,
        },
      });
    } catch (error) {
      console.error('Error loading feed:', error);
      setError('Feed yüklenirken hata oluştu');
      toast.error('Feed yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, loading, toast]);

  const loadMore = useCallback(async () => {
    await loadFeed(false);
  }, [loadFeed]);

  const refresh = useCallback(async () => {
    lastVisibleRef.current = null;
    await loadFeed(true);
  }, [loadFeed]);

  const markAsSeen = useCallback((itemId: string) => {
    setFeed(prev => prev.map(item => 
      item.id === itemId ? { ...item, seen: true } : item
    ));
  }, []);

  const dismissItem = useCallback((itemId: string) => {
    setFeed(prev => prev.map(item => 
      item.id === itemId ? { ...item, dismissed: true } : item
    ));
  }, []);

  const setFeedFilter = useCallback((newFilter: FeedFilter) => {
    setFilter(newFilter);
    // Trigger feed reload with filter
    lastVisibleRef.current = null;
    loadFeed(true);
  }, [loadFeed]);

  const clearFilter = useCallback(() => {
    setFilter(null);
    lastVisibleRef.current = null;
    loadFeed(true);
  }, [loadFeed]);

  // Initial load
  useEffect(() => {
    if (user?.uid) {
      loadFeed(true);
    }
  }, [user?.uid, loadFeed]);

  return {
    feed: feed.filter(item => !item.dismissed),
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
    markAsSeen,
    dismissItem,
    setFilter: setFeedFilter,
    clearFilter,
  };
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [loading, setLoading] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = SocialService.subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, [user?.uid]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await SocialService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Bildirim okundu olarak işaretlenirken hata oluştu');
    }
  }, [toast]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;

    try {
      await SocialService.markAllNotificationsAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('Tüm bildirimler okundu olarak işaretlendi');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Bildirimler işaretlenirken hata oluştu');
    }
  }, [user?.uid, toast]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await SocialService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Bildirim silindi');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Bildirim silinirken hata oluştu');
    }
  }, [toast]);

  const clearAll = useCallback(async () => {
    if (!user?.uid) return;

    try {
      await SocialService.clearAllNotifications(user.uid);
      setNotifications([]);
      toast.success('Tüm bildirimler temizlendi');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      toast.error('Bildirimler temizlenirken hata oluştu');
    }
  }, [user?.uid, toast]);

  const updateSettings = useCallback(async (settings: NotificationSettings) => {
    if (!user?.uid) return;

    try {
      await SocialService.updateNotificationSettings(user.uid, settings);
      toast.success('Bildirim ayarları güncellendi');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Bildirim ayarları güncellenirken hata oluştu');
    }
  }, [user?.uid, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updateSettings,
  };
}

// Hook for real-time messaging
export function useMessaging(): UseMessagingResult {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);

  const sendMessage = useCallback(async (
    conversationId: string, 
    content: MessageContent, 
    type: MessageType
  ) => {
    if (!user?.uid) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    try {
      await SocialService.sendMessage(user.uid, conversationId, content, type);
      
      analyticsService.logEvent({
        name: 'message_sent',
        params: {
          conversation_id: conversationId,
          message_type: type,
          user_id: user.uid,
        },
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Mesaj gönderilirken hata oluştu');
    }
  }, [user?.uid, toast]);

  const createConversation = useCallback(async (participantIds: string[]): Promise<string> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const conversationId = await SocialService.createConversation([user.uid, ...participantIds]);
      toast.success('Sohbet oluşturuldu');
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Sohbet oluşturulurken hata oluştu');
      throw error;
    }
  }, [user?.uid, toast]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user?.uid) return;

    try {
      await SocialService.markConversationAsRead(user.uid, conversationId);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [user?.uid]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await SocialService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Mesaj silindi');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Mesaj silinirken hata oluştu');
    }
  }, [toast]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await SocialService.editMessage(messageId, content);
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, content: { text: content }, edited: true }
          : m
      ));
      toast.success('Mesaj düzenlendi');
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Mesaj düzenlenirken hata oluştu');
    }
  }, [toast]);

  const subscribeToConversation = useCallback((conversationId: string) => {
    // Implementation would subscribe to real-time messages
    console.log('Subscribing to conversation:', conversationId);
  }, []);

  const unsubscribeFromConversation = useCallback((conversationId: string) => {
    // Implementation would unsubscribe from real-time messages
    console.log('Unsubscribing from conversation:', conversationId);
  }, []);

  return {
    conversations,
    activeConversation,
    messages,
    sendMessage,
    createConversation,
    markAsRead,
    deleteMessage,
    editMessage,
    subscribeToConversation,
    unsubscribeFromConversation,
  };
}

export default useSocial;
