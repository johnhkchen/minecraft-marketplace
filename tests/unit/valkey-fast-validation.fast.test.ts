/**
 * Fast Valkey Validation Tests
 * Quick smoke tests that run in <100ms total to validate Valkey integration
 * These tests run with every `npm run test` for immediate issue detection
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { setupFastTests, expectFastExecution } from '../utils/fast-test-setup.js';
import { ValkeyCacheService, createValkeyService, getValkeyService } from '../../workspaces/shared/services/valkey-cache.js';
import { getMockValkeyService, resetMockValkey } from '../mocks/valkey-mock.js';
import { ValkeyQueryCache } from '../../workspaces/frontend/src/lib/enhanced-homepage-data.js';

// Setup fast tests with MSW mocking
setupFastTests();

describe('Valkey Fast Validation Tests', () => {
  
  beforeEach(() => {
    resetMockValkey();
  });

  describe('🚀 Smoke Tests (Critical Path)', () => {
    test('Valkey service creation works', async () => {
      const start = performance.now();
      
      const service = createValkeyService();
      expect(service).toBeInstanceOf(ValkeyCacheService);
      
      const globalService = getValkeyService();
      expect(globalService).toBeDefined();
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('Mock service basic operations work', async () => {
      const start = performance.now();
      
      const mockService = getMockValkeyService();
      await mockService.connect();
      
      await mockService.set('smoke:test', { works: true });
      const result = await mockService.get('smoke:test');
      
      expect(result.works).toBe(true);
      await mockService.disconnect();
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });

    test('QueryCache initialization works', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      expect(cache).toBeDefined();
      
      await cache.set('query:smoke', { initialized: true });
      const result = await cache.get('query:smoke');
      
      expect(result.initialized).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });

    test('Cache key generation is consistent', async () => {
      const start = performance.now();
      
      const key1 = ValkeyCacheService.generateKey('test', { a: 1, b: 2 });
      const key2 = ValkeyCacheService.generateKey('test', { b: 2, a: 1 });
      const key3 = ValkeyCacheService.generateKey('test', { a: 1, b: 3 });
      
      expect(key1).toBe(key2); // Same params = same key
      expect(key1).not.toBe(key3); // Different params = different key
      expect(key1).toMatch(/^test:/);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('⚡ Performance Validation', () => {
    test('Single cache operations are fast', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      
      // Test single set operation
      const setStart = performance.now();
      await cache.set('perf:single', { fast: true });
      const setTime = performance.now() - setStart;
      
      // Test single get operation  
      const getStart = performance.now();
      const result = await cache.get('perf:single');
      const getTime = performance.now() - getStart;
      
      expect(result.fast).toBe(true);
      expect(setTime).toBeLessThan(10); // <10ms for set
      expect(getTime).toBeLessThan(5);  // <5ms for get
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 20);
    });

    test('Bulk operations scale correctly', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      const operations = [];
      
      for (let i = 0; i < 20; i++) {
        operations.push(cache.set(`bulk:${i}`, { index: i }));
      }
      
      await Promise.all(operations);
      
      // Verify all were set correctly
      const results = [];
      for (let i = 0; i < 20; i++) {
        results.push(cache.get(`bulk:${i}`));
      }
      
      const allResults = await Promise.all(results);
      allResults.forEach((result, index) => {
        expect(result.index).toBe(index);
      });
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 50); // 40 operations in <50ms
    });

    test('TTL expiration works correctly', async () => {
      const start = performance.now();
      
      const mockService = getMockValkeyService();
      await mockService.connect();
      
      // Set with short TTL
      await mockService.set('ttl:fast', 'expires', 50); // 50ms
      
      // Should exist immediately
      const immediate = await mockService.get('ttl:fast');
      expect(immediate).toBe('expires');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 80));
      
      // Should be expired
      const expired = await mockService.get('ttl:fast');
      expect(expired).toBeNull();
      
      await mockService.disconnect();
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 150); // Allow time for TTL test
    });
  });

  describe('🛡️ Error Handling Validation', () => {
    test('Graceful degradation on cache miss', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      
      // Non-existent key should return null, not throw
      const result = await cache.get('nonexistent:key');
      expect(result).toBeNull();
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('Handles invalid data types', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      const testCases = [null, undefined, '', 0, false, [], {}];
      
      for (let i = 0; i < testCases.length; i++) {
        const key = `invalid:${i}`;
        const data = testCases[i];
        
        await cache.set(key, data);
        const result = await cache.get(key);
        expect(result).toEqual(data);
      }
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 20);
    });

    test('Mock service behaves like real service', async () => {
      const start = performance.now();
      
      const mockService = getMockValkeyService();
      await mockService.connect();
      
      // Test ping
      const pingResult = await mockService.ping();
      expect(pingResult).toBe(true);
      
      // Test info
      const info = await mockService.info();
      expect(info.connected).toBe(true);
      expect(typeof info.keyCount).toBe('number');
      
      // Test operations
      await mockService.set('mock:test', { mock: true });
      const result = await mockService.get('mock:test');
      expect(result.mock).toBe(true);
      
      await mockService.disconnect();
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 15);
    });
  });

  describe('🔧 Configuration Validation', () => {
    test('Environment detection works', async () => {
      const start = performance.now();
      
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.VITEST).toBe('true');
      
      // Test environment should use mock service
      const service = getValkeyService();
      expect(service).toBeDefined();
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('Service factory handles missing env vars', async () => {
      const start = performance.now();
      
      // Should not throw even with missing env vars
      expect(() => createValkeyService()).not.toThrow();
      
      const service = createValkeyService();
      expect(service).toBeInstanceOf(ValkeyCacheService);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('Cache key generation handles edge cases', async () => {
      const start = performance.now();
      
      const edgeCases = [
        {},
        { null: null },
        { undefined: undefined },
        { empty: '' },
        { zero: 0 },
        { false: false },
        { array: [1, 2, 3] },
        { nested: { deep: { value: 'test' } } }
      ];
      
      edgeCases.forEach((params, index) => {
        const key = ValkeyCacheService.generateKey(`edge:${index}`, params);
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(10);
        expect(key).toMatch(/^edge:\d+:/);
      });
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });
  });

  describe('📊 Integration Validation', () => {
    test('QueryCache integrates with mock service', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      
      // Test marketplace-like data
      const marketplaceData = {
        allItems: [{
          id: 'test_item',
          name: 'Test Diamond Sword',
          category: 'weapons',
          location: { biome: 'jungle' },
          price: { diamonds: 25 }
        }],
        pagination: { currentPage: 1, totalPages: 1 },
        marketStats: { totalItems: 1, activeShops: 1 }
      };
      
      const cacheKey = 'integration:marketplace:test';
      await cache.set(cacheKey, marketplaceData);
      const retrieved = await cache.get(cacheKey);
      
      expect(retrieved.allItems).toHaveLength(1);
      expect(retrieved.allItems[0].name).toBe('Test Diamond Sword');
      expect(retrieved.pagination.currentPage).toBe(1);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });

    test('Multiple cache instances work independently', async () => {
      const start = performance.now();
      
      const cache1 = new ValkeyQueryCache();
      const cache2 = new ValkeyQueryCache();
      
      await cache1.set('instance:1', { cache: 1 });
      await cache2.set('instance:2', { cache: 2 });
      
      const result1 = await cache1.get('instance:1');
      const result2 = await cache2.get('instance:2');
      
      expect(result1.cache).toBe(1);
      expect(result2.cache).toBe(2);
      
      // Cross-instance access should work (same underlying service)
      const crossResult = await cache1.get('instance:2');
      expect(crossResult.cache).toBe(2);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 15);
    });
  });

  describe('🎯 Critical Business Logic', () => {
    test('Marketplace query caching works end-to-end', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      
      // Simulate marketplace query with filters
      const filters = { biome: 'jungle', category: 'weapons', page: 1 };
      const cacheKey = ValkeyCacheService.generateKey('marketplace:query', filters);
      
      const queryResult = {
        allItems: [
          { id: '1', name: 'Diamond Sword', biome: 'jungle', category: 'weapons' },
          { id: '2', name: 'Iron Sword', biome: 'jungle', category: 'weapons' }
        ],
        pagination: { currentPage: 1, totalPages: 3, itemsPerPage: 2 },
        marketStats: { totalItems: 5, activeShops: 2 }
      };
      
      // Cache the query result
      await cache.set(cacheKey, queryResult, 30000); // 30s TTL
      
      // Retrieve from cache (simulating cache hit)
      const cachedResult = await cache.get(cacheKey);
      
      expect(cachedResult.allItems).toHaveLength(2);
      expect(cachedResult.allItems[0].name).toBe('Diamond Sword');
      expect(cachedResult.pagination.totalPages).toBe(3);
      expect(cachedResult.marketStats.activeShops).toBe(2);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 15);
    });

    test('Cache performance improves response times', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      const testData = { large: 'data'.repeat(100), timestamp: Date.now() };
      
      // First call (cache miss simulation)
      const missStart = performance.now();
      await cache.set('perf:comparison', testData);
      const missTime = performance.now() - missStart;
      
      // Second call (cache hit)
      const hitStart = performance.now();
      const cachedData = await cache.get('perf:comparison');
      const hitTime = performance.now() - hitStart;
      
      expect(cachedData.large).toBe(testData.large);
      expect(hitTime).toBeLessThan(missTime); // Cache hit should be faster
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 20);
    });
  });
});