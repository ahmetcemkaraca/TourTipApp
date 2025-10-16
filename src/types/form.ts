// Form Validation Types for TourTrip.app
import { z } from 'zod';
import { FieldError, FieldValues, Path, RegisterOptions, UseFormReturn } from 'react-hook-form';

export interface FormConfig {
  validationMode: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  reValidateMode: 'onChange' | 'onBlur' | 'onSubmit';
  shouldFocusError: boolean;
  shouldUnregister: boolean;
  shouldUseNativeValidation: boolean;
  delayError: number;
  criteriaMode: 'firstError' | 'all';
}

export interface ValidationRule {
  required?: boolean | string;
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  validate?: ((value: any) => boolean | string) | Record<string, (value: any) => boolean | string>;
  deps?: string[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'time' | 'datetime-local';
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  rules?: ValidationRule;
  options?: SelectOption[];
  multiple?: boolean;
  accept?: string; // for file input
  min?: string | number;
  max?: string | number;
  step?: string | number;
  autoComplete?: string;
  autoFocus?: boolean;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface FormSchema {
  fields: FormField[];
  submitText?: string;
  resetText?: string;
  className?: string;
  onSubmit?: (data: any) => void | Promise<void>;
  onReset?: () => void;
  onFieldChange?: (fieldName: string, value: any) => void;
  onValidationError?: (errors: Record<string, FieldError>) => void;
  persistence?: FormPersistence;
  realTimeValidation?: boolean;
  crossFieldValidation?: CrossFieldValidation[];
}

export interface FormPersistence {
  enabled: boolean;
  key: string;
  storage: 'localStorage' | 'sessionStorage';
  excludeFields?: string[];
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
}

export interface CrossFieldValidation {
  fields: string[];
  validator: (values: Record<string, any>) => boolean | string;
  message: string;
  trigger?: 'onChange' | 'onBlur' | 'onSubmit';
}

// Zod Schemas for common validations
export const CommonValidationSchemas = {
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  
  password: z.string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermeli')
    .regex(/[a-z]/, 'Şifre en az bir küçük harf içermeli')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermeli')
    .regex(/[^A-Za-z0-9]/, 'Şifre en az bir özel karakter içermeli'),
  
  phone: z.string()
    .regex(/^[+]?[1-9]\d{1,14}$/, 'Geçerli bir telefon numarası girin'),
  
  turkish_phone: z.string()
    .regex(/^(\+90|90)?5\d{9}$/, 'Geçerli bir Türkiye telefon numarası girin'),
  
  tc_kimlik: z.string()
    .length(11, 'TC Kimlik No 11 haneli olmalı')
    .regex(/^\d+$/, 'TC Kimlik No sadece rakam içermeli'),
  
  iban: z.string()
    .regex(/^TR\d{2}\d{4}\d{4}\d{4}\d{4}\d{4}\d{2}$/, 'Geçerli bir IBAN numarası girin'),
  
  credit_card: z.string()
    .regex(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/, 'Geçerli bir kredi kartı numarası girin'),
  
  postal_code: z.string()
    .regex(/^\d{5}$/, 'Posta kodu 5 haneli olmalı'),
  
  url: z.string().url('Geçerli bir URL girin'),
  
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Geçerli bir tarih girin'),
  
  future_date: z.string().refine(
    (date) => new Date(date) > new Date(),
    'Tarih gelecekte olmalı'
  ),
  
  age: z.number()
    .min(0, 'Yaş negatif olamaz')
    .max(120, 'Geçerli bir yaş girin'),
  
  price: z.number()
    .min(0, 'Fiyat negatif olamaz')
    .max(1000000, 'Fiyat çok yüksek'),
  
  percentage: z.number()
    .min(0, 'Yüzde 0\'dan küçük olamaz')
    .max(100, 'Yüzde 100\'den büyük olamaz'),
};

// TourTrip specific schemas
export const TourTripSchemas = {
  // User Registration
  userRegistration: z.object({
    firstName: z.string().min(2, 'Ad en az 2 karakter olmalı'),
    lastName: z.string().min(2, 'Soyad en az 2 karakter olmalı'),
    email: CommonValidationSchemas.email,
    password: CommonValidationSchemas.password,
    confirmPassword: z.string(),
    phone: CommonValidationSchemas.turkish_phone.optional(),
    birthDate: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    acceptTerms: z.boolean().refine(val => val === true, 'Kullanım şartlarını kabul etmelisiniz'),
    newsletter: z.boolean().optional(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  }),

  // User Login
  userLogin: z.object({
    email: CommonValidationSchemas.email,
    password: z.string().min(1, 'Şifre gerekli'),
    rememberMe: z.boolean().optional(),
  }),

  // Tour Booking
  tourBooking: z.object({
    tourId: z.string().min(1, 'Tur seçimi gerekli'),
    date: CommonValidationSchemas.future_date,
    participants: z.number().min(1, 'En az 1 katılımcı gerekli').max(20, 'En fazla 20 katılımcı'),
    participantDetails: z.array(z.object({
      firstName: z.string().min(2, 'Ad en az 2 karakter olmalı'),
      lastName: z.string().min(2, 'Soyad en az 2 karakter olmalı'),
      age: CommonValidationSchemas.age.optional(),
      dietaryRestrictions: z.string().optional(),
      medicalConditions: z.string().optional(),
    })),
    contactPhone: CommonValidationSchemas.turkish_phone,
    emergencyContact: z.object({
      name: z.string().min(2, 'Acil durum iletişim adı gerekli'),
      phone: CommonValidationSchemas.turkish_phone,
      relationship: z.string().min(1, 'Yakınlık derecesi gerekli'),
    }),
    specialRequests: z.string().max(500, 'Özel istekler 500 karakteri geçemez').optional(),
    agreeToTerms: z.boolean().refine(val => val === true, 'Rezervasyon şartlarını kabul etmelisiniz'),
  }),

  // Contact Form
  contactForm: z.object({
    name: z.string().min(2, 'Ad en az 2 karakter olmalı'),
    email: CommonValidationSchemas.email,
    phone: CommonValidationSchemas.turkish_phone.optional(),
    subject: z.string().min(3, 'Konu en az 3 karakter olmalı'),
    message: z.string().min(10, 'Mesaj en az 10 karakter olmalı').max(1000, 'Mesaj 1000 karakteri geçemez'),
    category: z.enum(['general', 'booking', 'complaint', 'suggestion', 'technical']),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),

  // Review Form
  reviewForm: z.object({
    rating: z.number().min(1, 'Puan vermelisiniz').max(5, 'En fazla 5 puan verebilirsiniz'),
    title: z.string().min(3, 'Başlık en az 3 karakter olmalı').max(100, 'Başlık 100 karakteri geçemez'),
    comment: z.string().min(10, 'Yorum en az 10 karakter olmalı').max(1000, 'Yorum 1000 karakteri geçemez'),
    wouldRecommend: z.boolean(),
    photos: z.array(z.string()).max(5, 'En fazla 5 fotoğraf yükleyebilirsiniz').optional(),
    anonymous: z.boolean().optional(),
    categories: z.object({
      guide: z.number().min(1).max(5).optional(),
      transport: z.number().min(1).max(5).optional(),
      accommodation: z.number().min(1).max(5).optional(),
      food: z.number().min(1).max(5).optional(),
      activities: z.number().min(1).max(5).optional(),
    }).optional(),
  }),

  // Payment Form
  paymentForm: z.object({
    cardNumber: CommonValidationSchemas.credit_card,
    expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Geçerli bir ay girin'),
    expiryYear: z.string().regex(/^20\d{2}$/, 'Geçerli bir yıl girin'),
    cvv: z.string().regex(/^\d{3,4}$/, 'Geçerli bir CVV girin'),
    cardHolderName: z.string().min(2, 'Kart sahibi adı gerekli'),
    billingAddress: z.object({
      street: z.string().min(5, 'Adres en az 5 karakter olmalı'),
      city: z.string().min(2, 'Şehir gerekli'),
      postalCode: CommonValidationSchemas.postal_code,
      country: z.string().min(2, 'Ülke gerekli'),
    }),
    saveCard: z.boolean().optional(),
    acceptPaymentTerms: z.boolean().refine(val => val === true, 'Ödeme şartlarını kabul etmelisiniz'),
  }),

  // Provider Registration
  providerRegistration: z.object({
    companyName: z.string().min(2, 'Şirket adı en az 2 karakter olmalı'),
    taxNumber: z.string().regex(/^\d{10}$/, 'Vergi numarası 10 haneli olmalı'),
    contactPerson: z.string().min(2, 'İletişim kişisi adı gerekli'),
    email: CommonValidationSchemas.email,
    phone: CommonValidationSchemas.turkish_phone,
    address: z.object({
      street: z.string().min(5, 'Adres en az 5 karakter olmalı'),
      city: z.string().min(2, 'Şehir gerekli'),
      postalCode: CommonValidationSchemas.postal_code,
    }),
    website: CommonValidationSchemas.url.optional(),
    description: z.string().min(50, 'Açıklama en az 50 karakter olmalı').max(2000, 'Açıklama 2000 karakteri geçemez'),
    serviceTypes: z.array(z.string()).min(1, 'En az bir hizmet türü seçmelisiniz'),
    licenseNumber: z.string().optional(),
    insuranceInfo: z.string().optional(),
    bankAccount: z.object({
      iban: CommonValidationSchemas.iban,
      bankName: z.string().min(2, 'Banka adı gerekli'),
    }),
    agreeToPolicies: z.boolean().refine(val => val === true, 'Sağlayıcı politikalarını kabul etmelisiniz'),
  }),
};

// Form state management
export interface FormState<T extends FieldValues = FieldValues> {
  data: T;
  errors: Record<string, FieldError>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  submitCount: number;
  isDirty: boolean;
  isValidating: boolean;
}

export interface FormHookResult<T extends FieldValues = FieldValues> extends UseFormReturn<T> {
  // Extended methods
  submitForm: () => Promise<void>;
  resetForm: (data?: Partial<T>) => void;
  validateField: (field: Path<T>) => Promise<boolean>;
  setFieldTouched: (field: Path<T>, touched?: boolean) => void;
  
  // State
  isValid: boolean;
  isSubmitting: boolean;
  hasErrors: boolean;
  isPersisted: boolean;
  
  // Persistence
  persistForm: () => void;
  loadPersistedData: () => void;
  clearPersistedData: () => void;
  
  // Real-time validation
  enableRealTimeValidation: () => void;
  disableRealTimeValidation: () => void;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  type: string;
  value?: any;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: string[];
}

// Server-side validation
export interface ServerValidationRequest {
  formType: string;
  data: Record<string, any>;
  context?: {
    userId?: string;
    sessionId?: string;
    timestamp: number;
  };
}

export interface ServerValidationResponse {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  sanitizedData?: Record<string, any>;
  suggestions?: string[];
}

// Conditional validation
export interface ConditionalValidation {
  condition: (formData: any) => boolean;
  schema: z.ZodSchema;
  message?: string;
}

// Multi-step form
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  schema: z.ZodSchema;
  optional?: boolean;
  condition?: (formData: any) => boolean;
}

export interface MultiStepFormConfig {
  steps: FormStep[];
  allowBackNavigation: boolean;
  validateOnStepChange: boolean;
  persistProgress: boolean;
  showProgress: boolean;
  submitOnLastStep: boolean;
}

// Dynamic form generation
export interface DynamicFormConfig {
  schemaUrl: string;
  cacheTTL: number;
  fallbackSchema: z.ZodSchema;
  transformSchema?: (schema: any) => z.ZodSchema;
  onSchemaLoad?: (schema: z.ZodSchema) => void;
  onSchemaError?: (error: Error) => void;
}

// Form analytics
export interface FormAnalytics {
  formId: string;
  startTime: number;
  completionTime?: number;
  fieldInteractions: FormFieldAnalytics[];
  validationErrors: ValidationError[];
  abandonmentPoint?: string;
  conversionRate?: number;
}

export interface FormFieldAnalytics {
  fieldName: string;
  timeSpent: number;
  focusCount: number;
  changeCount: number;
  errorCount: number;
  helpViewed: boolean;
}

// Component interfaces
export interface FormInputProps {
  field: FormField;
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  error?: FieldError;
  touched?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface FormGroupProps {
  label?: string;
  description?: string;
  required?: boolean;
  error?: FieldError;
  children: React.ReactNode;
  className?: string;
}

export interface FormValidationDisplayProps {
  errors: Record<string, FieldError>;
  warnings?: ValidationError[];
  className?: string;
  showSuccessState?: boolean;
}

export type FormSubmitHandler<T> = (data: T) => void | Promise<void>;
export type FormErrorHandler = (errors: Record<string, FieldError>) => void;
export type FormChangeHandler = (fieldName: string, value: any, formData: any) => void;
