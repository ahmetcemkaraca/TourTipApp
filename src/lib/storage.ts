// Firebase Storage utilities
import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from './firebase';

// Storage paths
export const STORAGE_PATHS = {
  TOUR_IMAGES: 'tours',
  USER_PROFILES: 'profiles',
  REVIEW_IMAGES: 'reviews',
  MARKETPLACE_IMAGES: 'marketplace',
} as const;

// File upload progress callback type
export type UploadProgressCallback = (progress: number) => void;

// Upload result type
export interface UploadResult {
  url: string;
  path: string;
  metadata: any;
}

// Image upload utility
export class StorageService {
  // Upload single file
  static async uploadFile(
    file: File,
    path: string,
    onProgress?: UploadProgressCallback
  ): Promise<UploadResult> {
    try {
      const storageRef = ref(storage, path);
      
      if (onProgress) {
        // Use resumable upload for progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress);
            },
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({
                  url,
                  path,
                  metadata: uploadTask.snapshot.metadata,
                });
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      } else {
        // Simple upload without progress
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        return {
          url,
          path,
          metadata: snapshot.metadata,
        };
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Upload multiple files
  static async uploadFiles(
    files: File[],
    basePath: string,
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<UploadResult[]> {
    const uploads = files.map((file, index) => {
      const fileName = `${Date.now()}_${index}_${file.name}`;
      const filePath = `${basePath}/${fileName}`;
      
      return this.uploadFile(
        file, 
        filePath, 
        onProgress ? (progress) => onProgress(index, progress) : undefined
      );
    });

    return Promise.all(uploads);
  }

  // Upload tour images
  static async uploadTourImages(
    tourId: string,
    images: File[],
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<string[]> {
    const basePath = `${STORAGE_PATHS.TOUR_IMAGES}/${tourId}`;
    const results = await this.uploadFiles(images, basePath, onProgress);
    return results.map(result => result.url);
  }

  // Upload user profile picture
  static async uploadProfilePicture(
    userId: string,
    image: File,
    onProgress?: UploadProgressCallback
  ): Promise<string> {
    const fileName = `${Date.now()}_${image.name}`;
    const path = `${STORAGE_PATHS.USER_PROFILES}/${userId}/${fileName}`;
    const result = await this.uploadFile(image, path, onProgress);
    return result.url;
  }

  // Upload review images
  static async uploadReviewImages(
    reviewId: string,
    images: File[],
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<string[]> {
    const basePath = `${STORAGE_PATHS.REVIEW_IMAGES}/${reviewId}`;
    const results = await this.uploadFiles(images, basePath, onProgress);
    return results.map(result => result.url);
  }

  // Delete file
  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Delete multiple files
  static async deleteFiles(paths: string[]): Promise<void> {
    const deletions = paths.map(path => this.deleteFile(path));
    await Promise.all(deletions);
  }

  // List files in a directory
  static async listFiles(path: string): Promise<string[]> {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      
      const urls = await Promise.all(
        result.items.map(itemRef => getDownloadURL(itemRef))
      );
      
      return urls;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Get file URL from path
  static async getFileUrl(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }
}

// Image validation utilities
export const ImageValidation = {
  // Validate file type
  isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  },

  // Validate file size (default: 5MB)
  isValidSize(file: File, maxSizeInMB: number = 5): boolean {
    const maxSize = maxSizeInMB * 1024 * 1024; // Convert to bytes
    return file.size <= maxSize;
  },

  // Validate image dimensions
  async isValidDimensions(
    file: File, 
    minWidth: number = 0, 
    minHeight: number = 0,
    maxWidth: number = 4000,
    maxHeight: number = 4000
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const { width, height } = img;
        const valid = width >= minWidth && 
                     height >= minHeight && 
                     width <= maxWidth && 
                     height <= maxHeight;
        resolve(valid);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      
      img.src = url;
    });
  },

  // Comprehensive validation
  async validateImage(
    file: File,
    options: {
      maxSizeInMB?: number;
      minWidth?: number;
      minHeight?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Type validation
    if (!this.isValidImageType(file)) {
      errors.push('Geçersiz dosya formatı. JPEG, PNG veya WebP formatı kullanın.');
    }

    // Size validation
    if (!this.isValidSize(file, options.maxSizeInMB)) {
      errors.push(`Dosya boyutu ${options.maxSizeInMB || 5}MB'den küçük olmalıdır.`);
    }

    // Dimension validation
    if (options.minWidth || options.minHeight || options.maxWidth || options.maxHeight) {
      const validDimensions = await this.isValidDimensions(
        file,
        options.minWidth,
        options.minHeight,
        options.maxWidth,
        options.maxHeight
      );

      if (!validDimensions) {
        errors.push('Resim boyutları gereksinimler ile uyumlu değil.');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
};

// Image compression utility
export const ImageCompression = {
  // Compress image before upload
  async compressImage(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number; // 0-1
    } = {}
  ): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8
    } = options;

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Return original if compression fails
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
};
