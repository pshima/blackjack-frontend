// Enhanced Input Validation and Sanitization utilities
// Provides comprehensive validation for all user inputs with security focus

import { logger } from '../services/monitoring';
import { config } from '../config/environment';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: unknown;
}

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean;
  sanitize?: (value: unknown) => unknown;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Common XSS attack patterns to detect and prevent
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

// SQL injection attack patterns to detect and block
const SQL_INJECTION_PATTERNS = [
  /(\b(ALTER|CREATE|DELETE|DROP|EXEC|EXECUTE|INSERT|MERGE|SELECT|UPDATE|UNION)\b)/gi,
  /(--|#|\/\*|\*\/)/,
  /(\bAND\b|\bOR\b).*[=<>]/gi,
  /UNION.*SELECT/gi,
  /SELECT.*FROM/gi,
  /INSERT.*INTO/gi,
  /UPDATE.*SET/gi,
  /DELETE.*FROM/gi,
];

// Command injection patterns that could be used for system attacks
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

// Removes dangerous XSS patterns and HTML-encodes special characters
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

// Returns false if input contains SQL injection patterns
export function validateSQLInjection(input: string): boolean {
  if (typeof input !== 'string') return true;
  
  return !SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// Returns false if input contains command injection patterns
export function validateCommandInjection(input: string): boolean {
  if (typeof input !== 'string') return true;
  
  return !COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// Converts input to a valid number, handling both strings and numbers
function parseAmountToNumber(amount: unknown): { value: number; isValid: boolean; error?: string } {
  if (typeof amount !== 'number' && typeof amount !== 'string') {
    return { value: 0, isValid: false, error: 'Bet amount must be a number' };
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { value: 0, isValid: false, error: 'Bet amount must be a valid number' };
  }
  
  return { value: numAmount, isValid: true };
}

// Validates that a number falls within betting limits and has proper format
function validateBetRange(amount: number): string[] {
  const errors: string[] = [];
  
  if (amount <= 0) {
    errors.push('Bet amount must be positive');
  }
  
  if (amount < config.minBet) {
    errors.push(`Bet amount must be at least $${config.minBet}`);
  }
  
  if (amount > config.maxBet) {
    errors.push(`Bet amount cannot exceed $${config.maxBet}`);
  }
  
  // Decimal places validation (max 2 decimal places for currency)
  if (amount % 0.01 !== 0) {
    errors.push('Bet amount can have at most 2 decimal places');
  }
  
  return errors;
}

// Validates betting amounts with range, format, and security checks
export function validateBetAmount(amount: unknown): ValidationResult {
  const parseResult = parseAmountToNumber(amount);
  
  if (!parseResult.isValid) {
    return { isValid: false, errors: [parseResult.error!] };
  }
  
  const rangeErrors = validateBetRange(parseResult.value);
  
  return {
    isValid: rangeErrors.length === 0,
    errors: rangeErrors,
    sanitized: Math.round(parseResult.value * 100) / 100 // Round to 2 decimal places
  };
}

// Validates player IDs for proper format and security
export function validatePlayerId(playerId: unknown): ValidationResult {
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

// Validates game IDs to ensure they are proper UUIDs
export function validateGameId(gameId: unknown): ValidationResult {
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

// Validates any object against a provided schema with field-by-field checks
export function validateObject(data: unknown, schema: ValidationSchema): ValidationResult {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};
  
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

// Validates JWT authentication tokens for proper format and length
export function validateAuthToken(token: unknown): ValidationResult {
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

// Tracks user actions to prevent abuse through rate limiting
const actionCounts = new Map<string, number[]>();

// Filters out old actions beyond the time window
function getRecentActions(actions: number[], timeWindow: number): number[] {
  const now = Date.now();
  return actions.filter(timestamp => now - timestamp < timeWindow);
}

// Checks if user has exceeded rate limit for a specific action
export function validateRateLimit(userId: string, action: string, maxActions: number = 10, timeWindow: number = 60000): boolean {
  const key = `${userId}:${action}`;
  const actions = actionCounts.get(key) || [];
  const recentActions = getRecentActions(actions, timeWindow);
  
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
  
  // Add current action and update cache
  recentActions.push(Date.now());
  actionCounts.set(key, recentActions);
  
  return true;
}

// Creates a reusable validation middleware function for API requests
export function createValidationMiddleware(schema: ValidationSchema) {
  return (data: unknown): ValidationResult => {
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

// Pre-configured validation schemas for common use cases
export const validationSchemas = {
  startGame: {
    bet: {
      required: true,
      min: config.minBet,
      max: config.maxBet,
      custom: (value: unknown) => typeof value === 'number' && value > 0,
      sanitize: (value: unknown) => Math.round(parseFloat(value as string) * 100) / 100
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