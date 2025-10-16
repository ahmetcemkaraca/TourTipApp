'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { announceToScreenReader, focusElement } from '@/components/accessibility/a11y-provider';

// Hook for managing focus within components
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null);

  const setFocus = useCallback(() => {
    if (focusRef.current) {
      focusElement(focusRef.current);
    }
  }, []);

  const moveFocusTo = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      focusElement(element);
    }
  }, []);

  return {
    focusRef,
    setFocus,
    moveFocusTo,
  };
}

// Hook for managing ARIA live regions
export function useAriaLive(priority: 'polite' | 'assertive' = 'polite') {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback((text: string) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage(text);

    // Clear message after announcement
    timeoutRef.current = setTimeout(() => {
      setMessage('');
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { message, announce };
}

// Hook for managing keyboard navigation
export function useKeyboardNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab key indicates keyboard navigation
      if (event.key === 'Tab') {
        setIsNavigating(true);

        // Clear navigation state after a delay
        const timeout = setTimeout(() => {
          setIsNavigating(false);
        }, 100);

        return () => clearTimeout(timeout);
      }
    };

    const handleMouseDown = () => {
      // Mouse interaction indicates end of keyboard navigation
      setIsNavigating(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isNavigating;
}

// Hook for managing skip links
export function useSkipLinks() {
  const skipTo = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      focusElement(target);
      announceToScreenReader(`${target.getAttribute('aria-label') || target.textContent} bölümüne geçildi`);
    }
  }, []);

  return { skipTo };
}

// Hook for managing form accessibility
export function useAccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }));
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const setFieldTouched = useCallback((fieldName: string, isTouched = true) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: isTouched,
    }));
  }, []);

  const validateField = useCallback((fieldName: string, value: any, rules: any) => {
    let error = '';

    if (rules.required && (!value || value.toString().trim() === '')) {
      error = 'Bu alan zorunludur';
    } else if (rules.minLength && value && value.length < rules.minLength) {
      error = `En az ${rules.minLength} karakter giriniz`;
    } else if (rules.maxLength && value && value.length > rules.maxLength) {
      error = `En fazla ${rules.maxLength} karakter girilebilir`;
    } else if (rules.pattern && value && !rules.pattern.test(value)) {
      error = rules.patternMessage || 'Geçersiz format';
    } else if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = 'Geçerli bir e-posta adresi giriniz';
    }

    if (error) {
      setFieldError(fieldName, error);
    } else {
      clearFieldError(fieldName);
    }

    return !error;
  }, [setFieldError, clearFieldError]);

  const getFieldProps = useCallback((fieldName: string, rules: any = {}) => ({
    'aria-invalid': !!errors[fieldName],
    'aria-describedby': errors[fieldName] ? `${fieldName}-error` : undefined,
    'aria-required': rules.required,
    onBlur: () => {
      setFieldTouched(fieldName);
      if (rules.validateOnBlur) {
        const field = document.getElementById(fieldName) as HTMLInputElement;
        if (field) {
          validateField(fieldName, field.value, rules);
        }
      }
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (rules.validateOnChange) {
        validateField(fieldName, e.target.value, rules);
      }
    },
  }), [errors, validateField, setFieldTouched]);

  const getFieldErrorProps = useCallback((fieldName: string) => ({
    id: `${fieldName}-error`,
    role: 'alert',
    'aria-live': 'polite',
  }), []);

  return {
    errors,
    touched,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    validateField,
    getFieldProps,
    getFieldErrorProps,
    hasErrors: Object.keys(errors).length > 0,
    isValid: Object.keys(errors).length === 0,
  };
}

// Hook for managing modal accessibility
export function useAccessibleModal(isOpen: boolean, onClose?: () => void) {
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<Element | null>(null);

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (isModalOpen) {
      // Store previously focused element
      previouslyFocusedElement.current = document.activeElement;

      // Focus modal
      if (modalRef.current) {
        focusElement(modalRef.current);
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Add escape key handler
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && onClose) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    } else {
      // Restore focus
      if (previouslyFocusedElement.current) {
        focusElement(previouslyFocusedElement.current as HTMLElement);
      }
    }
  }, [isModalOpen, onClose]);

  return {
    modalRef,
    isModalOpen,
    setIsModalOpen,
  };
}

// Hook for managing expandable content
export function useAccessibleDisclosure(expanded: boolean = false) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  // Announce state changes to screen readers
  useEffect(() => {
    if (isExpanded) {
      announceToScreenReader('İçerik genişletildi');
    } else {
      announceToScreenReader('İçerik daraltıldı');
    }
  }, [isExpanded]);

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    contentRef,
    triggerProps: {
      'aria-expanded': isExpanded,
      'aria-controls': contentRef.current?.id,
      onClick: toggle,
    },
    contentProps: {
      id: contentRef.current?.id,
      ref: contentRef,
      'aria-hidden': !isExpanded,
      hidden: !isExpanded,
    },
  };
}

// Hook for managing loading states with accessibility
export function useAccessibleLoading(isLoading: boolean, loadingText = 'Yükleniyor...') {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (isLoading) {
      setAnnouncement(loadingText);
    } else {
      setAnnouncement('Yükleme tamamlandı');
    }
  }, [isLoading, loadingText]);

  return {
    announcement,
    loadingProps: {
      'aria-live': 'polite',
      'aria-busy': isLoading,
      role: isLoading ? 'progressbar' : undefined,
      'aria-label': isLoading ? loadingText : undefined,
    },
  };
}

// Hook for managing navigation announcements
export function useNavigationAnnouncer() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message);

    // Also update document title for additional context
    const originalTitle = document.title;
    document.title = `${message} - ${originalTitle}`;

    // Restore original title after a delay
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }, []);

  return { announce };
}

// Hook for managing color contrast detection
export function useColorContrast() {
  const [hasGoodContrast, setHasGoodContrast] = useState(true);

  useEffect(() => {
    const checkContrast = () => {
      // Simple contrast checking - in a real app, you'd use a proper contrast library
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      const backgroundColor = computedStyle.backgroundColor;
      const color = computedStyle.color;

      // Basic check - if background is very light and text is very dark, or vice versa
      const isLightBg = backgroundColor.includes('255') || backgroundColor.includes('white');
      const isDarkText = color.includes('0') || color.includes('black');

      setHasGoodContrast(isLightBg && isDarkText);
    };

    checkContrast();

    // Check on theme changes
    const observer = new MutationObserver(checkContrast);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  return hasGoodContrast;
}

// Hook for managing screen reader detection
export function useScreenReader() {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  useEffect(() => {
    // Detect screen reader by checking for common indicators
    const checkScreenReader = () => {
      // Check for NVDA
      const hasNVDA = typeof (window as any).nvda !== 'undefined';

      // Check for JAWS
      const hasJAWS = typeof (window as any).jaws !== 'undefined';

      // Check for VoiceOver (more complex detection needed)
      const hasVoiceOver = navigator.userAgent.includes('VoiceOver') ||
                          document.querySelector('[aria-live]') !== null;

      // Check for focus management (common with screen readers)
      const hasFocusManagement = document.activeElement !== document.body;

      setIsScreenReaderActive(hasNVDA || hasJAWS || hasVoiceOver || hasFocusManagement);
    };

    checkScreenReader();

    // Check periodically
    const interval = setInterval(checkScreenReader, 5000);

    return () => clearInterval(interval);
  }, []);

  return isScreenReaderActive;
}
