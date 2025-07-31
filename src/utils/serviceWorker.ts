/**
 * Service Worker Registration and Management
 * Handles service worker lifecycle and updates
 */

import { logger } from '../services/monitoring';
import { featureFlags } from '../config/environment';

interface ServiceWorkerUpdateAvailableCallback {
  (): void;
}

let updateAvailableCallback: ServiceWorkerUpdateAvailableCallback | null = null;
let registration: ServiceWorkerRegistration | null = null;

/**
 * Register service worker
 */
export async function registerServiceWorker(
  onUpdateAvailable?: ServiceWorkerUpdateAvailableCallback
): Promise<boolean> {
  if (!featureFlags.isServiceWorkerEnabled) {
    logger.info('Service worker disabled by feature flag');
    return false;
  }

  if (!('serviceWorker' in navigator)) {
    logger.warn('Service worker not supported in this browser');
    return false;
  }

  updateAvailableCallback = onUpdateAvailable || null;

  try {
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    logger.info('Service worker registered successfully', {
      metadata: { scope: registration.scope }
    });

    // Handle service worker updates
    registration.addEventListener('updatefound', handleUpdateFound);

    // Handle service worker controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      logger.info('Service worker controller changed');
      window.location.reload();
    });

    // Check for updates on page load
    if (registration.waiting) {
      handleUpdateAvailable();
    }

    // Check for updates periodically
    setInterval(() => {
      registration?.update();
    }, 60000); // Check every minute

    return true;
  } catch (error) {
    logger.error('Service worker registration failed', error as Error);
    return false;
  }
}

/**
 * Handle service worker update found
 */
function handleUpdateFound(): void {
  if (!registration) return;

  const newWorker = registration.installing;
  if (!newWorker) return;

  logger.info('New service worker installing');

  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // New service worker is installed and waiting
      handleUpdateAvailable();
    }
  });
}

/**
 * Handle service worker update available
 */
function handleUpdateAvailable(): void {
  logger.info('Service worker update available');
  
  if (updateAvailableCallback) {
    updateAvailableCallback();
  } else {
    // Default behavior: show a notification
    showUpdateNotification();
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification(): void {
  if (confirm('A new version of the app is available. Refresh to update?')) {
    applyUpdate();
  }
}

/**
 * Apply service worker update
 */
export function applyUpdate(): void {
  if (!registration || !registration.waiting) {
    logger.warn('No service worker update available');
    return;
  }

  logger.info('Applying service worker update');
  
  // Tell the waiting service worker to become active
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
    }
    
    logger.info('Service worker unregistered');
    return true;
  } catch (error) {
    logger.error('Failed to unregister service worker', error as Error);
    return false;
  }
}

/**
 * Clear service worker caches
 */
export async function clearServiceWorkerCaches(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !registration) {
    return false;
  }

  try {
    // Send message to service worker to clear caches
    registration.active?.postMessage({ type: 'CACHE_CLEAR' });
    
    // Also clear caches from the main thread
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    logger.info('Service worker caches cleared');
    return true;
  } catch (error) {
    logger.error('Failed to clear service worker caches', error as Error);
    return false;
  }
}

/**
 * Check if app is running in standalone mode (PWA)
 */
export function isStandalonePWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as { standalone?: boolean }).standalone === true;
}

/**
 * Check if service worker is supported and active
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Get service worker registration status
 */
export function getServiceWorkerStatus(): {
  supported: boolean;
  registered: boolean;
  active: boolean;
  updateAvailable: boolean;
} {
  return {
    supported: isServiceWorkerSupported(),
    registered: !!registration,
    active: !!navigator.serviceWorker?.controller,
    updateAvailable: !!(registration?.waiting),
  };
}

/**
 * Force service worker update check
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!registration) {
    return false;
  }

  try {
    await registration.update();
    logger.info('Checked for service worker updates');
    return true;
  } catch (error) {
    logger.error('Failed to check for service worker updates', error as Error);
    return false;
  }
}