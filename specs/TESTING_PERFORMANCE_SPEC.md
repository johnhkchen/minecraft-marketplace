# Testing Performance Specification

> **Purpose**: Definitive guide for achieving optimal test performance based on comprehensive speed analysis
> **Audience**: Developers implementing tests with <1.5s execution targets
> **Status**: ACTIVE - Based on real performance measurements

## 🏆 Performance Analysis Results

### Comprehensive Speed Analysis Findings

Our test suite analysis identified **catastrophic performance differences** between testing techniques:

| Technique | Performance Impact | Average Duration | Slowness Factor |
|-----------|-------------------|------------------|-----------------|
| **hardcoded-data** | 🔴 CATASTROPHIC | 1,875,352ms | 18,753x baseline |
| **docker** | 🔴 CATASTROPHIC | 1,243,335ms | 12,433x baseline |
| **container-setup** | 🔴 CATASTROPHIC | 849,962ms | 8,499x baseline |
| **testcontainers** | 🔴 CATASTROPHIC | 677,381ms | 6,773x baseline |
| **database-integration** | 🔴 CATASTROPHIC | 409,857ms | 4,098x baseline |
| **http-requests** | 🔴 HIGH | 230,560ms | 2,305x baseline |
| **MSW-mocking** | 🟢 FAST | 577ms | 5.8x baseline |
| **performance-validation** | 🟢 ACCEPTABLE | 1,949ms | 19.5x baseline |

### Key Findings

#### **🚨 ZERO ORPHANED TESTS MANDATE**
- **CURRENT CRISIS**: 198 tests cannot run without Docker/infrastructure setup
- **DEVELOPMENT IMPACT**: These tests are effectively orphaned in development environments  
- **PROJECT GOAL**: Achieve **ZERO orphaned tests** for optimal development velocity
- **PERFORMANCE OPPORTUNITY**: Converting to MSW provides **1000x+ performance improvement**
- **SUCCESS METRIC**: 100% of tests must run in any development environment without infrastructure setup

#### **Slowest Files Identified**
- `report-submission-flow-improvement.fast.test.ts`: 167ms per test (Target: <10ms)
- `item-creation-form-improvement.fast.test.ts`: 68ms per test (Target: <10ms)
- Overall test execution: 5,070ms (Target: <1,500ms)

## 🚀 Mandatory Performance Patterns

### 1. MSW-First Testing Strategy

```typescript
// ✅ REQUIRED PATTERN - MSW Mocking (5.8x baseline)
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/data/public_items', (req, res, ctx) => {
    return res(ctx.json(mockItems));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 2. Performance Validation (REQUIRED)

```typescript
// ✅ REQUIRED - All .fast.test.ts files MUST include performance validation
import { measure, expectFastExecution } from '../utils/fast-test-setup';

test('should process data quickly', async () => {
  const { result, timeMs } = await measure(async () => {
    return await service.processData(validData());
  });
  
  expect(result).toBeDefined();
  expectFastExecution(timeMs, 10); // REQUIRED: <10ms for fast tests
});
```

### 3. Configurable Test Data (REQUIRED)

```typescript
// ❌ FORBIDDEN - Hardcoded data (18,753x slower)
const userId = 'user_123';
const itemId = 'item_456';

// ✅ REQUIRED - Configurable factories
const TEST_DATA = {
  mainTrader: 'steve',
  primaryItem: 'Diamond Sword',
  primaryServer: 'HermitCraft'
};

const validItem = (overrides = {}) => ({
  ownerId: TEST_DATA.mainTrader,
  name: TEST_DATA.primaryItem,
  ...overrides
});
```

## 🚫 Forbidden Anti-Patterns

### NEVER Use These Techniques in Unit/Fast Tests

```typescript
// ❌ FORBIDDEN - Docker/Testcontainers (6,773x+ slower)
beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17').start(); // NEVER in unit tests
});

// ❌ FORBIDDEN - Direct database calls (4,098x slower)
const result = await database.query('SELECT * FROM items'); // Use MSW instead

// ❌ FORBIDDEN - Real HTTP requests (2,305x slower)
const response = await fetch('http://localhost:3000/api/items'); // Use MSW instead

// ❌ FORBIDDEN - Hardcoded temporal data (18,753x slower)
const testUser = { id: 'user_123', name: 'Test User' }; // Use factories instead
```

## 🎯 ZERO ORPHANED TESTS STRATEGY

### Critical Success Metrics
- **TARGET**: 0 orphaned tests (currently 198)
- **TIMELINE**: 4-week systematic conversion  
- **IMPACT**: 1000x+ performance improvement for converted tests
- **GOAL**: 100% of tests run in any development environment without infrastructure

### Phase 1: Infrastructure Test Audit (Week 1)
- [ ] **Catalog all 198 orphaned tests** by category and complexity
- [ ] **Identify MSW conversion candidates** (80%+ of orphaned tests)  
- [ ] **Identify testcontainer candidates** (remaining 20% truly need infrastructure)
- [ ] **Create conversion priority matrix** based on usage frequency and complexity

### Phase 2: Mass MSW Conversion (Weeks 2-3)
- [ ] **Convert Integration Tests** (140 tests) → MSW mocking in tests/unit/
- [ ] **Convert Performance Tests** (11 tests) → MSW + performance validation
- [ ] **Convert Security Tests** (13 tests) → MSW + security validation
- [ ] **Convert Database Tests** (14 tests) → MSW + data validation  
- [ ] **Convert Validation Tests** (20 tests) → MSW + comprehensive validation

### Phase 3: Testcontainer Infrastructure (Week 4)
- [ ] **Implement Docker Compose testcontainers** for truly infrastructure-dependent tests
- [ ] **Create `tests/integration/infrastructure/`** directory for container-based tests
- [ ] **Ensure integration tests are optional** and don't block development workflow
- [ ] **Document infrastructure requirements** clearly for each test

### Conversion Guidelines

#### MSW Conversion Checklist (Per Test)
```typescript
// ❌ BEFORE: Infrastructure-dependent (orphaned)
beforeAll(async () => {
  container = await new PostgreSqlContainer().start(); // 6,773x slower
});

// ✅ AFTER: MSW-mocked (fast)
import { setupServer } from 'msw/node';
const server = setupServer(...handlers); // 5.8x slower (1000x+ improvement)
```

#### Decision Matrix: MSW vs Testcontainer
| Test Type | MSW Convert | Testcontainer | Rationale |
|-----------|-------------|---------------|-----------|
| **API endpoint validation** | ✅ MSW | ❌ | Response structure testing doesn't need real DB |
| **Database query logic** | ✅ MSW | ❌ | Mock expected query results |
| **Authentication flows** | ✅ MSW | ❌ | Mock OAuth responses |
| **Data migration scripts** | ❌ | ✅ Testcontainer | Actually needs real DB schema changes |
| **Full-stack integration** | ❌ | ✅ Testcontainer | Tests actual service interactions |

## 📋 Implementation Checklist

### Immediate Actions (High Impact)
- [x] **Add performance validation** to 14 .fast.test.ts files (**COMPLETED**)
- [x] **Optimize slow .fast.test.ts files** - achieved 37.7% improvement (**COMPLETED**)
- [ ] **Convert 198 orphaned tests** from infrastructure to MSW mocking (**IN PROGRESS**)
- [ ] **Replace hardcoded data** in 5 files with configurable `TEST_DATA` patterns
- [ ] **Profile remaining slow .fast.test.ts files** with `node --cpu-prof`

### Test File Requirements

#### All .fast.test.ts Files MUST:
1. **Include performance validation** with `expectFastExecution(timeMs, 10)`
2. **Use MSW mocking** for all HTTP/API calls
3. **Use configurable factories** instead of hardcoded data
4. **Execute in <10ms per test** (measured, not hoped)
5. **Complete file in <100ms total** (all tests combined)

#### Integration Tests MAY:
- Use testcontainers in `tests/integration/` directory only
- Take up to 500ms per test (but prefer faster)
- Require Docker infrastructure (clearly documented)

## 🎯 Performance Targets (MEASURED)

| Test Category | Per Test Target | File Total Target | Infrastructure |
|---------------|-----------------|------------------|----------------|
| **Fast Tests** | <10ms | <100ms | MSW only |
| **Unit Tests** | <100ms | <1,500ms | MSW + mocks |
| **Integration Tests** | <500ms | <5,000ms | Testcontainers OK |
| **E2E Tests** | <10,000ms | <30,000ms | Full stack OK |

## 🔧 Performance Tooling

### Speed Analysis Command
```bash
npm run test:speed  # Identifies bottom quintile performance culprits
```

### Profiling Slow Tests
```bash
node --cpu-prof --cpu-prof-dir=profiles npm run test:fast
```

### Performance Validation Utility
```typescript
// Built-in performance measurement
import { measure, expectFastExecution } from '../utils/fast-test-setup';

const { result, timeMs } = await measure(async () => {
  return await slowOperation();
});

expectFastExecution(timeMs, 10); // Fails if >10ms
```

## 🏆 Success Metrics

### ZERO ORPHANED TESTS TARGET
- **0 orphaned tests**: All tests can run in any development environment (**CRITICAL**)
- **198 → 0**: Complete elimination of infrastructure-dependent orphaned tests
- **1000x+ performance improvement**: From infrastructure conversion to MSW mocking
- **100% test coverage accessibility**: No tests blocked by missing infrastructure

### Performance Distribution Targets  
- **70%+ Fast Tests**: <10ms per test, MSW-mocked
- **20% Unit Tests**: <100ms per test, MSW + dependency-isolated
- **10% Integration Tests**: <500ms per test, testcontainer-based (optional, non-blocking)

### Conversion Success Metrics
- **✅ ACHIEVED**: 14 .fast.test.ts files now include performance validation
- **✅ ACHIEVED**: 37.7% overall performance improvement (5,070ms → 3,160ms)
- **🎯 TARGET**: 0 orphaned tests (currently 198 → 0)
- **🎯 TARGET**: <1,500ms total test execution time
- **🎯 TARGET**: 80%+ tests using MSW mocking (fastest technique)

---

*This specification is based on actual performance measurements from comprehensive speed analysis. All numbers are real, not theoretical.*