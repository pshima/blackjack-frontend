/**
 * Enhanced Input Validation and Sanitization
 * Comprehensive validation for all user inputs with security focus
 */

import { logger } from '../services/monitoring';
import { config } from '../config/environment';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  sanitize?: (value: any) => any;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * XSS Prevention Patterns
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<applet[^>]*>/gi,
  /<meta[^>]*>/gi,
  /<link[^>]*>/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /<svg[^>]*on\w+/gi,
];

/**
 * SQL Injection Prevention Patterns
 */
const SQL_INJECTION_PATTERNS = [
  /('|(\\')|(;|\\;)|(--|\\/\\*)|(\\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT( +INTO)?|MERGE|SELECT|UPDATE|UNION( +ALL)?)\\b))/gi,
  /(\\b(AND|OR)\\b.*(=|>|<|!|<=|>=))/gi,
  /UNION.*SELECT/gi,
  /SELECT.*FROM/gi,
  /INSERT.*INTO/gi,
  /UPDATE.*SET/gi,
  /DELETE.*FROM/gi,
];

/**
 * Command Injection Prevention Patterns
 */
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]/,
  /\.\.\//,
  /\/etc\/passwd/,
  /\/proc\//,
  /cmd\.exe/,
  /powershell/,
  /bash/,
  /sh\s/,
];

/**
 * Sanitize input string to prevent XSS
 */
export function sanitizeXSS(input: string): string {
  if (typeof input !== 'string') return '';
  
  let sanitized = input;
  
  // Remove or escape dangerous patterns
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // HTML encode remaining special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Validate input against SQL injection patterns
 */
export function validateSQLInjection(input: string): boolean {
  if (typeof input !== 'string') return true;
  
  return !SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Validate input against command injection patterns
 */
export function validateCommandInjection(input: string): boolean {
  if (typeof input !== 'string') return true;
  
  return !COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Validate bet amount with comprehensive checks
 */
export function validateBetAmount(amount: any): ValidationResult {
  const errors: string[] = [];
  
  // Type validation
  if (typeof amount !== 'number' && typeof amount !== 'string') {
    errors.push('Bet amount must be a number');
    return { isValid: false, errors };
  }
  
  // Convert to number if string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // NaN check
  if (isNaN(numAmount)) {
    errors.push('Bet amount must be a valid number');
    return { isValid: false, errors };
  }
  
  // Range validation
  if (numAmount < config.minBet) {
    errors.push(`Bet amount must be at least $${config.minBet}`);
  }
  
  if (numAmount > config.maxBet) {
    errors.push(`Bet amount cannot exceed $${config.maxBet}`);
  }
  
  // Decimal places validation (max 2 decimal places for currency)
  if (numAmount % 0.01 !== 0) {
    errors.push('Bet amount can have at most 2 decimal places');
  }
  
  // Negative number check
  if (numAmount <= 0) {
    errors.push('Bet amount must be positive');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: Math.round(numAmount * 100) / 100 // Round to 2 decimal places
  };
}

/**
 * Validate player ID
 */
export function validatePlayerId(playerId: any): ValidationResult {
  const errors: string[] = [];
  
  if (!playerId) {
    errors.push('Player ID is required');
    return { isValid: false, errors };
  }
  
  if (typeof playerId !== 'string') {
    errors.push('Player ID must be a string');
    return { isValid: false, errors };
  }
  
  // Length validation
  if (playerId.length < 3 || playerId.length > 50) {
    errors.push('Player ID must be between 3 and 50 characters');
  }
  
  // Pattern validation (alphanumeric, dashes, underscores only)
  const playerIdPattern = /^[a-zA-Z0-9_-]+$/;
  if (!playerIdPattern.test(playerId)) {
    errors.push('Player ID can only contain letters, numbers, dashes, and underscores');
  }
  
  // Security validation
  if (!validateSQLInjection(playerId) || !validateCommandInjection(playerId)) {
    errors.push('Player ID contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitizeXSS(playerId.trim())
  };
}

/**
 * Validate game ID
 */
export function validateGameId(gameId: any): ValidationResult {
  const errors: string[] = [];
  
  if (!gameId) {
    errors.push('Game ID is required');
    return { isValid: false, errors };
  }
  
  if (typeof gameId !== 'string') {
    errors.push('Game ID must be a string');
    return { isValid: false, errors };
  }
  
  // UUID pattern validation
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(gameId)) {
    errors.push('Game ID must be a valid UUID');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: gameId.toLowerCase().trim()
  };
}

/**
 * Generic validation function using schema
 */
export function validateObject(data: any, schema: ValidationSchema): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};
  
  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    
    // Required field validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // Skip validation if field is not required and empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }
    
    // Type and range validation for numbers
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${field} must be at most ${rule.max}`);
      }
    }
    
    // String length validation
    if (typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        errors.push(`${field} must be at least ${rule.min} characters`);
      }
      if (rule.max !== undefined && value.length > rule.max) {
        errors.push(`${field} must be at most ${rule.max} characters`);
      }
    }
    
    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(`${field} format is invalid`);
    }
    
    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors.push(`${field} validation failed`);
    }
    
    // Sanitization
    if (rule.sanitize) {
      sanitized[field] = rule.sanitize(value);
    } else if (typeof value === 'string') {
      sanitized[field] = sanitizeXSS(value);
    } else {
      sanitized[field] = value;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validate authentication token
 */
export function validateAuthToken(token: any): ValidationResult {
  const errors: string[] = [];
  
  if (!token) {
    errors.push('Authentication token is required');
    return { isValid: false, errors };
  }
  
  if (typeof token !== 'string') {
    errors.push('Authentication token must be a string');
    return { isValid: false, errors };
  }
  
  // JWT pattern validation (simplified)
  const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  if (!jwtPattern.test(token)) {
    errors.push('Authentication token format is invalid');
  }
  
  // Length validation
  if (token.length < 20 || token.length > 2048) {
    errors.push('Authentication token length is invalid');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: token.trim()
  };
}

/**
 * Rate limiting validation per user action
 */
const actionCounts = new Map<string, number[]>();

export function validateRateLimit(userId: string, action: string, maxActions: number = 10, timeWindow: number = 60000): boolean {
  const key = `${userId}:${action}`;
  const now = Date.now();
  
  // Get or initialize action history
  const actions = actionCounts.get(key) || [];
  
  // Remove actions outside time window
  const recentActions = actions.filter(timestamp => now - timestamp < timeWindow);
  
  // Check if limit exceeded
  if (recentActions.length >= maxActions) {
    logger.warn('Rate limit exceeded', {
      userId,
      action,
      count: recentActions.length,
      maxActions
    });
    return false;
  }
  
  // Add current action
  recentActions.push(now);
  actionCounts.set(key, recentActions);
  
  return true;
}

/**
 * Input validation middleware for API requests
 */
export function createValidationMiddleware(schema: ValidationSchema) {
  return (data: any): ValidationResult => {
    // Log validation attempt for security monitoring
    logger.debug('Input validation performed', {
      fields: Object.keys(schema),
      timestamp: new Date().toISOString()
    });
    
    const result = validateObject(data, schema);
    
    if (!result.isValid) {
      logger.warn('Input validation failed', {
        errors: result.errors,
        fields: Object.keys(data)
      });
    }
    
    return result;
  };
}

/**
 * Predefined validation schemas
 */
export const validationSchemas = {
  startGame: {
    bet: {
      required: true,
      min: config.minBet,
      max: config.maxBet,
      custom: (value: any) => typeof value === 'number' && value > 0,
      sanitize: (value: any) => Math.round(parseFloat(value) * 100) / 100
    },
    playerId: {
      required: false,
      min: 3,
      max: 50,
      pattern: /^[a-zA-Z0-9_-]+$/,
      sanitize: sanitizeXSS
    }
  },
  
  gameAction: {
    gameId: {
      required: true,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      sanitize: (value: string) => value.toLowerCase().trim()
    }
  },
  
  authentication: {
    token: {
      required: true,
      min: 20,
      max: 2048,
      pattern: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
      sanitize: (value: string) => value.trim()
    }
  }
};