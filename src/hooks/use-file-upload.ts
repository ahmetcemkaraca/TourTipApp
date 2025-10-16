'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  UploadConfig,
  FileUploadItem,
  UploadStatus,
  UploadResponse,
  UploadedFile,
  FileCategory,
  UploadProgress,
  UseFileUploadResult,
  UseImageUploadResult,
  ImageProcessingOptions,
  ThumbnailConfig
} from '@/types/upload';
import UploadService from '@/lib/upload-service';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import AnalyticsService from '@/lib/analytics-service';

export function useFileUpload(
  category: FileCategory,
  config?: Partial<UploadConfig>
): UseFileUploadResult {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    speed: 0,
    timeRemaining: 0,
    uploadedFiles: 0,
    totalFiles: 0,
  });

  const uploadConfig = {
    ...UploadService.getDefaultConfigForCategory(category),
    ...config,
  };

  const cancelTokensRef = useRef<{ [fileId: string]: AbortController }>({});

  // Add files to upload queue
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Check max files limit
    if (files.length + fileArray.length > uploadConfig.maxFiles) {
      toast.error(`En fazla ${uploadConfig.maxFiles} dosya yükleyebilirsiniz`);
      return;
    }

    const fileItems: FileUploadItem[] = fileArray.map((file) => {
      const validationError = UploadService.validateFile(file, uploadConfig);
      
      return {
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        status: validationError ? UploadStatus.ERROR : UploadStatus.PENDING,
        progress: 0,
        error: validationError || undefined,
        startedAt: new Date(),
      };
    });

    setFiles(prev => [...prev, ...fileItems]);

    // Track analytics
    AnalyticsService.trackEvent({
      name: 'files_added_to_upload_queue',
      parameters: {
        file_count: fileArray.length,
        category,
        total_size: fileArray.reduce((sum, file) => sum + file.size, 0),
      },
    });
  }, [files.length, uploadConfig, category, toast]);

  // Remove file from queue
  const removeFile = useCallback((fileId: string) => {
    // Cancel upload if in progress
    const cancelToken = cancelTokensRef.current[fileId];
    if (cancelToken) {
      cancelToken.abort();
      delete cancelTokensRef.current[fileId];
    }

    setFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  // Upload single file
  const uploadFile = useCallback(async (file: File): Promise<UploadResponse> => {
    const fileItem: FileUploadItem = {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      status: UploadStatus.UPLOADING,
      progress: 0,
      startedAt: new Date(),
    };

    setFiles(prev => [...prev, fileItem]);

    try {
      const result = await UploadService.uploadFile(
        file,
        category,
        uploadConfig,
        user?.uid,
        (uploadProgress) => {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, progress: uploadProgress.percentage }
              : f
          ));
        }
      );

      // Update file status
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { 
              ...f, 
              status: result.success ? UploadStatus.COMPLETED : UploadStatus.ERROR,
              progress: result.success ? 100 : f.progress,
              url: result.file?.url,
              downloadURL: result.file?.downloadURL,
              thumbnailURL: result.file?.thumbnailURL,
              error: result.error,
              uploadedAt: result.success ? new Date() : undefined,
            }
          : f
      ));

      return result;
    } catch (error) {
      const uploadError = {
        code: 'upload_failed',
        message: 'Dosya yüklenirken bir hata oluştu',
        retryable: true,
      };

      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: UploadStatus.ERROR, error: uploadError }
          : f
      ));

      return { success: false, error: uploadError };
    }
  }, [category, uploadConfig, user?.uid]);

  // Upload all pending files
  const uploadFiles = useCallback(async (): Promise<UploadResponse[]> => {
    const pendingFiles = files.filter(f => f.status === UploadStatus.PENDING);
    
    if (pendingFiles.length === 0) {
      toast.info('Yüklenecek dosya bulunamadı');
      return [];
    }

    setIsUploading(true);

    try {
      // Update all pending files to uploading
      setFiles(prev => prev.map(f => 
        f.status === UploadStatus.PENDING 
          ? { ...f, status: UploadStatus.UPLOADING }
          : f
      ));

      const results = await UploadService.uploadFiles(
        pendingFiles.map(f => f.file),
        category,
        uploadConfig,
        user?.uid,
        (overallProgress) => {
          setProgress(overallProgress);
        }
      );

      // Update file statuses based on results
      results.forEach((result, index) => {
        const fileItem = pendingFiles[index];
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { 
                ...f, 
                status: result.success ? UploadStatus.COMPLETED : UploadStatus.ERROR,
                progress: result.success ? 100 : f.progress,
                url: result.file?.url,
                downloadURL: result.file?.downloadURL,
                thumbnailURL: result.file?.thumbnailURL,
                error: result.error,
                uploadedAt: result.success ? new Date() : undefined,
              }
            : f
        ));
      });

      const successfulUploads = results.filter(r => r.success).length;
      const failedUploads = results.filter(r => !r.success).length;

      if (successfulUploads > 0) {
        toast.success(`${successfulUploads} dosya başarıyla yüklendi`);
      }
      
      if (failedUploads > 0) {
        toast.error(`${failedUploads} dosya yüklenirken hata oluştu`);
      }

      return results;
    } catch (error) {
      console.error('Batch upload failed:', error);
      toast.error('Dosya yükleme işlemi başarısız');
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [files, category, uploadConfig, user?.uid, toast]);

  // Cancel upload
  const cancelUpload = useCallback((fileId?: string) => {
    if (fileId) {
      const cancelToken = cancelTokensRef.current[fileId];
      if (cancelToken) {
        cancelToken.abort();
        delete cancelTokensRef.current[fileId];
      }

      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: UploadStatus.CANCELLED }
          : f
      ));
    } else {
      // Cancel all uploads
      Object.values(cancelTokensRef.current).forEach(token => token.abort());
      cancelTokensRef.current = {};
      
      setFiles(prev => prev.map(f => 
        f.status === UploadStatus.UPLOADING 
          ? { ...f, status: UploadStatus.CANCELLED }
          : f
      ));
      
      setIsUploading(false);
    }
  }, []);

  // Pause upload (simplified - would need more complex implementation)
  const pauseUpload = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: UploadStatus.PAUSED }
        : f
    ));
  }, []);

  // Resume upload
  const resumeUpload = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: UploadStatus.UPLOADING }
        : f
    ));
  }, []);

  // Retry upload
  const retryUpload = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: UploadStatus.UPLOADING, progress: 0, error: undefined }
        : f
    ));

    try {
      const result = await UploadService.uploadFile(
        file.file,
        category,
        uploadConfig,
        user?.uid,
        (uploadProgress) => {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: uploadProgress.percentage }
              : f
          ));
        }
      );

      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: result.success ? UploadStatus.COMPLETED : UploadStatus.ERROR,
              progress: result.success ? 100 : f.progress,
              url: result.file?.url,
              downloadURL: result.file?.downloadURL,
              error: result.error,
              uploadedAt: result.success ? new Date() : undefined,
            }
          : f
      ));

      if (result.success) {
        toast.success('Dosya başarıyla yüklendi');
      } else {
        toast.error('Dosya yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Retry upload failed:', error);
      toast.error('Yeniden yükleme başarısız');
    }
  }, [files, category, uploadConfig, user?.uid, toast]);

  // Clear completed files
  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== UploadStatus.COMPLETED));
  }, []);

  // Clear all files
  const clearAll = useCallback(() => {
    // Cancel any ongoing uploads
    Object.values(cancelTokensRef.current).forEach(token => token.abort());
    cancelTokensRef.current = {};
    
    setFiles([]);
    setIsUploading(false);
    setProgress({
      loaded: 0,
      total: 0,
      percentage: 0,
      speed: 0,
      timeRemaining: 0,
      uploadedFiles: 0,
      totalFiles: 0,
    });
  }, []);

  // Get files by status
  const getFilesByStatus = useCallback((status: UploadStatus) => {
    return files.filter(f => f.status === status);
  }, [files]);

  // Get total progress
  const getTotalProgress = useCallback(() => {
    if (files.length === 0) return 0;
    
    const totalProgress = files.reduce((sum, file) => sum + file.progress, 0);
    return totalProgress / files.length;
  }, [files]);

  // Get uploaded files
  const getUploadedFiles = useCallback((): UploadedFile[] => {
    return files
      .filter(f => f.status === UploadStatus.COMPLETED && f.downloadURL)
      .map(f => ({
        id: f.id,
        name: f.name,
        originalName: f.name,
        url: f.url!,
        downloadURL: f.downloadURL!,
        thumbnailURL: f.thumbnailURL,
        type: f.type,
        size: f.size,
        metadata: {
          originalName: f.name,
          contentType: f.type,
          size: f.size,
          lastModified: new Date(),
          category,
          userId: user?.uid,
        },
        uploadedAt: f.uploadedAt!,
        path: '',
        bucket: '',
      }));
  }, [files, category, user?.uid]);

  const hasErrors = files.some(f => f.status === UploadStatus.ERROR);

  return {
    files,
    isUploading,
    hasErrors,
    progress,
    addFiles,
    removeFile,
    uploadFiles,
    uploadFile,
    cancelUpload,
    pauseUpload,
    resumeUpload,
    retryUpload,
    clearCompleted,
    clearAll,
    getFilesByStatus,
    getTotalProgress,
    getUploadedFiles,
  };
}

// Extended hook for image uploads
export function useImageUpload(
  category: FileCategory,
  config?: Partial<UploadConfig>
): UseImageUploadResult {
  const baseHook = useFileUpload(category, {
    ...config,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
  });

  const [previewImages, setPreviewImages] = useState<{ [fileId: string]: string }>({});

  // Process image with options
  const processImage = useCallback(async (
    file: File, 
    options: ImageProcessingOptions
  ): Promise<File> => {
    return UploadService.processImage(file, options);
  }, []);

  // Generate thumbnails
  const generateThumbnails = useCallback(async (
    file: File, 
    config: ThumbnailConfig
  ): Promise<UploadedFile[]> => {
    // This would typically be handled server-side
    console.log('Thumbnail generation:', config);
    return [];
  }, []);

  // Crop image
  const cropImage = useCallback(async (
    file: File, 
    cropArea: ImageProcessingOptions['crop']
  ): Promise<File> => {
    return processImage(file, { crop: cropArea });
  }, [processImage]);

  // Resize image
  const resizeImage = useCallback(async (
    file: File, 
    width: number, 
    height: number
  ): Promise<File> => {
    return processImage(file, {
      resize: { width, height, maintainAspectRatio: true }
    });
  }, [processImage]);

  // Generate preview
  const generatePreview = useCallback((file: File): string => {
    const url = URL.createObjectURL(file);
    return url;
  }, []);

  // Generate preview for uploaded file
  useEffect(() => {
    const newPreviews: { [fileId: string]: string } = {};
    
    baseHook.files.forEach(fileItem => {
      if (fileItem.type.startsWith('image/') && !previewImages[fileItem.id]) {
        newPreviews[fileItem.id] = generatePreview(fileItem.file);
      }
    });

    if (Object.keys(newPreviews).length > 0) {
      setPreviewImages(prev => ({ ...prev, ...newPreviews }));
    }
  }, [baseHook.files, previewImages, generatePreview]);

  // Revoke preview URL
  const revokePreview = useCallback((fileId: string) => {
    const url = previewImages[fileId];
    if (url) {
      URL.revokeObjectURL(url);
      setPreviewImages(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[fileId];
        return newPreviews;
      });
    }
  }, [previewImages]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewImages).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previewImages]);

  return {
    ...baseHook,
    processImage,
    generateThumbnails,
    cropImage,
    resizeImage,
    previewImages,
    generatePreview,
    revokePreview,
  };
}

// Hook for document uploads
export function useDocumentUpload(config?: Partial<UploadConfig>) {
  return useFileUpload(FileCategory.DOCUMENT, {
    ...config,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    autoResize: false,
    generateThumbnails: false,
  });
}

// Hook for avatar uploads
export function useAvatarUpload(config?: Partial<UploadConfig>) {
  return useImageUpload(FileCategory.AVATAR, {
    ...config,
    maxFiles: 1,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    autoResize: true,
    generateThumbnails: true,
  });
}

export default useFileUpload;
