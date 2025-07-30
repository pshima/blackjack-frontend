/**
 * Content Security Policy Utilities
 * Handles CSP nonce generation and management for secure script/style loading
 */

import { logger } from '../services/monitoring';

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Apply CSP nonce to all inline scripts and styles
 */
export function applyCSpNonce(): void {
  const nonce = generateCSPNonce();
  
  try {
    // Update meta CSP directive if present
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      const content = cspMeta.getAttribute('content');
      if (content) {
        const updatedContent = content.replace(/PLACEHOLDER_NONCE/g, nonce);
        cspMeta.setAttribute('content', updatedContent);
      }
    }
    
    // Apply nonce to all script tags that don't have src attribute (inline scripts)
    const inlineScripts = document.querySelectorAll('script:not([src])');
    inlineScripts.forEach(script => {
      script.setAttribute('nonce', nonce);
    });
    
    // Apply nonce to all style tags (inline styles)
    const inlineStyles = document.querySelectorAll('style');
    inlineStyles.forEach(style => {
      style.setAttribute('nonce', nonce);
    });
    
    logger.debug('CSP nonce applied successfully', { nonce: nonce.substring(0, 8) + '...' });
  } catch (error) {
    logger.error('Failed to apply CSP nonce', error as Error);
  }
}

/**
 * Validate that CSP is properly configured
 */
export function validateCSP(): boolean {
  try {
    // Check for CSP meta tag or header
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const hasCspMeta = !!cspMeta;
    
    // Check if unsafe directives are present (should not be in production)
    let hasUnsafeDirectives = false;
    if (cspMeta) {
      const content = cspMeta.getAttribute('content') || '';
      hasUnsafeDirectives = content.includes('unsafe-inline') || content.includes('unsafe-eval');
    }
    
    const isValid = hasCspMeta && !hasUnsafeDirectives;
    
    if (!isValid) {
      logger.warn('CSP validation failed', {
        hasCspMeta,
        hasUnsafeDirectives
      });
    }
    
    return isValid;
  } catch (error) {
    logger.error('CSP validation error', error as Error);
    return false;
  }
}

/**
 * Report CSP violations to monitoring system
 */
export function setupCSPViolationReporting(): void {
  document.addEventListener('securitypolicyviolation', (event) => {
    const violation = {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      timestamp: new Date().toISOString()
    };
    
    logger.error('CSP Violation detected', undefined, {
      metadata: violation
    });
    
    // In production, you might want to send this to a security monitoring endpoint
    if (import.meta.env.PROD) {
      // Send to security monitoring service
      fetch('/api/security/csp-violations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(violation),
      }).catch(error => {
        logger.error('Failed to report CSP violation', error);
      });
    }
  });
}