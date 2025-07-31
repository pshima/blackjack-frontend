/**
 * Health Check and Application Monitoring Service
 * Provides endpoints and utilities for monitoring application health
 */

import { config, isProduction } from '../config/environment';
import { logger, performanceMonitor } from './monitoring';
import { getServiceWorkerStatus } from '../utils/serviceWorker';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    api: HealthCheckStatus;
    serviceWorker: HealthCheckStatus;
    localStorage: HealthCheckStatus;
    performance: HealthCheckStatus;
  };
  metrics?: {
    memoryUsage?: number;
    renderTime?: number;
    apiLatency?: number;
  };
}

export interface HealthCheckStatus {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: unknown;
  responseTime?: number;
}

// Track application start time
const appStartTime = Date.now();

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = performance.now();
  logger.debug('Starting health check');

  const checks = {
    api: await checkApiHealth(),
    serviceWorker: checkServiceWorkerHealth(),
    localStorage: checkLocalStorageHealth(),
    performance: checkPerformanceHealth(),
  };

  // Determine overall status
  const hasFailures = Object.values(checks).some(check => check.status === 'fail');
  const hasWarnings = Object.values(checks).some(check => check.status === 'warn');
  
  let overallStatus: HealthCheckResult['status'] = 'healthy';
  if (hasFailures) {
    overallStatus = 'unhealthy';
  } else if (hasWarnings) {
    overallStatus = 'degraded';
  }

  const healthCheck: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - appStartTime,
    version: config.appVersion,
    environment: config.nodeEnv,
    checks,
  };

  // Add metrics in production
  if (isProduction) {
    healthCheck.metrics = {
      memoryUsage: getMemoryUsage(),
      renderTime: performanceMonitor.getMetrics()['app_render_time'],
      apiLatency: performanceMonitor.getMetrics()['api_average_latency'],
    };
  }

  const totalTime = performance.now() - startTime;
  logger.debug('Health check completed', {
    metadata: { 
      status: overallStatus, 
      duration: totalTime,
      checks: Object.keys(checks).length 
    }
  });

  return healthCheck;
}

/**
 * Check API connectivity and health
 */
async function checkApiHealth(): Promise<HealthCheckStatus> {
  const startTime = performance.now();
  
  try {
    // Simple connectivity test
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${config.apiBaseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;

    if (response.ok) {
      return {
        status: 'pass',
        message: 'API is reachable',
        responseTime,
      };
    } else {
      return {
        status: 'fail',
        message: `API returned status ${response.status}`,
        responseTime,
        details: { status: response.status, statusText: response.statusText },
      };
    }
  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'fail',
        message: 'API health check timed out (5s)',
        responseTime,
      };
    }

    return {
      status: 'fail',
      message: 'API is unreachable',
      responseTime,
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}

/**
 * Check service worker health
 */
function checkServiceWorkerHealth(): HealthCheckStatus {
  const swStatus = getServiceWorkerStatus();

  if (!swStatus.supported) {
    return {
      status: 'warn',
      message: 'Service worker not supported',
      details: swStatus,
    };
  }

  if (!swStatus.registered) {
    return {
      status: 'warn',
      message: 'Service worker not registered',
      details: swStatus,
    };
  }

  if (!swStatus.active) {
    return {
      status: 'warn',
      message: 'Service worker not active',
      details: swStatus,
    };
  }

  if (swStatus.updateAvailable) {
    return {
      status: 'warn',
      message: 'Service worker update available',
      details: swStatus,
    };
  }

  return {
    status: 'pass',
    message: 'Service worker is healthy',
    details: swStatus,
  };
}

/**
 * Check local storage availability
 */
function checkLocalStorageHealth(): HealthCheckStatus {
  try {
    const testKey = '__health_check_test__';
    const testValue = Date.now().toString();
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    if (retrieved === testValue) {
      return {
        status: 'pass',
        message: 'Local storage is working',
      };
    } else {
      return {
        status: 'fail',
        message: 'Local storage read/write mismatch',
        details: { expected: testValue, actual: retrieved },
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      message: 'Local storage is not available',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}

/**
 * Check performance metrics
 */
function checkPerformanceHealth(): HealthCheckStatus {
  const metrics = performanceMonitor.getMetrics();
  const warnings: string[] = [];
  
  // Check render performance
  const renderTime = metrics['app_render_time'];
  if (renderTime && renderTime > 1000) {
    warnings.push(`Slow render time: ${renderTime.toFixed(2)}ms`);
  }

  // Check memory usage
  const memoryUsage = getMemoryUsage();
  if (memoryUsage && memoryUsage > 100) { // 100MB threshold
    warnings.push(`High memory usage: ${memoryUsage.toFixed(2)}MB`);
  }

  // Check API latency
  const apiLatency = metrics['api_average_latency'];
  if (apiLatency && apiLatency > 2000) {
    warnings.push(`High API latency: ${apiLatency.toFixed(2)}ms`);
  }

  if (warnings.length > 0) {
    return {
      status: 'warn',
      message: 'Performance issues detected',
      details: { warnings, metrics },
    };
  }

  return {
    status: 'pass',
    message: 'Performance is good',
    details: { metrics },
  };
}

/**
 * Get memory usage information
 */
function getMemoryUsage(): number | undefined {
  if ('memory' in performance) {
    const memory = (performance as { memory: { usedJSHeapSize: number } }).memory;
    return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
  }
  return undefined;
}

/**
 * Expose health check endpoint for external monitoring
 */
export function exposeHealthCheckEndpoint(): void {
  if (typeof window === 'undefined') return;

  // Create a global function for external health checks
  (window as { __healthCheck?: () => Promise<HealthCheckResult> }).__healthCheck = async () => {
    try {
      return await performHealthCheck();
    } catch (error) {
      logger.error('Health check failed', error as Error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - appStartTime,
        version: config.appVersion,
        environment: config.nodeEnv,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  logger.info('Health check endpoint exposed at window.__healthCheck');
}

/**
 * Start periodic health monitoring
 */
export function startHealthMonitoring(intervalMs: number = 60000): () => void {
  let intervalId: number;

  const startMonitoring = () => {
    intervalId = window.setInterval(async () => {
      try {
        const healthResult = await performHealthCheck();
        
        if (healthResult.status === 'unhealthy') {
          logger.error('Application health check failed', undefined, {
            metadata: { healthResult }
          });
        } else if (healthResult.status === 'degraded') {
          logger.warn('Application health degraded', {
            metadata: { healthResult }
          });
        } else {
          logger.debug('Application health check passed', {
            metadata: { status: healthResult.status }
          });
        }
      } catch (error) {
        logger.error('Health monitoring failed', error as Error);
      }
    }, intervalMs);
  };

  // Start monitoring after page load
  if (document.readyState === 'complete') {
    startMonitoring();
  } else {
    window.addEventListener('load', startMonitoring);
  }

  logger.info('Health monitoring started', {
    metadata: { intervalMs }
  });

  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      logger.info('Health monitoring stopped');
    }
  };
}

/**
 * Check if application is ready for traffic
 */
export async function checkReadiness(): Promise<boolean> {
  try {
    const healthResult = await performHealthCheck();
    return healthResult.status !== 'unhealthy';
  } catch (error) {
    logger.error('Readiness check failed', error as Error);
    return false;
  }
}