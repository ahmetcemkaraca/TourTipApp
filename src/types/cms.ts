// Content Management System types for TourTrip.app
export interface ContentPage {
  id: string;
  slug: string;
  title: LocalizedContent;
  content: LocalizedContent;
  excerpt?: LocalizedContent;
  type: 'page' | 'blog' | 'guide' | 'help' | 'legal';
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  publishedAt?: Date;
  authorId: string;
  authorName: string;
  categoryId?: string;
  tags: string[];
  seo: {
    metaTitle?: LocalizedContent;
    metaDescription?: LocalizedContent;
    keywords?: string[];
    canonical?: string;
    noIndex?: boolean;
  };
  media: {
    featuredImage?: string;
    gallery?: string[];
    videos?: string[];
  };
  settings: {
    allowComments: boolean;
    showAuthor: boolean;
    showDate: boolean;
    template?: string;
  };
  analytics: {
    views: number;
    shares: number;
    readTime: number; // in minutes
  };
  workflow: {
    version: number;
    lastEditedBy: string;
    reviewStatus?: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: Date;
    reviewNotes?: string;
  };
  translations: {
    [languageCode: string]: {
      isComplete: boolean;
      translatedBy?: string;
      translatedAt?: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalizedContent {
  tr: string;
  en?: string;
  de?: string;
  fr?: string;
  ar?: string;
  ru?: string;
}

export interface ContentCategory {
  id: string;
  name: LocalizedContent;
  slug: string;
  description?: LocalizedContent;
  parentId?: string;
  type: 'page' | 'blog' | 'guide' | 'help' | 'legal';
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
  seo: {
    metaTitle?: LocalizedContent;
    metaDescription?: LocalizedContent;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'page' | 'blog' | 'guide' | 'help' | 'legal';
  structure: ContentBlock[];
  thumbnail?: string;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'gallery' | 'quote' | 'list' | 'button' | 'separator' | 'embed' | 'table';
  content: any; // Type varies by block type
  settings: {
    [key: string]: any;
  };
  order: number;
}

export interface MediaLibrary {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: LocalizedContent;
  caption?: LocalizedContent;
  url: string;
  thumbnailUrl?: string;
  folder?: string;
  tags: string[];
  uploadedBy: string;
  usageCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentMenu {
  id: string;
  name: string;
  location: 'header' | 'footer' | 'sidebar' | 'mobile';
  items: MenuItem[];
  isActive: boolean;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  type: 'page' | 'category' | 'external' | 'custom';
  targetId?: string; // page or category ID
  icon?: string;
  newTab: boolean;
  order: number;
  children?: MenuItem[];
  isActive: boolean;
}

export interface FAQ {
  id: string;
  question: LocalizedContent;
  answer: LocalizedContent;
  categoryId: string;
  tags: string[];
  order: number;
  isActive: boolean;
  helpful: number;
  notHelpful: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Announcement {
  id: string;
  title: LocalizedContent;
  message: LocalizedContent;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target: {
    userTypes?: ('all' | 'guests' | 'users' | 'providers' | 'admins')[];
    regions?: string[];
    pages?: string[];
    startDate?: Date;
    endDate?: Date;
  };
  display: {
    position: 'banner' | 'modal' | 'notification' | 'sidebar';
    dismissible: boolean;
    autoHide?: number; // seconds
    showOnce?: boolean;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentRevision {
  id: string;
  contentId: string;
  version: number;
  title: LocalizedContent;
  content: LocalizedContent;
  changeLog: string;
  changedBy: string;
  isPublished: boolean;
  createdAt: Date;
}

export interface ContentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  order: number;
  assignedRole: 'author' | 'editor' | 'reviewer' | 'admin';
  requiredActions: ('edit' | 'review' | 'approve' | 'publish')[];
  autoTransition?: boolean;
  nextStepId?: string;
}

// Search and filter interfaces
export interface ContentSearchParams {
  query?: string;
  type?: ContentPage['type'];
  status?: ContentPage['status'];
  categoryId?: string;
  authorId?: string;
  tags?: string[];
  language?: string;
  dateFrom?: Date;
  dateTo?: Date;
  featured?: boolean;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'views';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface MediaSearchParams {
  query?: string;
  type?: string;
  folder?: string;
  tags?: string[];
  uploadedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'name' | 'size' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Analytics interfaces
export interface ContentAnalytics {
  totalPages: number;
  publishedPages: number;
  draftPages: number;
  totalViews: number;
  popularContent: {
    id: string;
    title: string;
    views: number;
    type: string;
  }[];
  contentByType: {
    [type: string]: number;
  };
  contentByLanguage: {
    [language: string]: number;
  };
  monthlyViews: {
    month: string;
    views: number;
  }[];
  authorStats: {
    authorId: string;
    authorName: string;
    contentCount: number;
    totalViews: number;
  }[];
}

// Component props interfaces
export interface ContentEditorProps {
  contentId?: string;
  templateId?: string;
  type: ContentPage['type'];
  onSave?: (content: ContentPage) => void;
  onPublish?: (content: ContentPage) => void;
  readOnly?: boolean;
}

export interface MediaPickerProps {
  multiple?: boolean;
  accept?: string[];
  folder?: string;
  onSelect: (media: MediaLibrary | MediaLibrary[]) => void;
  onUpload?: (files: File[]) => void;
}

export interface ContentListProps {
  type?: ContentPage['type'];
  categoryId?: string;
  limit?: number;
  showFilters?: boolean;
  onSelect?: (content: ContentPage) => void;
}

export interface MenuBuilderProps {
  menuId?: string;
  location: ContentMenu['location'];
  onSave?: (menu: ContentMenu) => void;
}

// Translation interfaces
export interface TranslationProject {
  id: string;
  name: string;
  description: string;
  sourceLanguage: string;
  targetLanguages: string[];
  contentIds: string[];
  status: 'active' | 'completed' | 'paused';
  progress: {
    [language: string]: {
      completed: number;
      total: number;
      percentage: number;
    };
  };
  assignedTranslators: {
    [language: string]: string[]; // user IDs
  };
  deadline?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslationTask {
  id: string;
  projectId: string;
  contentId: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'reviewed' | 'approved';
  assignedTo?: string;
  reviewedBy?: string;
  priority: 'low' | 'normal' | 'high';
  deadline?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Admin interfaces
export interface CMSSettings {
  id: string;
  general: {
    siteName: LocalizedContent;
    siteDescription: LocalizedContent;
    defaultLanguage: string;
    availableLanguages: string[];
    timezone: string;
    dateFormat: string;
  };
  content: {
    defaultStatus: ContentPage['status'];
    enableRevisions: boolean;
    maxRevisions: number;
    enableWorkflow: boolean;
    defaultWorkflowId?: string;
    enableComments: boolean;
    moderateComments: boolean;
  };
  media: {
    maxFileSize: number; // in MB
    allowedTypes: string[];
    enableImageOptimization: boolean;
    thumbnailSizes: {
      small: { width: number; height: number };
      medium: { width: number; height: number };
      large: { width: number; height: number };
    };
  };
  seo: {
    enableSitemap: boolean;
    enableRobots: boolean;
    defaultMetaTitle: LocalizedContent;
    defaultMetaDescription: LocalizedContent;
    socialMedia: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
  cache: {
    enableCaching: boolean;
    cacheDuration: number; // in minutes
    cacheStrategy: 'memory' | 'redis' | 'file';
  };
  notifications: {
    enableEmailNotifications: boolean;
    notifyOnPublish: boolean;
    notifyOnComment: boolean;
    notifyOnWorkflow: boolean;
    adminEmails: string[];
  };
  backup: {
    enableAutoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    includeMedia: boolean;
  };
  updatedBy: string;
  updatedAt: Date;
}

export interface ContentPermission {
  id: string;
  userId: string;
  contentId?: string;
  categoryId?: string;
  actions: ('view' | 'create' | 'edit' | 'delete' | 'publish' | 'translate')[];
  conditions?: {
    onlyOwn?: boolean;
    byStatus?: ContentPage['status'][];
    byType?: ContentPage['type'][];
  };
  grantedBy: string;
  expiresAt?: Date;
  createdAt: Date;
}

// Import/Export interfaces
export interface ContentExport {
  id: string;
  name: string;
  format: 'json' | 'xml' | 'csv' | 'markdown';
  filters: ContentSearchParams;
  includeMedia: boolean;
  includeRevisions: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  fileSize?: number;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ContentImport {
  id: string;
  name: string;
  format: 'json' | 'xml' | 'csv' | 'markdown';
  fileUrl: string;
  mapping: {
    [field: string]: string;
  };
  options: {
    skipDuplicates: boolean;
    updateExisting: boolean;
    importMedia: boolean;
    createCategories: boolean;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
  };
  errors?: string[];
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}
