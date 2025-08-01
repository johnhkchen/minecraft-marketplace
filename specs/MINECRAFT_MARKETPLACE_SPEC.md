# Minecraft Marketplace - Technical Specification

> **Purpose**: Complete technical blueprint for community-driven Minecraft server marketplace  
> **Audience**: Developers implementing the system from scratch  
> **Collaboration Standard**: Fresh install works (`docker compose up`), deployable by others, self-contained

---

## 1. Problem & Solution

### **Problem Statement**
Minecraft server economies lack price transparency and community oversight, leading to information asymmetry, potential scams, and poor player experience.

### **Solution Vision**
Community-driven marketplace with evidence-based reporting creates price transparency through collective oversight and Discord-native integration.

### **Human-Friendly Repository Standards**

This project follows **Ready Repo** principles - built for seamless technical collaboration without human intervention:

#### **✅ Ready Repo Indicators (REQUIRED)**
- **3-Command Setup**: `git clone → docker compose up → working demo`
- **Fresh Install Success**: Works identically on any machine with Docker
- **Self-Documenting**: README answers "how" and docs/ explains "why"
- **Zero Manual Steps**: No "after running docker-compose, you need to..."
- **Clear Error Messages**: When things fail, exactly what to do next
- **CI/CD Parity**: Tests run identically locally and in CI

#### **🚫 Messy Repo Anti-Patterns (PROHIBITED)**
- Environment Hell: Requires specific versions, manual setup steps
- Documentation Debt: "Just ask me" or outdated instructions
- Configuration Chaos: Hardcoded URLs, mixed dev/prod configs
- Manual Intervention: Requires human explanation to get running
- Dependency Confusion: Unclear which package manager or setup method

#### **The Litmus Test**
- **Messy Repo Question**: "Can you help me get this running?"
- **Ready Repo Question**: "How did you make the dev experience so smooth?"

**Success Metric**: New collaborators ask about your techniques, not your help.

### **Core Value Propositions**
1. **Price Discovery**: Compare prices across multiple shops with intelligent search
2. **Community Oversight**: Evidence-based reporting with screenshot/transaction verification
3. **Shop Owner Tools**: Efficient inventory management with community feedback integration
4. **Trust Through Evidence**: Confidence scoring based on verifiable evidence quality
5. **Discord Integration**: Native authentication and notifications through existing community platform

---

## 2. Technology Stack

### **Core Architecture**
- **Frontend**: Astro v5.12+ SSR + Svelte v5.37+ components + API routes for secure operations
- **Backend**: Hono v4.8+ framework for external integrations and heavy business logic
- **Database**: PostgreSQL 17+ with Row Level Security
- **API Layer**: PostgREST auto-generated REST + Astro secure routes + Hono business logic
- **Session Storage**: Valkey v8.1+ (Redis-compatible) for high-performance caching
- **Authentication**: Discord OAuth 2.0 with JWT tokens for PostgREST
- **Testing**: Vitest v3.2+ unit/integration + Faker v9.9+ (Minecraft data) + Playwright v1.54+ E2E with >80% coverage requirement
- **AI Processing**: BAML for item description standardization and metadata extraction
- **Documentation**: Swagger UI with PostgREST OpenAPI auto-generation
- **Deployment**: Docker Compose with nginx reverse proxy

### **Integration Flow**
```
Internet → nginx (80/443) → Single Entry Point
             ↓
   ┌─────────┼─────────┬─────────┐
   ↓         ↓         ↓         ↓
Frontend   Backend    API      Docs
(Astro)    (Hono)  (PostgREST) (Swagger)
SSR Pages   Heavy    Schema     Schema
+ Secure    Business   API      Docs
API Routes  Logic      ↓         ↓
   ↓         ↓    ← → PostgreSQL  ←
Internal  ← External   ↑
Services   Integrations Valkey
           ↓
   Discord + BAML + File Processing
```

### **Routing Blueprint**
- `/` → Astro SSR pages + hydrated Svelte components
- `/api/auth/*` → Astro secure authentication routes (Discord OAuth, sessions)
- `/api/uploads/*` → Astro secure file upload handling with access control
- `/api/internal/*` → Astro internal operations (shop dashboards, user management)
- `/api/data/*` → PostgREST auto-generated database API
- `/api/v1/*` → Hono external integrations (Discord webhooks, BAML processing)
- `/docs` → Swagger UI documentation
- `/uploads/*` → Static file serving with nginx access control

---

## 3. Data Model

### **Core Entities Schema**

#### **Users**
```sql
users (
  id: uuid PRIMARY KEY,
  discord_id: text UNIQUE,
  username: text NOT NULL,
  email: text,
  avatar_url: text,
  shop_name: text,
  role: user_role DEFAULT 'user',
  is_active: boolean DEFAULT true,
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now()
)
```

#### **Items**
```sql
items (
  id: uuid PRIMARY KEY,
  owner_id: uuid REFERENCES users(id),
  name: text NOT NULL,
  description: text,
  processed_description: text, -- BAML standardized
  category: item_category NOT NULL,
  minecraft_id: text,
  enchantments: jsonb, -- BAML extracted enchantment data
  item_attributes: jsonb, -- BAML extracted attributes
  stock_quantity: integer DEFAULT 0 CHECK (stock_quantity >= 0),
  is_available: boolean DEFAULT true,
  server_name: text,
  shop_location: text,
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now()
)
```

#### **Prices**
```sql
prices (
  id: uuid PRIMARY KEY,
  item_id: uuid REFERENCES items(id),
  price_diamonds: decimal(10,2) NOT NULL CHECK (price_diamonds >= 0),
  trading_unit: trading_unit_type NOT NULL DEFAULT 'per_item',
  is_current: boolean DEFAULT true,
  source: text DEFAULT 'owner',
  created_by: uuid REFERENCES users(id),
  created_at: timestamptz DEFAULT now()
)

-- Trading unit types: per_item, per_stack (64), per_shulker (1,728), per_dozen (12)
-- Currency: Stored in diamonds (base unit), display logic converts to diamond blocks for expensive items
```

#### **Community Reports**
```sql
community_reports (
  id: uuid PRIMARY KEY,
  item_id: uuid REFERENCES items(id),
  reporter_id: uuid REFERENCES users(id),
  report_type: report_type NOT NULL,
  description: text NOT NULL,
  status: report_status DEFAULT 'pending',
  confidence_level: confidence_level,
  auto_approved: boolean DEFAULT false,
  reviewed_by: uuid REFERENCES users(id),
  reviewed_at: timestamptz,
  review_notes: text,
  created_at: timestamptz DEFAULT now()
)
```

#### **Evidence**
```sql
evidence (
  id: uuid PRIMARY KEY,
  report_id: uuid REFERENCES community_reports(id),
  evidence_type: evidence_type NOT NULL,
  file_path: text,
  external_url: text,
  description: text,
  timestamp_captured: timestamptz,
  minecraft_server: text,
  coordinates: text,
  verified_by: uuid REFERENCES users(id),
  created_at: timestamptz DEFAULT now()
)
```

---

## 4. Business Rules

### **Currency System**
- **Primary Currency**: Diamonds (stored as decimal)
- **Display Conversion**: Expensive items show in Diamond Blocks (1 Diamond Block = 9 Diamonds)
- **Trading Units**: per_item (default), per_stack (64), per_shulker (1,728), per_dozen (12)
- **Display Logic**: Context-aware human language ("5 diamonds per item", "3 items per diamond", "2.5 diamond blocks per item")
- **Special Cases**: Zero price = "Open to offers", Negative price = "Free"

### **Evidence Confidence Scoring**
- **High Confidence**: Screenshot + transaction record + established reporter (>5 approved reports)
- **Medium Confidence**: Screenshot OR transaction record + any reporter
- **Low Confidence**: Description only OR new reporter (<3 total reports)

### **Auto-Approval Rules**
- **Stock Status Changes**: High confidence "out of stock"/"back in stock" auto-approve
- **Price Changes**: Always require manual review by shop owner
- **Shop Closure**: Always require manual review

---

## 5. User Requirements

### **Epic 1: Price Discovery**
- Search items with <2s response time, human-readable pricing display
- Filter by category/server/price with <500ms response
- Price history showing trends and community-reported changes

### **Epic 2: Community Reporting**
- Submit price/stock reports with screenshot evidence and confidence scoring
- Auto-approval for high-confidence stock status changes
- Shop owner dashboard for reviewing reports with Discord notifications

### **Epic 3: Discord Integration**
- Primary authentication via Discord OAuth with JWT generation
- Real-time webhook notifications for reports (<1 minute delivery)
- Discord profile integration for community recognition

### **Epic 4: Shop Management**
- Item listing with diamond pricing (smart display conversion) and trading unit selection
- Real-time inventory management with immediate search result updates
- Analytics dashboard showing performance metrics

---

## 6. Technical Requirements

### **Performance**
- Search: <2s with 10,000+ items
- API responses: <200ms (95th percentile)
- Filtering: <500ms response time
- File uploads: <5s processing with progress indicators

### **Security**
- **Authentication**: Discord OAuth 2.0 → JWT tokens → PostgreSQL RLS enforcement
- **Authorization**: Row Level Security policies prevent unauthorized data access
- **API Security**: JWT validation for all PostgREST endpoints, parameterized queries prevent SQL injection
- **File Security**: MIME validation, UUID naming, 10MB limits, execution prevention
- **Network Security**: Rate limiting (10 req/s API, 5 req/s uploads), HTTPS enforcement, security headers
- **Session Security**: HTTP-only cookies, secure transmission, 7-day TTL with Valkey storage
- **Input Validation**: All user inputs sanitized at API boundary, Content Security Policy headers

### **Scalability**
- 100+ concurrent users without degradation
- 10,000+ items, 50,000+ reports data volume
- Connection pooling for database access
- Horizontal scaling path with load balancer support

---

## 7. Writing Style Guide

### Strunk & White Principles

**Rule**: Omit needless words. Make every word tell.

#### Function Naming
```typescript
// AVOID: Verbose, redundant naming
validateUserInputAndReturnErrorIfInvalid()
createNewItemRecordInDatabase()
checkIfItemExistsInRepository()

// PREFER: Concise, clear purpose
validate()
create()
exists()
```

#### Variable Naming  
```typescript
// AVOID: Hungarian notation and redundancy
const strUserName = 'john';
const arrItemList = [];
const boolIsValidFlag = true;

// PREFER: Context makes type clear
const userName = 'john';
const items = [];
const isValid = true;
```

#### Comments
```typescript
// AVOID: Comments that reread the code
const count = items.length; // Get the length of the items array
if (count > 0) { // Check if count is greater than zero
  return items[0]; // Return the first item
}

// PREFER: Comments that explain why
const count = items.length;
if (count > 0) {
  return items[0]; // Default to first item for backward compatibility
}
```

#### Test Descriptions
```typescript
// AVOID: Implementation details in test names
it('should call the itemRepository.create method and verify it returns an object with id property', () => {});

// PREFER: Business behavior focus
it('creates items with unique identifiers', () => {});
```

#### Documentation Structure
```markdown
<!-- AVOID: Verbose section headers -->
## Detailed Instructions for How to Set Up Your Local Development Environment Step by Step

<!-- PREFER: Direct, scannable headers -->
## Setup
```

### Core Rules
1. **Use active voice**: "Creates" not "is created by"
2. **Choose strong verbs**: "Validates" not "does validation of"  
3. **Eliminate redundancy**: Never explain what code already shows
4. **Be specific**: "<2s response" not "fast response"
5. **No emojis**: Clear writing communicates intent
6. **No buzzword jargon**: Write for Minecraft traders and normal developers, not consultants

#### **Avoid Consultant Speak**
```typescript
// AVOID: Sounds like consultants trying to sell something
describe('Evolutionary Refactoring with Synergistic Temporal Decoupling Architecture', () => {
  it('leverages best-in-class paradigm shifts for revolutionary optimization', () => {
    // This sounds ridiculous to working developers
  });
});

// PREFER: Plain English that explains what the code does
describe('Discord OAuth Tests', () => {
  it('validates Discord login works', () => {
    // Clear, practical, gets the job done
  });
});
```

#### **Write for Your Audience**
- **Target audience**: Minecraft server owners and working developers
- **Not the audience**: Enterprise consultants, academic researchers, framework evangelists
- **Good test names**: "creates items", "validates prices", "Discord login works"
- **Bad test names**: "synergizes cross-cutting concerns with adaptive paradigms"

---

## 8. Testing Strategy & Code Quality

### **Evolutionary Testing Methodology**

#### **Core Testing Philosophy**
Tests are first-class code: maintainable, readable, DRY. They evolve to meet current pressures while preserving existing behavior.

#### **Temporal Decoupling**
Separate reusable patterns from project-specific assumptions.

**Strunk & White Applied - Concise Code Examples:**

```typescript
// WORDY: Comments explain what code already shows
const CURRENT_PROJECT_EPIC_DEFINITIONS_FOR_MINECRAFT_MARKETPLACE = [
  {
    epicNumber: 1,
    epicName: 'Price Discovery Epic',
    keywordsToValidateInSpecs: ['search', 'filter'],
    // This epic requires specific performance thresholds
    performanceRequirements: ['<2s', '<500ms']
  }
];

// CONCISE: Code speaks, comments add value
const TEMPORAL_EPICS = [
  { number: 1, name: 'Price Discovery', keywords: ['search', 'filter'], performance: ['<2s', '<500ms'] }
];

// WORDY: Verbose method names and redundant validation
class EpicDefinitionValidatorForCurrentProject {
  validateThatEpicDefinitionMatchesSpecificationRequirements(epic) {
    // Check if the epic number exists in the specification
    const hasEpicNumber = this.specs.includes(`epic ${epic.number}`);
    // Check if the epic name exists in the specification  
    const hasEpicName = this.specs.includes(epic.name.toLowerCase());
    // Return true only if both conditions are met
    return hasEpicNumber && hasEpicName;
  }
}

// CONCISE: Clear purpose, minimal code
class EpicValidator {
  validate(epic) {
    return this.specs.includes(`epic ${epic.number}`) && 
           this.specs.includes(epic.name.toLowerCase());
  }
}
```

#### **Test Performance Architecture**

#### **Performance Targets by Test Type**
- **Unit Tests**: <1.5s total execution, <10ms per test (MSW mocking)
- **Integration Tests**: <5s total execution, <500ms per test (test containers)
- **End-to-End Tests**: <30s total execution, <10s per workflow (full stack)
- **Performance Tests**: Validate Epic requirements (<2s search, <500ms filtering)

#### **Mocking Strategy by Test Layer**

**Unit Tests - MSW API Mocking**: Mock external APIs, no real infrastructure
**Integration Tests - Testcontainers**: Docker Compose-based isolated test environments, 26 tests validated  
**E2E Tests - Strategic Mocking**: Mock slow external services, keep core functionality real

#### **Test Patterns (REQUIRED)**

All tests must follow these patterns:

##### **1. Data Factories - Strunk & White Applied**

```typescript
// WORDY: Verbose naming and redundant documentation
const createValidItemDataForTestingWithOptionalOverrides = (optionalOverrides = {}) => {
  // This function returns a valid item object with default values
  // that can be used in tests to avoid duplication
  return {
    ownerId: 'user_123', // Default user ID for testing
    name: 'Diamond Sword', // Default item name
    category: 'weapons', // Default category
    minecraftId: 'diamond_sword', // Minecraft identifier
    stockQuantity: 5, // Default stock amount
    isAvailable: true, // Default availability status
    ...optionalOverrides // Spread any overrides provided
  };
};

// CONCISE: Clear purpose, minimal code
const validItem = (overrides = {}) => ({
  ownerId: 'user_123',
  name: 'Diamond Sword', 
  category: 'weapons',
  stockQuantity: 5,
  ...overrides
});

// USAGE COMPARISON
// WORDY: 
const testItem = createValidItemDataForTestingWithOptionalOverrides({ stockQuantity: 0 });

// CONCISE:
const testItem = validItem({ stockQuantity: 0 });
```

##### **2. Assertion Helpers - Strunk & White Applied**

```typescript
// WORDY: Verbose naming and unnecessary explanations
const expectItemToHaveValidStructureAndMatchExpectedData = (actualItem, expectedData) => {
  // Verify system-generated fields are present
  expect(actualItem.id).toBeDefined(); // ID must exist
  expect(actualItem.createdAt).toBeInstanceOf(Date); // Timestamp must be Date
  
  // Validate each expected field matches actual value
  Object.keys(expectedData).forEach(key => {
    expect(actualItem[key]).toBe(expectedData[key]);
  });
};

// CONCISE: Purpose clear from usage
const expectValidItem = (item, expected) => {
  expect(item.id).toBeDefined();
  expect(item.createdAt).toBeInstanceOf(Date);
  Object.keys(expected).forEach(key => {
    expect(item[key]).toBe(expected[key]);
  });
};
```

##### **3. Performance Utilities - Strunk & White Applied**

```typescript
// WORDY: Over-documented and verbose parameter names
const measurePerformanceOfAsyncOperationAndReturnBothResultAndTiming = async (
  asyncOperationToMeasure, 
  descriptiveTestNameForLogging
) => {
  // Record the start time before executing the operation
  const startTimeInMilliseconds = performance.now();
  
  // Execute the operation and capture its result
  const operationResult = await asyncOperationToMeasure();
  
  // Calculate the elapsed time by subtracting start from current time
  const elapsedTimeInMilliseconds = performance.now() - startTimeInMilliseconds;
  
  // Log the performance measurement for debugging purposes
  console.log(`Performance measurement for ${descriptiveTestNameForLogging}: ${elapsedTimeInMilliseconds.toFixed(2)}ms`);
  
  // Return both the result and timing information
  return { result: operationResult, timeMs: elapsedTimeInMilliseconds };
};

// CONCISE: Function name and usage make purpose clear
const measure = async (operation) => {
  const start = performance.now();
  const result = await operation();
  const timeMs = performance.now() - start;
  return { result, timeMs };
};

// USAGE COMPARISON
// WORDY:
const { result, timeMs } = await measurePerformanceOfAsyncOperationAndReturnBothResultAndTiming(
  () => itemRepository.search('diamond'), 
  'search operation for diamond items'
);

// CONCISE:
const { result, timeMs } = await measure(() => itemRepository.search('diamond'));
expect(timeMs).toBeLessThan(2000); // Epic 1 requirement
```

##### **4. Test Performance Management**

**Principle**: Strict timing requirements enable rapid development feedback with 99%+ speed improvements through strategic mocking.

**Actual Performance Results:**
- **Original slow tests**: 60+ seconds execution time
- **Fast mocked tests**: 237ms execution time  
- **Speed improvement**: 99.6% faster execution
- **Test coverage**: >80% maintained

**Performance Targets by Test Type:**

| Test Type | Total Time | Per Test | Strategy | Infrastructure |
|-----------|------------|----------|----------|----------------|
| **Unit** | <1.5s | <10ms | MSW Mocking | None |
| **Integration** | <5s | <500ms | Docker Compose Testcontainers | PostgreSQL + PostgREST + nginx |
| **E2E** | <30s | <10s/workflow | Strategic Mocking | Full Stack |
| **Performance** | Variable | Variable | Load Testing | Production-like |

**Mocking Strategy Implementation:**

```typescript
// UNIT TESTS: <1.5s total, MSW mocking - 99.6% speed improvement
import { setupServer } from 'msw/node';
const server = setupServer(...postgrestHandlers);

it('validates business logic with temporal decoupling', () => {
  const start = performance.now();
  
  // Multiple validations in single test for efficiency
  const report = validReport();
  const validator = new ReportValidator();
  
  expect(validator.validateStructure(report)).toBe(true);
  expect(validator.validateBusinessRules(report)).toBe(true);
  expect(validator.validateConfidenceLevel(report, trustedHistory())).toBe('high');
  
  const timeMs = performance.now() - start;
  expect(timeMs).toBeLessThan(10); // Extremely fast with no infrastructure
});

// INTEGRATION TESTS: <5s total, real database with containers
it('validates database constraints with real PostgreSQL', async () => {
  const start = performance.now();
  
  const item = await itemRepository.create(validItem({
    name: 'Diamond Sword',
    price_diamonds: 2.5
  }));
  
  const timeMs = performance.now() - start;
  
  expectValidItem(item, { name: 'Diamond Sword' });
  expect(timeMs).toBeLessThan(500); // Real DB acceptable timing
});

// E2E TESTS: <30s total, strategic mocking for external services
it('completes marketplace search meeting Epic 1 requirements', async () => {
  const start = performance.now();
  
  // Mock slow Discord OAuth (saves 2-5s per test)
  await page.route('**/discord/oauth/**', route => {
    route.fulfill({ json: { access_token: 'mock_token' } });
  });
  
  // Keep core search functionality real for validation
  await page.goto('/marketplace');
  await page.fill('[data-testid="search"]', 'diamond sword');
  await page.click('[data-testid="search-button"]');
  await expect(page.locator('[data-testid="results"]')).toBeVisible();
  
  const timeMs = performance.now() - start;
  expect(timeMs).toBeLessThan(2000); // Epic 1 requirement: <2s search
});

// PERFORMANCE TESTS: Validate Epic requirements under load
it('maintains search performance under concurrent load', async () => {
  const concurrent = 10;
  const searches = Array(concurrent).fill(0).map(() => 
    measure(() => searchService.search('diamond sword'))
  );
  
  const results = await Promise.all(searches);
  const avgTime = results.reduce((sum, {timeMs}) => sum + timeMs, 0) / concurrent;
  
  expect(avgTime).toBeLessThan(2000); // Epic 1: <2s search under load
  results.forEach(({result}) => {
    expect(result.length).toBeGreaterThan(0);
  });
});
```

**Before and After Performance Comparison:**

```typescript
// BEFORE: Temporally coupled, infrastructure-dependent tests
describe('Discord Integration - Original', () => {
  beforeAll(async () => {
    // 20+ seconds startup time
    await startPostgreSQL();
    await startPostgREST(); 
    await startRedis();
    await runMigrations();
  });
  
  it('validates OAuth flow', async () => {
    // Real Discord API calls: 5-10s per test
    const response = await fetch('https://discord.com/api...');
    // Flaky network dependencies, slow execution
  });
});

// AFTER: Separated test data from logic, MSW-mocked tests  
describe('Discord Integration - Fast Tests', () => {
  beforeEach(() => {
    // <1ms setup time
    mockHttpClient = createMockClient();
    validator = new DiscordOAuthValidator();
  });
  
  it('validates OAuth patterns work', () => {
    // Reusable: Works with Discord, Google, GitHub, etc.
    const mockAuthUrl = oauthValidator.buildAuthUrl(TEST_CONFIG);
    expect(oauthValidator.validateAuthUrl(mockAuthUrl, config)).toBe(true);
    // <10ms execution, reliable results
  });
});
```

#### **Test Timing Implementation Guide**

##### **Unit Tests - MSW Setup**
```typescript
// tests/unit/setup-unit-tests.ts
import { setupServer } from 'msw/node';
import { postgrestHandlers } from '../mocks/postgrest-handlers';

const server = setupServer(...postgrestHandlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

##### **Integration Tests - Testcontainers**
```typescript
// tests/utils/testcontainers-setup.ts - Docker Compose Approach
import { setupTestcontainers } from './testcontainers-setup';

// Uses existing compose.test.yml infrastructure
export async function setupTestcontainers(): Promise<TestContainerStack> {
  const isRunning = await checkTestInfrastructure();
  
  if (isRunning) {
    // Nix-aligned: reuses existing running services
    return {
      urls: {
        postgres: 'postgresql://test_user:test_password@localhost:5433/marketplace_test',
        postgrest: 'http://localhost:2888/api/data',
        nginx: 'http://localhost:2888'
      }
    };
  } else {
    throw new Error('Start with: docker compose -f compose.test.yml up -d');
  }
}

// Usage: npm run test:compose (full cycle: up → test → down)
// Performance: 26 tests complete in <3.5s with full infrastructure stack
```

##### **E2E Tests - Strategic Mocking**
```typescript
// tests/e2e/discord-auth.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Mock slow Discord OAuth (saves 2-5s per test)
  await page.route('**/discord/oauth/**', route => {
    route.fulfill({ json: { access_token: 'mock_token' } });
  });
  
  // Keep core marketplace functionality real
});
```

#### **Performance Validation**
```typescript
const expectTiming = (timeMs: number, limit: number, operation: string) => {
  expect(timeMs).toBeLessThan(limit);
  if (timeMs > limit * 0.8) {
    console.warn(`${operation} slow: ${timeMs}ms (limit: ${limit}ms)`);
  }
};
```

#### **Advanced Speed Analysis and Automated Fixes**

**Comprehensive Test Speed Monitoring**

The project includes advanced tooling to maintain test performance discipline and prevent speed regression:

```bash
# Speed analysis commands
npm run test:speed           # Comprehensive speed analysis with recommendations
npm run test:fix-slow        # Automatic application of fast testing patterns
npm run test:fast            # Run only optimized fast tests (<1.5s total)

# Testcontainer infrastructure tests
npm run test:integration:containers  # Run testcontainer tests only
npm run test:compose                # Full cycle: up → test → down
```

**Speed Category Classification System**

| Category | Time Limit | Per Test | Detection Criteria | Infrastructure |
|----------|------------|----------|-------------------|----------------|
| **Fast Tests** | <1.5s total | <10ms | MSW mocking, no infrastructure | None |
| **Unit Tests** | <1.5s total | <10ms | Pure logic, mocked dependencies | None |
| **Integration** | <5s total | <500ms | Real services, controlled environment | Containers |
| **E2E Tests** | <30s total | <10s/workflow | Full stack, strategic mocking | Complete |

**Automatic Issue Detection**

The speed analysis automatically identifies:

```typescript
// DETECTED: Unit test using real infrastructure
describe('ItemRepository - SLOW', () => {
  beforeAll(async () => {
    // ❌ Detected: Unit test starting containers
    container = await new PostgreSqlContainer().start();
  });
  
  it('creates items', async () => {
    // ❌ Detected: Real HTTP calls in unit test
    const response = await fetch('http://localhost:3000/api/items');
  });
});

// RECOMMENDED: Fast unit test with MSW
describe('ItemRepository - FAST', () => {
  beforeEach(() => {
    // ✅ MSW mocking for instant responses
    setupFastTests();
  });
  
  it('creates items fast', () => {
    const start = performance.now();
    const item = fastItem({ name: TEST_DATA.itemName });
    const timeMs = performance.now() - start;
    
    expect(item.name).toBe(TEST_DATA.itemName);
    expectFastExecution(timeMs, 5); // ✅ Performance validation
  });
});
```

**Test Classification Issues Detected**

- **Infrastructure in Unit Tests**: Containers, real databases, external APIs
- **Missing Performance Validation**: Tests without timing checks
- **Hardcoded Temporal Data**: Non-configurable test data causing coupling
- **Wrong Speed Category**: Tests in inappropriate speed classifications

**Automatic Fix Patterns Applied**

```typescript
// BEFORE: Slow, hardcoded, no performance validation
it('creates user', async () => {
  const user = await userService.create({
    username: 'testuser',           // ❌ Hardcoded
    discord_id: 'discord_123'       // ❌ Hardcoded
  });
  expect(user.username).toBe('testuser');
  // ❌ No performance validation
});

// AFTER: Fast, configurable, performance validated
const TEST_DATA = {
  username: 'testuser',
  discordId: 'discord_123'
};

it('creates user', () => {
  const start = performance.now();
  
  const user = fastUser({
    username: TEST_DATA.username,    // ✅ Configurable
    discord_id: TEST_DATA.discordId  // ✅ Configurable
  });
  
  const timeMs = performance.now() - start;
  
  expect(user.username).toBe(TEST_DATA.username);
  expectFastExecution(timeMs, 5);    // ✅ Performance validation
});
```

**Speed Analysis Report Output**

```
📊 TEST SPEED ANALYSIS REPORT
================================================================================

🏃 PERFORMANCE SUMMARY
✅ Fast Tests: 75 tests in 304ms (4.1ms avg)
⚠️ Unit Tests: 15 tests in 1.2s (80ms avg) - Above target

🐌 SLOW TESTS DETECTED
❌ CRITICAL - Tests exceeding limits:
   Database Integration Suite: 5.2s (limit: 5.0s)

🏷️ TEST CLASSIFICATION ISSUES
📁 tests/unit/user-service.test.ts (Unit Tests):
   🔴 Unit test uses real infrastructure (should use MSW mocking)
   🔴 Missing performance validation

💡 RECOMMENDATIONS
📈 Current: 75/271 tests are fast (27.7%)
   Target: 70%+ tests should be fast for optimal development experience

⚡ Apply fast testing patterns:
   1. Use MSW mocking instead of real infrastructure
   2. Add performance validation with expectFastExecution()
   3. Convert hardcoded data to configurable factories
   4. Move infrastructure tests to integration category
```

**Development Workflow Integration**

```bash
# Development cycle with speed discipline
npm run test:speed          # Check speed health before starting work
npm run test:fast --watch   # TDD with instant feedback
npm run test:fix-slow       # Apply improvements when issues found
npm run test:speed          # Verify improvements before commit
```

### **Code Quality Standards**
- **SOLID Principles**: Modular, testable architecture with clear separation of concerns
- **Dependency Injection**: Service-oriented design for maintainability and testing
- **Test-Driven Development**: Comprehensive test coverage driving implementation quality
- **DRY Tests**: Use factories, helpers, and utilities to eliminate duplication
- **English-Language Tests**: Test descriptions read like business requirements

#### **Dependency Injection Patterns for Fast Tests**

**Core DI Architecture**: All services use constructor injection with the ServiceContainer for clean dependency management and lightning-fast test isolation.

**99.97% Speed Improvement Example** (20s → 6ms):

```typescript
// BEFORE: Slow integration test with external dependencies
describe('ItemRepository - Integration', () => {
  beforeAll(async () => {
    // 15-20s startup: PostgreSQL + PostgREST + migrations
    await setupDatabase();
    await runMigrations();
    await startPostgREST();
  });
  
  it('should create items', async () => {
    // 2-5s per test due to real database operations
    const item = await itemRepository.create(itemData);
    expect(item.id).toBeDefined();
  });
});

// AFTER: Fast DI-powered unit test with no external dependencies
describe('ItemRepository - DI Fast', () => {
  let container: ServiceContainer;
  let itemRepository: IItemRepository;

  beforeEach(() => {
    // <2ms setup: Pure dependency injection
    container = new ServiceContainer();
    container.register('itemRepository', () => new ItemRepository());
    itemRepository = container.get<IItemRepository>('itemRepository');
  });

  it('should create items with Minecraft data patterns', async () => {
    // <5ms execution: No infrastructure dependencies
    const { result: item, timeMs } = await measure(async () => {
      return itemRepository.create({
        ownerId: 'steve',
        name: 'Diamond Sword',
        minecraftId: 'diamond_sword',
        category: 'weapons',
        stockQuantity: 5,
        isAvailable: true
      });
    });
    
    expect(item.id).toBeDefined();
    expect(item.ownerId).toBe('steve');
    expectFastExecution(timeMs, 5);
  });
});
```

**Service Container Registration Patterns**:

```typescript
// Complete service assembly with dependency injection
beforeEach(() => {
  container = new ServiceContainer();
  
  // Repository layer - data access
  container.register('itemRepository', () => new ItemRepository());
  container.register('priceRepository', () => new PriceRepository());
  
  // Service layer - business logic with injected dependencies
  container.register('itemService', () => new ItemService(
    container.get('itemRepository'),
    container.get('priceRepository')
  ));
  
  // API layer - clean dependency resolution
  container.register('marketplaceController', () => new MarketplaceController(
    container.get('itemService')
  ));
});
```

**Constructor Injection Pattern**:

```typescript
// Service implementation with clean dependency injection
export class ItemService implements IItemService {
  constructor(
    private itemRepository: IItemRepository,
    private priceRepository: IPriceRepository,
    private notificationService: INotificationService
  ) {}

  async createItem(itemData: CreateItemRequest): Promise<Item> {
    // Pure business logic - dependencies injected, easily tested
    const item = await this.itemRepository.create(itemData);
    const pricing = await this.priceRepository.calculatePricing(item);
    await this.notificationService.notifyItemCreated(item);
    return { ...item, pricing };
  }
}
```

**DI Container Performance Validation**:

```typescript
it('should validate DI container resolution performance', () => {
  const iterations = 100;
  
  const { result: avgTime, timeMs } = measureSync(() => {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      container.get<IItemRepository>('itemRepository');
    }
    
    return (performance.now() - start) / iterations;
  });
  
  expect(avgTime).toBeLessThan(0.1); // < 0.1ms per resolution
  expectFastExecution(timeMs, 5);
});
```

**Minecraft Domain Modeling with DI**:

```typescript
// Configurable test data following Minecraft naming conventions
const TEST_DATA = {
  // Minecraft usernames
  mainTrader: 'steve',
  altTrader: 'alex', 
  adminUser: 'notch',
  // Minecraft server names
  primaryServer: 'HermitCraft',
  secondaryServer: 'SMP-Live',
  // Item IDs (format: lowercase with underscores only)
  primaryItemId: 'diamond_sword',
  secondaryItemId: 'iron_pickaxe',
  enchantedItemId: 'enchanted_book'
};

const createItemData = (overrides = {}) => ({
  ownerId: TEST_DATA.mainTrader,
  name: 'Diamond Sword',
  description: 'Sharp diamond sword with Sharpness V',
  category: 'weapons' as ItemCategory,
  minecraftId: TEST_DATA.primaryItemId,
  stockQuantity: 5,
  isAvailable: true,
  serverName: TEST_DATA.primaryServer,
  shopLocation: 'spawn_market',
  ...overrides
});
```

**Performance Benefits Summary**:
- **Setup Time**: 20s → 2ms (99.99% improvement)
- **Test Execution**: 2-5s → 5ms (99.9% improvement) 
- **Total Suite**: 60s → 237ms (99.6% improvement)
- **Development Feedback**: Near-instant TDD cycle
- **Test Isolation**: Pure unit tests with no external dependencies
- **Reliability**: Deterministic results, no flaky network calls

#### **Infrastructure Safety & Hanging Prevention**

**CRITICAL ISSUE RESOLVED**: Prevent infinite Vitest hanging when infrastructure (PostgREST, nginx) is unavailable.

**The Problem**: Original test setup used infinite retry loops waiting for PostgREST, causing:
- High CPU consumption (60-80%)
- Vitest processes stuck for hours
- Developer frustration and confusion
- CI/CD pipeline failures

**The Solution**: Multi-layered safety approach with hard timeouts and graceful fallbacks.

**Hard Timeout Protection**:
```typescript
// 10s hard cutoff prevents infinite hanging
const MAX_INFRASTRUCTURE_WAIT_MS = 10000;
const setupTimeout = setTimeout(() => {
  console.error('❌ INFRASTRUCTURE SETUP TIMEOUT - FORCING EXIT');
  console.error('💡 This prevents Vitest from hanging when infrastructure is not available');
  console.error('🚀 Use `npm run test:fast` for instant MSW-mocked testing');
  process.exit(1); // Force exit to prevent hanging
}, MAX_INFRASTRUCTURE_WAIT_MS);
```

**Smart Infrastructure Detection**:
```typescript
// Quick service check with 2s timeout
async function quickServiceCheck(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 2000);
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    return response.ok;
  } catch {
    return false; // Service unavailable - skip gracefully
  }
}
```

**Test Command Classification with Warnings**:
```json
{
  "scripts": {
    "test": "echo '⚠️  WARNING: Infrastructure-dependent tests' && echo '💡 TIP: Use npm run test:fast' && vitest",
    "test:fast": "vitest --config vitest.fast.config.ts", 
    "test:unit": "echo '⚠️  WARNING: May require infrastructure' && vitest --config vitest.unit.config.ts",
    "test:collaboration": "echo '🐳 WARNING: Starts Docker containers' && vitest run tests/collaboration"
  }
}
```

**Automatic Test Environment Detection**:
```
🔍 Test Environment Detection:
   MSW Mocking: ✅
   nginx: ❌  
   PostgREST: ❌
   Database: ❌
💡 Recommended: npm run test:fast

⚡ For instant testing without infrastructure:
   npm run test:fast    # MSW-mocked tests

🐳 To start infrastructure:
   docker compose up -d
```

**Prevention Rules (MANDATORY)**:
1. **10s Hard Cutoff**: All infrastructure checks timeout with `process.exit(1)`
2. **Clear Command Warnings**: Package.json scripts explain infrastructure requirements
3. **Proper Test Classification**: Infrastructure-dependent tests in `tests/integration/`
4. **Fast Alternative Always Available**: `npm run test:fast` for instant MSW-mocked testing
5. **Graceful Degradation**: Tests skip with helpful messages when infrastructure missing

**Developer Experience Result**:
- **No More Hanging**: Hard timeout prevents infinite loops
- **Clear Guidance**: Developers know exactly which command to use
- **Instant Alternative**: Fast tests always available (131 tests in 462ms)
- **Self-Diagnosing**: Environment detection shows exactly what's missing

### **Testing Requirements & Validation Workflow**
- **Coverage**: Minimum 80% code coverage across unit and integration tests
- **Performance**: All tests complete in <30 seconds for rapid development feedback
- **Reliability**: Tests use deterministic data, isolated database transactions
- **Realistic Data**: Faker generates authentic Minecraft scenarios for edge case discovery
- **Maintainability**: Test refactoring should reduce LOC by 30-50% while maintaining coverage
- **Readability**: Non-technical stakeholders should understand test intent from names alone

### **Collaboration & Quality Gates**
Every development milestone must pass **Ready Repo** collaboration standards before proceeding:

#### **Ready Repo Validation (Required for Collaboration)**
```bash
# 3-Command Setup Test - Must work on any machine
git clone <repo> && cd <project>
docker compose up --build    # Complete stack starts successfully
curl localhost:4321/api/health # Returns {"status": "healthy"}

# Self-Documentation Test
cat README.md                # Clear 3-command setup instructions
ls docs/                     # Architecture and deployment guides exist

# Zero Manual Steps Test  
npm run test:collaboration   # 50 tests validate human-readiness
npm run test:fast           # 284 tests run in <1s without infrastructure
npm run test:compose        # 26 tests validate complete infrastructure
```

**Ready Repo Success Criteria**:
- ✅ New collaborator gets working demo in <5 minutes
- ✅ No "ask me how to set it up" conversations needed
- ✅ Clear error messages guide to exact solutions
- ✅ Tests run identically locally and in CI

#### **Deployment Portability Validation**
```bash
# Must deploy successfully on standard platforms  
docker compose -f compose.demo.yml up  # Demo works with sample data
# Verified on: Railway, Render, Coolify, or any Docker platform
```

#### **Technical Quality Validation**
```bash
# Architecture and performance requirements
npm run test:speed            # Speed analysis passes, no slow tests detected
npm run test:integration      # Database and API integration tests pass
npm run test:performance      # Epic 1 requirements (<2s search, <500ms filter) met
npm run test:coverage         # >80% test coverage maintained
```

#### **Feature Validation (Weeks 2+)**
```bash
# Before any feature is considered "done"
npm run test:speed           # Speed analysis shows no regressions, fast tests pass
npm run test:unit            # All business logic unit tests pass
npm run test:integration     # Database and API integration tests pass  
npm run test:e2e             # Complete user workflows pass via Playwright
npm run test:performance     # Response time requirements met
npm run test:security        # Authentication and authorization work

# Container validation
npm run docker:fresh-install # `docker compose up` works from scratch
npm run docker:smoke-test    # Critical paths work in containerized environment
```

#### **No Manual Verification Allowed**
- **Fresh Install**: Must pass `docker compose up` automation test
- **API Endpoints**: Must pass automated integration tests  
- **User Workflows**: Must pass Playwright E2E tests
- **Performance**: Must pass automated benchmark tests
- **Security**: Must pass automated authentication/authorization tests
- **Test Speed**: Must pass automated speed analysis with no slow test violations

---

## 9. Ready Repo File Structure

### **Human-Friendly Project Organization**

This project implements **Ready Repo** file structure principles for maximum collaboration efficiency:

```
minecraft-marketplace/
├── .devcontainer/
│   └── devcontainer.json           # GitHub Codespace ready
├── .github/
│   └── workflows/test.yml          # CI that works first try
├── nix/
│   ├── flake.nix                   # Reproducible dev environment
│   └── devenv.nix                  # Complete dependency specification
├── frontend/                       # Astro v5 SSR application
│   ├── src/pages/                  # File-based routing
│   ├── src/components/             # Svelte v5 components
│   └── astro.config.mjs            # Zero-config defaults
├── backend/                        # Hono v4 API server
│   ├── src/routes/                 # External integration routes
│   └── src/services/               # Business logic layer
├── shared/                         # Common types and utilities
│   ├── types/service-interfaces.ts # TypeScript contracts
│   └── repositories/               # Data access layer
├── database/
│   ├── migrations/                 # Version-controlled schema changes
│   ├── seeds/                      # Test and demo data
│   └── init.sql                    # Fresh install schema
├── tests/
│   ├── unit/                       # Fast MSW-mocked tests (<1.5s)
│   ├── integration/                # Testcontainer infrastructure tests
│   ├── collaboration/              # Human-readiness validation
│   └── fixtures/                   # Shared test data and configs
├── docs/
│   ├── api/                        # Auto-generated Swagger documentation
│   ├── deployment/                 # Step-by-step deployment guides
│   └── development/                # Architecture decisions and patterns
├── compose.yml                     # Single-command development environment
├── compose.prod.yml                # Production deployment (Coolify ready)
├── compose.test.yml                # Isolated test infrastructure
├── justfile                        # Task runner with clear commands
├── .env.example                    # Complete configuration template
├── CLAUDE.md                       # AI agent development context
└── README.md                       # 3-command setup instructions
```

### **Ready Repo Quality Indicators**

#### **🎯 Onboarding Experience (3 Commands)**
```bash
git clone https://github.com/user/minecraft-marketplace.git
cd minecraft-marketplace
docker compose up --build  # Gets you a working demo with test data
```

#### **🔧 Development Workflow (Single Command)**
```bash
just dev                    # Starts all services with hot reload
just test                   # Runs complete test suite
just deploy                 # Deploys to staging/production
```

#### **🚀 Deployment Story (Import & Deploy)**
- Import `compose.prod.yml` into Coolify
- Set 3 environment variables
- Deploy automatically handles migrations and health checks

#### **📚 Documentation Quality**
- **README.md**: Gets anyone running in 3 commands
- **docs/deployment/**: Step-by-step guides with screenshots
- **CLAUDE.md**: Complete development context for AI agents
- **API Documentation**: Auto-generated Swagger UI at `/docs`

#### **🧪 Testing Confidence (Benchmarked)**
- **Local/CI Parity**: Tests run identically everywhere
- **Fast Feedback**: 284 fast tests in 959ms for rapid development
- **Infrastructure Validation**: 26 testcontainer tests in 3.29s execution time
- **Full Test Cycle**: Complete Docker compose cycle in 11.8s
- **Human Validation**: 50 collaboration tests in 222ms verify "Ready Repo" standards
- **Performance Analysis**: Complete speed analysis in 13.1s with actionable recommendations

---

## 10. CI/CD & Deployment Architecture

### **Deployment Strategy**
- **Repository**: GitHub as primary source control
- **CI/CD**: GitHub Actions for PR validation and automated testing
- **Deployment**: Coolify Cloud direct deployment from git repository
- **Target**: Debian server with Docker Compose orchestration

### **Git-Based Deployment Flow**
```
GitHub Repository → Coolify Cloud → Debian Server
                          ↓
                    Docker Compose Build & Deploy
```

### **GitHub Actions - PR Validation with Speed Analysis**
```yaml
# .github/workflows/test.yml
name: Test Suite with Speed Analysis

on:
  pull_request:
    branches: [main]

jobs:
  speed-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - name: Speed Analysis
        run: npm run test:speed
      - name: Auto-fix slow tests if needed
        run: npm run test:fix-slow
        continue-on-error: true

  test:
    runs-on: ubuntu-latest
    needs: speed-analysis
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - name: Fast Tests (Development Workflow)
        run: npm run test:fast
      - name: Full Test Suite
        run: npm run test:all
      - name: Docker Fresh Install
        run: npm run docker:fresh-install
```

### **Coolify Deployment Configuration**
- **Git Repository**: Direct integration with GitHub repository
- **Docker Compose**: Root-level `compose.yml` for service orchestration
- **Environment Variables**: Managed via Coolify dashboard
- **Domain & SSL**: Automatic HTTPS certificate management
- **Health Checks**: Built-in monitoring and alerting

### **Docker Architecture for Coolify**
```yaml
# compose.yml (root level for Coolify)
services:
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    environment:
      - NODE_ENV=production
    ports:
      - "4321:4321"
    depends_on:
      - postgres
      - valkey
      
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      - NODE_ENV=production
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      
  postgres:
    image: postgres:17-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  valkey:
    image: valkey/valkey:8.1-alpine
    volumes:
      - valkey_data:/data

volumes:
  postgres_data:
  valkey_data:
```

### **Environment Management**
- **Development**: Local Docker Compose
- **Production**: Coolify-managed environment variables
- **Secrets**: Coolify secure environment configuration
- **SSL**: Automatic Let's Encrypt certificates via Coolify

## 10. Deployment Architecture

### **Project Structure Overview**

```
minecraft-marketplace/
├── README.md                           # Fresh install guarantee: `docker compose up`
├── specs/                              # Technical specifications
├── scripts/                            # Development tooling
│   ├── test-speed-analysis.ts          # Comprehensive speed analysis and recommendations
│   └── fix-slow-tests.ts               # Automatic fast testing pattern application
├── infrastructure/                     # Deployment (tech debt avoidance)
│   ├── docker/
│   │   ├── compose.yml                 # Fresh install: `docker compose up`
│   │   ├── compose.demo.yml            # Live demo deployment
│   │   └── nginx.conf                  # Standard reverse proxy
│   ├── database/schema/                # PostgreSQL schema files
│   └── config/environments/            # Environment-specific configs
├── frontend/                           # Astro SSR + Svelte + secure API routes
│   ├── src/
│   │   ├── pages/                      # Astro SSR pages
│   │   ├── components/                 # Svelte components
│   │   ├── pages/api/                  # Astro secure routes
│   │   └── services/                   # Frontend service layer
│   └── tests/                          # Frontend tests
├── backend/                            # Hono external integrations
│   ├── src/
│   │   ├── routes/                     # Hono API routes
│   │   ├── services/                   # Business logic
│   │   └── middleware/                 # Hono middleware
│   └── tests/                          # Backend tests
├── shared/                             # Common types and utilities
├── tests/                              # Comprehensive test suite with speed optimization
│   ├── utils/fast-test-setup.ts        # Universal MSW mocking and data factories
│   ├── unit/*.fast.test.ts             # Optimized fast tests (<10ms per test)
│   ├── integration/                    # Real services with containers (<500ms per test)
│   └── e2e/                            # Full stack workflows (<10s per test)
├── docs/                               # Tech debt avoidance documentation
│   ├── setup/quick-start.md            # Fresh install guide
│   ├── deployment/                     # Deployable by others
│   ├── development/contributing.md     # Clear setup instructions
│   └── demo/                           # Live demo maintenance
├── vitest.fast.config.ts               # Fast test configuration (<100ms total)
├── vitest.unit.config.ts               # Unit test configuration
└── .env.example                        # Fresh install ready template
```

### **Container Configuration**
```yaml
services:
  nginx:          # Reverse proxy (ports 80/443)
  frontend:       # Astro SSR + secure API routes + Svelte components
  backend:        # Hono external integrations + heavy processing
  db:             # PostgreSQL 15
  postgrest:      # Auto-generated REST API
  valkey:         # Session storage
  swagger-ui:     # API documentation
```

### **Integration Workflows**

#### **Authentication Flow**
Discord OAuth (Astro secure route) → JWT generation → PostgREST validation → PostgreSQL RLS enforcement

#### **File Upload Flow**
User upload → Astro secure validation → UUID storage → Evidence record creation → Access-controlled serving

#### **BAML Processing Flow**
Item submission → Astro internal API → Hono BAML processing → Metadata extraction → PostgreSQL storage

#### **Notification Flow**
Report creation → PostgreSQL trigger → Hono webhook listener → Discord API delivery

#### **Service Separation**
- **Astro SSR**: Secure operations, authentication, file handling, user-facing pages
- **Hono Backend**: External integrations, heavy processing, webhook handling
- **PostgREST**: Direct database access with RLS enforcement

---

## 11. Implementation Approach

### **Development Methodology**
- **Foundation-First**: Build architectural contracts before implementations to prevent spaghetti code
- **Greenfield Implementation**: Clean architecture using existing codebase as reference only
- **Quality-Driven**: SOLID principles, dependency injection, and TDD methodology from Week 1
- **Checkpoint Validation**: Architecture gates at each phase prevent building on unstable foundation

### **Implementation Sequence**
1. **Week 1**: Architectural Foundation (Contracts → DI Container → Database Schema)
2. **Week 2**: Data Layer Foundation (Repositories → Services → Service Assembly)  
3. **Week 3**: API Layer Foundation (PostgREST → Astro Secure Routes → Hono External)
4. **Week 4-6**: Feature Implementation (Authentication → Core Features → Integrations)
5. **Week 7-8**: Production Ready (Testing → Security → Deployment)

### **Technical Evolution**
- **Database**: SQLite → PostgreSQL with Row Level Security and schema-driven PostgREST
- **Architecture**: Monolithic routes → Service-oriented Astro SSR + Hono backend with dependency injection
- **Security**: Basic auth → Discord OAuth + JWT + database-enforced permissions
- **Quality**: Manual testing → Comprehensive Vitest + Faker + Playwright with >80% coverage

> **📋 Detailed Implementation Plan**: [`GAMEPLAN.md`](../GAMEPLAN.md) - Foundation-first order of attack with daily tasks and architecture checkpoints  
> **🏗️ Project Structure**: [`specs/PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) - Complete greenfield file tree organization

---

## 12. Quality Gates

### **Definition of Done (Collaboration-Ready)**
- **Fresh Install**: `docker compose up` works on any machine with Docker - no configuration required
- **Tests Pass**: All tests run and pass immediately after clone (>80% coverage)
- **Deployable**: Works on standard cloud platforms (Railway, Render, Coolify) by anyone
- **Performance**: Epic requirements met (<2s search, <500ms filtering, <200ms API)
- **Self-Contained**: No custom setup or constant technical support needed
- **Working Demo**: Live deployment available for stakeholder testing

### **Collaboration Standards**
- **Equal Participation**: All contributors handle testing, documentation, deployment
- **Standard Technologies**: PostgreSQL, Docker, HTTP - no special frameworks to learn
- **Self-Service Documentation**: Contributors work independently without asking "how do I..."
- **Clear Deliverables**: Each Epic has specific acceptance criteria and deadlines
- **No Debugging Required**: Setup works, code works, deployment works

### **Collaboration Validation System**
The project includes automated validation that ensures "Make it work for others before asking others to work on it":

#### **Validation Commands**
- **`just validate-collaboration`**: Comprehensive validation of all 10 collaboration requirements + Definition of Done (50 tests, <1s execution)
- **`just fresh-install`**: Simulates new collaborator experience end-to-end (7s complete setup validation)
- **`just demo`**: Validates 30-minute stakeholder demo readiness (5s environment preparation)

#### **Ten Requirements for Technical Collaboration (Validated)**
1. ✅ **Fresh machine setup** without custom configuration (GitHub Codespaces, Nix environment, uncommon ports)
2. ✅ **Working demo others can access** (deployment config, realistic data, documented access points)
3. ✅ **Documentation enables contribution** (specific steps, architecture decisions, quick start <10min)
4. ✅ **Deployable by non-builder** (standard Docker images, externalized config, platform compatibility)
5. ✅ **Tested handoff process** (development baton docs, automated validation, setup verification)
6. ✅ **Clear deliverables and deadlines** (well-defined epics, measurable criteria, status tracking)
7. ✅ **Working code without debugging** (single command startup, health checks, error guidance)
8. ✅ **Equal distribution of boring work** (accessible testing, documentation opportunities, shared deployment)
9. ✅ **Self-contained projects** (comprehensive docs, standard technologies, actionable errors)
10. ✅ **Processes serve team goals** (collaborative workflow, parallel development, team velocity focus)

#### **Definition of Done Validation**
- **Core Requirements**: Fresh install, development experience, production deployment readiness
- **Documentation Standards**: 10-minute contribution enablement, API/schema documentation
- **Demo Requirements**: Accessible demo, stack integration showcase
- **Collaboration Readiness**: Multi-developer support, quality gates, clear error messages
- **Quality Gates**: Performance standards (<30s service start, <2min tests, <5min builds), configuration externalization
- **Ultimate Test**: 30-minute stakeholder demo capability validated

### **Business Goals & Success Metrics (3 months)**
- **User Adoption**: 50+ monthly active users, 5+ active shops
- **System Quality**: 90% search accuracy, 80% reports include evidence
- **Performance**: <1% error rate, <48h shop owner response time
- **Business Impact**: 60% price staleness reduction, 25% marketplace activity increase

---

*This specification provides the complete technical blueprint for implementing a Discord-native Minecraft marketplace with community oversight, evidence-based reporting, and AI-enhanced item processing. The architecture emphasizes single-container deployment simplicity while maintaining production-grade security, performance, and scalability.*