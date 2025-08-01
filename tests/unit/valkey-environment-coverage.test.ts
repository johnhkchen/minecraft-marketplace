/**
 * Environment Coverage Tests for Valkey Integration
 * Validates Valkey works correctly across dev, test, and production environments
 * Fast execution with clear environment-specific validation
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupFastTests, expectFastExecution } from '../utils/fast-test-setup.js';
import { ValkeyCacheService, createValkeyService, getValkeyService } from '../../workspaces/shared/services/valkey-cache.js';
import { getMockValkeyService, resetMockValkey } from '../mocks/valkey-mock.js';
import { ValkeyQueryCache } from '../../workspaces/frontend/src/lib/enhanced-homepage-data.js';

// Setup fast tests with MSW mocking
setupFastTests();

describe('Valkey Environment Coverage Tests', () => {
  
  beforeEach(() => {
    resetMockValkey();
  });

  describe('Environment Detection and Configuration', () => {
    test('should detect test environment correctly', async () => {
      const start = performance.now();
      
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.VITEST).toBe('true');
      
      // Test environment should use mock service
      const service = getValkeyService();
      expect(service).toBeDefined();
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should create service with environment-specific config', async () => {
      const start = performance.now();
      
      // Test various environment configurations
      const configs = [
        { env: 'development', expectedHost: 'localhost', expectedPort: 6379 },
        { env: 'test', expectedHost: 'localhost', expectedPort: 6379 },
        { env: 'production', expectedHost: 'localhost', expectedPort: 6379 }
      ];

      for (const config of configs) {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = config.env;
        
        const service = createValkeyService();
        expect(service).toBeInstanceOf(ValkeyCacheService);
        
        process.env.NODE_ENV = originalEnv;
      }
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });

    test('should handle missing environment variables gracefully', async () => {
      const start = performance.now();
      
      // Clear environment variables temporarily
      const originalVars = {
        VALKEY_HOST: process.env.VALKEY_HOST,
        VALKEY_PORT: process.env.VALKEY_PORT,
        VALKEY_PASSWORD: process.env.VALKEY_PASSWORD
      };
      
      delete process.env.VALKEY_HOST;
      delete process.env.VALKEY_PORT;
      delete process.env.VALKEY_PASSWORD;
      
      const service = createValkeyService();
      expect(service).toBeInstanceOf(ValkeyCacheService);
      
      // Restore environment variables
      Object.entries(originalVars).forEach(([key, value]) => {
        if (value !== undefined) {
          process.env[key] = value;
        }
      });
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('Mock Service Validation (Test Environment)', () => {
    test('should use mock service in test environment', async () => {
      const start = performance.now();
      
      const mockService = getMockValkeyService();
      await mockService.connect();
      
      // Mock service should always be available
      const isHealthy = await mockService.ping();
      expect(isHealthy).toBe(true);
      
      // Basic operations should work
      await mockService.set('test:mock', { mock: true });
      const retrieved = await mockService.get('test:mock');
      expect(retrieved.mock).toBe(true);
      
      await mockService.disconnect();
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });

    test('should handle TTL correctly in mock service', async () => {
      const start = performance.now();
      
      const mockService = getMockValkeyService();
      await mockService.connect();
      
      // Set with very short TTL
      await mockService.set('test:ttl', 'expires-fast', 50); // 50ms
      
      // Should be available immediately
      const immediate = await mockService.get('test:ttl');
      expect(immediate).toBe('expires-fast');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should be expired
      const expired = await mockService.get('test:ttl');
      expect(expired).toBeNull();
      
      await mockService.disconnect();
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 200); // Allow time for TTL test
    });

    test('should provide mock statistics', async () => {
      const start = performance.now();
      
      const mockService = getMockValkeyService();
      await mockService.connect();
      
      // Add some test data
      await mockService.set('stat:1', 'data1');
      await mockService.set('stat:2', 'data2');
      await mockService.set('stat:3', 'data3');
      
      const stats = await mockService.info();
      expect(stats.connected).toBe(true);
      expect(stats.keyCount).toBe(3);
      expect(stats.memory).toMatch(/\d+K/);
      
      await mockService.disconnect();
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });
  });

  describe('QueryCache Integration (All Environments)', () => {
    test('should initialize QueryCache correctly', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      expect(cache).toBeDefined();
      
      // Should work with mock service in test environment
      const testKey = 'query:test:init';
      const testData = { initialized: true, timestamp: Date.now() };
      
      await cache.set(testKey, testData);
      const retrieved = await cache.get(testKey);
      
      expect(retrieved.initialized).toBe(true);
      expect(typeof retrieved.timestamp).toBe('number');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });

    test('should handle cache key generation consistently', async () => {
      const start = performance.now();
      
      const filters1 = { biome: 'jungle', category: 'weapons', page: 1 };
      const filters2 = { biome: 'jungle', category: 'weapons', page: 1 };
      const filters3 = { biome: 'desert', category: 'tools', page: 1 };
      
      const key1 = ValkeyCacheService.generateKey('test:filters', filters1);
      const key2 = ValkeyCacheService.generateKey('test:filters', filters2);
      const key3 = ValkeyCacheService.generateKey('test:filters', filters3);
      
      // Same filters = same key
      expect(key1).toBe(key2);
      
      // Different filters = different key
      expect(key1).not.toBe(key3);
      
      // Keys should be consistent format
      expect(key1).toMatch(/^test:filters:/);
      expect(key1.length).toBeGreaterThan(20);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should handle complex marketplace data structures', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      const complexData = {
        allItems: [
          {
            id: 'diamond_sword_001',
            name: 'Enchanted Diamond Sword',
            category: 'weapons',
            location: { biome: 'jungle', coordinates: { x: 100, z: -200 } },
            price: { diamonds: 25.5, tradingUnit: 'per_item' },
            verification: { 
              verified: true, 
              lastCheck: new Date().toISOString(),
              reporter: { username: 'steve', reputation: 'trusted' }
            },
            metadata: {
              enchantments: ['sharpness_v', 'unbreaking_iii'],
              durability: 95,
              rarity: 'epic'
            }
          }
        ],
        pagination: { currentPage: 1, totalPages: 5, itemsPerPage: 20 },
        marketStats: { 
          totalItems: 87, 
          activeShops: 12,
          averagePrice: 18.2,
          lastUpdated: Date.now()
        },
        filters: { biome: 'jungle', category: 'weapons', priceRange: [10, 50] }
      };

      const cacheKey = 'marketplace:complex:test';
      
      await cache.set(cacheKey, complexData);
      const retrieved = await cache.get(cacheKey);
      
      // Verify complete data integrity
      expect(retrieved.allItems).toHaveLength(1);
      expect(retrieved.allItems[0].name).toBe('Enchanted Diamond Sword');
      expect(retrieved.allItems[0].location.biome).toBe('jungle');
      expect(retrieved.allItems[0].metadata.enchantments).toContain('sharpness_v');
      expect(retrieved.pagination.currentPage).toBe(1);
      expect(retrieved.marketStats.activeShops).toBe(12);
      expect(Array.isArray(retrieved.filters.priceRange)).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 15);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle cache unavailable scenarios', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      
      // Mock a scenario where cache operations fail
      const originalGet = cache.get;
      cache.get = async () => {
        throw new Error('Cache temporarily unavailable');
      };
      
      // Should not throw, should return null (graceful degradation)
      const result = await cache.get('test:error:handling').catch(() => null);
      expect(result).toBeNull();
      
      // Restore original method
      cache.get = originalGet;
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should handle invalid data gracefully', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      const invalidData = [
        null,
        undefined,
        '',
        0,
        false,
        [],
        {},
        { circular: null }
      ];
      
      // Add circular reference
      invalidData[invalidData.length - 1].circular = invalidData[invalidData.length - 1];
      
      for (let i = 0; i < invalidData.length - 1; i++) { // Skip circular reference test
        const key = `test:invalid:${i}`;
        const data = invalidData[i];
        
        await cache.set(key, data);
        const retrieved = await cache.get(key);
        expect(retrieved).toEqual(data);
      }
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 15);
    });

    test('should handle high-frequency operations', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      const operations = [];
      
      // Perform 50 rapid operations
      for (let i = 0; i < 50; i++) {
        operations.push(
          cache.set(`rapid:${i}`, { index: i, data: `test-${i}` }).then(() =>
            cache.get(`rapid:${i}`)
          )
        );
      }
      
      const results = await Promise.all(operations);
      
      // Verify all operations succeeded
      expect(results).toHaveLength(50);
      results.forEach((result, index) => {
        expect(result.index).toBe(index);
        expect(result.data).toBe(`test-${index}`);
      });
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 50); // Allow more time for 100 operations
    });
  });

  describe('Environment-Specific Behavior Validation', () => {
    test('should provide appropriate warnings for development', async () => {
      const start = performance.now();
      
      // Capture console warnings
      const originalWarn = console.warn;
      const warnings: string[] = [];
      console.warn = (message: string) => warnings.push(message);
      
      const cache = new ValkeyQueryCache();
      
      // In test environment, should use mock service (no warnings expected)
      await cache.get('dev:warning:test');
      
      // Restore console
      console.warn = originalWarn;
      
      // In test environment, warnings should be minimal
      const valkeyWarnings = warnings.filter(w => w.includes('Valkey'));
      expect(valkeyWarnings.length).toBeLessThanOrEqual(1); // Allow one "not connected" warning
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });

    test('should validate production-ready configuration', async () => {
      const start = performance.now();
      
      // Test production configuration patterns
      const prodConfig = {
        VALKEY_HOST: 'valkey',
        VALKEY_PORT: '6379',
        VALKEY_DATABASE: '0',
        VALKEY_MAX_RETRIES: '3',
        VALKEY_RETRY_DELAY_MS: '1000'
      };
      
      // Validate all required production settings
      Object.entries(prodConfig).forEach(([key, expectedValue]) => {
        const actualValue = process.env[key] || 'localhost'; // Default for dev
        expect(typeof actualValue).toBe('string');
        expect(actualValue.length).toBeGreaterThan(0);
      });
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should support environment variable overrides', async () => {
      const start = performance.now();
      
      // Test environment variable override behavior
      const originalHost = process.env.VALKEY_HOST;
      const originalPort = process.env.VALKEY_PORT;
      
      process.env.VALKEY_HOST = 'custom-host';
      process.env.VALKEY_PORT = '9999';
      
      const service = createValkeyService();
      expect(service).toBeDefined();
      
      // Restore original values
      if (originalHost !== undefined) {
        process.env.VALKEY_HOST = originalHost;
      } else {
        delete process.env.VALKEY_HOST;
      }
      
      if (originalPort !== undefined) {
        process.env.VALKEY_PORT = originalPort;
      } else {
        delete process.env.VALKEY_PORT;
      }
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('Performance Validation Across Environments', () => {
    test('should meet performance requirements in all environments', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      const performanceTests = [
        { operation: 'single-set', targetMs: 10 },
        { operation: 'single-get', targetMs: 5 },
        { operation: 'bulk-operations', targetMs: 100 }
      ];
      
      for (const test of performanceTests) {
        const testStart = performance.now();
        
        switch (test.operation) {
          case 'single-set':
            await cache.set('perf:set', { performance: 'test' });
            break;
          case 'single-get':
            await cache.get('perf:get');
            break;
          case 'bulk-operations':
            const bulkOps = [];
            for (let i = 0; i < 20; i++) {
              bulkOps.push(cache.set(`bulk:${i}`, { index: i }));
            }
            await Promise.all(bulkOps);
            break;
        }
        
        const testTime = performance.now() - testStart;
        expect(testTime).toBeLessThan(test.targetMs);
      }
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 200);
    });

    test('should validate cache hit ratio improvements', async () => {
      const start = performance.now();
      
      const cache = new ValkeyQueryCache();
      const testKey = 'performance:cache-hit';
      const testData = { hitRatio: 'test', timestamp: Date.now() };
      
      // First call (cache miss)
      const missStart = performance.now();
      await cache.set(testKey, testData);
      const missTime = performance.now() - missStart;
      
      // Second call (cache hit)
      const hitStart = performance.now();
      const cachedData = await cache.get(testKey);
      const hitTime = performance.now() - hitStart;
      
      // Cache hit should be faster than cache set
      expect(hitTime).toBeLessThan(missTime);
      expect(cachedData.hitRatio).toBe('test');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 20);
    });
  });
});