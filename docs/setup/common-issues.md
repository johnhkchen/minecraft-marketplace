# Troubleshooting Common Issues

> **🆘 When things go wrong** - Solutions for newcomers and experienced developers

## 🚨 Critical Issues (Fix These First)

### ❌ "Cannot find compose.yml"
**Symptoms:** `docker compose up` fails with file not found
**Root Cause:** Our compose files are in `config/docker/` for organization

**Solutions:**
```bash
# ❌ Wrong - typical tutorial approach
docker compose up

# ✅ Correct - our file locations  
docker compose -f config/docker/compose.yml up

# ✅ Better - use our automation (standard naming)
just up         # Production deployment (standard 'up' command)
just dev        # Development with hot reload
```

**Why this happens:** Most tutorials put `docker-compose.yml` in the root directory. We organize ours in `config/docker/` to keep the root clean.

### ❌ "Port 7410 connection refused" 
**Symptoms:** Browser shows "This site can't be reached" at http://localhost:7410
**Root Cause:** Services are still starting up or failed to start

**Solutions:**
```bash
# 1. Check if services are starting (wait 30-60 seconds)
just status

# 2. Check service health after waiting
just health

# 3. If still failing, check logs for errors
just logs

# 4. Nuclear option - restart everything
just down
just up
```

**Why this happens:** Docker services need time to download images, start databases, and complete health checks. Our uncommon port range (7410-7419) is intentional to avoid conflicts.

### ❌ "Tests taking forever" (hanging for minutes)
**Symptoms:** `npm test` runs indefinitely, never completes
**Root Cause:** Infrastructure-dependent tests waiting for PostgREST/nginx that isn't running

**Solutions:**
```bash
# ✅ Use fast tests for development (instant feedback)
npm run test:newcomer  # MSW mocked, no infrastructure needed
npm run test:fast      # Same thing, shorter name

# ❌ Don't use these during development
npm test               # Needs infrastructure
npm run test:unit      # May need infrastructure
```

**Why this happens:** Our testing strategy has different tiers. Fast tests use MSW mocking for instant feedback. Full tests need real infrastructure.

## 🟡 Development Environment Issues

### ❌ "Too many technologies - I'm overwhelmed"
**Symptoms:** Looking at the stack and feeling paralyzed 
**Root Cause:** Trying to understand everything at once

**Solutions:**
```bash
# 1. Start with tests - they show you what works
npm run test:newcomer

# 2. Pick ONE failing test and focus only on that
# 3. Learn just the technology needed for that test
# 4. Make it pass, then move to the next one

# 5. Use our guides
just tour              # Project structure overview
just newcomer-help     # Common issues help
```

**Remember:** You don't need to master every technology. Focus on one piece at a time.

### ❌ "Which Epic should I work on?"
**Symptoms:** Looking at 4 Epics and not knowing where to start
**Root Cause:** No clear entry point for contribution

**Solutions:**
```bash
# 1. See what's currently broken
npm run test:newcomer

# 2. Pick the simplest failing test
# Look for tests with simple names like:
# - "should validate item name"
# - "should calculate diamond price"
# - "should filter by category"

# 3. Avoid complex tests initially:
# - Integration tests (need infrastructure)
# - E2E tests (need full stack)
# - Performance tests (need optimization knowledge)
```

**Epic priority for newcomers:**
1. **Epic 1: Price Discovery** - Simple CRUD operations, good starting point
2. **Epic 4: Shop Management** - Business logic, intermediate difficulty  
3. **Epic 2: Community Reporting** - Complex validation, advanced
4. **Epic 3: Discord Integration** - External APIs, most complex

### ❌ "Hot reload not working"
**Symptoms:** Changes to code don't appear in browser
**Root Cause:** Development server not running or wrong URL

**Solutions:**
```bash
# 1. Make sure you're using development mode
just dev               # Starts dev servers with hot reload

# 2. Use the correct development URL
# ✅ Development: http://localhost:4321 (hot reload)  
# ❌ Production: http://localhost:7410 (no hot reload)

# 3. Check if dev services are running
just status

# 4. Restart dev environment
just down
just dev
```

**Why this happens:** We have separate production (`just up`) and development (`just dev`) environments with different ports and capabilities.

## 🟢 Testing & Development Issues

### ❌ "MSW handlers not working"
**Symptoms:** Tests fail with "network request failed" or 404 errors
**Root Cause:** Missing or incorrect MSW request handlers

**Solutions:**
```typescript
// Check tests/utils/fast-test-setup.ts for existing handlers
const handlers = [
  http.get('/api/data/items', () => {
    return HttpResponse.json([
      { id: 1, name: 'Diamond Sword', price_diamonds: 5 }
    ]);
  })
];

// Make sure you call setupFastTests() in your test file
import { setupFastTests } from '../utils/fast-test-setup';
setupFastTests(); // This registers MSW handlers
```

**Debug tips:**
```bash
# 1. Check if other fast tests work
npm run test:fast

# 2. Look at working examples
grep -r "setupFastTests" tests/unit/

# 3. Verify your API endpoint matches the handler
```

### ❌ "TypeScript errors in tests"
**Symptoms:** Red squiggly lines, build failures, type mismatches
**Root Cause:** Using wrong interfaces or missing type definitions

**Solutions:**
```typescript
// ✅ Use shared types from workspaces/shared
import { ItemListing } from '../../workspaces/shared/types/api-types';

// ✅ Common interface field names
const item: ItemListing = {
  id: 1,
  name: 'Diamond Sword',        // Not 'item_name'
  category: 'weapons',          // Not 'item_category' 
  price_diamonds: 5,            // Not 'price'
  owner_id: 'steve'             // Not 'seller_name'
};
```

**Debug tips:**
```bash
# 1. Check existing working tests for patterns
grep -r "ItemListing" tests/unit/

# 2. Run type check
npm run type-check

# 3. Look at shared type definitions
cat workspaces/shared/types/api-types.ts
```

### ❌ "Fast tests suddenly slow"
**Symptoms:** `npm run test:fast` takes 10+ seconds instead of <1 second
**Root Cause:** Infrastructure dependency creeping into fast tests

**Solutions:**
```bash
# 1. Analyze test speeds  
npm run test:speed

# 2. Look for culprits
# - Real HTTP requests instead of MSW mocks
# - Database connections
# - File system operations without mocking

# 3. Fix common issues
# Replace: await fetch('/api/data/items')
# With: setupFastTests() + MSW handlers
```

## 🔧 Infrastructure & Deployment Issues

### ❌ "Docker build failing"
**Symptoms:** Build errors, missing files, context issues
**Root Cause:** File paths or Docker context problems

**Solutions:**
```bash
# 1. Validate file structure first
just validate-paths

# 2. Clean build if necessary
just build-clean

# 3. Check if required files exist
ls workspaces/frontend/src/components/
ls config/docker/
```

### ❌ "Services start but don't work together"
**Symptoms:** Individual services run but can't communicate
**Root Cause:** Network configuration or service dependencies

**Solutions:**
```bash
# 1. Use our orchestration (handles networking)
just down
just up

# 2. Check service health
just health

# 3. Verify all services are running
docker compose -f config/docker/compose.yml ps

# 4. Check logs for connection errors
just logs
```

### ❌ "Database migrations failing"
**Symptoms:** Schema errors, table not found, migration conflicts
**Root Cause:** Database state inconsistency

**Solutions:**
```bash
# 1. Check migration status
npm run db:status

# 2. Run pending migrations
npm run db:migrate

# 3. Nuclear option - reset database (DESTRUCTIVE!)
npm run db:reset
```

## 🐳 Docker-Specific Issues

### ❌ "Permission denied" on Docker commands
**Symptoms:** Docker commands fail with permission errors
**Root Cause:** User not in docker group (Linux) or Docker not running

**Solutions:**
```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER
# Then log out and back in

# Mac/Windows: Start Docker Desktop
# Verify: docker ps should work without sudo
```

### ❌ "No space left on device"
**Symptoms:** Docker build or run fails with disk space error
**Root Cause:** Docker images filling up disk

**Solutions:**
```bash
# 1. Clean unused Docker resources
just clean

# 2. More aggressive cleanup (careful!)
docker system prune -a

# 3. Remove old images
docker image prune -a
```

### ❌ "Port already in use"
**Symptoms:** Docker fails to start because port 7410 (or others) is busy
**Root Cause:** Another service using our ports

**Solutions:**
```bash
# 1. Find what's using the port
lsof -i :7410
netstat -tulpn | grep 7410

# 2. Stop the conflicting service
# Or change our ports in compose files

# 3. Our ports are designed to avoid common conflicts
# 7410-7419 range is specifically chosen to be uncommon
```

## 🌐 Network & Connectivity Issues

### ❌ "API calls failing in development"
**Symptoms:** Frontend can't reach backend, CORS errors
**Root Cause:** Development server configuration

**Solutions:**
```bash
# 1. Use correct development URLs
# Frontend: http://localhost:4321
# Backend: http://localhost:3001  
# PostgREST: http://localhost:3000

# 2. Check if all dev services are running
just status

# 3. Restart development environment
just dev
```

### ❌ "CORS errors in browser"
**Symptoms:** Browser console shows CORS policy errors
**Root Cause:** Missing or incorrect CORS configuration

**Solutions:**
```bash
# 1. Use production URL (nginx handles CORS)
http://localhost:7410

# 2. Or use development directly
http://localhost:4321

# 3. Check nginx configuration
cat config/docker/nginx.conf
```

## 🆘 Nuclear Options (When All Else Fails)

### 🧹 Clean Slate Restart
```bash
# Stop everything
just down

# Clean all Docker resources
docker system prune -f
docker volume prune -f

# Start fresh
just up
```

### 🔄 Complete Repository Reset
```bash
# Save any important changes first!
git stash

# Reset to known good state
git pull origin main
git reset --hard origin/main

# Clean and reinstall
rm -rf node_modules
npm install

# Fresh start
just newcomer-setup
```

### 📞 Getting Help

**Still stuck? Here's how to get help effectively:**

1. **Gather information:**
   ```bash
   just status      # Current state
   just logs        # Recent errors
   npm run test:fast # Test status
   ```

2. **Check these first:**
   - Are you using the right commands? (`just up`, not `docker compose up`)
   - Are you on the right ports? (7410 for production, 4321 for dev)
   - Did you wait for services to start? (30-60 seconds)

3. **In your help request, include:**
   - What you were trying to do
   - What command you ran
   - The exact error message
   - Output of `just status`
   - Your operating system

**Remember: Most issues are caused by environment setup, not code complexity. These solutions fix 90%+ of newcomer problems!**

## 🎯 Prevention Tips

**Avoid these common mistakes:**
- ✅ Use `just up` instead of `docker compose up`
- ✅ Use `npm run test:newcomer` for development 
- ✅ Wait 30-60 seconds for services to start
- ✅ Check `just status` before assuming things are broken
- ✅ Read error messages completely (they're usually helpful)
- ✅ Start with simple tests before complex features

**Build good habits:**
- 🎯 Run `just health` after setup
- 🎯 Use `just logs` to understand what's happening
- 🎯 Keep `npm run test:fast` green (passing)
- 🎯 Ask for help early rather than struggling alone