#!/bin/bash
set -e

# Wait for services to be ready
# Used by CI/CD and development workflows

echo "⏳ Waiting for services to be ready..."

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
MAX_WAIT_TIME=120  # Maximum wait time in seconds
CHECK_INTERVAL=2   # Check every 2 seconds

# Service endpoints to check
SERVICES=(
    "Database:http://localhost:7414/health:PostgreSQL"
    "PostgREST:http://localhost:7413/:Database API"
    "Main App:http://localhost:7410/api/health:Frontend Health"
    "Backend:http://localhost:7410/api/v1/health:Backend API"
)

wait_for_service() {
    local service_name="$1"
    local url="$2"
    local description="$3"
    local elapsed=0
    
    log_info "Waiting for $service_name ($description)..."
    
    while [ $elapsed -lt $MAX_WAIT_TIME ]; do
        if curl -f -s -m 5 "$url" > /dev/null 2>&1; then
            log_success "$service_name is ready"
            return 0
        fi
        
        sleep $CHECK_INTERVAL
        elapsed=$((elapsed + CHECK_INTERVAL))
    done
    
    log_error "$service_name failed to start within ${MAX_WAIT_TIME}s"
    return 1
}

# Wait for all services
failed_services=()

for service in "${SERVICES[@]}"; do
    IFS=':' read -r name url description <<< "$service"
    if ! wait_for_service "$name" "$url" "$description"; then
        failed_services+=("$name")
    fi
done

# Report results
if [ ${#failed_services[@]} -eq 0 ]; then
    log_success "All services are ready!"
    echo ""
    echo "🌐 Service URLs:"
    echo "   Main Application: http://localhost:7410"
    echo "   Database API: http://localhost:7413"
    echo "   Backend API: http://localhost:7410/api/v1"
    echo "   Health Check: http://localhost:7410/api/health"
    exit 0
else
    log_error "Failed services: ${failed_services[*]}"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Check if services are running: docker compose ps"
    echo "   2. Check logs: docker compose logs"
    echo "   3. Restart services: docker compose down && docker compose up"
    exit 1
fi