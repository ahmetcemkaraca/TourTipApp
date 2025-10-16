'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'pulse' | 'wave' | 'none';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  width?: string | number;
  height?: string | number;
  count?: number;
  spacing?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'pulse',
  rounded = 'md',
  width,
  height,
  count = 1,
  spacing = 'space-y-2',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const style = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  if (count === 1) {
    return (
      <div
        className={cn(
          baseClasses,
          variantClasses[variant],
          roundedClasses[rounded],
          className
        )}
        style={style}
      />
    );
  }

  return (
    <div className={cn('flex flex-col', spacing)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            baseClasses,
            variantClasses[variant],
            roundedClasses[rounded],
            className
          )}
          style={style}
        />
      ))}
    </div>
  );
};

// Predefined skeleton components
const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height={16}
        width={index === lines - 1 ? '75%' : '100%'}
        className="h-4"
      />
    ))}
  </div>
);

const SkeletonButton: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };

  return (
    <Skeleton
      className={cn(sizeClasses[size], 'rounded-md', className)}
    />
  );
};

const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12',
  };

  return (
    <Skeleton
      className={cn(sizeClasses[size], 'rounded-full', className)}
    />
  );
};

const SkeletonCard: React.FC<{
  className?: string;
  hasImage?: boolean;
  hasAvatar?: boolean;
}> = ({ className, hasImage = true, hasAvatar = false }) => (
  <div className={cn('p-4 border rounded-lg space-y-4', className)}>
    {hasImage && (
      <Skeleton className="w-full h-48 rounded-md" />
    )}
    
    <div className="space-y-3">
      {hasAvatar && (
        <div className="flex items-center gap-3">
          <SkeletonAvatar />
          <div className="space-y-1 flex-1">
            <Skeleton height={16} width="60%" />
            <Skeleton height={14} width="40%" />
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Skeleton height={20} width="80%" />
        <SkeletonText lines={2} />
      </div>
      
      <div className="flex gap-2">
        <SkeletonButton size="sm" />
        <SkeletonButton size="sm" />
      </div>
    </div>
  </div>
);

const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => (
  <div className={cn('w-full space-y-2', className)}>
    {/* Header */}
    <div className="flex gap-4 p-4 border-b">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} height={16} width="100%" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4 p-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} height={16} width="100%" />
        ))}
      </div>
    ))}
  </div>
);

const SkeletonList: React.FC<{
  items?: number;
  hasAvatar?: boolean;
  hasIcon?: boolean;
  className?: string;
}> = ({ items = 5, hasAvatar = false, hasIcon = false, className }) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 p-3">
        {hasAvatar && <SkeletonAvatar />}
        {hasIcon && !hasAvatar && (
          <Skeleton className="h-5 w-5 rounded" />
        )}
        
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="70%" />
          <Skeleton height={14} width="50%" />
        </div>
        
        <Skeleton height={14} width="20%" />
      </div>
    ))}
  </div>
);

export {
  Skeleton,
  SkeletonText,
  SkeletonButton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
};

export default Skeleton;
