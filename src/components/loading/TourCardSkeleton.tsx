'use client';

import React from 'react';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TourCardSkeletonProps {
  className?: string;
  count?: number;
}

const TourCardSkeleton: React.FC<TourCardSkeletonProps> = ({
  className,
  count = 1,
}) => {
  const renderSkeleton = () => (
    <div className={cn('border rounded-lg overflow-hidden bg-white shadow-sm', className)}>
      {/* Image */}
      <Skeleton className="w-full h-48" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton height={24} width="85%" />
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="75%" />
        </div>
        
        {/* Location */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton height={16} width="40%" />
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-4 h-4 rounded" />
            ))}
          </div>
          <Skeleton height={16} width="30%" />
        </div>
        
        {/* Price and duration */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton height={14} width="60%" />
            <Skeleton height={20} width="40%" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton height={14} width="50%" />
            <Skeleton height={16} width="40%" />
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex gap-2">
          <Skeleton height={20} width="60px" rounded="full" />
          <Skeleton height={20} width="80px" rounded="full" />
          <Skeleton height={20} width="50px" rounded="full" />
        </div>
        
        {/* Button */}
        <Skeleton height={40} width="100%" className="rounded-md" />
      </div>
    </div>
  );

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

// Marketplace item skeleton
const MarketplaceItemSkeleton: React.FC<TourCardSkeletonProps> = ({
  className,
  count = 1,
}) => {
  const renderSkeleton = () => (
    <div className={cn('border rounded-lg overflow-hidden bg-white shadow-sm', className)}>
      {/* Image */}
      <Skeleton className="w-full h-32" />
      
      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <Skeleton height={18} width="80%" />
        
        {/* Category */}
        <Skeleton height={14} width="50%" />
        
        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-3 h-3 rounded" />
            ))}
          </div>
          <Skeleton height={14} width="30%" />
        </div>
        
        {/* Price */}
        <div className="flex items-center justify-between">
          <Skeleton height={16} width="40%" />
          <Skeleton height={14} width="30%" />
        </div>
      </div>
    </div>
  );

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

// Booking card skeleton
const BookingCardSkeleton: React.FC<TourCardSkeletonProps> = ({
  className,
  count = 1,
}) => {
  const renderSkeleton = () => (
    <div className={cn('border rounded-lg p-4 bg-white shadow-sm', className)}>
      <div className="flex items-start gap-4">
        {/* Image */}
        <Skeleton className="w-20 h-20 rounded-md flex-shrink-0" />
        
        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Title and status */}
          <div className="flex items-start justify-between">
            <Skeleton height={18} width="60%" />
            <Skeleton height={20} width="80px" rounded="full" />
          </div>
          
          {/* Date */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton height={14} width="40%" />
          </div>
          
          {/* Participants */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton height={14} width="30%" />
          </div>
          
          {/* Price */}
          <Skeleton height={16} width="25%" />
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Skeleton height={32} width="80px" />
          <Skeleton height={32} width="80px" />
        </div>
      </div>
    </div>
  );

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

// Dashboard stats skeleton
const DashboardStatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="border rounded-lg p-6 bg-white">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton height={14} width="60%" />
            <Skeleton height={24} width="80%" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
    ))}
  </div>
);

// Map skeleton
const MapSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('relative bg-gray-100 rounded-lg overflow-hidden', className)}>
    <Skeleton className="w-full h-full" />
    
    {/* Fake map controls */}
    <div className="absolute top-4 right-4 space-y-2">
      <Skeleton className="w-8 h-8 rounded" />
      <Skeleton className="w-8 h-8 rounded" />
    </div>
    
    {/* Fake markers */}
    <div className="absolute top-1/4 left-1/3">
      <Skeleton className="w-6 h-6 rounded-full" />
    </div>
    <div className="absolute top-2/3 right-1/4">
      <Skeleton className="w-6 h-6 rounded-full" />
    </div>
    <div className="absolute bottom-1/4 left-1/2">
      <Skeleton className="w-6 h-6 rounded-full" />
    </div>
  </div>
);

export {
  TourCardSkeleton,
  MarketplaceItemSkeleton,
  BookingCardSkeleton,
  DashboardStatsSkeleton,
  MapSkeleton,
};

export default TourCardSkeleton;
