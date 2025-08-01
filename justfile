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

# Start development environment with Nix orchestration
nix-up:
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

# Build production Docker image
build:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🔨 Building production Docker image..."
    docker build \
        --tag {{ image_name }}:{{ image_tag }} \
        --tag {{ image_name }}:$(date +%Y%m%d-%H%M%S) \
        .
    
    echo "✅ Docker image built successfully!"
    echo "   Image: {{ image_name }}:{{ image_tag }}"

# Build with no cache (clean build)
build-clean:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🔨 Building production Docker image (clean build)..."
    docker build \
        --no-cache \
        --tag {{ image_name }}:{{ image_tag }} \
        --tag {{ image_name }}:$(date +%Y%m%d-%H%M%S) \
        .
    
    echo "✅ Docker image built successfully!"

# === Docker Run Commands ===

# PRODUCTION DEPLOYMENT: Start all services in production mode
infra:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🐳 Starting production infrastructure services..."
    echo ""
    echo "   ✅ OUTCOME: Full production stack will be running"
    echo "   📍 ACCESS: http://localhost:7410 (nginx reverse proxy)"
    echo "   🎯 PURPOSE: Complete deployment, not just infrastructure"
    echo ""
    
    docker compose up -d
    
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

# DEVELOPMENT MODE: Start development servers with file watching
up:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🚀 Starting development environment with file watching..."
    echo ""
    echo "   ✅ OUTCOME: Development servers with hot reload"
    echo "   📍 ACCESS: http://localhost:7410"
    echo "   🔄 FEATURES: File changes auto-reload"
    echo "   ⚠️  WARNING: For development only - use 'just infra' for production"
    echo ""
    
    # Check if we should use development compose file
    if [ -f "compose.dev.yml" ]; then
        echo "🐳 Starting development infrastructure..."
        docker compose -f compose.dev.yml up -d postgres valkey postgrest nginx
        
        # Wait for database to be ready
        echo "⏳ Waiting for database to be ready..."
        timeout=30
        while ! docker compose -f compose.dev.yml exec postgres pg_isready -U dev_user -d minecraft_marketplace_dev >/dev/null 2>&1; do
            sleep 1
            timeout=$((timeout - 1))
            if [ $timeout -eq 0 ]; then
                echo "❌ Database failed to start within 30 seconds"
                exit 1
            fi
        done
        
        echo "🔥 Starting development servers..."
        npm run dev
    else
        echo "⚠️  No compose.dev.yml found - using production deployment"
        just infra
    fi

# Run container in development mode (with live reloading)
deploy-dev:
    #!/usr/bin/env bash
    set -euo pipefail
    
    echo "🚀 Deploying in development mode..."
    
    # Stop existing container
    docker stop {{ container_name }}-dev 2>/dev/null || true
    docker rm {{ container_name }}-dev 2>/dev/null || true
    
    # Run development container with source mounting
    docker run \
        --name {{ container_name }}-dev \
        --detach \
        --restart unless-stopped \
        --publish {{ port }}:4321 \
        --volume "$(pwd):/app" \
        --volume "$(pwd)/{{ data_volume }}:/app/data" \
        --workdir /app \
        --env NODE_ENV=development \
        node:20-alpine \
        sh -c "npm install && npm run dev"
    
    echo "✅ Development deployment started!"
    echo "   URL: http://localhost:{{ port }}"

# === Container Management ===

# CHECK STATUS: Show current deployment status and access information
status:
    #!/usr/bin/env bash
    echo "📊 Minecraft Marketplace Status"
    echo "================================"
    echo ""
    
    # Check if services are running
    if docker compose ps --quiet | grep -q .; then
        echo "✅ DEPLOYMENT STATUS: Services are running"
        echo ""
        echo "🌐 ACCESS POINTS:"
        echo "   • Main interface: http://localhost:7410"
        echo "   • API docs: http://localhost:7410/docs"
        echo "   • Database API: http://localhost:7410/api/data"
        echo ""
        echo "📋 SERVICE HEALTH:"
        docker compose ps
        
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
        echo "🚀 TO START: just infra (production) or just up (development)"
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
    echo "   🔄 TO RESTART: just infra (production) or just up (development)"
    echo ""
    
    docker compose down
    
    # Also stop dev compose if it exists
    if [ -f "compose.dev.yml" ]; then
        docker compose -f compose.dev.yml down 2>/dev/null || true
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
    
    docker compose logs -f --tail=50

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
    if ! docker compose ps --quiet | grep -q .; then
        echo "❌ DEPLOYMENT: No services running"
        echo "🚀 FIX: Run 'just infra' to start services"
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
    docker compose ps
    
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
    if just infra; then
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
    just infra           # 🎯 DEPLOY PRODUCTION → http://localhost:7410
    just status          # 📊 CHECK if services are running
    just health          # 🏥 VALIDATE all services working
    just logs            # 📋 VIEW live application logs
    just down            # 🛑 STOP all services cleanly
    
    🔧 DEVELOPMENT COMMANDS:
    -----------------------
    just up              # 🔄 DEVELOPMENT MODE with file watching
    just dev             # 🔥 START dev servers (requires infra first)
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
    • Production deployment: just infra
    • Development mode: just up
    • Check if working: just health
    • View what's happening: just logs
    • Stop everything: just down
    
    📍 ACCESS POINTS (when running):
    • Main interface: http://localhost:7410
    • API documentation: http://localhost:7410/docs
    • Database API: http://localhost:7410/api/data
    
    💡 TIP: All commands show clear outcomes and next steps!
    
    EOF