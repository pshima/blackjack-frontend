// Security utilities for client-side protection and monitoring
// Provides XSS prevention, CSP monitoring, and general security hardening

import { logger } from '../services/monitoring';
import { config, isProduction } from '../config/environment';

export interface SecurityViolation {
  type: 'csp' | 'xss' | 'clickjacking' | 'navigation' | 'input';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: unknown;
  timestamp: string;
  userAgent: string;
  url: string;
}

// Sets up all client-side security features and monitoring
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

// Monitors and reports Content Security Policy violations
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

// Redirects HTTP traffic to HTTPS in production environments
function enforceHTTPS(): void {
  if (config.enableHttpsRedirect && window.location.protocol === 'http:') {
    const httpsUrl = window.location.href.replace('http:', 'https:');
    
    logger.warn('Redirecting to HTTPS', {
      metadata: { from: window.location.href, to: httpsUrl }
    });
    
    window.location.replace(httpsUrl);
  }
}

// Creates a security violation object for navigation attempts
function createNavigationViolation(url: string, method: string): SecurityViolation {
  return {
    type: 'navigation',
    severity: 'medium',
    message: 'Suspicious navigation attempt blocked',
    details: { url, method },
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
}

// Wraps a history method to validate navigation before allowing it
function wrapHistoryMethod(originalMethod: Function, methodName: string) {
  return function(...args: unknown[]) {
    const [, , url] = args;
    if (url && !isValidNavigation(url as string)) {
      const violation = createNavigationViolation(url as string, methodName);
      reportSecurityViolation(violation);
      return;
    }
    return originalMethod.apply(this, args);
  };
}

// Monitors browser navigation for suspicious URL patterns
function setupNavigationGuards(): void {
  const originalReplaceState = history.replaceState;
  const originalPushState = history.pushState;
  
  history.replaceState = wrapHistoryMethod(originalReplaceState, 'replaceState');
  history.pushState = wrapHistoryMethod(originalPushState, 'pushState');
}

// Validates navigation URLs to prevent malicious redirects
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

// Monitors form inputs for XSS attempts and sanitizes dangerous content
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

// Scans input text for common XSS attack patterns
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

// Removes dangerous XSS patterns from user input
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

// Detects and prevents clickjacking attacks via iframe embedding
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

// Prevents access to developer tools in production environments
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

// Adds security-related meta tags to the document head
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

// Logs security violations and optionally reports them to the server
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

// Client-side rate limiting to prevent request spam and abuse
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindow: number;
  
  constructor(maxRequests: number = config.maxRequestsPerMinute, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }
  
  // Checks if a request is within rate limits for the given key
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
  
  // Returns the number of remaining requests allowed for the given key
  getRemainingRequests(key: string = 'default'): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < this.timeWindow);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();