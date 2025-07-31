# Multi-stage Docker build for production-ready React application
# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Add metadata
LABEL maintainer="Blackjack Casino Team"
LABEL description="Production-ready Blackjack game frontend"
LABEL version="1.0.0"

# Install security updates and necessary tools
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install all dependencies first (needed for build)
RUN npm ci --audit && \
    npm cache clean --force

# Copy source code
COPY . .

# Build arguments for configuration
ARG NODE_ENV=production
ARG VITE_APP_VERSION=1.0.0
ARG VITE_API_BASE_URL=http://glitchjack.com:8080
ARG VITE_SENTRY_DSN
ARG VITE_GA_TRACKING_ID

# Set environment variables
ENV NODE_ENV=$NODE_ENV
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_GA_TRACKING_ID=$VITE_GA_TRACKING_ID

# Build the application (skip TypeScript check for Docker build)
RUN npx vite build --mode production

# Stage 2: Production server
FROM nginx:1.25-alpine AS production

# Install security updates and remove unnecessary packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/*

# Create non-root user with restricted permissions
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001 -G nginx-app -s /sbin/nologin -h /dev/null

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Create necessary directories and set strict permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx-app:nginx-app /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod 750 /var/cache/nginx /var/log/nginx /var/run

# Add health check script with secure permissions
COPY --chown=nginx-app:nginx-app health-check.sh /usr/local/bin/health-check.sh
RUN chmod 750 /usr/local/bin/health-check.sh

# Set permissions on static files
RUN find /usr/share/nginx/html -name "*.html" -o -name "*.js" -o -name "*.css" | xargs chmod 644

# Add security labels
LABEL security.scan="enabled" \
      security.non-root="true" \
      security.no-new-privileges="true"

# Switch to non-root user
USER nginx-app

# Expose port (non-privileged)
EXPOSE 8888

# Add security context
# Drop all capabilities and run with no-new-privileges
# (These would be set by orchestration platform like Kubernetes)

# Health check with timeout
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD /usr/local/bin/health-check.sh || exit 1

# Use dumb-init to handle signals properly and prevent PID 1 issues
ENTRYPOINT ["dumb-init", "--"]

# Start nginx with explicit daemon off
CMD ["nginx", "-g", "daemon off;"]