// File Upload Types for TourTrip.app
export interface UploadConfig {
  maxFileSize: number; // bytes
  maxFiles: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  uploadPath: string;
  autoResize: boolean;
  generateThumbnails: boolean;
  compressionQuality: number; // 0-1
  progressTracking: boolean;
  chunkSize: number; // bytes for chunked upload
  retryAttempts: number;
  concurrent: boolean;
  maxConcurrent: number;
}

export interface FileUploadItem {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  status: UploadStatus;
  progress: number;
  url?: string;
  downloadURL?: string;
  thumbnailURL?: string;
  metadata?: FileMetadata;
  error?: UploadError;
  uploadedAt?: Date;
  startedAt?: Date;
}

export enum UploadStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export interface FileMetadata {
  originalName: string;
  contentType: string;
  size: number;
  lastModified: Date;
  width?: number;
  height?: number;
  duration?: number; // for videos/audio
  compression?: string;
  hash?: string;
  userId?: string;
  category?: FileCategory;
  tags?: string[];
  alt?: string;
  caption?: string;
  isPublic?: boolean;
}

export enum FileCategory {
  PROFILE_PHOTO = 'profile_photo',
  TOUR_IMAGE = 'tour_image',
  TOUR_GALLERY = 'tour_gallery',
  RESTAURANT_IMAGE = 'restaurant_image',
  SHOP_IMAGE = 'shop_image',
  REVIEW_PHOTO = 'review_photo',
  DOCUMENT = 'document',
  AVATAR = 'avatar',
  BANNER = 'banner',
  LOGO = 'logo',
  CERTIFICATE = 'certificate',
  MENU = 'menu',
  BROCHURE = 'brochure'
}

export interface UploadError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  uploadedFiles: number;
  totalFiles: number;
}

export interface UploadResponse {
  success: boolean;
  file?: UploadedFile;
  error?: UploadError;
  progress?: UploadProgress;
}

export interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  downloadURL: string;
  thumbnailURL?: string;
  type: string;
  size: number;
  metadata: FileMetadata;
  uploadedAt: Date;
  path: string;
  bucket: string;
}

// Image processing options
export interface ImageProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
    upscale?: boolean;
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotate?: number;
  flip?: 'horizontal' | 'vertical' | 'both';
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number; // 0-100
  watermark?: {
    text?: string;
    image?: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
  };
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

export interface ThumbnailConfig {
  sizes: ThumbnailSize[];
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  maintain_aspect_ratio: boolean;
}

export interface ThumbnailSize {
  name: string;
  width: number;
  height: number;
  suffix: string;
}

// Chunked upload for large files
export interface ChunkUploadConfig {
  chunkSize: number;
  maxRetries: number;
  retryDelay: number;
  parallel: boolean;
  maxParallel: number;
}

export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  size: number;
  uploadId: string;
  etag?: string;
  uploaded: boolean;
}

// Upload validation
export interface UploadValidation {
  type: 'file_type' | 'file_size' | 'image_dimensions' | 'video_duration' | 'custom';
  validator: (file: File) => boolean | Promise<boolean>;
  message: string;
  blocking: boolean;
}

export interface FileTypeValidation {
  allowedTypes: string[];
  allowedExtensions: string[];
  blockExecutables: boolean;
  customValidator?: (file: File) => boolean;
}

export interface FileSizeValidation {
  maxSize: number;
  minSize?: number;
  maxTotalSize?: number;
}

export interface ImageValidation {
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number;
  allowedFormats?: string[];
}

// Security scanning
export interface SecurityScan {
  enabled: boolean;
  antiVirus: boolean;
  malwareDetection: boolean;
  contentValidation: boolean;
  metadataStripping: boolean;
  hashValidation: boolean;
}

// Upload hooks interfaces
export interface UseFileUploadResult {
  // State
  files: FileUploadItem[];
  isUploading: boolean;
  hasErrors: boolean;
  progress: UploadProgress;
  
  // Actions
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  uploadFiles: () => Promise<UploadResponse[]>;
  uploadFile: (file: File) => Promise<UploadResponse>;
  cancelUpload: (id?: string) => void;
  pauseUpload: (id: string) => void;
  resumeUpload: (id: string) => void;
  retryUpload: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  
  // Utils
  getFilesByStatus: (status: UploadStatus) => FileUploadItem[];
  getTotalProgress: () => number;
  getUploadedFiles: () => UploadedFile[];
}

export interface UseImageUploadResult extends UseFileUploadResult {
  // Image specific
  processImage: (file: File, options: ImageProcessingOptions) => Promise<File>;
  generateThumbnails: (file: File, config: ThumbnailConfig) => Promise<UploadedFile[]>;
  cropImage: (file: File, cropArea: ImageProcessingOptions['crop']) => Promise<File>;
  resizeImage: (file: File, width: number, height: number) => Promise<File>;
  
  // Preview
  previewImages: { [fileId: string]: string };
  generatePreview: (file: File) => string;
  revokePreview: (fileId: string) => void;
}

export interface UseChunkedUploadResult {
  // Chunked upload specific
  uploadLargeFile: (file: File, config?: ChunkUploadConfig) => Promise<UploadResponse>;
  pauseChunkedUpload: (uploadId: string) => void;
  resumeChunkedUpload: (uploadId: string) => void;
  getChunkProgress: (uploadId: string) => { completed: number; total: number };
  
  // State
  activeUploads: { [uploadId: string]: ChunkInfo[] };
  chunkProgress: { [uploadId: string]: number };
}

// Cloud Functions types
export interface FileProcessingJob {
  id: string;
  fileId: string;
  type: 'thumbnail' | 'resize' | 'convert' | 'optimize' | 'scan';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  options: any;
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageOptimizationRequest {
  sourceUrl: string;
  targetPath: string;
  options: ImageProcessingOptions;
  thumbnails?: ThumbnailConfig;
  userId: string;
  category: FileCategory;
}

export interface VirusScanResult {
  clean: boolean;
  threats: string[];
  scanEngine: string;
  scanTime: Date;
  quarantined: boolean;
}

// Upload components props
export interface FileUploadProps {
  config: UploadConfig;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: UploadError) => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  dragAndDrop?: boolean;
  showProgress?: boolean;
  showPreview?: boolean;
  maxFiles?: number;
  category?: FileCategory;
}

export interface FileDropzoneProps extends FileUploadProps {
  children?: React.ReactNode;
  dropzoneText?: string;
  browseText?: string;
  replaceText?: string;
  maxSizeText?: string;
  allowedTypesText?: string;
}

export interface FileListProps {
  files: FileUploadItem[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
  showProgress?: boolean;
  showThumbnails?: boolean;
  allowRemove?: boolean;
  allowRetry?: boolean;
  className?: string;
}

export interface FileProgressProps {
  file: FileUploadItem;
  showDetails?: boolean;
  showCancel?: boolean;
  showRetry?: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

// Upload analytics
export interface UploadAnalytics {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  totalSize: number;
  averageUploadTime: number;
  errorTypes: { [error: string]: number };
  fileTypes: { [type: string]: number };
  uploadSources: { [source: string]: number };
}

// Storage management
export interface StorageQuota {
  total: number;
  used: number;
  available: number;
  percentage: number;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
}

export interface StorageUsage {
  category: FileCategory;
  count: number;
  size: number;
  percentage: number;
}

export interface FileCleanupOptions {
  deleteOrphaned: boolean;
  deleteOlderThan: number; // days
  deleteByCategory: FileCategory[];
  dryRun: boolean;
  batchSize: number;
}

// CDN integration
export interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  cacheTTL: number;
  transformations: boolean;
  optimizations: boolean;
  compression: boolean;
  webpSupport: boolean;
  avifSupport: boolean;
}

export interface CDNTransformation {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  crop?: 'fill' | 'fit' | 'scale' | 'crop';
  gravity?: 'auto' | 'center' | 'face' | 'faces';
  progressive?: boolean;
  strip?: boolean;
}

// Error codes
export enum UploadErrorCode {
  FILE_TOO_LARGE = 'file_too_large',
  INVALID_FILE_TYPE = 'invalid_file_type',
  QUOTA_EXCEEDED = 'quota_exceeded',
  NETWORK_ERROR = 'network_error',
  SERVER_ERROR = 'server_error',
  VALIDATION_ERROR = 'validation_error',
  SECURITY_SCAN_FAILED = 'security_scan_failed',
  PROCESSING_ERROR = 'processing_error',
  PERMISSION_DENIED = 'permission_denied',
  UPLOAD_CANCELLED = 'upload_cancelled',
  CHUNK_UPLOAD_FAILED = 'chunk_upload_failed',
  THUMBNAIL_GENERATION_FAILED = 'thumbnail_generation_failed'
}

export interface UploadErrorMessages {
  [UploadErrorCode.FILE_TOO_LARGE]: string;
  [UploadErrorCode.INVALID_FILE_TYPE]: string;
  [UploadErrorCode.QUOTA_EXCEEDED]: string;
  [UploadErrorCode.NETWORK_ERROR]: string;
  [UploadErrorCode.SERVER_ERROR]: string;
  [UploadErrorCode.VALIDATION_ERROR]: string;
  [UploadErrorCode.SECURITY_SCAN_FAILED]: string;
  [UploadErrorCode.PROCESSING_ERROR]: string;
  [UploadErrorCode.PERMISSION_DENIED]: string;
  [UploadErrorCode.UPLOAD_CANCELLED]: string;
  [UploadErrorCode.CHUNK_UPLOAD_FAILED]: string;
  [UploadErrorCode.THUMBNAIL_GENERATION_FAILED]: string;
}
