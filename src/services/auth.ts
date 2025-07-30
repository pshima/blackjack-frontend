/**
 * Authentication Service
 * JWT-based authentication with secure token management
 */

import { logger } from './monitoring';
import { config } from '../config/environment';
import { validateAuthToken } from '../utils/validation';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface User {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  permissions: string[];
  lastLogin?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: AuthToken | null;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private readonly tokenKey = 'blackjack_auth_token';
  private readonly refreshTokenKey = 'blackjack_refresh_token';
  private refreshTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.setupTokenRefresh();
  }

  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    try {
      logger.info('Authentication attempt started', {
        username: credentials.username,
        rememberMe: credentials.rememberMe
      });

      const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          rememberMe: credentials.rememberMe || false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: ${response.status}`);
      }

      const authData = await response.json();
      const token: AuthToken = {
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        expiresAt: Date.now() + (authData.expiresIn * 1000),
        tokenType: 'Bearer'
      };

      // Validate token format
      const tokenValidation = validateAuthToken(token.accessToken);
      if (!tokenValidation.isValid) {
        throw new Error('Invalid token format received from server');
      }

      // Store tokens securely
      this.storeTokens(token);
      this.scheduleTokenRefresh(token.expiresAt);

      logger.info('Authentication successful', {
        username: credentials.username,
        expiresAt: new Date(token.expiresAt).toISOString()
      });

      return token;
    } catch (error) {
      logger.error('Authentication failed', error as Error, {
        username: credentials.username
      });
      throw error;
    }
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    const token = this.getStoredToken();
    
    if (token) {
      try {
        // Notify server of logout
        await fetch(`${config.apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `${token.tokenType} ${token.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: token.refreshToken
          })
        });
      } catch (error) {
        logger.warn('Logout request failed', error as Error);
      }
    }

    this.clearTokens();
    this.clearRefreshTimer();
    
    logger.info('User logged out');
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<AuthToken | null> {
    const currentToken = this.getStoredToken();
    
    if (!currentToken?.refreshToken) {
      logger.warn('No refresh token available');
      return null;
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${currentToken.tokenType} ${currentToken.refreshToken}`,
        },
        body: JSON.stringify({
          refreshToken: currentToken.refreshToken
        })
      });

      if (!response.ok) {
        logger.warn('Token refresh failed', { status: response.status });
        this.clearTokens();
        return null;
      }

      const authData = await response.json();
      const newToken: AuthToken = {
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken || currentToken.refreshToken,
        expiresAt: Date.now() + (authData.expiresIn * 1000),
        tokenType: 'Bearer'
      };

      // Validate new token
      const tokenValidation = validateAuthToken(newToken.accessToken);
      if (!tokenValidation.isValid) {
        logger.error('Invalid refreshed token format');
        this.clearTokens();
        return null;
      }

      this.storeTokens(newToken);
      this.scheduleTokenRefresh(newToken.expiresAt);

      logger.info('Token refreshed successfully');
      return newToken;
    } catch (error) {
      logger.error('Token refresh error', error as Error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User | null> {
    const token = this.getValidToken();
    
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/me`, {
        headers: {
          'Authorization': `${token.tokenType} ${token.accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearTokens();
        }
        return null;
      }

      const userData = await response.json();
      return userData as User;
    } catch (error) {
      logger.error('Failed to get current user', error as Error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getValidToken();
    return token !== null;
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getAccessToken(): Promise<string | null> {
    let token = this.getValidToken();
    
    if (!token) {
      // Try to refresh if we have a refresh token
      token = await this.refreshToken();
    }
    
    return token?.accessToken || null;
  }

  /**
   * Add authentication headers to request
   */
  async addAuthHeaders(headers: Record<string, string> = {}): Promise<Record<string, string>> {
    const accessToken = await this.getAccessToken();
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Add additional security headers
    headers['X-Requested-With'] = 'XMLHttpRequest';
    headers['X-Request-ID'] = this.generateRequestId();
    
    return headers;
  }

  /**
   * Store tokens securely
   */
  private storeTokens(token: AuthToken): void {
    try {
      // Use secure storage if available, otherwise fallback to localStorage
      const storage = this.getSecureStorage();
      
      storage.setItem(this.tokenKey, JSON.stringify({
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
        tokenType: token.tokenType
      }));
      
      // Store refresh token separately with additional security
      storage.setItem(this.refreshTokenKey, this.encryptToken(token.refreshToken));
    } catch (error) {
      logger.error('Failed to store authentication tokens', error as Error);
    }
  }

  /**
   * Get stored token if valid
   */
  private getValidToken(): AuthToken | null {
    try {
      const storage = this.getSecureStorage();
      const tokenData = storage.getItem(this.tokenKey);
      const refreshTokenData = storage.getItem(this.refreshTokenKey);
      
      if (!tokenData || !refreshTokenData) {
        return null;
      }

      const parsedToken = JSON.parse(tokenData);
      const refreshToken = this.decryptToken(refreshTokenData);
      
      // Check if token is expired (with 5 minute buffer)
      if (parsedToken.expiresAt <= Date.now() + 300000) {
        return null;
      }

      return {
        accessToken: parsedToken.accessToken,
        refreshToken,
        expiresAt: parsedToken.expiresAt,
        tokenType: parsedToken.tokenType
      };
    } catch (error) {
      logger.error('Failed to retrieve stored token', error as Error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Get stored token (even if expired) for refresh attempts
   */
  private getStoredToken(): AuthToken | null {
    try {
      const storage = this.getSecureStorage();
      const tokenData = storage.getItem(this.tokenKey);
      const refreshTokenData = storage.getItem(this.refreshTokenKey);
      
      if (!tokenData || !refreshTokenData) {
        return null;
      }

      const parsedToken = JSON.parse(tokenData);
      const refreshToken = this.decryptToken(refreshTokenData);
      
      return {
        accessToken: parsedToken.accessToken,
        refreshToken,
        expiresAt: parsedToken.expiresAt,
        tokenType: parsedToken.tokenType
      };
    } catch (error) {
      logger.error('Failed to retrieve stored token', error as Error);
      return null;
    }
  }

  /**
   * Clear stored tokens
   */
  private clearTokens(): void {
    try {
      const storage = this.getSecureStorage();
      storage.removeItem(this.tokenKey);
      storage.removeItem(this.refreshTokenKey);
    } catch (error) {
      logger.error('Failed to clear tokens', error as Error);
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(): void {
    const token = this.getStoredToken();
    if (token && token.expiresAt > Date.now()) {
      this.scheduleTokenRefresh(token.expiresAt);
    }
  }

  /**
   * Schedule token refresh before expiration
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    this.clearRefreshTimer();
    
    // Refresh 5 minutes before expiration
    const refreshTime = expiresAt - Date.now() - 300000;
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch(error => {
          logger.error('Scheduled token refresh failed', error as Error);
        });
      }, refreshTime);
    }
  }

  /**
   * Clear refresh timer
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Get secure storage (prefer sessionStorage for sensitive data)
   */
  private getSecureStorage(): Storage {
    // In production, you might want to use more secure storage
    return window.sessionStorage || window.localStorage;
  }

  /**
   * Simple token encryption (in production, use proper encryption)
   */
  private encryptToken(token: string): string {
    // This is a simple obfuscation - in production use proper encryption
    return btoa(token.split('').reverse().join(''));
  }

  /**
   * Simple token decryption
   */
  private decryptToken(encryptedToken: string): string {
    try {
      return atob(encryptedToken).split('').reverse().join('');
    } catch {
      return '';
    }
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const authService = new AuthService();
export default AuthService;