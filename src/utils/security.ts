/**
 * Security Utilities and Hardening Features
 * Client-side security enforcement and monitoring
 */

import { logger } from '../services/monitoring';
import { config, isProduction } from '../config/environment';

export interface SecurityViolation {
  type: 'csp' | 'xss' | 'clickjacking' | 'navigation' | 'input';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  timestamp: string;
  userAgent: string;
  url: string;
}

/**
 * Initialize security features
 */
export function initializeSecurity(): void {
  setupCSPViolationReporting();
  enforceHTTPS();
  setupNavigationGuards();
  setupInputSanitization();
  setupClickjackingProtection();
  
  if (isProduction) {
    disableDevTools();
    setupSecurityHeaders();
  }
  
  logger.info('Security features initialized');
}

/**
 * Content Security Policy violation reporting
 */
function setupCSPViolationReporting(): void {
  document.addEventListener('securitypolicyviolation', (event) => {
    const violation: SecurityViolation = {
      type: 'csp',
      severity: 'high',
      message: `CSP violation: ${event.violatedDirective}`,
      details: {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    reportSecurityViolation(violation);
  });
}

/**
 * Enforce HTTPS in production
 */
function enforceHTTPS(): void {
  if (config.enableHttpsRedirect && window.location.protocol === 'http:') {
    const httpsUrl = window.location.href.replace('http:', 'https:');
    
    logger.warn('Redirecting to HTTPS', {
      metadata: { from: window.location.href, to: httpsUrl }
    });
    
    window.location.replace(httpsUrl);
  }
}

/**
 * Setup navigation guards for suspicious activity
 */
function setupNavigationGuards(): void {
  // Monitor for suspicious redirects
  const originalReplaceState = history.replaceState;
  const originalPushState = history.pushState;
  
  history.replaceState = function(data, title, url) {
    if (url && !isValidNavigation(url)) {
      const violation: SecurityViolation = {
        type: 'navigation',
        severity: 'medium',
        message: 'Suspicious navigation attempt blocked',
        details: { url, method: 'replaceState' },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      reportSecurityViolation(violation);
      return;
    }
    
    return originalReplaceState.apply(this, arguments as any);
  };
  
  history.pushState = function(data, title, url) {
    if (url && !isValidNavigation(url)) {
      const violation: SecurityViolation = {
        type: 'navigation',
        severity: 'medium',
        message: 'Suspicious navigation attempt blocked',
        details: { url, method: 'pushState' },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      reportSecurityViolation(violation);
      return;
    }
    
    return originalPushState.apply(this, arguments as any);
  };
}

/**
 * Validate navigation URLs
 */
function isValidNavigation(url: string): boolean {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    
    // Only allow same-origin navigation
    if (parsedUrl.origin !== window.location.origin) {
      return false;
    }
    
    // Block potentially dangerous protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Block suspicious paths
    const suspiciousPaths = [
      '/admin',
      '/config',
      '/debug',
      '/.env',
      '/wp-admin',
      '/phpmyadmin',
    ];
    
    if (suspiciousPaths.some(path => parsedUrl.pathname.startsWith(path))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Input sanitization utilities
 */
function setupInputSanitization(): void {
  // Monitor for XSS attempts in form inputs
  document.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    if (target && target.value) {
      const suspiciousContent = detectXSSAttempts(target.value);
      if (suspiciousContent.length > 0) {
        const violation: SecurityViolation = {
          type: 'xss',
          severity: 'high',
          message: 'Potential XSS attempt detected in user input',
          details: {
            inputName: target.name || target.id,
            suspiciousContent,
            inputValue: target.value.substring(0, 100), // Truncate for logging
          },
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        };
        
        reportSecurityViolation(violation);
        
        // Sanitize the input
        target.value = sanitizeInput(target.value);
      }
    }
  });
}

/**
 * Detect potential XSS attempts
 */
function detectXSSAttempts(input: string): string[] {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
  ];
  
  const violations: string[] = [];
  
  for (const pattern of xssPatterns) {
    const matches = input.match(pattern);
    if (matches) {
      violations.push(...matches);
    }
  }
  
  return violations;
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe[^>]*>/gi, '')
    .replace(/<object[^>]*>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/eval\s*\(/gi, '')
    .replace(/expression\s*\(/gi, '');
}

/**
 * Setup clickjacking protection
 */
function setupClickjackingProtection(): void {
  // Check if we're in an iframe
  if (window.parent !== window) {
    const violation: SecurityViolation = {
      type: 'clickjacking',
      severity: 'high',
      message: 'Application loaded in unauthorized iframe',
      details: {
        parentOrigin: document.referrer,
        frameLocation: window.location.href,
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    reportSecurityViolation(violation);
    
    // Optionally break out of the frame
    if (isProduction) {
      window.top!.location = window.location.href;
    }
  }
}

/**
 * Disable developer tools in production
 */
function disableDevTools(): void {
  // Detect if developer tools are open
  const devtools = { open: false, orientation: null };
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > 200 || 
        window.outerWidth - window.innerWidth > 200) {
      if (!devtools.open) {
        devtools.open = true;
        
        const violation: SecurityViolation = {
          type: 'navigation',
          severity: 'low',
          message: 'Developer tools opened',
          details: {
            outerHeight: window.outerHeight,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            innerWidth: window.innerWidth,
          },
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        };
        
        reportSecurityViolation(violation);
      }
    } else {
      devtools.open = false;
    }
  }, 1000);
  
  // Disable common developer shortcuts
  document.addEventListener('keydown', (event) => {
    const forbiddenKeys = [
      'F12',
      'I', // Ctrl+Shift+I
      'J', // Ctrl+Shift+J
      'U', // Ctrl+U
    ];
    
    if (forbiddenKeys.includes(event.key) && 
        (event.ctrlKey || event.metaKey) && 
        (event.shiftKey || event.key === 'U')) {
      event.preventDefault();
      event.stopPropagation();
      
      const violation: SecurityViolation = {
        type: 'navigation',
        severity: 'low',
        message: 'Developer shortcut attempted',
        details: {
          key: event.key,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      reportSecurityViolation(violation);
      return false;
    }
  });
  
  // Disable right-click context menu
  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    return false;
  });
}

/**
 * Setup additional security headers via JavaScript
 */
function setupSecurityHeaders(): void {
  // Add additional security meta tags if not present
  const securityMetas = [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
    { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
  ];
  
  securityMetas.forEach(meta => {
    const existing = document.querySelector(`meta[name="${meta.name}"], meta[http-equiv="${meta['http-equiv']}"]`);
    if (!existing) {
      const metaElement = document.createElement('meta');
      if (meta.name) metaElement.setAttribute('name', meta.name);
      if (meta['http-equiv']) metaElement.setAttribute('http-equiv', meta['http-equiv']);
      metaElement.setAttribute('content', meta.content);
      document.head.appendChild(metaElement);
    }
  });
}

/**
 * Report security violations
 */
function reportSecurityViolation(violation: SecurityViolation): void {
  logger.error(`Security violation: ${violation.message}`, undefined, {
    metadata: violation
  });
  
  // In production, you might want to send this to a dedicated security endpoint
  if (isProduction && config.apiBaseUrl) {
    fetch(`${config.apiBaseUrl}/security/violations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(violation),
    }).catch(error => {
      logger.error('Failed to report security violation', error);
    });
  }
}

/**
 * Rate limiting for client-side requests
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindow: number;
  
  constructor(maxRequests: number = config.maxRequestsPerMinute, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }
  
  /**
   * Check if request is allowed
   */
  isAllowed(key: string = 'default'): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove requests outside the time window
    const validRequests = requests.filter(time => now - time < this.timeWindow);
    
    if (validRequests.length >= this.maxRequests) {
      const violation: SecurityViolation = {
        type: 'navigation',
        severity: 'medium',
        message: 'Rate limit exceeded',
        details: {
          key,
          requestCount: validRequests.length,
          maxRequests: this.maxRequests,
          timeWindow: this.timeWindow,
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      reportSecurityViolation(violation);
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
  
  /**
   * Get remaining requests for a key
   */
  getRemainingRequests(key: string = 'default'): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < this.timeWindow);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();