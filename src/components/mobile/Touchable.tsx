'use client';

import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { TouchableProps, FeedbackType } from '@/types/mobile';
import { useTouchGestures } from '@/hooks/use-mobile';

const Touchable: React.FC<TouchableProps> = ({
  children,
  onPress,
  onLongPress,
  onSwipe,
  hapticFeedback = FeedbackType.LIGHT,
  disabled = false,
  className,
  ...props
}) => {
  const { triggerHaptic } = useTouchGestures();
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  
  const touchStartTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    touchStartTime.current = Date.now();
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setIsPressed(true);

    // Set up long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPressed(true);
        triggerHaptic(FeedbackType.MEDIUM);
        onLongPress();
      }, 500); // 500ms for long press
    }
  }, [disabled, onLongPress, triggerHaptic]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    const moveDistance = Math.sqrt(
      Math.pow(touch.clientX - touchStartPos.current.x, 2) +
      Math.pow(touch.clientY - touchStartPos.current.y, 2)
    );

    // Cancel long press if moved too much
    if (moveDistance > 20 && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      setIsPressed(false);
    }
  }, [disabled]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.changedTouches[0];
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime.current;
    
    const endPos = { x: touch.clientX, y: touch.clientY };
    const moveDistance = Math.sqrt(
      Math.pow(endPos.x - touchStartPos.current.x, 2) +
      Math.pow(endPos.y - touchStartPos.current.y, 2)
    );

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    setIsPressed(false);
    setIsLongPressed(false);

    // Handle swipe gesture
    if (onSwipe && moveDistance > 50) {
      const deltaX = endPos.x - touchStartPos.current.x;
      const deltaY = endPos.y - touchStartPos.current.y;
      
      let direction: 'left' | 'right' | 'up' | 'down';
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
      
      triggerHaptic(hapticFeedback);
      onSwipe(direction);
      return;
    }

    // Handle tap/press
    if (onPress && !isLongPressed && moveDistance < 20 && touchDuration < 500) {
      triggerHaptic(hapticFeedback);
      onPress();
    }
  }, [disabled, onPress, onSwipe, isLongPressed, hapticFeedback, triggerHaptic]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsPressed(false);
    setIsLongPressed(false);
  }, []);

  // Mouse events for desktop compatibility
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsPressed(true);
  }, [disabled]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsPressed(false);
    
    if (onPress) {
      onPress();
    }
  }, [disabled, onPress]);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  const touchableClasses = cn(
    // Base styles
    'select-none outline-none transition-all duration-150',
    
    // Touch optimization
    'touch-manipulation',
    
    // Interactive states
    isPressed && 'scale-95 opacity-80',
    isLongPressed && 'scale-90 opacity-60',
    
    // Disabled state
    disabled && 'opacity-50 pointer-events-none',
    
    // Platform-specific optimizations
    'webkit-tap-highlight-color-transparent',
    'webkit-touch-callout-none',
    'webkit-user-select-none',
    'moz-user-select-none',
    'ms-user-select-none',
    
    className
  );

  return (
    <div
      className={touchableClasses}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

export default Touchable;
