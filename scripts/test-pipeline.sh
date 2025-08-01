#!/bin/bash
set -e

# Minecraft Marketplace - Complete Test Pipeline
# Foundation-first validation: all gates must pass

echo "🧪 Minecraft Marketplace - Complete Test Pipeline"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
PASSED_TESTS=0
FAILED_TESTS=0
TEST_RESULTS=()

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TEST_RESULTS+=("✅ $1")
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TEST_RESULTS+=("❌ $1")
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    log_info "Running: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        log_success "$test_name"
        return 0
    else
        log_error "$test_name"
        return 1
    fi
}

# Phase 1: Foundation Validation
echo ""
echo "🏗️  Phase 1: Foundation Validation"
echo "================================="

log_info "Checking project structure..."
if [[ -f "package.json" && -d "frontend" && -d "backend" && -d "shared" && -d "infrastructure" ]]; then
    log_success "Project structure is valid"
else
    log_error "Project structure is invalid"
fi

log_info "Checking configuration files..."
if [[ -f "tsconfig.json" && -f ".eslintrc.json" && -f ".prettierrc" && -f "vitest.config.ts" ]]; then
    log_success "Configuration files present"
else
    log_error "Configuration files missing"
fi

log_info "Checking Docker files..."
if [[ -f "infrastructure/docker/compose.yml" && -f "infrastructure/docker/Dockerfile.frontend" && -f "infrastructure/docker/Dockerfile.backend" ]]; then
    log_success "Docker configuration present"
else
    log_error "Docker configuration missing"
fi

# Phase 2: Code Quality Validation
echo ""
echo "🔍 Phase 2: Code Quality Validation"
echo "=================================="

log_info "Installing dependencies..."
if npm ci > /dev/null 2>&1; then
    log_success "Dependencies installed"
else
    log_error "Dependency installation failed"
    exit 1
fi

run_test "TypeScript compilation check" "npm run type-check"
run_test "ESLint code quality check" "npm run lint"
run_test "Prettier formatting check" "npx prettier --check ."

# Phase 3: Unit & Integration Tests
echo ""
echo "🧪 Phase 3: Unit & Integration Tests"
echo "===================================="

run_test "DI Container unit tests" "npm run test:di-container"
run_test "Astro Container tests" "npx vitest run tests/unit/astro-container.test.ts"

# Phase 4: Docker Build Validation
echo ""
echo "🐳 Phase 4: Docker Build Validation"
echo "===================================="

log_info "Building Docker images..."
if docker compose -f infrastructure/docker/compose.dev.yml build --quiet > /dev/null 2>&1; then
    log_success "Docker images built successfully"
else
    log_error "Docker image build failed"
fi

# Phase 5: Fresh Install Test
echo ""
echo "🚀 Phase 5: Fresh Install Test"
echo "=============================="

log_info "Starting fresh install test..."
if docker compose -f infrastructure/docker/compose.dev.yml up -d --wait --wait-timeout 120; then
    log_success "All services started successfully"
    
    # Wait for services to be ready
    sleep 10
    
    # Test nginx proxy
    if curl -f http://localhost/nginx-health > /dev/null 2>&1; then
        log_success "Nginx reverse proxy is healthy"
    else
        log_error "Nginx reverse proxy failed"
    fi
    
    # Test frontend
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
    fi
    
    # Test backend via nginx
    if curl -f http://localhost/api/v1/health > /dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
    fi
    
    # Test database API via nginx
    if curl -f http://localhost/api/data/ > /dev/null 2>&1; then
        log_success "Database API accessible"
    else
        log_error "Database API failed"
    fi
    
    # Test API documentation
    if curl -f http://localhost/docs/ > /dev/null 2>&1; then
        log_success "API documentation accessible"
    else
        log_error "API documentation failed"
    fi
    
else
    log_error "Fresh install failed - services did not start"
fi

# Phase 6: Performance & Security Tests
echo ""
echo "⚡ Phase 6: Performance & Security Tests"
echo "======================================="

# Basic performance test
if command -v ab > /dev/null 2>&1; then
    log_info "Running basic performance test..."
    if ab -n 10 -c 2 http://localhost/ > /dev/null 2>&1; then
        log_success "Basic performance test passed"
    else
        log_error "Basic performance test failed"
    fi
else
    log_warning "Apache Bench (ab) not available, skipping performance test"
fi

# Security headers test
log_info "Checking security headers..."
RESPONSE=$(curl -I http://localhost/ 2>/dev/null || echo "")
if echo "$RESPONSE" | grep -q "X-Content-Type-Options"; then
    log_success "Security headers present"
else
    log_error "Security headers missing"
fi

# Cleanup
echo ""
echo "🧹 Cleanup"
echo "=========="

log_info "Stopping test environment..."
docker compose -f infrastructure/docker/compose.dev.yml down > /dev/null 2>&1 || true

# Final Results
echo ""
echo "📊 Test Results Summary"
echo "======================"

for result in "${TEST_RESULTS[@]}"; do
    echo "$result"
done

echo ""
echo "Total Tests: $((PASSED_TESTS + FAILED_TESTS))"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Ready for deployment.${NC}"
    echo ""
    echo "Access Points:"
    echo "- Main Application: http://localhost"
    echo "- API Documentation: http://localhost/docs"
    echo "- Database API: http://localhost/api/data"
    echo "- Backend API: http://localhost/api/v1"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please fix issues before deployment.${NC}"
    exit 1
fi