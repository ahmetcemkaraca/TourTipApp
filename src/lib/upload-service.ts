// File Upload Service for TourTrip.app
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  getMetadata,
  uploadBytes
} from 'firebase/storage';
import { doc, setDoc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { storage, db } from './firebase';
import {
  UploadConfig,
  FileUploadItem,
  UploadStatus,
  UploadError,
  UploadResponse,
  UploadedFile,
  FileMetadata,
  FileCategory,
  ImageProcessingOptions,
  ThumbnailConfig,
  ChunkUploadConfig,
  SecurityScan,
  UploadErrorCode,
  UploadProgress
} from '@/types/upload';
import AnalyticsService from './analytics-service';

export class UploadService {
  private static defaultConfig: UploadConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
    uploadPath: 'uploads',
    autoResize: true,
    generateThumbnails: true,
    compressionQuality: 0.8,
    progressTracking: true,
    chunkSize: 1024 * 1024, // 1MB chunks
    retryAttempts: 3,
    concurrent: true,
    maxConcurrent: 3,
  };

  private static securityConfig: SecurityScan = {
    enabled: true,
    antiVirus: false, // Would require external service
    malwareDetection: false,
    contentValidation: true,
    metadataStripping: true,
    hashValidation: true,
  };

  // Validate file before upload
  static validateFile(file: File, config: UploadConfig = this.defaultConfig): UploadError | null {
    // Check file size
    if (file.size > config.maxFileSize) {
      return {
        code: UploadErrorCode.FILE_TOO_LARGE,
        message: `Dosya boyutu ${this.formatFileSize(config.maxFileSize)} limitini aşıyor`,
        retryable: false,
      };
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      return {
        code: UploadErrorCode.INVALID_FILE_TYPE,
        message: `Desteklenmeyen dosya türü: ${file.type}`,
        retryable: false,
      };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.allowedExtensions.includes(extension)) {
      return {
        code: UploadErrorCode.INVALID_FILE_TYPE,
        message: `Desteklenmeyen dosya uzantısı: ${extension}`,
        retryable: false,
      };
    }

    // Additional security checks
    if (this.securityConfig.enabled) {
      const securityError = this.performSecurityChecks(file);
      if (securityError) return securityError;
    }

    return null;
  }

  // Perform basic security checks
  private static performSecurityChecks(file: File): UploadError | null {
    // Check for executable file extensions
    const executableExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (executableExtensions.includes(extension)) {
      return {
        code: UploadErrorCode.SECURITY_SCAN_FAILED,
        message: 'Çalıştırılabilir dosyalar güvenlik nedeniyle engellendi',
        retryable: false,
      };
    }

    // Check for suspicious file names
    const suspiciousPatterns = [/autorun/i, /desktop\.ini/i, /thumbs\.db/i];
    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      return {
        code: UploadErrorCode.SECURITY_SCAN_FAILED,
        message: 'Şüpheli dosya adı tespit edildi',
        retryable: false,
      };
    }

    return null;
  }

  // Generate unique file path
  static generateFilePath(
    file: File, 
    category: FileCategory, 
    userId?: string,
    customPath?: string
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop()?.toLowerCase();
    const baseName = file.name.split('.').slice(0, -1).join('.');
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    
    if (customPath) {
      return `${customPath}/${timestamp}_${random}.${extension}`;
    }
    
    const categoryPath = this.getCategoryPath(category);
    const userPath = userId ? `users/${userId}` : 'anonymous';
    
    return `${categoryPath}/${userPath}/${timestamp}_${sanitizedName}_${random}.${extension}`;
  }

  // Get category-specific upload path
  private static getCategoryPath(category: FileCategory): string {
    const categoryPaths = {
      [FileCategory.PROFILE_PHOTO]: 'profiles',
      [FileCategory.TOUR_IMAGE]: 'tours',
      [FileCategory.TOUR_GALLERY]: 'tours/gallery',
      [FileCategory.RESTAURANT_IMAGE]: 'restaurants',
      [FileCategory.SHOP_IMAGE]: 'shops',
      [FileCategory.REVIEW_PHOTO]: 'reviews',
      [FileCategory.DOCUMENT]: 'documents',
      [FileCategory.AVATAR]: 'avatars',
      [FileCategory.BANNER]: 'banners',
      [FileCategory.LOGO]: 'logos',
      [FileCategory.CERTIFICATE]: 'certificates',
      [FileCategory.MENU]: 'menus',
      [FileCategory.BROCHURE]: 'brochures',
    };

    return categoryPaths[category] || 'general';
  }

  // Upload single file with progress tracking
  static async uploadFile(
    file: File,
    category: FileCategory,
    config: UploadConfig = this.defaultConfig,
    userId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    try {
      // Validate file
      const validationError = this.validateFile(file, config);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Generate file path
      const filePath = this.generateFilePath(file, category, userId);
      const storageRef = ref(storage, filePath);

      // Prepare metadata
      const metadata: FileMetadata = {
        originalName: file.name,
        contentType: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified),
        userId,
        category,
        isPublic: this.isPublicCategory(category),
      };

      // Process file if needed (compression, resizing)
      let processedFile = file;
      if (this.isImageFile(file) && config.autoResize) {
        processedFile = await this.processImage(file, {
          resize: { width: 1920, height: 1080, maintainAspectRatio: true },
          quality: config.compressionQuality * 100,
          format: 'jpeg',
        });
      }

      // Upload file
      let uploadTask: any;
      let downloadURL: string;

      if (config.progressTracking && onProgress) {
        // Upload with progress tracking
        uploadTask = uploadBytesResumable(storageRef, processedFile, {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            category,
            userId: userId || '',
            uploadedAt: new Date().toISOString(),
          },
        });

        // Track upload progress
        uploadTask.on('state_changed', 
          (snapshot: any) => {
            const progress = {
              loaded: snapshot.bytesTransferred,
              total: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              speed: 0, // Would calculate from time deltas
              timeRemaining: 0,
              uploadedFiles: 0,
              totalFiles: 1,
            };
            onProgress(progress);
          },
          (error: any) => {
            throw error;
          }
        );

        await uploadTask;
        downloadURL = await getDownloadURL(storageRef);
      } else {
        // Simple upload without progress
        await uploadBytes(storageRef, processedFile);
        downloadURL = await getDownloadURL(storageRef);
      }

      // Get file metadata from Storage
      const storageMetadata = await getMetadata(storageRef);

      // Create uploaded file record
      const uploadedFile: UploadedFile = {
        id: this.generateFileId(),
        name: file.name,
        originalName: file.name,
        url: downloadURL,
        downloadURL,
        type: file.type,
        size: file.size,
        metadata,
        uploadedAt: new Date(),
        path: filePath,
        bucket: storageMetadata.bucket,
      };

      // Generate thumbnails for images
      if (this.isImageFile(file) && config.generateThumbnails) {
        try {
          const thumbnailURL = await this.generateThumbnail(uploadedFile, {
            sizes: [
              { name: 'small', width: 150, height: 150, suffix: '_thumb' },
              { name: 'medium', width: 400, height: 400, suffix: '_medium' },
            ],
            format: 'jpeg',
            quality: 80,
            maintain_aspect_ratio: true,
          });
          uploadedFile.thumbnailURL = thumbnailURL;
        } catch (thumbnailError) {
          console.warn('Thumbnail generation failed:', thumbnailError);
          // Continue without thumbnail
        }
      }

      // Store file record in Firestore
      await this.storeFileRecord(uploadedFile);

      // Track analytics
      AnalyticsService.trackEvent({
        name: 'file_upload_completed',
        parameters: {
          file_type: file.type,
          file_size: file.size,
          category,
          processing_time: Date.now() - Date.now(), // Would track actual time
        },
      });

      return { success: true, file: uploadedFile };

    } catch (error) {
      console.error('File upload failed:', error);
      
      const uploadError: UploadError = {
        code: UploadErrorCode.SERVER_ERROR,
        message: 'Dosya yükleme başarısız',
        details: error,
        retryable: true,
      };

      AnalyticsService.trackEvent({
        name: 'file_upload_failed',
        parameters: {
          error_code: uploadError.code,
          file_type: file.type,
          file_size: file.size,
          category,
        },
      });

      return { success: false, error: uploadError };
    }
  }

  // Upload multiple files with concurrency control
  static async uploadFiles(
    files: File[],
    category: FileCategory,
    config: UploadConfig = this.defaultConfig,
    userId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse[]> {
    const results: UploadResponse[] = [];
    const totalFiles = files.length;
    let completedFiles = 0;

    if (config.concurrent) {
      // Concurrent upload with limit
      const chunks = this.chunkArray(files, config.maxConcurrent);
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (file) => {
          const result = await this.uploadFile(file, category, config, userId, (fileProgress) => {
            if (onProgress) {
              const overallProgress: UploadProgress = {
                ...fileProgress,
                uploadedFiles: completedFiles,
                totalFiles,
                percentage: ((completedFiles + fileProgress.percentage / 100) / totalFiles) * 100,
              };
              onProgress(overallProgress);
            }
          });
          
          completedFiles++;
          return result;
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }
    } else {
      // Sequential upload
      for (const file of files) {
        const result = await this.uploadFile(file, category, config, userId, (fileProgress) => {
          if (onProgress) {
            const overallProgress: UploadProgress = {
              ...fileProgress,
              uploadedFiles: completedFiles,
              totalFiles,
              percentage: ((completedFiles + fileProgress.percentage / 100) / totalFiles) * 100,
            };
            onProgress(overallProgress);
          }
        });
        
        results.push(result);
        completedFiles++;
      }
    }

    return results;
  }

  // Process image (resize, compress, etc.)
  static async processImage(file: File, options: ImageProcessingOptions): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate dimensions
          let { width, height } = img;
          
          if (options.resize) {
            const resize = options.resize;
            if (resize.maintainAspectRatio) {
              const aspectRatio = width / height;
              if (resize.width && resize.height) {
                if (width > height) {
                  width = resize.width;
                  height = resize.width / aspectRatio;
                } else {
                  height = resize.height;
                  width = resize.height * aspectRatio;
                }
              } else if (resize.width) {
                width = resize.width;
                height = resize.width / aspectRatio;
              } else if (resize.height) {
                height = resize.height;
                width = resize.height * aspectRatio;
              }
            } else {
              width = resize.width || width;
              height = resize.height || height;
            }
          }

          // Set canvas size
          canvas.width = width;
          canvas.height = height;

          // Apply transformations
          if (ctx) {
            // Rotation
            if (options.rotate) {
              ctx.translate(width / 2, height / 2);
              ctx.rotate((options.rotate * Math.PI) / 180);
              ctx.translate(-width / 2, -height / 2);
            }

            // Flip
            if (options.flip) {
              if (options.flip === 'horizontal' || options.flip === 'both') {
                ctx.scale(-1, 1);
                ctx.translate(-width, 0);
              }
              if (options.flip === 'vertical' || options.flip === 'both') {
                ctx.scale(1, -1);
                ctx.translate(0, -height);
              }
            }

            // Draw image
            ctx.drawImage(img, 0, 0, width, height);

            // Apply filters
            if (options.brightness !== undefined) {
              ctx.filter = `brightness(${options.brightness}%)`;
            }
            if (options.contrast !== undefined) {
              ctx.filter += ` contrast(${options.contrast}%)`;
            }
            if (options.saturation !== undefined) {
              ctx.filter += ` saturate(${options.saturation}%)`;
            }
            if (options.blur !== undefined) {
              ctx.filter += ` blur(${options.blur}px)`;
            }
          }

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, {
                  type: `image/${options.format || 'jpeg'}`,
                  lastModified: Date.now(),
                });
                resolve(processedFile);
              } else {
                reject(new Error('Canvas to blob conversion failed'));
              }
            },
            `image/${options.format || 'jpeg'}`,
            (options.quality || 80) / 100
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Generate thumbnail
  private static async generateThumbnail(
    uploadedFile: UploadedFile,
    config: ThumbnailConfig
  ): Promise<string> {
    // This would typically be handled by Cloud Functions
    // For now, return the original URL
    console.log('Thumbnail generation would be handled by Cloud Functions', config);
    return uploadedFile.downloadURL;
  }

  // Delete file
  static async deleteFile(filePath: string, fileId?: string): Promise<boolean> {
    try {
      // Delete from Storage
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);

      // Delete from Firestore
      if (fileId) {
        await deleteDoc(doc(db, 'uploadedFiles', fileId));
      }

      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  // Store file record in Firestore
  private static async storeFileRecord(uploadedFile: UploadedFile): Promise<void> {
    try {
      await setDoc(doc(db, 'uploadedFiles', uploadedFile.id), {
        ...uploadedFile,
        uploadedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to store file record:', error);
      // Don't throw - file was uploaded successfully to Storage
    }
  }

  // Utility methods
  private static isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private static isPublicCategory(category: FileCategory): boolean {
    const publicCategories = [
      FileCategory.TOUR_IMAGE,
      FileCategory.TOUR_GALLERY,
      FileCategory.RESTAURANT_IMAGE,
      FileCategory.SHOP_IMAGE,
      FileCategory.BANNER,
      FileCategory.LOGO,
    ];
    return publicCategories.includes(category);
  }

  private static generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get default configuration for category
  static getDefaultConfigForCategory(category: FileCategory): UploadConfig {
    const baseConfig = { ...this.defaultConfig };

    switch (category) {
      case FileCategory.PROFILE_PHOTO:
      case FileCategory.AVATAR:
        return {
          ...baseConfig,
          maxFileSize: 5 * 1024 * 1024, // 5MB
          maxFiles: 1,
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
          autoResize: true,
          generateThumbnails: true,
        };

      case FileCategory.TOUR_IMAGE:
      case FileCategory.RESTAURANT_IMAGE:
      case FileCategory.SHOP_IMAGE:
        return {
          ...baseConfig,
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxFiles: 10,
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
          autoResize: true,
          generateThumbnails: true,
        };

      case FileCategory.DOCUMENT:
      case FileCategory.CERTIFICATE:
      case FileCategory.MENU:
      case FileCategory.BROCHURE:
        return {
          ...baseConfig,
          maxFileSize: 20 * 1024 * 1024, // 20MB
          maxFiles: 5,
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
          autoResize: false,
          generateThumbnails: false,
        };

      default:
        return baseConfig;
    }
  }
}

export default UploadService;
