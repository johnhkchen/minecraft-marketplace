# Testing Guide

> **Complete guide to testing the Minecraft Marketplace - from newcomer to expert**

## 🚀 Quick Start Testing

### **For Newcomers (Start Here!):**
```bash
# Instant feedback tests - no setup needed
npm run test:newcomer

# Expected: 322+ tests pass in <1 second
# Uses MSW mocking - no infrastructure required
```

### **For Developers:**
```bash
# Fast development cycle
npm run test:fast           # All fast tests
npm run test:fast:watch     # Watch mode for TDD

# Full testing (requires infrastructure)
just up                     # Start services first
npm run test:integration    # Real database tests
npm run test:e2e           # Complete user workflows
```

---

## 📊 Testing Strategy Overview

Our testing approach has **3 speed tiers** for different development needs:

```
┌─ Fast Tests (<1s) ─────────────────────────┐
│  • MSW mocked APIs                         │
│  • Business logic validation              │  
│  • 322+ tests in ~80ms                    │
│  • Perfect for TDD development            │
└────────────────────────────────────────────┘
                    ↓
┌─ Integration Tests (<5s) ──────────────────┐
│  • Real database connections              │
│  • PostgREST API testing                  │
│  • Docker testcontainers                  │
│  • Service interaction validation         │
└────────────────────────────────────────────┘
                    ↓
┌─ End-to-End Tests (<30s) ──────────────────┐
│  • Complete user workflows                │
│  • Playwright browser automation          │
│  • Full stack validation                  │
│  • Epic requirement verification          │
└────────────────────────────────────────────┘
```

---

## ⚡ Fast Tests (Recommended for Development)

**Purpose**: Instant feedback for rapid development cycles

### **Running Fast Tests**
```bash
# Primary development command
npm run test:newcomer      # With helpful output
npm run test:fast          # Shorter command
npm run test:fast:watch    # TDD watch mode

# Speed analysis
npm run test:speed         # Analyze test performance
```

### **What Fast Tests Cover**
- ✅ **Business Logic**: Item validation, pricing, categories
- ✅ **Epic Requirements**: All 4 Epic scenarios tested
- ✅ **Data Processing**: Minecraft-specific item handling
- ✅ **API Contracts**: Request/response validation (mocked)
- ✅ **Edge Cases**: Error handling, boundary conditions
- ✅ **Performance**: Each test completes in <10ms

### **Fast Test Examples**
```typescript
// tests/unit/item-validation.fast.test.ts
it('validates diamond sword pricing within Epic 1 requirements', () => {
  const item = validItem({ name: 'Diamond Sword', price_diamonds: 5 });
  const result = validateItemPricing(item);
  
  expect(result.isValid).toBe(true);
  expect(result.priceRange).toBe('affordable');
});

// tests/unit/search-performance.fast.test.ts
it('completes item search in <2s (Epic 1 requirement)', async () => {
  const start = performance.now();
  const results = await searchService.findItems('diamond');
  const duration = performance.now() - start;
  
  expect(results.length).toBeGreaterThan(0);
  expect(duration).toBeLessThan(2000); // Epic 1: <2s search
});
```

### **Fast Test Configuration**
```typescript
// config/testing/vitest.fast.config.ts
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.fast.test.ts'],
    setupFiles: ['tests/utils/fast-test-setup.ts'],
    timeout: 1000, // Fast tests must complete quickly
    environment: 'jsdom'
  }
});
```

---

## 🔗 Integration Tests (Infrastructure Testing)

**Purpose**: Validate service interactions with real infrastructure

### **Prerequisites**
```bash
# Start test infrastructure
docker compose -f config/docker/compose.test.yml up -d

# Or run with automatic infrastructure management
npm run test:compose
```

### **Running Integration Tests**
```bash
# Basic integration tests
npm run test:integration

# Testcontainer-based tests (isolated infrastructure)
npm run test:integration:containers

# Full cycle: up → test → down
npm run test:compose
```

### **What Integration Tests Cover**
- ✅ **Database Operations**: PostgreSQL CRUD with real connections
- ✅ **PostgREST API**: Auto-generated REST API validation
- ✅ **Service Communication**: Frontend ↔ Backend ↔ Database
- ✅ **Authentication Flow**: Discord OAuth (when configured)
- ✅ **Data Persistence**: Real database transactions
- ✅ **Performance Validation**: Response times with real infrastructure

### **Integration Test Examples**
```typescript
// tests/integration/database/item-repository.test.ts
describe('ItemRepository Integration', () => {
  let repository: ItemRepository;
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    repository = new PostgreSQLItemRepository(testDb);
  });

  it('persists and retrieves items correctly', async () => {
    const item = validItem({ name: 'Enchanted Diamond Sword' });
    
    const saved = await repository.save(item);
    const retrieved = await repository.findById(saved.id);
    
    expect(retrieved).toEqual(saved);
    expect(retrieved.name).toBe('Enchanted Diamond Sword');
  });
});
```

### **Testcontainer Setup**
```typescript
// tests/utils/testcontainer-setup.ts
export async function setupTestInfrastructure() {
  const container = new PostgreSqlContainer('postgres:17')
    .withDatabase('test_marketplace')
    .withUsername('test_user')
    .withPassword('test_password');
    
  const startedContainer = await container.start();
  
  return {
    connectionString: startedContainer.getConnectionUri(),
    cleanup: () => startedContainer.stop()
  };
}
```

---

## 🌐 End-to-End Tests (Complete Workflows)

**Purpose**: Validate complete user journeys from browser to database

### **Prerequisites**
```bash
# Start full application stack
just up

# Install Playwright browsers (first time)
npx playwright install
```

### **Running E2E Tests**
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npx playwright test marketplace-search
npx playwright test discord-integration
npx playwright test shop-management

# Interactive mode for debugging
npx playwright test --ui
```

### **What E2E Tests Cover**
- ✅ **Complete Epic Workflows**: All 4 Epics tested end-to-end
- ✅ **Browser Interactions**: Real user interactions with UI
- ✅ **Performance Requirements**: <2s search, <500ms filtering
- ✅ **Cross-Browser Compatibility**: Chrome, Firefox, Safari
- ✅ **Mobile Responsiveness**: Touch interactions, responsive design
- ✅ **Error Handling**: Network failures, validation errors

### **E2E Test Examples**
```typescript
// tests/e2e/epic1-price-discovery.spec.ts
test('Epic 1: Complete price discovery workflow', async ({ page }) => {
  // Navigate to marketplace
  await page.goto('http://localhost:7410');
  
  // Search for items (Epic 1 requirement: <2s)
  const searchStart = Date.now();
  await page.fill('[data-testid="search-input"]', 'diamond sword');
  await page.click('[data-testid="search-button"]');
  
  await page.waitForSelector('[data-testid="search-results"]');
  const searchDuration = Date.now() - searchStart;
  
  // Verify Epic 1 performance requirement
  expect(searchDuration).toBeLessThan(2000);
  
  // Apply filters (Epic 1 requirement: <500ms)
  const filterStart = Date.now();
  await page.selectOption('[data-testid="category-filter"]', 'weapons');
  await page.waitForSelector('[data-testid="filtered-results"]');
  const filterDuration = Date.now() - filterStart;
  
  expect(filterDuration).toBeLessThan(500);
  
  // Verify results
  const results = await page.locator('[data-testid="item-card"]').count();
  expect(results).toBeGreaterThan(0);
});
```

### **Visual Testing**
```typescript
// tests/e2e/visual-regression.spec.ts
test('Homepage visual consistency', async ({ page }) => {
  await page.goto('http://localhost:7410');
  await page.waitForLoadState('networkidle');
  
  // Compare against baseline screenshot
  await expect(page).toHaveScreenshot('homepage.png');
});
```

---

## 🎯 Epic-Specific Testing

Each Epic has dedicated test suites validating requirements:

### **Epic 1: Price Discovery**
```bash
# Search performance validation
npm run test:epic1

# Files: tests/unit/epic1-*.test.ts, tests/e2e/epic1-*.spec.ts
```

**Tests Cover:**
- Search response time <2s
- Filter response time <500ms  
- Price history trends
- Category filtering accuracy

### **Epic 2: Community Reporting**
```bash
# Evidence validation and confidence scoring
npm run test:epic2
```

**Tests Cover:**
- Report submission with evidence
- Confidence level calculation
- Auto-approval workflows
- Shop owner notifications

### **Epic 3: Discord Integration**
```bash
# OAuth and webhook testing
npm run test:epic3
```

**Tests Cover:**
- Discord OAuth flow
- JWT token generation
- Real-time notifications
- Profile integration

### **Epic 4: Shop Management**
```bash
# Inventory and analytics testing
npm run test:epic4
```

**Tests Cover:**
- Item listing workflows
- Real-time inventory updates
- Analytics dashboard
- Performance metrics

---

## 🔍 Test Categories & Commands

### **By Speed & Infrastructure Needs**
```bash
# No infrastructure needed (instant)
npm run test:fast           # 322+ tests in <1s
npm run test:newcomer       # Same as above, with guidance

# Minimal infrastructure (test containers)
npm run test:integration:containers  # Isolated test environments

# Full infrastructure (all services running)
npm run test:integration    # Real database connections
npm run test:e2e           # Complete browser workflows

# Special purpose
npm run test:performance    # Epic performance requirements
npm run test:security      # Security validation
npm run test:collaboration # Handoff process validation
```

### **By Test Type**
```bash
# Unit testing
npm run test:unit          # Pure business logic

# Contract testing  
npm run test:contracts     # TypeScript interfaces

# Coverage analysis
npm run test:coverage      # Code coverage report

# Speed analysis
npm run test:speed         # Performance analysis of tests themselves
```

### **Development Workflow Commands**
```bash
# TDD development cycle
npm run test:fast:watch    # Continuous fast testing

# Pre-commit validation
npm run test:all           # All test categories

# CI/CD pipeline
npm run test-pipeline      # Comprehensive test suite
```

---

## 📈 Performance Testing

### **Epic Performance Requirements**
Our tests validate these specific performance targets:

```typescript
// Epic 1: Price Discovery Performance
describe('Epic 1 Performance Requirements', () => {
  it('search completes in <2s with 10,000+ items', async () => {
    const { result, timeMs } = await measure(() => 
      searchService.findItems('diamond', { limit: 100 })
    );
    
    expect(result.items.length).toBeGreaterThan(0);
    expect(timeMs).toBeLessThan(2000); // Epic 1 requirement
  });

  it('filtering completes in <500ms', async () => {
    const { result, timeMs } = await measure(() =>
      filterService.applyFilters(items, { category: 'weapons' })
    );
    
    expect(timeMs).toBeLessThan(500); // Epic 1 requirement
  });
});
```

### **API Performance Testing**
```typescript
// API response time validation
describe('API Performance (Epic Requirements)', () => {
  it('API responses complete in <200ms (95th percentile)', async () => {
    const measurements = [];
    
    // Run 100 requests to get 95th percentile
    for (let i = 0; i < 100; i++) {
      const { timeMs } = await measure(() =>
        fetch('/api/data/items?limit=10')
      );
      measurements.push(timeMs);
    }
    
    const p95 = percentile(measurements, 95);
    expect(p95).toBeLessThan(200); // Epic performance requirement
  });
});
```

---

## 🐳 Test Infrastructure Management

### **Docker Test Environments**

#### **Lightweight Test Infrastructure**
```yaml
# config/docker/compose.test.yml
services:
  test-db:
    image: postgres:17-alpine
    ports: ["5433:5432"]  # Different port to avoid conflicts
    environment:
      POSTGRES_DB: marketplace_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    tmpfs:
      - /var/lib/postgresql/data  # In-memory for speed

  test-postgrest:
    image: postgrest/postgrest:v12.2.0
    ports: ["3001:3000"]
    depends_on: [test-db]
```

#### **Test Infrastructure Commands**
```bash
# Start test infrastructure
docker compose -f config/docker/compose.test.yml up -d

# Run tests with infrastructure
npm run test:integration

# Clean up test infrastructure  
docker compose -f config/docker/compose.test.yml down

# Full cycle with cleanup
npm run test:compose
```

### **Testcontainers (Isolated Testing)**
For tests that need guaranteed isolation:

```typescript
// tests/integration/testcontainer-example.test.ts
describe('Isolated Database Testing', () => {
  let container: StartedPostgreSqlContainer;
  let repository: ItemRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:17')
      .withDatabase('isolated_test')
      .start();
      
    repository = new ItemRepository({
      connectionString: container.getConnectionUri()
    });
  }, 60000); // Allow time for container startup

  afterAll(async () => {
    await container.stop();
  });

  it('runs in complete isolation', async () => {
    // This test has its own database container
    // No conflicts with other tests
  });
});
```

---

## 🔧 Test Configuration & Setup

### **Environment-Specific Configurations**

#### **Fast Tests (MSW Mocking)**
```typescript
// config/testing/vitest.fast.config.ts
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.fast.test.ts'],
    setupFiles: ['tests/utils/fast-test-setup.ts'],
    environment: 'jsdom',
    globals: true,
    timeout: 1000
  }
});
```

#### **Integration Tests (Real Infrastructure)**
```typescript
// config/testing/vitest.integration.config.ts
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/utils/integration-test-setup.ts'],
    timeout: 10000,
    sequential: true // Prevent database conflicts
  }
});
```

#### **E2E Tests (Full Stack)**
```typescript
// config/testing/playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:7410',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } }
  ]
});
```

### **Test Data Management**

#### **Centralized Test Framework**
```typescript
// tests/utils/centralized-test-framework.ts
export const MINECRAFT_TEST_DATA = {
  mainTrader: 'steve',
  secondaryTrader: 'alex', 
  primaryItem: 'Diamond Sword',
  primaryServer: 'HermitCraft'
};

export function validItem(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: MINECRAFT_TEST_DATA.primaryItem,
    category: 'weapons',
    price_diamonds: 5,
    owner_id: MINECRAFT_TEST_DATA.mainTrader,
    ...overrides
  };
}
```

#### **Epic Test Scenarios**
```typescript
// tests/utils/epic-test-scenarios.ts
export const EpicTestScenarios = {
  priceDiscovery: {
    searchTerm: 'diamond sword',
    expectedResults: 10,
    maxSearchTime: 2000,
    maxFilterTime: 500
  },
  
  communityReporting: {
    reporter: MINECRAFT_TEST_DATA.mainTrader,  
    evidence: 'screenshot.png',
    confidenceLevel: 'high'
  },
  
  shopManagement: {
    shopOwner: MINECRAFT_TEST_DATA.mainTrader,
    inventory: [validItem(), validItem({ name: 'Diamond Pickaxe' })]
  }
};
```

---

## 📊 Test Reporting & Analytics

### **Coverage Reporting**
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/index.html

# Coverage requirements (configured in package.json)
# Minimum 80% coverage across all categories
```

### **Performance Analytics**
```bash
# Analyze test performance
npm run test:speed

# Example output:
# ✅ Fast Tests: 322 tests, avg 0.8ms each
# ⚠️  Integration Tests: 45 tests, avg 125ms each  
# 🐌 Slow Tests Found: 3 tests >1000ms
```

### **Test Result Dashboards**
```typescript
// scripts/test-dashboard.ts
// Generates test results dashboard with:
// - Test execution times by category
// - Epic requirement validation status
// - Performance benchmarks vs requirements
// - Coverage trends over time
```

---

## 🚨 Troubleshooting Tests

### **Common Issues & Solutions**

#### **Fast Tests Slow or Failing**
```bash
# Problem: Fast tests taking >1s
# Solution: Check for infrastructure dependencies

npm run test:speed  # Identify slow tests

# Look for:
# - Real HTTP requests (should use MSW)
# - Database connections (should be mocked)
# - File system operations (should be mocked)
```

#### **Integration Tests Hanging**
```bash
# Problem: Integration tests never complete
# Solution: Check infrastructure availability

# Verify test infrastructure is running
docker compose -f config/docker/compose.test.yml ps

# Check for port conflicts
netstat -tulpn | grep :5433

# Restart test infrastructure
docker compose -f config/docker/compose.test.yml down
docker compose -f config/docker/compose.test.yml up -d
```

#### **E2E Tests Flaky**
```bash
# Problem: E2E tests randomly fail
# Solution: Add proper wait conditions

# Instead of: page.click()
# Use: page.click(); await page.waitForLoadState('networkidle');

# Add explicit waits for dynamic content
await page.waitForSelector('[data-testid="results"]');
```

#### **MSW Handlers Not Working**
```typescript
// Problem: MSW not intercepting requests
// Solution: Verify handler setup

// Check tests/utils/fast-test-setup.ts
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### **Debug Mode Commands**
```bash
# Debug fast tests
npm run test:fast -- --reporter=verbose

# Debug integration tests with logs
DEBUG=* npm run test:integration

# Debug E2E tests interactively
npx playwright test --ui

# Debug specific test file
npx vitest run tests/unit/item-validation.fast.test.ts --reporter=verbose
```

---

## 📋 Testing Checklist

### **Before Committing Code**
- [ ] Fast tests passing (`npm run test:fast`)
- [ ] No slow tests in fast test suite (`npm run test:speed`)
- [ ] New features have fast tests written
- [ ] Edge cases covered in tests
- [ ] Performance requirements validated

### **Before Deployment**
- [ ] All test categories passing (`npm run test:all`)
- [ ] Integration tests with real infrastructure work
- [ ] E2E tests cover main user workflows  
- [ ] Performance benchmarks meet Epic requirements
- [ ] Security tests passing

### **Test Quality Standards**
- [ ] Fast tests complete in <10ms each
- [ ] Integration tests complete in <500ms each
- [ ] E2E tests complete in <10s each
- [ ] >80% code coverage maintained
- [ ] All Epic requirements have automated validation

---

## 🎯 Testing Best Practices

### **TDD Development Cycle**
```bash
# Red → Green → Refactor cycle
1. npm run test:fast:watch  # Start watch mode
2. Write failing test
3. Write minimal code to pass  
4. Refactor when green
5. Repeat
```

### **Test Organization**
```
tests/
├── unit/                    # Fast business logic tests
│   ├── *.fast.test.ts      # MSW mocked, <10ms each
│   └── epic*/              # Epic-specific test suites
├── integration/             # Real infrastructure tests  
│   ├── database/           # Database integration
│   ├── api/               # API endpoint testing
│   └── testcontainers/    # Isolated infrastructure
├── e2e/                    # Complete user workflows
│   ├── epic*/             # Epic workflow validation
│   └── visual/            # Visual regression tests
└── utils/                  # Shared test utilities
    ├── fast-test-setup.ts # MSW configuration
    ├── msw-handlers.ts    # API mock handlers
    └── test-data.ts       # Realistic Minecraft data
```

### **Test Naming Conventions**
```typescript
// Epic-focused test names
describe('Epic 1: Price Discovery', () => {
  it('completes search in <2s with 10k+ items', () => {});
  it('applies filters in <500ms', () => {});
});

// Business value test names  
describe('Shop Owner Experience', () => {
  it('receives notification within 1 minute of report', () => {});
  it('sees real-time inventory updates', () => {});
});
```

---

## 🚀 Advanced Testing

### **Property-Based Testing**
```typescript
// Generate random valid test data
import { fc } from 'fast-check';

it('validates any valid item data', () => {
  fc.assert(fc.property(
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      price_diamonds: fc.integer({ min: 1, max: 10000 }),
      category: fc.constantFrom('weapons', 'tools', 'blocks')
    }),
    (item) => {
      expect(validateItem(item)).toBe(true);
    }
  ));
});
```

### **Load Testing**
```typescript
// Epic 1: Search performance under load
it('maintains <2s search under 100 concurrent users', async () => {
  const promises = Array.from({ length: 100 }, () =>
    measure(() => searchService.findItems('diamond'))
  );
  
  const results = await Promise.all(promises);
  const avgTime = results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;
  
  expect(avgTime).toBeLessThan(2000);
});
```

### **Chaos Testing**
```typescript
// Test resilience to infrastructure failures
it('handles database connection failure gracefully', async () => {
  // Simulate database failure
  await testDb.disconnect();
  
  const result = await searchService.findItems('diamond');
  
  // Should fallback to cache or show appropriate error
  expect(result.error).toBeDefined();
  expect(result.error.type).toBe('database_unavailable');
});
```

---

**🎉 You're now equipped with comprehensive testing knowledge for the Minecraft Marketplace!**

**Quick Reference:**
- **Development**: `npm run test:newcomer` → `npm run test:fast:watch`
- **Integration**: `just up` → `npm run test:integration`  
- **Deployment**: `npm run test:all` → deploy with confidence
- **Performance**: All Epic requirements automatically validated