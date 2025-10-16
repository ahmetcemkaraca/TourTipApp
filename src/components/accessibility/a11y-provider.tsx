'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AccessibilityContextType {
  // Screen reader settings
  screenReaderEnabled: boolean;
  toggleScreenReader: () => void;

  // Font size settings
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  setFontSize: (size: 'small' | 'medium' | 'large' | 'extra-large') => void;

  // Color contrast
  highContrast: boolean;
  toggleHighContrast: () => void;

  // Motion preferences
  reduceMotion: boolean;
  toggleReduceMotion: () => void;

  // Focus management
  skipToContent: () => void;
  skipToNavigation: () => void;
  skipToMain: () => void;

  // Keyboard navigation
  keyboardNavigation: boolean;
  toggleKeyboardNavigation: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Initialize accessibility settings from localStorage or system preferences
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large' | 'extra-large'>('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('tourtrip-a11y-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setScreenReaderEnabled(settings.screenReaderEnabled || false);
        setFontSizeState(settings.fontSize || 'medium');
        setHighContrast(settings.highContrast || false);
        setReduceMotion(settings.reduceMotion || false);
        setKeyboardNavigation(settings.keyboardNavigation !== false);
      } catch (error) {
        console.warn('Error loading accessibility settings:', error);
      }
    }

    // Check system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    if (prefersReducedMotion && !localStorage.getItem('tourtrip-a11y-settings')) {
      setReduceMotion(true);
    }

    if (prefersHighContrast && !localStorage.getItem('tourtrip-a11y-settings')) {
      setHighContrast(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      screenReaderEnabled,
      fontSize,
      highContrast,
      reduceMotion,
      keyboardNavigation,
    };

    localStorage.setItem('tourtrip-a11y-settings', JSON.stringify(settings));
  }, [screenReaderEnabled, fontSize, highContrast, reduceMotion, keyboardNavigation]);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;

    // Font size classes
    root.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large');
    root.classList.add(`text-${fontSize}`);

    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Screen reader announcements
    if (screenReaderEnabled) {
      root.setAttribute('aria-live', 'polite');
    } else {
      root.removeAttribute('aria-live');
    }

  }, [fontSize, highContrast, reduceMotion, screenReaderEnabled]);

  // Skip link functions
  const skipToContent = () => {
    const mainContent = document.querySelector('main, [role="main"]');
    if (mainContent) {
      (mainContent as HTMLElement).focus();
      (mainContent as HTMLElement).scrollIntoView({ behavior: 'smooth' });
    }
  };

  const skipToNavigation = () => {
    const navigation = document.querySelector('nav, [role="navigation"]');
    if (navigation) {
      (navigation as HTMLElement).focus();
      (navigation as HTMLElement).scrollIntoView({ behavior: 'smooth' });
    }
  };

  const skipToMain = () => {
    const main = document.querySelector('main, [role="main"]');
    if (main) {
      (main as HTMLElement).focus();
      (main as HTMLElement).scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Toggle functions
  const toggleScreenReader = () => {
    setScreenReaderEnabled(prev => !prev);

    // Announce to screen readers
    if (!screenReaderEnabled) {
      announceToScreenReader('Ekran okuyucu modu etkinleştirildi');
    } else {
      announceToScreenReader('Ekran okuyucu modu devre dışı bırakıldı');
    }
  };

  const setFontSize = (size: 'small' | 'medium' | 'large' | 'extra-large') => {
    setFontSizeState(size);
    announceToScreenReader(`Yazı boyutu ${size} olarak ayarlandı`);
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);

    if (!highContrast) {
      announceToScreenReader('Yüksek kontrast modu etkinleştirildi');
    } else {
      announceToScreenReader('Yüksek kontrast modu devre dışı bırakıldı');
    }
  };

  const toggleReduceMotion = () => {
    setReduceMotion(prev => !prev);

    if (!reduceMotion) {
      announceToScreenReader('Hareket azaltma modu etkinleştirildi');
    } else {
      announceToScreenReader('Hareket azaltma modu devre dışı bırakıldı');
    }
  };

  const toggleKeyboardNavigation = () => {
    setKeyboardNavigation(prev => !prev);

    if (!keyboardNavigation) {
      announceToScreenReader('Klavye navigasyonu etkinleştirildi');
    } else {
      announceToScreenReader('Klavye navigasyonu devre dışı bırakıldı');
    }
  };

  // Helper function to announce to screen readers
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Keyboard event handlers
  useEffect(() => {
    if (!keyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip links with Alt + key combinations
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            skipToNavigation();
            break;
          case '2':
            event.preventDefault();
            skipToMain();
            break;
          case '0':
            event.preventDefault();
            skipToContent();
            break;
        }
      }

      // Focus trap for modals and dialogs
      const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const modal = document.querySelector('[role="dialog"], .modal');

      if (modal && event.key === 'Tab') {
        const focusableContent = modal.querySelectorAll(focusableElements);
        const firstFocusableElement = focusableContent[0] as HTMLElement;
        const lastFocusableElement = focusableContent[focusableContent.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavigation]);

  const value: AccessibilityContextType = {
    screenReaderEnabled,
    toggleScreenReader,
    fontSize,
    setFontSize,
    highContrast,
    toggleHighContrast,
    reduceMotion,
    toggleReduceMotion,
    skipToContent,
    skipToNavigation,
    skipToMain,
    keyboardNavigation,
    toggleKeyboardNavigation,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Accessibility utilities
export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';

  announcement.textContent = message;
  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function focusElement(element: HTMLElement | null) {
  if (element) {
    element.focus();
    if (element.scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}
