'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
  progress?: number;
  variant?: 'spinner' | 'progress' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  blur?: boolean;
  className?: string;
  overlayClassName?: string;
  spinnerClassName?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  children,
  message,
  progress,
  variant = 'spinner',
  size = 'md',
  blur = true,
  className,
  overlayClassName,
  spinnerClassName,
}) => {
  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <LoadingSpinner 
            size={size} 
            text={message}
            showText={!!message}
            className={spinnerClassName}
          />
        );

      case 'progress':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress || 0}%` }}
              />
            </div>
            {message && (
              <p className="text-sm text-gray-600 font-medium">{message}</p>
            )}
            {progress !== undefined && (
              <p className="text-xs text-gray-500">{Math.round(progress)}%</p>
            )}
          </div>
        );

      case 'dots':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 bg-blue-600 rounded-full animate-bounce',
                    size === 'sm' && 'w-1.5 h-1.5',
                    size === 'lg' && 'w-3 h-3'
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            {message && (
              <p className="text-sm text-gray-600 font-medium">{message}</p>
            )}
          </div>
        );

      case 'pulse':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              'bg-blue-600 rounded-full animate-pulse',
              size === 'sm' && 'w-8 h-8',
              size === 'md' && 'w-12 h-12',
              size === 'lg' && 'w-16 h-16'
            )} />
            {message && (
              <p className="text-sm text-gray-600 font-medium">{message}</p>
            )}
          </div>
        );

      default:
        return <LoadingSpinner size={size} text={message} showText={!!message} />;
    }
  };

  return (
    <div className={cn('relative', className)}>
      {children}
      
      {loading && (
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center z-50',
            'bg-white/80 dark:bg-gray-900/80',
            blur && 'backdrop-blur-sm',
            overlayClassName
          )}
        >
          {renderLoader()}
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;
