// Social Service for TourTrip.app
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  serverTimestamp,
  runTransaction,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import {
  SocialProfile,
  SocialPost,
  PostType,
  PostContent,
  MediaItem,
  Comment,
  Story,
  DirectMessage,
  Conversation,
  FollowRelationship,
  FollowStatus,
  InteractionType,
  PostVisibility,
  SocialNotification,
  NotificationType,
  FeedItem,
  FeedItemType,
  ActivityType,
  ContentReport,
  ReportStatus
} from '@/types/social';
import { analyticsService } from './analytics-service';
import { errorService } from './error-service';

export class SocialService {
  // Profile Management
  static async createProfile(userId: string, profileData: Partial<SocialProfile>): Promise<SocialProfile> {
    try {
      const profile: SocialProfile = {
        userId,
        displayName: profileData.displayName || '',
        username: profileData.username || `user_${Date.now()}`,
        avatar: profileData.avatar || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        website: profileData.website || '',
        joinDate: Timestamp.now(),
        isVerified: false,
        isPrivate: false,
        socialLinks: profileData.socialLinks || {},
        stats: {
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          reviewsCount: 0,
          likesReceived: 0,
          toursCompleted: 0,
          countriesVisited: 0,
          citiesVisited: 0,
        },
        badges: [],
        preferences: {
          allowFollowers: true,
          showActivity: true,
          showLocation: true,
          allowMessages: true,
          allowTagging: true,
          notifyOnFollow: true,
          notifyOnLike: true,
          notifyOnComment: true,
          notifyOnMention: true,
        },
        ...profileData,
      };

      await doc(db, 'socialProfiles', userId).set(profile);
      
      analyticsService.logEvent({
        name: 'social_profile_created',
        params: {
          user_id: userId,
          username: profile.username,
        },
      });

      return profile;
    } catch (error) {
      console.error('Error creating social profile:', error);
      throw errorService.createAppError(error as Error, {
        code: 'SOCIAL_PROFILE_CREATE_FAILED',
        category: 'business_logic',
        severity: 'medium',
      });
    }
  }

  static async getProfile(userId: string): Promise<SocialProfile | null> {
    try {
      const docRef = doc(db, 'socialProfiles', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as SocialProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting social profile:', error);
      throw errorService.createAppError(error as Error, {
        code: 'SOCIAL_PROFILE_GET_FAILED',
        category: 'database',
        severity: 'low',
      });
    }
  }

  static async updateProfile(userId: string, updates: Partial<SocialProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'socialProfiles', userId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      analyticsService.logEvent({
        name: 'social_profile_updated',
        params: {
          user_id: userId,
          updated_fields: Object.keys(updates),
        },
      });
    } catch (error) {
      console.error('Error updating social profile:', error);
      throw errorService.createAppError(error as Error, {
        code: 'SOCIAL_PROFILE_UPDATE_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  static async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update profile
      await this.updateProfile(userId, { avatar: downloadURL });
      
      analyticsService.logEvent({
        name: 'avatar_uploaded',
        params: {
          user_id: userId,
          file_size: file.size,
        },
      });

      return downloadURL;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw errorService.createAppError(error as Error, {
        code: 'AVATAR_UPLOAD_FAILED',
        category: 'storage',
        severity: 'medium',
      });
    }
  }

  // Following System
  static async followUser(followerId: string, followeeId: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        // Check if already following
        const followQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', followerId),
          where('followeeId', '==', followeeId)
        );
        const existingFollow = await getDocs(followQuery);
        
        if (!existingFollow.empty) {
          throw new Error('Already following this user');
        }

        // Get profiles
        const followerProfile = await this.getProfile(followerId);
        const followeeProfile = await this.getProfile(followeeId);
        
        if (!followerProfile || !followeeProfile) {
          throw new Error('Profile not found');
        }

        // Create follow relationship
        const followData: FollowRelationship = {
          id: '',
          followerId,
          followeeId,
          createdAt: Timestamp.now(),
          status: followeeProfile.isPrivate ? FollowStatus.PENDING : FollowStatus.FOLLOWING,
          followerProfile: {
            displayName: followerProfile.displayName,
            username: followerProfile.username,
            avatar: followerProfile.avatar,
            isVerified: followerProfile.isVerified,
          },
          followeeProfile: {
            displayName: followeeProfile.displayName,
            username: followeeProfile.username,
            avatar: followeeProfile.avatar,
            isVerified: followeeProfile.isVerified,
          },
        };

        const followRef = doc(collection(db, 'follows'));
        followData.id = followRef.id;
        transaction.set(followRef, followData);

        // Update stats only if not pending
        if (!followeeProfile.isPrivate) {
          transaction.update(doc(db, 'socialProfiles', followerId), {
            'stats.followingCount': increment(1),
          });
          transaction.update(doc(db, 'socialProfiles', followeeId), {
            'stats.followersCount': increment(1),
          });
        }

        // Create notification
        const notification: SocialNotification = {
          id: '',
          userId: followeeId,
          type: followeeProfile.isPrivate ? NotificationType.FOLLOW_REQUEST : NotificationType.NEW_FOLLOWER,
          title: followeeProfile.isPrivate ? 'Takip İsteği' : 'Yeni Takipçi',
          body: `${followerProfile.displayName} ${followeeProfile.isPrivate ? 'sizi takip etmek istiyor' : 'sizi takip etmeye başladı'}`,
          data: { userId: followerId },
          actorId: followerId,
          actor: {
            displayName: followerProfile.displayName,
            username: followerProfile.username,
            avatar: followerProfile.avatar,
          },
          createdAt: Timestamp.now(),
          read: false,
          clicked: false,
          delivered: false,
        };

        const notificationRef = doc(collection(db, 'notifications'));
        notification.id = notificationRef.id;
        transaction.set(notificationRef, notification);
      });

      analyticsService.logEvent({
        name: 'user_followed',
        params: {
          follower_id: followerId,
          followee_id: followeeId,
        },
      });
    } catch (error) {
      console.error('Error following user:', error);
      throw errorService.createAppError(error as Error, {
        code: 'FOLLOW_USER_FAILED',
        category: 'business_logic',
        severity: 'medium',
      });
    }
  }

  static async unfollowUser(followerId: string, followeeId: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        // Find and delete follow relationship
        const followQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', followerId),
          where('followeeId', '==', followeeId)
        );
        const followDocs = await getDocs(followQuery);
        
        if (followDocs.empty) {
          throw new Error('Follow relationship not found');
        }

        const followDoc = followDocs.docs[0];
        const followData = followDoc.data() as FollowRelationship;
        
        transaction.delete(followDoc.ref);

        // Update stats only if was actually following (not pending)
        if (followData.status === FollowStatus.FOLLOWING) {
          transaction.update(doc(db, 'socialProfiles', followerId), {
            'stats.followingCount': increment(-1),
          });
          transaction.update(doc(db, 'socialProfiles', followeeId), {
            'stats.followersCount': increment(-1),
          });
        }
      });

      analyticsService.logEvent({
        name: 'user_unfollowed',
        params: {
          follower_id: followerId,
          followee_id: followeeId,
        },
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw errorService.createAppError(error as Error, {
        code: 'UNFOLLOW_USER_FAILED',
        category: 'business_logic',
        severity: 'medium',
      });
    }
  }

  static async getFollowers(userId: string, limitCount: number = 20): Promise<SocialProfile[]> {
    try {
      const followQuery = query(
        collection(db, 'follows'),
        where('followeeId', '==', userId),
        where('status', '==', FollowStatus.FOLLOWING),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const followDocs = await getDocs(followQuery);
      const followerIds = followDocs.docs.map(doc => doc.data().followerId);
      
      // Get follower profiles
      const profiles: SocialProfile[] = [];
      for (const followerId of followerIds) {
        const profile = await this.getProfile(followerId);
        if (profile) {
          profiles.push(profile);
        }
      }
      
      return profiles;
    } catch (error) {
      console.error('Error getting followers:', error);
      throw errorService.createAppError(error as Error, {
        code: 'GET_FOLLOWERS_FAILED',
        category: 'database',
        severity: 'low',
      });
    }
  }

  // Post Management
  static async createPost(authorId: string, postData: Omit<SocialPost, 'id' | 'authorId' | 'author' | 'createdAt' | 'updatedAt' | 'stats' | 'interactions'>): Promise<string> {
    try {
      const author = await this.getProfile(authorId);
      if (!author) {
        throw new Error('Author profile not found');
      }

      const post: SocialPost = {
        id: '',
        authorId,
        author: {
          displayName: author.displayName,
          username: author.username,
          avatar: author.avatar,
          isVerified: author.isVerified,
        },
        type: postData.type,
        content: postData.content,
        media: postData.media || [],
        location: postData.location,
        tags: postData.tags || [],
        mentions: postData.mentions || [],
        visibility: postData.visibility || PostVisibility.PUBLIC,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        stats: {
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          viewsCount: 0,
          savesCount: 0,
        },
        interactions: [],
      };

      const postRef = doc(collection(db, 'socialPosts'));
      post.id = postRef.id;
      
      await runTransaction(db, async (transaction) => {
        transaction.set(postRef, post);
        
        // Update author's post count
        transaction.update(doc(db, 'socialProfiles', authorId), {
          'stats.postsCount': increment(1),
        });
      });

      analyticsService.logEvent({
        name: 'social_post_created',
        params: {
          post_id: post.id,
          author_id: authorId,
          post_type: post.type,
          has_media: post.media.length > 0,
          has_location: !!post.location,
          tag_count: post.tags.length,
        },
      });

      return post.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw errorService.createAppError(error as Error, {
        code: 'POST_CREATE_FAILED',
        category: 'business_logic',
        severity: 'medium',
      });
    }
  }

  static async likePost(userId: string, postId: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const postRef = doc(db, 'socialPosts', postId);
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists()) {
          throw new Error('Post not found');
        }

        const post = postDoc.data() as SocialPost;
        
        // Check if already liked
        const existingLike = post.interactions.find(
          interaction => interaction.userId === userId && interaction.type === InteractionType.LIKE
        );
        
        if (existingLike) {
          // Unlike - remove interaction and decrement count
          const updatedInteractions = post.interactions.filter(
            interaction => !(interaction.userId === userId && interaction.type === InteractionType.LIKE)
          );
          
          transaction.update(postRef, {
            interactions: updatedInteractions,
            'stats.likesCount': increment(-1),
          });
        } else {
          // Like - add interaction and increment count
          const userProfile = await this.getProfile(userId);
          if (!userProfile) throw new Error('User profile not found');
          
          const newInteraction = {
            id: `${userId}_${postId}_like`,
            userId,
            postId,
            type: InteractionType.LIKE,
            createdAt: Timestamp.now(),
            user: {
              displayName: userProfile.displayName,
              username: userProfile.username,
              avatar: userProfile.avatar,
            },
          };
          
          transaction.update(postRef, {
            interactions: [...post.interactions, newInteraction],
            'stats.likesCount': increment(1),
          });

          // Update author's likes received count
          transaction.update(doc(db, 'socialProfiles', post.authorId), {
            'stats.likesReceived': increment(1),
          });

          // Create notification for post author
          if (post.authorId !== userId) {
            const notification: SocialNotification = {
              id: '',
              userId: post.authorId,
              type: NotificationType.POST_LIKE,
              title: 'Gönderi Beğenildi',
              body: `${userProfile.displayName} gönderini beğendi`,
              data: { postId },
              actorId: userId,
              actor: {
                displayName: userProfile.displayName,
                username: userProfile.username,
                avatar: userProfile.avatar,
              },
              createdAt: Timestamp.now(),
              read: false,
              clicked: false,
              delivered: false,
            };

            const notificationRef = doc(collection(db, 'notifications'));
            notification.id = notificationRef.id;
            transaction.set(notificationRef, notification);
          }
        }
      });

      analyticsService.logEvent({
        name: 'post_liked',
        params: {
          post_id: postId,
          user_id: userId,
        },
      });
    } catch (error) {
      console.error('Error liking post:', error);
      throw errorService.createAppError(error as Error, {
        code: 'POST_LIKE_FAILED',
        category: 'business_logic',
        severity: 'low',
      });
    }
  }

  static async addComment(userId: string, postId: string, content: string, parentId?: string): Promise<string> {
    try {
      const userProfile = await this.getProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const comment: Comment = {
        id: '',
        postId,
        authorId: userId,
        author: {
          displayName: userProfile.displayName,
          username: userProfile.username,
          avatar: userProfile.avatar,
          isVerified: userProfile.isVerified,
        },
        content,
        parentId,
        mentions: [], // Would extract from content
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        stats: {
          likesCount: 0,
          repliesCount: 0,
        },
        isEdited: false,
        isDeleted: false,
      };

      const commentRef = doc(collection(db, 'comments'));
      comment.id = commentRef.id;
      
      await runTransaction(db, async (transaction) => {
        transaction.set(commentRef, comment);
        
        // Update post comment count
        transaction.update(doc(db, 'socialPosts', postId), {
          'stats.commentsCount': increment(1),
        });
        
        // If it's a reply, update parent comment reply count
        if (parentId) {
          transaction.update(doc(db, 'comments', parentId), {
            'stats.repliesCount': increment(1),
          });
        }
      });

      analyticsService.logEvent({
        name: 'comment_added',
        params: {
          post_id: postId,
          comment_id: comment.id,
          user_id: userId,
          is_reply: !!parentId,
        },
      });

      return comment.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw errorService.createAppError(error as Error, {
        code: 'COMMENT_ADD_FAILED',
        category: 'business_logic',
        severity: 'medium',
      });
    }
  }

  // Feed Generation
  static async getFeed(userId: string, limitCount: number = 20, lastVisible?: any): Promise<FeedItem[]> {
    try {
      // Get user's following list
      const followingQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', userId),
        where('status', '==', FollowStatus.FOLLOWING)
      );
      const followingDocs = await getDocs(followingQuery);
      const followingIds = followingDocs.docs.map(doc => doc.data().followeeId);
      
      // Include user's own posts
      followingIds.push(userId);
      
      // Get posts from followed users
      let postsQuery = query(
        collection(db, 'socialPosts'),
        where('authorId', 'in', followingIds.slice(0, 10)), // Firestore limit
        where('visibility', 'in', [PostVisibility.PUBLIC, PostVisibility.FOLLOWERS]),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      if (lastVisible) {
        postsQuery = query(postsQuery, startAfter(lastVisible));
      }
      
      const postDocs = await getDocs(postsQuery);
      
      const feedItems: FeedItem[] = postDocs.docs.map(doc => {
        const post = doc.data() as SocialPost;
        return {
          id: doc.id,
          type: FeedItemType.POST,
          content: post,
          priority: this.calculatePostPriority(post, userId),
          relevanceScore: this.calculateRelevanceScore(post, userId),
          createdAt: post.createdAt,
          seen: false,
          dismissed: false,
        };
      });
      
      // Sort by priority and relevance
      feedItems.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.relevanceScore - a.relevanceScore;
      });
      
      return feedItems;
    } catch (error) {
      console.error('Error getting feed:', error);
      throw errorService.createAppError(error as Error, {
        code: 'FEED_GET_FAILED',
        category: 'database',
        severity: 'medium',
      });
    }
  }

  private static calculatePostPriority(post: SocialPost, userId: string): number {
    let priority = 1;
    
    // Higher priority for posts from close friends (would need friendship data)
    // Higher priority for recent posts
    const hoursAgo = (Date.now() - post.createdAt.toMillis()) / (1000 * 60 * 60);
    if (hoursAgo < 24) priority += 2;
    else if (hoursAgo < 48) priority += 1;
    
    // Higher priority for posts with high engagement
    const totalEngagement = post.stats.likesCount + post.stats.commentsCount + post.stats.sharesCount;
    if (totalEngagement > 50) priority += 2;
    else if (totalEngagement > 20) priority += 1;
    
    return priority;
  }

  private static calculateRelevanceScore(post: SocialPost, userId: string): number {
    let score = 1;
    
    // Higher score for posts with media
    if (post.media.length > 0) score += 0.5;
    
    // Higher score for posts with location (travel context)
    if (post.location) score += 0.3;
    
    // Higher score for posts with relevant tags
    const travelTags = ['travel', 'tour', 'vacation', 'holiday', 'trip'];
    const hasRelevantTags = post.tags.some(tag => 
      travelTags.some(travelTag => tag.toLowerCase().includes(travelTag))
    );
    if (hasRelevantTags) score += 0.4;
    
    return score;
  }

  // Real-time subscriptions
  static subscribeToUserPosts(userId: string, callback: (posts: SocialPost[]) => void): () => void {
    const postsQuery = query(
      collection(db, 'socialPosts'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SocialPost));
      callback(posts);
    });
    
    return unsubscribe;
  }

  static subscribeToNotifications(userId: string, callback: (notifications: SocialNotification[]) => void): () => void {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SocialNotification));
      callback(notifications);
    });
    
    return unsubscribe;
  }

  // Content Moderation
  static async reportContent(
    reporterId: string,
    targetType: 'post' | 'comment' | 'user',
    targetId: string,
    category: string,
    reason: string,
    description?: string
  ): Promise<void> {
    try {
      const reporter = await this.getProfile(reporterId);
      if (!reporter) {
        throw new Error('Reporter profile not found');
      }

      const report: ContentReport = {
        id: '',
        reporterId,
        reporter: {
          displayName: reporter.displayName,
          username: reporter.username,
        },
        targetType,
        targetId,
        category,
        reason,
        description,
        status: ReportStatus.PENDING,
        createdAt: Timestamp.now(),
      };

      const reportRef = doc(collection(db, 'contentReports'));
      report.id = reportRef.id;
      await reportRef.set(report);

      analyticsService.logEvent({
        name: 'content_reported',
        params: {
          reporter_id: reporterId,
          target_type: targetType,
          target_id: targetId,
          category,
        },
      });
    } catch (error) {
      console.error('Error reporting content:', error);
      throw errorService.createAppError(error as Error, {
        code: 'CONTENT_REPORT_FAILED',
        category: 'business_logic',
        severity: 'high',
      });
    }
  }

  // Search functionality
  static async searchUsers(query: string, limitCount: number = 20): Promise<SocialProfile[]> {
    try {
      // Simple search by username and display name
      const usernameQuery = query(
        collection(db, 'socialProfiles'),
        where('username', '>=', query.toLowerCase()),
        where('username', '<=', query.toLowerCase() + '\uf8ff'),
        limit(limitCount)
      );
      
      const usernameDocs = await getDocs(usernameQuery);
      const profiles = usernameDocs.docs.map(doc => doc.data() as SocialProfile);
      
      return profiles;
    } catch (error) {
      console.error('Error searching users:', error);
      throw errorService.createAppError(error as Error, {
        code: 'USER_SEARCH_FAILED',
        category: 'database',
        severity: 'low',
      });
    }
  }
}

export default SocialService;
