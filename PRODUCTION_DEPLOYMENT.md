# Production Deployment Checklist & Runbook

## Overview
This document provides a comprehensive checklist and runbook for deploying the Blackjack Casino frontend application to production. Follow this guide to ensure a secure, reliable, and performant deployment.

## Pre-Deployment Checklist

### 🔐 Security
- [ ] **Environment Variables**: All sensitive data configured via environment variables
- [ ] **HTTPS**: SSL certificate valid and HTTPS redirect enabled
- [ ] **CSP**: Content Security Policy configured and tested
- [ ] **CORS**: Cross-Origin Resource Sharing properly configured
- [ ] **Rate Limiting**: Client-side and server-side rate limiting in place
- [ ] **Security Headers**: All security headers properly configured
- [ ] **Dependency Audit**: `npm audit` shows no critical vulnerabilities
- [ ] **Container Scan**: Docker image scanned for vulnerabilities

### 🏗️ Build & Configuration
- [ ] **Build Success**: Production build completes without errors
- [ ] **Bundle Size**: Bundle analysis shows acceptable sizes (<1MB total)
- [ ] **Environment Config**: Production environment variables validated
- [ ] **Feature Flags**: Production feature flags properly set
- [ ] **Service Worker**: PWA functionality working correctly
- [ ] **Health Checks**: Health and readiness endpoints functional

### 🧪 Testing
- [ ] **Unit Tests**: All tests passing (>80% coverage)
- [ ] **Integration Tests**: Critical user flows tested
- [ ] **Performance Tests**: Lighthouse scores meet requirements
- [ ] **Accessibility**: WCAG compliance verified
- [ ] **Cross-Browser**: Tested in major browsers
- [ ] **Mobile Responsive**: Mobile experience validated

### 📊 Monitoring
- [ ] **Error Tracking**: Sentry configured with production DSN
- [ ] **Analytics**: Google Analytics or equivalent configured
- [ ] **Performance Monitoring**: Core Web Vitals tracking enabled
- [ ] **Alerting**: Critical alerts configured
- [ ] **Logging**: Structured logging configured

## Environment Variables Required for Production

```bash
# Required Environment Variables
NODE_ENV=production
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=Blackjack Casino
VITE_API_BASE_URL=https://api.blackjack-casino.com/api
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_GA_TRACKING_ID=GA-XXXXXXXXX-X

# Security
VITE_ENABLE_CSP=true
VITE_ENABLE_HTTPS_REDIRECT=true

# Performance
VITE_ENABLE_SERVICE_WORKER=true
VITE_CACHE_STRATEGY=networkFirst

# Feature Flags
VITE_ENABLE_DEMO_MODE=false
VITE_ENABLE_DEVELOPER_TOOLS=false
VITE_ENABLE_ANALYTICS=true

# Rate Limiting
VITE_MAX_REQUESTS_PER_MINUTE=60
VITE_ENABLE_REQUEST_THROTTLING=true

# Logging
VITE_ENABLE_CONSOLE_LOGS=false
VITE_LOG_LEVEL=warn
```

## Deployment Steps

### 1. Pre-Deployment Verification
```bash
# Run full test suite
npm run test:coverage

# Security audit
npm audit --audit-level high

# Build and analyze
npm run build:analyze

# Verify environment configuration
npm run build -- --mode production
```

### 2. Docker Build & Push
```bash
# Build production image
docker build -t blackjack-frontend:latest \
  --build-arg NODE_ENV=production \
  --build-arg VITE_APP_VERSION=$(git describe --tags) \
  --build-arg VITE_API_BASE_URL=$PRODUCTION_API_URL \
  --build-arg VITE_SENTRY_DSN=$SENTRY_DSN \
  .

# Tag for registry
docker tag blackjack-frontend:latest your-registry/blackjack-frontend:$(git rev-parse --short HEAD)

# Push to registry
docker push your-registry/blackjack-frontend:$(git rev-parse --short HEAD)
```

### 3. Production Deployment
```bash
# Deploy using your orchestration tool (Kubernetes, Docker Compose, etc.)
kubectl apply -f k8s/production/

# Or using Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
kubectl get pods -l app=blackjack-frontend
```

### 4. Post-Deployment Verification
```bash
# Health checks
curl -f https://blackjack-casino.com/health
curl -f https://blackjack-casino.com/ready

# Performance check
curl -o /dev/null -s -w "%{time_total}\\n" https://blackjack-casino.com/

# Security headers check
curl -I https://blackjack-casino.com/

# SSL certificate check
openssl s_client -connect blackjack-casino.com:443 -servername blackjack-casino.com
```

## Monitoring & Alerts

### Health Check Endpoints
- `GET /health` - Basic application health
- `GET /ready` - Application readiness for traffic
- JavaScript: `window.__healthCheck()` - Detailed client-side health

### Key Metrics to Monitor
- **Performance**: Page load time, Core Web Vitals, API response time
- **Availability**: Uptime, error rates, health check status
- **Security**: CSP violations, failed requests, suspicious activity
- **Business**: User engagement, game completion rates, error patterns

### Alert Thresholds
- **Critical**: 5xx error rate > 1%, health check failures
- **Warning**: Response time > 3s, 4xx error rate > 5%
- **Info**: New deployments, configuration changes

## Rollback Procedures

### Quick Rollback
```bash
# Rollback to previous Docker image
kubectl set image deployment/blackjack-frontend \
  app=your-registry/blackjack-frontend:previous-hash

# Or using Docker Compose
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --image-tag previous-hash
```

### Database/State Considerations
- Frontend is stateless - rollback only affects client code
- Ensure API compatibility between frontend versions
- Clear browser caches if needed via service worker update

## Troubleshooting Guide

### Common Issues

#### Build Failures
```bash
# Check for dependency issues
npm ci
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Check environment variables
env | grep VITE_
```

#### Performance Issues
```bash
# Analyze bundle size
npm run build:analyze

# Check for memory leaks
docker stats container-name

# Review performance metrics
curl https://blackjack-casino.com/__healthCheck
```

#### Security Issues
```bash
# Check CSP violations in browser console
# Review security headers
curl -I https://blackjack-casino.com/

# Verify SSL configuration
nmap --script ssl-enum-ciphers -p 443 blackjack-casino.com
```

### Log Analysis
```bash
# View application logs
kubectl logs -f deployment/blackjack-frontend

# Filter error logs
kubectl logs deployment/blackjack-frontend | grep ERROR

# Check Nginx access logs
docker exec container-name tail -f /var/log/nginx/access.log
```

## Performance Optimization

### Bundle Size Optimization
- Code splitting is configured for vendor and feature chunks
- Service worker provides caching for static assets
- Gzip/Brotli compression enabled in Nginx

### Caching Strategy
- **Static Assets**: 1 year cache with versioned URLs
- **HTML**: No cache to ensure updates
- **API Responses**: Selective caching via service worker
- **Service Worker**: No cache to enable immediate updates

### CDN Configuration
Configure your CDN with these settings:
- **Cache HTML**: 0 seconds
- **Cache JS/CSS/Images**: 1 year
- **Gzip**: Enabled for text assets
- **HTTP/2 Push**: Push critical CSS/JS

## Security Configuration

### Nginx Security Headers
```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### Content Security Policy
The CSP is configured to allow:
- Self-hosted assets
- Sentry error reporting
- Google Fonts (if used)
- WebSocket connections to API
- Upgrade insecure requests

### Rate Limiting
- API endpoints: 10 requests/second
- Static assets: 30 requests/second
- Client-side: 60 requests/minute (configurable)

## Backup & Recovery

### Static Assets
- Docker images are immutable and tagged
- Source code is version controlled in Git
- Build artifacts stored in CI/CD pipeline

### Configuration
- Environment variables documented and stored securely
- Infrastructure as Code (Terraform/CloudFormation)
- Database backups (if applicable) automated

## Compliance & Auditing

### Regular Audits
- **Security**: Monthly vulnerability scans
- **Performance**: Weekly Lighthouse audits
- **Dependencies**: Automated daily scans
- **Accessibility**: Quarterly WCAG audits

### Compliance Logs
- All deployments logged with timestamps and responsible parties
- Configuration changes tracked in version control
- Security incidents documented and remediated

## Emergency Contacts

### On-Call Rotation
- **Primary**: DevOps Team - alerts@company.com
- **Secondary**: Frontend Team - frontend@company.com
- **Escalation**: Engineering Manager - manager@company.com

### Service Dependencies
- **CDN**: Cloudflare/AWS CloudFront
- **Monitoring**: Sentry, DataDog/New Relic
- **Registry**: Docker Hub/AWS ECR/GitHub Packages
- **Infrastructure**: AWS/GCP/Azure

---

## Deployment History Template

| Date | Version | Deployed By | Changes | Rollback Time |
|------|---------|-------------|---------|---------------|
| 2024-XX-XX | v1.0.0 | John Doe | Initial production release | N/A |

## Post-Deployment Checklist

After successful deployment, verify:
- [ ] All health checks pass
- [ ] Error rates within normal range
- [ ] Performance metrics acceptable
- [ ] Security headers present
- [ ] Monitoring and alerts functional
- [ ] User-facing features working
- [ ] SSL certificate valid
- [ ] CDN cache invalidated if needed

**Remember**: Always test deployment procedures in staging environment first!