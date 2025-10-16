import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandling } from '@/hooks/use-error-handling';

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('useErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
  });

  it('should initialize with empty error state', () => {
    const { result } = renderHook(() => useErrorHandling());

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it('should handle errors correctly', () => {
    const { result } = renderHook(() => useErrorHandling());
    const testError = new Error('Test error');

    act(() => {
      result.current.handleError(testError);
    });

    expect(result.current.error).toBe(testError);
    expect(result.current.hasError).toBe(true);
    expect(mockConsoleError).toHaveBeenCalledWith('Error caught:', testError);
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useErrorHandling());
    const testError = new Error('Test error');

    act(() => {
      result.current.handleError(testError);
    });

    expect(result.current.hasError).toBe(true);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it('should retry operations with exponential backoff', async () => {
    const { result } = renderHook(() => useErrorHandling());
    let callCount = 0;
    
    const operation = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Temporary error');
      }
      return Promise.resolve('success');
    });

    let operationResult: any;

    await act(async () => {
      operationResult = await result.current.retryOperation(operation, 3, 100);
    });

    expect(operationResult).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should handle operation failure after max retries', async () => {
    const { result } = renderHook(() => useErrorHandling());
    const operation = vi.fn().mockRejectedValue(new Error('Persistent error'));

    await act(async () => {
      try {
        await result.current.retryOperation(operation, 2, 50);
      } catch (error) {
        // Expected to throw after retries
      }
    });

    expect(operation).toHaveBeenCalledTimes(2);
    expect(result.current.hasError).toBe(true);
  });

  it('should execute safe operations without throwing', async () => {
    const { result } = renderHook(() => useErrorHandling());
    const successOperation = vi.fn().mockResolvedValue('success');
    const errorOperation = vi.fn().mockRejectedValue(new Error('Test error'));

    let successResult: any;
    let errorResult: any;

    await act(async () => {
      successResult = await result.current.safeExecute(successOperation);
      errorResult = await result.current.safeExecute(errorOperation);
    });

    expect(successResult).toBe('success');
    expect(errorResult).toBeNull();
    expect(result.current.hasError).toBe(true);
  });

  it('should validate data using provided validator', () => {
    const { result } = renderHook(() => useErrorHandling());
    
    const validator = (data: any) => {
      if (!data || typeof data.name !== 'string') {
        throw new Error('Invalid data format');
      }
      return data;
    };

    const validData = { name: 'Test', age: 25 };
    const invalidData = { age: 25 };

    act(() => {
      const validResult = result.current.validateData(validData, validator);
      expect(validResult).toEqual(validData);
    });

    act(() => {
      const invalidResult = result.current.validateData(invalidData, validator);
      expect(invalidResult).toBeNull();
      expect(result.current.hasError).toBe(true);
    });
  });

  it('should format error messages appropriately', () => {
    const { result } = renderHook(() => useErrorHandling());

    // Test different error types
    const networkError = new Error('Network request failed');
    networkError.name = 'NetworkError';

    const validationError = new Error('Validation failed');
    validationError.name = 'ValidationError';

    const genericError = new Error('Something went wrong');

    act(() => {
      result.current.handleError(networkError);
    });
    expect(result.current.getErrorMessage()).toContain('bağlantı');

    act(() => {
      result.current.clearError();
      result.current.handleError(validationError);
    });
    expect(result.current.getErrorMessage()).toContain('geçersiz');

    act(() => {
      result.current.clearError();
      result.current.handleError(genericError);
    });
    expect(result.current.getErrorMessage()).toBe('Something went wrong');
  });

  it('should track loading state during operations', async () => {
    const { result } = renderHook(() => useErrorHandling());
    
    const slowOperation = () => new Promise(resolve => setTimeout(() => resolve('done'), 100));

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.safeExecute(slowOperation);
    });

    expect(result.current.isLoading).toBe(true);

    // Wait for operation to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.isLoading).toBe(false);
  });
});
