import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
// import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

// Validate user input
export const validateUserInput = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { input, type } = request.data;

    if (!input || !type) {
      throw new HttpsError('invalid-argument', 'Input and type are required');
    }

    try {
      let isValid = true;
      const errors: string[] = [];
      const sanitizedInput = sanitizeInput(input);

      // Type-specific validation
      switch (type) {
        case 'email':
          isValid = validateEmail(sanitizedInput);
          if (!isValid) errors.push('Geçersiz e-posta formatı');
          break;

        case 'phone':
          isValid = validatePhone(sanitizedInput);
          if (!isValid) errors.push('Geçersiz telefon numarası');
          break;

        case 'name':
          isValid = validateName(sanitizedInput);
          if (!isValid) errors.push('İsim sadece harf ve boşluk içerebilir');
          break;

        default:
          isValid = true;
      }

      // Security checks
      const securityCheck = performSecurityChecks(sanitizedInput);
      if (!securityCheck.safe) {
        isValid = false;
        errors.push(...securityCheck.errors);
      }

      return { 
        isValid,
        errors,
        sanitizedInput,
      };

    } catch (error) {
      logger.error('Error validating user input:', error);
      throw new HttpsError('internal', 'Failed to validate input');
    }
  }
);

// Rate limiting is handled in rate-limiting-functions.ts

// Validate file upload
export const validateFileUpload = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { fileName, fileSize, mimeType } = request.data;

    if (!fileName || !fileSize || !mimeType) {
      throw new HttpsError('invalid-argument', 'File details are required');
    }

    try {
      const validation = {
        isValid: true,
        errors: [] as string[],
      };

      // Check file size (max 10MB)
      if (fileSize > 10 * 1024 * 1024) {
        validation.isValid = false;
        validation.errors.push('Dosya boyutu çok büyük (max 10MB)');
      }

      // Check allowed mime types
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain',
      ];

      if (!allowedTypes.includes(mimeType)) {
        validation.isValid = false;
        validation.errors.push('Dosya türü desteklenmiyor');
      }

      return validation;

  } catch (error) {
      logger.error('Error validating file upload:', error);
      throw new HttpsError('internal', 'Failed to validate file');
    }
  }
);

// Helper functions
function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function validateName(name: string): boolean {
  const nameRegex = /^[a-zA-ZçğıöşüÇĞİÖŞÜ\s]+$/;
  return nameRegex.test(name) && name.length >= 2 && name.length <= 100;
}

function performSecurityChecks(input: string) {
  const result = {
    safe: true,
    errors: [] as string[],
  };

  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i,
  ];

  sqlPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      result.safe = false;
      result.errors.push('SQL injection şüphesi');
    }
  });

  // Check for XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
  ];

  xssPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      result.safe = false;
      result.errors.push('XSS şüphesi');
    }
  });

  return result;
}