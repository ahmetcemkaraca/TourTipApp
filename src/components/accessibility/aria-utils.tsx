'use client';

import { useEffect, useRef } from 'react';

// ARIA Live Region for announcements
export function AriaLive({
  message,
  priority = 'polite',
  atomic = true,
  role = 'status',
}: {
  message: string;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  role?: 'status' | 'alert' | 'log';
}) {
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liveRef.current && message) {
      liveRef.current.textContent = message;
    }
  }, [message]);

  return (
    <div
      ref={liveRef}
      aria-live={priority}
      aria-atomic={atomic}
      role={role}
      className="sr-only"
      aria-label="Ekran okuyucu duyurusu"
    />
  );
}

// Progress indicator with ARIA
export function AriaProgress({
  value,
  max = 100,
  label,
  showValue = true,
}: {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="aria-progress">
      {label && (
        <div id={`progress-label-${Math.random()}`} className="sr-only">
          {label}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={label ? `progress-label-${Math.random()}` : undefined}
        aria-label={label || 'İlerleme durumu'}
        className="sr-only"
      >
        {showValue && `${Math.round(percentage)}% tamamlandı`}
      </div>
    </div>
  );
}

// Accessible button with loading state
export function AccessibleButton({
  children,
  loading = false,
  loadingText = 'Yükleniyor...',
  disabled = false,
  ...props
}: {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-describedby={loading ? 'loading-status' : undefined}
    >
      {loading ? (
        <>
          <span aria-hidden="true">{loadingText}</span>
          <span id="loading-status" className="sr-only">
            {loadingText}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Accessible form field wrapper
export function AccessibleField({
  label,
  description,
  error,
  required = false,
  children,
  id,
}: {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  id?: string;
}) {
  const fieldId = id || `field-${Math.random()}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="accessible-field">
      <label
        htmlFor={fieldId}
        className="field-label"
        id={`${fieldId}-label`}
      >
        {label}
        {required && (
          <span aria-label="gerekli" className="required-indicator">
            *
          </span>
        )}
      </label>

      {description && (
        <div
          id={descriptionId}
          className="field-description sr-only"
        >
          {description}
        </div>
      )}

      <div className="field-input">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-labelledby': `${fieldId}-label`,
          'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
          'aria-required': required,
          'aria-invalid': !!error,
        })}
      </div>

      {error && (
        <div
          id={errorId}
          className="field-error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
}

// Accessible disclosure/collapsible component
export function AccessibleDisclosure({
  children,
  summary,
  expanded: controlledExpanded,
  onToggle,
  id,
}: {
  children: React.ReactNode;
  summary: React.ReactNode;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  id?: string;
}) {
  const [internalExpanded, setInternalExpanded] = React.useState(false);
  const disclosureId = id || `disclosure-${Math.random()}`;
  const contentId = `${disclosureId}-content`;

  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newExpanded = !expanded;
    setInternalExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <div className="accessible-disclosure">
      <button
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={contentId}
        id={`${disclosureId}-trigger`}
        className="disclosure-trigger"
      >
        {summary}
        <span aria-hidden="true" className="disclosure-icon">
          {expanded ? '−' : '+'}
        </span>
        <span className="sr-only">
          {expanded ? 'Daralt' : 'Genişlet'}
        </span>
      </button>

      <div
        id={contentId}
        role="region"
        aria-labelledby={`${disclosureId}-trigger`}
        className={`disclosure-content ${expanded ? 'expanded' : 'collapsed'}`}
        hidden={!expanded}
      >
        {children}
      </div>
    </div>
  );
}

// Accessible tooltip
export function AccessibleTooltip({
  children,
  content,
  placement = 'top',
  id,
}: {
  children: React.ReactNode;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  id?: string;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const tooltipId = id || `tooltip-${Math.random()}`;

  return (
    <div className="accessible-tooltip-container">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={isVisible ? tooltipId : undefined}
        tabIndex={0}
      >
        {children}
      </div>

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`accessible-tooltip tooltip-${placement}`}
          aria-live="polite"
        >
          {content}
        </div>
      )}
    </div>
  );
}

// Screen reader only text
export function ScreenReaderOnly({
  children,
  as: Component = 'span',
  ...props
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  [key: string]: any;
}) {
  return (
    <Component
      className="sr-only"
      {...props}
    >
      {children}
    </Component>
  );
}

// Accessible table utilities
export function AccessibleTable({
  children,
  caption,
  ...props
}: {
  children: React.ReactNode;
  caption?: string;
  [key: string]: any;
}) {
  return (
    <table {...props}>
      {caption && <caption className="sr-only">{caption}</caption>}
      {children}
    </table>
  );
}

export function AccessibleTableHeader({
  children,
  scope = 'col',
  ...props
}: {
  children: React.ReactNode;
  scope?: 'col' | 'row';
  [key: string]: any;
}) {
  return (
    <th scope={scope} {...props}>
      {children}
    </th>
  );
}

// Utility to manage ARIA attributes dynamically
export function useAriaAttributes(
  baseAttributes: Record<string, any>,
  dynamicAttributes: Record<string, any>
) {
  const [attributes, setAttributes] = React.useState({
    ...baseAttributes,
    ...dynamicAttributes,
  });

  useEffect(() => {
    setAttributes({
      ...baseAttributes,
      ...dynamicAttributes,
    });
  }, [baseAttributes, dynamicAttributes]);

  return attributes;
}

// Hook for managing focus within a component
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null);

  const focus = React.useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  }, []);

  const blur = React.useCallback(() => {
    if (focusRef.current) {
      focusRef.current.blur();
    }
  }, []);

  return {
    focusRef,
    focus,
    blur,
  };
}
