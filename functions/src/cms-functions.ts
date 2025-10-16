import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

// Create/update content page
export const saveContentPage = onCall(
  {
    region: 'europe-west1',
    memory: '512MiB',
  },
  async (request: CallableRequest) => {
    const { pageId, pageData, isDraft } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!pageData) {
      throw new HttpsError('invalid-argument', 'Page data is required');
    }

    try {
      const db = getFirestore();
      const batch = db.batch();

      const now = new Date();
      const pageRef = pageId
        ? db.collection('content_pages').doc(pageId)
        : db.collection('content_pages').doc();

      const finalPageData = {
        ...pageData,
        id: pageRef.id,
        slug: pageData.slug || generateSlug(pageData.title?.tr || pageData.title),
        status: isDraft ? 'draft' : 'published',
        authorId: userId,
        publishedAt: isDraft ? null : (pageData.publishedAt || now),
        updatedAt: now,
        createdAt: pageId ? pageData.createdAt : now,
      };

      batch.set(pageRef, finalPageData);

      // Create revision if updating existing page
      if (pageId) {
        const revisionRef = db.collection('content_revisions').doc();
        batch.set(revisionRef, {
          id: revisionRef.id,
          contentId: pageId,
          version: pageData.version || 1,
          title: pageData.title,
          content: pageData.content,
          changeLog: pageData.changeLog || 'İçerik güncellendi',
          changedBy: userId,
          isPublished: !isDraft,
          createdAt: now,
        });
      }

      await batch.commit();

      return {
        pageId: pageRef.id,
        page: finalPageData,
      };

    } catch (error) {
      logger.error('Error saving content page:', error);
      throw new HttpsError('internal', 'Failed to save content page');
    }
  }
);

// Get content page by slug
export const getContentPage = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { slug } = request.data;

    if (!slug) {
      throw new HttpsError('invalid-argument', 'Slug is required');
    }

    try {
      const db = getFirestore();

      const pageSnapshot = await db.collection('content_pages')
        .where('slug', '==', slug)
        .where('status', '==', 'published')
        .limit(1)
        .get();

      if (pageSnapshot.empty) {
        throw new HttpsError('not-found', 'Page not found');
      }

      const page = pageSnapshot.docs[0].data();

      // Update view count
      await db.collection('content_pages').doc(page.id).update({
        'analytics.views': (page.analytics?.views || 0) + 1,
        updatedAt: new Date(),
      });

      return page;

    } catch (error) {
      logger.error('Error getting content page:', error);
      throw new HttpsError('internal', 'Failed to get content page');
    }
  }
);

// Get content pages list
export const getContentPages = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { type, status = 'published', limit = 20, categoryId } = request.data;
    const userId = request.auth?.uid;

    try {
      const db = getFirestore();

      let query = db.collection('content_pages')
        .where('status', '==', status);

      if (type) {
        query = query.where('type', '==', type);
      }

      if (categoryId) {
        query = query.where('categoryId', '==', categoryId);
      }

      // Only show user's drafts if not admin
      if (status === 'draft' && userId) {
        query = query.where('authorId', '==', userId);
      }

      query = query.orderBy('createdAt', 'desc').limit(limit);

      const snapshot = await query.get();
      const pages = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { pages, total: pages.length };

    } catch (error) {
      logger.error('Error getting content pages:', error);
      throw new HttpsError('internal', 'Failed to get content pages');
    }
  }
);

// Upload media file
export const uploadMedia = onCall(
  {
    region: 'europe-west1',
    memory: '512MiB',
  },
  async (request: CallableRequest) => {
    const { fileName, fileData, folder, alt, caption } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!fileName || !fileData) {
      throw new HttpsError('invalid-argument', 'File name and data are required');
    }

    try {
      const db = getFirestore();

      // In a real implementation, you would:
      // 1. Upload file to Firebase Storage
      // 2. Generate thumbnails
      // 3. Get file metadata

      // For now, simulate media upload
      const mediaRef = db.collection('media_library').doc();
      const mediaData = {
        id: mediaRef.id,
        fileName,
        originalName: fileName,
        mimeType: getMimeType(fileName),
        size: fileData.length,
        url: `https://storage.googleapis.com/tourtrip-media/${mediaRef.id}_${fileName}`,
        thumbnailUrl: `https://storage.googleapis.com/tourtrip-media/thumbs/${mediaRef.id}_${fileName}`,
        folder: folder || 'general',
        alt: alt || {},
        caption: caption || {},
        uploadedBy: userId,
        isPublic: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mediaRef.set(mediaData);

      return {
        mediaId: mediaRef.id,
        media: mediaData,
      };

    } catch (error) {
      logger.error('Error uploading media:', error);
      throw new HttpsError('internal', 'Failed to upload media');
    }
  }
);

// Get media library
export const getMediaLibrary = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { folder, limit = 50 } = request.data;

    try {
      const db = getFirestore();

      let query = db.collection('media_library')
        .where('isPublic', '==', true);

      if (folder) {
        query = query.where('folder', '==', folder);
      }

      query = query.orderBy('createdAt', 'desc').limit(limit);

      const snapshot = await query.get();
      const media = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { media, total: media.length };

    } catch (error) {
      logger.error('Error getting media library:', error);
      throw new HttpsError('internal', 'Failed to get media library');
    }
  }
);

// Create content category
export const saveContentCategory = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { categoryId, categoryData } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!categoryData) {
      throw new HttpsError('invalid-argument', 'Category data is required');
    }

    try {
      const db = getFirestore();

      const categoryRef = categoryId
        ? db.collection('content_categories').doc(categoryId)
        : db.collection('content_categories').doc();

      const finalCategoryData = {
        ...categoryData,
        id: categoryRef.id,
        slug: categoryData.slug || generateSlug(categoryData.name?.tr || categoryData.name),
        isActive: categoryData.isActive ?? true,
        createdAt: categoryId ? categoryData.createdAt : new Date(),
        updatedAt: new Date(),
      };

      await categoryRef.set(finalCategoryData);

      return {
        categoryId: categoryRef.id,
        category: finalCategoryData,
      };

    } catch (error) {
      logger.error('Error saving content category:', error);
      throw new HttpsError('internal', 'Failed to save content category');
    }
  }
);

// Get FAQ
export const getFAQ = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { categoryId, limit = 20 } = request.data;

    try {
      const db = getFirestore();

      let query = db.collection('faqs')
        .where('isActive', '==', true);

      if (categoryId) {
        query = query.where('categoryId', '==', categoryId);
      }

      query = query.orderBy('order').orderBy('createdAt', 'desc').limit(limit);

      const snapshot = await query.get();
      const faqs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { faqs };

    } catch (error) {
      logger.error('Error getting FAQ:', error);
      throw new HttpsError('internal', 'Failed to get FAQ');
    }
  }
);

// Submit FAQ feedback
export const submitFAQFeedback = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { faqId, helpful } = request.data;
    // const userId = request.auth?.uid;

    if (!faqId) {
      throw new HttpsError('invalid-argument', 'FAQ ID is required');
    }

    try {
      const db = getFirestore();

      const faqRef = db.collection('faqs').doc(faqId);
      const faqDoc = await faqRef.get();

      if (!faqDoc.exists) {
        throw new HttpsError('not-found', 'FAQ not found');
      }

      const currentData = faqDoc.data();
      const currentHelpful = currentData?.helpful || 0;
      const currentNotHelpful = currentData?.notHelpful || 0;

      await faqRef.update({
        helpful: helpful ? currentHelpful + 1 : currentHelpful,
        notHelpful: helpful ? currentNotHelpful : currentNotHelpful + 1,
        updatedAt: new Date(),
      });

      return { success: true };

    } catch (error) {
      logger.error('Error submitting FAQ feedback:', error);
      throw new HttpsError('internal', 'Failed to submit feedback');
    }
  }
);

// Auto-update content analytics
export const updateContentAnalytics = onDocumentCreated(
  'content_pages',
  async (event: FirestoreEvent<any, any>) => {
    const page = event.data?.data();
    if (!page) return;

    // Initialize analytics
    const db = getFirestore();
    await db.collection('content_pages').doc(event.params.pageId).update({
      'analytics.views': 0,
      'analytics.shares': 0,
      'analytics.readTime': 0,
      updatedAt: new Date(),
    });
  }
);

// Helper functions
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}