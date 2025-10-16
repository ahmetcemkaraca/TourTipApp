'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { MobileContainerProps } from '@/types/mobile';
import { useMobile } from '@/hooks/use-mobile';

const MobileContainer = forwardRef<HTMLDivElement, MobileContainerProps>(({
  children,
  safeArea = true,
  fullHeight = false,
  className,
  ...props
}, ref) => {
  const { safeAreaInsets, isMobile, deviceInfo } = useMobile();

  // Calculate safe area padding
  const safeAreaStyles = safeArea ? {
    paddingTop: `${safeAreaInsets.top}px`,
    paddingRight: `${safeAreaInsets.right}px`,
    paddingBottom: `${safeAreaInsets.bottom}px`,
    paddingLeft: `${safeAreaInsets.left}px`,
  } : {};

  // Base container styles
  const containerClasses = cn(
    // Base styles
    'w-full',
    
    // Height handling
    fullHeight && 'min-h-screen',
    
    // Mobile-specific styles
    isMobile && [
      'touch-manipulation', // Optimize touch interactions
      'select-none', // Prevent text selection on mobile
      'overscroll-behavior-none', // Prevent bounce scrolling
    ],
    
    // Platform-specific styles
    deviceInfo.platform === 'ios' && 'webkit-touch-callout-none',
    deviceInfo.platform === 'android' && 'android-tap-highlight-transparent',
    
    className
  );

  return (
    <div
      ref={ref}
      className={containerClasses}
      style={safeAreaStyles}
      {...props}
    >
      {children}
    </div>
  );
});

MobileContainer.displayName = 'MobileContainer';

export default MobileContainer;
