'use client';

import React, { forwardRef, useState } from 'react';
import { FieldError } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { FormField as FormFieldType, FormInputProps } from '@/types/form';
import { Eye, EyeOff, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface FormFieldProps extends FormInputProps {
  field: FormFieldType;
  register?: any;
  error?: FieldError;
  touched?: boolean;
  showValidationState?: boolean;
  helpText?: string;
  onHelpClick?: () => void;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(({
  field,
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  showValidationState = true,
  helpText,
  onHelpClick,
  className,
  register,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;
  const isValid = touched && !hasError && value;
  const showSuccess = showValidationState && isValid;

  const baseInputClasses = cn(
    'w-full transition-colors duration-200',
    hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
    showSuccess && 'border-green-500 focus:border-green-500 focus:ring-green-500',
    disabled && 'opacity-50 cursor-not-allowed',
    field.className
  );

  const renderInput = () => {
    const commonProps = {
      id: field.name,
      name: field.name,
      placeholder: field.placeholder,
      disabled: disabled || field.disabled,
      readOnly: field.readonly,
      autoComplete: field.autoComplete,
      autoFocus: field.autoFocus,
      className: baseInputClasses,
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange?.(e.target.value);
      },
      onBlur: () => {
        setIsFocused(false);
        onBlur?.();
      },
      onFocus: () => setIsFocused(true),
      ...register?.(field.name, field.rules),
      ...props,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={4}
            className={cn(baseInputClasses, 'resize-vertical')}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={disabled || field.disabled}
          >
            <SelectTrigger className={baseInputClasses}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={String(option.value)}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value || false}
              onCheckedChange={onChange}
              disabled={disabled || field.disabled}
              className={hasError ? 'border-red-500' : ''}
            />
            <Label 
              htmlFor={field.name}
              className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                hasError && 'text-red-600'
              )}
            >
              {field.label}
            </Label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={onChange}
            disabled={disabled || field.disabled}
            className="space-y-2"
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={String(option.value)}
                  id={`${field.name}_${option.value}`}
                  disabled={option.disabled}
                />
                <Label 
                  htmlFor={`${field.name}_${option.value}`}
                  className="text-sm font-medium"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'file':
        return (
          <Input
            {...commonProps}
            type="file"
            accept={field.accept}
            multiple={field.multiple}
            onChange={(e) => {
              const files = field.multiple ? Array.from(e.target.files || []) : e.target.files?.[0];
              onChange?.(files);
            }}
          />
        );

      case 'password':
        return (
          <div className="relative">
            <Input
              {...commonProps}
              type={showPassword ? 'text' : 'password'}
              className={cn(baseInputClasses, 'pr-10')}
              ref={ref}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={disabled || field.disabled}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            ref={ref}
          />
        );

      case 'date':
      case 'time':
      case 'datetime-local':
        return (
          <Input
            {...commonProps}
            type={field.type}
            min={field.min}
            max={field.max}
            ref={ref}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type={field.type}
            ref={ref}
          />
        );
    }
  };

  if (field.type === 'checkbox') {
    return (
      <div className={cn('space-y-2', field.containerClassName)}>
        {renderInput()}
        {field.description && (
          <p className="text-sm text-gray-600">{field.description}</p>
        )}
        {hasError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', field.containerClassName)}>
      {/* Label */}
      {field.label && field.type !== 'checkbox' && (
        <div className="flex items-center justify-between">
          <Label
            htmlFor={field.name}
            className={cn(
              'text-sm font-medium',
              field.required && 'after:content-["*"] after:text-red-500 after:ml-1',
              hasError && 'text-red-600',
              field.labelClassName
            )}
          >
            {field.label}
          </Label>
          
          {/* Help button */}
          {(helpText || onHelpClick) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-1"
              onClick={onHelpClick}
            >
              <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </Button>
          )}
        </div>
      )}

      {/* Input container */}
      <div className="relative">
        {renderInput()}
        
        {/* Validation icons */}
        {showValidationState && (field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'select') && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {showSuccess && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {field.description && (
        <p className="text-sm text-gray-600">{field.description}</p>
      )}

      {/* Help text */}
      {helpText && (
        <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
          {helpText}
        </p>
      )}

      {/* Error message */}
      {hasError && (
        <p className={cn(
          'text-sm text-red-600 flex items-center gap-1',
          field.errorClassName
        )}>
          <AlertCircle className="h-4 w-4" />
          {error.message}
        </p>
      )}

      {/* Loading state for server validation */}
      {isFocused && value && !hasError && !showSuccess && (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <div className="animate-spin h-3 w-3 border border-gray-300 border-t-transparent rounded-full" />
          Doğrulanıyor...
        </div>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
