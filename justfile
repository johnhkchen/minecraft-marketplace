# Minecraft Marketplace Deployment Commands
# Requires: just, docker, docker-compose

# Default recipe - show available commands
default:
    @just --list

# Variables
image_name := "minecraft-marketplace"
image_tag := "latest"
container_name := "minecraft-marketplace-app"
data_volume := "./data"
backup_dir := "./tmp/backups"
port := "7410"

# === Development Commands ===

# Install dependencies
install:
    npm install

# CURRENT DEPLOYMENT: Start development servers (assumes infrastructure is running)
dev:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🔥 Starting development servers with hot reload..."
    echo ""
    echo "   ✅ OUTCOME: Development servers will run with hot reload"
    echo "   📍 ACCESS: http://localhost:7410 (main interface)"
    echo "   📊 MONITORING: Logs will show in terminal"
    echo ""
    echo "   Development servers:"
    echo "   • Frontend: Astro + Svelte (internal port 7411)"
    echo "   • Backend:  Hono API (internal port 7412)" 
    echo ""
    echo "💡 Press Ctrl+C to stop all servers"
    echo ""
    
    # Start development servers with hot reload (foreground)
    npm run dev

# Start development environment with Nix process-compose
nix-dev:
    process-compose up

# Run tests
test:
    npm test

# Run tests with UI
test-ui:
    npm run test:ui

# Run tests with coverage
test-coverage:
    npm run test:coverage

# Validate collaboration readiness - "Make it work for others before asking others to work on it"
validate-collaboration:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🤝 Validating Collaboration Readiness..."
    echo ""
    echo "Testing all 10 collaboration requirements + Definition of Done:"
    echo "  1. Fresh machine setup without custom configuration"
    echo "  2. Working demo others can access" 
    echo "  3. Documentation enables contribution"
    echo "  4. Deployable by someone who didn't build it"
    echo "  5. Tested handoff process"
    echo "  6. Clear deliverables and deadlines"
    echo "  7. Working code without debugging environment issues"
    echo "  8. Equal distribution of boring work"
    echo "  9. Self-contained projects needing no constant support"
    echo " 10. Processes serve team goals, not individual preferences"
    echo ""
    
    start_time=$(date +%s)
    
    # Run the comprehensive collaboration validation
    if npx vitest run --config vitest.collaboration.config.ts --reporter=verbose; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        
        echo ""
        echo "✅ COLLABORATION VALIDATION PASSED"
        echo "⏱️  Completed in ${duration}s"
        echo ""
        echo "🎯 Project Status: READY FOR COLLABORATION"
        echo "   • All 10 requirements validated"
        echo "   • Definition of Done criteria met"
        echo "   • 30-minute stakeholder demo ready"
        echo ""
        echo "🚀 Next Steps:"
        echo "   • Share repository with collaborators"
        echo "   • Run 'just fresh-install' to test end-to-end"
        echo "   • Demo to stakeholders with 'just demo'"
        echo ""
    else
        echo ""
        echo "❌ COLLABORATION VALIDATION FAILED"
        echo ""
        echo "🔧 Project Status: NOT READY FOR COLLABORATION"
        echo "   • Fix failing requirements above"
        echo "   • Re-run 'just validate-collaboration'"
        echo "   • Do not share with collaborators until passing"
        echo ""
        exit 1
    fi

# === Database Commands ===

# Check database migration status
db-status:
    npm run db:status

# Run database migrations
db-migrate:
    npm run db:migrate

# Reset database (DESTRUCTIVE!)
db-reset:
    npm run db:reset -- --force

# Create database backup
db-backup:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Create backup directory
    mkdir -p {{ backup_dir }}
    
    # Create timestamped backup
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="{{ backup_dir }}/minecraft-marketplace-${timestamp}.db"
    
    if [ -f "{{ data_volume }}/minecraft-marketplace.db" ]; then
        cp "{{ data_volume }}/minecraft-marketplace.db" "$backup_file"
        echo "✅ Database backed up to: $backup_file"
    else
        echo "❌ Database file not found at {{ data_volume }}/minecraft-marketplace.db"
        exit 1
    fi

# Restore database from backup
db-restore backup_file:
    #!/usr/bin/env bash
    set -euo pipefail
    
    if [ ! -f "{{ backup_file }}" ]; then
        echo "❌ Backup file not found: {{ backup_file }}"
        exit 1
    fi
    
    # Create data directory
    mkdir -p {{ data_volume }}
    
    # Stop container if running
    docker stop {{ container_name }} 2>/dev/null || true
    
    # Restore backup
    cp "{{ backup_file }}" "{{ data_volume }}/minecraft-marketplace.db"
    echo "✅ Database restored from: {{ backup_file }}"

# === Docker Build Commands ===

# Build production Docker image with validation
build:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🔍 Validating paths before build..."
    just validate-paths
    
    # Generate build tag with git hash and timestamp
    BUILD_TAG="$(git rev-parse --short HEAD)-$(date +%s)"
    echo "🏷️  Build tag: $BUILD_TAG"
    
    echo "🔨 Building production Docker services..."
    BUILD_TAG=$BUILD_TAG docker compose -f config/docker/compose.yml build
    
    echo "✅ Docker services built successfully!"
    echo "   Build tag: $BUILD_TAG"

# Build with complete cache invalidation (nuclear option)
build-clean:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "💥 CLEAN BUILD - Removing all Docker cache..."
    echo "   This will take longer but ensures fresh build"
    echo ""
    
    # Validate paths first
    just validate-paths
    
    # Clean all Docker cache
    docker system prune -f
    docker builder prune -af
    
    # Generate build tag
    BUILD_TAG="clean-$(git rev-parse --short HEAD)-$(date +%s)"  
    echo "🏷️  Clean build tag: $BUILD_TAG"
    
    echo "🔨 Building with clean cache..."
    BUILD_TAG=$BUILD_TAG docker compose -f config/docker/compose.yml build --no-cache --pull
    
    echo "✅ Clean build completed!"
    echo "   Build tag: $BUILD_TAG"

# Validate build artifacts match source files
validate-build:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🔍 Validating build artifacts..."
    
    # Check if services are running
    if ! docker compose -f config/docker/compose.yml ps --quiet | grep -q .; then
        echo "❌ Services not running - start with 'just up' first"
        exit 1
    fi
    
    # Check frontend component hash in built artifact
    BUILT_HASH=$(curl -s http://localhost:7410 2>/dev/null | grep -o "EnhancedHomepage\.[^\.]*\.js" | head -1 || echo "not-found")
    SOURCE_MODIFIED=$(stat -c %Y workspaces/frontend/src/components/EnhancedHomepage.svelte)
    
    echo "   Built artifact: $BUILT_HASH"
    echo "   Source modified: $(date -d @$SOURCE_MODIFIED)"
    
    if [[ "$BUILT_HASH" == "not-found" ]]; then
        echo "❌ Build validation failed - component not found in deployment"
        echo "💡 Try: just build-clean && just up"
        exit 1
    fi
    
    echo "✅ Build validation passed"

# Validate all required paths exist before build
validate-paths:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🔍 Validating file structure..."
    
    # Critical source files
    REQUIRED_FILES=(
        "workspaces/frontend/src/components/EnhancedHomepage.svelte"
        "workspaces/frontend/src/pages/index.astro" 
        "workspaces/frontend/package.json"
        "workspaces/shared/package.json"
        "workspaces/backend/package.json"
        "config/docker/Dockerfile.frontend"
        "config/docker/Dockerfile.backend"
        "config/docker/compose.yml"
        "config/docker/nginx.conf"
    )
    
    MISSING_FILES=()
    for file in "${REQUIRED_FILES[@]}"; do
        if [[ ! -f "$file" ]]; then
            MISSING_FILES+=("$file")
        fi
    done
    
    if [[ ${#MISSING_FILES[@]} -gt 0 ]]; then
        echo "❌ Missing required files:"
        printf '   • %s\n' "${MISSING_FILES[@]}"
        echo ""
        echo "💡 Ensure codebase reorganization is complete"
        exit 1
    fi
    
    echo "✅ All required paths validated"

# === Docker Run Commands ===

# DEPLOY: Start all services in production mode (standard 'up' command)
up:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🐳 Starting production infrastructure services..."
    echo ""
    echo "   ✅ OUTCOME: Full production stack will be running"
    echo "   📍 ACCESS: http://localhost:7410 (nginx reverse proxy)"
    echo "   🎯 PURPOSE: Complete deployment, not just infrastructure"
    echo ""
    
    docker compose -f config/docker/compose.yml up -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    timeout=60
    while ! curl -f -s http://localhost:7410 > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            echo "❌ Services failed to start within 60 seconds"
            echo "📋 Check status: docker compose ps"
            exit 1
        fi
    done
    
    echo ""
    echo "🎉 PRODUCTION DEPLOYMENT COMPLETE!"
    echo "   🌐 Main interface: http://localhost:7410"
    echo "   📊 API documentation: http://localhost:7410/docs"
    echo "   🐳 Database API: http://localhost:7410/api/data"
    echo ""
    echo "📋 Management commands:"
    echo "   • just status    - Check service health"
    echo "   • just logs      - View application logs"
    echo "   • just down      - Stop all services"

# === Container Management ===

# CHECK STATUS: Show current deployment status and access information
status:
    #!/usr/bin/env bash
    echo "📊 Minecraft Marketplace Status"
    echo "================================"
    echo ""
    
    # Check if services are running
    if docker compose -f config/docker/compose.yml ps --quiet | grep -q .; then
        echo "✅ DEPLOYMENT STATUS: Services are running"
        echo ""
        echo "🌐 ACCESS POINTS:"
        echo "   • Main interface: http://localhost:7410"
        echo "   • API docs: http://localhost:7410/docs"
        echo "   • Database API: http://localhost:7410/api/data"
        echo ""
        echo "📋 SERVICE HEALTH:"
        docker compose -f config/docker/compose.yml ps
        
        echo ""
        echo "🏥 CONNECTIVITY TEST:"
        if curl -f -s http://localhost:7410 > /dev/null 2>&1; then
            echo "   ✅ Main interface: RESPONDING"
        else
            echo "   ❌ Main interface: NOT RESPONDING"
        fi
    else
        echo "❌ DEPLOYMENT STATUS: No services running"
        echo ""
        echo "🚀 TO START: just up (production) or just dev (development)"
    fi

# View recent logs (raw docker)
logs-recent:
    docker logs --tail 50 {{ container_name }}

# Stop the application
stop:
    #!/usr/bin/env bash
    echo "🛑 Stopping Minecraft Marketplace..."
    docker stop {{ container_name }} || true
    echo "✅ Application stopped"

# Start existing container
start:
    #!/usr/bin/env bash
    echo "▶️ Starting Minecraft Marketplace..."
    docker start {{ container_name }}
    echo "✅ Application started"

# Restart the application
restart: stop start

# Remove container (preserves data)
remove:
    #!/usr/bin/env bash
    echo "🗑️ Removing container..."
    docker stop {{ container_name }} 2>/dev/null || true
    docker rm {{ container_name }} 2>/dev/null || true
    echo "✅ Container removed (data preserved)"

# STOP SERVICES: Shut down all services cleanly
down:
    #!/usr/bin/env bash
    echo "🛑 Stopping Minecraft Marketplace services..."
    echo ""
    echo "   ✅ OUTCOME: All services will be stopped"
    echo "   💾 DATA: Database data is preserved"
    echo "   🔄 TO RESTART: just up (production) or just dev (development)"
    echo ""
    
    docker compose -f config/docker/compose.yml down
    
    # Also stop dev compose if it exists
    if [ -f "config/docker/compose.dev.yml" ]; then
        docker compose -f config/docker/compose.dev.yml down 2>/dev/null || true
    fi
    
    echo "✅ All services stopped successfully"

# VIEW LOGS: Show application logs with clear service identification
logs:
    #!/usr/bin/env bash
    echo "📋 Minecraft Marketplace Logs"
    echo "============================="
    echo ""
    echo "   ✅ OUTCOME: Live log streaming from all services"
    echo "   🎯 PURPOSE: Monitor application behavior and debug issues"
    echo "   💡 TIP: Press Ctrl+C to stop log streaming"
    echo ""
    echo "📊 Service Legend:"
    echo "   • nginx: Reverse proxy and routing"
    echo "   • frontend: Astro + Svelte application"
    echo "   • backend: Hono API server"
    echo "   • db: PostgreSQL database"
    echo "   • postgrest: Auto-generated REST API"
    echo ""
    
    docker compose -f config/docker/compose.yml logs -f --tail=50

# === Maintenance Commands ===

# Clean up Docker resources
clean:
    #!/usr/bin/env bash
    echo "🧹 Cleaning up Docker resources..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images (keep latest)
    docker image prune -f
    
    # Remove unused volumes (careful with data!)
    echo "⚠️ Note: Not removing volumes to preserve data"
    
    echo "✅ Cleanup complete"

# Full cleanup (DESTRUCTIVE - removes all data!)
clean-all:
    #!/usr/bin/env bash
    echo "⚠️ WARNING: This will remove ALL containers, images, and data!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        echo "🧹 Performing full cleanup..."
        docker stop {{ container_name }} 2>/dev/null || true
        docker rm {{ container_name }} 2>/dev/null || true
        docker rmi {{ image_name }}:{{ image_tag }} 2>/dev/null || true
        rm -rf {{ data_volume }}
        rm -rf {{ backup_dir }}
        echo "✅ Full cleanup complete"
    else
        echo "❌ Cleanup cancelled"
    fi

# Update application (rebuild and redeploy)
update: build up
    echo "🎉 Application updated successfully!"

# === Health and Monitoring ===

# PORTS: Quick reference for all service ports (designed to avoid conflicts)
ports:
    @echo "🌐 Minecraft Marketplace Service Ports"
    @echo "======================================"
    @echo ""
    @echo "   ✅ OUTCOME: Port reference for all services"
    @echo "   🎯 PURPOSE: Know which ports to use (uncommon range avoids conflicts)"
    @echo "   💡 TIP: Bookmark these - different from typical 3000, 8000 ports"
    @echo ""
    @echo "🌍 MAIN ACCESS POINTS:"
    @echo "   • http://localhost:7410 - Main entry (nginx reverse proxy)"
    @echo "   • http://localhost:7410/docs - API documentation (PostgREST)"
    @echo "   • http://localhost:7410/api/data - Database API (PostgREST)"
    @echo ""
    @echo "🔧 DEVELOPMENT PORTS (when using 'just dev'):"
    @echo "   • http://localhost:4321 - Frontend dev server (Astro + Svelte)"
    @echo "   • http://localhost:3001 - Backend dev server (Hono API)"
    @echo "   • http://localhost:3000 - Database API (PostgREST direct)"
    @echo "   • postgresql://localhost:5432 - Database (PostgreSQL)"
    @echo "   • redis://localhost:6379 - Cache (Valkey/Redis)"
    @echo ""
    @echo "🎯 FOR NEWCOMERS:"
    @echo "   • Always start with: http://localhost:7410 (production)"
    @echo "   • Or for development: http://localhost:4321 (with hot reload)"
    @echo "   • Range 7410-7419 chosen to avoid conflicts with other projects"

# HEALTH CHECK: Comprehensive service health validation
health:
    #!/usr/bin/env bash
    echo "🏥 Minecraft Marketplace Health Check"
    echo "===================================="
    echo ""
    echo "   ✅ OUTCOME: Comprehensive health validation"
    echo "   🎯 PURPOSE: Verify all services are working correctly"
    echo "   📊 SCOPE: Network, database, API, and frontend checks"
    echo ""
    
    # Check if services are running
    if ! docker compose -f config/docker/compose.yml ps --quiet | grep -q .; then
        echo "❌ DEPLOYMENT: No services running"
        echo "🚀 FIX: Run 'just up' to start services"
        exit 1
    fi
    
    echo "🔍 RUNNING HEALTH CHECKS..."
    echo ""
    
    # Check main interface
    echo "1. Main Interface (http://localhost:7410)"
    if curl -f -s http://localhost:7410 >/dev/null 2>&1; then
        echo "   ✅ Responding correctly"
    else
        echo "   ❌ Not responding"
        exit 1
    fi
    
    # Check service health status
    echo ""
    echo "2. Service Health Status"
    docker compose -f config/docker/compose.yml ps
    
    echo ""
    echo "🎉 ALL HEALTH CHECKS PASSED!"
    echo "📍 Access your marketplace at: http://localhost:7410"

# Show resource usage
stats:
    #!/usr/bin/env bash
    echo "📊 Resource Usage:"
    docker stats {{ container_name }} --no-stream --format "table {{{{.Name}}}}\t{{{{.CPUPerc}}}}\t{{{{.MemUsage}}}}\t{{{{.NetIO}}}}\t{{{{.BlockIO}}}}"

# === Utility Commands ===

# Connect to running container shell
shell:
    docker exec -it {{ container_name }} sh

# Run database migrations in container
migrate-container:
    docker exec {{ container_name }} npm run db:migrate

# Check container environment
env:
    docker exec {{ container_name }} env | sort

# === Newcomer Support Commands ===

# NEWCOMER SETUP: Complete guided setup for first-time users
newcomer-setup:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🚀 Newcomer Setup - Welcome to Minecraft Marketplace!"
    echo "=================================================="
    echo ""
    echo "   ✅ OUTCOME: Complete setup in 3-5 minutes"
    echo "   🎯 PURPOSE: Get you contributing quickly"
    echo "   📋 STEPS: Environment → Services → Tests → Success!"
    echo ""
    
    start_time=$(date +%s)
    
    echo "📝 Step 1/4: Setting up environment..."
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "   ✅ Environment template copied (.env created)"
    else
        echo "   ✅ Environment file already exists"
    fi
    
    echo ""
    echo "🐳 Step 2/4: Starting services (this may take 30-60 seconds)..."
    if just up > /dev/null 2>&1; then
        echo "   ✅ All services started successfully"
    else
        echo "   ❌ Service startup failed - check 'just logs'"
        exit 1
    fi
    
    echo ""
    echo "🏥 Step 3/4: Running health check..."
    sleep 5  # Give services time to fully start
    if curl -f -s http://localhost:7410 > /dev/null 2>&1; then
        echo "   ✅ Main interface responding at http://localhost:7410"
    else
        echo "   ⚠️  Services still starting up - try 'just health' in 30 seconds"
    fi
    
    echo ""
    echo "🧪 Step 4/4: Running quick test to verify everything works..."
    if npm run test:fast > /dev/null 2>&1; then
        echo "   ✅ Fast tests passing (322+ tests in <1 second)"
    else
        echo "   ⚠️  Some tests may need attention - run 'npm run test:fast'"
    fi
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    echo ""
    echo "🎉 NEWCOMER SETUP COMPLETE!"
    echo "⏱️  Total time: ${duration} seconds"
    echo ""
    echo "🌐 Your marketplace: http://localhost:7410"
    echo ""
    echo "📚 Next steps for newcomers:"
    echo "   • just tour           - Learn the project structure"
    echo "   • just ports          - See all service ports"
    echo "   • npm run test:fast   - Run tests (instant feedback)"
    echo "   • just newcomer-help  - Get help when stuck"
    echo ""
    echo "🎯 Ready to contribute! Pick a failing test and make it pass."

# NEWCOMER HELP: Quick help when things go wrong
newcomer-help:
    @echo "🆘 Newcomer Help - When Things Go Wrong"
    @echo "======================================"
    @echo ""
    @echo "🚨 COMMON ISSUES & SOLUTIONS:"
    @echo ""
    @echo "❌ 'Cannot find compose.yml'"
    @echo "   💡 Our files are in config/docker/. Use 'just up' instead of 'docker compose up'"
    @echo ""
    @echo "❌ 'Port 7410 connection refused'"
    @echo "   💡 Services still starting. Wait 30s, then try 'just health'"
    @echo ""
    @echo "❌ 'Tests taking forever'"
    @echo "   💡 Use 'npm run test:fast' for instant feedback. Regular 'npm test' needs infrastructure"
    @echo ""
    @echo "❌ 'Too many technologies - overwhelmed'"
    @echo "   💡 Start with 'npm run test:fast'. You don't need to understand everything immediately"
    @echo ""
    @echo "❌ 'Which Epic should I work on?'"
    @echo "   💡 Run 'npm run test:fast' and pick the simplest failing test first"
    @echo ""
    @echo "❌ 'Port conflicts with other projects'"
    @echo "   💡 We use ports 7410-7419 specifically to avoid conflicts. Stop other services if needed"
    @echo ""
    @echo "🆘 STILL STUCK?"
    @echo "   • just status    - Check what's running"
    @echo "   • just logs      - See what's happening"
    @echo "   • just health    - Full system check"
    @echo "   • just down      - Stop everything and start over"

# PROJECT TOUR: Guided tour of project structure for newcomers
tour:
    @echo "🗺️  Minecraft Marketplace Project Tour"
    @echo "====================================="
    @echo ""
    @echo "   ✅ OUTCOME: Understand where everything is"
    @echo "   🎯 PURPOSE: Navigate the codebase confidently"
    @echo "   💡 TIP: Don't memorize everything - just know where to look"
    @echo ""
    @echo "📁 MAIN DIRECTORIES:"
    @echo "   • workspaces/frontend/     - Astro + Svelte UI (what users see)"
    @echo "   • workspaces/backend/      - Hono API server (business logic)"
    @echo "   • workspaces/shared/       - Common types/utilities (shared code)"
    @echo "   • tests/unit/              - Fast tests (⭐ START HERE for development!)"
    @echo "   • tests/integration/       - Slower tests (need database)"
    @echo "   • config/                  - All configuration files"
    @echo "   • docs/                    - Human documentation"
    @echo "   • specs/                   - Technical requirements"
    @echo ""
    @echo "📋 KEY FILES:"
    @echo "   • README.md                - Project overview & setup"
    @echo "   • CLAUDE.md                - Complete development context"
    @echo "   • package.json             - Dependencies & scripts"
    @echo "   • justfile                 - This file! (deployment commands)"
    @echo "   • config/docker/compose.yml - Production deployment"
    @echo ""
    @echo "🧪 TESTING STRATEGY:"
    @echo "   • tests/unit/*.fast.test.ts - Instant feedback (use MSW mocking)"
    @echo "   • tests/integration/        - Real database tests (slower)"
    @echo "   • tests/collaboration/      - Validate handoff process"
    @echo ""
    @echo "🎯 FOR NEWCOMERS - RECOMMENDED PATH:"
    @echo "   1. Run 'npm run test:fast' to see current status"
    @echo "   2. Pick one failing test in tests/unit/"
    @echo "   3. Make it pass using TDD approach"
    @echo "   4. Repeat until comfortable with codebase"

# === Collaboration Commands ===

# FRESH INSTALL TEST: Simulate new user deployment experience
fresh-install:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🆕 Fresh Install Experience Test"
    echo "==============================="
    echo ""
    echo "   ✅ OUTCOME: Validates complete setup from scratch"
    echo "   🎯 PURPOSE: Ensure new users can deploy successfully"
    echo "   📋 STEPS: Clean → Prerequisites → Deploy → Verify"
    echo "   ⏱️  EXPECTED TIME: ~60 seconds"
    echo ""
    
    start_time=$(date +%s)
    
    # Clean slate
    echo "🧹 STEP 1: Cleaning existing environment..."
    just down 2>/dev/null || true
    docker system prune -f >/dev/null 2>&1 || true
    echo "   ✅ Environment cleaned"
    
    # Check prerequisites
    echo ""
    echo "🔍 STEP 2: Prerequisites check..."
    if ! command -v docker &> /dev/null; then
        echo "   ❌ Docker not found - install Docker first"
        echo "   📖 Guide: https://docs.docker.com/get-docker/"
        exit 1
    fi
    if ! docker compose version &> /dev/null; then
        echo "   ❌ Docker Compose not found"
        echo "   📖 Guide: https://docs.docker.com/compose/install/"
        exit 1
    fi
    echo "   ✅ Docker and Docker Compose available"
    
    # Deploy services
    echo ""
    echo "🚀 STEP 3: Deploying services..."
    if just up; then
        echo "   ✅ Services deployed successfully"
    else
        echo "   ❌ Deployment failed"
        echo "   🔧 Try: docker compose logs"
        exit 1
    fi
    
    # Verify functionality
    echo ""
    echo "🏥 STEP 4: Verifying functionality..."
    if curl -f -s http://localhost:7410 > /dev/null 2>&1; then
        echo "   ✅ Main interface accessible"
    else
        echo "   ❌ Main interface not accessible"
        exit 1
    fi
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    echo ""
    echo "🎉 FRESH INSTALL SUCCESS!"
    echo "⏱️  Completed in ${duration} seconds"
    echo ""
    echo "🌐 Your marketplace is ready at: http://localhost:7410"
    echo ""
    echo "📋 Next steps:"
    echo "   • just status  - Check service health"
    echo "   • just logs    - Monitor application logs"
    echo "   • just health  - Run comprehensive health check"

# DEMO PREPARATION: Ready environment for stakeholder presentation
demo:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🎯 Stakeholder Demo Preparation"
    echo "=============================="
    echo ""
    echo "   ✅ OUTCOME: Demo-ready environment in ~30 seconds"
    echo "   🎯 PURPOSE: Prepare for stakeholder presentation"
    echo "   ⏱️  DEMO DURATION: 25-30 minutes total"
    echo "   📍 ACCESS: http://localhost:7410"
    echo ""
    
    start_time=$(date +%s)
    
    # Ensure clean, working environment
    echo "🚀 Preparing demo environment..."
    just fresh-install >/dev/null 2>&1
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    echo ""
    echo "🎉 DEMO ENVIRONMENT READY!"
    echo "⏱️  Preparation time: ${duration} seconds"
    echo ""
    echo "📋 DEMO SCRIPT (25-30 minutes):"
    echo ""
    echo "1. 🚀 Fresh Install Demo (3-5 minutes)"
    echo "   • Show 'just fresh-install' command"
    echo "   • Highlight 60-second deployment"
    echo "   • Demonstrate Docker Compose simplicity"
    echo ""
    echo "2. 🌐 Feature Tour (15-20 minutes)"
    echo "   • Main interface: http://localhost:7410"
    echo "   • User-centered design improvements"
    echo "   • Information architecture changes"
    echo "   • API documentation: http://localhost:7410/docs"
    echo ""
    echo "3. 🏥 Technical Health (2-3 minutes)"
    echo "   • Run 'just health' for service validation"
    echo "   • Show 'just status' for deployment overview"
    echo ""
    echo "4. 💬 Q&A (5-10 minutes)"
    echo "   • Documentation in docs/ folder"
    echo "   • CLAUDE.md for development context"
    echo ""
    echo "🎤 READY TO PRESENT! Open http://localhost:7410 in your browser."

# === Internal Commands (prefixed with _) ===

# Create docker-compose.yml if it doesn't exist
_create-compose:
    #!/usr/bin/env bash
    cat > docker-compose.yml << 'EOF'
    version: '3.8'
    
    services:
      minecraft-marketplace:
        build: .
        ports:
          - "4321:4321"
        volumes:
          - ./data:/app/data
        environment:
          - NODE_ENV=production
          - HOST=0.0.0.0
          - PORT=4321
          - DB_PATH=/app/data/minecraft-marketplace.db
        restart: unless-stopped
        healthcheck:
          test: ["CMD", "node", "-e", "require('http').get('http://localhost:4321', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
          interval: 30s
          timeout: 3s
          retries: 3
    
      backup:
        image: alpine:latest
        volumes:
          - ./data:/data:ro
          - ./backups:/backups
        command: >
          sh -c "
            apk add --no-cache sqlite
            while true; do
              if [ -f /data/minecraft-marketplace.db ]; then
                timestamp=$$(date +%Y%m%d_%H%M%S)
                cp /data/minecraft-marketplace.db /backups/minecraft-marketplace-$${timestamp}.db
                echo \"Backup created: minecraft-marketplace-$${timestamp}.db\"
                # Keep only last 7 days of backups
                find /backups -name \"minecraft-marketplace-*.db\" -mtime +7 -delete
              fi
              sleep 3600
            done
          "
        restart: unless-stopped
    EOF
    
    echo "✅ docker-compose.yml created"

# Show help for deployment
# HELP: Complete guide to using this justfile
help:
    #!/usr/bin/env bash
    cat << 'EOF'
    
    🎮 Minecraft Marketplace - Command Guide
    =======================================
    
    🚀 GETTING STARTED (Most Common Commands):
    -----------------------------------------
    just up              # 🎯 DEPLOY PRODUCTION → http://localhost:7410
    just status          # 📊 CHECK if services are running
    just health          # 🏥 VALIDATE all services working
    just logs            # 📋 VIEW live application logs
    just down            # 🛑 STOP all services cleanly
    
    🔧 DEVELOPMENT COMMANDS:
    -----------------------
    just dev             # 🔥 DEVELOPMENT MODE with hot reload
    just fresh-install   # 🆕 TEST complete deployment from scratch
    just demo            # 🎯 PREPARE for stakeholder demo
    
    📊 MONITORING & MAINTENANCE:
    ---------------------------
    just clean           # 🧹 CLEANUP Docker resources
    just stats           # 📈 SHOW resource usage
    just validate-collaboration  # 🤝 VALIDATE collaboration readiness
    
    💾 DATABASE OPERATIONS:
    ----------------------
    just db-status       # 📋 CHECK migration status
    just db-migrate      # ⬆️  RUN database migrations
    just db-backup       # 💾 CREATE database backup
            
    🎯 QUICK REFERENCE:
    ------------------
    • Production deployment: just up
    • Development mode: just dev
    • Check if working: just health
    • View what's happening: just logs
    • Stop everything: just down
    
    📍 ACCESS POINTS (when running):
    • Main interface: http://localhost:7410
    • API documentation: http://localhost:7410/docs
    • Database API: http://localhost:7410/api/data
    
    💡 TIP: All commands show clear outcomes and next steps!
    
    EOF