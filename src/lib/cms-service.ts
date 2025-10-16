import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  ContentPage, 
  ContentCategory, 
  ContentTemplate, 
  MediaLibrary, 
  ContentMenu, 
  FAQ, 
  Announcement,
  ContentRevision,
  CMSSettings,
  LocalizedContent,
  ContentSearchParams,
  MediaSearchParams,
  ContentAnalytics
} from '../types/cms';
import {
  ContentPageSchema,
  ContentCategorySchema,
  ContentTemplateSchema,
  MediaLibrarySchema,
  ContentMenuSchema,
  FAQSchema,
  AnnouncementSchema,
  ContentRevisionSchema,
  CMSSettingsSchema
} from './firestore-collections';

// Collection references
const COLLECTIONS = {
  CONTENT_PAGES: 'contentPages',
  CONTENT_CATEGORIES: 'contentCategories',
  CONTENT_TEMPLATES: 'contentTemplates',
  MEDIA_LIBRARY: 'mediaLibrary',
  CONTENT_MENUS: 'contentMenus',
  FAQS: 'faqs',
  ANNOUNCEMENTS: 'announcements',
  CONTENT_REVISIONS: 'contentRevisions',
  CMS_SETTINGS: 'cmsSettings',
} as const;

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateSlug = (title: string) => title
  .toLowerCase()
  .replace(/[^a-z0-9 -]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .trim();

// Content Management Service
export class ContentService {
  static async createContent(contentData: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentPage> {
    try {
      const data = {
        ...contentData,
        id: generateId(),
        slug: contentData.slug || generateSlug(contentData.title.tr),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validatedData = ContentPageSchema.parse(data);
      const docRef = await addDoc(collection(db, COLLECTIONS.CONTENT_PAGES), validatedData);
      
      return { ...validatedData, id: docRef.id };
    } catch (error) {
      console.error('Error creating content:', error);
      throw new Error('Failed to create content');
    }
  }

  static async updateContent(id: string, updates: Partial<ContentPage>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.CONTENT_PAGES, id);
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      // Create revision before updating
      if (updates.content || updates.title) {
        const currentDoc = await getDoc(docRef);
        if (currentDoc.exists()) {
          const currentData = currentDoc.data() as ContentPage;
          await this.createRevision(id, currentData, updates.workflow?.lastEditedBy || 'system');
        }
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating content:', error);
      throw new Error('Failed to update content');
    }
  }

  static async deleteContent(id: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Delete main content
      const contentRef = doc(db, COLLECTIONS.CONTENT_PAGES, id);
      batch.delete(contentRef);

      // Delete all revisions
      const revisionsQuery = query(
        collection(db, COLLECTIONS.CONTENT_REVISIONS),
        where('contentId', '==', id)
      );
      const revisionsSnapshot = await getDocs(revisionsQuery);
      revisionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting content:', error);
      throw new Error('Failed to delete content');
    }
  }

  static async getContent(id: string): Promise<ContentPage | null> {
    try {
      const docRef = doc(db, COLLECTIONS.CONTENT_PAGES, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return { id: docSnap.id, ...docSnap.data() } as ContentPage;
    } catch (error) {
      console.error('Error getting content:', error);
      throw new Error('Failed to get content');
    }
  }

  static async getContentBySlug(slug: string, language: string = 'tr'): Promise<ContentPage | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CONTENT_PAGES),
        where('slug', '==', slug),
        where('status', '==', 'published'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const content = { id: doc.id, ...doc.data() } as ContentPage;

      // Increment view count
      await this.incrementViews(content.id);

      return content;
    } catch (error) {
      console.error('Error getting content by slug:', error);
      throw new Error('Failed to get content');
    }
  }

  static async searchContent(params: ContentSearchParams = {}): Promise<ContentPage[]> {
    try {
      let q = query(collection(db, COLLECTIONS.CONTENT_PAGES));
      
      // Add filters
      if (params.type) {
        q = query(q, where('type', '==', params.type));
      }
      
      if (params.status) {
        q = query(q, where('status', '==', params.status));
      }
      
      if (params.categoryId) {
        q = query(q, where('categoryId', '==', params.categoryId));
      }
      
      if (params.authorId) {
        q = query(q, where('authorId', '==', params.authorId));
      }
      
      if (params.featured !== undefined) {
        q = query(q, where('featured', '==', params.featured));
      }
      
      if (params.dateFrom) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(params.dateFrom)));
      }
      
      if (params.dateTo) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(params.dateTo)));
      }

      // Add ordering and pagination
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';
      q = query(q, orderBy(sortBy, sortOrder));
      
      if (params.limit) {
        q = query(q, limit(params.limit));
      }

      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContentPage[];

      // Text search (client-side filtering)
      if (params.query) {
        const searchTerm = params.query.toLowerCase();
        results = results.filter(content => 
          content.title.tr.toLowerCase().includes(searchTerm) ||
          content.title.en?.toLowerCase().includes(searchTerm) ||
          content.content.tr.toLowerCase().includes(searchTerm) ||
          content.content.en?.toLowerCase().includes(searchTerm) ||
          content.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Tag filtering
      if (params.tags && params.tags.length > 0) {
        results = results.filter(content =>
          params.tags!.some(tag => content.tags.includes(tag))
        );
      }

      return results;
    } catch (error) {
      console.error('Error searching content:', error);
      throw new Error('Failed to search content');
    }
  }

  static async publishContent(id: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.CONTENT_PAGES, id);
      await updateDoc(docRef, {
        status: 'published',
        publishedAt: new Date(),
        'workflow.lastEditedBy': userId,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error publishing content:', error);
      throw new Error('Failed to publish content');
    }
  }

  static async incrementViews(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.CONTENT_PAGES, id);
      await updateDoc(docRef, {
        'analytics.views': increment(1),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
      // Don't throw error for analytics
    }
  }

  private static async createRevision(contentId: string, content: ContentPage, changedBy: string): Promise<void> {
    try {
      const revisionData = {
        id: generateId(),
        contentId,
        version: content.workflow.version + 1,
        title: content.title,
        content: content.content,
        changeLog: `Version ${content.workflow.version + 1}`,
        changedBy,
        isPublished: content.status === 'published',
        createdAt: new Date(),
      };

      const validatedData = ContentRevisionSchema.parse(revisionData);
      await addDoc(collection(db, COLLECTIONS.CONTENT_REVISIONS), validatedData);
    } catch (error) {
      console.error('Error creating revision:', error);
    }
  }

  static async getContentRevisions(contentId: string): Promise<ContentRevision[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CONTENT_REVISIONS),
        where('contentId', '==', contentId),
        orderBy('version', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContentRevision[];
    } catch (error) {
      console.error('Error getting content revisions:', error);
      throw new Error('Failed to get content revisions');
    }
  }
}

// Category Management Service
export class CategoryService {
  static async createCategory(categoryData: Omit<ContentCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentCategory> {
    try {
      const data = {
        ...categoryData,
        id: generateId(),
        slug: categoryData.slug || generateSlug(categoryData.name.tr),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validatedData = ContentCategorySchema.parse(data);
      const docRef = await addDoc(collection(db, COLLECTIONS.CONTENT_CATEGORIES), validatedData);
      
      return { ...validatedData, id: docRef.id };
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Failed to create category');
    }
  }

  static async getCategories(type?: ContentCategory['type']): Promise<ContentCategory[]> {
    try {
      let q = query(collection(db, COLLECTIONS.CONTENT_CATEGORIES));
      
      if (type) {
        q = query(q, where('type', '==', type));
      }
      
      q = query(q, where('isActive', '==', true), orderBy('order', 'asc'));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContentCategory[];
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Failed to get categories');
    }
  }

  static async updateCategory(id: string, updates: Partial<ContentCategory>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.CONTENT_CATEGORIES, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Failed to update category');
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    try {
      // Check if category has content
      const contentQuery = query(
        collection(db, COLLECTIONS.CONTENT_PAGES),
        where('categoryId', '==', id),
        limit(1)
      );
      
      const contentSnapshot = await getDocs(contentQuery);
      if (!contentSnapshot.empty) {
        throw new Error('Cannot delete category with existing content');
      }

      const docRef = doc(db, COLLECTIONS.CONTENT_CATEGORIES, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Failed to delete category');
    }
  }
}

// Template Management Service
export class TemplateService {
  static async createTemplate(templateData: Omit<ContentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentTemplate> {
    try {
      const data = {
        ...templateData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validatedData = ContentTemplateSchema.parse(data);
      const docRef = await addDoc(collection(db, COLLECTIONS.CONTENT_TEMPLATES), validatedData);
      
      return { ...validatedData, id: docRef.id };
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create template');
    }
  }

  static async getTemplates(type?: ContentTemplate['type']): Promise<ContentTemplate[]> {
    try {
      let q = query(collection(db, COLLECTIONS.CONTENT_TEMPLATES));
      
      if (type) {
        q = query(q, where('type', '==', type));
      }
      
      q = query(q, where('isActive', '==', true), orderBy('usageCount', 'desc'));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContentTemplate[];
    } catch (error) {
      console.error('Error getting templates:', error);
      throw new Error('Failed to get templates');
    }
  }

  static async incrementTemplateUsage(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.CONTENT_TEMPLATES, id);
      await updateDoc(docRef, {
        usageCount: increment(1),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error incrementing template usage:', error);
    }
  }
}

// Media Library Service
export class MediaService {
  static async addMedia(mediaData: Omit<MediaLibrary, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaLibrary> {
    try {
      const data = {
        ...mediaData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validatedData = MediaLibrarySchema.parse(data);
      const docRef = await addDoc(collection(db, COLLECTIONS.MEDIA_LIBRARY), validatedData);
      
      return { ...validatedData, id: docRef.id };
    } catch (error) {
      console.error('Error adding media:', error);
      throw new Error('Failed to add media');
    }
  }

  static async searchMedia(params: MediaSearchParams = {}): Promise<MediaLibrary[]> {
    try {
      let q = query(collection(db, COLLECTIONS.MEDIA_LIBRARY));
      
      if (params.type) {
        q = query(q, where('mimeType', '>=', params.type), where('mimeType', '<', params.type + '\uf8ff'));
      }
      
      if (params.folder) {
        q = query(q, where('folder', '==', params.folder));
      }
      
      if (params.uploadedBy) {
        q = query(q, where('uploadedBy', '==', params.uploadedBy));
      }
      
      if (params.dateFrom) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(params.dateFrom)));
      }
      
      if (params.dateTo) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(params.dateTo)));
      }

      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';
      q = query(q, orderBy(sortBy, sortOrder));
      
      if (params.limit) {
        q = query(q, limit(params.limit));
      }

      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MediaLibrary[];

      // Text search
      if (params.query) {
        const searchTerm = params.query.toLowerCase();
        results = results.filter(media => 
          media.originalName.toLowerCase().includes(searchTerm) ||
          media.alt?.tr?.toLowerCase().includes(searchTerm) ||
          media.caption?.tr?.toLowerCase().includes(searchTerm) ||
          media.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Tag filtering
      if (params.tags && params.tags.length > 0) {
        results = results.filter(media =>
          params.tags!.some(tag => media.tags.includes(tag))
        );
      }

      return results;
    } catch (error) {
      console.error('Error searching media:', error);
      throw new Error('Failed to search media');
    }
  }

  static async incrementMediaUsage(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.MEDIA_LIBRARY, id);
      await updateDoc(docRef, {
        usageCount: increment(1),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error incrementing media usage:', error);
    }
  }

  static async deleteMedia(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.MEDIA_LIBRARY, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting media:', error);
      throw new Error('Failed to delete media');
    }
  }
}

// Menu Management Service
export class MenuService {
  static async createMenu(menuData: Omit<ContentMenu, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentMenu> {
    try {
      const data = {
        ...menuData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validatedData = ContentMenuSchema.parse(data);
      const docRef = await addDoc(collection(db, COLLECTIONS.CONTENT_MENUS), validatedData);
      
      return { ...validatedData, id: docRef.id };
    } catch (error) {
      console.error('Error creating menu:', error);
      throw new Error('Failed to create menu');
    }
  }

  static async getMenus(location?: ContentMenu['location'], language: string = 'tr'): Promise<ContentMenu[]> {
    try {
      let q = query(collection(db, COLLECTIONS.CONTENT_MENUS));
      
      if (location) {
        q = query(q, where('location', '==', location));
      }
      
      q = query(q, where('language', '==', language), where('isActive', '==', true));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContentMenu[];
    } catch (error) {
      console.error('Error getting menus:', error);
      throw new Error('Failed to get menus');
    }
  }

  static async updateMenu(id: string, updates: Partial<ContentMenu>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.CONTENT_MENUS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating menu:', error);
      throw new Error('Failed to update menu');
    }
  }
}

// FAQ Service
export class FAQService {
  static async createFAQ(faqData: Omit<FAQ, 'id' | 'createdAt' | 'updatedAt'>): Promise<FAQ> {
    try {
      const data = {
        ...faqData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validatedData = FAQSchema.parse(data);
      const docRef = await addDoc(collection(db, COLLECTIONS.FAQS), validatedData);
      
      return { ...validatedData, id: docRef.id };
    } catch (error) {
      console.error('Error creating FAQ:', error);
      throw new Error('Failed to create FAQ');
    }
  }

  static async getFAQs(categoryId?: string): Promise<FAQ[]> {
    try {
      let q = query(collection(db, COLLECTIONS.FAQS));
      
      if (categoryId) {
        q = query(q, where('categoryId', '==', categoryId));
      }
      
      q = query(q, where('isActive', '==', true), orderBy('order', 'asc'));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FAQ[];
    } catch (error) {
      console.error('Error getting FAQs:', error);
      throw new Error('Failed to get FAQs');
    }
  }

  static async markFAQHelpful(id: string, isHelpful: boolean): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.FAQS, id);
      const field = isHelpful ? 'helpful' : 'notHelpful';
      await updateDoc(docRef, {
        [field]: increment(1),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error marking FAQ helpful:', error);
      throw new Error('Failed to update FAQ feedback');
    }
  }
}

// Announcement Service
export class AnnouncementService {
  static async createAnnouncement(announcementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> {
    try {
      const data = {
        ...announcementData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validatedData = AnnouncementSchema.parse(data);
      const docRef = await addDoc(collection(db, COLLECTIONS.ANNOUNCEMENTS), validatedData);
      
      return { ...validatedData, id: docRef.id };
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw new Error('Failed to create announcement');
    }
  }

  static async getActiveAnnouncements(userType: string = 'all', page?: string): Promise<Announcement[]> {
    try {
      const now = new Date();
      let q = query(
        collection(db, COLLECTIONS.ANNOUNCEMENTS),
        where('isActive', '==', true),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      let announcements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];

      // Filter by target criteria
      announcements = announcements.filter(announcement => {
        const target = announcement.target;
        
        // Check user type
        if (target.userTypes && target.userTypes.length > 0) {
          if (!target.userTypes.includes('all') && !target.userTypes.includes(userType as any)) {
            return false;
          }
        }
        
        // Check date range
        if (target.startDate && target.startDate > now) {
          return false;
        }
        
        if (target.endDate && target.endDate < now) {
          return false;
        }
        
        // Check page targeting
        if (target.pages && target.pages.length > 0 && page) {
          if (!target.pages.includes(page)) {
            return false;
          }
        }
        
        return true;
      });

      return announcements;
    } catch (error) {
      console.error('Error getting announcements:', error);
      throw new Error('Failed to get announcements');
    }
  }
}

// CMS Settings Service
export class CMSSettingsService {
  static async getSettings(): Promise<CMSSettings | null> {
    try {
      const q = query(collection(db, COLLECTIONS.CMS_SETTINGS), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as CMSSettings;
    } catch (error) {
      console.error('Error getting CMS settings:', error);
      throw new Error('Failed to get CMS settings');
    }
  }

  static async updateSettings(settings: Partial<CMSSettings>, userId: string): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      
      if (currentSettings) {
        const docRef = doc(db, COLLECTIONS.CMS_SETTINGS, currentSettings.id);
        await updateDoc(docRef, {
          ...settings,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        // Create default settings
        const defaultSettings = {
          id: generateId(),
          general: {
            siteName: { tr: 'TourTrip', en: 'TourTrip' },
            siteDescription: { tr: 'Tur ve Gezi Platformu', en: 'Tour and Travel Platform' },
            defaultLanguage: 'tr',
            availableLanguages: ['tr', 'en'],
            timezone: 'Europe/Istanbul',
            dateFormat: 'DD/MM/YYYY',
          },
          content: {
            defaultStatus: 'draft' as const,
            enableRevisions: true,
            maxRevisions: 10,
            enableWorkflow: false,
            enableComments: true,
            moderateComments: true,
          },
          media: {
            maxFileSize: 10,
            allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
            enableImageOptimization: true,
            thumbnailSizes: {
              small: { width: 150, height: 150 },
              medium: { width: 300, height: 300 },
              large: { width: 800, height: 600 },
            },
          },
          seo: {
            enableSitemap: true,
            enableRobots: true,
            defaultMetaTitle: { tr: 'TourTrip - Tur ve Gezi Platformu', en: 'TourTrip - Tour and Travel Platform' },
            defaultMetaDescription: { tr: 'En iyi tur ve gezi deneyimleri için TourTrip', en: 'Best tour and travel experiences with TourTrip' },
            socialMedia: {},
          },
          ...settings,
          updatedBy: userId,
          updatedAt: new Date(),
        };

        const validatedData = CMSSettingsSchema.parse(defaultSettings);
        await addDoc(collection(db, COLLECTIONS.CMS_SETTINGS), validatedData);
      }
    } catch (error) {
      console.error('Error updating CMS settings:', error);
      throw new Error('Failed to update CMS settings');
    }
  }
}

// Analytics Service
export class ContentAnalyticsService {
  static async getAnalytics(): Promise<ContentAnalytics> {
    try {
      // Get content stats
      const contentSnapshot = await getDocs(collection(db, COLLECTIONS.CONTENT_PAGES));
      const allContent = contentSnapshot.docs.map(doc => doc.data() as ContentPage);
      
      const totalPages = allContent.length;
      const publishedPages = allContent.filter(c => c.status === 'published').length;
      const draftPages = allContent.filter(c => c.status === 'draft').length;
      const totalViews = allContent.reduce((sum, c) => sum + (c.analytics?.views || 0), 0);

      // Popular content
      const popularContent = allContent
        .filter(c => c.status === 'published')
        .sort((a, b) => (b.analytics?.views || 0) - (a.analytics?.views || 0))
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          title: c.title.tr,
          views: c.analytics?.views || 0,
          type: c.type,
        }));

      // Content by type
      const contentByType: { [key: string]: number } = {};
      allContent.forEach(c => {
        contentByType[c.type] = (contentByType[c.type] || 0) + 1;
      });

      // Content by language (based on available translations)
      const contentByLanguage: { [key: string]: number } = {
        tr: totalPages, // All content has Turkish by default
      };
      
      allContent.forEach(c => {
        Object.keys(c.translations || {}).forEach(lang => {
          if (c.translations[lang].isComplete) {
            contentByLanguage[lang] = (contentByLanguage[lang] || 0) + 1;
          }
        });
      });

      // Author stats
      const authorStats: { [key: string]: { name: string; count: number; views: number } } = {};
      allContent.forEach(c => {
        if (!authorStats[c.authorId]) {
          authorStats[c.authorId] = { name: c.authorName, count: 0, views: 0 };
        }
        authorStats[c.authorId].count++;
        authorStats[c.authorId].views += c.analytics?.views || 0;
      });

      return {
        totalPages,
        publishedPages,
        draftPages,
        totalViews,
        popularContent,
        contentByType,
        contentByLanguage,
        monthlyViews: [], // Would need aggregation for real implementation
        authorStats: Object.entries(authorStats).map(([id, stats]) => ({
          authorId: id,
          authorName: stats.name,
          contentCount: stats.count,
          totalViews: stats.views,
        })),
      };
    } catch (error) {
      console.error('Error getting content analytics:', error);
      throw new Error('Failed to get content analytics');
    }
  }
}

// Export all services
export {
  ContentService,
  CategoryService,
  TemplateService,
  MediaService,
  MenuService,
  FAQService,
  AnnouncementService,
  CMSSettingsService,
  ContentAnalyticsService,
};
