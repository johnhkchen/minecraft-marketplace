/**
 * Valkey Integration Tests
 * Tests real Valkey connection and caching functionality
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ValkeyCacheService, createValkeyService } from '../../workspaces/shared/services/valkey-cache.js';

describe('Valkey Integration Tests', () => {
  let valkeyService: ValkeyCacheService;
  
  beforeAll(async () => {
    // Create service with test configuration
    valkeyService = new ValkeyCacheService({
      host: process.env.VALKEY_HOST || 'localhost',
      port: parseInt(process.env.VALKEY_PORT || '6379', 10),
      database: parseInt(process.env.VALKEY_TEST_DATABASE || '1', 10), // Use test database
      maxRetries: 3,
      retryDelayMs: 500
    });

    try {
      await valkeyService.connect();
      console.log('✅ Connected to Valkey for integration tests');
    } catch (error) {
      console.error('❌ Failed to connect to Valkey:', error);
      console.log('💡 Make sure Valkey is running: docker compose up valkey -d');
      throw error;
    }
  }, 30000); // Allow 30s for connection

  afterAll(async () => {
    if (valkeyService) {
      await valkeyService.clear(); // Clean up test data
      await valkeyService.disconnect();
    }
  });

  beforeEach(async () => {
    // Clean slate for each test
    await valkeyService.clear();
  });

  describe('Connection and Health', () => {
    test('should connect to Valkey successfully', async () => {
      const isHealthy = await valkeyService.ping();
      expect(isHealthy).toBe(true);
    });

    test('should provide connection statistics', async () => {
      const stats = await valkeyService.info();
      
      expect(stats.connected).toBe(true);
      expect(typeof stats.keyCount).toBe('number');
      expect(typeof stats.memory).toBe('string');
      
      console.log('📊 Valkey Stats:', stats);
    });
  });

  describe('Basic Cache Operations', () => {
    test('should set and get cached values', async () => {
      const key = 'test:basic';
      const value = { message: 'Hello Valkey!', timestamp: Date.now() };

      // Set value
      await valkeyService.set(key, value, 5000); // 5 second TTL

      // Get value
      const retrieved = await valkeyService.get(key);
      
      expect(retrieved).toEqual(value);
      expect(retrieved.message).toBe('Hello Valkey!');
    });

    test('should handle TTL expiration', async () => {
      const key = 'test:ttl';
      const value = 'expires soon';

      // Set with very short TTL
      await valkeyService.set(key, value, 100); // 100ms TTL

      // Should be available immediately
      const immediate = await valkeyService.get(key);
      expect(immediate).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      const expired = await valkeyService.get(key);
      expect(expired).toBeNull();
    });

    test('should delete cached values', async () => {
      const key = 'test:delete';
      const value = 'will be deleted';

      await valkeyService.set(key, value);
      
      // Verify it exists
      const exists = await valkeyService.get(key);
      expect(exists).toBe(value);

      // Delete it
      await valkeyService.del(key);

      // Verify it's gone
      const deleted = await valkeyService.get(key);
      expect(deleted).toBeNull();
    });

    test('should handle complex objects', async () => {
      const key = 'test:complex';
      const complexObject = {
        user: {
          id: 'steve',
          profile: {
            username: 'steve',
            shopName: 'Diamond District',
            permissions: ['EDIT_OWN_LISTINGS', 'SUBMIT_PRICE_DATA']
          }
        },
        items: [
          { id: '1', name: 'Diamond Sword', price: 25.5 },
          { id: '2', name: 'Iron Pickaxe', price: 10.0 }
        ],
        metadata: {
          cached: true,
          timestamp: Date.now()
        }
      };

      await valkeyService.set(key, complexObject);
      const retrieved = await valkeyService.get(key);

      expect(retrieved).toEqual(complexObject);
      expect(retrieved.user.profile.shopName).toBe('Diamond District');
      expect(retrieved.items).toHaveLength(2);
      expect(retrieved.metadata.cached).toBe(true);
    });
  });

  describe('Performance Testing', () => {
    test('should handle rapid sequential operations', async () => {
      const operations = [];
      const startTime = Date.now();

      // Perform 50 rapid set/get operations
      for (let i = 0; i < 50; i++) {
        const key = `test:perf:${i}`;
        const value = { index: i, data: `test data ${i}` };
        
        operations.push(
          valkeyService.set(key, value).then(() => 
            valkeyService.get(key)
          )
        );
      }

      const results = await Promise.all(operations);
      const duration = Date.now() - startTime;

      console.log(`⚡ Completed 100 operations in ${duration}ms (${duration / 100}ms avg)`);

      // All operations should succeed
      expect(results).toHaveLength(50);
      results.forEach((result, index) => {
        expect(result.index).toBe(index);
        expect(result.data).toBe(`test data ${index}`);
      });

      // Should be reasonably fast
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 operations
    });

    test('should handle concurrent operations', async () => {
      const concurrentOps = 20;
      const operations = [];

      // Launch concurrent operations
      for (let i = 0; i < concurrentOps; i++) {
        operations.push(
          valkeyService.set(`concurrent:${i}`, { id: i, timestamp: Date.now() })
        );
      }

      // Wait for all to complete
      await Promise.all(operations);

      // Verify all were set correctly
      const retrieveOps = [];
      for (let i = 0; i < concurrentOps; i++) {
        retrieveOps.push(valkeyService.get(`concurrent:${i}`));
      }

      const results = await Promise.all(retrieveOps);
      
      results.forEach((result, index) => {
        expect(result.id).toBe(index);
        expect(typeof result.timestamp).toBe('number');
      });
    });
  });

  describe('Key Generation and Patterns', () => {
    test('should generate consistent cache keys', async () => {
      const filters1 = { biome: 'jungle', page: 1, itemsPerPage: 10 };
      const filters2 = { biome: 'jungle', page: 1, itemsPerPage: 10 };
      const filters3 = { biome: 'desert', page: 1, itemsPerPage: 10 };

      const key1 = ValkeyCacheService.generateKey('marketplace:query', filters1);
      const key2 = ValkeyCacheService.generateKey('marketplace:query', filters2);
      const key3 = ValkeyCacheService.generateKey('marketplace:query', filters3);

      // Same filters should generate same key
      expect(key1).toBe(key2);
      
      // Different filters should generate different keys
      expect(key1).not.toBe(key3);

      // Keys should be valid cache keys
      expect(key1).toMatch(/^marketplace:query:/);
      expect(key1.length).toBeGreaterThan(20);
    });

    test('should handle marketplace-specific key patterns', async () => {
      const testData = {
        allItems: [
          { id: '1', name: 'Diamond Sword', biome: 'jungle' },
          { id: '2', name: 'Iron Pickaxe', biome: 'jungle' }
        ],
        pagination: { currentPage: 1, totalPages: 5 },
        marketStats: { totalItems: 100, activeShops: 7 }
      };

      const key = ValkeyCacheService.generateKey('marketplace:homepage', {
        filters: { biome: 'jungle' },
        page: 1,
        itemsPerPage: 20
      });

      await valkeyService.set(key, testData, 30000);
      const retrieved = await valkeyService.get(key);

      expect(retrieved.allItems).toHaveLength(2);
      expect(retrieved.pagination.currentPage).toBe(1);
      expect(retrieved.marketStats.activeShops).toBe(7);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle non-existent keys gracefully', async () => {
      const nonExistentKey = 'test:does-not-exist:' + Date.now();
      
      const result = await valkeyService.get(nonExistentKey);
      expect(result).toBeNull();
      
      // Should not throw errors
      await expect(valkeyService.del(nonExistentKey)).resolves.not.toThrow();
    });

    test('should handle malformed data gracefully', async () => {
      // This test would be difficult with the current JSON approach
      // but verifies that our caching strategy is robust
      
      const key = 'test:edge-cases';
      const edgeCases = [
        null,
        undefined,
        '',
        0,
        false,
        [],
        {},
        { nested: { deeply: { nested: { value: 'deep' } } } }
      ];

      for (let i = 0; i < edgeCases.length; i++) {
        const testKey = `${key}:${i}`;
        const value = edgeCases[i];
        
        await valkeyService.set(testKey, value);
        const retrieved = await valkeyService.get(testKey);
        
        expect(retrieved).toEqual(value);
      }
    });
  });

  describe('Marketplace Query Cache Integration', () => {
    test('should cache marketplace query results effectively', async () => {
      // Simulate marketplace query caching
      const filters = { biome: 'jungle', category: 'weapons' };
      const queryResult = {
        allItems: [
          {
            id: '1',
            name: 'Diamond Sword',
            category: 'weapons',
            location: { biome: 'jungle', direction: 'north' },
            price: 25.5,
            verification: { lastVerified: new Date().toISOString() }
          }
        ],
        pagination: { currentPage: 1, totalPages: 1 },
        marketStats: { totalItems: 1, activeShops: 1 }
      };

      const cacheKey = ValkeyCacheService.generateKey('marketplace:query', {
        filters,
        page: 1,
        itemsPerPage: 20
      });

      // Cache the query result
      const cacheStart = Date.now();
      await valkeyService.set(cacheKey, queryResult, 30000);
      const cacheTime = Date.now() - cacheStart;

      // Retrieve from cache
      const retrieveStart = Date.now();
      const cachedResult = await valkeyService.get(cacheKey);
      const retrieveTime = Date.now() - retrieveStart;

      console.log(`💾 Cache set: ${cacheTime}ms, retrieve: ${retrieveTime}ms`);

      // Verify data integrity
      expect(cachedResult.allItems).toHaveLength(1);
      expect(cachedResult.allItems[0].name).toBe('Diamond Sword');
      expect(cachedResult.allItems[0].location.biome).toBe('jungle');
      
      // Cache operations should be fast
      expect(cacheTime).toBeLessThan(100); // <100ms to cache
      expect(retrieveTime).toBeLessThan(50); // <50ms to retrieve
    });
  });
});