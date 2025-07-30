/**
 * Environment Configuration Management
 * Centralized configuration with validation and type safety
 */

export interface EnvironmentConfig {
  // Application
  nodeEnv: 'development' | 'production' | 'test';
  appVersion: string;
  appName: string;
  
  // API Configuration
  apiBaseUrl: string;
  apiTimeout: number;
  apiRetryAttempts: number;
  apiRetryDelay: number;
  
  // WebSocket Configuration
  wsUrl?: string;
  wsReconnectAttempts: number;
  wsReconnectDelay: number;
  
  // Security
  enableCSP: boolean;
  enableHttpsRedirect: boolean;
  
  // Monitoring
  sentryDsn?: string;
  sentryEnvironment: string;
  sentrySampleRate: number;
  enableAnalytics: boolean;
  gaTrackingId?: string;
  
  // Feature Flags
  enableDemoMode: boolean;
  enableDeveloperTools: boolean;
  enableErrorBoundaryFallback: boolean;
  
  // Performance
  enablePreload: boolean;
  enableServiceWorker: boolean;
  cacheStrategy: 'networkFirst' | 'cacheFirst' | 'networkOnly';
  
  // Rate Limiting
  maxRequestsPerMinute: number;
  enableRequestThrottling: boolean;
  
  // Game Configuration
  minBet: number;
  maxBet: number;
  defaultPlayerBalance: number;
  gameTimeout: number;
  
  // Debugging
  enableConsoleLogs: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Environment variable validation schema
 */
const environmentSchema = {
  // Required variables
  required: [
    'VITE_API_BASE_URL',
    'VITE_APP_VERSION',
    'VITE_APP_NAME'
  ],
  
  // Optional variables with defaults
  optional: {
    NODE_ENV: 'development',
    VITE_API_TIMEOUT: '30000',
    VITE_API_RETRY_ATTEMPTS: '3',
    VITE_API_RETRY_DELAY: '1000',
    VITE_WS_RECONNECT_ATTEMPTS: '5',
    VITE_WS_RECONNECT_DELAY: '3000',
    VITE_ENABLE_CSP: 'true',
    VITE_ENABLE_HTTPS_REDIRECT: 'false',
    VITE_SENTRY_ENVIRONMENT: 'development',
    VITE_SENTRY_SAMPLE_RATE: '0.1',
    VITE_ENABLE_ANALYTICS: 'false',
    VITE_ENABLE_DEMO_MODE: 'true',
    VITE_ENABLE_DEVELOPER_TOOLS: 'true',
    VITE_ENABLE_ERROR_BOUNDARY_FALLBACK: 'true',
    VITE_ENABLE_PRELOAD: 'true',
    VITE_ENABLE_SERVICE_WORKER: 'false',
    VITE_CACHE_STRATEGY: 'networkFirst',
    VITE_MAX_REQUESTS_PER_MINUTE: '100',
    VITE_ENABLE_REQUEST_THROTTLING: 'true',
    VITE_MIN_BET: '1',
    VITE_MAX_BET: '1000',
    VITE_DEFAULT_PLAYER_BALANCE: '1000',
    VITE_GAME_TIMEOUT: '300000',
    VITE_ENABLE_CONSOLE_LOGS: 'true',
    VITE_LOG_LEVEL: 'info'
  }
};

/**
 * Validates and parses environment variables
 */
function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];
  
  // Check required variables
  for (const variable of environmentSchema.required) {
    if (!import.meta.env[variable]) {
      errors.push(`Missing required environment variable: ${variable}`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
  
  // Helper function to get environment value with fallback
  const getEnvValue = (key: string, fallback?: string): string => {
    return import.meta.env[key] || environmentSchema.optional[key as keyof typeof environmentSchema.optional] || fallback || '';
  };
  
  // Helper function to parse boolean values
  const parseBoolean = (value: string): boolean => {
    return value.toLowerCase() === 'true';
  };
  
  // Helper function to parse numbers with validation
  const parseNumber = (value: string, min?: number, max?: number): number => {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`Invalid number value: ${value}`);
    }
    if (min !== undefined && num < min) {
      throw new Error(`Value ${num} is below minimum ${min}`);
    }
    if (max !== undefined && num > max) {
      throw new Error(`Value ${num} is above maximum ${max}`);
    }
    return num;
  };
  
  // Validate NODE_ENV
  const nodeEnv = getEnvValue('NODE_ENV') as EnvironmentConfig['nodeEnv'];
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV value: ${nodeEnv}. Must be one of: development, production, test`);
  }
  
  // Validate cache strategy
  const cacheStrategy = getEnvValue('VITE_CACHE_STRATEGY') as EnvironmentConfig['cacheStrategy'];
  if (!['networkFirst', 'cacheFirst', 'networkOnly'].includes(cacheStrategy)) {
    throw new Error(`Invalid cache strategy: ${cacheStrategy}`);
  }
  
  // Validate log level
  const logLevel = getEnvValue('VITE_LOG_LEVEL') as EnvironmentConfig['logLevel'];
  if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
    throw new Error(`Invalid log level: ${logLevel}`);
  }
  
  // Validate API URL format
  const apiBaseUrl = getEnvValue('VITE_API_BASE_URL');
  try {
    new URL(apiBaseUrl);
  } catch {
    throw new Error(`Invalid API base URL format: ${apiBaseUrl}`);
  }
  
  return {
    // Application
    nodeEnv,
    appVersion: getEnvValue('VITE_APP_VERSION'),
    appName: getEnvValue('VITE_APP_NAME'),
    
    // API Configuration
    apiBaseUrl,
    apiTimeout: parseNumber(getEnvValue('VITE_API_TIMEOUT'), 1000, 120000),
    apiRetryAttempts: parseNumber(getEnvValue('VITE_API_RETRY_ATTEMPTS'), 0, 10),
    apiRetryDelay: parseNumber(getEnvValue('VITE_API_RETRY_DELAY'), 100, 10000),
    
    // WebSocket Configuration
    wsUrl: getEnvValue('VITE_WS_URL') || undefined,
    wsReconnectAttempts: parseNumber(getEnvValue('VITE_WS_RECONNECT_ATTEMPTS'), 0, 20),
    wsReconnectDelay: parseNumber(getEnvValue('VITE_WS_RECONNECT_DELAY'), 1000, 30000),
    
    // Security
    enableCSP: parseBoolean(getEnvValue('VITE_ENABLE_CSP')),
    enableHttpsRedirect: parseBoolean(getEnvValue('VITE_ENABLE_HTTPS_REDIRECT')),
    
    // Monitoring
    sentryDsn: getEnvValue('VITE_SENTRY_DSN') || undefined,
    sentryEnvironment: getEnvValue('VITE_SENTRY_ENVIRONMENT'),
    sentrySampleRate: parseFloat(getEnvValue('VITE_SENTRY_SAMPLE_RATE')) || 0.1,
    enableAnalytics: parseBoolean(getEnvValue('VITE_ENABLE_ANALYTICS')),
    gaTrackingId: getEnvValue('VITE_GA_TRACKING_ID') || undefined,
    
    // Feature Flags
    enableDemoMode: parseBoolean(getEnvValue('VITE_ENABLE_DEMO_MODE')),
    enableDeveloperTools: parseBoolean(getEnvValue('VITE_ENABLE_DEVELOPER_TOOLS')),
    enableErrorBoundaryFallback: parseBoolean(getEnvValue('VITE_ENABLE_ERROR_BOUNDARY_FALLBACK')),
    
    // Performance
    enablePreload: parseBoolean(getEnvValue('VITE_ENABLE_PRELOAD')),
    enableServiceWorker: parseBoolean(getEnvValue('VITE_ENABLE_SERVICE_WORKER')),
    cacheStrategy,
    
    // Rate Limiting
    maxRequestsPerMinute: parseNumber(getEnvValue('VITE_MAX_REQUESTS_PER_MINUTE'), 1, 1000),
    enableRequestThrottling: parseBoolean(getEnvValue('VITE_ENABLE_REQUEST_THROTTLING')),
    
    // Game Configuration
    minBet: parseNumber(getEnvValue('VITE_MIN_BET'), 1),
    maxBet: parseNumber(getEnvValue('VITE_MAX_BET'), 1),
    defaultPlayerBalance: parseNumber(getEnvValue('VITE_DEFAULT_PLAYER_BALANCE'), 1),
    gameTimeout: parseNumber(getEnvValue('VITE_GAME_TIMEOUT'), 10000),
    
    // Debugging
    enableConsoleLogs: parseBoolean(getEnvValue('VITE_ENABLE_CONSOLE_LOGS')),
    logLevel
  };
}

// Validate and export configuration
let config: EnvironmentConfig;

try {
  config = validateEnvironment();
} catch (error) {
  console.error('Environment configuration error:', error);
  // In production, we should fail fast
  if (import.meta.env.PROD) {
    throw error;
  }
  // In development, provide sensible defaults
  config = {
    nodeEnv: 'development',
    appVersion: '1.0.0-dev',
    appName: 'Blackjack Casino (Dev)',
    apiBaseUrl: 'http://localhost:3000/api',
    apiTimeout: 30000,
    apiRetryAttempts: 3,
    apiRetryDelay: 1000,
    wsReconnectAttempts: 5,
    wsReconnectDelay: 3000,
    enableCSP: false,
    enableHttpsRedirect: false,
    sentryEnvironment: 'development',
    sentrySampleRate: 0.1,
    enableAnalytics: false,
    enableDemoMode: true,
    enableDeveloperTools: true,
    enableErrorBoundaryFallback: true,
    enablePreload: true,
    enableServiceWorker: false,
    cacheStrategy: 'networkFirst',
    maxRequestsPerMinute: 100,
    enableRequestThrottling: false,
    minBet: 1,
    maxBet: 1000,
    defaultPlayerBalance: 1000,
    gameTimeout: 300000,
    enableConsoleLogs: true,
    logLevel: 'info'
  };
}

export { config };

/**
 * Runtime environment checks
 */
export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';

/**
 * Feature flag helpers
 */
export const featureFlags = {
  isDemoMode: config.enableDemoMode,
  isDeveloperToolsEnabled: config.enableDeveloperTools && isDevelopment,
  isErrorBoundaryFallbackEnabled: config.enableErrorBoundaryFallback,
  isAnalyticsEnabled: config.enableAnalytics && isProduction,
  isSentryEnabled: !!config.sentryDsn,
  isServiceWorkerEnabled: config.enableServiceWorker && isProduction,
  isRequestThrottlingEnabled: config.enableRequestThrottling
};

/**
 * Logging configuration
 */
export const shouldLog = (level: EnvironmentConfig['logLevel']): boolean => {
  if (!config.enableConsoleLogs) return false;
  
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(config.logLevel);
  const requestedLevelIndex = levels.indexOf(level);
  
  return requestedLevelIndex >= currentLevelIndex;
};