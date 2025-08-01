#!/bin/bash
set -e

# Minecraft Marketplace - Fresh Install Script
# Validates the "Fresh Install Works" guarantee

echo "🚀 Minecraft Marketplace - Fresh Install"
echo "========================================"

# Colors
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

# Check prerequisites
echo ""
echo "🔍 Checking Prerequisites"
echo "========================="

if command -v docker > /dev/null 2>&1; then
    log_success "Docker is installed ($(docker --version | cut -d' ' -f3 | cut -d',' -f1))"
else
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if command -v docker compose > /dev/null 2>&1; then
    log_success "Docker Compose is available"
else
    log_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    if [[ ${NODE_VERSION:1:2} -ge 22 ]]; then
        log_success "Node.js is installed ($NODE_VERSION)"
    else
        log_warning "Node.js version should be 22+. Current: $NODE_VERSION"
    fi
else
    log_warning "Node.js not installed (optional for Docker-only deployment)"
fi

# Environment setup
echo ""
echo "⚙️  Environment Setup"
echo "===================="

if [[ ! -f .env ]]; then
    log_info "Creating .env file from template..."
    cp .env.example .env
    log_success ".env file created"
else
    log_info ".env file already exists"
fi

# Create upload directory
log_info "Creating upload directory..."
mkdir -p uploads/evidence
log_success "Upload directory created"

# Fresh install using Docker only
echo ""
echo "🐳 Fresh Install (Docker Only)"
echo "=============================="

log_info "Building and starting all services..."
echo "This may take a few minutes on first run..."

if docker compose -f infrastructure/docker/compose.dev.yml up --build -d --wait --wait-timeout 180; then
    log_success "All services started successfully!"
else
    log_error "Failed to start services. Check Docker logs:"
    echo "  docker compose -f infrastructure/docker/compose.dev.yml logs"
    exit 1
fi

# Wait for services to be fully ready
log_info "Waiting for services to be ready..."
sleep 15

# Validate all services
echo ""
echo "🧪 Service Validation"
echo "===================="

# Test main application
if curl -f -s http://localhost:2888/ > /dev/null; then
    log_success "Main application is accessible at http://localhost:2888"
else
    log_error "Main application is not accessible"
fi

# Test API health
if curl -f -s http://localhost:2888/api/health > /dev/null; then
    log_success "Frontend API health check passed"
else
    log_error "Frontend API health check failed"
fi

# Test backend API
if curl -f -s http://localhost:2888/api/v1/health > /dev/null; then
    log_success "Backend API health check passed"
else
    log_error "Backend API health check failed"
fi

# Test database API
if curl -f -s http://localhost:2888/api/data/ > /dev/null; then
    log_success "Database API is accessible"
else
    log_error "Database API is not accessible"
fi

# Test API documentation
if curl -f -s http://localhost:2888/docs/ > /dev/null; then
    log_success "API documentation is accessible"
else
    log_error "API documentation is not accessible"
fi

# Show container status
echo ""
echo "📊 Container Status"
echo "=================="
docker compose -f infrastructure/docker/compose.dev.yml ps

# Success message
echo ""
echo -e "${GREEN}🎉 Fresh Install Complete!${NC}"
echo ""
echo "Access your Minecraft Marketplace:"
echo "=================================="
echo "🌐 Main Application:    http://localhost:2888"
echo "📚 API Documentation:   http://localhost:2888/docs"
echo "🗄️  Database API:        http://localhost:2888/api/data"
echo "⚡ Backend API:         http://localhost:2888/api/v1"
echo ""
echo "To stop the application:"
echo "  docker compose -f infrastructure/docker/compose.dev.yml down"
echo ""
echo "To view logs:"
echo "  docker compose -f infrastructure/docker/compose.dev.yml logs -f"
echo ""
echo "For development:"
echo "  npm install  # Install dependencies"
echo "  npm run dev  # Start development servers"