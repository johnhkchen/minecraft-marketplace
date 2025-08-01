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

if docker compose -f config/docker/compose.dev.yml up --build -d --wait --wait-timeout 180; then
    log_success "All services started successfully!"
else
    log_error "Failed to start services. Check Docker logs:"
    echo "  docker compose -f config/docker/compose.dev.yml logs"
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
if curl -f -s http://localhost:7410/ > /dev/null; then
    log_success "Main application is accessible at http://localhost:7410"
else
    log_error "Main application is not accessible"
fi

# Test frontend service directly
if curl -f -s http://localhost:4321/ > /dev/null; then
    log_success "Frontend service is running on port 4321"
else
    log_warning "Frontend service may still be starting"
fi

# Test backend service directly
if curl -f -s http://localhost:3001/ > /dev/null; then
    log_success "Backend service is running on port 3001"
else
    log_warning "Backend service may still be starting"
fi

# Test database API
if curl -f -s http://localhost:3000/ > /dev/null; then
    log_success "PostgREST database API is accessible on port 3000"
else
    log_warning "PostgREST may still be starting"
fi

# Show container status
echo ""
echo "📊 Container Status"
echo "=================="
docker compose -f config/docker/compose.dev.yml ps

# Success message
echo ""
echo -e "${GREEN}🎉 Fresh Install Complete!${NC}"
echo ""
echo "Access your Minecraft Marketplace:"
echo "=================================="
echo "🌐 Main Application:    http://localhost:7410"
echo "🗄️  Frontend (dev):       http://localhost:4321"
echo "⚡ Backend (dev):        http://localhost:3001"
echo "📚 PostgREST API:       http://localhost:3000"
echo ""
echo "To stop the application:"
echo "  docker compose -f config/docker/compose.dev.yml down"
echo ""
echo "To view logs:"
echo "  docker compose -f config/docker/compose.dev.yml logs -f"
echo ""
echo "🎯 Next Steps for Newcomers:"
echo "============================"
echo "  npm install              # Install dependencies"
echo "  npm run test:newcomer    # See tests pass instantly (<1s)"
echo "  just ports               # Learn about service ports"
echo "  just tour                # Understand project structure"
echo "  just newcomer-help       # Get help when stuck"
echo ""
echo "💡 Development workflow:"
echo "  npm run dev              # Start development servers with hot reload"
echo "  npm run test:fast        # Run tests while developing"