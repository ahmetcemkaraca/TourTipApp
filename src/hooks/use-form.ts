'use client';

import { useForm, UseFormProps, FieldValues, Path, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FormHookResult, FormPersistence, FormAnalytics, FormFieldAnalytics, ValidationError } from '@/types/form';
import { useToast } from '@/hooks/use-toast';
import ErrorService from '@/lib/error-service';

interface UseCustomFormOptions<T extends FieldValues> extends UseFormProps<T> {
  schema?: z.ZodSchema<T>;
  persistence?: FormPersistence;
  realTimeValidation?: boolean;
  serverValidation?: boolean;
  analytics?: boolean;
  onSubmitSuccess?: (data: T) => void;
  onSubmitError?: (error: Error) => void;
  onFieldChange?: (fieldName: keyof T, value: any, formData: T) => void;
  debounceValidation?: number;
}

export function useCustomForm<T extends FieldValues = FieldValues>(
  options: UseCustomFormOptions<T> = {}
): FormHookResult<T> {
  const {
    schema,
    persistence,
    realTimeValidation = false,
    serverValidation = false,
    analytics = false,
    onSubmitSuccess,
    onSubmitError,
    onFieldChange,
    debounceValidation = 300,
    ...formOptions
  } = options;

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPersisted, setIsPersisted] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(realTimeValidation);
  const [formAnalytics, setFormAnalytics] = useState<FormAnalytics | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());
  const fieldAnalyticsRef = useRef<{ [key: string]: FormFieldAnalytics }>({});

  // Initialize form with resolver if schema provided
  const form = useForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    mode: realTimeEnabled ? 'onChange' : 'onSubmit',
    ...formOptions,
  });

  const {
    handleSubmit,
    reset,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isValid, touchedFields, dirtyFields, isDirty },
    watch,
    setValue,
    trigger,
  } = form;

  // Initialize analytics
  useEffect(() => {
    if (analytics) {
      setFormAnalytics({
        formId: `form_${Date.now()}`,
        startTime: startTimeRef.current,
        fieldInteractions: [],
        validationErrors: [],
      });
    }
  }, [analytics]);

  // Load persisted data on mount
  useEffect(() => {
    if (persistence?.enabled) {
      loadPersistedData();
    }
  }, [persistence]);

  // Watch for form changes and persist data
  const watchedValues = watch();
  useEffect(() => {
    if (persistence?.enabled && isDirty) {
      persistForm();
    }
  }, [watchedValues, persistence, isDirty]);

  // Real-time validation with debounce
  useEffect(() => {
    if (realTimeEnabled) {
      const subscription = watch((value, { name }) => {
        if (name && debounceValidation > 0) {
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          debounceTimeoutRef.current = setTimeout(() => {
            trigger(name as Path<T>);
          }, debounceValidation);
        } else if (name) {
          trigger(name as Path<T>);
        }

        // Track field analytics
        if (analytics && name) {
          trackFieldInteraction(name, 'change');
        }

        // Call onFieldChange callback
        if (onFieldChange && name) {
          onFieldChange(name as keyof T, value[name], value as T);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [watch, trigger, realTimeEnabled, debounceValidation, analytics, onFieldChange]);

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Persist form data to storage
  const persistForm = useCallback(() => {
    if (!persistence?.enabled) return;

    try {
      const data = getValues();
      let dataToStore = data;

      // Exclude specified fields
      if (persistence.excludeFields?.length) {
        dataToStore = Object.keys(data).reduce((acc, key) => {
          if (!persistence.excludeFields!.includes(key)) {
            acc[key] = data[key];
          }
          return acc;
        }, {} as T);
      }

      const storageData = {
        data: dataToStore,
        timestamp: Date.now(),
        ttl: persistence.ttl,
      };

      const serializedData = JSON.stringify(storageData);
      const storage = persistence.storage === 'localStorage' ? localStorage : sessionStorage;
      
      if (persistence.encrypt) {
        // Simple base64 encoding (for demonstration - use proper encryption in production)
        const encoded = btoa(serializedData);
        storage.setItem(persistence.key, encoded);
      } else {
        storage.setItem(persistence.key, serializedData);
      }

      setIsPersisted(true);
    } catch (error) {
      console.error('Failed to persist form data:', error);
      ErrorService.reportError(
        ErrorService.createError(error as Error, 'SYSTEM', 'MEDIUM', {
          component: 'useCustomForm',
          function: 'persistForm',
        })
      );
    }
  }, [getValues, persistence]);

  // Load persisted data from storage
  const loadPersistedData = useCallback(() => {
    if (!persistence?.enabled) return;

    try {
      const storage = persistence.storage === 'localStorage' ? localStorage : sessionStorage;
      const storedData = storage.getItem(persistence.key);

      if (!storedData) return;

      let serializedData = storedData;
      if (persistence.encrypt) {
        serializedData = atob(storedData);
      }

      const { data, timestamp, ttl } = JSON.parse(serializedData);

      // Check if data has expired
      if (ttl && Date.now() - timestamp > ttl) {
        storage.removeItem(persistence.key);
        return;
      }

      // Reset form with persisted data
      reset(data);
      setIsPersisted(true);
    } catch (error) {
      console.error('Failed to load persisted form data:', error);
      // Clear corrupted data
      clearPersistedData();
    }
  }, [reset, persistence]);

  // Clear persisted data
  const clearPersistedData = useCallback(() => {
    if (!persistence?.enabled) return;

    try {
      const storage = persistence.storage === 'localStorage' ? localStorage : sessionStorage;
      storage.removeItem(persistence.key);
      setIsPersisted(false);
    } catch (error) {
      console.error('Failed to clear persisted form data:', error);
    }
  }, [persistence]);

  // Server-side validation
  const validateOnServer = useCallback(async (data: T): Promise<boolean> => {
    if (!serverValidation) return true;

    try {
      // This would call your server-side validation endpoint
      const response = await fetch('/api/validate-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'generic',
          data,
          context: {
            timestamp: Date.now(),
          },
        }),
      });

      const result = await response.json();

      if (!result.valid) {
        // Set server validation errors
        result.errors.forEach((error: ValidationError) => {
          setError(error.field as Path<T>, {
            type: 'server',
            message: error.message,
          });
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Server validation failed:', error);
      return true; // Continue with client-side validation on server error
    }
  }, [serverValidation, setError]);

  // Track field interaction for analytics
  const trackFieldInteraction = useCallback((fieldName: string, type: 'focus' | 'change' | 'blur') => {
    if (!analytics) return;

    const current = fieldAnalyticsRef.current[fieldName] || {
      fieldName,
      timeSpent: 0,
      focusCount: 0,
      changeCount: 0,
      errorCount: 0,
      helpViewed: false,
    };

    switch (type) {
      case 'focus':
        current.focusCount++;
        break;
      case 'change':
        current.changeCount++;
        break;
      case 'blur':
        // Calculate time spent (simplified)
        current.timeSpent += 1000; // 1 second increment
        break;
    }

    fieldAnalyticsRef.current[fieldName] = current;
  }, [analytics]);

  // Submit form with enhanced error handling
  const submitForm = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      const data = getValues();
      
      // Server-side validation
      const isServerValid = await validateOnServer(data);
      if (!isServerValid) {
        setIsSubmitting(false);
        return;
      }

      // Analytics tracking
      if (analytics && formAnalytics) {
        const completionTime = Date.now();
        const updatedAnalytics: FormAnalytics = {
          ...formAnalytics,
          completionTime,
          fieldInteractions: Object.values(fieldAnalyticsRef.current),
          validationErrors: Object.entries(errors).map(([field, error]) => ({
            field,
            message: error.message || '',
            type: error.type || 'validation',
          })),
        };
        setFormAnalytics(updatedAnalytics);
        
        // You could send this analytics data to your analytics service
        console.log('Form Analytics:', updatedAnalytics);
      }

      // Clear persisted data on successful submit
      if (persistence?.enabled) {
        clearPersistedData();
      }

      onSubmitSuccess?.(data);
      toast.success('Form başarıyla gönderildi');
    } catch (error) {
      console.error('Form submission failed:', error);
      onSubmitError?.(error as Error);
      
      ErrorService.reportError(
        ErrorService.createError(error as Error, 'BUSINESS_LOGIC', 'HIGH', {
          component: 'useCustomForm',
          function: 'submitForm',
        })
      );
      
      toast.error('Form gönderilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    getValues,
    validateOnServer,
    analytics,
    formAnalytics,
    errors,
    persistence,
    clearPersistedData,
    onSubmitSuccess,
    onSubmitError,
    toast,
  ]);

  // Reset form with optional data
  const resetForm = useCallback((data?: Partial<T>) => {
    reset(data);
    clearErrors();
    if (persistence?.enabled) {
      clearPersistedData();
    }
    
    // Reset analytics
    if (analytics) {
      startTimeRef.current = Date.now();
      fieldAnalyticsRef.current = {};
      setFormAnalytics({
        formId: `form_${Date.now()}`,
        startTime: startTimeRef.current,
        fieldInteractions: [],
        validationErrors: [],
      });
    }
  }, [reset, clearErrors, persistence, clearPersistedData, analytics]);

  // Validate specific field
  const validateField = useCallback(async (field: Path<T>): Promise<boolean> => {
    const result = await trigger(field);
    
    if (analytics) {
      trackFieldInteraction(field, 'blur');
      
      if (errors[field]) {
        const current = fieldAnalyticsRef.current[field];
        if (current) {
          current.errorCount++;
        }
      }
    }
    
    return result;
  }, [trigger, analytics, errors]);

  // Set field as touched
  const setFieldTouched = useCallback((field: Path<T>, touched: boolean = true) => {
    // react-hook-form doesn't have a direct setTouched method
    // We simulate it by triggering validation
    if (touched) {
      trigger(field);
    }
  }, [trigger]);

  // Enable/disable real-time validation
  const enableRealTimeValidation = useCallback(() => {
    setRealTimeEnabled(true);
  }, []);

  const disableRealTimeValidation = useCallback(() => {
    setRealTimeEnabled(false);
  }, []);

  return {
    ...form,
    
    // Extended methods
    submitForm,
    resetForm,
    validateField,
    setFieldTouched,
    
    // State
    isValid,
    isSubmitting,
    hasErrors: Object.keys(errors).length > 0,
    isPersisted,
    
    // Persistence
    persistForm,
    loadPersistedData,
    clearPersistedData,
    
    // Real-time validation
    enableRealTimeValidation,
    disableRealTimeValidation,
  };
}

// Specialized hooks for common forms
export function useLoginForm() {
  return useCustomForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    persistence: {
      enabled: true,
      key: 'login_form',
      storage: 'sessionStorage',
      excludeFields: ['password'],
    },
  });
}

export function useRegistrationForm() {
  return useCustomForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    realTimeValidation: true,
    serverValidation: true,
    analytics: true,
  });
}

export function useBookingForm() {
  return useCustomForm({
    defaultValues: {
      tourId: '',
      date: '',
      participants: 1,
      contactPhone: '',
      specialRequests: '',
    },
    persistence: {
      enabled: true,
      key: 'booking_form',
      storage: 'localStorage',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    },
    realTimeValidation: true,
    analytics: true,
  });
}

export function useContactForm() {
  return useCustomForm({
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      category: 'general',
    },
    persistence: {
      enabled: true,
      key: 'contact_form',
      storage: 'localStorage',
    },
  });
}

export function usePaymentForm() {
  return useCustomForm({
    defaultValues: {
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardHolderName: '',
      saveCard: false,
    },
    // Never persist payment data
    persistence: {
      enabled: false,
      key: '',
      storage: 'sessionStorage',
    },
    realTimeValidation: true,
    serverValidation: true,
  });
}

export default useCustomForm;
