import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeMonitoring, setupGlobalErrorHandling } from './services/monitoring'
import { registerServiceWorker } from './utils/serviceWorker'
import { initializeSecurity } from './utils/security'
import { applyCSpNonce, validateCSP, setupCSPViolationReporting } from './utils/csp'
import { exposeHealthCheckEndpoint, startHealthMonitoring } from './services/healthCheck'

// Initialize CSP nonce first (before any scripts execute)
applyCSpNonce();

// Setup CSP violation reporting
setupCSPViolationReporting();

// Initialize security features
initializeSecurity();

// Initialize monitoring and error handling
initializeMonitoring();
setupGlobalErrorHandling();

// Validate CSP configuration
if (!validateCSP()) {
  console.warn('CSP configuration validation failed - security may be compromised');
}

// Register service worker
registerServiceWorker(() => {
  console.log('App update available. Please refresh to get the latest version.');
});

// Expose health check endpoint and start monitoring
exposeHealthCheckEndpoint();
startHealthMonitoring();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
