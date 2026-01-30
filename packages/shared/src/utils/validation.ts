export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'phone' | 'url' | 'number' | 'string' | 'array' | 'object' | 'custom';
  message: string;
  options?: ValidationOptions;
  customValidator?: (value: any) => boolean;
}

export interface ValidationOptions {
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowEmpty?: boolean;
  choices?: any[];
  nested?: ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export class Validator {
  private rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): Validator {
    this.rules.push(rule);
    return this;
  }

  addRules(rules: ValidationRule[]): Validator {
    this.rules.push(...rules);
    return this;
  }

  validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of this.rules) {
      const value = this.getNestedValue(data, rule.field);
      const result = this.validateField(value, rule);
      
      if (!result.isValid) {
        errors.push({
          field: rule.field,
          message: rule.message,
          code: this.getErrorCode(rule.type),
          value
        });
      }

      if (result.warning) {
        warnings.push(result.warning);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateField(value: any, rule: ValidationRule): { isValid: boolean; warning?: ValidationWarning } {
    // Handle required validation
    if (rule.type === 'required') {
      return { isValid: value !== undefined && value !== null && value !== '' };
    }

    // Skip validation if value is empty and not required
    if ((value === undefined || value === null || value === '') && rule.options?.allowEmpty !== false) {
      return { isValid: true };
    }

    switch (rule.type) {
      case 'email':
        return this.validateEmail(value, rule);
      case 'phone':
        return this.validatePhone(value, rule);
      case 'url':
        return this.validateUrl(value, rule);
      case 'number':
        return this.validateNumber(value, rule);
      case 'string':
        return this.validateString(value, rule);
      case 'array':
        return this.validateArray(value, rule);
      case 'object':
        return this.validateObject(value, rule);
      case 'custom':
        return { isValid: rule.customValidator ? rule.customValidator(value) : true };
      default:
        return { isValid: true };
    }
  }

  private validateEmail(value: any, rule: ValidationRule): { isValid: boolean; warning?: ValidationWarning } {
    if (typeof value !== 'string') {
      return { isValid: false };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    
    // Check for common email issues
    let warning: ValidationWarning | undefined;
    if (isValid && value.includes('..')) {
      warning = {
        field: rule.field,
        message: 'Email contains consecutive dots',
        suggestion: 'Remove consecutive dots from email address'
      };
    }

    return { isValid, warning };
  }

  private validatePhone(value: any, rule: ValidationRule): { isValid: boolean; warning?: ValidationWarning } {
    if (typeof value !== 'string') {
      return { isValid: false };
    }

    // Indian phone number validation
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    
    return { isValid: phoneRegex.test(cleanPhone) };
  }

  private validateUrl(value: any, rule: ValidationRule): { isValid: boolean; warning?: ValidationWarning } {
    if (typeof value !== 'string') {
      return { isValid: false };
    }

    try {
      new URL(value);
      return { isValid: true };
    } catch {
      return { isValid: false };
    }
  }

  private validateNumber(value: any, rule: ValidationRule): { isValid: boolean; warning?: ValidationWarning } {
    const num = Number(value);
    if (isNaN(num)) {
      return { isValid: false };
    }

    const options = rule.options;
    if (options?.min !== undefined && num < options.min) {
      return { isValid: false };
    }

    if (options?.max !== undefined && num > options.max) {
      return { isValid: false };
    }

    return { isValid: true };
  }

  private validateString(value: any, rule: ValidationRule): { isValid: boolean; warning?: ValidationWarning } {
    if (typeof value !== 'string') {
      return { isValid: false };
    }

    const options = rule.options;
    if (options?.min !== undefined && value.length < options.min) {
      return { isValid: false };
    }

    if (options?.max !== undefined && value.length > options.max) {
      return { isValid: false };
    }

    if (options?.pattern && !options.pattern.test(value)) {
      return { isValid: false };
    }

    if (options?.choices && !options.choices.includes(value)) {
      return { isValid: false };
    }

    return { isValid: true };
  }

  private validateArray(value: any, rule: ValidationRule): { isValid: boolean; warning?: ValidationWarning } {
    if (!Array.isArray(value)) {
      return { isValid: false };
    }

    const options = rule.options;
    if (options?.min !== undefined && value.length < options.min) {
      return { isValid: false };
    }

    if (options?.max !== undefined && value.length > options.max) {
      return { isValid: false };
    }

    return { isValid: true };
  }

  private validateObject(value: any, rule: ValidationRule): { isValid: boolean; warning?: ValidationWarning } {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { isValid: false };
    }

    // Validate nested fields if specified
    if (rule.options?.nested) {
      const nestedValidator = new Validator();
      nestedValidator.addRules(rule.options.nested);
      const result = nestedValidator.validate(value);
      return { isValid: result.isValid };
    }

    return { isValid: true };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private getErrorCode(type: string): string {
    const codes: Record<string, string> = {
      required: 'REQUIRED_FIELD',
      email: 'INVALID_EMAIL',
      phone: 'INVALID_PHONE',
      url: 'INVALID_URL',
      number: 'INVALID_NUMBER',
      string: 'INVALID_STRING',
      array: 'INVALID_ARRAY',
      object: 'INVALID_OBJECT',
      custom: 'CUSTOM_VALIDATION_FAILED'
    };
    return codes[type] || 'VALIDATION_ERROR';
  }
}

// Common validation rules
export const CommonValidationRules = {
  required: (field: string, message?: string): ValidationRule => ({
    field,
    type: 'required',
    message: message || `${field} is required`
  }),

  email: (field: string, message?: string): ValidationRule => ({
    field,
    type: 'email',
    message: message || `${field} must be a valid email address`
  }),

  phone: (field: string, message?: string): ValidationRule => ({
    field,
    type: 'phone',
    message: message || `${field} must be a valid Indian phone number`
  }),

  string: (field: string, min?: number, max?: number, message?: string): ValidationRule => ({
    field,
    type: 'string',
    message: message || `${field} must be a string${min ? ` with minimum ${min} characters` : ''}${max ? ` and maximum ${max} characters` : ''}`,
    options: { min, max }
  }),

  number: (field: string, min?: number, max?: number, message?: string): ValidationRule => ({
    field,
    type: 'number',
    message: message || `${field} must be a number${min !== undefined ? ` >= ${min}` : ''}${max !== undefined ? ` <= ${max}` : ''}`,
    options: { min, max }
  }),

  array: (field: string, min?: number, max?: number, message?: string): ValidationRule => ({
    field,
    type: 'array',
    message: message || `${field} must be an array${min ? ` with minimum ${min} items` : ''}${max ? ` and maximum ${max} items` : ''}`,
    options: { min, max }
  }),

  choices: (field: string, choices: any[], message?: string): ValidationRule => ({
    field,
    type: 'string',
    message: message || `${field} must be one of: ${choices.join(', ')}`,
    options: { choices }
  })
};

// Utility functions
export function validateUserRegistration(data: any): ValidationResult {
  const validator = new Validator()
    .addRules([
      CommonValidationRules.required('name'),
      CommonValidationRules.string('name', 2, 100),
      CommonValidationRules.required('phoneNumber'),
      CommonValidationRules.phone('phoneNumber'),
      CommonValidationRules.email('email'),
      CommonValidationRules.required('password'),
      CommonValidationRules.string('password', 8, 128),
      CommonValidationRules.required('userType'),
      CommonValidationRules.choices('userType', ['vendor', 'buyer', 'intermediary']),
      CommonValidationRules.string('preferredLanguage', 2, 10)
    ]);

  return validator.validate(data);
}

export function validateVendorProfile(data: any): ValidationResult {
  const validator = new Validator()
    .addRules([
      CommonValidationRules.required('businessInfo.businessName'),
      CommonValidationRules.string('businessInfo.businessName', 2, 200),
      CommonValidationRules.required('businessInfo.businessType'),
      CommonValidationRules.choices('businessInfo.businessType', ['individual', 'partnership', 'company', 'cooperative']),
      CommonValidationRules.required('businessInfo.establishedYear'),
      CommonValidationRules.number('businessInfo.establishedYear', 1900, new Date().getFullYear()),
      CommonValidationRules.required('businessInfo.description'),
      CommonValidationRules.string('businessInfo.description', 10, 1000),
      CommonValidationRules.required('businessInfo.categories'),
      CommonValidationRules.array('businessInfo.categories', 1, 10),
      CommonValidationRules.required('specializations'),
      CommonValidationRules.array('specializations', 1, 20)
    ]);

  return validator.validate(data);
}

export function validateProduct(data: any): ValidationResult {
  const validator = new Validator()
    .addRules([
      CommonValidationRules.required('name'),
      CommonValidationRules.string('name', 2, 255),
      CommonValidationRules.required('category'),
      CommonValidationRules.string('category', 2, 100),
      CommonValidationRules.required('basePrice'),
      CommonValidationRules.number('basePrice', 0.01),
      CommonValidationRules.required('availability'),
      CommonValidationRules.string('description', 0, 2000)
    ]);

  return validator.validate(data);
}