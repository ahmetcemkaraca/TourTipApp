'use client';

import { useEffect, useRef } from 'react';
import { focusElement } from './a11y-provider';

interface FocusTrapProps {
  children: React.ReactNode;
  isActive?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  onEscape?: () => void;
  className?: string;
}

export function FocusTrap({
  children,
  isActive = true,
  autoFocus = true,
  restoreFocus = true,
  onEscape,
  className = '',
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element
    if (restoreFocus) {
      previouslyFocusedElement.current = document.activeElement;
    }

    // Focus the first focusable element when the trap becomes active
    if (autoFocus && containerRef.current) {
      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        focusElement(focusableElements[0]);
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isActive || !containerRef.current) return;

      const focusableElements = getFocusableElements(containerRef.current);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      switch (event.key) {
        case 'Tab':
          if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              event.preventDefault();
              focusElement(lastElement);
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              event.preventDefault();
              focusElement(firstElement);
            }
          }
          break;

        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        isActive &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        onEscape
      ) {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);

      // Restore focus when the trap is deactivated
      if (restoreFocus && previouslyFocusedElement.current) {
        focusElement(previouslyFocusedElement.current as HTMLElement);
      }
    };
  }, [isActive, autoFocus, restoreFocus, onEscape]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="dialog"
      aria-modal={isActive}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

// Helper function to get all focusable elements within a container
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ];

  const elements = container.querySelectorAll(focusableSelectors.join(', '));
  return Array.from(elements) as HTMLElement[];
}
