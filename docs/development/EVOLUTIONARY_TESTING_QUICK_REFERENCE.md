# Evolutionary Testing Quick Reference

> **Official Spec**: [MINECRAFT_MARKETPLACE_SPEC.md - Section 7](../../specs/MINECRAFT_MARKETPLACE_SPEC.md#7-testing-strategy--code-quality)

## 🚀 Quick Start

### Before (Traditional Testing)
```typescript
// ❌ Repetitive, hard to maintain
it('should create item', async () => {
  const itemData = {
    ownerId: 'user_123',
    name: 'Diamond Sword',
    category: 'weapons',
    minecraftId: 'diamond_sword',
    stockQuantity: 5,
    isAvailable: true
  };
  
  try {
    await itemRepository.create({ ownerId: '' });
    expect.fail('Should have thrown');
  } catch (error) {
    expect(error.name).toBe('ItemValidationError');
    expect(error.code).toBe('INVALID_OWNER_ID');
  }
});
```

### After (Evolutionary Testing)
```typescript
// ✅ Maintainable, readable, DRY
const createValidItemData = (overrides = {}) => ({
  ownerId: 'user_123',
  name: 'Diamond Sword',
  category: 'weapons',
  minecraftId: 'diamond_sword',
  stockQuantity: 5,
  isAvailable: true,
  ...overrides
});

const expectValidationError = async (operation, code, message) => {
  try {
    await operation();
    expect.fail('Should have thrown validation error');
  } catch (error) {
    expect(error.code).toBe(code);
    expect(error.message).toContain(message);
  }
};

it('rejects items with missing owner to prevent orphaned data', async () => {
  await expectValidationError(
    () => itemRepository.create(createValidItemData({ ownerId: '' })),
    'INVALID_OWNER_ID',
    'Owner ID is required'
  );
});
```

## 📋 Required Patterns

### 1. Test Data Factories
```typescript
// Create factory functions for all test data
const createValidItemData = (overrides = {}) => ({ /* base data */, ...overrides });
const createValidUserData = (overrides = {}) => ({ /* base data */, ...overrides });

// Usage
const validItem = createValidItemData();
const invalidItem = createValidItemData({ ownerId: '' });
```

### 2. Assertion Helpers
```typescript
// Create domain-specific helpers
const expectValidItem = (item, expectedData) => {
  expect(item.id).toBeDefined();
  expect(item.createdAt).toBeInstanceOf(Date);
  // Validate all provided fields
};

const expectValidationError = async (operation, code, message) => {
  // Standardized error testing
};
```

### 3. Performance Utilities
```typescript
const measurePerformance = async (operation, testName) => {
  const startTime = performance.now();
  const result = await operation();
  const timeMs = performance.now() - startTime;
  console.log(`⏱️  ${testName}: ${timeMs.toFixed(2)}ms`);
  return { result, timeMs };
};

const expectEpic1Performance = (timeMs, requirement) => {
  const limits = { search: 2000, filter: 500, api: 200 };
  expect(timeMs).toBeLessThan(limits[requirement]);
};
```

### 4. English-Language Descriptions
```typescript
// ❌ Technical implementation details
it('should create item with ID and timestamps', () => {});

// ✅ Business value and context
it('creates items with proper structure for marketplace display', () => {});
it('rejects items with missing owner to prevent orphaned data', () => {});
it('supports shop owner inventory management workflow', () => {});
```

## 🎯 Migration Checklist

When refactoring existing tests:

- [ ] **Extract test data** into factory functions with overrides
- [ ] **Create assertion helpers** for common validation patterns  
- [ ] **Add performance measurement** for Epic 1 requirements
- [ ] **Rename tests** to describe business value, not implementation
- [ ] **Group tests** by business scenario, not technical method
- [ ] **Measure improvement**: Document LOC reduction and maintainability gains

## 📊 Success Metrics

### Quantitative Goals
- **30-50% reduction** in lines of code
- **80% elimination** of boilerplate/duplication
- **<2s search, <500ms filter, <200ms API** performance validation
- **>80% test coverage** maintained

### Qualitative Goals
- **Non-technical stakeholders** can understand test intent from names
- **Single point of change** for test data modifications
- **Business scenarios** clearly mapped to test coverage
- **Performance requirements** directly validated

## ⚡ Example Files

### Reference Implementations
- [`tests/unit/repositories/item-repository.evolved.test.ts`](../../tests/unit/repositories/item-repository.evolved.test.ts) - Complete evolved repository tests
- [`tests/performance/search-performance.evolved.test.ts`](../../tests/performance/search-performance.evolved.test.ts) - Sophisticated performance testing

### Before/After Comparison
- **Original**: `item-repository.test.ts` (434 lines, repetitive patterns)
- **Evolved**: `item-repository.evolved.test.ts` (250 lines, maintainable patterns)
- **Improvement**: 42% code reduction, 80% less boilerplate

---

## 🔗 Related Documentation

- **Official Specification**: [MINECRAFT_MARKETPLACE_SPEC.md](../../specs/MINECRAFT_MARKETPLACE_SPEC.md#7-testing-strategy--code-quality)
- **Implementation Guide**: [PROJECT_DEVELOPMENT_GUIDE.md](../../PROJECT_DEVELOPMENT_GUIDE.md#evolutionary-testing-methodology)
- **Working Examples**: [`tests/unit/repositories/`](../../tests/unit/repositories/) and [`tests/performance/`](../../tests/performance/)

---

*This testing methodology is now part of the official project specification and must be followed for all new tests and test refactoring.*