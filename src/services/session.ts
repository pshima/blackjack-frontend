/**
 * Secure Session Management
 * Handles user sessions with security best practices
 */

import { logger } from './monitoring';
import { authService } from './auth';
import { isProduction } from '../config/environment';
import { sanitizeXSS } from '../utils/validation';

export interface SessionData {
  sessionId: string;
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
}

export interface SessionConfig {
  maxIdleTime: number; // milliseconds
  maxSessionTime: number; // milliseconds
  requireReauth: boolean;
  trackActivity: boolean;
  enforceIPBinding: boolean;
  enforceUserAgentBinding: boolean;
}

class SessionManager {
  private readonly sessionKey = 'blackjack_session';
  private readonly configKey = 'blackjack_session_config';
  private activityTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private currentSession: SessionData | null = null;
  
  private readonly defaultConfig: SessionConfig = {
    maxIdleTime: 30 * 60 * 1000, // 30 minutes
    maxSessionTime: 8 * 60 * 60 * 1000, // 8 hours
    requireReauth: true,
    trackActivity: true,
    enforceIPBinding: isProduction,
    enforceUserAgentBinding: isProduction
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize session manager
   */
  private initialize(): void {
    // Load existing session if valid
    this.loadSession();
    
    // Setup activity tracking
    if (this.currentSession && this.getConfig().trackActivity) {
      this.setupActivityTracking();
    }
    
    // Setup periodic session validation
    this.setupSessionValidation();
    
    logger.info('Session manager initialized');
  }

  /**
   * Create new session
   */
  async createSession(userId: string, username: string, roles: string[] = [], permissions: string[] = []): Promise<SessionData> {
    const sessionId = this.generateSecureSessionId();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.getConfig().maxSessionTime).toISOString();
    
    const sessionData: SessionData = {
      sessionId,
      userId: sanitizeXSS(userId),
      username: sanitizeXSS(username),
      roles: roles.map(role => sanitizeXSS(role)),
      permissions: permissions.map(perm => sanitizeXSS(perm)),
      createdAt: now,
      lastActivity: now,
      expiresAt,
      ipAddress: await this.getCurrentIP(),
      userAgent: this.sanitizeUserAgent(navigator.userAgent)
    };

    this.currentSession = sessionData;
    this.storeSession(sessionData);
    this.setupActivityTracking();

    logger.info('New session created', {
      sessionId,
      userId,
      username,
      expiresAt
    });

    return sessionData;
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionData | null {
    if (!this.currentSession) {
      this.loadSession();
    }
    
    return this.currentSession;
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    const session = this.getCurrentSession();
    
    if (!session) {
      return false;
    }

    try {
      // Check expiration
      if (new Date(session.expiresAt) <= new Date()) {
        logger.warn('Session expired', { sessionId: session.sessionId });
        this.destroySession();
        return false;
      }

      // Check idle timeout
      const idleTime = Date.now() - new Date(session.lastActivity).getTime();
      if (idleTime > this.getConfig().maxIdleTime) {
        logger.warn('Session idle timeout', { 
          sessionId: session.sessionId,
          idleTime 
        });
        this.destroySession();
        return false;
      }

      // Check IP binding (if enabled)
      if (this.getConfig().enforceIPBinding) {
        const currentIP = await this.getCurrentIP();
        if (currentIP !== session.ipAddress) {
          logger.warn('Session IP mismatch detected', {
            sessionId: session.sessionId,
            expectedIP: session.ipAddress,
            currentIP
          });
          this.destroySession();
          return false;
        }
      }

      // Check User Agent binding (if enabled)
      if (this.getConfig().enforceUserAgentBinding) {
        const currentUA = this.sanitizeUserAgent(navigator.userAgent);
        if (currentUA !== session.userAgent) {
          logger.warn('Session User Agent mismatch detected', {
            sessionId: session.sessionId
          });
          this.destroySession();
          return false;
        }
      }

      // Session is valid - update activity
      this.updateActivity();
      return true;

    } catch (error) {
      logger.error('Session validation error', error as Error, {
        sessionId: session.sessionId
      });
      this.destroySession();
      return false;
    }
  }

  /**
   * Update session activity
   */
  updateActivity(): void {
    const session = this.getCurrentSession();
    if (!session) return;

    session.lastActivity = new Date().toISOString();
    this.storeSession(session);
    
    // Reset activity timer
    this.setupActivityTracking();
  }

  /**
   * Extend session expiration
   */
  extendSession(additionalTime?: number): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    const extension = additionalTime || this.getConfig().maxSessionTime;
    const newExpiresAt = new Date(Date.now() + extension).toISOString();
    
    session.expiresAt = newExpiresAt;
    session.lastActivity = new Date().toISOString();
    
    this.storeSession(session);
    
    logger.info('Session extended', {
      sessionId: session.sessionId,
      newExpiresAt
    });

    return true;
  }

  /**
   * Destroy current session
   */
  destroySession(): void {
    const session = this.getCurrentSession();
    
    if (session) {
      logger.info('Session destroyed', {
        sessionId: session.sessionId,
        userId: session.userId
      });
    }

    // Clear timers
    this.clearTimers();
    
    // Clear session data
    this.currentSession = null;
    this.clearStoredSession();
    
    // Clear authentication
    authService.logout().catch(error => {
      logger.error('Error during logout', error);
    });
  }

  /**
   * Check session permissions
   */
  hasPermission(permission: string): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    return session.permissions.includes(permission) || 
           session.roles.some(role => this.getRolePermissions(role).includes(permission));
  }

  /**
   * Check session roles
   */
  hasRole(role: string): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    return session.roles.includes(role);
  }

  /**
   * Setup session warning for upcoming expiration
   */
  private setupSessionWarning(): void {
    const session = this.getCurrentSession();
    if (!session) return;

    this.clearWarningTimer();

    const expiresAt = new Date(session.expiresAt).getTime();
    const warningTime = expiresAt - Date.now() - (5 * 60 * 1000); // 5 minutes before expiration

    if (warningTime > 0) {
      this.warningTimer = setTimeout(() => {
        this.showSessionWarning();
      }, warningTime);
    }
  }

  /**
   * Show session expiration warning
   */
  private showSessionWarning(): void {
    const session = this.getCurrentSession();
    if (!session) return;

    logger.warn('Session expiring soon', {
      sessionId: session.sessionId,
      expiresAt: session.expiresAt
    });

    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('sessionWarning', {
      detail: {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        remainingTime: new Date(session.expiresAt).getTime() - Date.now()
      }
    }));
  }

  /**
   * Setup activity tracking
   */
  private setupActivityTracking(): void {
    if (!this.getConfig().trackActivity) return;

    this.clearActivityTimer();

    // Track user activity events
    const activityEvents = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'];
    
    const activityHandler = () => {
      this.updateActivity();
    };

    // Add throttled activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, this.throttle(activityHandler, 30000), { passive: true });
    });

    // Setup idle timeout
    const idleTimeout = this.getConfig().maxIdleTime - (5 * 60 * 1000); // 5 minutes before idle timeout
    
    this.activityTimer = setTimeout(() => {
      this.showIdleWarning();
    }, idleTimeout);
    
    // Setup session warning
    this.setupSessionWarning();
  }

  /**
   * Show idle warning
   */
  private showIdleWarning(): void {
    const session = this.getCurrentSession();
    if (!session) return;

    logger.warn('Session idle warning', {
      sessionId: session.sessionId
    });

    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('sessionIdleWarning', {
      detail: {
        sessionId: session.sessionId,
        lastActivity: session.lastActivity
      }
    }));
  }

  /**
   * Setup periodic session validation
   */
  private setupSessionValidation(): void {
    setInterval(() => {
      this.validateSession();
    }, 60000); // Check every minute
  }

  /**
   * Load session from storage
   */
  private loadSession(): void {
    try {
      const sessionData = sessionStorage.getItem(this.sessionKey);
      if (sessionData) {
        this.currentSession = JSON.parse(sessionData);
      }
    } catch (error) {
      logger.error('Failed to load session', error as Error);
      this.clearStoredSession();
    }
  }

  /**
   * Store session to storage
   */
  private storeSession(session: SessionData): void {
    try {
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    } catch (error) {
      logger.error('Failed to store session', error as Error);
    }
  }

  /**
   * Clear stored session
   */
  private clearStoredSession(): void {
    try {
      sessionStorage.removeItem(this.sessionKey);
    } catch (error) {
      logger.error('Failed to clear session', error as Error);
    }
  }

  /**
   * Get session configuration
   */
  private getConfig(): SessionConfig {
    try {
      const configData = localStorage.getItem(this.configKey);
      if (configData) {
        return { ...this.defaultConfig, ...JSON.parse(configData) };
      }
    } catch (error) {
      logger.error('Failed to load session config', error as Error);
    }
    return this.defaultConfig;
  }

  /**
   * Generate secure session ID
   */
  private generateSecureSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get current IP address (placeholder - would need backend support)
   */
  private async getCurrentIP(): Promise<string> {
    try {
      // In production, this would call a backend endpoint
      // For now, return a placeholder
      return 'unknown';
    } catch (error) {
      logger.error('Failed to get current IP', error as Error);
      return 'unknown';
    }
  }

  /**
   * Sanitize user agent string
   */
  private sanitizeUserAgent(userAgent: string): string {
    return sanitizeXSS(userAgent).substring(0, 500); // Limit length
  }

  /**
   * Get role permissions
   */
  private getRolePermissions(role: string): string[] {
    // This would typically come from configuration or backend
    const rolePermissions: Record<string, string[]> = {
      'admin': ['*'],
      'player': ['game:play', 'stats:view'],
      'guest': ['game:demo']
    };
    
    return rolePermissions[role] || [];
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.clearActivityTimer();
    this.clearWarningTimer();
  }

  /**
   * Clear activity timer
   */
  private clearActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  /**
   * Clear warning timer
   */
  private clearWarningTimer(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Throttle function calls
   */
  private throttle<T extends (...args: unknown[]) => unknown>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;
    
    return ((...args: unknown[]) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    }) as T;
  }
}

export const sessionManager = new SessionManager();
export default SessionManager;