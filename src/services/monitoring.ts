/**
 * Monitoring and Error Tracking Service
 * Centralized error monitoring, logging, and performance tracking
 */

import * as Sentry from '@sentry/react';
import { config, featureFlags, shouldLog } from '../config/environment';

export interface LogContext {
  userId?: string;
  gameId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  tags?: Record<string, string>;
}

/**
 * Initialize monitoring services
 */
export function initializeMonitoring(): void {
  if (featureFlags.isSentryEnabled) {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.sentryEnvironment,
      sampleRate: config.sentrySampleRate,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          // Only capture replays for errors in production
          maskAllText: true,
          blockAllMedia: true,
          replaysSessionSampleRate: config.nodeEnv === 'production' ? 0.1 : 0,
          replaysOnErrorSampleRate: 1.0,
        }),
      ],
      tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
      
      // Security: Filter sensitive data
      beforeSend(event) {
        // Remove potentially sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.['authorization'];
          delete event.request.headers?.['cookie'];
        }
        
        // Filter out API keys and tokens from extra data
        if (event.extra) {
          Object.keys(event.extra).forEach(key => {
            if (key.toLowerCase().includes('token') || 
                key.toLowerCase().includes('key') || 
                key.toLowerCase().includes('password')) {
              event.extra![key] = '[Filtered]';
            }
          });
        }
        
        return event;
      },
      
      // Set user context based on game state
      initialScope: {
        tags: {
          component: 'blackjack-frontend',
          version: config.appVersion,
        },
      },
    });
    
    if (shouldLog('info')) {
      console.info('Sentry monitoring initialized');
    }
  }
}

/**
 * Logging service with structured logging
 */
export class Logger {
  private static instance: Logger;
  
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }
  
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }
  
  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
    
    if (featureFlags.isSentryEnabled) {
      Sentry.addBreadcrumb({
        message,
        level: 'info',
        data: context,
      });
    }
  }
  
  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
    
    if (featureFlags.isSentryEnabled) {
      Sentry.addBreadcrumb({
        message,
        level: 'warning',
        data: context,
      });
    }
  }
  
  error(message: string, error?: Error, context?: LogContext): void {
    if (shouldLog('error')) {
      console.error(this.formatMessage('error', message, context), error);
    }
    
    if (featureFlags.isSentryEnabled) {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setContext('additional', context);
          if (context.userId) scope.setUser({ id: context.userId });
          if (context.gameId) scope.setTag('gameId', context.gameId);
          if (context.action) scope.setTag('action', context.action);
        }
        
        if (error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(message, 'error');
        }
      });
    }
  }
  
  /**
   * Log game-specific events
   */
  gameEvent(event: string, context: LogContext): void {
    this.info(`Game Event: ${event}`, context);
  }
  
  /**
   * Log API interactions
   */
  apiCall(method: string, endpoint: string, duration: number, status: number, context?: LogContext): void {
    const logContext = {
      ...context,
      method,
      endpoint,
      duration,
      status,
    };
    
    if (status >= 400) {
      this.warn(`API call failed: ${method} ${endpoint}`, logContext);
    } else {
      this.debug(`API call: ${method} ${endpoint}`, logContext);
    }
  }
}

/**
 * Performance monitoring service
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * Start timing an operation
   */
  startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
      });
    };
  }
  
  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.set(metric.name, metric.value);
    
    if (shouldLog('debug')) {
      console.debug(`Performance metric: ${metric.name} = ${metric.value}${metric.unit}`);
    }
    
    if (featureFlags.isSentryEnabled) {
      Sentry.metrics.increment('custom_metric', 1, {
        tags: {
          name: metric.name,
          unit: metric.unit,
          ...metric.tags,
        },
      });
    }
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
  
  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
  
  /**
   * Monitor React component render times
   */
  componentRenderTime(componentName: string): (props?: any) => void {
    return this.startTimer(`component_render_${componentName}`);
  }
}

/**
 * Error boundary error handler
 */
export function handleErrorBoundaryError(error: Error, errorInfo: { componentStack: string }): void {
  const logger = Logger.getInstance();
  
  logger.error('React Error Boundary caught an error', error, {
    metadata: {
      componentStack: errorInfo.componentStack,
    },
  });
}

/**
 * Global error handler
 */
export function setupGlobalErrorHandling(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const logger = Logger.getInstance();
    logger.error('Unhandled promise rejection', event.reason, {
      metadata: {
        type: 'unhandledrejection',
        promise: event.promise.toString(),
      },
    });
  });
  
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    const logger = Logger.getInstance();
    logger.error('Uncaught error', event.error, {
      metadata: {
        type: 'uncaught',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
  
  if (shouldLog('info')) {
    console.info('Global error handling initialized');
  }
}

/**
 * User session tracking
 */
export function setUserContext(userId: string, additional?: Record<string, unknown>): void {
  if (featureFlags.isSentryEnabled) {
    Sentry.setUser({
      id: userId,
      ...additional,
    });
  }
  
  const logger = Logger.getInstance();
  logger.info('User context set', { userId, ...additional });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  if (featureFlags.isSentryEnabled) {
    Sentry.setUser(null);
  }
  
  const logger = Logger.getInstance();
  logger.info('User context cleared');
}

// Export singleton instances
export const logger = Logger.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();