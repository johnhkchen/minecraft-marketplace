# 🏃‍♂️ **Minecraft Marketplace Development Baton**

## **Current Status & Context**

You're continuing work on a **Discord-native Minecraft marketplace** with evidence-based community reporting. The project uses **foundation-first architecture** to prevent technical debt through **dependency injection**, **MSW mocking**, and **comprehensive testing**.

### **🎯 Current Achievement Status**
- **Fast Test Coverage**: 131 tests in 1086ms (45.6% of 287 total tests)
- **Target**: 70%+ fast test coverage for optimal development experience
- **Infrastructure Safety**: Fixed Vitest hanging issue with 10s hard cutoffs
- **DI Patterns**: Comprehensive dependency injection achieving 99.97% speed improvements

### **📋 Immediate Priorities**
1. **Continue converting slow tests to fast MSW-mocked tests** (reach 70%+ target)
2. **Apply DI patterns to remaining slow tests** for speed improvements
3. **Maintain architectural quality** while increasing test coverage

---

## **🧠 Key Technical Context**

### **Technology Stack**
- **Frontend**: Astro v5.x SSR + Svelte components + secure API routes
- **Backend**: Hono framework for external integrations  
- **Database**: PostgreSQL 15+ with PostgREST auto-generated API
- **Testing**: Vitest + MSW + DI patterns + Minecraft domain modeling
- **Cache**: Valkey (Redis-compatible) session storage

### **Architecture Principles**
- **Foundation-First**: DI container → Services → API routes
- **No Infrastructure Dependencies**: Fast tests use MSW mocking
- **Minecraft Domain Modeling**: Use steve/alex/notch usernames, realistic item IDs
- **99%+ Speed Improvements**: Real HTTP calls → MSW instant responses

---

## **🚀 Successful Patterns to Continue**

### **Fast Test Conversion Pattern**
```typescript
// BEFORE: Slow integration test (20+ seconds)
describe('API Integration - Slow', () => {
  beforeAll(async () => {
    await setupDatabase(); // 15-20s startup
    await startPostgREST();
  });
  
  it('should fetch data', async () => {
    const response = await fetch('http://localhost:2888/api/data/items');
    // 2-5s per test
  });
});

// AFTER: Fast MSW-mocked test (<10ms)
import { setupFastTests, measure, expectFastExecution } from '../utils/fast-test-setup';
setupFastTests();

describe('API Logic - Fast', () => {
  it('should handle item fetching with performance validation', async () => {
    const { result, timeMs } = await measure(async () => {
      return apiService.fetchItems(); // MSW intercepts, instant response
    });
    
    expectFastExecution(timeMs, 10); // Must complete in <10ms
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].seller_name).toBe('steve'); // Minecraft naming
  });
});
```

### **DI-Powered Test Pattern**
```typescript
// 99.97% speed improvement (20s → 6ms)
describe('ItemRepository - DI Fast', () => {
  let container: ServiceContainer;
  
  beforeEach(() => {
    container = new ServiceContainer();
    container.register('itemRepository', () => new ItemRepository());
  });
  
  it('should create items with no external dependencies', async () => {
    const repository = container.get<IItemRepository>('itemRepository');
    const { result, timeMs } = await measure(() => 
      repository.create({
        ownerId: 'steve',
        name: 'Diamond Sword',
        minecraftId: 'diamond_sword'
      })
    );
    
    expectFastExecution(timeMs, 5);
    expect(result.ownerId).toBe('steve');
  });
});
```

---

## **⚠️ Critical Infrastructure Safety Rules**

### **NEVER Allow Hanging Tests**
- **Always use MSW mocking** for HTTP calls in unit tests
- **10s hard timeout** for any infrastructure checks
- **Move real infrastructure tests** to `tests/integration/`
- **Provide clear warnings** in package.json scripts

### **Test Command Classification**
```json
{
  "test:fast": "vitest --config vitest.fast.config.ts",          // ✅ Always safe
  "test": "echo '⚠️ WARNING: Infrastructure-dependent' && vitest", // ⚠️ Needs PostgREST
  "test:collaboration": "echo '🐳 WARNING: Docker' && vitest"      // 🐳 Heavy containers
}
```

---

## **📁 Current File Organization**

### **Fast Tests (Continue Pattern)**
- `tests/unit/**/*.fast.test.ts` - MSW mocked, <10ms per test
- `tests/unit/repositories/item-repository.di.fast.test.ts` - DI examples
- `tests/unit/server-location-filtering.fast.test.ts` - Epic 1 coverage

### **Utilities (Already Built)**
- `tests/utils/fast-test-setup.ts` - MSW handlers + performance validation
- `tests/utils/test-environment.ts` - Infrastructure detection + hanging prevention
- `shared/di/container.ts` - Full-featured DI container

### **Integration Tests (Infrastructure-Dependent)**
- `tests/integration/database-schema.test.ts` - Moved from unit tests
- `tests/integration/postgrest-integration.test.ts` - Real PostgREST calls

---

## **🎯 Next Actions to Continue**

### **1. Identify Remaining Slow Tests**
```bash
npm run test:speed  # Shows which tests need conversion
```

### **2. Convert Pattern**
1. **Find slow test** consuming >100ms per test
2. **Create `.fast.test.ts` version** with MSW mocking
3. **Add DI patterns** if testing services/repositories
4. **Use Minecraft naming** (steve, alex, notch, diamond_sword, etc.)
5. **Add performance validation** with `expectFastExecution()`
6. **Remove or move original** slow test file

### **3. Maintain Quality Standards**
- **>80% test coverage** across all converted tests
- **Minecraft domain modeling** for realistic test scenarios
- **Performance monitoring** built into every test
- **Clear test descriptions** readable by non-technical stakeholders

---

## **🏆 Success Metrics**

### **Speed Targets**
- **Fast Tests**: 70%+ of total suite (currently 45.6%)
- **Per Test**: <10ms average for fast tests
- **Total Suite**: Fast tests complete in <2 seconds

### **Quality Targets**  
- **No hanging tests**: All infrastructure checks timeout safely
- **Clear guidance**: Developers know which command to use  
- **Maintainable**: DI patterns reduce test setup duplication

---

## **📚 Key Documentation**

- **CLAUDE.md**: Complete development context + infrastructure safety rules
- **specs/MINECRAFT_MARKETPLACE_SPEC.md**: Technical requirements + DI patterns
- **specs/PROJECT_STRUCTURE.md**: File organization + testing architecture

### **Test Philosophy**
> "Tests are first-class code: maintainable, readable, DRY. They evolve to meet current pressures while preserving existing behavior through foundation-first architecture and comprehensive automated validation."

---

**Current Progress**: 45.6% → **Target**: 70%+ fast test coverage
**Command to Continue**: `npm run test:speed` → identify slow tests → convert to fast MSW/DI patterns

Ready to continue the foundation-first approach with excellent test performance! 🚀