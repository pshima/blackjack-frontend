#!/bin/sh

# Health check script for Docker container
# Checks if the application is healthy and ready to serve traffic

set -e

# Configuration
HOST="localhost"
PORT="8080"
TIMEOUT=10
MAX_RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Health check function
check_health() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    log "Checking $description..."
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout $TIMEOUT \
        --max-time $TIMEOUT \
        "$url" || echo "000")
    
    if [ "$response_code" = "$expected_status" ]; then
        log "${GREEN}✓${NC} $description is healthy (HTTP $response_code)"
        return 0
    else
        log "${RED}✗${NC} $description failed (HTTP $response_code)"
        return 1
    fi
}

# Main health check logic
main() {
    local exit_code=0
    local checks_passed=0
    local total_checks=4
    
    log "Starting health check for Blackjack Casino frontend..."
    
    # Check 1: Basic HTTP response
    if check_health "http://$HOST:$PORT/health" "Basic health endpoint"; then
        checks_passed=$((checks_passed + 1))
    else
        exit_code=1
    fi
    
    # Check 2: Ready endpoint
    if check_health "http://$HOST:$PORT/ready" "Ready endpoint"; then
        checks_passed=$((checks_passed + 1))
    else
        exit_code=1
    fi
    
    # Check 3: Main application
    if check_health "http://$HOST:$PORT/" "Main application"; then
        checks_passed=$((checks_passed + 1))
    else
        exit_code=1
    fi
    
    # Check 4: Static assets (check if index.html contains expected content)
    log "Checking static assets..."
    local content_check
    content_check=$(curl -s --connect-timeout $TIMEOUT --max-time $TIMEOUT \
        "http://$HOST:$PORT/" | grep -q "Blackjack" && echo "pass" || echo "fail")
    
    if [ "$content_check" = "pass" ]; then
        log "${GREEN}✓${NC} Static assets are serving correctly"
        checks_passed=$((checks_passed + 1))
    else
        log "${RED}✗${NC} Static assets check failed"
        exit_code=1
    fi
    
    # Summary
    log "Health check completed: $checks_passed/$total_checks checks passed"
    
    if [ $exit_code -eq 0 ]; then
        log "${GREEN}✓${NC} All health checks passed - container is healthy"
    else
        log "${RED}✗${NC} Some health checks failed - container is unhealthy"
    fi
    
    return $exit_code
}

# Enhanced checks for production
production_checks() {
    log "Running additional production checks..."
    
    # Check memory usage
    local memory_usage
    memory_usage=$(free | grep Mem | awk '{print int($3/$2 * 100.0)}')
    
    if [ "$memory_usage" -gt 90 ]; then
        log "${YELLOW}⚠${NC} High memory usage: ${memory_usage}%"
    else
        log "${GREEN}✓${NC} Memory usage is normal: ${memory_usage}%"
    fi
    
    # Check disk usage
    local disk_usage
    disk_usage=$(df / | tail -1 | awk '{print int($5)}' | sed 's/%//')
    
    if [ "$disk_usage" -gt 85 ]; then
        log "${YELLOW}⚠${NC} High disk usage: ${disk_usage}%"
    else
        log "${GREEN}✓${NC} Disk usage is normal: ${disk_usage}%"
    fi
    
    # Check if nginx processes are running
    local nginx_processes
    nginx_processes=$(pgrep nginx | wc -l)
    
    if [ "$nginx_processes" -gt 0 ]; then
        log "${GREEN}✓${NC} Nginx processes are running ($nginx_processes processes)"
    else
        log "${RED}✗${NC} No nginx processes found"
        return 1
    fi
    
    return 0
}

# Retry logic
retry_check() {
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if main; then
            # Run production checks if basic checks pass
            if [ "${NODE_ENV:-production}" = "production" ]; then
                production_checks
            fi
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            log "${YELLOW}⚠${NC} Health check failed, retrying in 2 seconds... (attempt $retries/$MAX_RETRIES)"
            sleep 2
        fi
    done
    
    log "${RED}✗${NC} Health check failed after $MAX_RETRIES attempts"
    return 1
}

# Run the health check with retries
retry_check